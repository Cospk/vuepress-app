---
title: 理解 Golang 中函数调用的原理
source_url: 'https://studygolang.com/articles/19059'
category: Go原理教程
---


						<p>函数是 Go 语言中的一等公民，理解和掌握函数的调用过程是深入学习 Golang 时无法跳过的步骤，这里会介绍 Go 语言中函数调用的过程和实现原理并与 C 语言中函数执行的过程进行对比，同时对参数传递的原理进行剖析，让读者能够清楚地知道 Go 在函数的执行过程中究竟都做了哪些工作。</p>

<p>本文将从函数的调用惯例和参数的传递方法两个方面分别介绍函数的执行过程，同时在这里会默认阅读这篇文章的读者已经掌握了 <a href="https://en.wikipedia.org/wiki/Stack_(abstract_data_type)">栈</a>、<a href="https://en.wikipedia.org/wiki/Processor_register">寄存器</a> 等概念，文章并不会就这两部分内容展开进行介绍。</p>

<h2 id="调用惯例">
<a id="调用惯例" class="anchor" href="#%E8%B0%83%E7%94%A8%E6%83%AF%E4%BE%8B" aria-hidden="true"><span class="octicon octicon-link"></span></a>调用惯例</h2>

<p>在计算机科学中，调用惯例其实就是指在实现层面上，一个函数（子程序）如何接受主程序传递的参数并如何将返回值传递回主程序。不同语言对于传递参数和返回值的实现上会有一些差异，不过无论是在 C、Go 语言这种比较接近系统的编程语言，还是 Ruby、Python 这类语言，它们在<em>函数调用</em>上往往都具有相同的形式，也就是一般包含函数名、参数列表两个部分：</p>

<pre><code class="language-c">somefunction(arg0, arg1)
</code></pre>

<p>虽然它们的调用形式看起来差不多，但是在这里我们需要考虑 C 和 Go 这两门语言究竟是如何实现调用惯例的，这对于我们理解的 Go 语言的函数调用原理会有非常大的帮助。</p>

<h3 id="c-语言">
<a id="c-语言" class="anchor" href="#c-%E8%AF%AD%E8%A8%80" aria-hidden="true"><span class="octicon octicon-link"></span></a>C 语言</h3>

<p>如果想要了解 C 语言中的函数调用的原理，我们可以通过 gcc 或者 clang 将 C 语言的代码编译成汇编语言，从汇编语言中可以一窥函数调用的具体过程，作者使用的是编译器和内核的版本如下：</p>

<pre><code class="language-bash">$ gcc --version
gcc (Ubuntu 4.8.2-19ubuntu1) 4.8.2
Copyright (C) 2013 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

$ uname -a
Linux iZ255w13cy6Z 3.13.0-32-generic #57-Ubuntu SMP Tue Jul 15 03:51:08 UTC 2014 x86_64 x86_64 x86_64 GNU/Linux
</code></pre>

<blockquote>
  <p>gcc 和 clang 虽然在编译 C 语言代码时生成的汇编语言可能有比较大的差别，但是生成代码的结构不会有太大的区别，需要注意的是不同内核版本的操作系统生成的汇编指令可能有比较大的不同，不过对于我们这些只是想要了解实现原理的开发者来说没有太多的影响。</p>
</blockquote>

<p>假设我们有以下的 C 语言代码，代码中只包含两个函数，其中一个是主函数 <code>main</code>，另一个就是我们定义的函数 <code>my_function</code>，代码非常简单：</p>

<pre><code class="language-c">int my_function(int arg1, int arg2) {
    return arg1 + arg2;
}

int main() {
    int i = my_function(1, 2);
}
</code></pre>

<p>接下来我们可以使用 <code>gcc -S main.c</code> 将当前的文件编译成包含汇编语言的 <code>main.s</code> 文件，为了减少一些与函数调用无关的噪音，我们将生成的汇编代码经过一些简单地删减展示出来：</p>

