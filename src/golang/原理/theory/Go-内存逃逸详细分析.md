---
title: Go 内存逃逸详细分析
source_url: 'https://studygolang.com/articles/12994'
category: Go原理教程
---


						<div class="entry-content">
						<h2>Slice 怪异现象分析实例</h2>
<p>原贴地址：https://gocn.io/question/1852</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

import (
    "fmt"
)

func main(){
    s := []byte("")

    s1 := append(s, 'a')
    s2 := append(s, 'b')

    // 如果有此行，打印的结果是 a b，否则打印的结果是b b
    // fmt.Println(s1, "===", s2)
    fmt.Println(string(s1), string(s2))
}

</code></pre>
<p>诡异的现象：如果有行 14 的代码，则行 15 打印的结果为 <code>a b</code>， 否则打印的结果为<code>b b</code> ，本文分析的go版本：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go version
go version go1.9.2 darwin/amd64
</code></pre>
<h3>初步分析</h3>
<p>首先我们分析在没有行14的情况下，为什么打印的结果是 <code>b b</code>，这个问题相对比较简单，只要熟悉 <code>slice</code> 的实现原理，简单分析一下 <code>append</code> 的实现原理即可得出结论。</p>
<h4>slice 结构分析</h4>
<blockquote><p>
  如果熟悉 slice 的原理可以跳过该章节。
</p></blockquote>
<p>首先对于 slice 结构进行一个简单的了解 <a href="https://golang.org/src/runtime/slice.go">结构定义</a>  <code>slice</code>对应的<code>runtime</code> 包的相关源码参见： https://golang.org/src/runtime/slice.go</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">type slice struct {
    array unsafe.Pointer
    len   int
    cap   int
}
</code></pre>
<p><img src="https://www.do1618.com/wp-content/uploads/2018/05/slice_struct.png" alt=""/></p>
<p><code>var slice []int</code> 定义的变量内部结构如下：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">slice.array = nil
slice.len = 0
slice.cap = 0
</code></pre>
<p>如果我们声明了一下变量 <code>slice := []int{}</code> 或 <code>slice := make([]int, 0)</code> 的内部结构如下：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">slice.array = 0xxxxxxxx  // 分配了地址
slice.len = 0
slice.cap = 18208800
</code></pre>
<p>如果使用  <code>make([]byte, 5)</code> 定义的话，结构如下图：</p>
<p><img src="https://www.do1618.com/wp-content/uploads/2018/05/slice_internal.png" alt=""/></p>
<p>如果使用 <code>s := s[2:4]</code>，则结构如下图：</p>
<p><img src="https://www.do1618.com/wp-content/uploads/2018/05/slice_part.png" alt=""/></p>
<p>通过分析 <code>slice</code> 的反射de 实现：<a href="https://blog.golang.org/go-slices-usage-and-internals">Go Slices: usage and internals</a>，也能够在程序中进行分析。<a href="https://golang.org/pkg/reflect/#SliceHeader"><code>slice</code> 反射中对应的结构体</a></p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">// slice 对应的结构体
type SliceHeader struct {
        Data uintptr
        Len  int
        Cap  int
}

// string 对应结构体
type StringHeader struct {
        Data uintptr
        Len  int
}
</code></pre>
<p>下面的函数可以直接获取 <code>slice</code> 的底层指针：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">func bytePointer(b []byte) unsafe.Pointer {
   // slice 的指针本质是*reflect.SliceHeader
  p := (*reflect.SliceHeader)(unsafe.Pointer(&b))
  return unsafe.Pointer(p.Data)
}
</code></pre>
<h4>append 原理实现</h4>
<p><a href="https://golang.org/doc/effective_go.html#slices">Append 的实现伪代码</a>，代码默认已经支持了 <code>slice</code> 为 <code>nil</code> 的情况</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">func Append(slice, data []byte) []byte {
    l := len(slice)
    if l + len(data) > cap(slice) {  // reallocate
        // Allocate double what's needed, for future growth.
        newSlice := make([]byte, (l+len(data))*2)
        // The copy function is predeclared and works for any slice type.
        copy(newSlice, slice)
        slice = newSlice
    }
    slice = slice[0:l+len(data)]
    copy(slice[l:], data)
    return slice
}
</code></pre>
<p><code>append</code> 函数原型如下，其中 T 为通用类型。</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">func append(s []T, x ...T) []T
</code></pre>
<h4>展开分析</h4>
<p>为了方便程序分析的，我们在程序中添加打印信息，代码和结果如下：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

import (
    "fmt"
)

