---
title: Go 垃圾回收
source_url: 'https://studygolang.com/articles/11904'
category: Go原理教程
---


						<div class="post-body" itemprop="articleBody">
<p>通常C++通过指针引用计数来回收对象，但是这<strong>不能处理循环引用</strong>。为了避免引用计数的缺陷，后来出现了标记清除，分代等垃圾回收算法。Go的垃圾回收官方形容为 <strong>非分代 非紧缩 写屏障 并发标记清理</strong>。标记清理算法的字面解释，就是将可达的内存块进行标记<code>mark</code>，最后没有标记的不可达内存块将进行清理<code>sweep</code>。</p>
<h2 id="三色标记法"><a href="#三色标记法" class="headerlink" title="三色标记法"></a>三色标记法</h2><p>判断一个对象是不是垃圾需不需要标记，就看是否能从当前栈或全局数据区 直接或间接的引用到这个对象。这个初始的当前goroutine的栈和全局数据区称为GC的root区。扫描从这里开始，通过<code>markroot</code>将所有root区域的指针标记为可达，然后沿着这些指针扫描，递归地标记遇到的所有可达对象。因此引出几个问题：</p>
<blockquote>
<ol>
<li>标记清理能不能与用户代码并发</li>
<li>如何获得对象的类型而找到所有可达区域 标记位记录在哪里</li>
<li>何时触发标记清理</li>
</ol>
</blockquote>
<h3 id="如何并发标记"><a href="#如何并发标记" class="headerlink" title="如何并发标记"></a>如何并发标记</h3><p>标记清扫算法在标记和清理时需要停止所有的goroutine，来保证已经被标记的区域不会被用户修改引用关系，造成清理错误。但是每次GC都要StopTheWorld显然是不能接受的。Go的各个版本为减少STW做了各种努力。从Go1.5开始采用三色标记法实现标记阶段的并发。</p>
<ul>
<li>最开始所有对象都是白色 </li>
<li>扫描所有可达对象，标记为灰色，放入待处理队列 </li>
<li>从队列提取灰色对象，将其引用对象标记为灰色放入队列，自身标记为黑色 </li>
<li>写屏障监控对象内存修改，重新标色或是放入队列</li>
</ul>
<p>完成标记后 对象不是白色就是黑色，清理操作只需要把白色对象回收内存回收就好。</p>
<p><img src="https://ninokop.github.io/2017/11/09/Go-垃圾回收/Animation_of_tri-color_garbage_collection.gif" style="zoom:80%"/></p>
<p><strong>大概理解所谓并发标记，首先是指能够跟用户代码并发的进行，其次是指标记工作不是递归地进行，而是多个goroutine并发的进行</strong>。前者通过write-barrier解决并发问题，后者通过gc-work队列实现非递归地mark可达对象。</p>
<h4 id="write-barrier"><a href="#write-barrier" class="headerlink" title="write-barrier"></a>write-barrier</h4><p>用下面这个例子解释并发带来的问题，原文引用自<a href="https://github.com/pzxwhc/MineKnowContainer/issues/89" target="_blank" rel="external">CMS垃圾回收器原理</a>。当从A这个GC root找到引用对象B时，B变灰A变黑。这时用户goroutine执行把A到B的引用改成了A到C的引用，同时B不再引用C。然后GC goroutine又执行，发现B没有引用对象，B变黑。而这时由于A已经变黑完成了扫描，C将当做白色不可达对象被清除。</p>
<p><img src="https://ninokop.github.io/2017/11/09/Go-垃圾回收/abc.png" style="zoom:80%"/></p>
<blockquote>
<p>解决办法：<strong>引入写屏障</strong>。当发现A已经标记为黑色了，若A又引用C，那么把C变灰入队。这个write_barrier是编译器在每一处内存写操作前生成一小段代码来做的。</p>
</blockquote>

<pre><code class="language-go">
// 写屏障伪代码
write_barrier(obj,field,newobj){
    if(newobj.mark == FALSE){
        newobj.mark = TRUE
        push(newobj,$mark_stack)
    }
    *field = newobj
}
</code></pre>

<h4 id="gc-work"><a href="#gc-work" class="headerlink" title="gc-work"></a>gc-work</h4><p>如何非递归的实现遍历mark可达节点，显然需要一个队列。</p>
<blockquote>
<p>这个队列也帮助区分黑色对象和灰色对象，因为标记位只有一个。标记并且在队列中的是灰色对象，标记了但是不在队列中的黑色对象，末标记的是白色对象。</p>
</blockquote>

<pre><code class="language-go">
root node queue
while(queue is not nil) {
  dequeue // 节点出队
  process // 处理当前节点 
  child node queue // 子节点入队
}
</code></pre>

