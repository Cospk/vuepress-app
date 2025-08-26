---
title: 深度解密Go语言之关于 interface 的 10 个问题
source_url: 'https://studygolang.com/articles/19997'
category: Go原理教程
---


						<p>这次文章依然很长，基本上涵盖了 <code>interface</code> 的方方面面，有例子，有源码分析，有汇编分析，前前后后写了 20 多天。洋洋洒洒，长篇大论，依然有些东西没有涉及到，比如文章里没有写到<code>反射</code>，当然，后面会单独写一篇关于<code>反射</code>的文章，这是后话。</p>
<p>还是希望看你在看完文章后能有所收获，有任何问题或意见建议，欢迎在文章后面留言。</p>
<p>这篇文章的架构比较简单，直接抛出 10 个问题，一一解答。</p>
<h1 id="go-语言与鸭子类型的关系">1. Go 语言与鸭子类型的关系</h1>
<p>先直接来看维基百科里的定义：</p>
<blockquote>
<p>If it looks like a duck, swims like a duck, and quacks like a duck, then it probably is a duck.</p>
</blockquote>
<p>翻译过来就是：如果某个东西长得像鸭子，像鸭子一样游泳，像鸭子一样嘎嘎叫，那它就可以被看成是一只鸭子。</p>
<p><code>Duck Typing</code>，鸭子类型，是动态编程语言的一种对象推断策略，它更关注对象能如何被使用，而不是对象的类型本身。Go 语言作为一门静态语言，它通过通过接口的方式完美支持鸭子类型。</p>
<p>例如，在动态语言 python 中，定义一个这样的函数：</p>
<pre class="python"><code class="hljs"><span class="hljs-function"><span class="hljs-keyword">def</span> <span class="hljs-title">hello_world</span><span class="hljs-params">(coder)</span>:</span>
    coder.say_hello()</code></pre>
<p>当调用此函数的时候，可以传入任意类型，只要它实现了 <code>say_hello()</code> 函数就可以。如果没有实现，运行过程中会出现错误。</p>
<p>而在静态语言如 Java, C++ 中，必须要显示地声明实现了某个接口，之后，才能用在任何需要这个接口的地方。如果你在程序中调用 <code>hello_world</code> 函数，却传入了一个根本就没有实现 <code>say_hello()</code> 的类型，那在编译阶段就不会通过。这也是静态语言比动态语言更安全的原因。</p>
<p>动态语言和静态语言的差别在此就有所体现。静态语言在编译期间就能发现类型不匹配的错误，不像动态语言，必须要运行到那一行代码才会报错。插一句，这也是我不喜欢用 <code>python</code> 的一个原因。当然，静态语言要求程序员在编码阶段就要按照规定来编写程序，为每个变量规定数据类型，这在某种程度上，加大了工作量，也加长了代码量。动态语言则没有这些要求，可以让人更专注在业务上，代码也更短，写起来更快，这一点，写 python ��同学比较清楚。</p>
<p>Go 语言作为一门现代静态语言，是有后发优势的。它引入了动态语言的便利，同时又会进行静态语言的类型检查，写起来是非常 Happy 的。Go 采用了折中的做法：不要求类型显示地声明实现了某个接口，只要实现了相关的方法即可，编译器就能检测到。</p>
<p>来看个例子：</p>
<p>先定义一个接口，和使用此接口作为参数的函数：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> IGreeting <span class="hljs-keyword">interface</span> {
    sayHello()
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">sayHello</span><span class="hljs-params">(i IGreeting)</span></span> {
    i.sayHello()
}</code></pre>
<p>再来定义两个结构体：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> Go <span class="hljs-keyword">struct</span> {}
<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(g Go)</span> <span class="hljs-title">sayHello</span><span class="hljs-params">()</span></span> {
    fmt.Println(<span class="hljs-string">"Hi, I am GO!"</span>)
}

<span class="hljs-keyword">type</span> PHP <span class="hljs-keyword">struct</span> {}
<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p PHP)</span> <span class="hljs-title">sayHello</span><span class="hljs-params">()</span></span> {
    fmt.Println(<span class="hljs-string">"Hi, I am PHP!"</span>)
}</code></pre>
<p>最后，在 main 函数里调用 sayHello() 函数：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    golang := Go{}
    php := PHP{}

    sayHello(golang)
    sayHello(php)
}</code></pre>
<p>程序输出：</p>
<pre class="shell"><code class="hljs">Hi, I am GO!
Hi, I am PHP!</code></pre>
<p>在 main 函数中，调用调用 sayHello() 函数时，传入了 <code>golang, php</code> 对象，它们并没有显式地声明实现了 IGreeting 类型，只是实现了接口所规定的 sayHello() 函数。实际上，编译器在调用 sayHello() 函数时，会隐式地将 <code>golang, php</code> 对象转换成 IGreeting 类型，这也是静态语言的类型检查功能。</p>
<p>顺带再提一下动态语言的特点：</p>
<blockquote>
<p>变量绑定的类型是不确定的，在运行期间才能确定<br>
函数和方法可以接收任何类型的参数，且调用时不检查参数类型<br>
不需要实现接口</p>
</blockquote>
<p>总结一下，鸭子类型是一种动态语言的风格，在这种风格中，一个对象有效的语义，不是由继承自特定的类或实现特定的接口，而是由它"当前方法和属性的集合"决定。Go 作为一种静态语言，通过接口实现了 <code>鸭子类型</code>，实际上是 Go 的编译器在其中作了隐匿的转换工作。</p>
<h1 id="值接收者和指针接收者的区别">2. 值接收者和指针接收者的区别</h1>
<h2 id="方法">方法</h2>
<p>方法能给用户自定义的类型添加新的行为。它和函数的区别在于方法有一个接收者，给一个函数添加一个接收者，那么它就变成了方法。接收者可以是<code>值接收者</code>，也可以是<code>指针接收者</code>。</p>
<p>在调用方法的时候，值类型既可以调用<code>值接收者</code>的方法，也可以调用<code>指针接收者</code>的方法；指针类型既可以调用<code>指针接收者</code>的方法，也可以调用<code>值接收者</code>的方法。</p>
<p>也就是说，不管方法的接收者是什么类型，该类型的值和指针都可以调用，不必严格符合接收者的类型。</p>
<p>来看个例子：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-keyword">type</span> Person <span class="hljs-keyword">struct</span> {
    age <span class="hljs-keyword">int</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p Person)</span> <span class="hljs-title">howOld</span><span class="hljs-params">()</span> <span class="hljs-title">int</span></span> {
    <span class="hljs-keyword">return</span> p.age
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p *Person)</span> <span class="hljs-title">growUp</span><span class="hljs-params">()</span></span> {
    p.age += <span class="hljs-number">1</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-comment">// qcrao 是值类型</span>
    qcrao := Person{age: <span class="hljs-number">18</span>}

    <span class="hljs-comment">// 值类型 调用接收者也是值类型的方法</span>
    fmt.Println(qcrao.howOld())

    <span class="hljs-comment">// 值类型 调用接收者是指针类型的方法</span>
    qcrao.growUp()
    fmt.Println(qcrao.howOld())

    <span class="hljs-comment">// ----------------------</span>

    <span class="hljs-comment">// stefno 是指针类型</span>
    stefno := &Person{age: <span class="hljs-number">100</span>}

    <span class="hljs-comment">// 指针类型 调用接收者是值类型的方法</span>
    fmt.Println(stefno.howOld())

    <span class="hljs-comment">// 指针类型 调用接收者也是指针类型的方法</span>
    stefno.growUp()
    fmt.Println(stefno.howOld())
}</code></pre>
<p>上例子的输出结果是：</p>
<pre class="shell"><code class="hljs">18
19
100
101</code></pre>
<p>调用了 <code>growUp</code> 函数后，不管调用者是值类型还是指针类型，它的 <code>Age</code> 值都改变了。</p>
<p>实际上，当类型和方法的接收者类型不同时，其实是编译器在背后做了一些工作，用一个表格来呈现：</p>
<table>
<thead>
<tr class="header">
<th>-</th>
<th>值接收者</th>
<th>指针接收者</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>值类型调用者</td>
<td>方法会使用调用者的一个副本，类似于“传值”</td>
<td>使用值的引用来调用方法，上例中，<code>qcrao.growUp()</code> 实际上是 <code>(&qcrao).growUp()</code></td>
</tr>
<tr class="even">
<td>指针类型调用者</td>
<td>指针被解引用为值，上例中，<code>stefno.howOld()</code> 实际上是 <code>(*stefno).howOld()</code></td>
<td>实际上也是“传值”，方法里的操作会影响到调用者，类似于指针传参，拷贝了一份指针</td>
</tr>
</tbody>
</table>
<h2 id="值接收者和指针接收者">值接收者和指针接收者</h2>
<p>前面说过，不管接收者类型是值类型还是指针类型，都可以通过值类型或指针类型调用，这里面实际上通过语法糖起作用的。</p>
<p>先说结论：实现了接收者是值类型的方法，相当于自动实现了接收者是指针类型的方法；而实现了接收者是指针类型的方法，不会自动生成对应接收者是值类型的方法。</p>
<p>来看一个例子，就会完全明白：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-keyword">type</span> coder <span class="hljs-keyword">interface</span> {
    code()
    debug()
}

<span class="hljs-keyword">type</span> Gopher <span class="hljs-keyword">struct</span> {
    language <span class="hljs-keyword">string</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p Gopher)</span> <span class="hljs-title">code</span><span class="hljs-params">()</span></span> {
    fmt.Printf(<span class="hljs-string">"I am coding %s language\n"</span>, p.language)
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p *Gopher)</span> <span class="hljs-title">debug</span><span class="hljs-params">()</span></span> {
    fmt.Printf(<span class="hljs-string">"I am debuging %s language\n"</span>, p.language)
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> c coder = &Gopher{<span class="hljs-string">"Go"</span>}
    c.code()
    c.debug()
}</code></pre>
<p>上述代码里定义了一个接口 <code>coder</code>，接口定义了两个函数：</p>
<pre class="golang"><code class="hljs go">code()
debug()</code></pre>
<p>接着定义了一个结构体 <code>Gopher</code>，它实现了两个方法，一个值接收者，一个指针接收者。</p>
<p>最后，我们在 <code>main</code> 函数里通过接口类型的变量调用了定义的两个函数。</p>
<p>运行一下，结果：</p>
<pre class="shell"><code class="hljs">I am coding Go language
I am debuging Go language</code></pre>
<p>但是如果我们把 <code>main</code> 函数的第一条语句换一下：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> c coder = Gopher{<span class="hljs-string">"Go"</span>}
    c.code()
    c.debug()
}</code></pre>
<p>运行一下，报错：</p>
<pre class="shell"><code class="hljs">./main.go:23:6: cannot use Gopher literal (type Gopher) as type coder in assignment:
    Gopher does not implement coder (debug method has pointer receiver)</code></pre>