func main() {
    s := []byte("")
    println(s) // 添加用于打印信息, println() print() 为go内置函数，直接输出到 stderr 无缓存

    s1 := append(s, 'a')
    s2 := append(s, 'b')

    // fmt.Println(s1, "===", s2)
    fmt.Println(string(s1), string(s2))
}

</code></pre>
<p>运行程序结果如下：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go run q.go
[0/32]0xc420045ef8
b b
</code></pre>
<p>结果运行后 <code>s := []byte("")</code> 初始化以后结构内部如下：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">s.len = 0 
s.cap = 32
s.ptr = 0xc420045ef8
</code></pre>
<p>我们分析以下两行代码调用会发生什么：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">s1 := append(s, 'a')
s2 := append(s, 'b')
</code></pre>
<p><code>s1 := append(s, 'a')</code> 代码调用分析：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">// slice = s  data = `a`   slice.len = 0 slice.cap = 32      
func Append(slice, data []byte) []byte {
    l := len(slice) // l = 0

    // l = 0 len(data) = 1  cap(slice) = 32   1 + 1 > 32 false
    if l + len(data) > cap(slice) { 
        newSlice := make([]byte, (l+len(data))*2)
        copy(newSlice, slice)
        slice = newSlice
    }
    // l = 0 len(data) = 1
    slice = slice[0:l+len(data)] // slice = slice[0:1]
    copy(slice[l:], data)  // 调用变成： copy(slice[0:], 'a') 
    return slice // 由于未涉及到重分配，因此返回的还是原来的 slice 对象
}
</code></pre>
<p><code>s2 := append(s, 'b')</code> 的分析完全一样。</p>
<p>简化 <code>apend</code> 函数的处理路径，在没有进行 <code>slice</code> 重新分配内存情况下，直接进行展开分析：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">s1 := append(s, 'a')
s2 := append(s, 'b')
</code></pre>
<p>等价于</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">s1 := copy(s[0:], 'a')
s2 := copy(s[0:], 'b') // 直接覆盖了上的赋值
</code></pre>
<p>基于上述分析，能够很好地解释代码输出<code>b b</code>的情况。但是如何避免出现这种类型的情况呢？问题出现在这条语句上</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">s := []byte("")
</code></pre>
<p>语句执行后 <code>s.len = 0 s.cap = 32</code>，导致了 <code>append</code> 的工作不能够正常工作，那么正常如何使用？只要将 <code>s.len = s.cap = 0</code> 则会导致 <code>slice</code> 在 <code>append</code> 中重新进行分配则可以避免这种情况的发生。</p>
<p>正确的写法应该为：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">func main() {
    // Notice []byte("") ->  []byte{}    或者  var s []byte
    s := []byte{}  

    s1 := append(s, 'a')
    s2 := append(s, 'b')

    // fmt.Println(s1, "===", s2)
    fmt.Println(string(s1), string(s2))
}
</code></pre>
<p>由此也可以看出一个良好的编程习惯是可以规避很多莫名其妙的问题排查。</p>
<h3>深入分析</h3>
<p>那么既然 bug 出现在了 <code>s := []byte("")</code>这句话中，那么这条语句为什么会导致 <code>s.cap = 32</code> 呢？这条语句背后隐藏的逻辑是什么呢?</p>
<p><code>s := []byte("")</code> 等价于以下代码：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">// 初始化字符串
str := ""

// 将字符串转换成 []byte
s := []byte(str)
</code></pre>
<p>在go语言中  <code>s := []byte(str)</code> 的底层其实是调用了 <a href="https://github.com/golang/go/blob/master/src/runtime/string.go#L154"><code>stringtoslicebyte</code></a> 实现的，该函数位于 go 的 <code>runtime</code>包中。</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">const tmpStringBufSize = 32

type tmpBuf [tmpStringBufSize]byte

func stringtoslicebyte(buf *tmpBuf, s string) []byte {
    var b []byte
    // 如果字符串 s 的长度内部长度不超过 32， 那么就直接分配一个 32 直接的大小
    if buf != nil && len(s) <= len(buf) { 
        *buf = tmpBuf{}
        b = buf[:len(s)]
    } else {
        b = rawbyteslice(len(s))
    }
    copy(b, s)
    return b
}
</code></pre>
<p>如果字符串的大小没有超过 32 长度的大小，则默认分配一个 32 长度的 buf，这也是我们上面分析 <code>s.cap = 32</code> 的由来。</p>
<p>到此为止，我们仍然没有分析问题中 <code>fmt.Println(s1, "===", s2)</code> 这句打印注释掉就能够正常工作的原因？那么最终到底是什么样的情况呢？</p>
<h3>最终分析</h3>
<p>最后我们来启用魔法的开关 <code>fmt.Println(s1, "===", s2)</code>, 来进行最后谜底的揭晓：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

