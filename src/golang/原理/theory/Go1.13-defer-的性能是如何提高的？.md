---
title: Go1.13 defer 的性能是如何提高的？
source_url: 'https://studygolang.com/articles/23352'
category: Go原理教程
---


						<p><span class="img-wrap"><img referrerpolicy="no-referrer" data-src="/img/bVbxqGP?w=1256&h=610" src="https://static.studygolang.com/190907/1702d63565dc7c3c950f9a4f3030015f.png" alt="go1.13 defer" title="go1.13 defer"/></span></p>
<p>最近 Go1.13 终于发布了，其中一个值得关注的特性就是 <strong>defer 在大部分的场景下性能提升了30%</strong>，但是官方并没有具体写是怎么提升的，这让大家非常的疑惑。而我因为之前写过<a href="https://book.eddycjy.com/golang/defer/defer.html" rel="nofollow noreferrer">《深入理解 Go defer》</a> 和 <a href="https://book.eddycjy.com/golang/talk/defer-loss.html" rel="nofollow noreferrer">《Go defer 会有性能损耗，尽量不要用？》</a> 这类文章，因此我挺感兴趣它是做了什么改变才能得到这样子的结果，所以今天和大家一起探索其中奥妙。</p>
<p>原文地址：<a href="https://book.eddycjy.com/golang/talk/go1.13-defer.html" rel="nofollow noreferrer">Go1.13 defer 的性能是如何提高的？</a></p>
<h2>一、测试</h2>
<h3>Go1.12</h3>
<pre><code>$ go test -bench=. -benchmem -run=none
goos: darwin
goarch: amd64
pkg: github.com/EDDYCJY/awesomeDefer
BenchmarkDoDefer-4          20000000            91.4 ns/op          48 B/op           1 allocs/op
BenchmarkDoNotDefer-4       30000000            41.6 ns/op          48 B/op           1 allocs/op
PASS
ok      github.com/EDDYCJY/awesomeDefer    3.234s</code></pre>
<h3>Go1.13</h3>
<pre><code>$ go test -bench=. -benchmem -run=none
goos: darwin
goarch: amd64
pkg: github.com/EDDYCJY/awesomeDefer
BenchmarkDoDefer-4          15986062            74.7 ns/op          48 B/op           1 allocs/op
BenchmarkDoNotDefer-4       29231842            40.3 ns/op          48 B/op           1 allocs/op
PASS
ok      github.com/EDDYCJY/awesomeDefer    3.444s</code></pre>
<p>在开场，我先以不标准的测试基准验证了先前的测试用例，确确实实在这两个版本中，<code>defer</code> 的性能得到了提高，但是看上去似乎不是百分百提高 30 %。</p>
<h2>二、看一下</h2>
<h3>之前（Go1.12）</h3>
<pre><code>    0x0070 00112 (main.go:6)    CALL    runtime.deferproc(SB)
    0x0075 00117 (main.go:6)    TESTL    AX, AX
    0x0077 00119 (main.go:6)    JNE    137
    0x0079 00121 (main.go:7)    XCHGL    AX, AX
    0x007a 00122 (main.go:7)    CALL    runtime.deferreturn(SB)
    0x007f 00127 (main.go:7)    MOVQ    56(SP), BP</code></pre>
<h3>现在（Go1.13）</h3>
<pre><code>    0x006e 00110 (main.go:4)    MOVQ    AX, (SP)
    0x0072 00114 (main.go:4)    CALL    runtime.deferprocStack(SB)
    0x0077 00119 (main.go:4)    TESTL    AX, AX
    0x0079 00121 (main.go:4)    JNE    139
    0x007b 00123 (main.go:7)    XCHGL    AX, AX
    0x007c 00124 (main.go:7)    CALL    runtime.deferreturn(SB)
    0x0081 00129 (main.go:7)    MOVQ    112(SP), BP</code></pre>
