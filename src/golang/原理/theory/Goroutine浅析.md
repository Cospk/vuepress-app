---
title: Goroutine浅析
source_url: 'https://studygolang.com/articles/12003'
category: Go原理教程
---


						<div class="post-body" itemprop="articleBody">
<p><code>CSAPP ch12</code>总结了三种并发模型：基于进程，基于IO多路复用，基于线程。在实际的服务器应用中基于线程的并发模型并不能创建和使用过多的thread。因为thread数目过多于CPU核数，内核调度和切换thread将付出较大代价。因此通常在基于线程的基础上，在用户态设计<strong>用户态线程模型与调度器</strong>，使得调度<strong>不需要陷入内核完成，减小并发调度代价</strong>。</p>
<h2 id="调度器的设计与演化"><a href="#调度器的设计与演化" class="headerlink" title="调度器的设计与演化"></a>调度器的设计与演化</h2><p>用户态线程模型又根据多少个协程对应OS内核线程区分为1:1 M:1 M:N 三种。go在runtime层实现的是<strong><code>M:N</code>的用户态线程+调度器</strong>，它结合了前两者的优势 <strong>充分利用多核</strong>+<strong>更小的上下文切换调度代价</strong>。经过Go几个版本的演化，调度器模型从最初的G-M模型今天的G-P-M模型已经基本固定。本节总结了G-P-M如何解决了G-M存在的问题。</p>
<h3 id="G-M-Model"><a href="#G-M-Model" class="headerlink" title="G-M Model"></a>G-M Model</h3><p>Go 1.0版本实现的调度器就是<strong><code>M:1</code></strong>的 <strong>线程池+任务队列</strong>的形式。每条内核级线程运行一个<code>M</code>，每个<code>M</code>不停地从任务队列<code>shed</code>中取出任务<code>G</code>并执行。任务队列中的任务<code>G</code>就是通过<code>go</code>关键字创建出goroutine。<a href="https://docs.google.com/document/d/1TTj4T2JO42uD5ID9e89oa0sLKhJYD0Y_kqxDv3I3XMw/edit#!" target="_blank" rel="external">Scalable Go Scheduler Design</a> 指出这样的调度器设计上的一些问题。</p>
<ul>
<li>所有G操作都由单个全局锁<code>sched.Lock</code>保护，测试发现14%的时间浪费在了<code>runtime.futex()</code>。</li>
<li>当M阻塞时，G需要传递给别的M执行，这导致延迟和额外的负担。</li>
<li>M用到的<code>mCache</code>是属于内核线程的，当M阻塞后相应的内存资源仍被占用着。</li>
<li>由于syscall造成的过多M阻塞和恢复。</li>
</ul>
<p><img src="https://ninokop.github.io/2017/10/31/Goroutine%E6%B5%85%E6%9E%90/thread-pool.png" style="zoom:38%"/></p>
<h3 id="G-P-M-Model"><a href="#G-P-M-Model" class="headerlink" title="G-P-M Model"></a>G-P-M Model</h3><p>为了解决上面的问题，Go1.1以后通过<strong>work stealing</strong>算法实现了<code>M:N</code>的<strong>G-P-M</strong>模型。它通过引入逻辑<strong>Processer P</strong>来解决G-M模型的几大问题。</p>
<ul>
<li>P优先从本地G队列中获取任务执行，这个操作线程安全不用Lock。</li>
<li>G存在于P队列中。当某个M陷入系统调用时，P将与M解绑定，并找另外的M（或创建新M）来执行G的代码，避免G在M之间传递。</li>
<li>P给M运行提供了运行所需的mCache内存，当PM解绑时将收回内存。</li>
</ul>
<p><img src="https://ninokop.github.io/2017/10/31/Goroutine%E6%B5%85%E6%9E%90/g-p-m.png" style="zoom:38%"/></p>
<h3 id="Data-Structure"><a href="#Data-Structure" class="headerlink" title="Data Structure"></a>Data Structure</h3><p><code>G</code>代表goroutine，它通过go关键字调用<code>runtime.newProc</code>创建，创建后即被放在P本地队列或全局队列中，等待被执行。它存储了goroutine执行的栈信息，状态，任务函数。其中执行的func入口保存在<code>startPC</code>域。由于它可以被任何P获取并执行，G在<code>stack</code>字段保存了goroutine栈的可用空间。在<code>sched</code>域保存了goroutine切换所需的全部上下文。</p>