import (
    "fmt"
)

func main() {
    s := []byte("")
    println(s) // 添加用于打印信息

    s1 := append(s, 'a')
    s2 := append(s, 'b')

    fmt.Println(s1, "===", s2)
    fmt.Println(string(s1), string(s2))
}
</code></pre>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go run q.go
[0/0]0x115b820   # 需要注意 s.len = 0 s.cap = 0
[97] === [98]    # 取消了打印的注释
a b              # 打印一切正常
</code></pre>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go run -gcflags '-S -S' q.go
....
    0x0032 00050 (q.go:8)   MOVQ    $0, (SP)
    0x003a 00058 (q.go:8)   MOVQ    $0, 8(SP)
    0x0043 00067 (q.go:8)   MOVQ    $0, 16(SP)
    0x004c 00076 (q.go:8)   PCDATA  $0, $0
    0x004c 00076 (q.go:8)   CALL    runtime.stringtoslicebyte(SB)
    0x0051 00081 (q.go:8)   MOVQ    32(SP), AX
    0x0056 00086 (q.go:8)   MOVQ    AX, "".s.len+96(SP)
    0x005b 00091 (q.go:8)   MOVQ    40(SP), CX
    0x0060 00096 (q.go:8)   MOVQ    CX, "".s.cap+104(SP)
    0x0065 00101 (q.go:8)   MOVQ    24(SP), DX
    0x006a 00106 (q.go:8)   MOVQ    DX, "".s.ptr+136(SP)

....
</code></pre>
<p>通过分析发现底层调用的仍然是 <code>runtime.stringtoslicebyte()</code>, 但是行为却发生了变化  <code>s.len = s.cap = 0</code>，很显然由于 <code>fmt.Println(s1, "===", s2)</code> 行的出现导致了 <code>s := []byte("")</code>内存分配的情况发生了变化。</p>
<p>我们可以通过 go build 提供的内存分配工具进行分析：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">$ go build -gcflags "-m -m" q.go
# command-line-arguments
./q.go:7:6: cannot inline main: non-leaf function
./q.go:14:13: s1 escapes to heap
./q.go:14:13:   from ... argument (arg to ...) at ./q.go:14:13
./q.go:14:13:   from *(... argument) (indirection) at ./q.go:14:13
./q.go:14:13:   from ... argument (passed to call[argument content escapes]) at ./q.go:14:13
./q.go:8:13: ([]byte)("") escapes to heap
./q.go:8:13:    from s (assigned) at ./q.go:8:4
./q.go:8:13:    from s1 (assigned) at ./q.go:11:5
./q.go:8:13:    from s1 (interface-converted) at ./q.go:14:13
./q.go:8:13:    from ... argument (arg to ...) at ./q.go:14:13
./q.go:8:13:    from *(... argument) (indirection) at ./q.go:14:13
./q.go:8:13:    from ... argument (passed to call[argument content escapes]) at ./q.go:14:13

</code></pre>
<p>以上输出中的 <code>s1 escapes to heap</code> 和 <code>([]byte)("") escapes to heap</code> 表明，由于 <code>fmt.Println(s1, "===", s2)</code> 代码的引入导致了变量分配模型的变化。简单点讲就是从栈中逃逸到了堆上。内存逃逸的分析我们会在后面的章节详细介绍。问题到此，大概的思路已经有了，但是我们如何通过代码层面进行验证呢? 通过搜索 go 源码实现调用的函数 <code>runtime.stringtoslicebyte</code> 的地方进行入手。通过搜索发现调用的文件在 <a href="https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/walk.go#L1643:7"><code>cmd/compile/internal/gc/walk.go</code></a></p>
<p><a href="https://github.com/golang/go/blob/10529a01fd8b0d5cc07eb3f6aa00a0272597684b/src/cmd/compile/internal/gc/walk.go#L1643:7">关于 string到[]byte 分析调用的代码如下</a></p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">    case OSTRARRAYBYTE:
        a := nodnil()  // 分配到堆上的的默认行为

        if n.Esc == EscNone {
            // Create temporary buffer for slice on stack.
            t := types.NewArray(types.Types[TUINT8], tmpstringbufsize)

            a = nod(OADDR, temp(t), nil)  // 分配在栈上，大小为32
        }

        n = mkcall("stringtoslicebyte", n.Type, init, a, conv(n.Left, types.Types[TSTRING]))
