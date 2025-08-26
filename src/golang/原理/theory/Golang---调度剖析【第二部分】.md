---
title: Golang - 调度剖析【第二部分】
source_url: 'https://studygolang.com/articles/15316'
category: Go原理教程
---


						<h2 id="-">前奏</h2>
<p>这篇文章是三部曲系列文章中的第二篇，这个系列的文章将会对 Go 中调度器背后的机制和语义做深入的了解。本文主要关注 Go 调度器的部分。</p>
<p>Go 调度器系列文章：</p>
<ul>
<li><a href="https://studygolang.com/articles/14264">Go 中的调度器：第一部分 - 操作系统调度器</a></li>
<li><a href="https://studygolang.com/articles/15316">Go 中的调度器：第二部分 - Go 调度器</a></li>
<li><a href="https://studygolang.com/articles/17014">Go 中的调度器：第三部分 - 并发</a></li>
</ul>

<blockquote>回顾本系列的<a href="/articles/14264">第一部分</a>，重点讲述了操作系统调度器的各个方面，这些知识对于理解和分析 Go 调度器的语义是非常重要的。<br/>在本文中，我将从语义层面解析 Go 调度器是如何工作的，并重点介绍其高级特性。<br/>Go 调度器是一个非常复杂的系统，我们不会过分关注一些细节，而是侧重于剖析它的设计模型和工作方式。<br/>我们通过学习它的优点以便够做出更好的工程决策。</blockquote>
<h2>开始</h2>
<p><strong>当 Go 程序启动时，它会为主机上标识的每个虚拟核心提供一个逻辑处理器（P）</strong>。如果处理器每个物理核心可以提供多个硬件线程（超线程），那么每个硬件线程都将作为虚拟核心呈现给 Go 程序。为了更好地理解这一点，下面实验都基于如下配置的 MacBook Pro 的系统。</p>
<p><span class="img-wrap"><img src="https://www.ardanlabs.com/images/goinggo/94_figure1.png" alt="图片描述" title="图片描述"/></span></p>
<p>可以看到它是一个 4 核 8 线程的处理器。这将告诉 Go 程序有 8 个虚拟核心可用于并行执行系统线程。</p>
<p>用下面的程序来验证一下:</p>
<pre><code class="go">package main

import (
    "fmt"
    "runtime"
)