<pre><code class="language-c">my_function:
.LFB0:
	.cfi_startproc
	pushq	%rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	movq	%rsp, %rbp
	.cfi_def_cfa_register 6
	movl	%edi, -4(%rbp)
	movl	%esi, -8(%rbp)
	movl	-8(%rbp), %eax
	movl	-4(%rbp), %edx
	addl	%edx, %eax // arg1 + arg2
	popq	%rbp
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
main:
.LFB1:
	.cfi_startproc
	pushq	%rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	movq	%rsp, %rbp
	.cfi_def_cfa_register 6
	subq	$16, %rsp
	movl	$2, %esi // 处理第二个参数
	movl	$1, %edi // 处理第一个参数
	call	my_function
	movl	%eax, -4(%rbp)
	leave
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
</code></pre>

<p>我们可以看到在调用 <code>my_function</code> 函数之前，上述代码将该函数需要的两个参数分别存到了 edi 和 esi 寄存器中；在 <code>my_function</code> 执行时，它会先从寄存器中取出数据并放置到堆栈上，随后通过汇编指令在 eax 寄存器上进行计算，最后的结果其实是通过另一个寄存器 eax 返回的，<code>main</code> 函数在 <code>my_function</code> 返回之后将返回值存储到堆栈上的 <code>i</code> 变量中。</p>

<p>当我们将 <code>my_function</code> 函数的参数增加至 8 个之后，我们再重新编译当前的 C 语言代码，这时可以得到更长的汇编语言代码：</p>

<pre><code class="language-c">// main.c
int my_function(int arg1, int arg2, int arg3, int arg4, int arg5, int arg6, int arg7, int arg8) {
    return arg1 + arg2 + arg3 + arg4 + arg5 + arg6 + arg7 + arg8;
}

int main() {
    my_function(1, 2, 3, 4, 5, 6, 7, 8);
}

// main.s
main:
.LFB1:
	.cfi_startproc
	pushq	%rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	movq	%rsp, %rbp
	.cfi_def_cfa_register 6
	subq	$16, %rsp
	movl	$8, 8(%rsp)
	movl	$7, (%rsp)
	movl	$6, %r9d
	movl	$5, %r8d
	movl	$4, %ecx
	movl	$3, %edx
	movl	$2, %esi
	movl	$1, %edi
	call	my_function
	leave
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
</code></pre>

<p>从这段代码我们可以看出如下的几个问题，首先，前六个参数的传递依然是通过寄存器进行的，分别存储在 edi、esi、edx、ecx、r8d 和 r9d 六个寄存器中，这里的寄存器的使用顺序也是有讲究的，作为调用惯例，传递参数时第一个参数一定会放在 edi 寄存器中，第二个参数放在 esi 寄存器，以此类推；最后的第七和第八两个参数都通过栈进行传递，我们可以通过这张图片来简单理解 <code>main</code> 函数在调用 <code>my_function</code> 时的堆栈：</p>

<blockquote>
  <p>需要说的是，rbp 是一个存储函数调用堆栈基址指针的寄存器，也就是说当前函数栈是从哪里开始的；另一个寄存器 rsp 存储的就是当前函数调用栈栈顶的位置，也就是当前栈的内存分配到了哪里，这两个寄存器表示一个函数栈的开始和结束。</p>
</blockquote>

<p><img src="https://static.studygolang.com/190331/3cf1d7e301e8076c13b63a024699655b.png" alt="c-function-call-stack"/></p>

<p>在调用函数之前通过 <code>subq $16, %rsp</code> 指令分配了 16 个字节的栈地址，随后按照从右向左的顺序对参数进行压栈，将第八和第七这两个参数放置到栈���，在这之后将余下的 6 个参数存储到寄存器后才运行 <code>call my_function</code> 指令调用 <code>my_function</code> 函数：</p>