</code></pre>
<p><a href="https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/syntax.go#L595:2">OSTRARRAYBYTE 定义</a></p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">OSTRARRAYBYTE    // Type(Left) (Type is []byte, Left is a string)
</code></pre>
<p>上述代码中的 <code>n.Esc == EscNone</code> 条件分析则表明了发生内存逃逸和不发生内存逃逸的情况下，初始化的方式是不同的。 <a href="https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/esc.go#L342:2">EscNone 的定义</a>：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">EscNone           // Does not escape to heap, result, or parameters.
</code></pre>
<p>通过以上分析，我们总算找到了魔法的最终谜底。 以上分析的go语言版本基于 1.9.2，不同的go语言的内存分配机制可能不同，具体可以参见我同事更加详细的分析 <a href="https://github.com/mushroomsir/blog/blob/master/Go%E4%B8%ADstring%E8%BD%AC%5B%5Dbyte%E7%9A%84%E9%99%B7%E9%98%B1.md"><strong>Go中string转[]byte的陷阱.md</strong></a></p>
<h2>Go 内存管理</h2>
<p>Go 语言能够自动进行内存管理，避免了 C 语言中的内存自己管理的麻烦，但是同时对于代码的内存管理和回收细节进行了封装，也潜在增加了系统调试和优化的难度。同时，内存自动管理也是一项非常困难的事情，比如函数的多层调用、闭包调用、结构体或者管道的多次赋值、切片和MAP、CGO调用等多种情况综合下，往往会导致自动管理优化机制失效，退化成原始的管理状态；go 中的内存回收（GC）策略也在不断地优化过程。Golang 从第一个版本以来，GC 一直是大家诟病最多的，但是每一个版本的发布基本都伴随着 GC 的改进。下面列出一些比较重要的改动。</p>
<ul>
<li>v1.1 STW</li>
<li>v1.3 Mark STW, Sweep 并行</li>
<li>v1.5 三色标记法</li>
<li>v1.8 hybrid write barrier</li>
</ul>
<p>预热基础知识：<a href="https://golang.org/doc/faq#stack_or_heap">How do I know whether a variable is allocated on the heap or the stack?</a></p>
<h2>逃逸分析-Escape Analysis</h2>
<blockquote><p>
  更深入和细致的了解建议阅读 <a href="https://www.ardanlabs.com/blog/2017/05/language-mechanics-on-escape-analysis.html">William Kennedy 的 4 篇 Post</a>
</p></blockquote>
<p>go 没有像 C 语言那样提供精确的堆与栈分配控制，由于提供了内存自动管理的功能，很大程度上模糊了堆与栈的界限。例如以下代码：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

func main() {
    str := GetString()
    _ = str
}

func GetString() *string {
    var s string
    s = "hello"
    return &s
}
</code></pre>
<p>行 10 中的变量 <code>s = "hello"</code> 尽管声明在了 <code>GetString()</code> 函数内，但是在 <code>main</code> 函数中却仍然能够访问到返回的变量；这种在函数内定义的局部变量，能够突破自身的范围被外部访问的行为称作逃逸，也即通过逃逸将变量分配到堆上，能够跨边界进行数据共享。</p>
<p><a href="https://en.wikipedia.org/wiki/Escape_analysis"><code>Escape Analysis</code></a>  技术就是为该场景而存在的；通过 <code>Escape Analysis</code> 技术，编译器会在编译阶段对代码做了分析，当发现当前作用域的变量没有跨出函数范围，则会自动分配在 <code>stack</code> 上，反之则分配在 <code>heap</code> 上。 go 的内存回收针对的也是堆上的对象。go 语言中 <code>Escape Analysis</code>还未看到官方 <code>spec</code> 的文档，因此很多特性需要进行代码尝试和分析才能得出结论，而且 go <code>Escape Analysis</code> 的实现还存在很多<a href="https://docs.google.com/document/d/1CxgUBPlx9iJzkz9JWkb6tIpTe5q32QDmz8l0BouG0Cw/preview">不完善的地方</a>。</p>
<blockquote><p>
  <strong>stack allocation is cheap and heap allocation is expensive</strong>.
</p></blockquote>
<h2>Go 语言逃逸分析实现</h2>
<blockquote><p>
  更多内存建议阅读 <a href="https://segment.com/blog/allocation-efficiency-in-high-performance-go-services/">Allocation efficiency in high-performance Go services</a>
</p></blockquote>
<p>2.go</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

import "fmt"

func main() {
        x := 42
        fmt.Println(x)
}
</code></pre>
<p>go build 工具中的 flag <code>-gcflags '-m'</code> 可以用来分析内存逃逸的情况汇总，最多可以提供 4 个 "-m", m 越多则表示分析的程度越详细，一般情况下我们可以采用两个 m 分析。</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go build -gcflags '-m -l' 2.go
# command-line-arguments
./2.go:7:13: x escapes to heap
./2.go:7:13: main ... argument does not escape