<p>从汇编的角度来看，像是 <code>runtime.deferproc</code> 改成了 <code>runtime.deferprocStack</code> 调用，难道是做了什么优化，我们<strong>抱着疑问</strong>继续看下去。</p>
<h2>三、观察源码</h2>
<h3>_defer</h3>
<pre><code>type _defer struct {
    siz     int32
    siz     int32 // includes both arguments and results
    started bool
    heap    bool
    sp      uintptr // sp at time of defer
    pc      uintptr
    fn      *funcval
    ...</code></pre>
<p>相较于以前的版本，最小单元的 <code>_defer</code> 结构体主要是新增了 <code>heap</code> 字段，用于标识这个 <code>_defer</code> 是在堆上，还是在栈上进行分配，其余字段并没有明确变更，那我们可以把聚焦点放在 <code>defer</code> 的堆栈分配上了，看看是做了什么事。</p>
<h3>deferprocStack</h3>
<pre><code>func deferprocStack(d *_defer) {
    gp := getg()
    if gp.m.curg != gp {
        throw("defer on system stack")
    }
    
    d.started = false
    d.heap = false
    d.sp = getcallersp()
    d.pc = getcallerpc()

    *(*uintptr)(unsafe.Pointer(&d._panic)) = 0
    *(*uintptr)(unsafe.Pointer(&d.link)) = uintptr(unsafe.Pointer(gp._defer))
    *(*uintptr)(unsafe.Pointer(&gp._defer)) = uintptr(unsafe.Pointer(d))

    return0()
}</code></pre>
<p>这一块代码挺常规的，主要是获取调用 <code>defer</code> 函数的函数栈指针、传入函数的参数具体地址以及PC（程序计数器），这块在前文 <a href="https://book.eddycjy.com/golang/defer/defer.html" rel="nofollow noreferrer">《深入理解 Go defer》</a> 有详细介绍过，这里就不再赘述了。</p>
<p>那这个 <code>deferprocStack</code> 特殊在哪呢，我们可以看到它把 <code>d.heap</code> 设置为了 <code>false</code>，也就是代表 <code>deferprocStack</code> 方法是针对将 <code>_defer</code> 分配在栈上的应用场景的。</p>
<h3>deferproc</h3>
<p>那么问题来了，它又在哪里处理分配到堆上的应用场景呢？</p>
<pre><code>func newdefer(siz int32) *_defer {
    ...
    d.heap = true
    d.link = gp._defer
    gp._defer = d
    return d
}</code></pre>
<p>那么 <code>newdefer</code> 是在哪里调用的呢，如下：</p>
<pre><code>func deferproc(siz int32, fn *funcval) { // arguments of fn follow fn
    ...
    sp := getcallersp()
    argp := uintptr(unsafe.Pointer(&fn)) + unsafe.Sizeof(fn)
    callerpc := getcallerpc()

    d := newdefer(siz)
    ...
}</code></pre>
<p>非常明确，先前的版本中调用的 <code>deferproc</code> 方法，现在被用于对应分配到堆上的场景了。</p>
<h3>小结</h3>
<ul>
<li>第一点：可以确定的是 <code>deferproc</code> 并没有被去掉，而是流程被优化了。</li>
<li>第二点：编译器会根据应用场景去选择使用 <code>deferproc</code> 还是 <code>deferprocStack</code> 方法，他们分别是针对分配在堆上和栈上的使用场景。</li>
</ul>
<h2>四、编译器如何选择</h2>
<h3>esc</h3>
<pre><code>// src/cmd/compile/internal/gc/esc.go
case ODEFER:
    if e.loopdepth == 1 { // top level
        n.Esc = EscNever // force stack allocation of defer record (see ssa.go)
        break
    }</code></pre>
<h3>ssa</h3>
<pre><code>// src/cmd/compile/internal/gc/ssa.go
case ODEFER:
    d := callDefer
    if n.Esc == EscNever {
        d = callDeferStack
    }
    s.call(n.Left, d)</code></pre>
<h3>小结</h3>
<p>这块结合来看，核心就是当 <code>e.loopdepth == 1</code> 时，会将逃逸分析结果 <code>n.Esc</code> 设置为 <code>EscNever</code>，也就是将 <code>_defer</code> 分配到栈上，那这个 <code>e.loopdepth</code> 到底又是何方神圣呢，我们再详细看看代码，如下：</p>
<pre><code>// src/cmd/compile/internal/gc/esc.go
type NodeEscState struct {
    Curfn             *Node
    Flowsrc           []EscStep 
    Retval            Nodes    
    Loopdepth         int32  
    Level             Level
    Walkgen           uint32
    Maxextraloopdepth int32
}</code></pre>
<p>这里重点查看 <code>Loopdepth</code> 字段，目前它共有三个值标识，分别是:</p>
<ul>
<li>-1：全局。</li>
<li>0：返回变量。</li>
<li>1：顶级函数，又或是内部函数的不断增长值。</li>
</ul>
<p>这个读起来有点绕，结合我们上述 <code>e.loopdepth == 1</code> 的表述来看，也就是当 <code>defer func</code> 是顶级函数时，将会分配到栈上。但是若在  <code>defer func</code> 外层出现显式的迭代循环，又或是出现隐式迭代，将会分配到堆上。其实深层表示的还是迭代深度的意思，我们可以来证实一下刚刚说的方向，显式迭代的代码如下：</p>
<pre><code>func main() {
    for p := 0; p < 10; p++ {
        defer func() {
            for i := 0; i < 20; i++ {
                log.Println("EDDYCJY")
            }
        }()
    }
}</code></pre>
<p>查看汇编情况：</p>
<pre><code>$ go tool compile -S main.go
"".main STEXT size=122 args=0x0 locals=0x20
    0x0000 00000 (main.go:15)    TEXT    "".main(SB), ABIInternal, $32-0
    ...
    0x0048 00072 (main.go:17)    CALL    runtime.deferproc(SB)
    0x004d 00077 (main.go:17)    TESTL    AX, AX
    0x004f 00079 (main.go:17)    JNE    83
    0x0051 00081 (main.go:17)    JMP    33
    0x0053 00083 (main.go:17)    XCHGL    AX, AX
    0x0054 00084 (main.go:17)    CALL    runtime.deferreturn(SB)
    ...</code></pre>
<p>显然，最终 <code>defer</code> 调用的是 <code>runtime.deferproc</code> 方法，也就是分配到堆上了，没毛病。而隐式迭代的话，你可以借助 <code>goto</code> 语句去实现这个功能，再自己验证一遍，这里就不再赘述了。</p>
<h2>总结</h2>
<p>从分析的结果上来看，官方说明的 Go1.13 defer 性能提高 30%，主要来源于其延迟对象的堆栈分配规则的改变，措施是由编译器通过对 <code>defer</code> 的 <code>for-loop</code> 迭代深度进行分析，如果 <code>loopdepth</code> 为 1，则设置逃逸分析的结果，将分配到栈上，否则分配到堆上。</p>
<p>的确，我个人觉得对大部分的使用场景来讲，是优化了不少，也解决了一些人吐槽 <code>defer</code> 性能 “差” 的问题。另外，我想从 Go1.13 起，你也需要稍微了解一下它这块的机制，别随随便便就来个狂野版嵌套迭代 <code>defer</code>，可能没法效能最大化。</p>
<p>如果你还想了解更多细节，可以看看 <code>defer</code> 这块的的<a href="https://github.com/golang/go/commit/fff4f599fe1c21e411a99de5c9b3777d06ce0ce6" rel="nofollow noreferrer">提交内容</a>，官方的测试用例也包含在里面。</p>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						