<p>看出这两处代码的差别了吗？第一次是将 <code>&Gopher</code> 赋给了 <code>coder</code>；第二次则是将 <code>Gopher</code> 赋给了 <code>coder</code>。</p>
<p>第二次报错是说，<code>Gopher</code> 没有实现 <code>coder</code>。很明显了吧，因为 <code>Gopher</code> 类型并没有实现 <code>debug</code> 方法；表面上看， <code>*Gopher</code> 类型也没有实现 <code>code</code> 方法，但是因为 <code>Gopher</code> 类型实现了 <code>code</code> 方法，所以让 <code>*Gopher</code> 类型自动拥有了 <code>code</code> 方法。</p>
<p>当然，上面的说法有一个简单的解释：接收者是指针类型的方法，很可能在方法中会对接收者的属性进行更改操作，从而影响接收者；而对于接收者是值类型的方法，在方法中不会对接收者本身产生影响。</p>
<p>所以，当实现了一个接收者是值类型的方法，就可以自动生成一个接收者是对应指针类型的方法，因为两者都不会影响接收者。但是，当实现了一个接收者是指针类型的方法，如果此时自动生成一个接收者是值类型的方法，原本期望对接收者的改变（通过指针实现），现在无法实现，因为值类型会产生一个拷贝，不会真正影响调用者。</p>
<p>最后，只要记住下面这点就可以了：</p>
<blockquote>
<p>如果实现了接收者是值类型的方法，会隐含地也实现了接收者是指针类型的方法。</p>
</blockquote>
<h2 id="两者分别在何时使用">两者分别在何时使用</h2>
<p>如果方法的接收者是值类型，无论调用者是对象还是对象指针，修改的都是对象的副本，不影响调用者；如果方法的接收者是指针类型，则调用者修改的是指针指向的对象本身。</p>
<p>使用指针作为方法的接收者的理由：</p>
<ul>
<li>方法能够修改接收者指向的值。</li>
<li>避免在每次调用方法时复制该值，在值的类型为大型结构体时，这样做会更加高效。</li>
</ul>
<p>是使用值接收者还是指针接收者，不是由该方法是否修改了调用者（也就是接收者）来决定，而是应该基于该类型的<code>本质</code>。</p>
<p>如果类型具备“原始的本质”，也就是说它的成员都是由 Go 语言里内置的原始类型，如字符串，整型值等，那就定义值接收者类型的方法。像内置的引用类型，如 slice，map，interface，channel，这些类型比较特殊，声明他们的时候，实际上是创建了一个 <code>header</code>， 对于他们也是直接定义值接收者类型的方法。这样，调用函数时，是直接 copy 了这些类型的 <code>header</code>，而 <code>header</code> 本身就是为复制设计的。</p>
<p>如果类型具备非原始的本质，不能被安全地复制，这种类型总是应该被共享，那就定义指针接收者的方法。比如 go 源码里的文件结构体（struct File）就不应该被复制，应该只有一份<code>实体</code>。</p>
<p>这一段说的比较绕，大家可以去看《Go 语言实战》5.3 那一节。</p>
<h1 id="iface-和-eface-的区别是什么">3. iface 和 eface 的区别是什么</h1>
<p><code>iface</code> 和 <code>eface</code> 都是 Go 中描述接口的底层结构体，区别在于 <code>iface</code> 描述的接口包含方法，而 <code>eface</code> 则是不包含任何方法的空接口：<code>interface{}</code>。</p>
<p>从源码层面看一下：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> iface <span class="hljs-keyword">struct</span> {
    tab  *itab
    data unsafe.Pointer
}

<span class="hljs-keyword">type</span> itab <span class="hljs-keyword">struct</span> {
    inter  *interfacetype
    _type  *_type
    link   *itab
    hash   <span class="hljs-keyword">uint32</span> <span class="hljs-comment">// copy of _type.hash. Used for type switches.</span>
    bad    <span class="hljs-keyword">bool</span>   <span class="hljs-comment">// type does not implement interface</span>
    inhash <span class="hljs-keyword">bool</span>   <span class="hljs-comment">// has this itab been added to hash?</span>
    unused [<span class="hljs-number">2</span>]<span class="hljs-keyword">byte</span>
    fun    [<span class="hljs-number">1</span>]<span class="hljs-keyword">uintptr</span> <span class="hljs-comment">// variable sized</span>
}</code></pre>
<p><code>iface</code> 内部维护两个指针，<code>tab</code> 指向一个 <code>itab</code> 实体， 它表示接口的类型以及赋给这个接口的实体类型。<code>data</code> 则指向接口具体的值，一般而言是一个指向堆内存的指针。</p>
<p>再来仔细看一下 <code>itab</code> 结构体：<code>_type</code> 字段描述了实体的类型，包括内存对齐方式，大小等；<code>inter</code> 字段则描述了接口的类型。<code>fun</code> 字段放置和接口方法对应的具体数据类型的方法地址，实现接口调用方法的动态分派，一般在每次给接口赋值发生转换时会更新此表，或者直接拿缓存的 itab。</p>
<p>这里只会列出实体类型和接口相关的方法，实体类型的其他方法并不会出现在这里。如果你学过 C++ 的话，这里可以类比虚函数的概念。</p>
<p>另外，你可能会觉得奇怪，为什么 <code>fun</code> 数组的大小为 1，要是接口定义了多个方法可怎么办？实际上，这里存储的是第一个方法的函数指针，如果有更多的方法，在它之后的内存空间里继续存储。从汇编角度来看，通过增加地址就能获取到这些函数指针，没什么影响。顺便提一句，这些方法是按照函数名称的字典序进行排列的。</p>
<p>再看一下 <code>interfacetype</code> 类型，它描述的是接口的类型：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> interfacetype <span class="hljs-keyword">struct</span> {
    typ     _type
    pkgpath name
    mhdr    []imethod
}</code></pre>
<p>可以看到，它包装了 <code>_type</code> 类型，<code>_type</code> 实际上是描述 Go 语言中各种数据类型的结构体。我们注意到，这里还包含一个 <code>mhdr</code> 字段，表示接口所定义的函数列表， <code>pkgpath</code> 记录定义了接口的包名。</p>
<p>这里通过���张图来看下 <code>iface</code> 结构体的全貌：</p>
<p><img src="https://user-images.githubusercontent.com/7698088/56564826-82527600-65e1-11e9-956d-d98a212bc863.png" alt="iface 结构体全景"></p>
<p>接着来看一下 <code>eface</code> 的源码：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> eface <span class="hljs-keyword">struct</span> {
    _type *_type
    data  unsafe.Pointer
}</code></pre>
<p>相比 <code>iface</code>，<code>eface</code> 就比较简单了。只维护了一个 <code>_type</code> 字段，表示空接口所承载的具体的实体类型。<code>data</code> 描述了具体的值。</p>
<p><img src="https://user-images.githubusercontent.com/7698088/56565105-318f4d00-65e2-11e9-96bd-4b2e192791dc.png" alt="eface 结构体全景"></p>
<p>我们来看个例子：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    x := <span class="hljs-number">200</span>
    <span class="hljs-keyword">var</span> any <span class="hljs-keyword">interface</span>{} = x
    fmt.Println(any)

    g := Gopher{<span class="hljs-string">"Go"</span>}
    <span class="hljs-keyword">var</span> c coder = g
    fmt.Println(c)
}

<span class="hljs-keyword">type</span> coder <span class="hljs-keyword">interface</span> {
    code()
    debug()
}

<span class="hljs-keyword">type</span> Gopher <span class="hljs-keyword">struct</span> {
    language <span class="hljs-keyword">string</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p Gopher)</span> <span class="hljs-title">code</span><span class="hljs-params">()</span></span> {
    fmt.Printf(<span class="hljs-string">"I am coding %s language\n"</span>, p.language)
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p Gopher)</span> <span class="hljs-title">debug</span><span class="hljs-params">()</span></span> {
    fmt.Printf(<span class="hljs-string">"I am debuging %s language\n"</span>, p.language)
}</code></pre>
<p>执行命令，打印出汇编语言：</p>
<pre class="shell"><code class="hljs">go tool compile -S ./src/main.go</code></pre>
<p>可以看到，main 函数里调用了两个函数：</p>
<pre class="shell"><code class="hljs">func convT2E64(t *_type, elem unsafe.Pointer) (e eface)
func convT2I(tab *itab, elem unsafe.Pointer) (i iface)</code></pre>
<p>上面两个函数的参数和 <code>iface</code> 及 <code>eface</code> 结构体的字段是可以联系起来的：两个函数都是将参数<code>组装</code>一下，形成最终的接口。</p>
<p>作为补充，我们最后再来看下 <code>_type</code> 结构体：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> _type <span class="hljs-keyword">struct</span> {
    <span class="hljs-comment">// 类型大小</span>
    size       <span class="hljs-keyword">uintptr</span>
    ptrdata    <span class="hljs-keyword">uintptr</span>
    <span class="hljs-comment">// 类型的 hash 值</span>
    hash       <span class="hljs-keyword">uint32</span>
    <span class="hljs-comment">// 类型的 flag，和反射相关</span>
    tflag      tflag
    <span class="hljs-comment">// 内存对齐相关</span>
    align      <span class="hljs-keyword">uint8</span>
    fieldalign <span class="hljs-keyword">uint8</span>
    <span class="hljs-comment">// 类型的编号，有bool, slice, struct 等等等等</span>
    kind       <span class="hljs-keyword">uint8</span>
    alg        *typeAlg
    <span class="hljs-comment">// gc 相关</span>
    gcdata    *<span class="hljs-keyword">byte</span>
    str       nameOff
    ptrToThis typeOff
}</code></pre>
<p>Go ��言各种数据类型都是在 <code>_type</code> 字段的基础上，增加一些额外的字段来进行管理的：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> arraytype <span class="hljs-keyword">struct</span> {
    typ   _type
    elem  *_type
    slice *_type
    <span class="hljs-built_in">len</span>   <span class="hljs-keyword">uintptr</span>
}

<span class="hljs-keyword">type</span> chantype <span class="hljs-keyword">struct</span> {
    typ  _type
    elem *_type
    dir  <span class="hljs-keyword">uintptr</span>
}