<pre><code class="language-go">
type g struct {
	stack       stack   // offset known to runtime/cgo
	stackguard0 uintptr // offset known to liblink
	stackguard1 uintptr // offset known to liblink
	m              *m      // current m
	stackAlloc     uintptr // [stack.lo,stack.lo+stackAlloc)
	sched          gobuf
	
	goid           int64
	waitsince      int64  // approx time when g blocked
	waitreason     string // if status==Gwaiting
	schedlink      guintptr
	preempt        bool   // preemption signal
	lockedm        *m
	gopc           uintptr // pc of go statement
	startpc        uintptr // pc of goroutine function
	readyg         *g     // scratch for readyExecute
  ...
}
</code></pre>

<p><code>P</code>代表processer，数目为<code>GOMAXPROCS</code>，通常设置为CPU核数。P不仅维护了本地的G队列，同时为M运行提供内存资源<code>mCache</code>，当M陷入阻塞的系统调用导致P和M分离时，P可以回收内存资源。P在本地<code>runq</code>中取任务G执行时不用lock，但是从别的P中<code>stealG</code>或从全局队列中获取G时需要lock。当有新的G加入到队列时，会试图唤醒空闲的P。如果有空闲的P，会试图找空闲的M或创建新的M来执行，也就是说M是按需创建的。</p>

<pre><code class="language-go">
type p struct {
	lock mutex
	id          int32
	status      uint32 // one of pidle/prunning/...
	link        puintptr
	schedtick   uint32   // incremented on every scheduler call
	syscalltick uint32   // incremented on every system call
	m           muintptr // back-link to associated m
	mcache      *mcache
	// Queue of runnable goroutines. Accessed without lock.
	runqhead uint32
	runqtail uint32
	runq     [256]*g
	runnext guintptr
	// Available G's (status == Gdead)
	gfree    *g
	palloc persistentAlloc // per-P to avoid mutex
	// Per-P GC state
  ...
}
</code></pre>

<p><code>M</code>表示machine，其中<strong><code>mstartfn</code></strong>是M线程创建时的入口函数地址。当M与某个P绑定attached后mcache域将获得P的mCache内存，同时获取了P和当前的G。然后M进入<code>schedule</code>循环。shedule的机制大致是：</p>
<ol>
<li>从当前P的队列、全局队列或者别的P队列中<code>findrunnableG</code></li>
<li>栈指针从调度器栈m->g0切换到G自带的栈内存，并在此空间分配栈帧，执行G函数。</li>
<li>执行完后调用goexit做清理工作并回到M，如此反复。</li>
</ol>
<p>如果遇到G切换，要将上下文都保存在G当中，使得G可以被任何P绑定的M执行。M只是根据G提供的状态和信息做相同的事情。</p>

<pre><code class="language-go">
type m struct {
	g0      *g     // goroutine with scheduling stack
	morebuf gobuf  // gobuf arg to morestack
	curg          *g       // current running goroutine
	p             puintptr // attached p for executing go code 
	nextp         puintptr
	id            int32
	alllink       *m // on allm
	mcache        *mcache
  
	mallocing     int32
	throwing      int32
	preemptoff    string // if != "", keep curg running on this m
	locks         int32
	dying         int32
	helpgc        int32
	spinning      bool // m is actively looking for work
	blocked       bool // m is blocked on a note
	inwb          bool // m is executing a write barrier
  
  	mstartfn      func()
  ...
}
</code></pre>

<p>全局的任务队列保存了空闲m和空闲p的链表，以及全局G队列链表。</p>