# -l disable inline， 也可以调用的函数前添加注释 
$ go build -gcflags '-m -m -l' 2.go
# command-line-arguments
./2.go:7:13: x escapes to heap
./2.go:7:13:    from ... argument (arg to ...) at ./2.go:7:13
./2.go:7:13:    from *(... argument) (indirection) at ./2.go:7:13
./2.go:7:13:    from ... argument (passed to call[argument content escapes]) at ./2.go:7:13
./2.go:7:13: main ... argument does not escape
</code></pre>
<p>上例中的 <code>x escapes to heap</code> 则表明了变量 <code>x</code> 变量逃逸到了堆（heap）上。其中 <code>-l</code> 表示不启用 <code>inline</code> 模式调用，否则会使得分析更加复杂，也可以在函数上方添加注释 <code>//go:noinline</code>禁止函数 inline调用。至于调用 <code>fmt.Println()</code>为什么会导致 <code>x escapes to heap</code>，可以参考 <a href="https://github.com/golang/go/issues/19720#event-1015714692">Issue #19720</a> 和 <a href="https://github.com/golang/go/issues/8618">Issue #8618</a>，对于上述 <code>fmt.Println()</code> 的行为我们可以通过以下代码进行简单模拟测试，效果基本一样：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

type pp struct {
    arg interface{}
}

func MyPrintln(a ...interface{}) {
    Fprintln(a...)
}

func Fprintln(a ...interface{}) (n int, err error) {
    pp := new(pp)
    pp.arg = a  // 此处导致了内存的逃逸
    return
}

func main() {
    x := 42
    MyPrintln(x)
}
</code></pre>
<p>内存逃逸分析结果如下：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go build -gcflags '-m -m -l' 3.go
# command-line-arguments
./3.go:13:9: a escapes to heap
./3.go:13:9:    from pp.arg (star-dot-equals) at ./3.go:13:9
./3.go:11:45: leaking param: a
./3.go:11:45:   from a (interface-converted) at ./3.go:13:9
./3.go:11:45:   from pp.arg (star-dot-equals) at ./3.go:13:9
./3.go:12:11: Fprintln new(pp) does not escape
./3.go:7:21: leaking param: a
./3.go:7:21:    from a (passed to call[argument escapes]) at ./3.go:8:10
./3.go:19:11: ... argument escapes to heap
./3.go:19:11:   from ... argument (passed to call[argument escapes]) at ./3.go:19:11
./3.go:19:11: x escapes to heap
./3.go:19:11:   from ... argument (arg to ...) at ./3.go:19:11
./3.go:19:11:   from ... argument (passed to call[argument escapes]) at ./3.go:19:11
</code></pre>
<p>逃逸的常见情况分析参见： http://www.agardner.me/golang/garbage/collection/gc/escape/analysis/2015/10/18/go-escape-analysis.html</p>
<p>主要原因如下：变量 <code>x</code> 虽为 int 类型，但是在传递给函数 <code>MyPrintln</code>函数中被转换成 <code>interface{}</code> 类型，因为 <code>interface{}</code> 类型中包含指向数据的地址，因此 <code>x</code> 在传递到函数 <code>MyPrintln</code>过程中进行了一个内存重新分配的过程，由于 <code>pp.arg = a</code> 结构体中的字段赋值的引用，导致了后续变量的逃逸到了堆上。如果将上述 <code>pp.arg = a</code> 注释掉，则不会出现内存逃逸的情况。</p>
<p>导致内存逃逸的情况比较多，有些可能还是官方未能够实现精确的分析逃逸情况的 bug，简单一点来讲就是如果变量的作用域不会扩大并且其行为或者大小能够在编译的时候确定，一般情况下都是分配到栈上，否则就可能发生内存逃逸分配到堆上。</p>
<p>简单总结一下有以下几类情况：</p>
<ol start="1.">
<li>发送指针的指针或值包含了指针到 <code>channel</code> 中，由于在编译阶段无法确定其作用域与传递的路径，所以一般都会逃逸到堆上分配。<p></p>
</li>
<li>
<p><code>slices</code> 中的值是指针的指针或包含指针字段。一个例子是类似<code>[] *string</code> 的类型。这总是导致 <code>slice</code> 的逃逸。即使切片的底层存储数组仍可能位于堆栈上，数据的引用也会转移到堆中。</p>
</li>
<li>
<p><code>slice</code> 由于 <code>append</code> 操作超出其容量，因此会导致 <code>slice</code> 重新分配。这种情况下，由于��编译时 <code>slice</code> 的初始大小的已知情况下，将会在栈上分配。如果 <code>slice</code> 的底层存储必须基于仅在运行时数据进行扩展，则它将分配在堆上。</p>
</li>
<li>
<p>调用接口类型的方法。接口类型的方法调用是动态调度 - 实际使用的具体实现只能在运行时确定。考虑一个接口类型为 <code>io.Reader</code> 的变量 r。对 <code>r.Read(b)</code> 的调用将导致 <code>r</code> 的值和字节片<code>b</code>的后续转义并因此分配到堆上。 参考 http://npat-efault.github.io/programming/2016/10/10/escape-analysis-and-interfaces.html</p>
</li>
<li>
<p>尽管能够符合分配到栈的场景，但是其大小不能够在在编译时候确定的情况，也会分配到堆上</p>
</li>
</ol>
<h3>关于指针</h3>
<p>关于指针的使用多数情况下我们会受一个前提影响：“指针传递过程不涉及到底层数据拷贝，因此效率更高”，而且一般情况下也的确是如此。</p>
<p>但是由于指针的访问是间接寻址，也就是说访问到了指针保存的地址后，还需要根据保存的地址再进行一次访问，才能获取到指针所指向的数据，另外一种情况对于指针在使用的时候还需要进行 nil 情况的判断，以防止 panic 的发生，更重要的是指针所指向的地址多数是保存在堆上，在涉及到内存收回的情况下，指针的存在可能会让程序的性能大打折扣。除此之外由于指针的间接访问，还会导致缓存的优化失效，可以参考 <a href="https://en.wikipedia.org/wiki/Locality_of_reference">Locality of reference</a>，当前在缓存中拷贝少量数据与指针的访问相比，性能上基本上可以等同。</p>
<p>综上所述，指针的使用也不是没有代价的，需要合理进行使用。</p>
<blockquote><p>
  “the garbage collector will skip regions of memory that it can prove will contain no pointers”</p>