<span class="hljs-keyword">type</span> slicetype <span class="hljs-keyword">struct</span> {
    typ  _type
    elem *_type
}

<span class="hljs-keyword">type</span> structtype <span class="hljs-keyword">struct</span> {
    typ     _type
    pkgPath name
    fields  []structfield
}</code></pre>
<p>这些数据类型的结构体定义，是反射实现的基础。</p>
<h1 id="接口的动态类型和动态值">4. 接口的动态类型和动态值</h1>
<p>从源码里可以看到：<code>iface</code>包含两个字段：<code>tab</code> 是接口表指针，指向类型信息；<code>data</code> 是数据指针，则指向具体的数据。它们分别被称为<code>动态类型</code>和<code>动态值</code>。而接口值包括<code>动态类型</code>和<code>动态值</code>。</p>
<p>【引申1】接口类型和 <code>nil</code> 作比较</p>
<p>接口值的零值是指<code>动态类型</code>和<code>动态值</code>都为 <code>nil</code>。当仅且当这两部分的值都为 <code>nil</code> 的情况下，这个接口值就才会被认为 <code>接口值 == nil</code>。</p>
<p>来看个例子：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-keyword">type</span> Coder <span class="hljs-keyword">interface</span> {
    code()
}

<span class="hljs-keyword">type</span> Gopher <span class="hljs-keyword">struct</span> {
    name <span class="hljs-keyword">string</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(g Gopher)</span> <span class="hljs-title">code</span><span class="hljs-params">()</span></span> {
    fmt.Printf(<span class="hljs-string">"%s is coding\n"</span>, g.name)
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> c Coder
    fmt.Println(c == <span class="hljs-literal">nil</span>)
    fmt.Printf(<span class="hljs-string">"c: %T, %v\n"</span>, c, c)

    <span class="hljs-keyword">var</span> g *Gopher
    fmt.Println(g == <span class="hljs-literal">nil</span>)

    c = g
    fmt.Println(c == <span class="hljs-literal">nil</span>)
    fmt.Printf(<span class="hljs-string">"c: %T, %v\n"</span>, c, c)
}</code></pre>
<p>输出：</p>
<pre class="shell"><code class="hljs">true
c: <nil>, <nil>
true
false
c: *main.Gopher, <nil></code></pre>
<p>一开始，<code>c</code> 的 动态类型和动态值都为 <code>nil</code>，<code>g</code> 也为 <code>nil</code>，当把 <code>g</code> 赋值给 <code>c</code> 后，<code>c</code> 的动态类型变成了 <code>*main.Gopher</code>，仅管 <code>c</code> 的动态值仍为 <code>nil</code>，但是当 <code>c</code> 和 <code>nil</code> 作比较的时候，结果就是 <code>false</code> 了。</p>
<p>【引申2】<br>
来看一个例子，看一下它的输出：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-keyword">type</span> MyError <span class="hljs-keyword">struct</span> {}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(i MyError)</span> <span class="hljs-title">Error</span><span class="hljs-params">()</span> <span class="hljs-title">string</span></span> {
    <span class="hljs-keyword">return</span> <span class="hljs-string">"MyError"</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    err := Process()
    fmt.Println(err)

    fmt.Println(err == <span class="hljs-literal">nil</span>)
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">Process</span><span class="hljs-params">()</span> <span class="hljs-title">error</span></span> {
    <span class="hljs-keyword">var</span> err *MyError = <span class="hljs-literal">nil</span>
    <span class="hljs-keyword">return</span> err
}</code></pre>
<p>函数运行结果：</p>
<pre class="shell"><code class="hljs"><nil>
false</code></pre>
<p>这里先定义了一个 <code>MyError</code> 结构体，实现了 <code>Error</code> 函数，也就实现了 <code>error</code> 接口。<code>Process</code> 函数返回了一个 <code>error</code> 接口，这块隐含了类型转换。所以，虽然它的值是 <code>nil</code>，其实它的类型是 <code>*MyError</code>，最后和 <code>nil</code> 比较的时候，结果为 <code>false</code>。</p>
<p>【引申3】如何打印出接口的动态类型和值？</p>
<p>直接看代码：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> (
    <span class="hljs-string">"unsafe"</span>
    <span class="hljs-string">"fmt"</span>
)

<span class="hljs-keyword">type</span> iface <span class="hljs-keyword">struct</span> {
    itab, data <span class="hljs-keyword">uintptr</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> a <span class="hljs-keyword">interface</span>{} = <span class="hljs-literal">nil</span>

    <span class="hljs-keyword">var</span> b <span class="hljs-keyword">interface</span>{} = (*<span class="hljs-keyword">int</span>)(<span class="hljs-literal">nil</span>)

    x := <span class="hljs-number">5</span>
    <span class="hljs-keyword">var</span> c <span class="hljs-keyword">interface</span>{} = (*<span class="hljs-keyword">int</span>)(&x)
    
    ia := *(*iface)(unsafe.Pointer(&a))
    ib := *(*iface)(unsafe.Pointer(&b))
    ic := *(*iface)(unsafe.Pointer(&c))

    fmt.Println(ia, ib, ic)

    fmt.Println(*(*<span class="hljs-keyword">int</span>)(unsafe.Pointer(ic.data)))
}</code></pre>
<p>代码里直接定义了一个 <code>iface</code> 结构体，用两个指针来描述 <code>itab</code> 和 <code>data</code>，之后将 a, b, c 在内存中的内容强制解释成我们自定义的 <code>iface</code>。最后就可以打印出动态类型和动态值的地址。</p>
<p>运行结果如下：</p>
<pre class="shell"><code class="hljs">{0 0} {17426912 0} {17426912 842350714568}
5</code></pre>
<p>a 的动态类型和动态值的地址均为 0，也就是 nil；b 的动态类型和 c 的动态类型一致，都是 <code>*int</code>；最后，c 的动态值为 5。</p>
<h1 id="编译器自动检测类型是否实现接口">5. 编译器自动检测类型是否实现接口</h1>
<p>经常看到一些开源库里会有一些类似下面这种奇怪的用法：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">var</span> _ io.Writer = (*myWriter)(<span class="hljs-literal">nil</span>)</code></pre>
<p>这时候会有点懵，不知道作者想要干什么，实际上这就是此问题的答案。编译器会由此检查 <code>*myWriter</code> 类型是否实现了 <code>io.Writer</code> 接口。</p>
<p>来看一个例子：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"io"</span>

<span class="hljs-keyword">type</span> myWriter <span class="hljs-keyword">struct</span> {

}

<span class="hljs-comment">/*func (w myWriter) Write(p []byte) (n int, err error) {
    return
}*/</span>

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-comment">// 检查 *myWriter 类型是否实现了 io.Writer 接口</span>
    <span class="hljs-keyword">var</span> _ io.Writer = (*myWriter)(<span class="hljs-literal">nil</span>)

    <span class="hljs-comment">// 检查 myWriter 类型是否实现了 io.Writer 接口</span>
    <span class="hljs-keyword">var</span> _ io.Writer = myWriter{}
}</code></pre>
<p>注释掉为 myWriter 定义的 Write 函数后，运行程序：</p>
<pre class="golang"><code class="hljs go">src/main.<span class="hljs-keyword">go</span>:<span class="hljs-number">14</span>:<span class="hljs-number">6</span>: cannot use (*myWriter)(<span class="hljs-literal">nil</span>) (<span class="hljs-keyword">type</span> *myWriter) as <span class="hljs-keyword">type</span> io.Writer in assignment:
    *myWriter does not implement io.Writer (missing Write method)
src/main.<span class="hljs-keyword">go</span>:<span class="hljs-number">15</span>:<span class="hljs-number">6</span>: cannot use myWriter literal (<span class="hljs-keyword">type</span> myWriter) as <span class="hljs-keyword">type</span> io.Writer in assignment:
    myWriter does not implement io.Writer (missing Write method)</code></pre>
<p>报错信息：*myWriter/myWriter 未实现 io.Writer 接口，也就是未实现 Write 方法。</p>
<p>解除注释后，运行程序不报错。</p>
<p>实际上，上述赋值语句会发生隐式地类型转换，在转换的过程中，编译器会检测等号右边的类型是否实现了等号左边接口所规定的函数。</p>
<p>总结一下，可通过在代码中添加类似如下的代码，用来检测类型是否实现了接口：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">var</span> _ io.Writer = (*myWriter)(<span class="hljs-literal">nil</span>)
<span class="hljs-keyword">var</span> _ io.Writer = myWriter{}</code></pre>
<h1 id="接口的构造过程是怎样的">6. 接口的构造过程是怎样的</h1>
<p>我们已经看过了 <code>iface</code> 和 <code>eface</code> 的源码，知道 <code>iface</code> 最重要的是 <code>itab</code> 和 <code>_type</code>。</p>
<p>为了研究清楚接口是如何构造的，接下来我会拿起汇编的武器，还原背后的真相。</p>
<p>来看一个示例代码：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-keyword">type</span> Person <span class="hljs-keyword">interface</span> {
    growUp()
}