<p>总结一下并发标记的过程：</p>
<ol>
<li><code>gcstart</code>启动阶段准备了N个<code>goMarkWorkers</code>。每个worker都处理以下相同流程。</li>
<li>如果是第一次mark则首先<code>markroot</code>将所有root区的指针入队。</li>
<li>从gcw中取节点出对开始扫描处理<code>scanobject</code>，节点出队列就是黑色了。</li>
<li>扫描时获取该节点所有子节点的类型信息判断是不是指针，若是指针且并没有被标记则<code>greyobject</code>入队。</li>
<li>每个worker都去gcw中拿任务直到为空break。</li>
</ol>

<pre><code class="language-go">
// 每个markWorker都执行gcDrain这个标记过程
func gcDrain(gcw *gcWork, flags gcDrainFlags) {
    // 如果还没有root区域入队则markroot
    markroot(gcw, job)
    if idle && pollWork() {
        goto done
    }
    // 节点出队 
    b = gcw.get()
    scanobject(b, gcw)
done:
}
func scanobject(b uintptr, gcw *gcWork) {
    hbits := heapBitsForAddr(b)
    s := spanOfUnchecked(b)
    n := s.elemsize
    for i = 0; i < n; i += sys.PtrSize {
        // Find bits for this word.
        if bits&bitPointer == 0 {
            continue // not a pointer
        }
.... 
        // Mark the object.
        if obj, hbits, span, objIndex := heapBitsForObject(obj, b, i); obj != 0 {
            greyobject(obj, b, i, hbits, span, gcw, objIndex)
        }
    }
    gcw.bytesMarked += uint64(n)
    gcw.scanWork += int64(i)
}
func greyobject(obj, base, off uintptr, hbits heapBits, 
     span *mspan, gcw *gcWork, objIndex uintptr) {
    mbits := span.markBitsForIndex(objIndex)
    // If marked we have nothing to do.
    if mbits.isMarked() {
        return
    }
    if !hbits.hasPointers(span.elemsize) {
        return
    }
    gcw.put(obj)
}
</code></pre>

<h3 id="标记位"><a href="#标记位" class="headerlink" title="标记位"></a>标记位</h3><p>实现精确地垃圾回收的前提，就是能获得对象区域的类型信息，从而判断是否是指针。如何判断，最后又把可达标记记在哪里：<strong>通过堆区arena前面对应的bitmap</strong>。</p>
<blockquote>
<p>结构体中不包含指针，其实不需要递归地标记结构体成员。如果没有类型信息只能对所有的结构体成员递归地标记下去。还有如果非指���成员刚好存储的内容对应着合法地址，那这个地址的对象就会碰巧被标记���导致无法回收。</p>
</blockquote>
<p>这个bitmap位图区域每个字(32位或64位)会对应4位的标记位。<code>heapBitsForAddr</code>可以获取对应堆地址的bitmap位hbits，根据它可以判断是否是指针，如果是指针且之前没有被标记过，则mark当前对象为可达，并且<code>greayObject</code>入队，供给其他的markWorker来处理。</p>

<pre><code class="language-go">
// 获取b对应的bitmap位图
obj, hbits, span, objIndex := heapBitsForObject(obj, b, i)
mbits := span.markBitsForIndex(objIndex)
// 判断是否被标记过 已标记或不是指针都不入队
mbits.isMarked() 
hbits.hasPointers(span.elemsize)
</code></pre>

<p>gc_trigger最开始是4MB，next_gc初始为4MB，之后每次标记完成时将重新计算动态调整值大小。但gc_trigger至少要大于初始的4MB，同时至少要比当前使用的heap大1MB。</p>
<blockquote>
<p>gcmark在每次标记结束后重置阈值大小。当前使用了4MB内存，这时设置gc_trigger为2*4MB，也就是当内存分配到8MB时会再次触发GC。回收之后内存为5MB，那下一次要达到10MB才会触发GC。这个比例triggerRatio是由gcpercent/100决定的。</p>
</blockquote>

<pre><code class="language-go">
func gcinit() {
    _ = setGCPercent(readgogc()) 
    memstats.gc_trigger = heapminimum 
    memstats.next_gc = uint64(float64(memstats.gc_trigger) / (1 +
      gcController.triggerRatio) * (1 + float64(gcpercent)/100)) 
    work.startSema = 1
    work.markDoneSema = 1
}
func gcMark() {
    memstats.gc_trigger = uint64(float64(memstats.heap_marked) *
       (1 + gcController.triggerRatio))
}
</code></pre>

