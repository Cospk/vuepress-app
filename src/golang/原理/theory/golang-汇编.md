---
title: golang 汇编
source_url: 'https://studygolang.com/articles/11970'
category: Go原理教程
---
```

在某些场景下，我们需要进行一些特殊优化，因此我们可能需要用到golang汇编，golang汇编源于plan9，此方面的 
```
 介绍很多，就不进行展开了。我们WHY和HOW开始讲起。 golang汇编相关的内容还是很少的，而且多数都语焉不详，而且缺乏细节。对于之前没有汇编经验的人来说，是很难 理解的。而且很多资料都过时了，包括官方文档的一些细节也未及时更新。因此需要掌握该知识的人需要仔细揣摩， 反复实验。 ## WHY 我们为什么需要用到golang的汇编，基本出于以下场景。 - \[算法加速\](https://github.com/minio/sha256-simd)，golang编译器生成的机器码基本上都是通用代码，而且 优化程度一般，远比不上C/C++的\`gcc/clang\`生成的优化程度高，毕竟时间沉淀在那里。因此通常我们需要用到特 殊优化逻辑、特殊的CPU指令让我们的算法运行速度更快，如\`sse4\_2/avx/avx2/avx-512\`等。 - 摆脱golang编译器的一些约束，如\[通过汇编调用其他package的私有函数\](https://sitano.github.io/2016/04/28/golang-private/)。 - 进行一些hack的事，如\[通过汇编适配其他语言的ABI来直接调用其他语言的函数\](https://github.com/petermattis/fastcgo)。 - 利用\`//go:noescape\`进行内存分配优化，golang编译器拥有逃逸分析，用于决定每一个变量是分配在堆内存上 还是函数栈上。但是有时逃逸分析的结果并不是总让人满意，一些变量完全可以分配在函数栈上，但是逃逸分析将其 移动到堆上，因此我们需要使用golang编译器的\[\`go:noescape\`\](https://golang.org/cmd/compile/#hdr-Compiler\_Directives) 将其转换，强制分配在函数栈上。当然也可以强制让对象分配在堆上，可以参见\[这段实现\](https://github.com/golang/go/blob/d1fa58719e171afedfbcdf3646ee574afc08086c/src/reflect/value.go#L2585-L2597)。 ## HOW 使用到golang会汇编时，golang的对象类型、buildin对象、语法糖还有一些特殊机制就都不见了，全部底层实现 暴露在我们面前，就像你拆开一台电脑，暴露在你面前的是一堆PCB、电阻、电容等元器件。因此我们必须掌握一些 go ABI的机制才能进行golang汇编编程。 ### go汇编简介 这部分内容可以参考: - \[1\](https://golang.org/doc/asm) - \[2\](https://github.com/yangyuqian/technical-articles/blob/master/asm/golang-plan9-assembly-cn.md) go 汇编中有4个核心的伪寄存器，这4个寄存器是编译器用来维护上下文、特殊标识等作用的： - FP(Frame pointer): arguments and locals - PC(Program counter): jumps and branches - SB(Static base pointer): global symbols - SP(Stack pointer): top of stack 所有用户空间的数据都可以通过FP(局部数据、输入参数、返回值)或SB(全局数据)访问。 通常情况下，不会对\`SB\`/\`FP\`寄存器进行运算操作，通常情况以会以\`SB\`/\`FP\`作为基准地址，进行偏移解引用 等操作。 而且在某些情况下\`SB\`更像一些声明标识，其标识语句的作用。例如： 1. \`TEXT runtime·\_divu(SB), NOSPLIT, $16-0\` 在这种情况下，\`TEXT\`、\`·\`、\`SB\`共同作用声明了一个函数 \`runtime.\_divu\`，这种情况下，不能对\`SB\`进行解引用。 2. \`GLOBL fast\_udiv\_tab<>(SB), RODATA, $64\` 在这种情况下，\`GLOBL\`、\`fast\_udiv\_tab\`、\`SB\`共同作用， 在RODATA段声明了一个私有全局变量\`fast\_udiv\_tab\`，大小为64byte，此时可以对\`SB\`进行偏移、解引用。 3. \`CALL runtime·callbackasm1(SB)\` 在这种情况下，\`CALL\`、\`runtime·callbackasm1\`、\`SB\`共同标识， 标识调用了一个函数\`runtime·callbackasm1\`。 4. \`MOVW $fast\_udiv\_tab<>-64(SB), RM\` 在这种情况下，与2类似，但不是声明，是解引用全局变量 \`fast\_udiv\_tab\`。 \`FP\`伪寄存器用来标识函数参数、返回值。例如\`0(FP)\`表示函数参数其实的位置，\`8(FP)\`表示函数参数偏移8byte 的位置。如果操作命令是\`MOVQ arg+8(FP), AX\`的话，\`MOVQ\`表示对8byte长的内存进行移动，其实位置是函数参数偏移8byte 的位置，目的是寄存器\`AX\`，因此此命令为将一个参数赋值给寄存器\`AX\`，参数长度是8byte，可能是一个uint64，\`FP\` 前面的\`arg+\`是标记。至于\`FP\`的偏移怎么计算，会在后面的\[go函数调用\](#go函数调用)中进行表述。同时我们 还可以在命令中对\`FP\`的解引用进行标记，例如\`first\_arg+0(FP)\`将\`FP\`的起始标记为参数\`first\_arg\`，但是 \`first\_arg\`只是一个标记，在汇编中\`first\_arg\`是不存在的，不能直接引用\`first\_arg\`。但是go汇编编译器强制 要求我们为每一次\`FP\`解引用加上一个标���，可能是为了可读性。 \`SP\`是栈指针寄存器，指向当前函数栈的栈顶，可以向\`+\`方向解引用，即向高地址偏移，可以获取到\`FP\`指向的范围 (函数参数、返回值)，例如\`p+32(SP)\`。也可以向\`-\`方向解引用，即向低地址偏移，访问函数栈上的局部变量，例如 \`p-16(SP)\`。由于可以对\`SP\`进行赋值运算，通常接触到的代码不会向\`-\`方向解引用，而是使用命令将\`SP\`的值减少 ，例如\`SUBQ $24, SP\`将\`SP\`减少24，则此时的\`p+0(SP)\`等于减之前的\`p-24(SP)\`。 注意，当\`SP\`寄存器操作时，如果前面没有指示参数时，则代表的是硬件栈帧寄存器\`SP\`，此处需要注意。 对于函数控制流的跳转，是用label来实现的，label只在函数内可见，类似\`goto\`语句： 