<p>  简单点讲，如果在堆上分配的结构中指针比较少，回收的机制会比较简单，应该会提升回收的效率，需要通过了解 go 回收算法进行相关测试 。 TODO
</p></blockquote>
<h3>关于接口转换</h3>
<p>接口实现参见： <a href="https://research.swtch.com/interfaces">Go Data Structures: Interfaces</a> <a href="https://stackoverflow.com/questions/15952519/go-interfaces-static-vs-dynamic-binding">Go interfaces: static vs dynamic binding</a></p>
<p><img src="https://www.do1618.com/wp-content/uploads/2018/05/binary.png" alt=""/></p>
<p><img src="https://www.do1618.com/wp-content/uploads/2018/05/gointer2.png" alt=""/></p>
<p>上图展示了一个 Binary 对象转换成一个 Stringer 接口后的数据结构。检查类型是否匹配 <code>s.tab->type</code> 即可。</p>
<p>go 语言中的 <code>interface</code> 接口，在编译时候的时候会进行隐式转换的静态检查，但是显示的 <code>interface</code> 到 <code>interface</code> 的转换可以在运行时查询方法集，动态检测比如：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">type Stringer interface {
    String() string
}

if v, ok := any.(Stringer); ok {
        return v.String()
 }
</code></pre>
<p>关于 <code>Itab</code> 结构的计算，由于（<code>interface</code>、<code>type</code>）对的不确定性，go 编译器或者链接器不可能在编译的时候计算两者的对应关系，而且即使能够计算出来也可能是绝大多数的对应关系在实际中不适用；因此 go 编译器会在编译的过程中对于 <code>interface</code> 和 <code>type</code> 中的方法生成一个相关的描述结构，分别记录 <code>interface</code> 和 <code>type</code> 各自对应的方法集合，go 语言会在 <code>type</code> 实际的动态转换成 <code>interface</code> 过程中，将 <code>interafce</code> 中定义的方法在 <code>type</code> 中一一进行对比查找，并完善 <code>Itab</code> 结构，并将 <code>Itab</code> 结构进行缓存提升性能。</p>
<p>综上所述，go 中的接口类型的方法调用是动态调度，因此不能够在编译阶段确定，所有类型结构转换成接口的过程会涉及到内存逃逸的情况发生。<strong>如果对于性能要求比较高且访问频次比较高的函数调用，应该尽量避免使用接口类型</strong>。</p>
<p>以下样例参考：http://npat-efault.github.io/programming/2016/10/10/escape-analysis-and-interfaces.html</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

// go build -gcflags '-m -m -l' 5.go

type S struct {
    s1 int
}

func (s *S) M1(i int) { s.s1 = i }

type I interface {
    M1(int)
}