<span class="hljs-keyword">type</span> Student <span class="hljs-keyword">struct</span> {
    age <span class="hljs-keyword">int</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p Student)</span> <span class="hljs-title">growUp</span><span class="hljs-params">()</span></span> {
    p.age += <span class="hljs-number">1</span>
    <span class="hljs-keyword">return</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> qcrao = Person(Student{age: <span class="hljs-number">18</span>})

    fmt.Println(qcrao)
}
</code></pre>
<p>执行命令：</p>
<pre class="shell"><code class="hljs">go tool compile -S main.go</code></pre>
<p>得到 main 函数的汇编代码如下：</p>
<pre class="asm"><code class="hljs groovy"><span class="hljs-number">0x0000</span> <span class="hljs-number">00000</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) TEXT    <span class="hljs-string">""</span>.main(SB), $<span class="hljs-number">80</span><span class="hljs-number">-0</span>
<span class="hljs-number">0x0000</span> <span class="hljs-number">00000</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) MOVQ    (TLS), CX
<span class="hljs-number">0x0009</span> <span class="hljs-number">00009</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) CMPQ    SP, <span class="hljs-number">16</span>(CX)
<span class="hljs-number">0x000d</span> <span class="hljs-number">00013</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) JLS     <span class="hljs-number">157</span>
<span class="hljs-number">0x0013</span> <span class="hljs-number">00019</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) SUBQ    $<span class="hljs-number">80</span>, SP
<span class="hljs-number">0x0017</span> <span class="hljs-number">00023</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) MOVQ    BP, <span class="hljs-number">72</span>(SP)
<span class="hljs-number">0x001c</span> <span class="hljs-number">00028</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) LEAQ    <span class="hljs-number">72</span>(SP), BP
<span class="hljs-number">0x0021</span> <span class="hljs-number">00033</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) FUNCDATA$<span class="hljs-number">0</span>, gclocals·<span class="hljs-number">69</span>c1753bd5f81501d95132d08af04464(SB)
<span class="hljs-number">0x0021</span> <span class="hljs-number">00033</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) FUNCDATA$<span class="hljs-number">1</span>, gclocals·e226d4ae4a7cad8835311c6a4683c14f(SB)
<span class="hljs-number">0x0021</span> <span class="hljs-number">00033</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) MOVQ    $<span class="hljs-number">18</span>, <span class="hljs-string">""</span>..autotmp_1+<span class="hljs-number">48</span>(SP)
<span class="hljs-number">0x002a</span> <span class="hljs-number">00042</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) LEAQ    go.itab.<span class="hljs-string">""</span>.Student,<span class="hljs-string">""</span>.Person(SB), AX
<span class="hljs-number">0x0031</span> <span class="hljs-number">00049</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) MOVQ    AX, (SP)
<span class="hljs-number">0x0035</span> <span class="hljs-number">00053</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) LEAQ    <span class="hljs-string">""</span>..autotmp_1+<span class="hljs-number">48</span>(SP), AX
<span class="hljs-number">0x003a</span> <span class="hljs-number">00058</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) MOVQ    AX, <span class="hljs-number">8</span>(SP)
<span class="hljs-number">0x003f</span> <span class="hljs-number">00063</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) PCDATA  $<span class="hljs-number">0</span>, $<span class="hljs-number">0</span>
<span class="hljs-number">0x003f</span> <span class="hljs-number">00063</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) CALL    runtime.convT2I64(SB)
<span class="hljs-number">0x0044</span> <span class="hljs-number">00068</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) MOVQ    <span class="hljs-number">24</span>(SP), AX
<span class="hljs-number">0x0049</span> <span class="hljs-number">00073</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">31</span>) MOVQ    <span class="hljs-number">16</span>(SP), CX
<span class="hljs-number">0x004e</span> <span class="hljs-number">00078</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) TESTQ   CX, CX
<span class="hljs-number">0x0051</span> <span class="hljs-number">00081</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) JEQ     <span class="hljs-number">87</span>
<span class="hljs-number">0x0053</span> <span class="hljs-number">00083</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) MOVQ    <span class="hljs-number">8</span>(CX), CX
<span class="hljs-number">0x0057</span> <span class="hljs-number">00087</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) MOVQ    $<span class="hljs-number">0</span>, <span class="hljs-string">""</span>..autotmp_2+<span class="hljs-number">56</span>(SP)
<span class="hljs-number">0x0060</span> <span class="hljs-number">00096</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) MOVQ    $<span class="hljs-number">0</span>, <span class="hljs-string">""</span>..autotmp_2+<span class="hljs-number">64</span>(SP)
<span class="hljs-number">0x0069</span> <span class="hljs-number">00105</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) MOVQ    CX, <span class="hljs-string">""</span>..autotmp_2+<span class="hljs-number">56</span>(SP)
<span class="hljs-number">0x006e</span> <span class="hljs-number">00110</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) MOVQ    AX, <span class="hljs-string">""</span>..autotmp_2+<span class="hljs-number">64</span>(SP)
<span class="hljs-number">0x0073</span> <span class="hljs-number">00115</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) LEAQ    <span class="hljs-string">""</span>..autotmp_2+<span class="hljs-number">56</span>(SP), AX
<span class="hljs-number">0x0078</span> <span class="hljs-number">00120</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) MOVQ    AX, (SP)
<span class="hljs-number">0x007c</span> <span class="hljs-number">00124</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) MOVQ    $<span class="hljs-number">1</span>, <span class="hljs-number">8</span>(SP)
<span class="hljs-number">0x0085</span> <span class="hljs-number">00133</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) MOVQ    $<span class="hljs-number">1</span>, <span class="hljs-number">16</span>(SP)
<span class="hljs-number">0x008e</span> <span class="hljs-number">00142</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) PCDATA  $<span class="hljs-number">0</span>, $<span class="hljs-number">1</span>
<span class="hljs-number">0x008e</span> <span class="hljs-number">00142</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">33</span>) CALL    fmt.Println(SB)
<span class="hljs-number">0x0093</span> <span class="hljs-number">00147</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">34</span>) MOVQ    <span class="hljs-number">72</span>(SP), BP
<span class="hljs-number">0x0098</span> <span class="hljs-number">00152</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">34</span>) ADDQ    $<span class="hljs-number">80</span>, SP
<span class="hljs-number">0x009c</span> <span class="hljs-number">00156</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">34</span>) RET
<span class="hljs-number">0x009d</span> <span class="hljs-number">00157</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">34</span>) NOP
<span class="hljs-number">0x009d</span> <span class="hljs-number">00157</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) PCDATA  $<span class="hljs-number">0</span>, $<span class="hljs-number">-1</span>
<span class="hljs-number">0x009d</span> <span class="hljs-number">00157</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) CALL    runtime.morestack_noctxt(SB)
<span class="hljs-number">0x00a2</span> <span class="hljs-number">00162</span> (.<span class="hljs-regexp">/src/</span>main.<span class="hljs-string">go:</span><span class="hljs-number">30</span>) JMP     <span class="hljs-number">0</span></code></pre>
<p>我们从第 10 行开始看，如果不理解前面几行汇编代码的话，可以回去看看公众号前面两篇文章，这里我就省略了。</p>
<table>
<thead>
<tr class="header">
<th>汇编行数</th>
<th>操作</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>10-14</td>
<td>构造调用 <code>runtime.convT2I64(SB)</code> 的参数</td>
</tr>
</tbody>
</table>
<p>我们来看下这个函数的参数形式：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">convT2I64</span><span class="hljs-params">(tab *itab, elem unsafe.Pointer)</span> <span class="hljs-params">(i iface)</span></span> {
    <span class="hljs-comment">// ……</span>
}</code></pre>
<p><code>convT2I64</code> 会构造出一个 <code>inteface</code>，也就是我们的 <code>Person</code> 接口。</p>
<p>第一个参数的位置是 <code>(SP)</code>，这里被赋上了 <code>go.itab."".Student,"".Person(SB)</code> 的地址。</p>
<p>我们从生成的汇编找到：</p>
<pre class="asm"><code class="hljs go"><span class="hljs-keyword">go</span>.itab.<span class="hljs-string">""</span>.Student,<span class="hljs-string">""</span>.Person SNOPTRDATA dupok size=<span class="hljs-number">40</span>
        <span class="hljs-number">0x0000</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span>  
        <span class="hljs-number">0x0010</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> <span class="hljs-number">00</span> da <span class="hljs-number">9f</span> <span class="hljs-number">20</span> d4              
        rel <span class="hljs-number">0</span>+<span class="hljs-number">8</span> t=<span class="hljs-number">1</span> <span class="hljs-keyword">type</span>.<span class="hljs-string">""</span>.Person+<span class="hljs-number">0</span>
        rel <span class="hljs-number">8</span>+<span class="hljs-number">8</span> t=<span class="hljs-number">1</span> <span class="hljs-keyword">type</span>.<span class="hljs-string">""</span>.Student+<span class="hljs-number">0</span></code></pre>
