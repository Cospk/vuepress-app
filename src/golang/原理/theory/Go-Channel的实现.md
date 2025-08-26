---
title: Go Channel的实现
source_url: 'https://studygolang.com/articles/12023'
category: Go原理教程
---


						<div class="post-body" itemprop="articleBody">

<p>channel作为goroutine间通信和同步的重要途径，是Go runtime层实现CSP并发模型重要的成员。在不理解底层实现时，经常在使用中对channe相关语法的表现感到疑惑，尤其是select case的行为。因此在了解channel的应用前先看一眼channel的实现。</p>
<h2 id="Channel内存布局"><a href="#Channel内存布局" class="headerlink" title="Channel内存布局"></a>Channel内存布局</h2><p>channel是go的内置类型，它可以被存储到变量中，可以作为函数的参数或返回值，它在runtime层对应的数据结构式<strong>hchan</strong>。hchan维护了两个链表，recvq是因读这个chan而阻塞的G，sendq则是因写这个chan而阻塞的G。waitq队列中每个元素的数据结构为sudog，其中elem用于保存数据。</p>

<pre><code class="language-go">
type hchan struct {
    qcount   uint           // total data in the queue
    dataqsiz uint           // size of the circular queue
    buf      unsafe.Pointer // points to an array of dataqsiz elements
    elemsize uint16
    closed   uint32
    elemtype *_type // element type
    sendx    uint   // send index
    recvx    uint   // receive index
    recvq    waitq  // list of recv waiters
    sendq    waitq  // list of send waiters
    lock     mutex
}
type sudog struct {
    g           *g
    selectdone  *uint32
    next        *sudog
    prev        *sudog
    elem        unsafe.Pointer // data element
    releasetime int64
    nrelease    int32  // -1 for acquire
    waitlink    *sudog // g.waiting list
}
</code></pre>

<p>hchan只是channel的头部，头部后面的一段内存连续的数组将作为channel的缓冲区，即<strong>用于存放channel数据的环形队列</strong>。qcount datasize分别描述了缓冲区当前使用量和容量。若channel是无缓冲的，则size是0，就没有这个环形队列了。</p>
<p><img src="https://ninokop.github.io/2017/11/07/Go-Channel%E7%9A%84%E5%AE%9E%E7%8E%B0/channel.png" style="zoom:40%"/></p>
<p>创建chan需要知道数据类型和缓冲区大小。对应上面的结构图<code>newarray</code>将生成这个环形队列。之所以要分开指针类型缓冲区主要是为了区分gc操作，需要将它设置为<strong>flagNoScan</strong>。并且指针大小固定，可以跟hchan头部一起分配内存，不需要先<code>new(hchan)</code>再<code>newarry</code>。</p>
<blockquote>
<p>声明但不make初始化的chan是nil chan。读写nil chan会阻塞，关闭nil chan会panic。</p>
</blockquote>

<pre><code class="language-go">
func makechan(t *chantype, size int64) *hchan {
    elem := t.elem
    var c *hchan
    if elem.kind&kindNoPointers != 0 || size == 0 {
    c = (*hchan)(mallocgc(hchanSize+uintptr(size)*uintptr(elem.size), 
    nil, flagNoScan))
        if size > 0 && elem.size != 0 {
            c.buf = add(unsafe.Pointer(c), hchanSize)
        } else {
            c.buf = unsafe.Pointer(c)
        }
    } else {
        c = new(hchan)
        c.buf = newarray(elem, uintptr(size))
    }
    c.elemsize = uint16(elem.size)
    c.elemtype = elem
    c.dataqsiz = uint(size)
    return c
}
</code></pre>