<h3 id="强制垃圾回收"><a href="#强制垃圾回收" class="headerlink" title="强制垃圾回收"></a>强制垃圾回收</h3><p>如果系统启动或短时间内大量分配对象，会将垃圾回收的gc_trigger推高。当服务正常后，活跃对象远小于这个阈值，造成垃圾回收无法触发。这个问题交给sysmon解决。它每隔2分钟force触发GC一次。这个forcegc的goroutine一直park在后台，直到sysmon将它唤醒开始执行gc而不用检查阈值。</p>

<pre><code class="language-go">
// proc.go
var forcegcperiod int64 = 2 * 60 * 1e9
func init() { go forcegchelper()}
func sysmon() {
    lastgc := int64(atomic.Load64(&memstats.last_gc))
    if gcphase == _GCoff && lastgc != 0 && 
       unixnow-lastgc > forcegcperiod && 
       atomic.Load(&forcegc.idle) != 0 {
            injectglist(forcegc.g)
        } 
}
func forcegchelper() {
for {
    goparkunlock(&forcegc.lock, "force gc (idle)", traceEvGoBlock, 1)
    gcStart(gcBackgroundMode, true)
    }
}
</code></pre>

<h2 id="标记与清理过程"><a href="#标记与清理过程" class="headerlink" title="标记与清理过程"></a>标记与清理过程</h2><p>这里结合gc-work那一节从头梳理一下gc的启动和流程。下面这个图总结了mark-sweep所有的状态变化。在代码里只有三个GC状态，分别对应这几个阶段。总结两个问题：</p>
<ol>
<li><strong>为什么markTermination需要rescan全局指针和栈</strong>。因为mark阶段是跟用户代码并发的，所以有可能栈上都分了新的对象，这些对象通过write barrier记录下来，在rescan的时候再检查一遍。</li>
<li><strong>为什么还需要两个stopTheWorld</strong> 在GCtermination时需要STW不然永远都可能栈上出现新对象。在GC开始之前做准备工作（比如 enable write barrier）的时候也要STW。</li>
</ol>
<p><img src="https://ninokop.github.io/2017/11/09/Go-垃圾回收/gc.png" style="zoom:50%"/></p>
<blockquote>
<ul>
<li>Off: <code>_GCoff</code></li>
<li>Stack scan + Mark: <code>_GCmark</code></li>
<li>Mark termination: _GCmarktermination</li>
</ul>
</blockquote>
<h3 id="Goff-to-Gmark"><a href="#Goff-to-Gmark" class="headerlink" title="Goff to Gmark"></a>Goff to Gmark</h3><p><code>gcstart</code>由每次mallocgc触发，当然要满足gc_trriger等阈值条件才触发。整个启动过程都是STW的，它启动了所有将并发执行标记工作的goroutine，然后进入GCMark状态使能写屏障，启动gcController。</p>

<pre><code class="language-go">
func gcStart(mode gcMode, forceTrigger bool) {
    // 启动MarkStartWorkers的goroutine
    if mode == gcBackgroundMode {
        gcBgMarkStartWorkers()
    }
    gcResetMarkState()
    systemstack(stopTheWorldWithSema)
    // 完成之前的清理工作
    systemstack(func() {
        finishsweep_m()
    })
  
    // 进入Mark状态 使能写屏障
    if mode == gcBackgroundMode {
        gcController.startCycle()
        setGCPhase(_GCmark)
        gcBgMarkPrepare()
        gcMarkRootPrepare()
        atomic.Store(&gcBlackenEnabled, 1)
        systemstack(startTheWorldWithSema)
    }
}
</code></pre>

<h3 id="Gmark"><a href="#Gmark" class="headerlink" title="Gmark"></a>Gmark</h3><p>解释一下gcMarkWorker跟gcController的关系。gcstart中只是为所有的P都准备好对应的goroutine来做标记。但是他们一开始就gopark住当前G，直到被gccontroller的<code>findRunnableGCWorker</code>唤醒。<a href="https://ninokop.github.io/2017/11/01/Goroutine%E6%BA%90%E7%A0%81%E8%AE%B0%E5%BD%95/" target="_blank" rel="external">goroutine源码记录</a>讲了goroutine的过程，m启动后会一直通过schedule查找可执行的G，其中gcworker也是G的来源，但是首先要检查当前状态是不是Gmark。如果是就唤醒worker开始标记工作。</p>

<pre><code class="language-go">
func gcBgMarkStartWorkers() {
    for _, p := range &allp {
        go gcBgMarkWorker(p)
        notetsleepg(&work.bgMarkReady, -1)
        noteclear(&work.bgMarkReady)
    }
}
func schedule() {
  ...//schedule优先唤醒markworkerG 但首先gcBlackenEnabled != 0
    if gp == nil && gcBlackenEnabled != 0 {
        gp = gcController.findRunnableGCWorker(_g_.m.p.ptr())
    }
}
</code></pre>