```
asm next: MOVW $0, R1 JMP next 
```
 #### 文件命名 使用到汇编时，即表明了所写的代码不能够跨平台使用，因此需要针对不同的平台使用不同的汇编 代码。go编译器采用文件名中加入平台名后缀进行区分。 比如\`sqrt\_386.s sqrt\_amd64p32.s sqrt\_amd64.s sqrt\_arm.s\` 或者使用\`+build tag\`也可以，详情可以参考\[go/build\](https://golang.org/pkg/go/build/)。 #### 函数声明 首先我们先需要对go汇编代码有一个抽象的认识，因此我们可以先看一段go汇编代码： 
```
asm TEXT runtime·profileloop(SB),NOSPLIT,$8 MOVQ $runtime·profileloop1(SB), CX MOVQ CX, 0(SP) CALL runtime·externalthreadhandler(SB) RET 
```
 此处声明了一个函数\`profileloop\`，函数的声明以\`TEXT\`标识开头，以\`${package}·${function}\`为函数名。 如何函数属于本package时，通常可以不写\`${package}\`，只留\`·${function}\`即可。\`·\`在mac上可以用\`shift+option+9\` 打出。\`$8\`表示该函数栈大小为8byte。当有\`NOSPLIT\`标识时，可以不写输入参数、返回值的大小。 那我们再看一个函数： 
```
asm TEXT ·add(SB),$0-24 MOVQ x+0(FP), BX MOVQ y+8(FP), BP ADDQ BP, BX MOVQ BX, ret+16(FP) RET 
```
 该函数等同于： 
```
 func add(x, y int64) int { return x + y } 
```
