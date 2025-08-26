---
title: 用 GODEBUG 看调度跟踪
source_url: 'https://studygolang.com/articles/22859'
category: Go原理教程
---


						<h1><a id="user-content-用-godebug-看调度跟踪" class="anchor" aria-hidden="true" href="#用-godebug-看调度跟踪"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>用 GODEBUG 看调度跟踪</h1>
<p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/ce67c5cf76e24c9f6554b61224adb7d2e521aabb/68747470733a2f2f696d6167652e65646479636a792e636f6d2f62303163326365323565333466383064343939663034383864303334623030622e706e67"><img src="https://camo.githubusercontent.com/ce67c5cf76e24c9f6554b61224adb7d2e521aabb/68747470733a2f2f696d6167652e65646479636a792e636f6d2f62303163326365323565333466383064343939663034383864303334623030622e706e67" alt="image" data-canonical-src="https://image.eddycjy.com/b01c2ce25e34f80d499f0488d034b00b.png" style="max-width:100%;"/></a></p>
<p>让 Go 更强大的原因之一莫过于它的 GODEBUG 工具，GODEBUG 的设置可以让 Go 程序在运行时输出调试信息，可以根据你的要求很直观的看到你想要的调度器或垃圾回收等详细信息，并且还不需要加装其它的插件，非常方便，今天我们将先讲解 GODEBUG 的调度器相关内容，希望对你有所帮助。</p>
<p>不过在开始前，没接触过的小伙伴得先补补如下前置知识，便于更好的了解调试器输出的信息内容。</p>
<h2><a id="user-content-前置知识" class="anchor" aria-hidden="true" href="#前置知识"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>前置知识</h2>
<p>Go scheduler 的主要功能是针对在处理器上运行的 OS 线程分发可运行的 Goroutine，而我们一提到调度器，就离不开三个经常被提到的缩写，分别是：</p>
<ul>
<li>G：Goroutine，实际上我们每次调用 <code>go func</code> 就是生成了一个 G。</li>
<li>P：处理器，一般为处理器的核数，可以通过 <code>GOMAXPROCS</code> 进行修改。</li>
<li>M：OS 线程</li>
</ul>
<p>这三者交互实际来源于 Go 的 M: N 调度模型，也就是 M 必须与 P 进行绑定，然后不断地在 M 上循环寻找可运行的 G 来执行相应的任务，如果想具体了解可以详细阅读 <a href="https://speakerdeck.com/retervision/go-runtime-scheduler" rel="nofollow">《Go Runtime Scheduler》</a>，我们抽其中的工作流程图进行简单分析，如下:</p>
<p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/04277afe74654c584501831307d6a3b5e4f659f0/68747470733a2f2f696d6167652e65646479636a792e636f6d2f66623463366339326339336166336263326466633466313364633136376364662e706e67"><img src="https://camo.githubusercontent.com/04277afe74654c584501831307d6a3b5e4f659f0/68747470733a2f2f696d6167652e65646479636a792e636f6d2f66623463366339326339336166336263326466633466313364633136376364662e706e67" alt="image" data-canonical-src="https://image.eddycjy.com/fb4c6c92c93af3bc2dfc4f13dc167cdf.png" style="max-width:100%;"/></a></p>
<ol>
<li>当我们执行 <code>go func()</code> 时，实际上就是创建一个全新的 Goroutine，我们称它为 G。</li>
<li>新创建的 G 会被放入 P 的本地队列（Local Queue）或全局队列（Global Queue）中，准备下一步的动作。</li>
<li>唤醒或创建 M 以便执行 G。</li>
<li>不断地进行事件循环</li>
<li>寻找在可用状态下的 G 进行执行任务</li>
<li>清除后，重新进入事件循环</li>
</ol>
<p>而在描述中有提到全局和本地这两类队列，其实在功能上来讲都是用于存放正在等待运行的 G，但是不同点在于，本地队列有数量限制，不允许超过 256 个。并且在新建 G 时，会优先选择 P 的本地队列，如果本地队列满了，则将 P 的本地队列的一半的 G 移动到全局队列，这其实可以理解为调度资源的共享和再平衡。</p>
<p>另外我们可以看到图上有 steal 行为，这是用来做什么的呢，我们都知道当你创建新的 G 或者 G 变成可运行状态时，它会被推送加入到当前 P 的本地队列中。但其实当 P 执行 G 完毕后，它也会 “干活”，它会将其从本地队列中弹出 G，同时会检查当前本地队列是否为空，如果为空会随机的从其他 P 的本地队列中尝试窃取一半可运行的 G 到自己的名下。例子如下：</p>
<p><a target="_blank" rel="noopener noreferrer" href="https://camo.githubusercontent.com/d917159b924ee3c276def927d8471903794bb260/68747470733a2f2f696d6167652e65646479636a792e636f6d2f65376361386632313234363664386331356563306636306236396131636534642e706e67"><img src="https://camo.githubusercontent.com/d917159b924ee3c276def927d8471903794bb260/68747470733a2f2f696d6167652e65646479636a792e636f6d2f65376361386632313234363664386331356563306636306236396131636534642e706e67" alt="image" data-canonical-src="https://image.eddycjy.com/e7ca8f212466d8c15ec0f60b69a1ce4d.png" style="max-width:100%;"/></a></p>
<p>在这个例子中，P2 在本地队列中找不到可以运行的 G，它会执行 <code>work-stealing</code> 调度算法，随机选择其它的处理器 P1，并从 P1 的本地队列中窃取了三个 G 到它自己的本地队列中去。至此，P1、P2 都拥有了可运行的 G，P1 多余的 G 也不会被浪费，调度资源将会更加平均的在多个处理器中流转。</p>
<h2><a id="user-content-godebug" class="anchor" aria-hidden="true" href="#godebug"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>GODEBUG</h2>
<p>GODEBUG 变量可以控制运行时内的调试变量，参数以逗号分隔，格��为：<code>name=val</code>。本文着重点在调度器观察上，将会使用如下两个参��：</p>
<ul>
<li>schedtrace：设置 <code>schedtrace=X</code> 参数可以使运行时在每 X 毫秒发出一行调度器的摘要信息到标准 err 输出中。</li>
<li>scheddetail：设置 <code>schedtrace=X</code> 和 <code>scheddetail=1</code> 可以使运行时在每 X 毫秒发出一次详细的多行信息，信息内容主要包括调度程序、处理器、OS 线程 和 Goroutine 的状态。</li>
</ul>
<h3><a id="user-content-演示代码" class="anchor" aria-hidden="true" href="#演示代码"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>演示代码</h3>
<pre><code>func main() {
	wg := sync.WaitGroup{}
	wg.Add(10)
	for i := 0; i < 10; i++ {
		go func(wg *sync.WaitGroup) {
			var counter int
			for i := 0; i < 1e10; i++ {
				counter++
			}
			wg.Done()
		}(&wg)
	}

	wg.Wait()
}
</code></pre>
<h3><a id="user-content-schedtrace" class="anchor" aria-hidden="true" href="#schedtrace"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>schedtrace</h3>
<pre><code>$ GODEBUG=schedtrace=1000 ./awesomeProject 
SCHED 0ms: gomaxprocs=4 idleprocs=1 threads=5 spinningthreads=1 idlethreads=0 runqueue=0 [0 0 0 0]
SCHED 1000ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=0 [1 2 2 1]
SCHED 2000ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=0 [1 2 2 1]
SCHED 3001ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=0 [1 2 2 1]
SCHED 4010ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=0 [1 2 2 1]
SCHED 5011ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=0 [1 2 2 1]
SCHED 6012ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=0 [1 2 2 1]
SCHED 7021ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=4 [0 1 1 0]
SCHED 8023ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=4 [0 1 1 0]
SCHED 9031ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=4 [0 1 1 0]
SCHED 10033ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=4 [0 1 1 0]
SCHED 11038ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=4 [0 1 1 0]
SCHED 12044ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=4 [0 1 1 0]
SCHED 13051ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=4 [0 1 1 0]
SCHED 14052ms: gomaxprocs=4 idleprocs=2 threads=5 
...
</code></pre>
<ul>
<li>sched：每一行都代表调度器的调试信息，后面提示的毫秒数表示启动到现在的运行时间，输出的时间间隔受 <code>schedtrace</code> 的值影响。</li>
<li>gomaxprocs：当前的 CPU 核心数（GOMAXPROCS 的当前值）。</li>
<li>idleprocs：空闲的处理器数量，后面的数字表示当前的空闲数量。</li>
<li>threads：OS 线程数量，后面的数字表示当前正在运行的线程数量。</li>
<li>spinningthreads：自旋状态的 OS 线程数量。</li>
<li>idlethreads：空闲的线程数量。</li>
<li>runqueue：全局队列中中的 Goroutine 数量，而后面的 [0 0 1 1] 则分别代表这 4 个 P 的本地队列正在运行的 Goroutine 数量。</li>
</ul>
<p>在上面我们有提到 “自旋线程” 这个概念，如果你之前没有了解过相关概念，一听 “自旋” 肯定会比较懵，我们引用 《Head First of Golang Scheduler》 的内容来说明：</p>
<blockquote>
<p>自旋线程的这个说法，是因为 Go Scheduler 的设计者在考虑了 “OS 的资源利用率” 以及 “频繁的线程抢占给 OS 带来的负载” 之后，提出了 “Spinning Thread” 的概念。也就是当 “自旋线程” 没有找到可供其调度执行的 Goroutine 时，并不会销毁该线程 ，而是采取 “自旋” 的操作保存了下来。虽然看起来这是浪费了一些资源，但是考虑一下 syscall 的情景就可以知道，比起 “自旋"，线程间频繁的抢占以及频繁的创建和销毁操作可能带来的危害会更大。</p>
</blockquote>
<h3><a id="user-content-scheddetail" class="anchor" aria-hidden="true" href="#scheddetail"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>scheddetail</h3>
<p>如果我们想要更详细的看到调度器的完整信息时，我们可以增加 <code>scheddetail</code> 参数，就能够更进一步的查看调度的细节逻辑，如下：</p>
<pre><code>$ GODEBUG=scheddetail=1,schedtrace=1000 ./awesomeProject
SCHED 1000ms: gomaxprocs=4 idleprocs=0 threads=5 spinningthreads=0 idlethreads=0 runqueue=0 gcwaiting=0 nmidlelocked=0 stopwait=0 sysmonwait=0
  P0: status=1 schedtick=2 syscalltick=0 m=3 runqsize=3 gfreecnt=0
  P1: status=1 schedtick=2 syscalltick=0 m=4 runqsize=1 gfreecnt=0
  P2: status=1 schedtick=2 syscalltick=0 m=0 runqsize=1 gfreecnt=0
  P3: status=1 schedtick=1 syscalltick=0 m=2 runqsize=1 gfreecnt=0
  M4: p=1 curg=18 mallocing=0 throwing=0 preemptoff= locks=0 dying=0 spinning=false blocked=false lockedg=-1
  M3: p=0 curg=22 mallocing=0 throwing=0 preemptoff= locks=0 dying=0 spinning=false blocked=false lockedg=-1
  M2: p=3 curg=24 mallocing=0 throwing=0 preemptoff= locks=0 dying=0 spinning=false blocked=false lockedg=-1
  M1: p=-1 curg=-1 mallocing=0 throwing=0 preemptoff= locks=1 dying=0 spinning=false blocked=false lockedg=-1
  M0: p=2 curg=26 mallocing=0 throwing=0 preemptoff= locks=0 dying=0 spinning=false blocked=false lockedg=-1
  G1: status=4(semacquire) m=-1 lockedm=-1
  G2: status=4(force gc (idle)) m=-1 lockedm=-1
  G3: status=4(GC sweep wait) m=-1 lockedm=-1
  G17: status=1() m=-1 lockedm=-1
  G18: status=2() m=4 lockedm=-1
  G19: status=1() m=-1 lockedm=-1
  G20: status=1() m=-1 lockedm=-1
  G21: status=1() m=-1 lockedm=-1
  G22: status=2() m=3 lockedm=-1
  G23: status=1() m=-1 lockedm=-1
  G24: status=2() m=2 lockedm=-1
  G25: status=1() m=-1 lockedm=-1
  G26: status=2() m=0 lockedm=-1