<pre><code class="language-c">my_function:
.LFB0:
	.cfi_startproc
	pushq	%rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	movq	%rsp, %rbp
	.cfi_def_cfa_register 6
	movl	%edi, -4(%rbp)
	movl	%esi, -8(%rbp)
	movl	%edx, -12(%rbp)
	movl	%ecx, -16(%rbp)
	movl	%r8d, -20(%rbp)
	movl	%r9d, -24(%rbp)
	movl	-8(%rbp), %eax // eax = 2
	movl	-4(%rbp), %edx // edx = 1
	addl	%eax, %edx     // edx = eax + edx = 3
	movl	-12(%rbp), %eax
	addl	%eax, %edx 
	movl	-16(%rbp), %eax
	addl	%eax, %edx 
	movl	-20(%rbp), %eax 
	addl	%eax, %edx
	movl	-24(%rbp), %eax
	addl	%eax, %edx
	movl	16(%rbp), %eax  // eax = 7
	addl	%eax, %edx      // edx = eax + edx = 28
	movl	24(%rbp), %eax  // eax = 8
	addl	%edx, %eax      // edx = eax + edx = 36
	popq	%rbp
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
</code></pre>

<p>因为 <code>my_function</code> 函数没有调用其他的函数，所以并没有通过 <code>subq</code> 修改栈指针寄存器 rsp 中的内容，它的执行过程就是先将寄存器中的全部数据都转移到栈上，然后利用 eax 寄存器计算并返回结果。</p>

<p>简单总结一下，如果我们在 C 语言中调用一个函数，<strong>函数的参数是通过寄存器和栈传递的</strong>，在 x86_64 的机器上，6 个以下（含 6 个）的参数会按照顺序分别使用 edi、esi、edx、ecx、r8d 和 r9d 六个寄存器传递，超过 6 个的剩余参数会通过栈进行传递；<strong>函数的返回值是通过 eax 寄存器进行传递的</strong>，这也就是为什么 C 语言中不支持多个返回值。</p>

<h3 id="golang">
<a id="golang" class="anchor" href="#golang" aria-hidden="true"><span class="octicon octicon-link"></span></a>Golang</h3>

<p>介绍了 C 语言中函数调用的流程之后，接下来我们再来剖析一下 Golang 中函数调用时参数和返回值如何传递的。在这里我们以下面这个非常简单的代码片段为例简单分析一下：</p>

<pre><code class="language-go">package main

func myFunction(a, b int) (int, int) {
	return a + b, a - b
}

func main() {
	myFunction(66, 77)
}
</code></pre>

<p>上述代码片段中的 <code>myFunction</code> 函数接受两个类型为 <code>int</code> 的函数并返回两个类型为 <code>int</code> 的参数，<code>main</code> 函数在调用该函数时会将 66 和 77 两个参数传递到当前函数中，经过编译我们可以得到如下所示的伪汇编代码：</p>

<pre><code class="language-go">"".main STEXT size=68 args=0x0 locals=0x28
	0x0000 00000 (main.go:7)	TEXT	"".main(SB), $40-0
	0x0000 00000 (main.go:7)	MOVQ	(TLS), CX
	0x0009 00009 (main.go:7)	CMPQ	SP, 16(CX)
	0x000d 00013 (main.go:7)	JLS	61
	0x000f 00015 (main.go:7)	SUBQ	$40, SP // 分配 40 字节栈空间
	0x0013 00019 (main.go:7)	MOVQ	BP, 32(SP) // 将基址指针存储到栈上
	0x0018 00024 (main.go:7)	LEAQ	32(SP), BP
	0x001d 00029 (main.go:8)	MOVQ	$66, (SP)  // 第一个参数
	0x0025 00037 (main.go:8)	MOVQ	$77, 8(SP) // 第二个参数
	0x002e 00046 (main.go:8)	PCDATA	$0, $0
	0x002e 00046 (main.go:8)	CALL	"".myFunction(SB)
	0x0033 00051 (main.go:9)	MOVQ	32(SP), BP
	0x0038 00056 (main.go:9)	ADDQ	$40, SP
	0x003c 00060 (main.go:9)	RET
</code></pre>

<blockquote>
  <p>需要注意的是编译这段 Golang 代码时，需要使用如下的命令进行编译 <code>GOOS=linux GOARCH=amd64 go tool compile -S -N -l main.go</code>，如果不加上 -N -l 的参数，编译器会对汇编代码进行优化，编译结果会跟这里的差别非常大。</p>
</blockquote>

