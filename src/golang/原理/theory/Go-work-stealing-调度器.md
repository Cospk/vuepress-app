---
title: Go work-stealing 调度器
source_url: 'https://studygolang.com/articles/12328'
category: Go原理教程
---


						<div class="article-content">
<p>本文译自 Rakyll 的 <a href="https://rakyll.org/scheduler/">scheduler</a>版权@归原文所有.
<!--more--></p>

<p>Go 调度器的工作是将可运行的 goroutine 分发到一个或多个处理器上运行的多个操作系统工作线程.
在多线程计算里, 调度出现了两种模式: work-sharing (工作共享) 和 work-stealing (工作窃取).</p>

<ul>
<li><strong>work-sharing</strong> 当一个处理器产生新的线程时, 它试图将其中的一些迁移到其他处理器上, 希望它们能被空闲或未充分利用的处理器所利用.</li>
<li><strong>work-stealing</strong> 未充分利用的处理器会主动去寻找其他处理器的线程并 <code>窃取</code> 一些.</li>
</ul>

<p>work-stealing 中线程迁移的频率少于 work-sharing. 当所有处理器都有工作要运行时, 没有线程会被迁移. 而一旦有空闲的处理器, 就会考虑迁移.</p>

<p>Go 从 1.1 开始就有一个 work-stealing 的调度器, 由 <a href="https://github.com/dvyukov">Dmitry Vyukov</a> 贡献. 本文将深入解释什么是 work-stealing 调度器, 以及 Go 如何实现它.</p>

<h4>调度基础</h4>

<p>Go 有一个可以利用多核处理器的 M:N 调度器. 任何时候, M 个 goroutine 都需要在 N 个 OS 线程上进行调度, 这些线程运行在最多 GOMAXPROCS 数量的处理器上.
Go 调度器使用以下术语解释 goroutine, 线程以及处理器:</p>

<ul>
<li>G: goroutine</li>
<li>M: OS 线程 (机器)</li>
<li>P: 处理器 (译者: 此处不是指 CPU, 可以认为是 Go 调度上下文或调度处理器, 所以下文的处理器如无特别说明都是指 P)</li>
</ul>

<p>有一个 P 相关的本地和全局 goroutine 队列. 每个 M 应该被分配给一个 P. 如果被阻塞或者在系统调用中, P (们) 可能没有 M (们). 任何时候，最多只有 GOMAXPROCS 数量的 P. 任何时候, 每个 P 只能有一个 M 运行. 如果需要, 更多的 M (们) 可以由调度器创建.</p>

<p><img src="https://static.studygolang.com/190401/fd59a7f0d990c985ecb15b8989e31ba0.png" width="782" height="358"/></p>

<p>每轮调度只是简单找到一个可运行的 goroutine 并执行它. 在每轮调度中, 搜索按以下顺序进行:</p>

<pre><code>runtime.schedule() {
    // only 1/61 of the time, check the global runnable queue for a G. 仅 1/61 的时间, 检查全局运行队列里面的 G.
    // if not found, check the local queue. 如果没找到, 检查本地队列.
    // if not found, 还是没找到 ?
    //     try to steal from other Ps. 尝试从其他 P 偷.
    //     if not, check the global runnable queue. 还是没有, 检查全局运行队列.
    //     if not found, poll network. 还是没有, 轮询网络.
}</code></pre>

<p>一旦找到可运行的 G, 它会一直执行直到被阻塞.</p>

<p><strong>注意</strong> 看起来好像全局队列比本地队列有优势, 但是偶尔检查全局队列是至关重要的, 以避免 M 只是从本地队列调度, 直到没有本地排队的 goroutine 留下.</p>

<h4>Stealing (窃取)</h4>

<p>当一个新的 G 被创建或者一个现有的 G 变成可运行的时候, 它被压入当前 P 的可运行的 goroutine 列表. 当 P 完成 G 时, 它会尝试从自己的可运行 goroutine 列表中弹出一个 G. 如果列表现在是空的, P 会随机的选择其他的 P, 并尝试从其队列中偷取一半可运行的 goroutine(s).</p>

<p><img src="https://static.studygolang.com/190401/1267a57a960fae388c77990dcaa6e756.png" width="782" height="409"/></p>

<p>在上面的例子中, P2 找不到任何可运行的 goroutine. 因此, 它随机选择另一个 P1, 并将其三个 goroutine(s) 窃取到自己的本地队列中. P2 将能够运行这些 goroutine, 并且调度器的工作会在多个处理器之间更加公平地分配.</p>

<h4>自旋线程 (Spinning threads)</h4>

<p>调度器总是希望将尽可能多的可运行的 goroutine(s) 分配给 M (们) 来利用处理器, 但是同时我们需要停留过多的工作来节省 CPU 和电力. 与此相矛盾的是, 调度器还需要能够扩展到高吞吐量和 CPU 密集型的程序.
如果性能是至关重要的, 那么对高吞吐量程序来说持续抢占既是昂贵又是有问题的. 操作系统线程不应该频繁地在 goroutine(s) 之间切换, 因为这会增加延迟. 除此之外, 在发生系统调用的时候, 操作系统线程需要不断地被阻塞和解除阻塞. 这是昂贵的, 并增加了很多开销.</p>

<p>为了尽量减少切换, Go 调度器实现了 <code>自旋线程</code>. 自旋线程消耗一点额外的 CPU, 但是它们最小化了 OS 线程的抢占. 一个线程是自旋的, 如果:</p>

<ul>
<li>分配了 P 的 M 正在寻找一个可执行 goroutine;</li>
<li>没有分配 P 的 M 正在寻找可用的 P;</li>
<li>调度器还会释放一个附加的线程, 当它正准备一个 goroutine 并且没有空闲的 P 也没有其他自旋线程的时候让它自旋.</li>
</ul>

<p>任何时候最多有 GOMAXPROCS 个自旋的 M (们). 当一个自旋的线程找到工作, 它就脱离了自旋状态.</p>

<p>如果有空闲的 M 没有被赋予 P, 那么被赋予 P 的空闲线程不会被阻塞. 当新的 goroutine(s) 被创建或 M 被阻塞时, 调度器确保至少有一个自旋 M. 这确保了没有可运行的 goroutine(s) 不被运行; 并且避免过多的 M 阻塞或者解除阻塞.</p>

<h4>结论</h4>

<p>Go 调度器做了很多事情来避免过多的操作系统线程抢占, 通过窃取(stealing)调度它们到正确和未充分利用的处理器, 以及实现 <code>自旋</code> 线程以避免过高阻塞或者解除阻塞切换的发生.</p>

<p>调度事件可以用执行追踪器(<a href="https://golang.org/cmd/trace/">execution tracer</a>)追踪. 如果你碰巧认为自己的处理器利用率很差, 则可以用它探究发生了什么事情.</p>

<h5>参考资料</h5>

<ul>
<li><a href="https://github.com/golang/go/blob/master/src/runtime/proc.go">Go 运行时调度器源码</a></li>
<li><a href="https://golang.org/s/go11sched">可扩展 Go 调度器设计文档</a></li>
<li><a href="https://morsmachine.dk/go-scheduler">Daniel Morsing: Go 调度器</a></li>
</ul>
 