</code></pre>
<p>在这里我们抽取了 1000ms 时的调试信息来查看，信息量比较大，我们先从每一个字段开始了解。如下：</p>
<h4><a id="user-content-g" class="anchor" aria-hidden="true" href="#g"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>G</h4>
<ul>
<li>status：G 的运行状态。</li>
<li>m：隶属哪一个 M。</li>
<li>lockedm：是否有锁定 M。</li>
</ul>
<p>在第一点中我们有提到 G 的运行状态，这对于分析内部流转非常的有用，共涉及如下 9 种状态：</p>
<table>
<thead>
<tr>
<th>状态</th>
<th>值</th>
<th>含义</th>
</tr>
</thead>
<tbody>
<tr>
<td>_Gidle</td>
<td>0</td>
<td>刚刚被分配，还没有进行初始化。</td>
</tr>
<tr>
<td>_Grunnable</td>
<td>1</td>
<td>已经在运行队列中，还没有执行用户代码。</td>
</tr>
<tr>
<td>_Grunning</td>
<td>2</td>
<td>不在运行队列里中，已经可以执行用户代码，此时已经分配了 M 和 P。</td>
</tr>
<tr>
<td>_Gsyscall</td>
<td>3</td>
<td>正在执行系统调用，此时分配了 M。</td>
</tr>
<tr>
<td>_Gwaiting</td>
<td>4</td>
<td>在运行时被阻止，没有执行用户代码，也不在运行队列中，此时它正在某处阻塞等待中。</td>
</tr>
<tr>
<td>_Gmoribund_unused</td>
<td>5</td>
<td>尚未使用，但是在 gdb 中进行了硬编码。</td>
</tr>
<tr>
<td>_Gdead</td>
<td>6</td>
<td>尚未使用，这个状态可能是刚退出或是刚被初始化，此时它并没有执行用户代码，有可能有也有可能没有分配堆栈。</td>
</tr>
<tr>
<td>_Genqueue_unused</td>
<td>7</td>
<td>尚未使用。</td>
</tr>
<tr>
<td>_Gcopystack</td>
<td>8</td>
<td>正在复制堆栈，并没有执行用户代码，也不在运行队列中。</td>
</tr>
</tbody>
</table>
<p>在理解了各类的状态的意思后，我们结合上述案例看看，如下：</p>
<pre><code>G1: status=4(semacquire) m=-1 lockedm=-1
G2: status=4(force gc (idle)) m=-1 lockedm=-1
G3: status=4(GC sweep wait) m=-1 lockedm=-1
G17: status=1() m=-1 lockedm=-1
G18: status=2() m=4 lockedm=-1
</code></pre>
<p>在这个片段中，G1 的运行状态为 <code>_Gwaiting</code>，并没有分配 M 和锁定。这时候你可能好奇在片段中括号里的是什么东西呢，其实是因为该 <code>status=4</code> 是表示 <code>Goroutine</code> 在<strong>运行时时被阻止</strong>，而阻止它的事件就是 <code>semacquire</code> 事件，是因为 <code>semacquire</code> 会检查信号量的情况，在合适的时机就调用 <code>goparkunlock</code> 函数，把当前 <code>Goroutine</code> 放进等待队列，并把它设为 <code>_Gwaiting</code> 状态。</p>
<p>那么在实际运行中还有什么原因会导致这种现象呢，我们一起看看，如下：</p>
<pre><code>	waitReasonZero                                    // ""
	waitReasonGCAssistMarking                         // "GC assist marking"
	waitReasonIOWait                                  // "IO wait"
	waitReasonChanReceiveNilChan                      // "chan receive (nil chan)"
	waitReasonChanSendNilChan                         // "chan send (nil chan)"
	waitReasonDumpingHeap                             // "dumping heap"
	waitReasonGarbageCollection                       // "garbage collection"
	waitReasonGarbageCollectionScan                   // "garbage collection scan"
	waitReasonPanicWait                               // "panicwait"
	waitReasonSelect                                  // "select"
	waitReasonSelectNoCases                           // "select (no cases)"
	waitReasonGCAssistWait                            // "GC assist wait"
	waitReasonGCSweepWait                             // "GC sweep wait"
	waitReasonChanReceive                             // "chan receive"
	waitReasonChanSend                                // "chan send"
	waitReasonFinalizerWait                           // "finalizer wait"
	waitReasonForceGGIdle                             // "force gc (idle)"
	waitReasonSemacquire                              // "semacquire"
	waitReasonSleep                                   // "sleep"
	waitReasonSyncCondWait                            // "sync.Cond.Wait"
	waitReasonTimerGoroutineIdle                      // "timer goroutine (idle)"
	waitReasonTraceReaderBlocked                      // "trace reader (blocked)"
	waitReasonWaitForGCCycle                          // "wait for GC cycle"
	waitReasonGCWorkerIdle                            // "GC worker (idle)"