<p>根据 <code>main</code> 函数生成的汇编指令，我们可以分析出在 <code>main</code> 函数中调用 <code>myFunction</code> 之前的堆栈情况：</p>

<p><img src="https://static.studygolang.com/190331/5b16b3490d0a6b23e3880e4d32fcd420.png" alt="golang-function-call-stack-before-calling"/></p>

<p>在 <code>main</code> 函数中，通过 <code>SUBQ $40, SP</code> 指令一共在栈上分配了 40 字节的内存空间，最开始的 8 个字节存储了 <code>main</code> 函数的栈基址��针，之后的 16 个字节是为函数 <code>myFunction</code> 的两个返回值预留的空间，最后的 16 字节存储了该函数调用时需要的两个参数，压栈的顺序和 C 语言中一样，也是从右到左。</p>

<p>接下来就调用了汇编指令 <code>CALL "".myFunction(SB)</code>，这个指令首先会将当前函数 <code>main</code> 的返回值压栈，然后改变当前的栈指针 SP 并开始执行 <code>myFunction</code> 的汇编指令：</p>

<pre><code class="language-go">"".myFunction STEXT nosplit size=49 args=0x20 locals=0x0
	0x0000 00000 (main.go:3)	TEXT	"".myFunction(SB), NOSPLIT, $0-32
	0x0000 00000 (main.go:3)	MOVQ	$0, "".~r2+24(SP) // 初始化第一个返回值
	0x0009 00009 (main.go:3)	MOVQ	$0, "".~r3+32(SP) // 初始化第二个返回值
	0x0012 00018 (main.go:4)	MOVQ	"".a+8(SP), AX    // AX = 66
	0x0017 00023 (main.go:4)	ADDQ	"".b+16(SP), AX   // AX = AX + 77 = 143
	0x001c 00028 (main.go:4)	MOVQ	AX, "".~r2+24(SP) // (24)SP = AX = 143
	0x0021 00033 (main.go:4)	MOVQ	"".a+8(SP), AX    // AX = 66
	0x0026 00038 (main.go:4)	SUBQ	"".b+16(SP), AX   // AX = AX - 77 = -11
	0x002b 00043 (main.go:4)	MOVQ	AX, "".~r3+32(SP) // (32)SP = AX = -11
	0x0030 00048 (main.go:4)	RET
</code></pre>

<p>从上述的汇编代码中我们可以看出，当前函数在执行时首先会将 <code>main</code> 函数中的预留的两个返回值地址置成 <code>int</code> 类型的默认值 0，然后根据栈的相对位置获取参数并进行加减操作，最终将值存储回栈中，所以经过分析 <code>myFunction</code> 执行之后的堆栈信息如下：</p>

<p><img src="https://static.studygolang.com/190331/06bee6087f8ce10c6528e3d1be01eea8.png" alt="golang-function-call-stack-before-return"/></p>

<p><code>myFunction</code> 函数返回之后，<code>main</code> 函数就会通过以下的指令来恢复栈基址指针并销毁已经失去作用的 40 字节的栈空间：</p>

<pre><code class="language-go">    0x0033 00051 (main.go:9)    MOVQ    32(SP), BP
    0x0038 00056 (main.go:9)    ADDQ    $40, SP
    0x003c 00060 (main.go:9)    RET
</code></pre>

<p>通过对 Golang 伪汇编语言语言的分析，我们发现 <strong>Go 语言传递和接受参数使用的都是栈</strong>，它没有像 C 语言一样在函数参数较少时使用寄存器传递参数，同时使用栈代替 eax 寄存器传递返回值也能够同时返回多个结果，但是需要注意的是，函数入参和出参的内存空间都需要调用方在栈上进行分配，这种使用栈进行参数传递的方式虽然跟使用寄存器相比在性能上会有一些损失，但是也能够带来其他的好处：</p>

<ol>
  <li>能够降低实现的复杂度；
    <ul>
      <li>不需要考虑超过寄存器个数的参数应该如何传递；</li>
    </ul>
  </li>
  <li>更方便的兼容不同的硬件；
    <ul>
      <li>不同 CPU 的寄存器差别比较大；</li>
    </ul>
  </li>
  <li>函数可以具有多个返回值；
    <ul>
      <li>栈上的内存地址与相比寄存器的个数是无限的；</li>
      <li>使用寄存器支持多个返回值也会非常困难，超出寄存器个数的返回值也需要使用栈来传递；</li>
    </ul>
  </li>
