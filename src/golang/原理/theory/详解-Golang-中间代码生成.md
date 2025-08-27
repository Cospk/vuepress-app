---
title: 详解 Golang 中间代码生成
source_url: 'https://studygolang.com/articles/19063'
category: Go原理教程
---
```

前两节介绍的 [词法与语法分析](https://draveness.me/golang-lexer-and-parser) 以及 [类型检查](https://draveness.me/golang-typecheck) 两个部分都属于编译器前端，它们负责对源代码进行分析并检查其中存在的词法和语法错误，经过这两个阶段生成的抽象语法树已经不存在任何的结构上的错误了，从这一节开始就进入了编译器后端的工作 — [中间代码生成](https://draveness.me/golang-ir-ssa) 和 [机器码生成](https://draveness.me/golang-machinecode) 了，这里会介绍 Go 语言编译的中间代码生成阶段。

```
 \[中间代码\](https://zh.wikipedia.org/wiki/%E4%B8%AD%E9%96%93%E8%AA%9E%E8%A8%80) 是一种应用于抽象机器的编程语言，它设计的目的主要是帮助我们分析计算机程序，在编译的过程中，编译器会在将语言的源代码转换成目标机器上机器码的过程中，先把源代码转换成一种中间的表述形式，这里要介绍的就是 Go 语言如何将抽象语法树转换成 SSA 表示的中间代码。 ## \[\](#%E4%B8%AD%E9%97%B4%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90)中间代码生成 Go 语言编译器的中间代码具有静态单赋值（SSA）的特性，我们在介绍 \[Go 语言编译过程\](https://draveness.me/golang-compile-intro) 中曾经介绍过静态单赋值，对这个特性不了解的读者可以回到上面的文章阅读相应的部分，当然也可以自行搜索学习相关的知识，不过在这里哪怕对 SSA 一无所知，也不会影响对这一节的理解。 我们再来回忆一下编译阶段入口的主函数中关于中间代码生成的部分，在这一段代码中会初始化 SSA 生成的配置，在配置初始化结束之后会调用 \`funccompile\` 对函数进行编译： 
```
go func Main(archInit func(\*Arch)) { // ... initssaconfig() for i := 0; i < len(xtop); i++ { n := xtop\[i\] if n.Op == ODCLFUNC { funccompile(n) } } compileFunctions() } 
```
 这一节将分别介绍配置的初始化以及函数编译两部分内容，我们会以 \`initssaconfig\` 和 \`funccompile\` 这两个函数作为入口来分析中间代码生成的具体过程和实现原理。 ### \[\](#%E9%85%8D%E7%BD%AE%E5%88%9D%E5%A7%8B%E5%8C%96)配置初始化 我们从 \`initssaconfig\` 函数开始介绍配置初始化的过程，这个函数的执行过程总共可以被分成三个部分，首先是初始化一个新的 \`Types\` 结构体： 
```
go func initssaconfig() { types\_ := ssa.NewTypes() \_ = types.NewPtr(types.Types\[TINTER\]) \_ = types.NewPtr(types.NewPtr(types.Types\[TSTRING\])) \_ = types.NewPtr(types.NewPtr(types.Idealstring)) \_ = types.NewPtr(types.NewSlice(types.Types\[TINTER\])) \_ = types.NewPtr(types.NewPtr(types.Bytetype)) \_ = types.NewPtr(types.NewSlice(types.Bytetype)) // ... \_ = types.NewPtr(types.Errortype) 
```
 当前结构体中存储了指向所有 Go 语言中基本类型的指针，比如 \`Bool\`、\`Int8\`、以及 \`String\` 等，除了生成这些类型之外还会使用 \`NewPtr\` 为其中的一些类型生成指向这些类型的指针： !\[golang-type-and-pointe\](https://static.studygolang.com/190331/c1e79104d63c1bfa6f6b272f2898aa77.png) \`NewPtr\` 函数的主要作用就是根据类型生成指向这些类型的指针，同时它会根据编译器的配置将生成的指针类型缓存在当前类型中，优化类型指针的获取效率： 
```
go func NewPtr(elem \*Type) \*Type { if t := elem.Cache.ptr; t != nil { if t.Elem() != elem { Fatalf("NewPtr: elem mismatch") } return t } t := New(TPTR) t.Extra = Ptr{Elem: elem} t.Width = int64(Widthptr) t.Align = uint8(Widthptr) if NewPtrCacheEnabled { elem.Cache.ptr = t } return t } 
```
 随后会根据当前的 CPU 架构初始化 SSA 配置 \`ssaConfig\`，我们会向 \`NewConfig\` 函数传入目标机器的 CPU 架构、上述代码初始化的 \`Types\` 结构体、上下文信息和 Debug 配置： 
```
go ssaConfig = ssa.NewConfig(thearch.LinkArch.Name, \*types\_, Ctxt, Debug\['N'\] == 0) 
```
 该函数会根据传入的 CPU 架构设置用于生成中间代码和机器码的操作： 
```
go func NewConfig(arch string, types Types, ctxt \*obj.Link, optimize bool) \*Config { c := &Config{arch: arch, Types: types} c.useAvg = true c.useHmul = true switch arch { case "amd64": c.PtrSize = 8 c.RegSize = 8 c.lowerBlock = rewriteBlockAMD64 c.lowerValue = rewriteValueAMD64 c.registers = registersAMD64\[:\] c.gpRegMask = gpRegMaskAMD64 c.fpRegMask = fpRegMaskAMD64 c.FPReg = framepointerRegAMD64 c.LinkReg = linkRegAMD64 c.hasGReg = false case "amd64p32": case "386": case "arm": case "arm64": // ... case "wasm": default: ctxt.Diag("arch %s not implemented", arch) } c.ctxt = ctxt c.optimize = optimize // ... return c } 
```
 这里会设置当前编译器使用的指针和寄存器大小、可用寄存器列表、掩码等编译选项，所有的配置项一旦被创建，在整个编译期间都是只读的并且被全部编译阶段共享，也就是中间代码生成和机器码生成这两部分都会使用这一份配置完成自己的工作。 在 \`initssaconfig\` 方法调用的最后，会初始化一些编译器会用到的 Go 语言运行时的方法： 
```
go assertE2I = sysfunc("assertE2I") assertE2I2 = sysfunc("assertE2I2") assertI2I = sysfunc("assertI2I") assertI2I2 = sysfunc("assertI2I2") deferproc = sysfunc("deferproc") Deferreturn = sysfunc("deferreturn") Duffcopy = sysvar("duffcopy") Duffzero = sysvar("duffzero") // ... 
```
 这些方法会在对应的 runtime 包结构体 \`Pkg\` 中创建一个新的符号 \`obj.LSym\`，表示上述的方法已经被注册到运行时 runtime 包中，我们在后面的中间代码生成中直接使用这些方法。 ### \[\](#%E9%81%8D%E5%8E%86%E5%92%8C%E6%9B%BF%E6%8D%A2)遍历和替换 在生成中间代码之前，我们还需要对抽象语法树中节点的一些元素进行替换，这个替换的过程就是通过 \`walk\` 和很多以 \`walk\` 开头的相关函数实现的，简单展示几个相关函数的签名： 
```
go func walk(fn \*Node) func walkappend(n \*Node, init \*Nodes, dst \*Node) \*Node func walkAppendArgs(n \*Node, init \*Nodes) func walkclosure(clo \*Node, init \*Nodes) \*Node func walkCall(n \*Node, init \*Nodes) func walkcompare(n \*Node, init \*Nodes) \*Node func walkcompareInterface(n \*Node, init \*Nodes) \*Node func walkcompareString(n \*Node, init \*Nodes) \*Node func walkexpr(n \*Node, init \*Nodes) \*Node func walkexprlist(s \[\]\*Node, init \*Nodes) func walkexprlistcheap(s \[\]\*Node, init \*Nodes) func walkexprlistsafe(s \[\]\*Node, init \*Nodes) func walkprint(nn \*Node, init \*Nodes) \*Node func walkinrange(n \*Node, init \*Nodes) \*Node func walkpartialcall(n \*Node, init \*Nodes) \*Node func walkrange(n \*Node) \*Node func walkselect(sel \*Node) func walkselectcases(cases \*Nodes) \[\]\*Node func walkstmt(n \*Node) \*Node func walkstmtlist(s \[\]\*Node) func walkswitch(sw \*Node) 
```
 这些函数会将一些关键字和内建函数转换成真正的函数调用，\`panic\`、\`recover\` 这两个内建函数就会被在上述方法中被转换成 \`gopanic\` 和 \`gorecover\` 两个真正存在的函数。 !\[golang-keyword-and-builtin-mapping\](https://static.studygolang.com/190331/1c4dac67679b88436dd45dd9e206b8a3.png) 上面是从关键字或内建函数到其他实际存在函数的映射，包括管道、哈希相关的操作、用于创建结构体对象的 \`make\`、\`new\` 关键字以及一些控制流中的关键字 \`select\` 等。 转换后的全部函数都属于运行时 runtime 包，我们能在 \[src/cmd/compile/internal/gc/builtin/runtime.go\](https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/builtin/runtime.go) 文件中找到这里出现的函数，但是这里的函数都没有任何的实现，其中只包含了函数签名和定义。 
```
go func makemap64(mapType \*byte, hint int64, mapbuf \*any) (hmap map\[any\]any) func makemap(mapType \*byte, hint int, mapbuf \*any) (hmap map\[any\]any) func makemap\_small() (hmap map\[any\]any) func mapaccess1(mapType \*byte, hmap map\[any\]any, key \*any) (val \*any) // ... func makechan64(chanType \*byte, size int64) (hchan chan any) func makechan(chanType \*byte, size int) (hchan chan any) // ... 
```
 上面的代码只是让编译器能够找到对应符号的函数定义而已，真正的函数实现都在另一个 runtime 包中，Go 语言的主程序在执行时会调用 runtime 中的函数，也就是说关键字和内置函数的功能其实是由语言的编译器和运行时共同完成的。 #### \[\](#channel)Channel 接下来，我们可以简单了解一下几个管道操作在遍历节点时是如何转换成运行时对应方法的，首先介绍向管道中发送消息或者从管道中接受消息，在编译器中会分别使用 \`OSEND\` 和 \`ORECV\` 表示这两个不同的操作： 
```
go func walkexpr(n \*Node, init \*Nodes) \*Node { // ... case OSEND: n1 := n.Right n1 = assignconv(n1, n.Left.Type.Elem(), "chan send") n1 = walkexpr(n1, init) n1 = nod(OADDR, n1, nil) n = mkcall1(chanfn("chansend1", 2, n.Left.Type), nil, init, n.Left, n1) // ... } 
```
 当遇到 \`OSEND\` 操作时，会使用 \`mkcall1\` 来创建一个操作为 \`OCALL\` 的节点，这个节点中包含当前调用的函数 \`chansend1\` 和几个参数，新的 \`OCALL\` 节点会替换当前的 \`OSEND\` 节点修改当前的抽象语法树。 在中间代码生成的阶段遇到 \`ORECV\` 操作时，��译器的处理与遇到 \`OSEND\` 时相差无几，我们也只是将 \`chansend1\` 换成了 \`chanrecv1\`，其他的参数没有太大的变化： 
```
go n = mkcall1(chanfn("chanrecv1", 2, n.Left.Type), nil, &init, n.Left, nodnil()) 
```
 使用 \`close\` 关键字的 \`OCLOSE\` 操作也会在 \`walkexpr\` 函数中被转换成调用 \`closechan\` 的 \`OCALL\` 节点： 
```
go func walkexpr(n \*Node, init \*Nodes) \*Node { // ... case OCLOSE: fn := syslook("closechan") fn = substArgTypes(fn, n.Left.Type) n = mkcall1(fn, nil, init, n.Left) // ... } 
```
 对于 Channel 的这些内置操作都会在编译期间就转换成几个运行时执行的函数，很多人都想要了解 Channel 底层的实现，但是并不知道函数的入口，经过这里的分析我们就知道只需要在分析 \`chanrecv1\`、\`chansend1\` 和 \`closechan\` 几个函数就能理解管道的发送、接受和关闭的实现了。 ### \[\](#%E7%BC%96%E8%AF%91)编译 经过 \`walk\` 函数的处理之后，AST 的抽象语法树就不再会改变了，Go 语言的编译器会使用 \`compileSSA\` 函数将抽象语法树转换成中间代码，我们可以先看一下当前函数的实现： 
```
go func compileSSA(fn \*Node, worker int) { f := buildssa(fn, worker) pp := newProgs(fn, worker) genssa(f, pp) pp.Flush() } 
```
 \`buildssa\` 就是用来构建 SSA 形式中间代码的方法，我们其实可以使用命令行工具来观察当前中间代码的生成过程，假设我们有以下的 Go 语言源代码： 
```
go // hello.go package hello func hello(a int) int { c := a + 2 return c } 
```
 我们可以使用如下的命令来获取上述代码在生成最后中间代码期间经历的 N 个版本的 SSA 中间代码以及最后的汇编代码： 
```
go $ GOSSAFUNC=hello go build hello.go generating SSA for hello buildssa-enter . AS l(3) . . NAME-hello.~r1 a(true) g(1) l(3) x(8) class(PPARAMOUT) int buildssa-body . DCL l(4) . . NAME-hello.c a(true) g(3) l(4) x(0) class(PAUTO) tc(1) used int . AS l(4) colas(true) tc(1) . . NAME-hello.c a(true) g(3) l(4) x(0) class(PAUTO) tc(1) used int . . ADD l(4) tc(1) int . . . NAME-hello.a a(true) g(2) l(3) x(0) class(PPARAM) tc(1) used int . . . LITERAL-2 l(4) tc(1) int . RETURN l(5) tc(1) . RETURN-list . . AS l(5) tc(1) . . . NAME-hello.~r1 a(true) g(1) l(3) x(8) class(PPARAMOUT) int . . . NAME-hello.c a(true) g(3) l(4) x(0) class(PAUTO) tc(1) used int buildssa-exit // ... 
```
 这个命令会首先打印出 \`hello\` 函数对应的抽象语法树，它会分别输出当前函数的 \`Enter\`、\`NBody\` 和 \`Exit\` 三个属性，打印这些属性的工作其实就由下面的函数完成的，因为函数太复杂所以在这里我们已经省略了： 
```
go func buildssa(fn \*Node, worker int) \*ssa.Func { name := fn.funcname() var astBuf \*bytes.Buffer var s state fe := ssafn{ curfn: fn, log: printssa && ssaDumpStdout, } s.curfn = fn s.f = ssa.NewFunc(&fe) s.config = ssaConfig s.f.Type = fn.Type s.f.Config = ssaConfig // ... s.stmtList(fn.Func.Enter) s.stmtList(fn.Nbody) ssa.Compile(s.f) return s.f } 
```
 \`ssaConfig\` 就是我们在这里的第一小节中初始化的，其中包含了与 CPU 架构相关的函数和配置，随后的中间代码生成其实也分成两个阶段，第一个阶段是使用 \`stmtList\` 以及相关函数将 AST 表示的中间代码转换成基于 SSA 的中间代码，第二个阶段会调用 ssa 包的 \`Compile\` 函数对 SSA 中间代码进行多轮的转换。 #### \[\](#ast-%E5%88%B0-ssa)AST 到 SSA \`stmtList\` 方法的主要功能就是为传入数组中的每一个节点调用 \`stmt\` 方法，在这个方法中编译器会根据节点操作符的不同将当前 AST 转换成 SSA 中间代码： 
```
go func (s \*state) stmt(n \*Node) { // ... switch n.Op { case OCALLFUNC: if isIntrinsicCall(n) { s.intrinsicCall(n) return } fallthrough case OCALLMETH, OCALLINTER: s.call(n, callNormal) if n.Op == OCALLFUNC && n.Left.Op == ONAME && n.Left.Class() == PFUNC { if fn := n.Left.Sym.Name; compiling\_runtime && fn == "throw" || n.Left.Sym.Pkg == Runtimepkg && (fn == "throwinit" || fn == "gopanic" || fn == "panicwrap" || fn == "block" || fn == "panicmakeslicelen" || fn == "panicmakeslicecap") { m := s.mem() b := s.endBlock() b.Kind = ssa.BlockExit b.SetControl(m) } } case ODEFER: s.call(n.Left, callDefer) case OGO: s.call(n.Left, callGo) // ... } // ... } 
```
 从上面节选的代码中我们会发现，在遇到函数调用、方法调用、使用 defer 或者 go 时都会执行 \`call\` 生成调用函数的 SSA 节点： 
```
go func (s \*state) call(n \*Node, k callKind) \*ssa.Value { var sym \*types.Sym fn := n.Left switch n.Op { case OCALLFUNC: sym = fn.Sym case OCALLMETH: // ... case OCALLINTER: // ... } dowidth(fn.Type) stksize := fn.Type.ArgWidth() s.stmtList(n.List) t := n.Left.Type args := n.Rlist.Slice() for i, n := range args { f := t.Params().Field(i) s.storeArg(n, f.Type, argStart+f.Offset) } var call \*ssa.Value switch { case k == callDefer: call = s.newValue1A(ssa.OpStaticCall, types.TypeMem, deferproc, s.mem()) case k == callGo: call = s.newValue1A(ssa.OpStaticCall, types.TypeMem, newproc, s.mem()) case sym != nil: call = s.newValue1A(ssa.OpStaticCall, types.TypeMem, sym.Linksym(), s.mem()) // ... } call.AuxInt = stksize s.vars\[&memVar\] = call res := n.Left.Type.Results() fp := res.Field(0) return s.constOffPtrSP(types.NewPtr(fp.Type), fp.Offset+Ctxt.FixedFrameSize()) } 
```
 首先，从 AST 到 SSA 的转化过程中，编译器会生成将函数调用的参数放到栈上的中间代码，处理参数之后才会生成一条运行函数的命令 \`ssa.OpStaticCall\`；如果这里使用的是 defer 关键字，就会插入 \`deferproc\` 函数，使用 go 创建新的 Goroutine 时会插入 \`newproc\` 函数符号，在遇到其他情况时会插入表示普通函数对应的符号。 在上述方法中生成的 SSA 中间代码其实就是如下的形式： 
```
go compiling hello hello func(int) int b1: v1 = InitMem v2 = SP v3 = SB DEAD v4 = LocalAddr <\*int> {a} v2 v1 DEAD v5 = LocalAddr <\*int> {~r1} v2 v1 v6 = Arg {a} v7 = Const64 \[0\] DEAD v8 = Const64 \[2\] v9 = Add64 v6 v8 (c\[int\]) v10 = VarDef {~r1} v1 v11 = Store {int} v5 v9 v10 Ret v11 
```
 这里的 SSA 中间代码其实就是使用 \`GOSSAFUNC=hello go build hello.go\` 命令生成的，也是将 AST 转换成 SSA 的过程。 #### \[\](#%E5%A4%9A%E8%BD%AE%E8%BD%AC%E6%8D%A2)多轮转换 虽然我们在 \`stmt\` 以及相关方法中生成了 SSA 中间代码，但是这些中间代码却仍然需要编译器进行优化以去掉无用代码并对操作数进行精简，也就��上述过程返回的中间代码需要经过 \`ssa.Compile\` 函数的多次处理： 
```
go func Compile(f \*Func) { if f.Log() { f.Logf("compiling %s\\n", f.Name) } phaseName := "init" for \_, p := range passes { f.pass = &p p.fn(f) } phaseName = "" } 
```
 这是删除了很多打印日志和性能分析功能的 \`Compile\` 函数，SSA 需要经历的多轮处理也都保存在 \`passes\` 变量中，其中包含了每一轮处理的名字、使用的函数以及可选的 \`required\` 标志： 
```
go var passes = \[...\]pass{ {name: "number lines", fn: numberLines, required: true}, {name: "early phielim", fn: phielim}, {name: "early copyelim", fn: copyelim}, // ... {name: "loop rotate", fn: loopRotate}, {name: "stackframe", fn: stackframe, required: true}, {name: "trim", fn: trim}, } 
```
 目前的编译器总共引入了将近 50 个需要执行的过程，我们能在 \`GOSSAFUNC=hello go build hello.go\` 命令生成的文件中看到非常多熟悉的名称，例如最后一个 trim 阶段就生成了如下的 SSA 代码： 
```
go pass trim begin pass trim end \[738 ns\] hello func(int) int b1: v1 = InitMem v10 = VarDef {~r1} v1 v2 = SP : SP v6 = Arg {a} : a\[int\] v8 = LoadReg v6 : AX v9 = ADDQconst \[2\] v8 : AX (c\[int\]) v11 = MOVQstore {~r1} v2 v9 v10 Ret v11 
```
 经过将近 50 轮处理的 SSA 中间代码相比处理之前已经有了非常大的改变，执行效率和过程也会有比较大的提升，多轮的处理已经包含了一些机器特定的修改，包括根据目标架构对代码进行改写，不过这里就不会展开介绍每一轮处理的具体内容了。 ## \[\](#%E6%80%BB%E7%BB%93)总结 中间代码的生成过程其实就是从 AST 抽象语法树到 SSA 中间代码的转换过程，在这期间会对语法树中的关键字在进行一次更新，更新后的语法树会经过多轮处理转变成最后的 SSA 中间代码，这里的代码大都是巨长的 switch 语句和复杂的函数以及调用栈，分析和阅读起来也非常困难。 很多 Go 语言中的关键字和内置函数都是在这个阶段被转换成运行时包中方法的，作者在后面的章节会从具体的语言关键字和内置函数的角度介绍一些数据结构和函数的实现。 ## \[\](#reference)Reference - \[Chapter II: Interfaces\](https://github.com/teh-cmc/go-internals/blob/master/chapter2\_interfaces/README.md) - \[Introduction to the Go compiler\](https://github.com/golang/go/blob/master/src/cmd/compile/README.md) - \[中间代码\](https://zh.wikipedia.org/wiki/%E4%B8%AD%E9%96%93%E8%AA%9E%E8%A8%80) 
```

* * *

有疑问加站长微信联系（非本文作者）

![](https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280) 
```