<p><code>size=40</code> 大��为40字节，回顾一下：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> itab <span class="hljs-keyword">struct</span> {
    inter  *interfacetype <span class="hljs-comment">// 8字节</span>
    _type  *_type <span class="hljs-comment">// 8字节</span>
    link   *itab <span class="hljs-comment">// 8字节</span>
    hash   <span class="hljs-keyword">uint32</span> <span class="hljs-comment">// 4字节</span>
    bad    <span class="hljs-keyword">bool</span>   <span class="hljs-comment">// 1字节</span>
    inhash <span class="hljs-keyword">bool</span>   <span class="hljs-comment">// 1字节</span>
    unused [<span class="hljs-number">2</span>]<span class="hljs-keyword">byte</span> <span class="hljs-comment">// 2字节</span>
    fun    [<span class="hljs-number">1</span>]<span class="hljs-keyword">uintptr</span> <span class="hljs-comment">// variable sized // 8字节</span>
}</code></pre>
<p>把每个字段的大小相加，<code>itab</code> 结构体的大小就是 40 字节。上面那一串数字实际上是 <code>itab</code> 序列化后的内容，注意到大部分数字是 0，从 24 字节开始的 4 个字节 <code>da 9f 20 d4</code> 实际上是 <code>itab</code> 的 <code>hash</code> 值，这在判断两个类型是否相同的时候会用到。</p>
<p>下面两行是链接指令，简单说就是将所有源文件综合起来，给每个符号赋予一个全局的位置值。这里的意思也比较明确：前8个字节最终存储的是 <code>type."".Person</code> 的地址，对应 <code>itab</code> 里的 <code>inter</code> 字段，表示接口类型；8-16 字节最终存储的是 <code>type."".Student</code> 的地址，对应 <code>itab</code> 里 <code>_type</code> 字段，表示具体类型。</p>
<p>第二个参数就比较简单了，它就是数字 <code>18</code> 的地址，这也是初始化 <code>Student</code> 结构体的时候会用到。</p>
<table>
<thead>
<tr class="header">
<th>汇编行数</th>
<th>操作</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>15</td>
<td>调用 <code>runtime.convT2I64(SB)</code></td>
</tr>
</tbody>
</table>
<p>具体看下代码：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">convT2I64</span><span class="hljs-params">(tab *itab, elem unsafe.Pointer)</span> <span class="hljs-params">(i iface)</span></span> {
    t := tab._type
    
    <span class="hljs-comment">//...</span>
    
    <span class="hljs-keyword">var</span> x unsafe.Pointer
    <span class="hljs-keyword">if</span> *(*<span class="hljs-keyword">uint64</span>)(elem) == <span class="hljs-number">0</span> {
        x = unsafe.Pointer(&zeroVal[<span class="hljs-number">0</span>])
    } <span class="hljs-keyword">else</span> {
        x = mallocgc(<span class="hljs-number">8</span>, t, <span class="hljs-literal">false</span>)
        *(*<span class="hljs-keyword">uint64</span>)(x) = *(*<span class="hljs-keyword">uint64</span>)(elem)
    }
    i.tab = tab
    i.data = x
    <span class="hljs-keyword">return</span>
}</code></pre>
<p>这块代码比较简单，把 <code>tab</code> 赋给了 <code>iface</code> 的 <code>tab</code> 字段；<code>data</code> 部分则是在堆上申请了一块内存，然后将 <code>elem</code> 指向的 <code>18</code> 拷贝过去。这样 <code>iface</code> 就组装好了。</p>
<table>
<thead>
<tr class="header">
<th>汇编行数</th>
<th>操作</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>17</td>
<td>把 <code>i.tab</code> 赋给 <code>CX</code></td>
</tr>
<tr class="even">
<td>18</td>
<td>把 <code>i.data</code> 赋给 <code>AX</code></td>
</tr>
<tr class="odd">
<td>19-21</td>
<td>检测 <code>i.tab</code> 是否是 nil，如果不是的话，把 CX 移动 8 个字节，也就是把 <code>itab</code> 的 <code>_type</code> 字段赋给了 CX，这也是接口的实体类型，最终要作为 <code>fmt.Println</code> 函数的参数</td>
</tr>
</tbody>
</table>
<p>后面，就是调用 <code>fmt.Println</code> 函数及之前的参数准备工作了，不再赘述。</p>
<p>这样，我们就把一个 <code>interface</code> 的构造过程说完了。</p>
<p>【引申1】<br>
如何打印出接口类型的 <code>Hash</code> 值？</p>
<p>这里参考曹大神翻译的一篇文章，参考资料里会写上。具体做法如下：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">type</span> iface <span class="hljs-keyword">struct</span> {
    tab  *itab
    data unsafe.Pointer
}
<span class="hljs-keyword">type</span> itab <span class="hljs-keyword">struct</span> {
    inter <span class="hljs-keyword">uintptr</span>
    _type <span class="hljs-keyword">uintptr</span>
    link <span class="hljs-keyword">uintptr</span>
    hash  <span class="hljs-keyword">uint32</span>
    _     [<span class="hljs-number">4</span>]<span class="hljs-keyword">byte</span>
    fun   [<span class="hljs-number">1</span>]<span class="hljs-keyword">uintptr</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> qcrao = Person(Student{age: <span class="hljs-number">18</span>})

    iface := (*iface)(unsafe.Pointer(&qcrao))
    fmt.Printf(<span class="hljs-string">"iface.tab.hash = %#x\n"</span>, iface.tab.hash)
}</code></pre>
<p>定义了一个<code>山寨版</code>的 <code>iface</code> 和 <code>itab</code>，说它<code>山寨</code>是因为 <code>itab</code> 里的一些关键数据结构都不具体展开了，比如 <code>_type</code>，对比一下正宗的定义就可以发现，但是<code>山寨版</code>依然能工作，因为 <code>_type</code> 就是一个指针而已嘛。</p>
<p>在 <code>main</code> 函数里，先构造出一个接口对象 <code>qcrao</code>，然后强制类型转换，最后读取出 <code>hash</code> 值，非常妙！你也可以自己动手试一下。</p>
<p>运行结果：</p>
<pre class="shell"><code class="hljs">iface.tab.hash = 0xd4209fda</code></pre>
<p>值得一提的是，构造接口 <code>qcrao</code> 的时候，即使我把 <code>age</code> 写成其他值，得到的 <code>hash</code> 值依然不变的，这应该是可以预料的，<code>hash</code> 值只和他的字段、方法相关。</p>
<h1 id="类型转换和断言的区别">7. 类型转换和断言的区别</h1>
<p>我们知道，Go 语言中不允许隐式类型转换，也就是说 <code>=</code> 两边，不允许出现类型不相同的变量。</p>
<p><code>类型转换</code>、<code>类型断言</code>本质都是把一个类型转换成另外一个类型。不同之处在于，类型断言是对接口变量进行的操作。</p>
<h2 id="类型转换">类型转换</h2>
<p>对于<code>类型转换</code>而言，转换前后的两个类型要相互兼容才行。类型转换的语法为：</p>
<blockquote>
<p><结果类型> := <目标类型> ( <表达式> )</p>
</blockquote>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> i <span class="hljs-keyword">int</span> = <span class="hljs-number">9</span>

    <span class="hljs-keyword">var</span> f <span class="hljs-keyword">float64</span>
    f = <span class="hljs-keyword">float64</span>(i)
    fmt.Printf(<span class="hljs-string">"%T, %v\n"</span>, f, f)

    f = <span class="hljs-number">10.8</span>
    a := <span class="hljs-keyword">int</span>(f)
    fmt.Printf(<span class="hljs-string">"%T, %v\n"</span>, a, a)

    <span class="hljs-comment">// s := []int(i)</span>
}</code></pre>
<p>上面的代码里，我定义了一个 <code>int</code> 型和 <code>float64</code> 型的变量，尝试在它们之前相互转换，结果是成功的：<code>int</code> 型和 <code>float64</code> 是相互兼容的。</p>
<p>如果我把最后一行代码的注释去掉，编译器会报告类型不兼容的错误：</p>
<pre class="shell"><code class="hljs">cannot convert i (type int) to type []int</code></pre>
<h2 id="断言">断言</h2>
<p>前面说过，因为空接口 <code>interface{}</code> 没有定义任何函数，因此 Go 中所有类型都实现了空接口。当一个函数的形参是 <code>interface{}</code>，那么在函数中，需要对形参进行断言，从而得到它的真实类型。</p>
<p>断言的语法为：</p>
<blockquote>
<p><目标类型的值>，<布尔参数> := <表达式>.( 目标类型 ) // 安全类型断言<br>
<目标类型的值> := <表达式>.( 目标类型 )　　//非安全类型断言</p>
</blockquote>
<p>类型转换和类型断言有些相似，不同之处，在于类型断言是对接口进行的操作。</p>
<p>还是来看一个简短的例子：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-keyword">type</span> Student <span class="hljs-keyword">struct</span> {
    Name <span class="hljs-keyword">string</span>
    Age <span class="hljs-keyword">int</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> i <span class="hljs-keyword">interface</span>{} = <span class="hljs-built_in">new</span>(Student)
    s := i.(Student)
    
    fmt.Println(s)
}</code></pre>
<p>运行一下：</p>
<pre class="shell"><code class="hljs">panic: interface conversion: interface {} is *main.Student, not main.Student</code></pre>
<p>直接 <code>panic</code> 了，这是因为 <code>i</code> 是 <code>*Student</code> 类型，并非 <code>Student</code> 类型，断言失败。这里直接发生了 <code>panic</code>，线上代码可能并不适合这样做，可以采用“安全断言”的语法：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> i <span class="hljs-keyword">interface</span>{} = <span class="hljs-built_in">new</span>(Student)
    s, ok := i.(Student)
    <span class="hljs-keyword">if</span> ok {
        fmt.Println(s)
    }
}</code></pre>
<p>这样，即使断言失败也不会 <code>panic</code>。</p>
<p>断言其实还有另一种形式，就是用在利用 <code>switch</code> 语句判断接口的类型。每一个 <code>case</code> 会被顺序地考虑。当命中一个 <code>case</code> 时，就会执行 <code>case</code> 中的语句，因此 <code>case</code> 语句的顺序是很重要的，因为很有可能会有多个 <code>case</code> 匹配的情况。</p>
<p>代码示例如下：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-comment">//var i interface{} = new(Student)</span>
    <span class="hljs-comment">//var i interface{} = (*Student)(nil)</span>
    <span class="hljs-keyword">var</span> i <span class="hljs-keyword">interface</span>{}

    fmt.Printf(<span class="hljs-string">"%p %v\n"</span>, &i, i)

    judge(i)
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">judge</span><span class="hljs-params">(v <span class="hljs-keyword">interface</span>{})</span></span> {
    fmt.Printf(<span class="hljs-string">"%p %v\n"</span>, &v, v)

    <span class="hljs-keyword">switch</span> v := v.(<span class="hljs-keyword">type</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-literal">nil</span>:
        fmt.Printf(<span class="hljs-string">"%p %v\n"</span>, &v, v)
        fmt.Printf(<span class="hljs-string">"nil type[%T] %v\n"</span>, v, v)

    <span class="hljs-keyword">case</span> Student:
        fmt.Printf(<span class="hljs-string">"%p %v\n"</span>, &v, v)
        fmt.Printf(<span class="hljs-string">"Student type[%T] %v\n"</span>, v, v)

    <span class="hljs-keyword">case</span> *Student:
        fmt.Printf(<span class="hljs-string">"%p %v\n"</span>, &v, v)
        fmt.Printf(<span class="hljs-string">"*Student type[%T] %v\n"</span>, v, v)

    <span class="hljs-keyword">default</span>:
        fmt.Printf(<span class="hljs-string">"%p %v\n"</span>, &v, v)
        fmt.Printf(<span class="hljs-string">"unknow\n"</span>)
    }
}

<span class="hljs-keyword">type</span> Student <span class="hljs-keyword">struct</span> {
    Name <span class="hljs-keyword">string</span>
    Age <span class="hljs-keyword">int</span>
}
</code></pre>
<p><code>main</code> 函数里有三行不同的声明，每次运行一行，注释另外两行，得到三组运行结果：</p>
<pre class="shell"><code class="hljs">// --- var i interface{} = new(Student)
0xc4200701b0 [Name: ], [Age: 0]
0xc4200701d0 [Name: ], [Age: 0]
0xc420080020 [Name: ], [Age: 0]
*Student type[*main.Student] [Name: ], [Age: 0]

// --- var i interface{} = (*Student)(nil)
0xc42000e1d0 <nil>
0xc42000e1f0 <nil>
0xc42000c030 <nil>
*Student type[*main.Student] <nil>