</ol>

<h2 id="参数传递">
<a id="参数传递" class="anchor" href="#%E5%8F%82%E6%95%B0%E4%BC%A0%E9%80%92" aria-hidden="true"><span class="octicon octicon-link"></span></a>参数传递</h2>

<p>除了函数的调用惯例之外，函数的参数在调用时究竟是传值还是传引用也是一个非常有趣的问题，很多人都会说无论是传值还是传引用本质上都是对值的传递，这种论调其实并没有什么意义，我们其实需要知道对函数中参数的修改会不会影响调用方栈上的内容。</p>

<p>不同语言对于参数传递的方式可能设计有所不同，Java 在传递基本类型时会对字面量进行拷贝，不过传递对象参数时就是对象在堆中的地址，相比于 Java 这种稍显复杂的设计，Golang 的设计就简单了很多，<strong>无论是传递基本类型、结构体还是指针，都会对传递的参数进行拷贝</strong>，这一节剩下的内容就会帮助验证这个结论的正确性。</p>

<h3 id="整型和数组">
<a id="整型和数组" class="anchor" href="#%E6%95%B4%E5%9E%8B%E5%92%8C%E6%95%B0%E7%BB%84" aria-hidden="true"><span class="octicon octicon-link"></span></a>整型和数组</h3>

<p>我们构建一个如下的函数 <code>myFunction</code>，它接受两个参数，一个整型变量 <code>i</code> 和另一个是数组 <code>arr</code>，这个函数会将传入的两个参数的地址打印出来，在最外层的主函数也会在方法调用前后分别打印两个参数的地址：</p>

<pre><code class="language-go">func myFunction(i int, arr [2]int) {
	fmt.Printf("in my_funciton - i=%p arr=%p\n", &i, &arr)
}

func main() {
	i := 30
	arr := [2]int{66, 77}
	fmt.Printf("before calling - i=%p arr=%p\n", &i, &arr)
	myFunction(i, arr)
	fmt.Printf("after  calling - i=%p arr=%p\n", &i, &arr)
}

$ go run main.go
before calling - i=0xc00009a000 arr=0xc00009a010
in my_funciton - i=0xc00009a008 arr=0xc00009a020
after  calling - i=0xc00009a000 arr=0xc00009a010
</code></pre>

<p>通过命令运行这段代码我们会发现，<code>main</code> 函数和被调用者 <code>myFunction</code> 中参数的地址是完全不同的。</p>

<p>但是无论是调用 <code>myFunction</code> 前还是调用 <code>myFunction</code> 后，两个参数的地址都没有变化，如果我们尝试在函数内部对参数进行修改又会怎么样呢？</p>

<pre><code class="language-go">func myFunction(i int, arr [2]int) {
	i = 29
	arr[1] = 88
	fmt.Printf("in my_funciton - i=(%d, %p) arr=(%v, %p)\n", i, &i, arr, &arr)
}

func main() {
	i := 30
	arr := [2]int{66, 77}
	fmt.Printf("before calling - i=(%d, %p) arr=(%v, %p)\n", i, &i, arr, &arr)
	myFunction(i, arr)
	fmt.Printf("after  calling - i=(%d, %p) arr=(%v, %p)\n", i, &i, arr, &arr)
}

$ go run main.go
before calling - i=(30, 0xc000072008) arr=([66 77], 0xc000072010)
in my_funciton - i=(29, 0xc000072028) arr=([66 88], 0xc000072040)
after  calling - i=(30, 0xc000072008) arr=([66 77], 0xc000072010)
</code></pre>

<p>可以看到在 <code>myFunction</code> 中对参数的修改也仅仅影响了当前的函数栈，同时并没有对调用方的函数栈有任何的影响，我们也能给出如下的结论 - <strong>Go 语言中对于整型和数组类型的参数都是值传递的</strong>，也就是在调用函数时会对内容进行拷贝，需要注意的是如果当前数组的大小非常的大，这种直接复制传值的方式就会对性能造成比较大的影响。</p>