<h2 id="Channel操作"><a href="#Channel操作" class="headerlink" title="Channel操作"></a>Channel操作</h2><blockquote>
<p>从实现中可见读写chan都要lock，这跟读写共享内存一样都有lock的开销。</p>
<p><strong>数据在chan中的传递方向</strong>从chansend开始从入参最终写入recvq中的goroutine的数据域，这中间如果发生阻塞可能先写入sendq中goroutine的数据域等待中转。</p>
<p>从gopark返回后sudog对象可重用。</p>
</blockquote>
<h3 id="同步读写"><a href="#同步读写" class="headerlink" title="同步读写"></a>同步读写</h3><p>写channel  <code>c<-x</code> 调用<code>runtime.chansend</code>。读channel <code><-c</code> 调用<code>runtime.chanrecv</code>。总结同步读写的过程就是：</p>
<ul>
<li>写chan时优先检查recvq中有没有等待读chan的goroutine，若有从recvq中出队sudoG。<code>syncsend</code>将要写入chan的数据ep复制给刚出队的sudoG的elem域。通过<code>goready</code>唤醒接收者G，状态设置为<code>_Grunnable</code>，之后放进P本地待运行队列。之后这个读取到数据的G可以再次被P调度了。</li>
<li>写chan时如果没有G等待读，当前G因等待写而阻塞。这时创建或获取<code>acquireSudog</code>，封装上要写入的数据进入sendq队列。同时当前G<code>gopark</code>休眠等待被唤醒。</li>
<li>读chan时优先唤醒sendq中等待写的goroutine，并从中获取数据；若没人写则将自己挂到recvq中等待唤醒。</li>
</ul>

<pre><code class="language-go">
func chansend(t *chantype, c *hchan, ep unsafe.Pointer, 
block bool, callerpc uintptr) bool {
...
    lock(&c.lock)
    if c.dataqsiz == 0 { // synchronous channel
        sg := c.recvq.dequeue()
        if sg != nil { // found a waiting receiver
            unlock(&c.lock)
            recvg := sg.g
            syncsend(c, sg, ep)
            goready(recvg, 3)
            return true
        }
        // no receiver available: block on this channel.
        mysg := acquireSudog()
        mysg.elem = ep  
        c.sendq.enqueue(mysg)
        goparkunlock(&c.lock, "chan send", traceEvGoBlockSend, 3)
        // someone woke us up.
        releaseSudog(mysg)
        return true
    }
}
</code></pre>

<pre><code class="language-go">
func chanrecv(t *chantype, c *hchan, ep unsafe.Pointer, block bool) 
(selected, received bool) {
    if c.dataqsiz == 0 { // synchronous channel
        sg := c.sendq.dequeue()
        if sg != nil {
            unlock(&c.lock)
            typedmemmove(c.elemtype, ep, sg.elem)
            gp.param = unsafe.Pointer(sg)
            goready(gp, 3)
            return true, true
        }
        // no sender available: block on this channel.
        mysg := acquireSudog()
        mysg.elem = ep
        c.recvq.enqueue(mysg)
        goparkunlock(&c.lock, "chan receive", traceEvGoBlockRecv, 3)
        // someone woke us up
        releaseSudog(mysg)
        return recvclosed(c, ep)
    }
}
</code></pre>

<h3 id="异步读写"><a href="#异步读写" class="headerlink" title="异步读写"></a>异步读写</h3><p>异步与同步的区别就是读写时会优先检查缓冲区有没有数据读或有没有空间写。并且真正读写chan后会发生缓冲区变化，这时可能之前阻塞的goroutine有机会写和读了，所以要尝试唤醒它们。 总结过程：</p>
<ul>
<li>写chan时缓冲区已满，则将当前G和数据封装好放入sendq队列中等待写入，同时挂起<code>gopark</code>当前goroutine。若缓冲区未满，则直接将数据写入缓冲区，并更新缓冲区最新数据的index以及qcount。同时尝试从recvq中唤醒<code>goready</code>一个之前<strong>因为缓冲区无数据可读而阻塞的等待读</strong>���goroutine。</li>
<li>读chan时首先看缓冲区有没有数据，若有则直接读取，并尝试唤醒一个<strong>之前因为缓冲区满而阻塞的等待写</strong>的goroutine，让它有机会写数据。若无数据可读则入队recvq。</li>
</ul>

