---
title: 指令集架构、机器码与 Go 语言
source_url: 'https://studygolang.com/articles/19064'
category: Go原理教程
---
```

Go 语言编译的最后一个阶段就是根据 SSA 中间代码生成机器码了，这里谈的机器码生成就是在目标 CPU 架构上能够运行的代码，[中间代码生成](https://draveness.me/golang-ir-ssa) 一节简单介绍的从抽象语法树到 SSA 中间代码的处理过程，处理 SSA 的将近 50 个步骤中有一些过程严格上来说其实是属于机器码生成阶段的。

```
 在将 SSA 中间代码降级（lower）的过程中，编译器将一些值重写成了目标 CPU 架构的特定值，降级的过程处理了所有机器特定的重写规则并且对代码进行了一定程度的优化；在 SSA 中间代码生成阶段的最后，Go 函数体的代码会被转换成一系列的 \`obj.Prog\` 结构体。 ## \[\](#%E6%8C%87%E4%BB%A4%E9%9B%86%E6%9E%B6%E6%9E%84)指令集架构 首先需要介绍的就是指令集架构了，虽然我们在第一节 \[编译过程概述\](https://draveness.me/golang-compile-intro) 中曾经讲解过指令集架构的相关知识，但是在这里还是需要引入更多的指令集构知识。 !\[instruction-set-architecture\](https://static.studygolang.com/190331/d6092b02cd5d60fcdeaad0073934a080.png) \[指令集架构\](https://en.wikipedia.org/wiki/Instruction\_set\_architecture) 是计算机的抽象模型，在很多时候也被称作架构或者计算机架构，它其实是计算机软件和硬件之间的接口和桥梁；一个为特定指令集架构编写的应用程序能够运行在所有支持这种指令集架构的机器上，也就说如果当前应用程序支持 x86\\\_64 的指令集，那么就可以运行在所有使用 x86\\\_64 指令集的机器上，这其实就是分层的作用，每一个指令集架构都定义了支持的数据结构、主内存和寄存器、类似内存一致和地址模型的语义、支持的指令集和 IO 模型，它的引入其实就在软件和硬件之间引入了一个抽象层，让同一个二进制文件能够在不同版本的硬件上运行。 如果一个编程语言想要在所有的机器上运行，它就可以将中间代码转换成使用不同指令集架构的机器码，这可比为不同硬件单独移植要简单的太多了。 ### \[\](#%E5%88%86%E7%B1%BB)分类 最常见的指令集架构分类方法就是根据指令的复杂度将其分为复杂指令集（CISC）和精简指令集（RISC），复杂指令集架构包含了很多特定的指令，但是其中的一些指令很少会被程序使用，而精简指令集只实现了经常被使用���指令，更不常用的操作都会通过子程序实现。 \[复杂指令集\](https://en.wikipedia.org/wiki/Complex\_instruction\_set\_computer) 的特点就是指令数目多并且复杂，每条指令的字节长度并不相等，x86 就是常见的复杂指令集处理器，它的指令长度大小范围非常广，从 1 到 15 字节不等，对于长度不固定的指令，计算机必须额外对指令进行判断，这需要付出额外的性能损失。 而 \[精简指令集\](https://en.wikipedia.org/wiki/Reduced\_instruction\_set\_computer) 对指令的数目和寻址方式做了精简，大大减少指令数量的同时更容易实现，指令集中的每一个指令都使用标准的字节长度、执行时间相比复杂指令集会少很多，处理器在处理指令时也可以流水执行，提高了对并行的支持，作为一种常见的精简指令集处理器，amd 使用 4 个字节作为指令的固定长度，省略了判断指令的性能损失。 最开始的计算机使用复杂指令集是因为当时的计算机的性能和内存非常有限，业界需要尽可能地减少机器需要执行的指令，所以更倾向于高度编码、长度不等以及多操作数的指令，但是随着性能的飞速提升，就出现了精简指令集这种牺牲代码密度换取简单实现的设计，除此之外，硬件的飞速提升带来了更多的寄存器和更高的时钟频率，软件开发人员也不再直接接触汇编代码，而是通过编译器和汇编器生成指令，复杂的机器指定对于编译器来说很难利用，所以精简的指令更适合在这种场景下使用。 ### \[\](#%E5%B0%8F%E7%BB%93)小结 复杂指令集和精简指令集的使用其实是一种权衡，经过这么多年的发展，两种指令集也相互借鉴和学习，与最开始刚被设计出来时已经有了较大的差别，对于软件工程师来讲，复杂的硬件设备对于我们来说已经是领域下两层的知识了，其实不太需要掌握太多，但是对指令集架构感兴趣的读者可以简单找一些资料开拓眼界。 ## \[\](#%E6%9C%BA%E5%99%A8%E7%A0%81%E7%94%9F%E6%88%90)机器码生成 机器码的生成在 Go 的编译器中主要由两部分协同工作，其中一部分是负责 SSA 中间代码降级和根据目标架构进行特定处理的 cmd/compile/internal/ssa 包，另一部分是负责生成机器码的 cmd/internal/obj，前者会将 SSA 中间代码转换成 \`obj.Prog\` 指令，后者作为一个汇编器会将这些指令最终转换成机器码完成这次的编译。 ### \[\](#ssa-%E9%99%8D%E7%BA%A7)SSA 降级 SSA 的降级过程是在中间代码生成的过程完成的，其中将近 50 轮处理过程中，lower 阶段就会将 SSA 转换成机器特定的操作，该阶段的入口方法就是 \`lower\` 函数： 
```
go func lower(f \*Func) { applyRewrite(f, f.Config.lowerBlock, f.Config.lowerValue) } 
```
 向 \`applyRewrite\` 传入的两个函数 \`lowerBlock\` 和 \`lowerValue\` 其实就是在 \[中间代码生成\](https://draveness.me/golang-ir-ssa) 阶段初始化 SSA 配置时确定的，这两个函数会分别转换一个函数中的代码块和代码块中的值。 假设目标机器使用 x86 的架构，最终会调用 \`rewriteBlock386\` 和 \`rewriteValue386\` 两个函数，这两个函数是两个巨大的 switch/case，前者总共有 2000 多行，后者将近 700 行，相关的用于处理 x86 架构重写的函数总共有将近 30000 行代码，我们只节选其中的一段简单展示一下： 
```
go func rewriteValue386(v \*Value) bool { switch v.Op { case Op386ADCL: return rewriteValue386\_Op386ADCL\_0(v) case Op386ADDL: return rewriteValue386\_Op386ADDL\_0(v) || rewriteValue386\_Op386ADDL\_10(v) || rewriteValue386\_Op386ADDL\_20(v) //... } } func rewriteValue386\_Op386ADCL\_0(v \*Value) bool { // match: (ADCL x (MOVLconst \[c\]) f) // cond: // result: (ADCLconst \[c\] x f) for { \_ = v.Args\[2\] x := v.Args\[0\] v\_1 := v.Args\[1\] if v\_1.Op != Op386MOVLconst { break } c := v\_1.AuxInt f := v.Args\[2\] v.reset(Op386ADCLconst) v.AuxInt = c v.AddArg(x) v.AddArg(f) return true } // ... } 
```
 重写的过程会将通用的 SSA 中间代码转换成目标架构特定的指令，上述代码就会使用 \`ADCLconst\` 替换 \`ADCL\` 和 \`MOVLconst\` 两条指令。 在 \`buildssa\` 函数执行结束之后会继续执行 \`compileFunctions\` 中的 \`genssa\` 方法： 
```
go func compileSSA(fn \*Node, worker int) { f := buildssa(fn, worker) pp := newProgs(fn, worker) defer pp.Free() genssa(f, pp) pp.Flush() } 
```
 该方法会创建一个新的 \`obj.Progs\` 结构并将生成的 SSA 中间代码都存入新建的结构体中，如果我们与在编译时加入了 \`GOSSAFUNC=hello\` 参数就会打印出最后生成的中间代码： 
```
go genssa hello # ./hello.go 00000 (3) TEXT "".hello(SB) 00001 (3) FUNCDATA $0, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB) 00002 (3) FUNCDATA $1, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB) 00003 (3) FUNCDATA $3, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB) v8 00004 (4) PCDATA $2, $0 v8 00005 (4) PCDATA $0, $0 v8 00006 (4) MOVQ "".a(SP), AX v9 00007 (4) ADDQ $2, AX v11 00008 (5) MOVQ AX, "".~r1+8(SP) b1 00009 (5) RET 00010 (?) END 
```
 上述输出结果跟最后生成的汇编代码其实已经非常相似了，随后调用的 \`Flush\` 函数就会使用 cmd/internal/obj 中的汇编器将 SSA 转换成汇编代码： 
```
go func (pp \*Progs) Flush() { plist := &obj.Plist{Firstpc: pp.Text, Curfn: pp.curfn} obj.Flushplist(Ctxt, plist, pp.NewProg, myimportpath) } 
```
 从 \`buildssa\` 中的 lower 阶段和随后的多个阶段会对 SSA 进行转换、检查和优化，接下来通过 \`genssa\` 将代码输出到 \`Progs\` 对象，这也是代码进入汇编器前的最后一个步骤。 ### \[\](#%E6%B1%87%E7%BC%96%E5%99%A8)汇编器 汇编器是将汇编语言翻译为机器语言的程序，Go 语言的汇编器是基于 \[Plan 9 汇编器\](https://9p.io/sys/doc/asm.html) 的输入类型，需要注意的是 Go 汇编器生成的代码并不是目标机器的直接表示，汇编器将一个半抽象的指令集转换成指令。我们将如下的代码编译成汇编指令，可以得到如下的内容： 
```
go $ cat hello.go package hello func hello(a int) int { c := a + 2 return c } $ GOOS=linux GOARCH=amd64 go tool compile -S main.go "".hello STEXT nosplit size=15 args=0x10 locals=0x0 0x0000 00000 (main.go:3) TEXT "".hello(SB), NOSPLIT, $0-16 0x0000 00000 (main.go:3) FUNCDATA $0, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB) 0x0000 00000 (main.go:3) FUNCDATA $1, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB) 0x0000 00000 (main.go:3) FUNCDATA $3, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB) 0x0000 00000 (main.go:4) PCDATA $2, $0 0x0000 00000 (main.go:4) PCDATA $0, $0 0x0000 00000 (main.go:4) MOVQ "".a+8(SP), AX 0x0005 00005 (main.go:4) ADDQ $2, AX 0x0009 00009 (main.go:5) MOVQ AX, "".~r1+16(SP) 0x000e 00014 (main.go:5) RET 0x0000 48 8b 44 24 08 48 83 c0 02 48 89 44 24 10 c3 H.D$.H...H.D$.. // ... 
```
 这里的代码其实都是由 \`Flushplist\` 这个函数生成的，该函数会调用架构特定的 \`Preprocess\` 和 \`Assemble\` 方法： 
```
go func Flushplist(ctxt \*Link, plist \*Plist, newprog ProgAlloc, myimportpath string) { // ... for \_, s := range text { mkfwd(s) linkpatch(ctxt, s, newprog) ctxt.Arch.Preprocess(ctxt, s, newprog) ctxt.Arch.Assemble(ctxt, s, newprog) linkpcln(ctxt, s) ctxt.populateDWARF(plist.Curfn, s, myimportpath) } } 
```
 这两个函数其实是在 Go 编译器最外层的主函数就确定了，它会从\`archInits\` 中选择当前结构的初始化方法并对当前架构使用的配置进行初始化。 如果目标的机器架构时 x86 的，那么这两个函数最终会使用 \`preprocess\` 和 \`span6\`，作者在这里就不展开介绍这两个特别复杂并且底层的函数了，有兴趣的读者可以通过上述链接找到目标函数的位置了解预处理和汇编的过程，最后的机器码生成过程也都是由这些函数组合完成的。 ## \[\](#%E6%80%BB%E7%BB%93)总结 机器码生成作为 Go 语言编译的最后一步，其实已经到了硬件和机器指令这一层，其中对于内存、寄存器的处理非常复杂并且难以阅读，想要真正掌握这里的处理的步骤和原理还是需要非常多的精力，但是作为软件工程师来说，如果不是 Go 语言编译器的开发者或者需要经常处理汇编语言和机器指令，掌握这些知识的投资回报率实在太低，没有太多的必要。 到这里，整个 Go 语言编译的过程也都介绍完了，从\[词法与语法分析\](https://draveness.me/golang-lexer-and-parser)、\[类型检查\](https://draveness.me/golang-typecheck)、\[中间代码生成\](https://draveness.me/golang-ir-ssa)到最后的\[机器码生成\](https://draveness.me/golang-machinecode)，包含的内容非常复杂，不过经过分析我们已经能够对 Go 语言编译器的原理有足够的了解，也对相关特性的实现更加清楚，后面的章节会介绍一些具体特性的原理，这些原理会依赖于编译期间的一些步骤，所以我们在深入理解 Go 语言的特性之前还是需要先了解一些编译期间完成的工作。 ## \[\](#reference)Reference - \[Introduction to the Go compiler\](https://github.com/golang/go/blob/master/src/cmd/compile/README.md) - \[Introduction to the Go compiler’s SSA backend\](com/golang/go/blob/master/src/cmd/compile/README.md) - \[Instruction set architecture\](https://en.wikipedia.org/wiki/Instruction\_set\_architecture) - \[A Quick Guide to Go’s Assembler\](https://golang.org/doc/asm) - \[A Manual for the Plan 9 assembler\](https://9p.io/sys/doc/asm.html) - \[Assembly language\](https://en.wikipedia.org/wiki/Assembler\_\\(computing\\)) --- 有疑问加站长微信联系（非本文作者） !\[\](https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280)