func main() {

    // NumCPU 返回当前可用的逻辑处理核心的数量
    fmt.Println(runtime.NumCPU())
}</code></pre>
<p>当我运行该程序时，<code>NumCPU()</code> 函数调用的结果将是 <code>8</code> 。意味着在我的机器上运行的任何 Go 程序都将被赋予 8 个 <strong><code>P</code></strong>。</p>
<p><strong>每个 <code>P</code> 都被分配一个系统线程 <code>M</code> </strong> 。M 代表机器（machine），它仍然是由操作系统管理的，操作系统负责将线程放在一个核心上执行。这意味着当在我的机器上运行 Go 程序时，有 8 个线程可以执行我的工作，每个线程单独连接到一个 P。</p>
<p><strong>每个 Go 程序都有一个初始 <code>G</code></strong>。G 代表 Go 协程（Goroutine），它是 Go 程序的执行路径。Goroutine 本质上是一个 <a href="https://en.wikipedia.org/wiki/Coroutine" rel="nofollow noreferrer">Coroutine</a>，但因为是 Go 语言，所以把字母 “C” 换成了 “G”，我们得到了这个词。你可以将 Goroutines 看作是应用程序级别的线程，它在许多方面与系统线程都相似。正如系统线程在物理核心上进行上下文切换一样，Goroutines 在 <strong><code>M</code></strong> 上进行上下文切换。</p>
<p>最后一个重点是运行队列。Go 调度器中有两个不同的运行队列：<code>全局运行队列(GRQ)</code>和<code>本地运行队列(LRQ)</code>。<strong>每个 <code>P</code> 都有一个LRQ</strong>，用于管理分配给在<strong><code>P</code></strong>的上下文中执行的 Goroutines，这些 Goroutine 轮流被<strong><em>和<code>P</code>绑定的<code>M</code></em></strong>进行上下文切换。GRQ 适用于尚未分配给<strong><code>P</code></strong>的 Goroutines。其中有一个过程是将 Goroutines 从 GRQ 转移到 LRQ，我们将在稍后讨论。</p>
<p>下面图示展示了它们之间的关系：</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQvV?w=1620&h=758" src="https://image-static.segmentfault.com/387/876/3878766691-5bbad077a07bf_articlex" alt="图片描述" title="图片描述"/></span></p>
<h2>协作式调度器</h2>
<p>正如我们在第一篇文章中所讨论的，OS 调度器是一个抢占式调度器。从本质上看，这意味着你无法预测调度程序在任何给定时间将执行的操作。由内核做决定，一切都是不确定的。在操作系统之上运行的应用程序无法通过调度控制内核内部发生的事情，除非它们利用像 <a href="https://en.wikipedia.org/wiki/Linearizability" rel="nofollow noreferrer">atomic</a> 指令 和 <a href="https://en.wikipedia.org/wiki/Lock_%28computer_science%29" rel="nofollow noreferrer">mutex</a> 调用之类的同步原语。</p>
<p>Go 调度器是 Go 运行时的一部分，Go 运行时内置在应用程序中。这意味着 Go 调度器在内核之上的用户空间中运行。Go 调度器的当前实现不是抢占式调度器，而是协作式调度器。作为一个协作的调度器，意味着调度器需要明确定义用户空间事件，这些事件发生在代码中的安全点，以做出调度决策。</p>
<p>Go 协作式调度器的优点在于它看起来和感觉上都是抢占式的。你无法预测 Go 调度器将会执行的操作。这是因为这个协作调度器的决策不掌握在开发人员手中，而是在 Go 运行时。将 Go 调度器视为抢占式调度器是非常重要的，并且由于调度程序是非确定性的，因此这并不是一件容易的事。</p>
<h2>Goroutine 状态</h2>
<p>就像线程一样，Goroutines 有相同的三个高级状态。它们标识了 Go 调度器在任何给定的 Goroutine 中所起的作用。Goroutine 可以处于三种状态之一：<strong><code>Waiting</code>（等待状态）</strong>、<strong><code>Runnable</code>（可运行状态）</strong>或<strong><code>Executing</code>（运行中状态）</strong>。</p>
<p><strong><code>Waiting</code>：</strong>这意味着 Goroutine 已停止并等待一些事情以继续。这可能是因为等待操作系统（系统调用）或同步调用（原子和互斥操作）等原因。这些类型的延迟是性能下降的根本原因。</p>
<p><strong><code>Runnable </code>：</strong>这意味着 Goroutine 需要<strong><code>M</code></strong>上的时间片，来执行它的指令。如果同一时间有很多 Goroutines 在竞争时间片，它们都必须等待更长时间才能得到时间片，而且每个 Goroutine 获得的时间片都缩短了。这种类型的调度延迟也可能导致性能下降。</p>
<p><strong><code>Executing </code>：</strong>这意味着 Goroutine 已经被放置在<strong><code>M</code></strong>上并且正在��行它的指令。与应用程序相关的工作正在完成。这是每个人都想要的。</p>
<h2>上下文切换</h2>
<p>Go 调度器需要有明确定义的用户空间事件，这些事件发生在要切换上下文的代码中的安全点上。这些事件和安全点在函数调用中表现出来。函数调用对于 Go 调度器的运行状况是至关重要的。现在（使用 Go 1.11或更低版本），如果你运行任何未进行函数调用的<a href="https://en.wiktionary.org/wiki/tight_loop" rel="nofollow noreferrer">紧凑循环</a>，你会导致调度器和垃圾回收有延迟。让函数调用在合理的时间范围内发生是至关重要的。</p>
<p><em>注意：在 Go 1.12 版本中有一个提议被接受了，它可以使 Go 调度器使用非协作抢占技术，以允许抢占紧密循环。</em></p>
<p>在 Go 程序中有四类事件，它们允许调度器做出调度决策：</p>
<ul>
<li>使用关键字 <code>go</code>
</li>
<li>垃圾回收</li>
<li>系统调用</li>
<li>同步和<a href="https://zh.wikipedia.org/zh-hans/%E7%BC%96%E9%85%8D_%28%E8%AE%A1%E7%AE%97%E6%9C%BA%29" rel="nofollow noreferrer">编配</a>
</li>
</ul>
<h3>使用关键字 <code>go</code>
</h3>
<p>关键字 <code>go</code> 是用来创建 Goroutines 的。一旦创建了新的 Goroutine，它就为调度器做出调度决策提供了机会。</p>
<h3>垃圾回收</h3>
<p>由于 GC 使用自己的 Goroutine 运行，所以这些 Goroutine 需要在 M 上运行的时间片。这会导致 GC 产生大量的调度混乱。但是，调度程序非常聪明地了解 Goroutine 正在做什么，它将智能地做出一些决策。</p>
<h3>系统调用</h3>
<p>如果 Goroutine 进行系统调用，那么会导致这个 Goroutine 阻塞当前<strong><code>M</code></strong>，有时调度器能够将 Goroutine 从<strong><code>M</code></strong>换出并将新的 Goroutine 换入。然而，有时需要新的<strong><code>M</code></strong>继续执行在<strong><code>P</code></strong>中排队的 Goroutines。这是如何工作的将在下一节中更详细地解释。</p>
<h3>同步和编配</h3>
<p>如果原子、互斥量或通道操作调用将导致 Goroutine 阻塞，调度器可以将之切换到一个新的 Goroutine 去运行。一旦 Goroutine 可以再次运行，它就可以重新排队，并最终在<strong><code>M</code></strong>上切换回来。</p>
<h2>异步系统调用</h2>
<p>当你的操作系统能够异步处理系统调用时，可以使用称为网络轮询器的东西来更有效地处理系统调用。这是通过在这些操作系统中使用 kqueue（MacOS），epoll（Linux）或 iocp（Windows）来实现的。</p>
<p>基于网络的系统调用可以由我们今天使用的许多操作系统异步处理。这就是为什么我管它叫网络轮询器，因为它的主要用途是处理网络操作。通过使用网络轮询器进行网络系统调用，调度器可以防止 Goroutine 在进行这些系统调用时阻塞<strong><code>M</code></strong>。这可以让<strong><code>M</code></strong>执行<strong><code>P</code></strong>的 LRQ 中其他的 Goroutines，而不需要创建新的<strong><code>M</code></strong>。有助于减少操作系统上的调度负载。</p>
<p>下图展示它的工作原理：<strong><code>G1</code></strong>正在<strong><code>M</code></strong>上执行，还有 3 个 Goroutine 在 LRQ 上等待执行。网络轮询器空闲着，什么都没干。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQOl?w=1700&h=890" src="https://image-static.segmentfault.com/369/348/3693488851-5bbaeff434cb9_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>接下来，情况发生了变化：<strong><code>G1</code></strong>想要进行网络系统调用，因此它被移动到网络轮询器并且处理异步网络系统调用。然后，<strong><code>M</code></strong>可以从 LRQ 执行另外的 Goroutine。此时，<strong><code>G2</code></strong>就被上下文切换到<strong><code>M</code></strong>上了。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQOK?w=1700&h=898" src="https://image-static.segmentfault.com/229/032/2290324679-5bbaf0b004a8e_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>最后：异步网络系统调用由网络轮询器完成，<strong><code>G1</code></strong>被移回到<strong><code>P</code></strong>的 LRQ 中。一旦<strong><code>G1</code></strong>可以在<strong><code>M</code></strong>上进行上下文切换，它负责的 Go 相关代码就可以再次执行。这里的最大优势是，执行网络系统调用不需要额外的<strong><code>M</code></strong>。网络轮询器使用系统线程，它时刻处理一个有效的事件循环。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQPs?w=1700&h=902" src="https://image-static.segmentfault.com/246/466/2464662060-5bbaf1917ed01_articlex" alt="图片描述" title="图片描述"/></span></p>
<h2>同步系统调用</h2>
<p>如果 Goroutine 要执行同步的系统调用，会发生什么？在这种情况下，网络轮询器无法使用，而进行系统调用的 Goroutine 将阻塞当前<strong><code>M</code></strong>。这是不幸的，但是没有办法防止这种情况发生。需要同步进行的系统调用的一个例子是基于文件的系统调用。如果你正在使用 CGO，则可能还有其他情况，调用 C 函数也会阻塞<strong><code>M</code></strong>。</p>
<p><em>注意：Windows 操作系统确实能够异步进行基于文件的系统调用。从技术上讲，在 Windows 上运行时，可以使用网络轮询器。</em></p>
<p>让我们来看看同步系统调用（如文件I/O）会导致<strong><code>M</code></strong>阻塞的情况：<strong><code>G1</code></strong>将进行同步系统调用以阻塞<strong><code>M1</code></strong>。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQWw?w=1322&h=784" src="https://image-static.segmentfault.com/155/261/155261032-5bbaf77541a66_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>调度器介入后：识别出<strong><code>G1</code></strong>已导致<strong><code>M1</code></strong>阻塞，此时，调度器将<strong><code>M1</code></strong>与<strong><code>P</code></strong>分离，同时也将<strong><code>G1</code></strong>带走。然后调度器引入新的<strong><code>M2</code></strong>来服务<strong><code>P</code></strong>。此时，可以从 LRQ 中选择<strong><code>G2</code></strong>并在<strong><code>M2</code></strong>上进行上下文切换。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQX7?w=1666&h=784" src="https://image-static.segmentfault.com/791/296/791296330-5bbaf8f5b6e2d_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>阻塞的系统调用完成后：<strong><code>G1</code></strong>可以移回 LRQ 并再次由<strong><code>P</code></strong>执行。如果这种情况需要再次发生，M1将被放在旁边以备将来使用。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQZA?w=1680&h=792" src="https://image-static.segmentfault.com/417/192/4171923125-5bbafa3ceda0a_articlex" alt="图片描述" title="图片描述"/></span></p>
<h2>任务窃取（负载均衡思想）</h2>
<p>调度器的另一个方面是它是一个任务窃取的调度器。这有助于在一些领域保持高效率的调度。首先，你最不希望的事情是<strong><code>M</code></strong>进入等待状态，因为一旦发生这种情况，操作系统就会将<strong><code>M</code></strong>从内核切换出去。这意味着<strong><code>P</code></strong>无法完成任何工作，即使有 Goroutine 处于可运行状态也不行，直到一个<strong><code>M</code></strong>被上下文切换回核心。任务窃取还有助于平衡所有<strong><code>P</code></strong>的 Goroutines 数量，这样工作就能更好地分配和更有效地完成。</p>
<p>看下面的一个例子：这是一个多线程的 Go 程序，其中有两个<strong><code>P</code></strong>，每个<strong><code>P</code></strong>都服务着四个 Goroutine，另在 GRQ 中还有一个单独的 Goroutine。如果其中一个<strong><code>P</code></strong>的所有 Goroutines 很快就执行完了会发生什么？</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQ1g?w=1720&h=844" src="https://image-static.segmentfault.com/168/075/1680757827-5bbafc553f6e1_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>如你所见：<strong><code>P1</code></strong>的 Goroutines 都执行完了。但是还有 Goroutines 处于可运行状态，在 GRQ 中有，在<strong><code>P2</code></strong>的 LRQ 中也有。<br/>这时<strong><code>P1</code></strong>就需要窃取任务。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQ3S?w=1646&h=844" src="https://image-static.segmentfault.com/428/412/4284129103-5bbafe71eba48_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>窃取的规则在这里定义了：<a href="https://golang.org/src/runtime/proc.go" rel="nofollow noreferrer">https://golang.org/src/runtim...</a></p>
<pre><code class="go">if gp == nil {
        // 1/61的概率检查一下全局可运行队列，以确保公平。否则，两个 goroutine 就可以通过不断地相互替换来完全占据本地运行队列。
        if _g_.m.p.ptr().schedtick%61 == 0 && sched.runqsize > 0 {
            lock(&sched.lock)
            gp = globrunqget(_g_.m.p.ptr(), 1)
            unlock(&sched.lock)
        }
    }
    if gp == nil {
        gp, inheritTime = runqget(_g_.m.p.ptr())
        if gp != nil && _g_.m.spinning {
            throw("schedule: spinning with local work")
        }
    }
    if gp == nil {
        gp, inheritTime = findrunnable()
    }</code></pre>
