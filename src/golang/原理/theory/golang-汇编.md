---
title: golang 汇编
source_url: 'https://studygolang.com/articles/11970'
category: Go原理教程
---


						<p>在某些场景下，我们需要进行一些特殊优化，因此我们可能需要用到golang汇编，golang汇编源于plan9，此方面的
介绍很多，就不进行展开了。我们WHY和HOW开始讲起。</p>

<p>golang汇编相关的内容还是很少的，而且多数都语焉不详，而且缺乏细节。对于之前没有汇编经验的人来说，是很难
理解的。而且很多资料都过时了，包括官方文档的一些细节也未及时更新。因此需要掌握该知识的人需要仔细揣摩，
反复实验。</p>

<h2 id="why">WHY</h2>
<p>我们为什么需要用到golang的汇编，基本出于以下场景。</p>

<ul>
  <li><a href="https://github.com/minio/sha256-simd">算法加速</a>，golang编译器生成的机器码基本上都是通用代码，而且
优化程度一般，远比不上C/C++的<code class="highlighter-rouge">gcc/clang</code>生成的优化程度高，毕竟时间沉淀在那里。因此通常我们需要用到特
殊优化逻辑、特殊的CPU指令让我们的算法运行速度更快，如<code class="highlighter-rouge">sse4_2/avx/avx2/avx-512</code>等。</li>
  <li>摆脱golang编译器的一些约束，如<a href="https://sitano.github.io/2016/04/28/golang-private/">通过汇编调用其他package的私有函数</a>。</li>
  <li>进行一些hack的事，如<a href="https://github.com/petermattis/fastcgo">通过汇编适配其他语言的ABI来直接调用其他语言的函数</a>。</li>
  <li>利用<code class="highlighter-rouge">//go:noescape</code>进行内存分配优化，golang编译器拥有逃逸分析，用于决定每一个变量是分配在堆内存上
还是函数栈上。但是有时逃逸分析的结果并不是总让人满意，一些变量完全可以分配在函数栈上，但是逃逸分析将其
移动到堆上，因此我们需要使用golang编译器的<a href="https://golang.org/cmd/compile/#hdr-Compiler_Directives"><code class="highlighter-rouge">go:noescape</code></a>
将其转换，强制分配在函数栈上。当然也可以强制让对象分配在堆上，可以参见<a href="https://github.com/golang/go/blob/d1fa58719e171afedfbcdf3646ee574afc08086c/src/reflect/value.go#L2585-L2597">这段实现</a>。</li>
</ul>

<h2 id="how">HOW</h2>
<p>使用到golang会汇编时，golang的对象类型、buildin对象、语法糖还有一些特殊机制就都不见了，全部底层实现
暴露在我们面前，就像你拆开一台电脑，暴露在你面前的是一堆PCB、电阻、电容等元器件。因此我们必须掌握一些
go ABI的机制才能进行golang汇编编程。</p>

<h3 id="go汇编简介">go汇编简介</h3>
<p>这部分内容可以参考:</p>

<ul>
  <li><a href="https://golang.org/doc/asm">1</a></li>
  <li><a href="https://github.com/yangyuqian/technical-articles/blob/master/asm/golang-plan9-assembly-cn.md">2</a></li>
</ul>

<p>go 汇编中有4个核心的伪寄存器，这4个寄存器是编译器用来维护上下文、特殊标识等作用的：</p>
<ul>
  <li>FP(Frame pointer): arguments and locals</li>
  <li>PC(Program counter): jumps and branches</li>
  <li>SB(Static base pointer): global symbols</li>
  <li>SP(Stack pointer): top of stack</li>
</ul>

<p>所有用户空间的数据都可以通过FP(局部数据、输入参数、返回值)或SB(全局数据)访问。
通常情况下，不会对<code class="highlighter-rouge">SB</code>/<code class="highlighter-rouge">FP</code>寄存器进行运算操作，通常情况以会以<code class="highlighter-rouge">SB</code>/<code class="highlighter-rouge">FP</code>作为基准地址，进行偏移解引用
等操作。</p>