// --- var i interface{}
0xc42000e1d0 <nil>
0xc42000e1e0 <nil>
0xc42000e1f0 <nil>
nil type[<nil>] <nil></code></pre>
<p>对于第一行语句：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">var</span> i <span class="hljs-keyword">interface</span>{} = <span class="hljs-built_in">new</span>(Student)</code></pre>
<p><code>i</code> 是一个 <code>*Student</code> 类型，匹配上第三个 case，从打印的三个地址来看，这三处的变量实际上都是不一样的。在 <code>main</code> 函数里有一个局部变量 <code>i</code>；调用函数时，实际上是复制了一份参数，因此函数里又有一个变量 <code>v</code>，它是 <code>i</code> 的拷贝；断言之后，又生成了一份新的拷贝。所以最终打印的三个变量的地址都不一样。</p>
<p>对于第二行语句：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">var</span> i <span class="hljs-keyword">interface</span>{} = (*Student)(<span class="hljs-literal">nil</span>)</code></pre>
<p>这里想说明的其实是 <code>i</code> 在这里动态类型是 <code>(*Student)</code>, 数据为 <code>nil</code>，它的类型并不是 <code>nil</code>，它与 <code>nil</code> 作比较的时候，得到的结果也是 <code>false</code>。</p>
<p>最后一行语句：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">var</span> i <span class="hljs-keyword">interface</span>{}</code></pre>
<p>这回 <code>i</code> 才是 <code>nil</code> 类型。</p>
<p>【引申1】<br>
<code>fmt.Println</code> 函数的参数是 <code>interface</code>。对于内置类型，函数内部会用穷举法，得出它的真实类型，然后转换为字符串打印。而对于自定义类型，首先确定该类型是否实现了 <code>String()</code> 方法，如果实现了，则直接打印输出 <code>String()</code> 方法的结果；否则，会通过反射来遍历对象的成员进行打印。</p>
<p>再来看一个简短的例子，比较简单，不要紧张：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-keyword">type</span> Student <span class="hljs-keyword">struct</span> {
    Name <span class="hljs-keyword">string</span>
    Age <span class="hljs-keyword">int</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> s = Student{
        Name: <span class="hljs-string">"qcrao"</span>,
        Age: <span class="hljs-number">18</span>,
    }

    fmt.Println(s)
}</code></pre>
<p>因为 <code>Student</code> 结构体没有实现 <code>String()</code> 方法，所以 <code>fmt.Println</code> 会利用反射挨个打印成员变量：</p>
<pre class="shell"><code class="hljs">{qcrao 18}</code></pre>
<p>增加一个 <code>String()</code> 方法的实现：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(s Student)</span> <span class="hljs-title">String</span><span class="hljs-params">()</span> <span class="hljs-title">string</span></span> {
    <span class="hljs-keyword">return</span> fmt.Sprintf(<span class="hljs-string">"[Name: %s], [Age: %d]"</span>, s.Name, s.Age)
}</code></pre>
<p>打印结果：</p>
<pre class="shell"><code class="hljs">[Name: qcrao], [Age: 18]</code></pre>
<p>按照我们自定义的方法来打印了。</p>
<p>【引申2】<br>
针对上面的例子，如果改一下：</p>
<pre class="goalng"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(s *Student)</span> <span class="hljs-title">String</span><span class="hljs-params">()</span> <span class="hljs-title">string</span></span> {
    <span class="hljs-keyword">return</span> fmt.Sprintf(<span class="hljs-string">"[Name: %s], [Age: %d]"</span>, s.Name, s.Age)
}</code></pre>
<p>注意看两个函数的接受者类型不同，现在 <code>Student</code> 结构体只有一个接受者类型为 <code>指针类型</code> 的 <code>String()</code> 函数，打印结果：</p>
<pre class="shell"><code class="hljs">{qcrao 18}</code></pre>
<p>为什么？</p>
<blockquote>
<p>类型 <code>T</code> 只有接受者是 <code>T</code> 的方法；而类型 <code>*T</code> 拥有接受者是 <code>T</code> 和 <code>*T</code> 的方法。语法上 <code>T</code> 能直接调 <code>*T</code> 的方法仅仅是 <code>Go</code> 的语法糖。</p>
</blockquote>
<p>所以， <code>Student</code> 结构体定义了接受者类型是值类型的 <code>String()</code> 方法时，通过</p>
<pre class="golang"><code class="hljs go">fmt.Println(s)
fmt.Println(&s)</code></pre>
<p>均可以按照自定义的格式来打印。</p>
<p>如果 <code>Student</code> 结构体定义了接受者类型是指针类型的 <code>String()</code> 方法时，只有通过</p>
<pre class="golang"><code class="hljs go">fmt.Println(&s)</code></pre>
<p>才能按照自定义的格式打印。</p>
<h1 id="接口转换的原理">8. 接口转换的原理</h1>
<p>通过前面提到的 <code>iface</code> 的源码可以看到，实际上它包含接口的类型 <code>interfacetype</code> 和 实体类型的类型 <code>_type</code>，这两者都是 <code>iface</code> 的字段 <code>itab</code> 的成员。也就是说生成一个 <code>itab</code> 同时需要接口的类型和实体的类型。</p>
<blockquote>
<p><interface 类型， 实体类型> ->itable</p>
</blockquote>
<p>当判定一种类型是否满足某个接口时，Go 使用类型的方法集和接口所需要的方法集进行匹配，如果类型的方法集完全包含接口的方法集，则可认为该类型实现了该接口。</p>
<p>例如某类型有 <code>m</code> 个方法，某接口有 <code>n</code> 个方法，则很容易知道这种判定的时间复杂度为 <code>O(mn)</code>，Go 会对方法集的函数按照函数名的字典序进行排序，所以实际的时间复杂度为 <code>O(m+n)</code>。</p>
<p>这里我们来探索将一个接口转换给另外一个接口背后的原理，当然，能转换的原因必然是类型兼容。</p>
<p>直接来看一个例子：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-keyword">type</span> coder <span class="hljs-keyword">interface</span> {
    code()
    run()
}

<span class="hljs-keyword">type</span> runner <span class="hljs-keyword">interface</span> {
    run()
}