</code></pre>
<p>我们通过以上 <code>waitReason</code> 可以了解到 <code>Goroutine</code> 会被暂停运行的原因要素，也就是会出现在括号中的事件。</p>
<h4><a id="user-content-m" class="anchor" aria-hidden="true" href="#m"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>M</h4>
<ul>
<li>p：隶属哪一个 P。</li>
<li>curg：当前正在使用哪个 G。</li>
<li>runqsize：运行队列中的 G 数量。</li>
<li>gfreecnt：可用的G（状态为 Gdead）。</li>
<li>mallocing：是否正在分配内存。</li>
<li>throwing：是否抛出异常。</li>
<li>preemptoff：不等于空字符串的话，保持 curg 在这个 m 上运行。</li>
</ul>
<h4><a id="user-content-p" class="anchor" aria-hidden="true" href="#p"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>P</h4>
<ul>
<li>status：P 的运行状态。</li>
<li>schedtick：P 的调度次数。</li>
<li>syscalltick：P 的系统调用次数。</li>
<li>m：隶属哪一个 M。</li>
<li>runqsize：运行队列中的 G 数量。</li>
<li>gfreecnt：可用的G（状态为 Gdead）。</li>
</ul>
<table>
<thead>
<tr>
<th>状态</th>
<th>值</th>
<th>含义</th>
</tr>
</thead>
<tbody>
<tr>
<td>_Pidle</td>
<td>0</td>
<td>刚刚被分配，还没有进行进行初始化。</td>
</tr>
<tr>
<td>_Prunning</td>
<td>1</td>
<td>当 M 与 P 绑定调用 acquirep 时，P 的状态会改变为 _Prunning。</td>
</tr>
<tr>
<td>_Psyscall</td>
<td>2</td>
<td>正在执行系统调用。</td>
</tr>
<tr>
<td>_Pgcstop</td>
<td>3</td>
<td>暂停运行，此时系统正在进行 GC，直至 GC 结束后才会转变到下一个状态阶段。</td>
</tr>
<tr>
<td>_Pdead</td>
<td>4</td>
<td>废弃，不再使用。</td>
</tr>
</tbody>
</table>
<h2><a id="user-content-总结" class="anchor" aria-hidden="true" href="#总结"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>总结</h2>
<p>通过本文我们学习到了调度的一些基础知识，再通过神奇的 GODEBUG 掌握了观察调度器的方式方法，你想想，是不是可以和我上一篇文章的 <code>go tool trace</code> 来结合使用呢，在实际的使用中，类似的办法有很多，组合巧用是重点。</p>
<h2><a id="user-content-参考" class="anchor" aria-hidden="true" href="#参考"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>参考</h2>
<ul>
<li><a href="https://software.intel.com/en-us/blogs/2014/05/10/debugging-performance-issues-in-go-programs" rel="nofollow">Debugging performance issues in Go programs</a></li>
<li><a href="https://dave.cheney.net/tag/godebug" rel="nofollow">A whirlwind tour of Go’s runtime environment variables</a></li>
<li><a href="https://mp.weixin.qq.com/s?__biz=Mzg3MTA0NDQ1OQ==&mid=2247483907&idx=2&sn=c955372683bc0078e14227702ab0a35e&chksm=ce85c607f9f24f116158043f63f7ca11dc88cd519393ba182261f0d7fc328c7b6a94fef4e416&scene=38#wechat_redirect" rel="nofollow">Go调度器系列（2）宏观看调度器</a></li>
<li><a href="https://rakyll.org/scheduler/" rel="nofollow">Go's work-stealing scheduler</a></li>
<li><a href="https://www.ardanlabs.com/blog/2015/02/scheduler-tracing-in-go.html" rel="nofollow">Scheduler Tracing In Go</a></li>
<li><a href="https://zhuanlan.zhihu.com/p/42057783" rel="nofollow">Head First of Golang Scheduler</a></li>
<li><a href="http://xargin.com/state-of-goroutine/" rel="nofollow">goroutine 的状态切换</a></li>
<li><a href="https://golang.org/pkg/runtime/#hdr-Environment_Variables" rel="nofollow">Environment_Variables</a></li>
</ul>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						