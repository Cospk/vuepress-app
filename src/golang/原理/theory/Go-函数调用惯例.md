---
title: Go 函数调用惯例
source_url: 'https://studygolang.com/articles/11991'
category: Go原理教程
---
```

```
 对比C++，Go不支持重载和默认参数，支持不定长变参，多返回值，匿名函数和闭包。 ## \[\](#C入栈顺序和返回值 "C入栈顺序和返回值")C入栈顺序和返回值 之前有个疑问，为什么Go支持多返回值，而C不行呢。首先回顾一下C函数调用时的栈空间 \[程序员的自我修养Ch10-2\]()。函数调用时首先参数和返回地址入栈，其次入栈old ebp和需要保存的寄存器，之后是函数内部的局部变量和其他数据。两个指针ebp和esp分别指向返回地址和栈顶。 > 函数返回值的传递有多种情况。若小于4字节，返回值存入eax寄存器，由函数调用方读取eax。若返回值5到8字节，采用eax和edx联合返回。若大于8个字节，首先在栈上额外开辟一部分空间temp，将temp对象的地址做为隐藏参数入栈。函数返回时将数据拷贝给temp对象，并将temp对象的地址用寄存器eax传出。调用方从eax指向的temp对象拷贝内容。 !\[\](https://ninokop.github.io/2017/10/26/Go-%E5%87%BD%E6%95%B0%E8%B0%83%E7%94%A8%E6%83%AF%E4%BE%8B/return.png) ## \[\](#Go的多返回值实现 "Go的多返回值实现")Go的多返回值实现 C需要多返回值的时候，通常是显示的将返回值存放的地址作为参数传递给函数。Go的调用惯例和C不同，Go把\*\*ret1和ret2在参数arg1 arg2之前入栈并保留空位\*\*，被调用方将返回值放在这两个空位上。 
```
go void f(int arg1, int arg2, int \*ret, int \*ret2) func f(arg1, arg2 int) (ret1, ret2 int) 
```
 > 所以无论是Go还是C，为了避免函数返回的对象拷贝，最好不要返回大对象。 ## \[\](#匿名函数和闭包 "匿名函数和闭包")匿名函数和闭包 匿名函数可以\*\*赋值给变量\*\*，作为结构体字段，或者在channel中传递。匿名函数作为返回值赋值给f变量，通过gdb调试时\`info locals\`可以查看到f变量的内容是一个地址，\`info symbol \[addr\]\` 可以看到这个地址指向了符号表中的\`main.test.func1.f\`符号。\*\*返回的匿名函数\*\*就是一个\*\*保存了匿名函数地址的对象\*\*。 
```
go func test() func(int) int { return func(x int) int { x += x return x } } f := test() f(100) // output: 200 
```
 闭包是���数式语言的概念。同样闭包是一个对象\`FuncVal{ func\_addr, closure\_var\_point}\`，它包含了函数地址和引用到的变量的\[地址\]()。现在有个问题，如果变量x是分配在栈上的，函数test返回以后对应的栈就失效了，test返回的匿名函数中变量x将引用一个失效的位置。所以闭包环境中引用的变量不会在栈上分配。Go编译器通过\*\*逃逸分析\*\*自动识别出变量的作用域，在堆上分配内存，而不是在函数f的栈上。 > 逃逸分析可以解释为什么Go可以返回局部变量的地址，而C不行。 
```
go func test() func() { x := 100 fmt.Printf("x (%p) = %d\\n", &x, x) return func() { fmt.Printf("x (%p) = %d\\n", &x, x) } } f := test() f() // get same output 
```
 参考文章 \[go基础篇 匿名函数和闭包函数\](http://www.pydevops.com/2016/05/25/go%E5%9F%BA%E7%A1%80%E7%AF%87-%E5%8C%BF%E5%90%8D%E5%87%BD%E6%95%B0%E5%92%8C%E9%97%AD%E5%8C%85%E5%87%BD%E6%95%B0/) ## \[\](#defer-延迟调用 "defer 延迟调用")defer 延迟调用 ### \[\](#defer的实现 "defer的实现")defer的实现 goroutine的控制结构里有一张记录defer表达式的表，编译器在defer出现的地方插入了指令 \*\*call runtime.deferproc\*\*，它将defer的表达式记录在表中。然后在函数返回之前依次从defer表中将表达式出栈执行，这时插入的指令是\*\*call runtime.deferreturn\*\*。 ### \[\](#defer与return "defer与return")defer与return \*\*defer在return之前执行的含义是\*\*：函数返回时先执行返回值赋值，然后调用defer表达式，最后执行return。以下例子摘自\[go-internals\](https://tiancaiamao.gitbooks.io/go-internals/content/zh/03.4.html)，总结的都是使用defer的坑。defer确实是在return前调用的，但由于\[return 语句并不是原子指令\]()，defer被插入到了赋值和ret之间，因此可能有机会改变最终的返回值。 
```
go func f() (result int) { defer func() { // result = 0 result++ // result++ }() // return 1 return 0 } 
```
 
```
go func f() (r int) { t := 5 // r = t = 5 defer func() { // t = t + 5 = 10 t = t + 5 // return 5 }() return t } 
```
 
```
go func f() (r int) { defer func(r int) { // r = 1 r = r + 5 // internal r = 6 }(r) // return 1 return 1 } 
```
 > 这个现象是在之前做格式化error输出的时候发现的。 ### \[\](#defer与闭包 "defer与闭包")defer与闭包 defer\*\*调用参数x是在defer注册时求值或复制的\*\*，因此以下例子中x在最终调用时仍为10，而由于y是\*\*闭包参数，闭包复制的是y变量指针\*\*，因此最终y为120，实现了延迟读取。在实际应用中还可以用指针来实现defer的延迟读取。 
```
go fund test() { x, y := 10, 20 defer func(i int) { fmt.Println("defer:", i, y) // output: 10 120 }(x) x += 10 y += 100 fmt.Println(x, y) // output: 20 120 } 
```
 ### \[\](#defer的性能 "defer的性能")defer的性能 简单的BenchmarkTest测试发现滥用defer可能会导致性能问题，尤其在大循环中。 !\[\](https://ninokop.github.io/2017/10/26/Go-%E5%87%BD%E6%95%B0%E8%B0%83%E7%94%A8%E6%83%AF%E4%BE%8B/benchmark\_test.png) 参考文章 \[Go学习笔记\](https://github.com/qyuhen/book)