<p>唤醒后开始进入mark标记工作<code>gcDrain</code>。gc-work那一节讲了并发标记的过程，这里不重复。总结来说就是每个worker都去队列中拿节点（黑化节点），然后处理当前节点看有没有指针和没标记的对象，继续入队子节点（灰化节点），直到队列为空再也找不到可达对象。</p>

<pre><code class="language-go">
func gcBgMarkWorker(_p_ *p) {
    notewakeup(&work.bgMarkReady)
    for {
        gopark(func(g *g, parkp unsafe.Pointer) bool {
        }, unsafe.Pointer(park), "GC worker (idle)", traceEvGoBlock, 0)
        systemstack(func() {
            casgstatus(gp, _Grunning, _Gwaiting)
            gcDrain(&_p_.gcw, ...)
            casgstatus(gp, _Gwaiting, _Grunning)
        })
        // 标记完成gcMarkDone()
        if incnwait == work.nproc && !gcMarkWorkAvailable(nil) {
            gcMarkDone()
        }
    }
}
</code></pre>

<h3 id="Gmarktermination"><a href="#Gmarktermination" class="headerlink" title="Gmarktermination"></a>Gmarktermination</h3><p>mark结束后调用<code>gcMarkDone</code>，它主要是<code>StopTheWorld</code>然后进入<code>gcMarkTermination</code>中的<code>gcMark</code>。<strong>大概是做了rescan root区域的工作，但是看到有博客说Go1.8已经没有再rescan了，细节没看懂，代码里看起来却是又重新扫描了一次啊。</strong></p>

<pre><code class="language-go">
func gcMarkTermination() {
    atomic.Store(&gcBlackenEnabled, 0)
    setGCPhase(_GCmarktermination)
    casgstatus(gp, _Grunning, _Gwaiting)
    gp.waitreason = "garbage collection"
    systemstack(func() {
        gcMark(startTime)
        setGCPhase(_GCoff)
        gcSweep(work.mode)
    })
    casgstatus(gp, _Gwaiting, _Grunning)
    systemstack(startTheWorldWithSema)
}
func gcMark(start_time int64) {
    gcMarkRootPrepare()
    gchelperstart()
    gcDrain(gcw, gcDrainBlock)
    gcw.dispose()
    // gc结束后重置gc_trigger等阈值
    ...
}
</code></pre>

<h3 id="Gsweep"><a href="#Gsweep" class="headerlink" title="Gsweep"></a>Gsweep</h3><p>有多个地方可以触发sweep，比如GC标记结束会触发gcsweep。如果是并发清除，需要回收从gc_trigger到当前活跃内存的那么多heap区���，唤醒后台的sweep goroutine。</p>

<pre><code class="language-go">
func gcSweep(mode gcMode) {
    lock(&mheap_.lock)
    mheap_.sweepgen += 2
    mheap_.sweepdone = 0
    unlock(&mheap_.lock)
    // Background sweep.
    ready(sweep.g, 0, true)
}
// 在runtime初始化时进行gcenable
func gcenable() {
    go bgsweep(c)
}
func bgsweep(c chan int) {
    goparkunlock(&sweep.lock, "GC sweep wait", traceEvGoBlock, 1)
    for {
        for gosweepone() != ^uintptr(0) {
            sweep.nbgsweep++
            Gosched()
        }
        goparkunlock(&sweep.lock, "GC sweep wait", traceEvGoBlock, 1)
    }
}
</code></pre>

<p>也就是系统初始化的时候开启了后台的bgsweep goroutine。这个G也是一进去就park了，唤醒后执行gosweepone。<strong>seepone的过程大概是：</strong>遍历所有的spans看它的sweepgen是否需要检查，如果要就检查这个mspan里所有的object的bit位看是否需要回收。这个过程可能触发mspan到mcentral的回收，最终可能回收到mheap的freelist当中。在freelist当中的内存再超过一定阈值时间后会被sysmon建议交还给内核。</p>
<h2 id="参考文章"><a href="#参考文章" class="headerlink" title="参考文章"></a>参考文章</h2><p><a href="https://github.com/golang/proposal/blob/master/design/17503-eliminate-rescan.md" target="_blank" rel="external">Proposal: Eliminate STW stack re-scanning</a></p>
<p><a href="http://int64.me/2016/go%E7%AC%94%E8%AE%B0%20-%20GC.html" target="_blank" rel="external">go笔记-GC</a></p>
<p><a href="http://www.zenlife.tk/go-gc1.5.md" target="_blank" rel="external">go1.5的垃圾回收</a></p>
<p><a href="http://legendtkl.com/2017/04/28/golang-gc/" target="_blank" rel="external">go垃圾回收剖析</a></p>

      
    