<pre><code class="language-go">
type schedt struct {
	lock mutex
	goidgen uint64
	midle        muintptr // idle m's waiting for work
	nmidle       int32    // number of idle m's waiting for work
	nmidlelocked int32    // number of locked m's waiting for work
	mcount       int32    // number of m's that have been created
	maxmcount    int32    // maximum number of m's allowed (or die)
	pidle      puintptr // idle p's
	npidle     uint32
	nmspinning uint32
	// Global runnable queue.
	runqhead guintptr
	runqtail guintptr
	runqsize int32
	// Global cache of dead G's.
	gflock mutex
	gfree  *g
	ngfree int32
	gcwaiting  uint32 // gc is waiting to run
	stopwait   int32
	stopnote   note
	sysmonwait uint32
	sysmonnote note
	lastpoll   uint64
  ...
}
</code></pre>

<h2 id="Go调度器解决的问题"><a href="#Go调度器解决的问题" class="headerlink" title="Go调度器解决的问题"></a>Go调度器解决的问题</h2><h3 id="阻塞问题"><a href="#阻塞问题" class="headerlink" title="阻塞问题"></a>阻塞问题</h3><blockquote>
<p>如果任务G陷入到阻塞的系统调用中，内核线程M将一起阻塞，于是实际的运行线程少了一个。更严重的，如果所有M都阻塞了，那些本可以运行的任务G将没有系统资源运行。</p>
</blockquote>
<p>封装系统调用<code>entersyscallblock</code>，使得进入阻塞的系统调用前执行<code>releaseP</code>和<code>handOffP</code>，即剥夺M拥有的P的mCache。如果P本地队列还有G，P将去找别的M或创建新的M来执行，若没有则直接放进pidle全局链表。当有新的G加入时可以通过wakeP获取这个空闲的P。</p>

<pre><code class="language-go">
func entersyscallblock(dummy int32) {
...
    casgstatus(_g_, _Grunning, _Gsyscall)
    systemstack(entersyscallblock_handoff)
...
}
func entersyscallblock_handoff() {
    handoffp(releasep())
}
func handoffp(_p_ *p) {
    if !runqempty(_p_) || sched.runqsize != 0 {
        startm(_p_, false)
        return
    }
...
    pidleput(_p_)
}
</code></pre>

<p>另外，进入非阻塞的系统调用<code>entersyscall</code>时会将P设置为<code>Psyscall</code>。监控线程<code>sysmon</code>在遍历P，发现<code>Psyscall</code>时将执行<code>handOffP</code>。</p>
<h3 id="抢占调度"><a href="#抢占调度" class="headerlink" title="抢占调度"></a>抢占调度</h3><blockquote>
<p>当前G只有涉及到锁操作，读写channel才会触发切换。若没有抢占机制，同一个M上的其他任务G有可能长时间执行不到。</p>
</blockquote>
<p>go没有实现像内核一样的时间分片，设置优先级等抢占调度，只引入了初级的抢占。监控线程<code>sysmon</code>会循环<code>retake</code>，发现阻塞于系统调用或运行了较长时间（10ms）就会发起抢占<code>preemption(P)</code>。</p>

<pre><code class="language-go">
func retake(now int64) uint32 {
    n := 0
    for i := int32(0); i < gomaxprocs; i++ {
        _p_ := allp[i]
        s := _p_.status
        if s == _Psyscall {
            // 当P陷入系统调用超过一个sysmon时钟 handOffP
            t := int64(_p_.syscalltick)
            if int64(pd.syscalltick) != t {
                pd.syscalltick = uint32(t)
                pd.syscallwhen = now
                continue
            }
            if cas(&_p_.status, s, _Pidle) {
                handoffp(_p_)
            }
        } else if s == _Prunning {
            // 如果运行时间太长 主动抢占preemptone
            t := int64(_p_.schedtick)
            if int64(pd.schedtick) != t {
                pd.schedtick = uint32(t)
                pd.schedwhen = now
                continue
            }
            preemptone(_p_)
        }
    }
    return uint32(n)
}
</code></pre>

<p>抢占只是把G的stack设置为stackPreempt，这样下一次函数调用时检查栈空间会失败，触发morestack。morestack中发现是<strong>stackPreempt</strong>会触发<code>goschedImpl</code>，通过<code>dropg</code>将M和G分离，然后从全局获取runq重新进入schedule循环。</p>