<p>而且在某些情况下<code class="highlighter-rouge">SB</code>更像一些声明标识，其标识语句的作用。例如：</p>

<ol>
  <li><code class="highlighter-rouge">TEXT runtime·_divu(SB), NOSPLIT, $16-0</code> 在这种情况下，<code class="highlighter-rouge">TEXT</code>、<code class="highlighter-rouge">·</code>、<code class="highlighter-rouge">SB</code>共同作用声明了一个函数
<code class="highlighter-rouge">runtime._divu</code>，这种情况下，不能对<code class="highlighter-rouge">SB</code>进行解引用。</li>
  <li><code class="highlighter-rouge">GLOBL fast_udiv_tab<>(SB), RODATA, $64</code> 在这种情况下，<code class="highlighter-rouge">GLOBL</code>、<code class="highlighter-rouge">fast_udiv_tab</code>、<code class="highlighter-rouge">SB</code>共同作用，
在RODATA段声明了一个私有全局变量<code class="highlighter-rouge">fast_udiv_tab</code>，大小为64byte，此时可以对<code class="highlighter-rouge">SB</code>进行偏移、解引用。</li>
  <li><code class="highlighter-rouge">CALL    runtime·callbackasm1(SB)</code> 在这种情况下，<code class="highlighter-rouge">CALL</code>、<code class="highlighter-rouge">runtime·callbackasm1</code>、<code class="highlighter-rouge">SB</code>共同标识，
标识调用了一个函数<code class="highlighter-rouge">runtime·callbackasm1</code>。</li>
  <li><code class="highlighter-rouge">MOVW    $fast_udiv_tab<>-64(SB), RM</code> 在这种情况下，与2类似，但不是声明，是解引用全局变量
<code class="highlighter-rouge">fast_udiv_tab</code>。</li>
</ol>

<p><code class="highlighter-rouge">FP</code>伪寄存器用来标识函数参数、返回值。例如<code class="highlighter-rouge">0(FP)</code>表示函数参数其实的位置，<code class="highlighter-rouge">8(FP)</code>表示函数参数偏移8byte
的位置。如果操作命令是<code class="highlighter-rouge">MOVQ arg+8(FP), AX</code>的话，<code class="highlighter-rouge">MOVQ</code>表示对8byte长的内存进行移动，其实位置是函数参数偏移8byte
的位置，目的是寄存器<code class="highlighter-rouge">AX</code>，因此此命令为将一个参数赋值给寄存器<code class="highlighter-rouge">AX</code>，参数长度是8byte，可能是一个uint64，<code class="highlighter-rouge">FP</code>
前面的<code class="highlighter-rouge">arg+</code>是标记。至于<code class="highlighter-rouge">FP</code>的偏移怎么计算，会在后面的<a href="#go函数调用">go函数调用</a>中进行表述。同时我们
还可以在命令中对<code class="highlighter-rouge">FP</code>的解引用进行标记，例如<code class="highlighter-rouge">first_arg+0(FP)</code>将<code class="highlighter-rouge">FP</code>的起始标记为参数<code class="highlighter-rouge">first_arg</code>，但是
<code class="highlighter-rouge">first_arg</code>只是一个标记，在汇编中<code class="highlighter-rouge">first_arg</code>是不存在的，不能直接引用<code class="highlighter-rouge">first_arg</code>。但是go汇编编译器强制
要求我们为每一次<code class="highlighter-rouge">FP</code>解引用加上一个标���，可能是为了可读性。</p>