<h3 id="结构体和指针">
<a id="结构体和指针" class="anchor" href="#%E7%BB%93%E6%9E%84%E4%BD%93%E5%92%8C%E6%8C%87%E9%92%88" aria-hidden="true"><span class="octicon octicon-link"></span></a>结构体和指针</h3>

<p>接下来我们需要再来看一下在 Golang 中的另外两种常见的类型 - 结构体和指针在参数的传递过程中是传值还是传引用的。在这里定义一个只包含一个成员变量的简单结构体 <code>MyStruct</code> 以及接受两个参数的 <code>myFunction</code> 方法：</p>

<pre><code class="language-go">type MyStruct struct {
	i int
}

func myFunction(a MyStruct, b *MyStruct) {
	a.i = 31
	b.i = 41
	fmt.Printf("in my_function - a=(%d, %p) b=(%v, %p)\n", a, &a, b, &b)
}

func main() {
	a := MyStruct{i: 30}
	b := &MyStruct{i: 40}
	fmt.Printf("before calling - a=(%d, %p) b=(%v, %p)\n", a, &a, b, &b)
	myFunction(a, b)
	fmt.Printf("after calling  - a=(%d, %p) b=(%v, %p)\n", a, &a, b, &b)
}

$ go run main.go
before calling - a=({30}, 0xc000018178) b=(&{40}, 0xc00000c028)
in my_function - a=({31}, 0xc000018198) b=(&{41}, 0xc00000c038)
after calling  - a=({30}, 0xc000018178) b=(&{41}, 0xc00000c028)
</code></pre>

<p>从这段代��中我们其实可以看出，如果传递的是结构体，那么在传递参数时依然会对结构体中的全部内容进行拷贝，而传递指针时复制的其实也是指针的内容 - 地址，所以对指针的修改其实就是修改指针背后的值，<code>b.i</code> 可以被理解成 <code>(*b).i</code>，也就是我们先获取指针 <code>b</code> 背后的结构体，再修改结构体中的成员变量，传递的指针其实也就是地址。我们简单对上述代码进行修改，看看当前结构体在内存中是如何布局的：</p>

<pre><code class="language-go">package main

import "unsafe"
import "fmt"

type MyStruct struct {
	i int
	j int
}

func myFunction(ms *MyStruct) {
	ptr := unsafe.Pointer(ms)
	for i := 0; i < 2; i++ {
		c := (*int)(unsafe.Pointer((uintptr(ptr) + uintptr(8*i))))
		*c += i + 1
		fmt.Printf("[%p] %d\n", c, *c)
	}
}

func main() {
	a := &MyStruct{i: 40, j: 50}
	myFunction(a)
	fmt.Printf("[%p] %v\n", a, a)
}

$ go run main.go
[0xc000018180] 41
[0xc000018188] 52
[0xc000018180] &{41 52}
</code></pre>

<p>在这段代码中，我们直接通过指针的方式修改结构体中的成员变量，结构体在内存中其实就是一篇连续的空间，其中的多个成员变量连续布局，指向结构体的指针其实也是指向这个结构体的首地址，如果我们将 <code>MyStruct</code> 指针修改成 <code>int</code> 类型的，那么对新指针的去引用（dereference）就会返回一个整型变量 <code>i</code>，由于一个 <code>int</code> 类型的变量占 8 个字节，所以将指针移动 8 位之后就能获取下一个结构的成员变量 <code>j</code>。</p>

<p>如果我们将上述代码中大部分无关的信息省略并只对其中的 <code>myFuncion</code> 和 <code>MyStruct</code> 这两段代码进行编译：</p>

<pre><code class="language-go">type MyStruct struct {
	i int
	j int
}

func myFunction(ms *MyStruct) *MyStruct {
	return ms
}