<p>根据规则，<strong><code>P1</code></strong>将窃取<strong><code>P2</code></strong>中一半的 Goroutines，窃取完成后的样子如下：</p>
<p><span class="img-wrap"><img data-src="/img/bVbhQ96?w=1702&h=844" src="https://image-static.segmentfault.com/155/556/1555569606-5bbb037672387_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>我们再来看一种情况，如果<strong><code>P2</code></strong>完成了对所有 Goroutine 的服务，而<strong><code>P1</code></strong>的 LRQ 也什么都没有，会发生什么?</p>
<p><span class="img-wrap"><img data-src="/img/bVbhRaR?w=1716&h=786" src="https://image-static.segmentfault.com/216/222/2162223373-5bbb0410940b9_articlex" alt="图片描述" title="图片描述"/></span></p>
<p><strong><code>P2</code></strong>完成了所有任务，现在需要窃取一些。首先，它将查看<strong><code>P1</code></strong>的 LRQ，但找不到任何 Goroutines。接下来，它将查看 GRQ。<br/>在那里它会找到<strong><code>G9</code></strong>，<strong><code>P2</code></strong>从 GRQ 手中抢走了<strong><code>G9</code></strong>并开始执行。以上任务窃取的好处在于它使<strong><code>M</code></strong>不会闲着。在窃取任务时，<strong><code>M</code></strong>是自旋的。这种自旋还有其他的好处，可以参考 <a href="https://rakyll.org/scheduler/" rel="nofollow noreferrer">work-stealing</a> 。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhRbn?w=1720&h=782" src="https://image-static.segmentfault.com/383/593/3835937457-5bbb046186b6b_articlex" alt="图片描述" title="图片描述"/></span></p>
<h2>实例</h2>
<p>有了相应的机制和语义，我将向你展示如何将所有这些结合在一起，以便 Go 调度程序能够执行更多的工作。设想一个用 C 编写的多线程应用程序，其中程序管理两个操作系统线程，这两个线程相互传递消息。</p>
<p>下面有两个线程，线程 <code>T1</code> 在内核 <code>C1</code> 上进行上下文切换，并且正在运行中，这允许 <code>T1</code> 将其消息发送到 <code>T2</code>。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhRnY?w=920&h=850" src="https://image-static.segmentfault.com/304/733/3047337580-5bbb0e4f750c3_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>当 <code>T1</code> 发送完消息，它需要等待响应。这将导致 <code>T1</code> 从 <code>C1</code> 上下文换出并进入等待状态。<br/>当 <code>T2</code> 收到有关该消息的通知，它就会进入可运行状态。<br/>现在操作系统可以执行上下文切换并让 <code>T2</code> 在一个核心上执行，而这个核心恰好是 <code>C2</code>。接下来，<code>T2</code> 处理消息并将新消息发送回 <code>T1</code>。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhRpQ?w=966&h=852" src="https://image-static.segmentfault.com/143/999/1439992232-5bbb0fb9ba059_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>然后，<code>T2</code> 的消息被 <code>T1</code> 接收，线程上下文切换再次发生。现在，<code>T2</code> 从运行中状态切换到等待状态，<code>T1</code> 从等待状态切换到可运行状态，再被执行变为运行中状态，这允许它处理并发回新消息。</p>
<p>所有这些上下文切换和状态更改都需要时间来执行，这限制了工作的完成速度。<br/>由于每个上下文切换可能会产生 50 纳秒的延迟，并且理想情况下硬件每纳秒执行 12 条指令，因此你会看到有差不多 600 条指令，在上下文切换期间被停滞掉了。并且由于这些线程也在不同的内核之间跳跃，因 <a href="https://en.wikipedia.org/wiki/CPU_cache" rel="nofollow noreferrer">cache-line</a> 未命中引起额外延迟的可能性也很高。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhRqP?w=968&h=842" src="https://image-static.segmentfault.com/307/767/3077677785-5bbb107161ad8_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>下面我们还用这个例子，来看看 Goroutine 和 Go 调度器是怎么工作的：<br/>有两个goroutine，它们彼此协调，来回传递消息。<strong><code>G1</code></strong>在<strong><code>M1</code></strong>上进行上下文切换，而<strong><code>M1</code></strong>恰好运行在<strong><code>C1</code></strong>上，这允许<strong><code>G1</code></strong>执行它的工作。即向<strong><code>G2</code></strong>发送消息。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhRuh?w=922&h=842" src="https://image-static.segmentfault.com/418/765/4187651790-5bbb12b3500cf_articlex" alt="图片描述" title="图片描述"/></span></p>
<p><strong><code>G1</code></strong>发送完消息后，需要等待响应。<strong><code>M1</code></strong>就会把<strong><code>G1</code></strong>换出并使之进入等待状态。一旦<strong><code>G2</code></strong>得到消息，它就进入可运行状态。现在 Go 调度器可以执行上下文切换，让<strong><code>G2</code></strong>在<strong><code>M1</code></strong>上执行，<strong><code>M1</code></strong>仍然在<strong><code>C1</code></strong>上运行。接下来，<strong><code>G2</code></strong>处理消息并将新消息发送回<strong><code>G1</code></strong>。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhRvw?w=930&h=838" src="https://image-static.segmentfault.com/376/363/3763636375-5bbb1367daea4_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>当<strong><code>G2</code></strong>发送的消息被<strong><code>G1</code></strong>接收时，上下文切换再次发生。现在<strong><code>G2</code></strong>从运行中状态切换到等待状态，<strong><code>G1</code></strong>从等待状态切换到可运行状态，最后返回到执行状态，这允许它处理和发送一个新的消息。</p>
<p><span class="img-wrap"><img data-src="/img/bVbhRwd?w=958&h=840" src="https://image-static.segmentfault.com/109/251/1092513198-5bbb13e90708b_articlex" alt="图片描述" title="图片描述"/></span></p>
<p>表面上看起来没有什么不同。无论使用线程还是 Goroutine，都会发生相同的上下文切换和状态变更。然而，使用线程和 Goroutine 之间有一个主要区别：<br/><strong>在使用 Goroutine 的情况下，会复用同一个系统线程和核心。这意味着，从操作系统的角度来看，操作系统线程���远不会进入等待状态。因此，在使用系统线程时的开销在使用 Goroutine 时就不存在了。</strong></p>
<p>基本上，Go 已经在操作系统级别将 <code>IO-Bound</code> 类型的工作转换为 <code>CPU-Bound</code> 类型。由于所有的上下文切换都是在应用程序级别进行的，所以在使用线程时，每个上下文切换(平均)不至于迟滞 600 条指令。该调度程序还有助于提高 <code>cache-line</code> 效率和 <code>NUMA</code>。在 Go 中，随着时间的推移，可以完成更多的工作，因为 Go 调度器尝试使用更少的线程，在每个线程上做更多的工作，这有助于减少操作系统和硬件的负载。</p>
<h2>结论</h2>
<p>Go 调度器在设计中考虑到复杂的操作系统和硬件的工作方式，真是令人惊叹。在操作系统级别将 <code>IO-Bound</code> 类型的工作转换为 <code>CPU-Bound</code> 类型的能力是我们在利用更多 CPU 的过程中获得巨大成功的地方。这就是为什么不需要比虚拟核心更多的操作系统线程的原因。你可以合理地期望每个虚拟内核只有一个系统线程来完成所有工作(CPU和IO)。对于网络应用程序和其他不会阻塞操作系统线程的系统调用的应用程序来说，这样做是可能的。</p>
<p>作为一个开发人员，你当然需要知道程序在运行中做了什么。你不可能创建无限数量的 Goroutine ，并期待惊人的性能。越少越好，但是通过了解这些 Go 调度器的语义，您可以做出更好的工程决策。</p>
<p>在下一篇文章中，我将探讨以保守的方式利用并发性以获得更好的性能，同时平衡可能需要增加到代码中的复杂性。</p>

<a href="https://www.ardanlabs.com/blog/2018/08/scheduling-in-go-part2.html">英文原文</a>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						