func main() {
    var s1 S // this escapes
    var s2 S // this does not

    f1(&s1)
    f2(&s2)
}

func f1(s I)  { s.M1(42) }
func f2(s *S) { s.M1(42) }
</code></pre>
<p>逃逸分析确认：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">go build -gcflags '-m -m -l' 5.go
# command-line-arguments
./5.go:9:18: (*S).M1 s does not escape
./5.go:23:11: leaking param: s
./5.go:23:11:   from s.M1(42) (receiver in indirect call) at ./5.go:23:21
./5.go:24:12: f2 s does not escape
./5.go:19:5: &s1 escapes to heap
./5.go:19:5:    from &s1 (passed to call[argument escapes]) at ./5.go:19:4
./5.go:19:5: &s1 escapes to heap
./5.go:19:5:    from &s1 (interface-converted) at ./5.go:19:5
./5.go:19:5:    from &s1 (passed to call[argument escapes]) at ./5.go:19:4
./5.go:16:6: moved to heap: s1
./5.go:20:5: main &s2 does not escape
<autogenerated>:1:0: leaking param: .this
<autogenerated>:1:0:    from .this.M1(.anon0) (receiver in indirect call) at <autogenerated>:1:0
</code></pre>
<p>性能测试分析：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main_test

import "testing"

// go test -bench . --benchmem -gcflags "-N -l" 5_test.go

type S struct {
    s1 int
}

func (s *S) M1(i int) {
    s.s1 = i
}

type I interface {
    M1(int)
}

func f1(s I)  { s.M1(86) }
func f2(s *S) { s.M1(86) }

func BenchmarkTestInterface(b *testing.B) {
    var s1 S
    for i := 0; i < b.N; i++ {
        f1(&s1)
    }
}

func BenchmarkTestNoInterface(b *testing.B) {
    var s2 S
    for i := 0; i < b.N; i++ {
        f2(&s2)
    }
}
</code></pre>
<p>禁止使用 <code>inline</code> 方式的函数调用性能报告：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash"># 禁止使用 inline
$ go test -bench . --benchmem -gcflags "-N -l" 5_test.go
goos: darwin
goarch: amd64
BenchmarkTestInterface-8        300000000            4.50 ns/op        0 B/op          0 allocs/op
BenchmarkTestNoInterface-8      500000000            3.80 ns/op        0 B/op          0 allocs/op
PASS
ok      command-line-arguments  4.094s

</code></pre>
<p>启用了 <code>inline</code> 方式的函数调用性能报告：</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash"># 如果启用了 inline，性能差别非常明显
$ go test -bench . --benchmem  5_test.go
goos: darwin
goarch: amd64
BenchmarkTestInterface-8        500000000            3.45 ns/op        0 B/op          0 allocs/op
BenchmarkTestNoInterface-8      2000000000           0.29 ns/op        0 B/op          0 allocs/op
PASS
ok      command-line-arguments  2.685s

</code></pre>
<h3>关于切片</h3>
<p>由于切片一般都是使用在函数传递的场景下，而且切片在 <code>append</code> 的时候可能会涉及到重新分配内存，如果切片在编译期间的大小不能够确认或者大小超出栈的限制，多数情况下都会分配到堆上。</p>
<h4>大小验证</h4>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

func main() {
    s := make([]byte, 1, 1*1024)
    _ = s
}
</code></pre>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go build -gcflags "-m -m" slice_esc.go
# command-line-arguments
./slice_esc.go:3:6: can inline main as: func() { s := make([]byte, 1, 1 * 1024); _ = s }
./slice_esc.go:4:11: main make([]byte, 1, 1 * 1024) does not escape
</code></pre>
<p>如果 <code>slice</code> 大小超过 64k，则会分配到堆上 （go 1.9.2)</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

func main() {
    s := make([]byte, 1, 64*1024) // 64k
    _ = s
}
</code></pre>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go build -gcflags "-m -m" slice_esc.go
# command-line-arguments
./slice_esc.go:3:6: can inline main as: func() { s := make([]byte, 1, 64 * 1024); _ = s }
./slice_esc.go:4:11: make([]byte, 1, 64 * 1024) escapes to heap
./slice_esc.go:4:11:    from make([]byte, 1, 64 * 1024) (too large for stack) at ./slice_esc.go:4:11

</code></pre>
<h4>指针类型切片验证</h4>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

func main() {
    s := make([]*string, 1, 100)
    str := "hello"
    s = append(s, &str)
    _ = s
}
</code></pre>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-bash">$ go build -gcflags "-m -m -l" slice_esc.go
# command-line-arguments
./slice_esc.go:6:16: &str escapes to heap
./slice_esc.go:6:16:    from append(s, &str) (appended to slice) at ./slice_esc.go:6:12
./slice_esc.go:5:9: moved to heap: str
./slice_esc.go:4:11: main make([]*string, 1, 100) does not escape