// assembly
"".myFunction STEXT nosplit size=20 args=0x10 locals=0x0
	0x0000 00000 (main.go:8)	TEXT	"".myFunction(SB), NOSPLIT, $0-16
	0x0000 00000 (main.go:8)	FUNCDATA	$0, gclocals·aef1f7ba6e2630c93a51843d99f5a28a(SB)
	0x0000 00000 (main.go:8)	FUNCDATA	$1, gclocals·33cdeccccebe80329f1fdbee7f5874cb(SB)
	0x0000 00000 (main.go:8)	MOVQ	$0, "".~r1+16(SP) // 初始化返回值
	0x0009 00009 (main.go:9)	MOVQ	"".ms+8(SP), AX   // 复制引用
	0x000e 00014 (main.go:9)	MOVQ	AX, "".~r1+16(SP) // 返回引用
	0x0013 00019 (main.go:9)	RET
</code></pre>

<p>在这段汇编语言中我们发现当参数是指针时，其实也会使用 <code>MOVQ "".ms+8(SP), AX</code> 指令先对引用进行复制，然后再将复制后的指针作为返回值传递回调用方。</p>

<p><img src="https://static.studygolang.com/190331/71a6c8783a90f4aad25b381dc091ab30.png" alt="golang-pointer-as-argument"/></p>

<p>所以其实将指针作为参数传入某一个函数时，其实在函数内部会对指针进行复制，也就是会同时出现两个指针指向原有的内存空间，所以 Go 语言中『传指针』其实也是传值。</p>

<h3 id="小结">
<a id="小结" class="anchor" href="#%E5%B0%8F%E7%BB%93" aria-hidden="true"><span class="octicon octicon-link"></span></a>小结</h3>

<p>当我们对 Go 语言中大多数常见的数据结构进行验证之后，其实就能够推测出 Go 语言在传递参数时其实使用的就是传值的方式，接收方收到参数时会对这些参数进行复制；了解到这一点之后，在传递数组或者内存占用非常大的结构体时，我们在一些函数中应该尽量使用指针作为参数类型来避免发生大量数据的拷贝而影响性能。</p>

<h2 id="总结">
<a id="总结" class="anchor" href="#%E6%80%BB%E7%BB%93" aria-hidden="true"><span class="octicon octicon-link"></span></a>总结</h2>

<p>这一节我们详细介���了 Go 语言中方法调用时的调用惯例，包括参数传递的过程和原理，简单梳理一下方法调用的过程：Go 通过堆栈的方式对函数的参数和返回值进行传递和接受，在调用函数之前会在栈上为返回值分配合适的内存空间，随后按照入参从右到左按顺序压栈，被调用方接受参数时会对参数进行拷贝后再进行计算，返回值最终会被放置到调用者预留好的栈空间上，Go 语言函数调用的原理可以总结成以下的几条规则：</p>

<ol>
  <li>通过堆栈传递参数，入栈的顺序是从右到左；</li>
  <li>函数返回值通过堆栈传递并由调用者预先分配内存空间；</li>
  <li>调用函数时都是传值，接收方会对入参进行复制再计算；</li>
</ol>

<h2 id="reference">
<a id="reference" class="anchor" href="#reference" aria-hidden="true"><span class="octicon octicon-link"></span></a>Reference</h2>

<ul>
  <li><a href="https://www.tenouk.com/Bufferoverflowc/Bufferoverflow2a.html">The Function Stack</a></li>
  <li><a href="https://stackoverflow.com/questions/16453314/why-do-byte-spills-occur-and-what-do-they-achieve">Why do byte spills occur and what do they achieve?</a></li>
  <li><a href="https://mikeash.com/pyblog/friday-qa-2011-12-16-disassembling-the-assembly-part-1.html">Friday Q&A 2011-12-16: Disassembling the Assembly, Part 1</a></li>
  <li><a href="https://en.wikipedia.org/wiki/X86_calling_conventions">x86 calling conventions</a></li>
  <li><a href="https://en.wikipedia.org/wiki/Call_stack">Call Stack</a></li>
  <li><a href="https://github.com/teh-cmc/go-internals/blob/master/chapter1_assembly_primer/README.md">Chapter I: A Primer on Go Assembly</a></li>
</ul>

						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						