<pre><code class="language-go">
func gopreempt_m(gp *g) {
	goschedImpl(gp)
}
func goschedImpl(gp *g) {
    status := readgstatus(gp)
    casgstatus(gp, _Grunning, _Grunnable)
    dropg()
    lock(&sched.lock)
    globrunqput(gp)
    unlock(&sched.lock)
    schedule()
}
</code></pre>

<h3 id="负载均衡"><a href="#负载均衡" class="headerlink" title="负载均衡"></a>负载均衡</h3><blockquote>
<p>内核线程M不是从全局任务队列中得到G，而是从M本地维护的G缓存中获取任务。如果某个M的G执行完了，而别的M还有很多G，这时如果G不能切换将造成CPU的浪费。</p>
</blockquote>
<p>P设计为内存连续的数组，为实现<strong>work stealing</strong>提供了条件。即当P的G队列为空时，P将随机从其它P中窃取一半的<code>runnable G</code>。这部分实现在M的启动函数<code>mstart</code>当中，作为schedule循环的一部分，持续的从各种渠道获取任务G。</p>

<pre><code class="language-go">
func findrunnable() (gp *g, inheritTime bool) {
    _g_ := getg()
top:
    // 从本地runq获取G
    if gp, inheritTime := runqget(_g_.m.p.ptr()); gp != nil {
        return gp, inheritTime
    }
    // 从全局sched.runq中获取G
    if sched.runqsize != 0 {
        gp := globrunqget(_g_.m.p.ptr(), 0)
    }
    // 随机选择一个P 从它的runq中steal一部分任务G
    for i := 0; i < int(4*gomaxprocs); i++ {
        _p_ := allp[fastrand1()%uint32(gomaxprocs)]
        var gp *g
        if _p_ == _g_.m.p.ptr() {
            gp, _ = runqget(_p_)
        } else {
            stealRunNextG := i > 2*int(gomaxprocs) 
            gp = runqsteal(_g_.m.p.ptr(), _p_, stealRunNextG)
        }
    }
stop:
  ...// 再检查一遍所有可以获取G的地方 若无则stopm
    stopm()
    goto top
}
</code></pre>

<h3 id="栈分配"><a href="#栈分配" class="headerlink" title="栈分配"></a>栈分配</h3><blockquote>
<p>G的栈空间怎么分配，太大会造成浪费，太小又会溢出，因此需要栈可以自动增长。</p>
</blockquote>
<p>G初始栈仅有2KB。在每次执行函数调用时调度器都会检测栈的大小，若发现不够用则触发中断。检查方法是比较栈指针寄存器SP和<code>g->stackguard</code>，如果SP更大则需要调用<code>runtime.morestack</code>扩展栈空间。其中morestack保存了当前现场到m的<code>morebuf</code>域，并调用<code>runtime.newstack</code>。</p>
<p><code>newstack</code>需要切换到调度器栈<code>m->g0</code>去调用。它分配一个大的新空间，将旧栈中的数据复制过去。这个过程中要保证原来指向旧栈空间的指针不会失效，要对这些指针进行调整。</p>

<pre><code class="language-go">
func newstack() {
    thisg := getg()
...
    casgstatus(gp, _Grunning, _Gwaiting)
    gp.waitreason = "stack growth"
  
    // Allocate a bigger segment and move the stack.
    oldsize := int(gp.stackAlloc)
    newsize := oldsize * 2
    if uintptr(newsize) > maxstacksize {
        throw("stack overflow")
    }
    casgstatus(gp, _Gwaiting, _Gcopystack)
    copystack(gp, uintptr(newsize))
    casgstatus(gp, _Gcopystack, _Grunning)
    gogo(&gp.sched)
}
</code></pre>

<p>新栈复制好以后仍然是调用gogo切换栈执行，这跟schedul中gogo到G函数一样。栈切换完成以后通过JMP返回到被中断的函数。直到遇到return才会返回到<code>runtime.lessstack</code>进行栈收缩。G的任务return时将返回到goexit清理现场。</p>
<h2 id="参考文章"><a href="#参考文章" class="headerlink" title="参考文章"></a>参考文章</h2><p><a href="http://tonybai.com/2017/06/23/an-intro-about-goroutine-scheduler/" target="_blank" rel="external">也谈goroutine</a></p>