<span class="hljs-keyword">type</span> Gopher <span class="hljs-keyword">struct</span> {
    language <span class="hljs-keyword">string</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(g Gopher)</span> <span class="hljs-title">code</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">return</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(g Gopher)</span> <span class="hljs-title">run</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">return</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    <span class="hljs-keyword">var</span> c coder = Gopher{}

    <span class="hljs-keyword">var</span> r runner
    r = c
    fmt.Println(c, r)
}</code></pre>
<p>简单解释下上述代码：定义了两个 <code>interface</code>: <code>coder</code> 和 <code>runner</code>。定义了一个实体类型 <code>Gopher</code>，类型 <code>Gopher</code> 实现了两个方法，分别是 <code>run()</code> 和 <code>code()</code>。main 函数里定义了一个接口变量 <code>c</code>，绑定了一个 <code>Gopher</code> 对象，之后将 <code>c</code> 赋值给另外一个接口变量 <code>r</code> 。赋值成功的原因是 <code>c</code> 中包含 <code>run()</code> 方法。这样，两个接口变量完成了转换。</p>
<p>执行命令：</p>
<pre class="shell"><code class="hljs">go tool compile -S ./src/main.go</code></pre>
<p>得到 main 函数的汇编命令，可以看到： <code>r = c</code> 这一行语句实际上是调用了 <code>runtime.convI2I(SB)</code>，也就是 <code>convI2I</code> 函数，从函数名来看，就是将一个 <code>interface</code> 转换成另外一个 <code>interface</code>，看下它的源代码：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">convI2I</span><span class="hljs-params">(inter *interfacetype, i iface)</span> <span class="hljs-params">(r iface)</span></span> {
    tab := i.tab
    <span class="hljs-keyword">if</span> tab == <span class="hljs-literal">nil</span> {
        <span class="hljs-keyword">return</span>
    }
    <span class="hljs-keyword">if</span> tab.inter == inter {
        r.tab = tab
        r.data = i.data
        <span class="hljs-keyword">return</span>
    }
    r.tab = getitab(inter, tab._type, <span class="hljs-literal">false</span>)
    r.data = i.data
    <span class="hljs-keyword">return</span>
}</code></pre>
<p>代码比较简单，函数参数 <code>inter</code> 表示接口类型，<code>i</code> 表示绑定了实体类型的接口，<code>r</code> 则表示接口转换了之后的新的 <code>iface</code>。通过前面的分析，我们又知道， <code>iface</code> 是由 <code>tab</code> 和 <code>data</code> 两个字段组成。所以，实际上 <code>convI2I</code> 函数真正要做的事，找到新 <code>interface</code> 的 <code>tab</code> 和 <code>data</code>，就大功告成了。</p>
<p>我们还知道，<code>tab</code> 是由接口类型 <code>interfacetype</code> 和 实体类型 <code>_type</code>。所以最关键的语句是 <code>r.tab = getitab(inter, tab._type, false)</code>。</p>
<p>因此，重点来看下 <code>getitab</code> 函数的源码，只看关键的地方：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">getitab</span><span class="hljs-params">(inter *interfacetype, typ *_type, canfail <span class="hljs-keyword">bool</span>)</span> *<span class="hljs-title">itab</span></span> {
    <span class="hljs-comment">// ……</span>

    <span class="hljs-comment">// 根据 inter, typ 计算出 hash 值</span>
    h := itabhash(inter, typ)

    <span class="hljs-comment">// look twice - once without lock, once with.</span>
    <span class="hljs-comment">// common case will be no lock contention.</span>
    <span class="hljs-keyword">var</span> m *itab
    <span class="hljs-keyword">var</span> locked <span class="hljs-keyword">int</span>
    <span class="hljs-keyword">for</span> locked = <span class="hljs-number">0</span>; locked < <span class="hljs-number">2</span>; locked++ {
        <span class="hljs-keyword">if</span> locked != <span class="hljs-number">0</span> {
            lock(&ifaceLock)
        }
        
        <span class="hljs-comment">// 遍历哈希表的一个 slot</span>
        <span class="hljs-keyword">for</span> m = (*itab)(atomic.Loadp(unsafe.Pointer(&hash[h]))); m != <span class="hljs-literal">nil</span>; m = m.link {

            <span class="hljs-comment">// 如果在 hash 表中已经找到了 itab（inter 和 typ 指针都相同）</span>
            <span class="hljs-keyword">if</span> m.inter == inter && m._type == typ {
                <span class="hljs-comment">// ……</span>
                
                <span class="hljs-keyword">if</span> locked != <span class="hljs-number">0</span> {
                    unlock(&ifaceLock)
                }
                <span class="hljs-keyword">return</span> m
            }
        }
    }

    <span class="hljs-comment">// 在 hash 表中没有找到 itab，那么新生成一个 itab</span>
    m = (*itab)(persistentalloc(unsafe.Sizeof(itab{})+<span class="hljs-keyword">uintptr</span>(<span class="hljs-built_in">len</span>(inter.mhdr)<span class="hljs-number">-1</span>)*sys.PtrSize, <span class="hljs-number">0</span>, &memstats.other_sys))
    m.inter = inter
    m._type = typ
    
    <span class="hljs-comment">// 添加到全局的 hash 表中</span>
    additab(m, <span class="hljs-literal">true</span>, canfail)
    unlock(&ifaceLock)
    <span class="hljs-keyword">if</span> m.bad {
        <span class="hljs-keyword">return</span> <span class="hljs-literal">nil</span>
    }
    <span class="hljs-keyword">return</span> m
}</code></pre>
<p>简单总结一下：getitab 函数会根据 <code>interfacetype</code> 和 <code>_type</code> 去全局的 itab 哈希表中查找，如果能找到，则直接返回；否则，会根据给定的 <code>interfacetype</code> 和 <code>_type</code> 新生成一个 <code>itab</code>，并插入到 itab 哈希表，这样下一次就可以直接拿到 <code>itab</code>。</p>
<p>这里查找了两次，并且第二次上锁了，这是因为如果第一次没找到，在第二次仍然没有找到相应的 <code>itab</code> 的情况下，需要新生成一个，并且写入哈希表，因此需要加锁。这样，其他协程在查找相同的 <code>itab</code> 并且也没有找到时，第二次查找时，会被挂住，之后，就会查到第一个协程写入哈希表的 <code>itab</code>。</p>
<p>再来看一下 <code>additab</code> 函数的代码：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-comment">// 检查 _type 是否符合 interface_type 并且创建对应的 itab 结构体 将其放到 hash 表中</span>
<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">additab</span><span class="hljs-params">(m *itab, locked, canfail <span class="hljs-keyword">bool</span>)</span></span> {
    inter := m.inter
    typ := m._type
    x := typ.uncommon()

    <span class="hljs-comment">// both inter and typ have method sorted by name,</span>
    <span class="hljs-comment">// and interface names are unique,</span>
    <span class="hljs-comment">// so can iterate over both in lock step;</span>
    <span class="hljs-comment">// the loop is O(ni+nt) not O(ni*nt).</span>
    <span class="hljs-comment">// </span>
    <span class="hljs-comment">// inter 和 typ 的方法都按方法名称进行了排序</span>
    <span class="hljs-comment">// 并且方法名都是唯一的。所以循环的次数是固定的</span>
    <span class="hljs-comment">// 只用循环 O(ni+nt)，而非 O(ni*nt)</span>
    ni := <span class="hljs-built_in">len</span>(inter.mhdr)
    nt := <span class="hljs-keyword">int</span>(x.mcount)
    xmhdr := (*[<span class="hljs-number">1</span> << <span class="hljs-number">16</span>]method)(add(unsafe.Pointer(x), <span class="hljs-keyword">uintptr</span>(x.moff)))[:nt:nt]
    j := <span class="hljs-number">0</span>
    <span class="hljs-keyword">for</span> k := <span class="hljs-number">0</span>; k < ni; k++ {
        i := &inter.mhdr[k]
        itype := inter.typ.typeOff(i.ityp)
        name := inter.typ.nameOff(i.name)
        iname := name.name()
        ipkg := name.pkgPath()
        <span class="hljs-keyword">if</span> ipkg == <span class="hljs-string">""</span> {
            ipkg = inter.pkgpath.name()
        }
        <span class="hljs-keyword">for</span> ; j < nt; j++ {
            t := &xmhdr[j]
            tname := typ.nameOff(t.name)
            <span class="hljs-comment">// 检查方法名字是否一致</span>
            <span class="hljs-keyword">if</span> typ.typeOff(t.mtyp) == itype && tname.name() == iname {
                pkgPath := tname.pkgPath()
                <span class="hljs-keyword">if</span> pkgPath == <span class="hljs-string">""</span> {
                    pkgPath = typ.nameOff(x.pkgpath).name()
                }
                <span class="hljs-keyword">if</span> tname.isExported() || pkgPath == ipkg {
                    <span class="hljs-keyword">if</span> m != <span class="hljs-literal">nil</span> {
                        <span class="hljs-comment">// 获取函数地址，并加入到itab.fun数组中</span>
                        ifn := typ.textOff(t.ifn)
                        *(*unsafe.Pointer)(add(unsafe.Pointer(&m.fun[<span class="hljs-number">0</span>]), <span class="hljs-keyword">uintptr</span>(k)*sys.PtrSize)) = ifn
                    }
                    <span class="hljs-keyword">goto</span> nextimethod
                }
            }
        }
        <span class="hljs-comment">// ……</span>
        
        m.bad = <span class="hljs-literal">true</span>
        <span class="hljs-keyword">break</span>
    nextimethod:
    }
    <span class="hljs-keyword">if</span> !locked {
        throw(<span class="hljs-string">"invalid itab locking"</span>)
    }

    <span class="hljs-comment">// 计算 hash 值</span>
    h := itabhash(inter, typ)
    <span class="hljs-comment">// 加到Hash Slot链表中</span>
    m.link = hash[h]
    m.inhash = <span class="hljs-literal">true</span>
    atomicstorep(unsafe.Pointer(&hash[h]), unsafe.Pointer(m))
}</code></pre>
<p><code>additab</code> 会检查 <code>itab</code> 持有的 <code>interfacetype</code> 和 <code>_type</code> 是否符合，就是看 <code>_type</code> 是否完全实现了 <code>interfacetype</code> 的方法，也就是看两者的方法列表重叠的部分就是 <code>interfacetype</code> 所持有的方法列表。注意到其中有一个双层循环，乍一看，循环次数是 <code>ni * nt</code>，但由于两者的函数列表都按照函数名称进行了排序，因此最终只执行了 <code>ni + nt</code> 次，代码里通过一个小技巧来实现：第二层循环并没有从 0 开始计数，而是从上一次遍历到的位置开始。</p>
<p>求 hash 值的函数比较简单：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">itabhash</span><span class="hljs-params">(inter *interfacetype, typ *_type)</span> <span class="hljs-title">uint32</span></span> {
    h := inter.typ.hash
    h += <span class="hljs-number">17</span> * typ.hash
    <span class="hljs-keyword">return</span> h % hashSize
}</code></pre>
<p><code>hashSize</code> 的值是 1009。</p>
<p>更一般的，当把实体类型赋值给接口的时候，会调用 <code>conv</code> 系列函数，例如空接口调用 <code>convT2E</code> 系列、非空接口调用 <code>convT2I</code> 系列。这些函数比较相似：</p>
<blockquote>
<ol>
<li>具体类型转空接口时，_type 字段直接复制源类型的 _type；调用 mallocgc 获得一块新内存，把值复制进去，data 再指向这块新内存。</li>
<li>具体类型转非空接口时，入参 tab 是编译器在编译阶段预先生成好的，新接口 tab 字段直接指向入参 tab 指向的 itab；调用 mallocgc 获得一块新内存，把值复制进去，data 再指向这块新内存。</li>
<li>而对于接口转接口，itab 调用 getitab 函数获取。只用生成一次，之后直接从 hash 表中获取。</li>
</ol>
</blockquote>
<h1 id="如何用-interface-实现多态">9. 如何用 interface 实现多态</h1>
<p><code>Go</code> 语言并没有设计诸如虚函数、纯虚函数、继承、多重继承等概念，但它通过接口却非常优雅地支持了面向对象的特性。</p>
<p>多态是一种运行期的行为，它有以下几个特点：</p>
<blockquote>
<ol>
<li>一种类型具有多种类型的能力</li>
<li>允许不同的对象对同一消息做出灵活的反应</li>
<li>以一种通用的方式对待个使用的对象</li>
<li>非动态语言必须通过继承和接口的方式来实现</li>
</ol>
</blockquote>
<p>看一个实现了多态的代码例子：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-keyword">package</span> main

<span class="hljs-keyword">import</span> <span class="hljs-string">"fmt"</span>

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">main</span><span class="hljs-params">()</span></span> {
    qcrao := Student{age: <span class="hljs-number">18</span>}
    whatJob(&qcrao)

    growUp(&qcrao)
    fmt.Println(qcrao)

    stefno := Programmer{age: <span class="hljs-number">100</span>}
    whatJob(stefno)

    growUp(stefno)
    fmt.Println(stefno)
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">whatJob</span><span class="hljs-params">(p Person)</span></span> {
    p.job()
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">growUp</span><span class="hljs-params">(p Person)</span></span> {
    p.growUp()
}

<span class="hljs-keyword">type</span> Person <span class="hljs-keyword">interface</span> {
    job()
    growUp()
}

<span class="hljs-keyword">type</span> Student <span class="hljs-keyword">struct</span> {
    age <span class="hljs-keyword">int</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p Student)</span> <span class="hljs-title">job</span><span class="hljs-params">()</span></span> {
    fmt.Println(<span class="hljs-string">"I am a student."</span>)
    <span class="hljs-keyword">return</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p *Student)</span> <span class="hljs-title">growUp</span><span class="hljs-params">()</span></span> {
    p.age += <span class="hljs-number">1</span>
    <span class="hljs-keyword">return</span>
}

<span class="hljs-keyword">type</span> Programmer <span class="hljs-keyword">struct</span> {
    age <span class="hljs-keyword">int</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p Programmer)</span> <span class="hljs-title">job</span><span class="hljs-params">()</span></span> {
    fmt.Println(<span class="hljs-string">"I am a programmer."</span>)
    <span class="hljs-keyword">return</span>
}