<pre><code class="language-go">
func chansend(t *chantype, c *hchan, ep unsafe.Pointer, block bool, callerpc uintptr) bool {
    // asynchronous channel
    var t1 int64
    for futile := byte(0); c.qcount >= c.dataqsiz; futile = traceFutileWakeup {
        mysg := acquireSudog()
        c.sendq.enqueue(mysg)
        goparkunlock(&c.lock, "chan send", traceEvGoBlockSend|futile, 3)
        // someone woke us up - try again
        releaseSudog(mysg)
    }
    // write our data into the channel buffer
    typedmemmove(c.elemtype, chanbuf(c, c.sendx), ep)
    c.sendx++
    if c.sendx == c.dataqsiz {
        c.sendx = 0
    }
    c.qcount++
    // wake up a waiting receiver
    sg := c.recvq.dequeue()
    if sg != nil {
        goready(sg.g, 3)
    } 
    return true
}
</code></pre>

<pre><code class="language-go">
func chanrecv(t *chantype, c *hchan, ep unsafe.Pointer, block bool) 
(selected, received bool) {
    // asynchronous channel
    for futile := byte(0); c.qcount <= 0; futile = traceFutileWakeup {
        mysg := acquireSudog()
        c.recvq.enqueue(mysg)
        goparkunlock(&c.lock, "chan receive", traceEvGoBlockRecv|futile, 3)
        // someone woke us up - try again
        releaseSudog(mysg)
    }
    typedmemmove(c.elemtype, ep, chanbuf(c, c.recvx))
    memclr(chanbuf(c, c.recvx), uintptr(c.elemsize))
    c.recvx++
    if c.recvx == c.dataqsiz {
        c.recvx = 0
    }
    c.qcount--
    // ping a sender now that there is space
    sg := c.sendq.dequeue()
    if sg != nil {
        goready(sg.g, 3)
    }
    return true, true
}
</code></pre>

<h3 id="关闭"><a href="#关闭" class="headerlink" title="关闭"></a>关闭</h3><p>通过goready唤醒recvq中等待读的goroutine，之后唤醒所有sendq中等待写的goroutine。<strong>因此close chan相当于解除所有因它阻塞的gouroutine的阻塞。</strong></p>

<pre><code class="language-go">
func closechan(c *hchan) {
    c.closed = 1
    // release all readers
    for {
        sg := c.recvq.dequeue()
        if sg == nil {
            break
        }...
        goready(gp, 3)
    }
    // release all writers
    for {
        sg := c.sendq.dequeue()
        if sg == nil {
            break
        }...
        goready(gp, 3)
    }
}
</code></pre>

<blockquote>
<p><strong>写closed chan或关闭 closed chan会导致panic。读closed chan永远不会阻塞，会返回一个通道数据类型的零值，返回给函数的参数ep。</strong></p>
</blockquote>
<p>所以通常在close chan时需要通过读操作来判断chan是否关闭。</p>

<pre><code class="language-go">
if v, open := <- c; !open {
   // chan is closed
}
</code></pre>

<h2 id="Happens-before"><a href="#Happens-before" class="headerlink" title="Happens before"></a>Happens before</h2><p>在<a href="https://golang.org/ref/mem" target="_blank" rel="external">go memory model</a> 里讲了happens-before问题很有意思。其中有一些跟chan相关的同步规则可以解释一些一直以来的疑问，记录如下：</p>
<ul>
<li>对带缓冲chan的写操作 happens-before相应chan的读操作</li>
<li>关闭chan happens-before 从该chan读最后的返回值0</li>
<li>不带缓冲的chan的读操作 happens-before相应chan的写操作</li>
</ul>

<pre><code class="language-go">
var c = make(chan int, 10)
var a string
func f() {
  a = "hello, world"  //(1)
  c <- 0  // (2)
}
func main() {
  go f()
  <- c  //(3)
  print(a)  //(4)
}
</code></pre>

<p>(1) happens-before(2) (3) happens-before(4)，再根据规则可知(2) happens(3)。因此(1)happens-before(4)，这段代码没有问题，肯定会输出hello world。</p>

<pre><code class="language-go">
var c = make(chan int)
var a string
func f() {
  a = "hello, world"  //(1)
  <-c  // (2)
}
func main() {
  go f()
  c <- 0  //(3)
  print(a)  //(4)
}
</code></pre>

<p>同样根据规则三可知(2)happens-before(3) 最终可以保证(1) happens-before(4)。若c改成待缓冲的chan，则结果将不再有任何同步保证使得(2) happens-before(3)。</p>