<p><code class="highlighter-rouge">SP</code>是栈指针寄存器，指向当前函数栈的栈顶，可以向<code class="highlighter-rouge">+</code>方向解引用，即向高地址偏移，可以获取到<code class="highlighter-rouge">FP</code>指向的范围
(函数参数、返回值)，例如<code class="highlighter-rouge">p+32(SP)</code>。也可以向<code class="highlighter-rouge">-</code>方向解引用，即向低地址偏移，访问函数栈上的局部变量，例如
<code class="highlighter-rouge">p-16(SP)</code>。由于可以对<code class="highlighter-rouge">SP</code>进行赋值运算，通常接触到的代码不会向<code class="highlighter-rouge">-</code>方向解引用，而是使用命令将<code class="highlighter-rouge">SP</code>的值减少
，例如<code class="highlighter-rouge">SUBQ    $24, SP</code>将<code class="highlighter-rouge">SP</code>减少24，则此时的<code class="highlighter-rouge">p+0(SP)</code>等于减之前的<code class="highlighter-rouge">p-24(SP)</code>。</p>

<p>注意，当<code class="highlighter-rouge">SP</code>寄存器操作时，如果前面没有指示参数时，则代表的是硬件栈帧寄存器<code class="highlighter-rouge">SP</code>，此处需要注意。</p>

<p>对于函数控制流的跳转，是用label来实现的，label只在函数内可见，类似<code class="highlighter-rouge">goto</code>语句：</p>

<pre><code class="language-asm">next:
  MOVW $0, R1
  JMP  next
</code></pre>

<h4 id="文件命名">文件命名</h4>
<p>使用到汇编时，即表明了所写的代码不能够跨平台使用，因此需要针对不同的平台使用不同的汇编
代码。go编译器采用文件名中加入平台名后缀进行区分。</p>

<p>比如<code class="highlighter-rouge">sqrt_386.s  sqrt_amd64p32.s  sqrt_amd64.s  sqrt_arm.s</code></p>

<p>或者使用<code class="highlighter-rouge">+build tag</code>也可以，详情可以参考<a href="https://golang.org/pkg/go/build/">go/build</a>。</p>

<h4 id="函数声明">函数声明</h4>
<p>首先我们先需要对go汇编代码有一个抽象的认识，因此我们可以先看一段go汇编代码：</p>
<pre><code class="language-asm">TEXT runtime·profileloop(SB),NOSPLIT,$8
  MOVQ    $runtime·profileloop1(SB), CX
  MOVQ    CX, 0(SP)
  CALL    runtime·externalthreadhandler(SB)
  RET
</code></pre>

<p>此处声明了一个函数<code class="highlighter-rouge">profileloop</code>，函数的声明以<code class="highlighter-rouge">TEXT</code>标识开头，以<code class="highlighter-rouge">${package}·${function}</code>为函数名。
如何函数属于本package时，通常可以不写<code class="highlighter-rouge">${package}</code>，只留<code class="highlighter-rouge">·${function}</code>即可。<code class="highlighter-rouge">·</code>在mac上可以用<code class="highlighter-rouge">shift+option+9</code>
打出。<code class="highlighter-rouge">$8</code>表示该函数栈大小为8byte。当有<code class="highlighter-rouge">NOSPLIT</code>标识时，可以不写输入参数、返回值的大小。</p>

<p>那我们再看一个函数：</p>

<pre><code class="language-asm">TEXT ·add(SB),$0-24
  MOVQ x+0(FP), BX
  MOVQ y+8(FP), BP
  ADDQ BP, BX
  MOVQ BX, ret+16(FP)
  RET
</code></pre>

<p>该函数等同于：</p>
<div class="language-go highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">func</span><span class="x"> </span><span class="n">add</span><span class="p">(</span><span class="n">x</span><span class="p">,</span><span class="x"> </span><span class="n">y</span><span class="x"> </span><span class="kt">int64</span><span class="p">)</span><span class="x"> </span><span class="kt">int</span><span class="x"> </span><span class="p">{</span><span class="x">
    </span><span class="k">return</span><span class="x"> </span><span class="n">x</span><span class="x"> </span><span class="o">+</span><span class="x"> </span><span class="n">y</span><span class="x">
</span><span class="p">}</span><span class="x">
</span></code></pre>