<span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-params">(p Programmer)</span> <span class="hljs-title">growUp</span><span class="hljs-params">()</span></span> {
    <span class="hljs-comment">// 程序员老得太快 ^_^</span>
    p.age += <span class="hljs-number">10</span>
    <span class="hljs-keyword">return</span>
}</code></pre>
<p>代码里先定义了 1 个 <code>Person</code> 接口，包含两个函数：</p>
<pre class="golang"><code class="hljs go">job()
growUp()</code></pre>
<p>然后，又定义了 2 个结构体，<code>Student</code> 和 <code>Programmer</code>，同时，类型 <code>*Student</code>、<code>Programmer</code> 实现了 <code>Person</code> 接口定义的两个函数。注意，<code>*Student</code> 类型实现了接口， <code>Student</code> 类型却没有。</p>
<p>之后，我又定义了函数参数是 <code>Person</code> 接口的两个函数：</p>
<pre class="golang"><code class="hljs go"><span class="hljs-function"><span class="hljs-keyword">func</span> <span class="hljs-title">whatJob</span><span class="hljs-params">(p Person)</span>
<span class="hljs-title">func</span> <span class="hljs-title">growUp</span><span class="hljs-params">(p Person)</span></span></code></pre>
<p><code>main</code> 函数里先生成 <code>Student</code> 和 <code>Programmer</code> 的对象，再将它们分别传入到函数 <code>whatJob</code> 和 <code>growUp</code>。函数中，直接调用接口函数，实际执行的时候是看最终传入的实体类型是什么，调用的是实体类型实现的函数。于是，不同对象针对同一消息就有多种表现，<code>多态</code>就实现了。</p>
<p>更深入一点来说的话，在函数 <code>whatJob()</code> 或者 <code>growUp()</code> 内部，接口 <code>person</code> 绑定了实体类型 <code>*Student</code> 或者 <code>Programmer</code>。根据前面分析的 <code>iface</code> 源码，这里会直接调用 <code>fun</code> 里保存的函数，类似于： <code>s.tab->fun[0]</code>，而因为 <code>fun</code> 数组里保存的是实体类型实现的函数，所以当函数传入不同的实体类型时，调用的实际上是不同的函数实现，从而实现多态。</p>
<p>运行一下代码：</p>
<pre class="shell"><code class="hljs">I am a student.
{19}
I am a programmer.
{100}</code></pre>
<h1 id="go-接口与-c-接口有何异同">10. Go 接口与 C++ 接口有何异同</h1>
<p>接口定义了一种规范，描述了类的行为和功能，而不做具体实现。</p>
<p>C++ 的接口是使用抽象类来实现的，如果类中至少有一个函数被声明为纯虚函数，则这个类就是抽象类。纯虚函数是通过在声明中使用 "= 0" 来指定的。例如：</p>
<pre class="c++"><code class="hljs cpp"><span class="hljs-class"><span class="hljs-keyword">class</span> <span class="hljs-title">Shape</span>
{</span>
   <span class="hljs-keyword">public</span>:
      <span class="hljs-comment">// 纯虚函数</span>
      <span class="hljs-function"><span class="hljs-keyword">virtual</span> <span class="hljs-keyword">double</span> <span class="hljs-title">getArea</span><span class="hljs-params">()</span> </span>= <span class="hljs-number">0</span>;
   <span class="hljs-keyword">private</span>:
      <span class="hljs-built_in">string</span> name;      <span class="hljs-comment">// 名称</span>
};</code></pre>
<p>设计抽象类的目的，是为了给其他类提供一个可以继承的适当的基类。抽象类不能被用于实例化对象，它只能作为接口使用。</p>
<p>派生类需要明确地声明它继承自基类，并且需要实现基类中所有的纯虚函数。</p>
<p>C++ 定义接口的方式称为“侵入式”，而 Go 采用的是 “非侵入式”，不需要显式声明，只需要实现接口定义的函数，编译器自动会识别。</p>
<p>C++ 和 Go 在定义接口方式上的不同，也导致了底层实现上的不同。C++ 通过虚函数表来实现基类调用派生类的函数；而 Go 通过 <code>itab</code> 中的 <code>fun</code> 字段来实现接口变量调用实体类型的函数。C++ 中的虚函数表是在编译期生成的；而 Go 的 <code>itab</code> 中的 <code>fun</code> 字段是在运行期间动态生成的。原因在于，Go 中实体类型可能会无意中实现 N 多接口，很多接口并不是本来需要的，所以不能为类型实现的所有接口都生成一个 <code>itab</code>， 这也是“非侵入式”带来的影响；这在 C++ 中是不存在的，因为派生需要显示声明它继承自哪个基类。</p>
<p><img src="https://user-images.githubusercontent.com/7698088/51420568-305b1800-1bce-11e9-962a-52b12be7eb2e.png" alt="QR"></p>
<h1 id="参考资料">参考资料</h1>
<p>【包含反射、接口等源码分析】<a href="https://zhuanlan.zhihu.com/p/27055513" class="uri">https://zhuanlan.zhihu.com/p/27055513</a></p>
<p>【虚函数表和C++的区别】<a href="https://mp.weixin.qq.com/s/jU9HeR1tOyh-ME5iEYM5-Q" class="uri">https://mp.weixin.qq.com/s/jU9HeR1tOyh-ME5iEYM5-Q</a></p>
<p>【具体类型向接口赋值】<a href="https://tiancaiamao.gitbooks.io/go-internals/content/zh/07.2.html" class="uri">https://tiancaiamao.gitbooks.io/go-internals/content/zh/07.2.html</a></p>
<p>【Go夜读群的讨论】<a href="https://github.com/developer-learning/reading-go/blob/master/content/discuss/2018-08-30-understanding-go-interfaces.md" class="uri">https://github.com/developer-learning/reading-go/blob/master/content/discuss/2018-08-30-understanding-go-interfaces.md</a></p>
<p>【廖雪峰 鸭子类型】<a href="https://www.liaoxuefeng.com/wiki/0014316089557264a6b348958f449949df42a6d3a2e542c000/001431865288798deef438d865e4c2985acff7e9fad15e3000" class="uri">https://www.liaoxuefeng.com/wiki/0014316089557264a6b348958f449949df42a6d3a2e542c000/001431865288798deef438d865e4c2985acff7e9fad15e3000</a></p>
<p>【值类型和指针类型，iface源码】<a href="https://www.jianshu.com/p/5f8ecbe4f6af" class="uri">https://www.jianshu.com/p/5f8ecbe4f6af</a></p>
<p>【总体说明itab的生成方式、作用】<a href="http://www.codeceo.com/article/go-interface.html" class="uri">http://www.codeceo.com/article/go-interface.html</a></p>
<p>【conv系列函数的作用】<a href="https://blog.csdn.net/zhonglinzhang/article/details/85772336" class="uri">https://blog.csdn.net/zhonglinzhang/article/details/85772336</a></p>
<p>【convI2I itab作用】<a href="https://www.jianshu.com/p/a5e99b1d50b1" class="uri">https://www.jianshu.com/p/a5e99b1d50b1</a></p>
<p>【interface 源码解读 很不错 包含反射】<a href="http://wudaijun.com/2018/01/go-interface-implement/" class="uri">http://wudaijun.com/2018/01/go-interface-implement/</a></p>
<p>【what why how思路来写interface】<a href="http://legendtkl.com/2017/06/12/understanding-golang-interface/" class="uri">http://legendtkl.com/2017/06/12/understanding-golang-interface/</a></p>
<p>【有汇编分析，不错】<a href="http://legendtkl.com/2017/07/01/golang-interface-implement/" class="uri">http://legendtkl.com/2017/07/01/golang-interface-implement/</a></p>
<p>【第一幅图可以参考 gdb调试】<a href="https://www.do1618.com/archives/797/golang-interface%E5%88%86%E6%9E%90/">https://www.do1618.com/archives/797/golang-interface%E5%88%86%E6%9E%90/</a></p>
<p>【类型转换和断言】<a href="https://my.oschina.net/goal/blog/194308" class="uri">https://my.oschina.net/goal/blog/194308</a></p>
<p>【interface 和 nil】<a href="https://my.oschina.net/goal/blog/194233" class="uri">https://my.oschina.net/goal/blog/194233</a></p>
<p>【函数和方法】<a href="https://www.jianshu.com/p/5376e15966b3" class="uri">https://www.jianshu.com/p/5376e15966b3</a></p>
<p>【反射】<a href="https://flycode.co/archives/267357" class="uri">https://flycode.co/archives/267357</a></p>
<p>【接口特点列表】<a href="https://segmentfault.com/a/1190000011451232" class="uri">https://segmentfault.com/a/1190000011451232</a></p>
<p>【interface 全面介绍，包含C++对比】<a href="https://www.jianshu.com/p/b38b1719636e" class="uri">https://www.jianshu.com/p/b38b1719636e</a></p>
<p>【Go四十二章经 interface】<a href="https://github.com/ffhelicopter/Go42/blob/master/content/42_19_interface.md" class="uri">https://github.com/ffhelicopter/Go42/blob/master/content/42_19_interface.md</a></p>
<p>【对Go接口的反驳，有说到接口的定义】<a href="http://blog.zhaojie.me/2013/04/why-i-dont-like-go-style-interface-or-structural-typing.html" class="uri">http://blog.zhaojie.me/2013/04/why-i-dont-like-go-style-interface-or-structural-typing.html</a></p>
<p>【gopher 接口】<a href="http://fuxiaohei.me/2017/4/22/gopherchina-2017.html" class="uri">http://fuxiaohei.me/2017/4/22/gopherchina-2017.html</a></p>
<p>【译文 还不错】<a href="https://mp.weixin.qq.com/s/tBg8D1qXHqBr3r7oRt6iGA" class="uri">https://mp.weixin.qq.com/s/tBg8D1qXHqBr3r7oRt6iGA</a></p>
<p>【infoQ 文章】<a href="https://www.infoq.cn/article/go-interface-talk" class="uri">https://www.infoq.cn/article/go-interface-talk</a></p>
<p>【Go接口详解】<a href="https://zhuanlan.zhihu.com/p/27055513" class="uri">https://zhuanlan.zhihu.com/p/27055513</a></p>
<p>【Go interface】<a href="https://sanyuesha.com/2017/07/22/how-to-understand-go-interface/" class="uri">https://sanyuesha.com/2017/07/22/how-to-understand-go-interface/</a></p>
<p>【getitab源码说明】<a href="https://www.twblogs.net/a/5c245d59bd9eee16b3db561d" class="uri">https://www.twblogs.net/a/5c245d59bd9eee16b3db561d</a></p>
<p>【浅显易懂】<a href="https://yami.io/golang-interface/" class="uri">https://yami.io/golang-interface/</a></p>
<p>【golang io包的妙用】<a href="https://www.jianshu.com/p/8c33f7c84509" class="uri">https://www.jianshu.com/p/8c33f7c84509</a></p>
<p>【探索C++与Go的接口底层实现】<a href="https://www.jianshu.com/p/073c09a05da7" class="uri">https://www.jianshu.com/p/073c09a05da7</a><br>
<a href="https://github.com/teh-cmc/go-internals/blob/master/chapter2_interfaces/README.md" class="uri">https://github.com/teh-cmc/go-internals/blob/master/chapter2_interfaces/README.md</a></p>
<p>【汇编层面】<a href="http://xargin.com/go-and-interface/" class="uri">http://xargin.com/go-and-interface/</a></p>
<p>【有图】<a href="https://i6448038.github.io/2018/10/01/Golang-interface/" class="uri">https://i6448038.github.io/2018/10/01/Golang-interface/</a></p>
<p>【图】<a href="https://mp.weixin.qq.com/s/px9BRQrTCLX6BbvXJbysCA" class="uri">https://mp.weixin.qq.com/s/px9BRQrTCLX6BbvXJbysCA</a></p>
<p>【英文开源书】<a href="https://github.com/cch123/go-internals/blob/master/chapter2_interfaces/README.md" class="uri">https://github.com/cch123/go-internals/blob/master/chapter2_interfaces/README.md</a></p>
<p>【曹大的翻译】<a href="http://xargin.com/go-and-interface/" class="uri">http://xargin.com/go-and-interface/</a></p>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						