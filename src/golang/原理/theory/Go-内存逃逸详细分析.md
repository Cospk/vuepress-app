---
title: Go 内存逃逸详细分析
source_url: 'https://studygolang.com/articles/12994'
category: Go原理教程
---
```

## Slice 怪异现象分析实例

```
 原贴地址：https://gocn.io/question/1852 
```
go package main import ( "fmt" ) func main(){ s := \[\]byte("") s1 := append(s, 'a') s2 := append(s, 'b') // 如果有此行，打印的结果是 a b，否则打印的结果是b b // fmt.Println(s1, "===", s2) fmt.Println(string(s1), string(s2)) } 
```
 诡异的现象：如果有行 14 的代码，则行 15 打印的结果为 \`a b\`， 否则打印的结果为\`b b\` ，本文分析的go版本： 
```
bash $ go version go version go1.9.2 darwin/amd64 
```
 ### 初步分析 首先我们分析在没有行14的情况下，为什么打印的结果是 \`b b\`，这个问题相对比较简单，只要熟悉 \`slice\` 的实现原理，简单分析一下 \`append\` 的实现原理即可得出结论。 #### slice 结构分析 > 如果熟悉 slice 的原理可以跳过该章节。 首先对于 slice 结构进行一个简单的了解 \[结构定义\](https://golang.org/src/runtime/slice.go) \`slice\`对应的\`runtime\` 包的相关源码参见： https://golang.org/src/runtime/slice.go 
```
go type slice struct { array unsafe.Pointer len int cap int } 
```
 !\[\](https://www.do1618.com/wp-content/uploads/2018/05/slice\_struct.png) \`var slice \[\]int\` 定义的变量内部结构如下： 
```
go slice.array = nil slice.len = 0 slice.cap = 0 
```
 如果我们声明了一下变量 \`slice := \[\]int{}\` 或 \`slice := make(\[\]int, 0)\` 的内部结构如下： 
```
go slice.array = 0xxxxxxxx // 分配了地址 slice.len = 0 slice.cap = 18208800 
```
 如果使用 \`make(\[\]byte, 5)\` 定义的话，结构如下图： !\[\](https://www.do1618.com/wp-content/uploads/2018/05/slice\_internal.png) 如果使用 \`s := s\[2:4\]\`，则结构如下图： !\[\](https://www.do1618.com/wp-content/uploads/2018/05/slice\_part.png) 通过分析 \`slice\` 的反射de 实现：\[Go Slices: usage and internals\](https://blog.golang.org/go-slices-usage-and-internals)，也能够在程序中进行分析。\[\`slice\` 反射中对应的结构体\](https://golang.org/pkg/reflect/#SliceHeader) 
```
go // slice 对应的结构体 type SliceHeader struct { Data uintptr Len int Cap int } // string 对应结构体 type StringHeader struct { Data uintptr Len int } 
```
 下面的函数可以直接获取 \`slice\` 的底层指针： 
```
go func bytePointer(b \[\]byte) unsafe.Pointer { // slice 的指针本质是\*reflect.SliceHeader p := (\*reflect.SliceHeader)(unsafe.Pointer(&b)) return unsafe.Pointer(p.Data) } 
```
 #### append 原理实现 \[Append 的实现伪代码\](https://golang.org/doc/effective\_go.html#slices)，代码默认已经支持了 \`slice\` 为 \`nil\` 的情况 
```
go func Append(slice, data \[\]byte) \[\]byte { l := len(slice) if l + len(data) > cap(slice) { // reallocate // Allocate double what's needed, for future growth. newSlice := make(\[\]byte, (l+len(data))\*2) // The copy function is predeclared and works for any slice type. copy(newSlice, slice) slice = newSlice } slice = slice\[0:l+len(data)\] copy(slice\[l:\], data) return slice } 
```
 \`append\` 函数原型如下，其中 T 为通用类型。 
```
go func append(s \[\]T, x ...T) \[\]T 
```
 #### 展开分析 为了方便程序分析的，我们在程序中添加打印信息，代码和结果如下： 
```
go package main import ( "fmt" ) func main() { s := \[\]byte("") println(s) // 添加用于打印信息, println() print() 为go内置函数，直接输出到 stderr 无缓存 s1 := append(s, 'a') s2 := append(s, 'b') // fmt.Println(s1, "===", s2) fmt.Println(string(s1), string(s2)) } 
```
 运行程序结果如下： 
```
bash $ go run q.go \[0/32\]0xc420045ef8 b b 
```
 结果运行后 \`s := \[\]byte("")\` 初始化以后结构内部如下： 
```
go s.len = 0 s.cap = 32 s.ptr = 0xc420045ef8 
```
 我们分析以下两行代码调用会发生什么： 
```
go s1 := append(s, 'a') s2 := append(s, 'b') 
```
 \`s1 := append(s, 'a')\` 代码调用分析： 
```
go // slice = s data = \`a\` slice.len = 0 slice.cap = 32 func Append(slice, data \[\]byte) \[\]byte { l := len(slice) // l = 0 // l = 0 len(data) = 1 cap(slice) = 32 1 + 1 > 32 false if l + len(data) > cap(slice) { newSlice := make(\[\]byte, (l+len(data))\*2) copy(newSlice, slice) slice = newSlice } // l = 0 len(data) = 1 slice = slice\[0:l+len(data)\] // slice = slice\[0:1\] copy(slice\[l:\], data) // 调用变成： copy(slice\[0:\], 'a') return slice // 由于未涉及到重分配，因此返回的还是原来的 slice 对象 } 
```
 \`s2 := append(s, 'b')\` 的分析完全一样。 简化 \`apend\` 函数的处理路径，在没有进行 \`slice\` 重新分配内存情况下，直接进行展开分析： 
```
go s1 := append(s, 'a') s2 := append(s, 'b') 
```
 等价于 
```
go s1 := copy(s\[0:\], 'a') s2 := copy(s\[0:\], 'b') // 直接覆盖了上的赋值 
```
 基于上述分析，能够很好地解释代码输出\`b b\`的情况。但是如何避免出现这种类型的情况呢？问题出现在这条语句上 
```
go s := \[\]byte("") 
```
 语句执行后 \`s.len = 0 s.cap = 32\`，导致了 \`append\` 的工作不能够正常工作，那么正常如何使用？只要将 \`s.len = s.cap = 0\` 则会导致 \`slice\` 在 \`append\` 中重新进行分配则可以避免这种情况的发生。 正确的写法应该为： 
```
go func main() { // Notice \[\]byte("") -> \[\]byte{} 或者 var s \[\]byte s := \[\]byte{} s1 := append(s, 'a') s2 := append(s, 'b') // fmt.Println(s1, "===", s2) fmt.Println(string(s1), string(s2)) } 
```
 由此也可以看出一个良好的编程习惯是可以规避很多莫名其妙的问题排查。 ### 深入分析 那么既然 bug 出现在了 \`s := \[\]byte("")\`这句话中，那么这条语句为什么会导致 \`s.cap = 32\` 呢？这条语句背后隐藏的逻辑是什么呢? \`s := \[\]byte("")\` 等价于以下代码： 
```
go // 初始化字符串 str := "" // 将字符串转换成 \[\]byte s := \[\]byte(str) 
```
 在go语言中 \`s := \[\]byte(str)\` 的底层其实是调用了 \[\`stringtoslicebyte\`\](https://github.com/golang/go/blob/master/src/runtime/string.go#L154) 实现的，该函数位于 go 的 \`runtime\`包中。 
```
go const tmpStringBufSize = 32 type tmpBuf \[tmpStringBufSize\]byte func stringtoslicebyte(buf \*tmpBuf, s string) \[\]byte { var b \[\]byte // 如果字符串 s 的长度内部长度不超过 32， 那么就直接分配一个 32 直接的大小 if buf != nil && len(s) <= len(buf) { \*buf = tmpBuf{} b = buf\[:len(s)\] } else { b = rawbyteslice(len(s)) } copy(b, s) return b } 
```
 如果字符串的大小没有超过 32 长度的大小，则默认分配一个 32 长度的 buf，这也是我们上面分析 \`s.cap = 32\` 的由来。 到此为止，我们仍然没有分析问题中 \`fmt.Println(s1, "===", s2)\` 这句打印注释掉就能够正常工作的原因？那么最终到底是什么样的情况呢？ ### 最终分析 最后我们来启用魔法的开关 \`fmt.Println(s1, "===", s2)\`, 来进行最后谜底的揭晓： 
```
go package main import ( "fmt" ) func main() { s := \[\]byte("") println(s) // 添加用于打印信息 s1 := append(s, 'a') s2 := append(s, 'b') fmt.Println(s1, "===", s2) fmt.Println(string(s1), string(s2)) } 
```
 
```
bash $ go run q.go \[0/0\]0x115b820 # 需要注意 s.len = 0 s.cap = 0 \[97\] === \[98\] # 取消了打印的注释 a b # 打印一切正常 
```
 
```
bash $ go run -gcflags '-S -S' q.go .... 0x0032 00050 (q.go:8) MOVQ $0, (SP) 0x003a 00058 (q.go:8) MOVQ $0, 8(SP) 0x0043 00067 (q.go:8) MOVQ $0, 16(SP) 0x004c 00076 (q.go:8) PCDATA $0, $0 0x004c 00076 (q.go:8) CALL runtime.stringtoslicebyte(SB) 0x0051 00081 (q.go:8) MOVQ 32(SP), AX 0x0056 00086 (q.go:8) MOVQ AX, "".s.len+96(SP) 0x005b 00091 (q.go:8) MOVQ 40(SP), CX 0x0060 00096 (q.go:8) MOVQ CX, "".s.cap+104(SP) 0x0065 00101 (q.go:8) MOVQ 24(SP), DX 0x006a 00106 (q.go:8) MOVQ DX, "".s.ptr+136(SP) .... 
```
 通过分析发现底层调用的仍然是 \`runtime.stringtoslicebyte()\`, 但是行为却发生了变化 \`s.len = s.cap = 0\`，很显然由于 \`fmt.Println(s1, "===", s2)\` 行的出现导致了 \`s := \[\]byte("")\`内存分配的情况发生了变化。 我们可以通过 go build 提供的内存分配工具进行分析： 
```
go $ go build -gcflags "-m -m" q.go # command-line-arguments ./q.go:7:6: cannot inline main: non-leaf function ./q.go:14:13: s1 escapes to heap ./q.go:14:13: from ... argument (arg to ...) at ./q.go:14:13 ./q.go:14:13: from \*(... argument) (indirection) at ./q.go:14:13 ./q.go:14:13: from ... argument (passed to call\[argument content escapes\]) at ./q.go:14:13 ./q.go:8:13: (\[\]byte)("") escapes to heap ./q.go:8:13: from s (assigned) at ./q.go:8:4 ./q.go:8:13: from s1 (assigned) at ./q.go:11:5 ./q.go:8:13: from s1 (interface-converted) at ./q.go:14:13 ./q.go:8:13: from ... argument (arg to ...) at ./q.go:14:13 ./q.go:8:13: from \*(... argument) (indirection) at ./q.go:14:13 ./q.go:8:13: from ... argument (passed to call\[argument content escapes\]) at ./q.go:14:13 
```
 以上输出中的 \`s1 escapes to heap\` 和 \`(\[\]byte)("") escapes to heap\` 表明，由于 \`fmt.Println(s1, "===", s2)\` 代码的引入导致了变量分配模型的变化。简单点讲就是从栈中逃逸到了堆上。内存逃逸的分析我们会在后面的章节详细介绍。问题到此，大概的思路已经有了，但是我们如何通过代码层面进行验证呢? 通过搜索 go 源码实现调用的函数 \`runtime.stringtoslicebyte\` 的地方进行入手。通过搜索发现调用的文件在 \[\`cmd/compile/internal/gc/walk.go\`\](https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/walk.go#L1643:7) \[关于 string到\\\[\\\]byte 分析调用的代码如下\](https://github.com/golang/go/blob/10529a01fd8b0d5cc07eb3f6aa00a0272597684b/src/cmd/compile/internal/gc/walk.go#L1643:7) 
```
go case OSTRARRAYBYTE: a := nodnil() // 分配到堆上的的默认行为 if n.Esc == EscNone { // Create temporary buffer for slice on stack. t := types.NewArray(types.Types\[TUINT8\], tmpstringbufsize) a = nod(OADDR, temp(t), nil) // 分配在栈上，大小为32 } n = mkcall("stringtoslicebyte", n.Type, init, a, conv(n.Left, types.Types\[TSTRING\])) 
```
 \[OSTRARRAYBYTE 定义\](https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/syntax.go#L595:2) 
```
go OSTRARRAYBYTE // Type(Left) (Type is \[\]byte, Left is a string) 
```
 上述代码中的 \`n.Esc == EscNone\` 条件分析则表明了发生内存逃逸和不发生内存逃逸的情况下，初始化的方式是不同的。 \[EscNone 的定义\](https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/esc.go#L342:2)： 
```
go EscNone // Does not escape to heap, result, or parameters. 
```
 通过以上分析，我们总算找到了魔法的最终谜底。 以上分析的go语言版本基于 1.9.2，不同的go语言的内存分配机制可能不同，具体可以参见我同事更加详细的分析 \[\*\*Go中string转\\\[\\\]byte的陷阱.md\*\*\](https://github.com/mushroomsir/blog/blob/master/Go%E4%B8%ADstring%E8%BD%AC%5B%5Dbyte%E7%9A%84%E9%99%B7%E9%98%B1.md) ## Go 内存管理 Go 语言能够自动进行内存管理，避免了 C 语言中的内存自己管理的麻烦，但是同时对于代码的内存管理和回收细节进行了封装，也潜在增加了系统调试和优化的难度。同时，内存自动管理也是一项非常困难的事情，比如函数的多层调用、闭包调用、结构体或者管道的多次赋值、切片和MAP、CGO调用等多种情况综合下，往往会导致自动管理优化机制失效，退化成原始的管理状态；go 中的内存回收（GC）策略也在不断地优化过程。Golang 从第一个版本以来，GC 一直是大家诟病最多的，但是每一个版本的发布基本都伴随着 GC 的改进。下面列出一些比较重要的改动。 - v1.1 STW - v1.3 Mark STW, Sweep 并行 - v1.5 三色标记法 - v1.8 hybrid write barrier 预热基础知识：\[How do I know whether a variable is allocated on the heap or the stack?\](https://golang.org/doc/faq#stack\_or\_heap) ## 逃逸分析-Escape Analysis > 更深入和细致的了解建议阅读 \[William Kennedy 的 4 篇 Post\](https://www.ardanlabs.com/blog/2017/05/language-mechanics-on-escape-analysis.html) go 没有像 C 语言那样提供精确的堆与栈分配控制，由于提供了内存自动管理的功能，很大程度上模糊了堆与栈的界限。例如以下代码： 
```
go package main func main() { str := GetString() \_ = str } func GetString() \*string { var s string s = "hello" return &s } 
```
 行 10 中的变量 \`s = "hello"\` 尽管声明在了 \`GetString()\` 函数内，但是在 \`main\` 函数中却仍然能够访问到返回的变量；这种在函数内定义的局部变量，能够突破自身的范围被外部访问的行为称作逃逸，也即通过逃逸将变量分配到堆上，能够跨边界进行数据共享。 \[\`Escape Analysis\`\](https://en.wikipedia.org/wiki/Escape\_analysis) 技术就是为该场景而存在的；通过 \`Escape Analysis\` 技术，编译器会在编译阶段对代码做了分析，当发现当前作用域的变量没有跨出函数范围，则会自动分配在 \`stack\` 上，反之则分配在 \`heap\` 上。 go 的内存回收针对的也是堆上的对象。go 语言中 \`Escape Analysis\`还未看到官方 \`spec\` 的文档，因此很多特性需要进行代码尝试和分析才能得出结论，而且 go \`Escape Analysis\` 的实现还存在很多\[不完善的地方\](https://docs.google.com/document/d/1CxgUBPlx9iJzkz9JWkb6tIpTe5q32QDmz8l0BouG0Cw/preview)。 > \*\*stack allocation is cheap and heap allocation is expensive\*\*. ## Go 语言逃逸分析实现 > 更多内存建议阅读 \[Allocation efficiency in high-performance Go services\](https://segment.com/blog/allocation-efficiency-in-high-performance-go-services/) 2.go 
```
go package main import "fmt" func main() { x := 42 fmt.Println(x) } 
```
 go build 工具中的 flag \`-gcflags '-m'\` 可以用来分析内存逃逸的情况汇总，最多可以提供 4 个 "-m", m 越多则表示分析的程度越详细，一般情况下我们可以采用两个 m 分析。 
```
bash $ go build -gcflags '-m -l' 2.go # command-line-arguments ./2.go:7:13: x escapes to heap ./2.go:7:13: main ... argument does not escape -l disable inline， 也可以调用的函数前添加注释 $ go build -gcflags '-m -m -l' 2.go command-line-arguments ./2.go:7:13: x escapes to heap ./2.go:7:13: from ... argument (arg to ...) at ./2.go:7:13 ./2.go:7:13: from \*(... argument) (indirection) at ./2.go:7:13 ./2.go:7:13: from ... argument (passed to call\[argument content escapes\]) at ./2.go:7:13 ./2.go:7:13: main ... argument does not escape 
```
 上例中的 \`x escapes to heap\` 则表明了变量 \`x\` 变量逃逸到了堆（heap）上。其中 \`-l\` 表示不启用 \`inline\` 模式调用，否则会使得分析更加复杂，也可以在函数上方添加注释 \`//go:noinline\`禁止函数 inline调用。至于调用 \`fmt.Println()\`为什么会导致 \`x escapes to heap\`，可以参考 \[Issue #19720\](https://github.com/golang/go/issues/19720#event-1015714692) 和 \[Issue #8618\](https://github.com/golang/go/issues/8618)，对于上述 \`fmt.Println()\` 的行为我们可以通过以下代码进行简单模拟测试，效果基本一样： 
```
go package main type pp struct { arg interface{} } func MyPrintln(a ...interface{}) { Fprintln(a...) } func Fprintln(a ...interface{}) (n int, err error) { pp := new(pp) pp.arg = a // 此处导致了内存的逃逸 return } func main() { x := 42 MyPrintln(x) } 
```
 内存逃逸分析结果如下： 
```
bash $ go build -gcflags '-m -m -l' 3.go # command-line-arguments ./3.go:13:9: a escapes to heap ./3.go:13:9: from pp.arg (star-dot-equals) at ./3.go:13:9 ./3.go:11:45: leaking param: a ./3.go:11:45: from a (interface-converted) at ./3.go:13:9 ./3.go:11:45: from pp.arg (star-dot-equals) at ./3.go:13:9 ./3.go:12:11: Fprintln new(pp) does not escape ./3.go:7:21: leaking param: a ./3.go:7:21: from a (passed to call\[argument escapes\]) at ./3.go:8:10 ./3.go:19:11: ... argument escapes to heap ./3.go:19:11: from ... argument (passed to call\[argument escapes\]) at ./3.go:19:11 ./3.go:19:11: x escapes to heap ./3.go:19:11: from ... argument (arg to ...) at ./3.go:19:11 ./3.go:19:11: from ... argument (passed to call\[argument escapes\]) at ./3.go:19:11 
```
 逃逸的常见情况分析参见： http://www.agardner.me/golang/garbage/collection/gc/escape/analysis/2015/10/18/go-escape-analysis.html 主要原因如下：变量 \`x\` 虽为 int 类型，但是在传递给函数 \`MyPrintln\`函数中被转换成 \`interface{}\` 类型，因为 \`interface{}\` 类型中包含指向数据的地址，因此 \`x\` 在传递到函数 \`MyPrintln\`过程中进行了一个内存重新分配的过程，由于 \`pp.arg = a\` 结构体中的字段赋值的引用，导致了后续变量的逃逸到了堆上。如果将上述 \`pp.arg = a\` 注释掉，则不会出现内存逃逸的情况。 导致内存逃逸的情况比较多，有些可能还是官方未能够实现精确的分析逃逸情况的 bug，简单一点来讲就是如果变量的作用域不会扩大并且其行为或者大小能够在编译的时候确定，一般情况下都是分配到栈上，否则就可能发生内存逃逸分配到堆上。 简单总结一下有以下几类情况： 1. 发送指针的指针或值包含了指针到 \`channel\` 中，由于在编译阶段无法确定其作用域与传递的路径，所以一般都会逃逸到堆上分配。 2. \`slices\` 中的值是指针的指针或包含指针字段。一个例子是类似\`\[\] \*string\` 的类型。这总是导致 \`slice\` 的逃逸。即使切片的底层存储数组仍可能位于堆栈上，数据的引用也会转移到堆中。 3. \`slice\` 由于 \`append\` 操作超出其容量，因此会导致 \`slice\` 重新分配。这种情况下，由于��编译时 \`slice\` 的初始大小的已知情况下，将会在栈上分配。如果 \`slice\` 的底层存储必须基于仅在运行时数据进行扩展，则它将分配在堆上。 4. 调用接口类型的方法。接口类型的方法调用是动态调度 - 实际使用的具体实现只能在运行时确定。考虑一个接口类型为 \`io.Reader\` 的变量 r。对 \`r.Read(b)\` 的调用将导致 \`r\` 的值和字节片\`b\`的后续转义并因此分配到堆上。 参考 http://npat-efault.github.io/programming/2016/10/10/escape-analysis-and-interfaces.html 5. 尽管能够符合分配到栈的场景，但是其大小不能够在在编译时候确定的情况，也会分配到堆上 ### 关于指针 关于指针的使用多数情况下我们会受一个前提影响：“指针传递过程不涉及到底层数据拷贝，因此效率更高”，而且一般情况下也的确是如此。 但是由于指针的访问是间接寻址，也就是说访问到了指针保存的地址后，还需要根据保存的地址再进行一次访问，才能获取到指针所指向的数据，另外一种情况对于指针在使用的时候还需要进行 nil 情况的判断，以防止 panic 的发生，更重要的是指针所指向的地址多数是保存在堆上，在涉及到内存收回的情况下，指针的存在可能会让程序的性能大打折扣。除此之外由于指针的间接访问，还会导致缓存的优化失效，可以参考 \[Locality of reference\](https://en.wikipedia.org/wiki/Locality\_of\_reference)，当前在缓存中拷贝少量数据与指针的访问相比，性能上基本上可以等同。 综上所述，指针的使用也不是没有代价的，需要合理进行使用。 > “the garbage collector will skip regions of memory that it can prove will contain no pointers” > > 简单点讲，如果在堆上分配的结构中指针比较少，回收的机制会比较简单，应该会提升回收的效率，需要通过了解 go 回收算法进行相关测试 。 TODO ### 关于接口转换 接口实现参见： \[Go Data Structures: Interfaces\](https://research.swtch.com/interfaces) \[Go interfaces: static vs dynamic binding\](https://stackoverflow.com/questions/15952519/go-interfaces-static-vs-dynamic-binding) !\[\](https://www.do1618.com/wp-content/uploads/2018/05/binary.png) !\[\](https://www.do1618.com/wp-content/uploads/2018/05/gointer2.png) 上图展示了一个 Binary 对象转换成一个 Stringer 接口后的数据结构。检查类型是否匹配 \`s.tab->type\` 即可。 go 语言中的 \`interface\` 接口，在编译时候的时候会进行隐式转换的静态检查，但是显示的 \`interface\` 到 \`interface\` 的转换可以在运行时查询方法集，动态检测比如： 
```
go type Stringer interface { String() string } if v, ok := any.(Stringer); ok { return v.String() } 
```
 关于 \`Itab\` 结构的计算，由于（\`interface\`、\`type\`）对的不确定性，go 编译器或者链接器不可能在编译的时候计算两者的对应关系，而且即使能够计算出来也可能是绝大多数的对应关系在实际中不适用；因此 go 编译器会在编译的过程中对于 \`interface\` 和 \`type\` 中的方法生成一个相关的描述结构，分别记录 \`interface\` 和 \`type\` 各自对应的方法集合，go 语言会在 \`type\` 实际的动态转换成 \`interface\` 过程中，将 \`interafce\` 中定义的方法在 \`type\` 中一一进行对比查找，并完善 \`Itab\` 结构，并将 \`Itab\` 结构进行缓存提升性能。 综上所述，go 中的接口类型的方法调用是动态调度，因此不能够在编译阶段确定，所有类型结构转换成接口的过程会涉及到内存逃逸的情况发生。\*\*如果对于性能要求比较高且访问频次比较高的函数调用，应该尽量避免使用接口类型\*\*。 以下样例参考：http://npat-efault.github.io/programming/2016/10/10/escape-analysis-and-interfaces.html 
```
go package main // go build -gcflags '-m -m -l' 5.go type S struct { s1 int } func (s \*S) M1(i int) { s.s1 = i } type I interface { M1(int) } func main() { var s1 S // this escapes var s2 S // this does not f1(&s1) f2(&s2) } func f1(s I) { s.M1(42) } func f2(s \*S) { s.M1(42) } 
```
 逃逸分析确认： 
```
bash go build -gcflags '-m -m -l' 5.go # command-line-arguments ./5.go:9:18: (\*S).M1 s does not escape ./5.go:23:11: leaking param: s ./5.go:23:11: from s.M1(42) (receiver in indirect call) at ./5.go:23:21 ./5.go:24:12: f2 s does not escape ./5.go:19:5: &s1 escapes to heap ./5.go:19:5: from &s1 (passed to call\[argument escapes\]) at ./5.go:19:4 ./5.go:19:5: &s1 escapes to heap ./5.go:19:5: from &s1 (interface-converted) at ./5.go:19:5 ./5.go:19:5: from &s1 (passed to call\[argument escapes\]) at ./5.go:19:4 ./5.go:16:6: moved to heap: s1 ./5.go:20:5: main &s2 does not escape :1:0: leaking param: .this :1:0: from .this.M1(.anon0) (receiver in indirect call) at :1:0 
```
 性能测试分析： 
```
go package main\_test import "testing" // go test -bench . --benchmem -gcflags "-N -l" 5\_test.go type S struct { s1 int } func (s \*S) M1(i int) { s.s1 = i } type I interface { M1(int) } func f1(s I) { s.M1(86) } func f2(s \*S) { s.M1(86) } func BenchmarkTestInterface(b \*testing.B) { var s1 S for i := 0; i < b.N; i++ { f1(&s1) } } func BenchmarkTestNoInterface(b \*testing.B) { var s2 S for i := 0; i < b.N; i++ { f2(&s2) } } 
```
 禁止使用 \`inline\` 方式的函数调用性能报告： 
```
bash # 禁止使用 inline $ go test -bench . --benchmem -gcflags "-N -l" 5\_test.go goos: darwin goarch: amd64 BenchmarkTestInterface-8 300000000 4.50 ns/op 0 B/op 0 allocs/op BenchmarkTestNoInterface-8 500000000 3.80 ns/op 0 B/op 0 allocs/op PASS ok command-line-arguments 4.094s 
```
 启用了 \`inline\` 方式的函数调用性能报告： 
```
bash # 如果启用了 inline，性能差别非常明显 $ go test -bench . --benchmem 5\_test.go goos: darwin goarch: amd64 BenchmarkTestInterface-8 500000000 3.45 ns/op 0 B/op 0 allocs/op BenchmarkTestNoInterface-8 2000000000 0.29 ns/op 0 B/op 0 allocs/op PASS ok command-line-arguments 2.685s 
```
 ### 关于切片 由于切片一般都是使用在函数传递的场景下，而且切片在 \`append\` 的时候可能会涉及到重新分配内存，如果切片在编译期间的大小不能够确认或者大小超出栈的限制，多数情况下都会分配到堆上。 #### 大小验证 
```
go package main func main() { s := make(\[\]byte, 1, 1\*1024) \_ = s } 
```
 
```
bash $ go build -gcflags "-m -m" slice\_esc.go # command-line-arguments ./slice\_esc.go:3:6: can inline main as: func() { s := make(\[\]byte, 1, 1 \* 1024); \_ = s } ./slice\_esc.go:4:11: main make(\[\]byte, 1, 1 \* 1024) does not escape 
```
 如果 \`slice\` 大小超过 64k，则会分配到堆上 （go 1.9.2) 
```
go package main func main() { s := make(\[\]byte, 1, 64\*1024) // 64k \_ = s } 
```
 
```
bash $ go build -gcflags "-m -m" slice\_esc.go # command-line-arguments ./slice\_esc.go:3:6: can inline main as: func() { s := make(\[\]byte, 1, 64 \* 1024); \_ = s } ./slice\_esc.go:4:11: make(\[\]byte, 1, 64 \* 1024) escapes to heap ./slice\_esc.go:4:11: from make(\[\]byte, 1, 64 \* 1024) (too large for stack) at ./slice\_esc.go:4:11 
```
 #### 指针类型切片验证 
```
go package main func main() { s := make(\[\]\*string, 1, 100) str := "hello" s = append(s, &str) \_ = s } 
```
 
```
bash $ go build -gcflags "-m -m -l" slice\_esc.go # command-line-arguments ./slice\_esc.go:6:16: &str escapes to heap ./slice\_esc.go:6:16: from append(s, &str) (appended to slice) at ./slice\_esc.go:6:12 ./slice\_esc.go:5:9: moved to heap: str ./slice\_esc.go:4:11: main make(\[\]\*string, 1, 100) does not escape 
```
 对于保存在 \`\[\]\*string\` 中的字符串都会直接在堆上分配。 
```
go package main import "math/rand" func main() { randSize := rand.Int() s := make(\[\]\*string, 0, randSize) str := "hello" s = append(s, &str) \_ = s } 
```
 
```
go $ go build -gcflags "-m -m -l" slice\_esc.go # command-line-arguments ./slice\_esc.go:7:11: make(\[\]\*string, 0, randSize) escapes to heap ./slice\_esc.go:7:11: from make(\[\]\*string, 0, randSize) (too large for stack) at ./slice\_esc.go:7:11 ./slice\_esc.go:9:16: &str escapes to heap ./slice\_esc.go:9:16: from append(s, &str) (appended to slice) at ./slice\_esc.go:9:12 ./slice\_esc.go:8:9: moved to heap: str 
```
 由于 \`s := make(\[\]\*string, 0, randSize)\` 大小不能编译确定，所以会逃逸到堆上。 \## 参考 1. \[Golang 内存逃逸分析\](https://maqian.io/coding/golang-escape.html) 2. \[深入解析 Go 中 Slice 底层实现\](https://halfrost.com/go\_slice/) \\\*\\\*\\\* 3. \[以C视角来理解Go内存逃逸\](https://www.otokaze.cn/2018/golang-escape-analysis-with-clang.html) 4. \[golang string和\\\[\\\]byte的对比\](https://gocn.io/article/467) 5. \[Go Slices: usage and internals\](https://blog.golang.org/go-slices-usage-and-internals) 6. \[Where is append() implementation?\](https://stackoverflow.com/questions/31790311/where-is-append-implementation) 7. \[SliceTricks\](https://github.com/golang/go/wiki/SliceTricks) \\\*\\\*\\\* 8. \[Variadic func changes \\\[\\\]byte(s) cap #24972\](https://github.com/golang/go/issues/24972) 9. \[spec: clarify that conversions to slices don't guarantee slice capacity? #24163\](https://github.com/golang/go/issues/24163) 10. \[Golang escape analysis\](http://www.agardner.me/golang/garbage/collection/gc/escape/analysis/2015/10/18/go-escape-analysis.html) \\\*\\\*\\\* 11. \[Go Escape Analysis Flaws\](https://docs.google.com/document/d/1CxgUBPlx9iJzkz9JWkb6tIpTe5q32QDmz8l0BouG0Cw/preview#) 12. \[Escape Analysis for Java\](https://www.cc.gatech.edu/~harrold/6340/cs6340\_fall2009/Readings/choi99escape.pdf) 13. \[Language Mechanics On Escape Analysis\](https://www.ardanlabs.com/blog/2017/05/language-mechanics-on-escape-analysis.html) \[中文\](https://studygolang.com/articles/12444) \[中文2\](https://blog.csdn.net/weixin\_38975685/article/details/79788273) 14. \[Allocation efficiency in high-performance Go services\](https://segment.com/blog/allocation-efficiency-in-high-performance-go-services/) \\\*\\\*\\\* 15. \[Profiling Go Programs\](https://blog.golang.org/profiling-go-programs) 16. 17\. \[the-go-programming-language-report\](https://kuree.gitbooks.io/the-go-programming-language-report/) 18. https://golang.org/doc/faq 19. \[年终盘点！2017年超有价值的Golang文章\](http://colobu.com/2017/12/28/top-golang-articles-of-2017/) 20. \[Golang 垃圾回收剖析\](http://legendtkl.com/2017/04/28/golang-gc/) 21. \[深入Golang之垃圾回收\](http://www.opscoder.info/golang\_gc.html)