</code></pre>
<p>对于保存在  <code>[]*string</code> 中的字符串都会直接在堆上分配。</p>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">package main

import "math/rand"

func main() {
    randSize := rand.Int()
    s := make([]*string, 0, randSize)
    str := "hello"
    s = append(s, &str)
    _ = s
}
</code></pre>
<pre class="line-numbers prism-highlight" data-start="1"><code class="language-go">$ go build -gcflags "-m -m -l" slice_esc.go
# command-line-arguments
./slice_esc.go:7:11: make([]*string, 0, randSize) escapes to heap
./slice_esc.go:7:11:    from make([]*string, 0, randSize) (too large for stack) at ./slice_esc.go:7:11
./slice_esc.go:9:16: &str escapes to heap
./slice_esc.go:9:16:    from append(s, &str) (appended to slice) at ./slice_esc.go:9:12
./slice_esc.go:8:9: moved to heap: str
</code></pre>
<p>由于  <code>s := make([]*string, 0, randSize)</code> 大小不能编译确定，所以会逃逸到堆上。</p>
<p><!-- md copyright.md --></p>
<h2>参考</h2>
<ol start="1.">
<li><a href="https://maqian.io/coding/golang-escape.html">Golang 内存逃逸分析</a></li>
<li><a href="https://halfrost.com/go_slice/">深入解析 Go 中 Slice 底层实现</a>  ***</li>
<li><a href="https://www.otokaze.cn/2018/golang-escape-analysis-with-clang.html">以C视角来理解Go内存逃逸</a></li>
<li><a href="https://gocn.io/article/467">golang string和[]byte的对比</a></li>
<li><a href="https://blog.golang.org/go-slices-usage-and-internals">Go Slices: usage and internals</a></li>
<li><a href="https://stackoverflow.com/questions/31790311/where-is-append-implementation">Where is append() implementation?</a></li>
<li><a href="https://github.com/golang/go/wiki/SliceTricks">SliceTricks</a> ***</li>
<li><a href="https://github.com/golang/go/issues/24972">Variadic func changes []byte(s) cap #24972</a></li>
<li><a href="https://github.com/golang/go/issues/24163">spec: clarify that conversions to slices don't guarantee slice capacity? #24163</a></li>
<li><a href="http://www.agardner.me/golang/garbage/collection/gc/escape/analysis/2015/10/18/go-escape-analysis.html">Golang escape analysis</a> ***</li>
<li><a href="https://docs.google.com/document/d/1CxgUBPlx9iJzkz9JWkb6tIpTe5q32QDmz8l0BouG0Cw/preview#">Go Escape Analysis Flaws</a></li>
<li><a href="https://www.cc.gatech.edu/~harrold/6340/cs6340_fall2009/Readings/choi99escape.pdf">Escape Analysis for Java</a></li>
<li><a href="https://www.ardanlabs.com/blog/2017/05/language-mechanics-on-escape-analysis.html">Language Mechanics On Escape Analysis</a>  <a href="https://studygolang.com/articles/12444">中文</a> <a href="https://blog.csdn.net/weixin_38975685/article/details/79788273">中文2</a></li>
<li><a href="https://segment.com/blog/allocation-efficiency-in-high-performance-go-services/">Allocation efficiency in high-performance Go services</a> ***</li>
<li><a href="https://blog.golang.org/profiling-go-programs">Profiling Go Programs</a></li>
<li><a href="https://github.com/mushroomsir/blog/blob/master/Go%E4%B8%ADstring%E8%BD%AC%5B%5Dbyte%E7%9A%84%E9%99%B7%E9%98%B1.md">https://github.com/mushroomsir/blog/blob/master/Go%E4%B8%ADstring%E8%BD%AC%5B%5Dbyte%E7%9A%84%E9%99%B7%E9%98%B1.md</a></li>
<li><a href="https://kuree.gitbooks.io/the-go-programming-language-report/">the-go-programming-language-report</a></li>
<li>https://golang.org/doc/faq</li>
<li><a href="http://colobu.com/2017/12/28/top-golang-articles-of-2017/">年终盘点！2017年超有价值的Golang文章</a></li>
<li><a href="http://legendtkl.com/2017/04/28/golang-gc/">Golang 垃圾回收剖析</a></li>
<li><a href="http://www.opscoder.info/golang_gc.html">深入Golang之垃圾回收</a></li>
</ol>
					