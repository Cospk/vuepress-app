import{_ as s}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,a as e,o as i}from"./app-DIJDtupu.js";const l={};function p(d,n){return i(),a("div",null,n[0]||(n[0]=[e(`<p>这次文章依然很长，基本上涵盖了 <code>interface</code> 的方方面面，有例子，有源码分析，有汇编分析，前前后后写了 20 多天。洋洋洒洒，长篇大论，依然有些东西没有涉及到，比如文章里没有写到<code>反射</code>，当然，后面会单独写一篇关于<code>反射</code>的文章，这是后话。</p><p>还是希望看你在看完文章后能有所收获，有任何问题或意见建议，欢迎在文章后面留言。</p><p>这篇文章的架构比较简单，直接抛出 10 个问题，一一解答。</p><h1 id="_1-go-语言与鸭子类型的关系" tabindex="-1"><a class="header-anchor" href="#_1-go-语言与鸭子类型的关系"><span>1. Go 语言与鸭子类型的关系</span></a></h1><p>先直接来看维基百科里的定义：</p><blockquote><p>If it looks like a duck, swims like a duck, and quacks like a duck, then it probably is a duck.</p></blockquote><p>翻译过来就是：如果某个东西长得像鸭子，像鸭子一样游泳，像鸭子一样嘎嘎叫，那它就可以被看成是一只鸭子。</p><p><code>Duck Typing</code>，鸭子类型，是动态编程语言的一种对象推断策略，它更关注对象能如何被使用，而不是对象的类型本身。Go 语言作为一门静态语言，它通过通过接口的方式完美支持鸭子类型。</p><p>例如，在动态语言 python 中，定义一个这样的函数：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>def hello_world(coder):</span></span>
<span class="line"><span>    coder.say_hello()</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>当调用此函数的时候，可以传入任意类型，只要它实现了 <code>say_hello()</code> 函数就可以。如果没有实现，运行过程中会出现错误。</p><p>而在静态语言如 Java, C++ 中，必须要显示地声明实现了某个接口，之后，才能用在任何需要这个接口的地方。如果你在程序中调用 <code>hello_world</code> 函数，却传入了一个根本就没有实现 <code>say_hello()</code> 的类型，那在编译阶段就不会通过。这也是静态语言比动态语言更安全的原因。</p><p>动态语言和静态语言的差别在此就有所体现。静态语言在编译期间就能发现类型不匹配的错误，不像动态语言，必须要运行到那一行代码才会报错。插一句，这也是我不喜欢用 <code>python</code> 的一个原因。当然，静态语言要求程序员在编码阶段就要按照规定来编写程序，为每个变量规定数据类型，这在某种程度上，加大了工作量，也加长了代码量。动态语言则没有这些要求，可以让人更专注在业务上，代码也更短，写起来更快，这一点，写 python ��同学比较清楚。</p><p>Go 语言作为一门现代静态语言，是有后发优势的。它引入了动态语言的便利，同时又会进行静态语言的类型检查，写起来是非常 Happy 的。Go 采用了折中的做法：不要求类型显示地声明实现了某个接口，只要实现了相关的方法即可，编译器就能检测到。</p><p>来看个例子：</p><p>先定义一个接口，和使用此接口作为参数的函数：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type IGreeting interface {</span></span>
<span class="line"><span>    sayHello()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func sayHello(i IGreeting) {</span></span>
<span class="line"><span>    i.sayHello()</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>再来定义两个结构体：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type Go struct {}</span></span>
<span class="line"><span>func (g Go) sayHello() {</span></span>
<span class="line"><span>    fmt.Println(&quot;Hi, I am GO!&quot;)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type PHP struct {}</span></span>
<span class="line"><span>func (p PHP) sayHello() {</span></span>
<span class="line"><span>    fmt.Println(&quot;Hi, I am PHP!&quot;)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>最后，在 main 函数里调用 sayHello() 函数：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func main() {</span></span>
<span class="line"><span>    golang := Go{}</span></span>
<span class="line"><span>    php := PHP{}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    sayHello(golang)</span></span>
<span class="line"><span>    sayHello(php)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>程序输出：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>Hi, I am GO!</span></span>
<span class="line"><span>Hi, I am PHP!</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>在 main 函数中，调用调用 sayHello() 函数时，传入了 <code>golang, php</code> 对象，它们并没有显式地声明实现了 IGreeting 类型，只是实现了接口所规定的 sayHello() 函数。实际上，编译器在调用 sayHello() 函数时，会隐式地将 <code>golang, php</code> 对象转换成 IGreeting 类型，这也是静态语言的类型检查功能。</p><p>顺带再提一下动态语言的特点：</p><blockquote><p>变量绑定的类型是不确定的，在运行期间才能确定<br> 函数和方法可以接收任何类型的参数，且调用时不检查参数类型<br> 不需要实现接口</p></blockquote><p>总结一下，鸭子类型是一种动态语言的风格，在这种风格中，一个对象有效的语义，不是由继承自特定的类或实现特定的接口，而是由它&quot;当前方法和属性的集合&quot;决定。Go 作为一种静态语言，通过接口实现了 <code>鸭子类型</code>，实际上是 Go 的编译器在其中作了隐匿的转换工作。</p><h1 id="_2-值接收者和指针接收者的区别" tabindex="-1"><a class="header-anchor" href="#_2-值接收者和指针接收者的区别"><span>2. 值接收者和指针接收者的区别</span></a></h1><h2 id="方法" tabindex="-1"><a class="header-anchor" href="#方法"><span>方法</span></a></h2><p>方法能给用户自定义的类型添加新的行为。它和函数的区别在于方法有一个接收者，给一个函数添加一个接收者，那么它就变成了方法。接收者可以是<code>值接收者</code>，也可以是<code>指针接收者</code>。</p><p>在调用方法的时候，值类型既可以调用<code>值接收者</code>的方法，也可以调用<code>指针接收者</code>的方法；指针类型既可以调用<code>指针接收者</code>的方法，也可以调用<code>值接收者</code>的方法。</p><p>也就是说，不管方法的接收者是什么类型，该类型的值和指针都可以调用，不必严格符合接收者的类型。</p><p>来看个例子：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Person struct {</span></span>
<span class="line"><span>    age int</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p Person) howOld() int {</span></span>
<span class="line"><span>    return p.age</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p *Person) growUp() {</span></span>
<span class="line"><span>    p.age += 1</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    // qcrao 是值类型</span></span>
<span class="line"><span>    qcrao := Person{age: 18}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 值类型 调用接收者也是值类型的方法</span></span>
<span class="line"><span>    fmt.Println(qcrao.howOld())</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 值类型 调用接收者是指针类型的方法</span></span>
<span class="line"><span>    qcrao.growUp()</span></span>
<span class="line"><span>    fmt.Println(qcrao.howOld())</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // ----------------------</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // stefno 是指针类型</span></span>
<span class="line"><span>    stefno := &amp;Person{age: 100}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 指针类型 调用接收者是值类型的方法</span></span>
<span class="line"><span>    fmt.Println(stefno.howOld())</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 指针类型 调用接收者也是指针类型的方法</span></span>
<span class="line"><span>    stefno.growUp()</span></span>
<span class="line"><span>    fmt.Println(stefno.howOld())</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上例子的输出结果是：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>18</span></span>
<span class="line"><span>19</span></span>
<span class="line"><span>100</span></span>
<span class="line"><span>101</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>调用了 <code>growUp</code> 函数后，不管调用者是值类型还是指针类型，它的 <code>Age</code> 值都改变了。</p><p>实际上，当类型和方法的接收者类型不同时，其实是编译器在背后做了一些工作，用一个表格来呈现：</p><p>-</p><p>值接收者</p><p>指针接收者</p><p>值类型调用者</p><p>方法会使用调用者的一个副本，类似于“传值”</p><p>使用值的引用来调用方法，上例中，<code>qcrao.growUp()</code> 实际上是 <code>(&amp;qcrao).growUp()</code></p><p>指针类型调用者</p><p>指针被解引用为值，上例中，<code>stefno.howOld()</code> 实际上是 <code>(*stefno).howOld()</code></p><p>实际上也是“传值”，方法里的操作会影响到调用者，类似于指针传参，拷贝了一份指针</p><h2 id="值接收者和指针接收者" tabindex="-1"><a class="header-anchor" href="#值接收者和指针接收者"><span>值接收者和指针接收者</span></a></h2><p>前面说过，不管接收者类型是值类型还是指针类型，都可以通过值类型或指针类型调用，这里面实际上通过语法糖起作用的。</p><p>先说结论：实现了接收者是值类型的方法，相当于自动实现了接收者是指针类型的方法；而实现了接收者是指针类型的方法，不会自动生成对应接收者是值类型的方法。</p><p>来看一个例子，就会完全明白：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type coder interface {</span></span>
<span class="line"><span>    code()</span></span>
<span class="line"><span>    debug()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Gopher struct {</span></span>
<span class="line"><span>    language string</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p Gopher) code() {</span></span>
<span class="line"><span>    fmt.Printf(&quot;I am coding %s language\\n&quot;, p.language)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p *Gopher) debug() {</span></span>
<span class="line"><span>    fmt.Printf(&quot;I am debuging %s language\\n&quot;, p.language)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var c coder = &amp;Gopher{&quot;Go&quot;}</span></span>
<span class="line"><span>    c.code()</span></span>
<span class="line"><span>    c.debug()</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上述代码里定义了一个接口 <code>coder</code>，接口定义了两个函数：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>code()</span></span>
<span class="line"><span>debug()</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>接着定义了一个结构体 <code>Gopher</code>，它实现了两个方法，一个值接收者，一个指针接收者。</p><p>最后，我们在 <code>main</code> 函数里通过接口类型的变量调用了定义的两个函数。</p><p>运行一下，结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>I am coding Go language</span></span>
<span class="line"><span>I am debuging Go language</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>但是如果我们把 <code>main</code> 函数的第一条语句换一下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func main() {</span></span>
<span class="line"><span>    var c coder = Gopher{&quot;Go&quot;}</span></span>
<span class="line"><span>    c.code()</span></span>
<span class="line"><span>    c.debug()</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>运行一下，报错：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>./main.go:23:6: cannot use Gopher literal (type Gopher) as type coder in assignment:</span></span>
<span class="line"><span>    Gopher does not implement coder (debug method has pointer receiver)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>看出这两处代码的差别了吗？第一次是将 <code>&amp;Gopher</code> 赋给了 <code>coder</code>；第二次则是将 <code>Gopher</code> 赋给了 <code>coder</code>。</p><p>第二次报错是说，<code>Gopher</code> 没有实现 <code>coder</code>。很明显了吧，因为 <code>Gopher</code> 类型并没有实现 <code>debug</code> 方法；表面上看， <code>*Gopher</code> 类型也没有实现 <code>code</code> 方法，但是因为 <code>Gopher</code> 类型实现了 <code>code</code> 方法，所以让 <code>*Gopher</code> 类型自动拥有了 <code>code</code> 方法。</p><p>当然，上面的说法有一个简单的解释：接收者是指针类型的方法，很可能在方法中会对接收者的属性进行更改操作，从而影响接收者；而对于接收者是值类型的方法，在方法中不会对接收者本身产生影响。</p><p>所以，当实现了一个接收者是值类型的方法，就可以自动生成一个接收者是对应指针类型的方法，因为两者都不会影响接收者。但是，当实现了一个接收者是指针类型的方法，如果此时自动生成一个接收者是值类型的方法，原本期望对接收者的改变（通过指针实现），现在无法实现，因为值类型会产生一个拷贝，不会真正影响调用者。</p><p>最后，只要记住下面这点就可以了：</p><blockquote><p>如果实现了接收者是值类型的方法，会隐含地也实现了接收者是指针类型的方法。</p></blockquote><h2 id="两者分别在何时使用" tabindex="-1"><a class="header-anchor" href="#两者分别在何时使用"><span>两者分别在何时使用</span></a></h2><p>如果方法的接收者是值类型，无论调用者是对象还是对象指针，修改的都是对象的副本，不影响调用者；如果方法的接收者是指针类型，则调用者修改的是指针指向的对象本身。</p><p>使用指针作为方法的接收者的理由：</p><ul><li>方法能够修改接收者指向的值。</li><li>避免在每次调用方法时复制该值，在值的类型为大型结构体时，这样做会更加高效。</li></ul><p>是使用值接收者还是指针接收者，不是由该方法是否修改了调用者（也就是接收者）来决定，而是应该基于该类型的<code>本质</code>。</p><p>如果类型具备“原始的本质”，也就是说它的成员都是由 Go 语言里内置的原始类型，如字符串，整型值等，那就定义值接收者类型的方法。像内置的引用类型，如 slice，map，interface，channel，这些类型比较特殊，声明他们的时候，实际上是创建了一个 <code>header</code>， 对于他们也是直接定义值接收者类型的方法。这样，调用函数时，是直接 copy 了这些类型的 <code>header</code>，而 <code>header</code> 本身就是为复制设计的。</p><p>如果类型具备非原始的本质，不能被安全地复制，这种类型总是应该被共享，那就定义指针接收者的方法。比如 go 源码里的文件结构体（struct File）就不应该被复制，应该只有一份<code>实体</code>。</p><p>这一段说的比较绕，大家可以去看《Go 语言实战》5.3 那一节。</p><h1 id="_3-iface-和-eface-的区别是什么" tabindex="-1"><a class="header-anchor" href="#_3-iface-和-eface-的区别是什么"><span>3. iface 和 eface 的区别是什么</span></a></h1><p><code>iface</code> 和 <code>eface</code> 都是 Go 中描述接口的底层结构体，区别在于 <code>iface</code> 描述的接口包含方法，而 <code>eface</code> 则是不包含任何方法的空接口：<code>interface{}</code>。</p><p>从源码层面看一下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type iface struct {</span></span>
<span class="line"><span>    tab  *itab</span></span>
<span class="line"><span>    data unsafe.Pointer</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type itab struct {</span></span>
<span class="line"><span>    inter  *interfacetype</span></span>
<span class="line"><span>    _type  *_type</span></span>
<span class="line"><span>    link   *itab</span></span>
<span class="line"><span>    hash   uint32 // copy of _type.hash. Used for type switches.</span></span>
<span class="line"><span>    bad    bool   // type does not implement interface</span></span>
<span class="line"><span>    inhash bool   // has this itab been added to hash?</span></span>
<span class="line"><span>    unused [2]byte</span></span>
<span class="line"><span>    fun    [1]uintptr // variable sized</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>iface</code> 内部维护两个指针，<code>tab</code> 指向一个 <code>itab</code> 实体， 它表示接口的类型以及赋给这个接口的实体类型。<code>data</code> 则指向接口具体的值，一般而言是一个指向堆内存的指针。</p><p>再来仔细看一下 <code>itab</code> 结构体：<code>_type</code> 字段描述了实体的类型，包括内存对齐方式，大小等；<code>inter</code> 字段则描述了接口的类型。<code>fun</code> 字段放置和接口方法对应的具体数据类型的方法地址，实现接口调用方法的动态分派，一般在每次给接口赋值发生转换时会更新此表，或者直接拿缓存的 itab。</p><p>这里只会列出实体类型和接口相关的方法，实体类型的其他方法并不会出现在这里。如果你学过 C++ 的话，这里可以类比虚函数的概念。</p><p>另外，你可能会觉得奇怪，为什么 <code>fun</code> 数组的大小为 1，要是接口定义了多个方法可怎么办？实际上，这里存储的是第一个方法的函数指针，如果有更多的方法，在它之后的内存空间里继续存储。从汇编角度来看，通过增加地址就能获取到这些函数指针，没什么影响。顺便提一句，这些方法是按照函数名称的字典序进行排列的。</p><p>再看一下 <code>interfacetype</code> 类型，它描述的是接口的类型：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type interfacetype struct {</span></span>
<span class="line"><span>    typ     _type</span></span>
<span class="line"><span>    pkgpath name</span></span>
<span class="line"><span>    mhdr    []imethod</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以看到，它包装了 <code>_type</code> 类型，<code>_type</code> 实际上是描述 Go 语言中各种数据类型的结构体。我们注意到，这里还包含一个 <code>mhdr</code> 字段，表示接口所定义的函数列表， <code>pkgpath</code> 记录定义了接口的包名。</p><p>这里通过���张图来看下 <code>iface</code> 结构体的全貌：</p><figure><img src="https://user-images.githubusercontent.com/7698088/56564826-82527600-65e1-11e9-956d-d98a212bc863.png" alt="iface 结构体全景" tabindex="0" loading="lazy"><figcaption>iface 结构体全景</figcaption></figure><p>接着来看一下 <code>eface</code> 的源码：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type eface struct {</span></span>
<span class="line"><span>    _type *_type</span></span>
<span class="line"><span>    data  unsafe.Pointer</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>相比 <code>iface</code>，<code>eface</code> 就比较简单了。只维护了一个 <code>_type</code> 字段，表示空接口所承载的具体的实体类型。<code>data</code> 描述了具体的值。</p><figure><img src="https://user-images.githubusercontent.com/7698088/56565105-318f4d00-65e2-11e9-96bd-4b2e192791dc.png" alt="eface 结构体全景" tabindex="0" loading="lazy"><figcaption>eface 结构体全景</figcaption></figure><p>我们来看个例子：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    x := 200</span></span>
<span class="line"><span>    var any interface{} = x</span></span>
<span class="line"><span>    fmt.Println(any)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    g := Gopher{&quot;Go&quot;}</span></span>
<span class="line"><span>    var c coder = g</span></span>
<span class="line"><span>    fmt.Println(c)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type coder interface {</span></span>
<span class="line"><span>    code()</span></span>
<span class="line"><span>    debug()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Gopher struct {</span></span>
<span class="line"><span>    language string</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p Gopher) code() {</span></span>
<span class="line"><span>    fmt.Printf(&quot;I am coding %s language\\n&quot;, p.language)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p Gopher) debug() {</span></span>
<span class="line"><span>    fmt.Printf(&quot;I am debuging %s language\\n&quot;, p.language)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行命令，打印出汇编语言：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go tool compile -S ./src/main.go</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>可以看到，main 函数里调用了两个函数：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func convT2E64(t *_type, elem unsafe.Pointer) (e eface)</span></span>
<span class="line"><span>func convT2I(tab *itab, elem unsafe.Pointer) (i iface)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>上面两个函数的参数和 <code>iface</code> 及 <code>eface</code> 结构体的字段是可以联系起来的：两个函数都是将参数<code>组装</code>一下，形成最终的接口。</p><p>作为补充，我们最后再来看下 <code>_type</code> 结构体：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type _type struct {</span></span>
<span class="line"><span>    // 类型大小</span></span>
<span class="line"><span>    size       uintptr</span></span>
<span class="line"><span>    ptrdata    uintptr</span></span>
<span class="line"><span>    // 类型的 hash 值</span></span>
<span class="line"><span>    hash       uint32</span></span>
<span class="line"><span>    // 类型的 flag，和反射相关</span></span>
<span class="line"><span>    tflag      tflag</span></span>
<span class="line"><span>    // 内存对齐相关</span></span>
<span class="line"><span>    align      uint8</span></span>
<span class="line"><span>    fieldalign uint8</span></span>
<span class="line"><span>    // 类型的编号，有bool, slice, struct 等等等等</span></span>
<span class="line"><span>    kind       uint8</span></span>
<span class="line"><span>    alg        *typeAlg</span></span>
<span class="line"><span>    // gc 相关</span></span>
<span class="line"><span>    gcdata    *byte</span></span>
<span class="line"><span>    str       nameOff</span></span>
<span class="line"><span>    ptrToThis typeOff</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Go ��言各种数据类型都是在 <code>_type</code> 字段的基础上，增加一些额外的字段来进行管理的：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type arraytype struct {</span></span>
<span class="line"><span>    typ   _type</span></span>
<span class="line"><span>    elem  *_type</span></span>
<span class="line"><span>    slice *_type</span></span>
<span class="line"><span>    len   uintptr</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type chantype struct {</span></span>
<span class="line"><span>    typ  _type</span></span>
<span class="line"><span>    elem *_type</span></span>
<span class="line"><span>    dir  uintptr</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type slicetype struct {</span></span>
<span class="line"><span>    typ  _type</span></span>
<span class="line"><span>    elem *_type</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type structtype struct {</span></span>
<span class="line"><span>    typ     _type</span></span>
<span class="line"><span>    pkgPath name</span></span>
<span class="line"><span>    fields  []structfield</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这些数据类型的结构体定义，是反射实现的基础。</p><h1 id="_4-接口的动态类型和动态值" tabindex="-1"><a class="header-anchor" href="#_4-接口的动态类型和动态值"><span>4. 接口的动态类型和动态值</span></a></h1><p>从源码里可以看到：<code>iface</code>包含两个字段：<code>tab</code> 是接口表指针，指向类型信息；<code>data</code> 是数据指针，则指向具体的数据。它们分别被称为<code>动态类型</code>和<code>动态值</code>。而接口值包括<code>动态类型</code>和<code>动态值</code>。</p><p>【引申1】接口类型和 <code>nil</code> 作比较</p><p>接口值的零值是指<code>动态类型</code>和<code>动态值</code>都为 <code>nil</code>。当仅且当这两部分的值都为 <code>nil</code> 的情况下，这个接口值就才会被认为 <code>接口值 == nil</code>。</p><p>来看个例子：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Coder interface {</span></span>
<span class="line"><span>    code()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Gopher struct {</span></span>
<span class="line"><span>    name string</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (g Gopher) code() {</span></span>
<span class="line"><span>    fmt.Printf(&quot;%s is coding\\n&quot;, g.name)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var c Coder</span></span>
<span class="line"><span>    fmt.Println(c == nil)</span></span>
<span class="line"><span>    fmt.Printf(&quot;c: %T, %v\\n&quot;, c, c)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    var g *Gopher</span></span>
<span class="line"><span>    fmt.Println(g == nil)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    c = g</span></span>
<span class="line"><span>    fmt.Println(c == nil)</span></span>
<span class="line"><span>    fmt.Printf(&quot;c: %T, %v\\n&quot;, c, c)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>true</span></span>
<span class="line"><span>c: , </span></span>
<span class="line"><span>true</span></span>
<span class="line"><span>false</span></span>
<span class="line"><span>c: *main.Gopher,</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>一开始，<code>c</code> 的 动态类型和动态值都为 <code>nil</code>，<code>g</code> 也为 <code>nil</code>，当把 <code>g</code> 赋值给 <code>c</code> 后，<code>c</code> 的动态类型变成了 <code>*main.Gopher</code>，仅管 <code>c</code> 的动态值仍为 <code>nil</code>，但是当 <code>c</code> 和 <code>nil</code> 作比较的时候，结果就是 <code>false</code> 了。</p><p>【引申2】<br> 来看一个例子，看一下它的输出：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type MyError struct {}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (i MyError) Error() string {</span></span>
<span class="line"><span>    return &quot;MyError&quot;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    err := Process()</span></span>
<span class="line"><span>    fmt.Println(err)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    fmt.Println(err == nil)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func Process() error {</span></span>
<span class="line"><span>    var err *MyError = nil</span></span>
<span class="line"><span>    return err</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>函数运行结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span></span></span>
<span class="line"><span>false</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>这里先定义了一个 <code>MyError</code> 结构体，实现了 <code>Error</code> 函数，也就实现了 <code>error</code> 接口。<code>Process</code> 函数返回了一个 <code>error</code> 接口，这块隐含了类型转换。所以，虽然它的值是 <code>nil</code>，其实它的类型是 <code>*MyError</code>，最后和 <code>nil</code> 比较的时候，结果为 <code>false</code>。</p><p>【引申3】如何打印出接口的动态类型和值？</p><p>直接看代码：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import (</span></span>
<span class="line"><span>    &quot;unsafe&quot;</span></span>
<span class="line"><span>    &quot;fmt&quot;</span></span>
<span class="line"><span>)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type iface struct {</span></span>
<span class="line"><span>    itab, data uintptr</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var a interface{} = nil</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    var b interface{} = (*int)(nil)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    x := 5</span></span>
<span class="line"><span>    var c interface{} = (*int)(&amp;x)</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    ia := *(*iface)(unsafe.Pointer(&amp;a))</span></span>
<span class="line"><span>    ib := *(*iface)(unsafe.Pointer(&amp;b))</span></span>
<span class="line"><span>    ic := *(*iface)(unsafe.Pointer(&amp;c))</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    fmt.Println(ia, ib, ic)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    fmt.Println(*(*int)(unsafe.Pointer(ic.data)))</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>代码里直接定义了一个 <code>iface</code> 结构体，用两个指针来描述 <code>itab</code> 和 <code>data</code>，之后将 a, b, c 在内存中的内容强制解释成我们自定义的 <code>iface</code>。最后就可以打印出动态类型和动态值的地址。</p><p>运行结果如下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>{0 0} {17426912 0} {17426912 842350714568}</span></span>
<span class="line"><span>5</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>a 的动态类型和动态值的地址均为 0，也就是 nil；b 的动态类型和 c 的动态类型一致，都是 <code>*int</code>；最后，c 的动态值为 5。</p><h1 id="_5-编译器自动检测类型是否实现接口" tabindex="-1"><a class="header-anchor" href="#_5-编译器自动检测类型是否实现接口"><span>5. 编译器自动检测类型是否实现接口</span></a></h1><p>经常看到一些开源库里会有一些类似下面这种奇怪的用法：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>var _ io.Writer = (*myWriter)(nil)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>这时候会有点懵，不知道作者想要干什么，实际上这就是此问题的答案。编译器会由此检查 <code>*myWriter</code> 类型是否实现了 <code>io.Writer</code> 接口。</p><p>来看一个例子：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;io&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type myWriter struct {</span></span>
<span class="line"><span></span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>/*func (w myWriter) Write(p []byte) (n int, err error) {</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}*/</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    // 检查 *myWriter 类型是否实现了 io.Writer 接口</span></span>
<span class="line"><span>    var _ io.Writer = (*myWriter)(nil)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 检查 myWriter 类型是否实现了 io.Writer 接口</span></span>
<span class="line"><span>    var _ io.Writer = myWriter{}</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>注释掉为 myWriter 定义的 Write 函数后，运行程序：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>src/main.go:14:6: cannot use (*myWriter)(nil) (type *myWriter) as type io.Writer in assignment:</span></span>
<span class="line"><span>    *myWriter does not implement io.Writer (missing Write method)</span></span>
<span class="line"><span>src/main.go:15:6: cannot use myWriter literal (type myWriter) as type io.Writer in assignment:</span></span>
<span class="line"><span>    myWriter does not implement io.Writer (missing Write method)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>报错信息：*myWriter/myWriter 未实现 io.Writer 接口，也就是未实现 Write 方法。</p><p>解除注释后，运行程序不报错。</p><p>实际上，上述赋值语句会发生隐式地类型转换，在转换的过程中，编译器会检测等号右边的类型是否实现了等号左边接口所规定的函数。</p><p>总结一下，可通过在代码中添加类似如下的代码，用来检测类型是否实现了接口：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>var _ io.Writer = (*myWriter)(nil)</span></span>
<span class="line"><span>var _ io.Writer = myWriter{}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_6-接口的构造过程是怎样的" tabindex="-1"><a class="header-anchor" href="#_6-接口的构造过程是怎样的"><span>6. 接口的构造过程是怎样的</span></a></h1><p>我们已经看过了 <code>iface</code> 和 <code>eface</code> 的源码，知道 <code>iface</code> 最重要的是 <code>itab</code> 和 <code>_type</code>。</p><p>为了研究清楚接口是如何构造的，接下来我会拿起汇编的武器，还原背后的真相。</p><p>来看一个示例代码：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Person interface {</span></span>
<span class="line"><span>    growUp()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Student struct {</span></span>
<span class="line"><span>    age int</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p Student) growUp() {</span></span>
<span class="line"><span>    p.age += 1</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var qcrao = Person(Student{age: 18})</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    fmt.Println(qcrao)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行命令：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go tool compile -S main.go</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>得到 main 函数的汇编代码如下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>0x0000 00000 (./src/main.go:30) TEXT    &quot;&quot;.main(SB), $80-0</span></span>
<span class="line"><span>0x0000 00000 (./src/main.go:30) MOVQ    (TLS), CX</span></span>
<span class="line"><span>0x0009 00009 (./src/main.go:30) CMPQ    SP, 16(CX)</span></span>
<span class="line"><span>0x000d 00013 (./src/main.go:30) JLS     157</span></span>
<span class="line"><span>0x0013 00019 (./src/main.go:30) SUBQ    $80, SP</span></span>
<span class="line"><span>0x0017 00023 (./src/main.go:30) MOVQ    BP, 72(SP)</span></span>
<span class="line"><span>0x001c 00028 (./src/main.go:30) LEAQ    72(SP), BP</span></span>
<span class="line"><span>0x0021 00033 (./src/main.go:30) FUNCDATA$0, gclocals·69c1753bd5f81501d95132d08af04464(SB)</span></span>
<span class="line"><span>0x0021 00033 (./src/main.go:30) FUNCDATA$1, gclocals·e226d4ae4a7cad8835311c6a4683c14f(SB)</span></span>
<span class="line"><span>0x0021 00033 (./src/main.go:31) MOVQ    $18, &quot;&quot;..autotmp_1+48(SP)</span></span>
<span class="line"><span>0x002a 00042 (./src/main.go:31) LEAQ    go.itab.&quot;&quot;.Student,&quot;&quot;.Person(SB), AX</span></span>
<span class="line"><span>0x0031 00049 (./src/main.go:31) MOVQ    AX, (SP)</span></span>
<span class="line"><span>0x0035 00053 (./src/main.go:31) LEAQ    &quot;&quot;..autotmp_1+48(SP), AX</span></span>
<span class="line"><span>0x003a 00058 (./src/main.go:31) MOVQ    AX, 8(SP)</span></span>
<span class="line"><span>0x003f 00063 (./src/main.go:31) PCDATA  $0, $0</span></span>
<span class="line"><span>0x003f 00063 (./src/main.go:31) CALL    runtime.convT2I64(SB)</span></span>
<span class="line"><span>0x0044 00068 (./src/main.go:31) MOVQ    24(SP), AX</span></span>
<span class="line"><span>0x0049 00073 (./src/main.go:31) MOVQ    16(SP), CX</span></span>
<span class="line"><span>0x004e 00078 (./src/main.go:33) TESTQ   CX, CX</span></span>
<span class="line"><span>0x0051 00081 (./src/main.go:33) JEQ     87</span></span>
<span class="line"><span>0x0053 00083 (./src/main.go:33) MOVQ    8(CX), CX</span></span>
<span class="line"><span>0x0057 00087 (./src/main.go:33) MOVQ    $0, &quot;&quot;..autotmp_2+56(SP)</span></span>
<span class="line"><span>0x0060 00096 (./src/main.go:33) MOVQ    $0, &quot;&quot;..autotmp_2+64(SP)</span></span>
<span class="line"><span>0x0069 00105 (./src/main.go:33) MOVQ    CX, &quot;&quot;..autotmp_2+56(SP)</span></span>
<span class="line"><span>0x006e 00110 (./src/main.go:33) MOVQ    AX, &quot;&quot;..autotmp_2+64(SP)</span></span>
<span class="line"><span>0x0073 00115 (./src/main.go:33) LEAQ    &quot;&quot;..autotmp_2+56(SP), AX</span></span>
<span class="line"><span>0x0078 00120 (./src/main.go:33) MOVQ    AX, (SP)</span></span>
<span class="line"><span>0x007c 00124 (./src/main.go:33) MOVQ    $1, 8(SP)</span></span>
<span class="line"><span>0x0085 00133 (./src/main.go:33) MOVQ    $1, 16(SP)</span></span>
<span class="line"><span>0x008e 00142 (./src/main.go:33) PCDATA  $0, $1</span></span>
<span class="line"><span>0x008e 00142 (./src/main.go:33) CALL    fmt.Println(SB)</span></span>
<span class="line"><span>0x0093 00147 (./src/main.go:34) MOVQ    72(SP), BP</span></span>
<span class="line"><span>0x0098 00152 (./src/main.go:34) ADDQ    $80, SP</span></span>
<span class="line"><span>0x009c 00156 (./src/main.go:34) RET</span></span>
<span class="line"><span>0x009d 00157 (./src/main.go:34) NOP</span></span>
<span class="line"><span>0x009d 00157 (./src/main.go:30) PCDATA  $0, $-1</span></span>
<span class="line"><span>0x009d 00157 (./src/main.go:30) CALL    runtime.morestack_noctxt(SB)</span></span>
<span class="line"><span>0x00a2 00162 (./src/main.go:30) JMP     0</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们从第 10 行开始看，如果不理解前面几行汇编代码的话，可以回去看看公众号前面两篇文章，这里我就省略了。</p><p>汇编行数</p><p>操作</p><p>10-14</p><p>构造调用 <code>runtime.convT2I64(SB)</code> 的参数</p><p>我们来看下这个函数的参数形式：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func convT2I64(tab *itab, elem unsafe.Pointer) (i iface) {</span></span>
<span class="line"><span>    // ……</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>convT2I64</code> 会构造出一个 <code>inteface</code>，也就是我们的 <code>Person</code> 接口。</p><p>第一个参数的位置是 <code>(SP)</code>，这里被赋上了 <code>go.itab.&quot;&quot;.Student,&quot;&quot;.Person(SB)</code> 的地址。</p><p>我们从生成的汇编找到：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go.itab.&quot;&quot;.Student,&quot;&quot;.Person SNOPTRDATA dupok size=40</span></span>
<span class="line"><span>        0x0000 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  </span></span>
<span class="line"><span>        0x0010 00 00 00 00 00 00 00 00 da 9f 20 d4              </span></span>
<span class="line"><span>        rel 0+8 t=1 type.&quot;&quot;.Person+0</span></span>
<span class="line"><span>        rel 8+8 t=1 type.&quot;&quot;.Student+0</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>size=40</code> 大��为40字节，回顾一下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type itab struct {</span></span>
<span class="line"><span>    inter  *interfacetype // 8字节</span></span>
<span class="line"><span>    _type  *_type // 8字节</span></span>
<span class="line"><span>    link   *itab // 8字节</span></span>
<span class="line"><span>    hash   uint32 // 4字节</span></span>
<span class="line"><span>    bad    bool   // 1字节</span></span>
<span class="line"><span>    inhash bool   // 1字节</span></span>
<span class="line"><span>    unused [2]byte // 2字节</span></span>
<span class="line"><span>    fun    [1]uintptr // variable sized // 8字节</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>把每个字段的大小相加，<code>itab</code> 结构体的大小就是 40 字节。上面那一串数字实际上是 <code>itab</code> 序列化后的内容，注意到大部分数字是 0，从 24 字节开始的 4 个字节 <code>da 9f 20 d4</code> 实际上是 <code>itab</code> 的 <code>hash</code> 值，这在判断两个类型是否相同的时候会用到。</p><p>下面两行是链接指令，简单说就是将所有源文件综合起来，给每个符号赋予一个全局的位置值。这里的意思也比较明确：前8个字节最终存储的是 <code>type.&quot;&quot;.Person</code> 的地址，对应 <code>itab</code> 里的 <code>inter</code> 字段，表示接口类型；8-16 字节最终存储的是 <code>type.&quot;&quot;.Student</code> 的地址，对应 <code>itab</code> 里 <code>_type</code> 字段，表示具体类型。</p><p>第二个参数就比较简单了，它就是数字 <code>18</code> 的地址，这也是初始化 <code>Student</code> 结构体的时候会用到。</p><p>汇编行数</p><p>操作</p><p>15</p><p>调用 <code>runtime.convT2I64(SB)</code></p><p>具体看下代码：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func convT2I64(tab *itab, elem unsafe.Pointer) (i iface) {</span></span>
<span class="line"><span>    t := tab._type</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    //...</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    var x unsafe.Pointer</span></span>
<span class="line"><span>    if *(*uint64)(elem) == 0 {</span></span>
<span class="line"><span>        x = unsafe.Pointer(&amp;zeroVal[0])</span></span>
<span class="line"><span>    } else {</span></span>
<span class="line"><span>        x = mallocgc(8, t, false)</span></span>
<span class="line"><span>        *(*uint64)(x) = *(*uint64)(elem)</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    i.tab = tab</span></span>
<span class="line"><span>    i.data = x</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这块代码比较简单，把 <code>tab</code> 赋给了 <code>iface</code> 的 <code>tab</code> 字段；<code>data</code> 部分则是在堆上申请了一块内存，然后将 <code>elem</code> 指向的 <code>18</code> 拷贝过去。这样 <code>iface</code> 就组装好了。</p><p>汇编行数</p><p>操作</p><p>17</p><p>把 <code>i.tab</code> 赋给 <code>CX</code></p><p>18</p><p>把 <code>i.data</code> 赋给 <code>AX</code></p><p>19-21</p><p>检测 <code>i.tab</code> 是否是 nil，如果不是的话，把 CX 移动 8 个字节，也就是把 <code>itab</code> 的 <code>_type</code> 字段赋给了 CX，这也是接口的实体类型，最终要作为 <code>fmt.Println</code> 函数的参数</p><p>后面，就是调用 <code>fmt.Println</code> 函数及之前的参数准备工作了，不再赘述。</p><p>这样，我们就把一个 <code>interface</code> 的构造过程说完了。</p><p>【引申1】<br> 如何打印出接口类型的 <code>Hash</code> 值？</p><p>这里参考曹大神翻译的一篇文章，参考资料里会写上。具体做法如下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type iface struct {</span></span>
<span class="line"><span>    tab  *itab</span></span>
<span class="line"><span>    data unsafe.Pointer</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>type itab struct {</span></span>
<span class="line"><span>    inter uintptr</span></span>
<span class="line"><span>    _type uintptr</span></span>
<span class="line"><span>    link uintptr</span></span>
<span class="line"><span>    hash  uint32</span></span>
<span class="line"><span>    _     [4]byte</span></span>
<span class="line"><span>    fun   [1]uintptr</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var qcrao = Person(Student{age: 18})</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    iface := (*iface)(unsafe.Pointer(&amp;qcrao))</span></span>
<span class="line"><span>    fmt.Printf(&quot;iface.tab.hash = %#x\\n&quot;, iface.tab.hash)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>定义了一个<code>山寨版</code>的 <code>iface</code> 和 <code>itab</code>，说它<code>山寨</code>是因为 <code>itab</code> 里的一些关键数据结构都不具体展开了，比如 <code>_type</code>，对比一下正宗的定义就可以发现，但是<code>山寨版</code>依然能工作，因为 <code>_type</code> 就是一个指针而已嘛。</p><p>在 <code>main</code> 函数里，先构造出一个接口对象 <code>qcrao</code>，然后强制类型转换，最后读取出 <code>hash</code> 值，非常妙！你也可以自己动手试一下。</p><p>运行结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>iface.tab.hash = 0xd4209fda</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>值得一提的是，构造接口 <code>qcrao</code> 的时候，即使我把 <code>age</code> 写成其他值，得到的 <code>hash</code> 值依然不变的，这应该是可以预料的，<code>hash</code> 值只和他的字段、方法相关。</p><h1 id="_7-类型转换和断言的区别" tabindex="-1"><a class="header-anchor" href="#_7-类型转换和断言的区别"><span>7. 类型转换和断言的区别</span></a></h1><p>我们知道，Go 语言中不允许隐式类型转换，也就是说 <code>=</code> 两边，不允许出现类型不相同的变量。</p><p><code>类型转换</code>、<code>类型断言</code>本质都是把一个类型转换成另外一个类型。不同之处在于，类型断言是对接口变量进行的操作。</p><h2 id="类型转换" tabindex="-1"><a class="header-anchor" href="#类型转换"><span>类型转换</span></a></h2><p>对于<code>类型转换</code>而言，转换前后的两个类型要相互兼容才行。类型转换的语法为：</p><blockquote><p>&lt;结果类型&gt; := &lt;目标类型&gt; ( &lt;表达式&gt; )</p></blockquote><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var i int = 9</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    var f float64</span></span>
<span class="line"><span>    f = float64(i)</span></span>
<span class="line"><span>    fmt.Printf(&quot;%T, %v\\n&quot;, f, f)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    f = 10.8</span></span>
<span class="line"><span>    a := int(f)</span></span>
<span class="line"><span>    fmt.Printf(&quot;%T, %v\\n&quot;, a, a)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // s := []int(i)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的代码里，我定义了一个 <code>int</code> 型和 <code>float64</code> 型的变量，尝试在它们之前相互转换，结果是成功的：<code>int</code> 型和 <code>float64</code> 是相互兼容的。</p><p>如果我把最后一行代码的注释去掉，编译器会报告类型不兼容的错误：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>cannot convert i (type int) to type []int</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h2 id="断言" tabindex="-1"><a class="header-anchor" href="#断言"><span>断言</span></a></h2><p>前面说过，因为空接口 <code>interface{}</code> 没有定义任何函数，因此 Go 中所有类型都实现了空接口。当一个函数的形参是 <code>interface{}</code>，那么在函数中，需要对形参进行断言，从而得到它的真实类型。</p><p>断言的语法为：</p><blockquote><p>&lt;目标类型的值&gt;，&lt;布尔参数&gt; := &lt;表达式&gt;.( 目标类型 ) // 安全类型断言<br> &lt;目标类型的值&gt; := &lt;表达式&gt;.( 目标类型 )　　//非安全类型断言</p></blockquote><p>类型转换和类型断言有些相似，不同之处，在于类型断言是对接口进行的操作。</p><p>还是来看一个简短的例子：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Student struct {</span></span>
<span class="line"><span>    Name string</span></span>
<span class="line"><span>    Age int</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var i interface{} = new(Student)</span></span>
<span class="line"><span>    s := i.(Student)</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    fmt.Println(s)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>运行一下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>panic: interface conversion: interface {} is *main.Student, not main.Student</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>直接 <code>panic</code> 了，这是因为 <code>i</code> 是 <code>*Student</code> 类型，并非 <code>Student</code> 类型，断言失败。这里直接发生了 <code>panic</code>，线上代码可能并不适合这样做，可以采用“安全断言”的语法：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func main() {</span></span>
<span class="line"><span>    var i interface{} = new(Student)</span></span>
<span class="line"><span>    s, ok := i.(Student)</span></span>
<span class="line"><span>    if ok {</span></span>
<span class="line"><span>        fmt.Println(s)</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这样，即使断言失败也不会 <code>panic</code>。</p><p>断言其实还有另一种形式，就是用在利用 <code>switch</code> 语句判断接口的类型。每一个 <code>case</code> 会被顺序地考虑。当命中一个 <code>case</code> 时，就会执行 <code>case</code> 中的语句，因此 <code>case</code> 语句的顺序是很重要的，因为很有可能会有多个 <code>case</code> 匹配的情况。</p><p>代码示例如下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func main() {</span></span>
<span class="line"><span>    //var i interface{} = new(Student)</span></span>
<span class="line"><span>    //var i interface{} = (*Student)(nil)</span></span>
<span class="line"><span>    var i interface{}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    fmt.Printf(&quot;%p %v\\n&quot;, &amp;i, i)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    judge(i)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func judge(v interface{}) {</span></span>
<span class="line"><span>    fmt.Printf(&quot;%p %v\\n&quot;, &amp;v, v)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    switch v := v.(type) {</span></span>
<span class="line"><span>    case nil:</span></span>
<span class="line"><span>        fmt.Printf(&quot;%p %v\\n&quot;, &amp;v, v)</span></span>
<span class="line"><span>        fmt.Printf(&quot;nil type[%T] %v\\n&quot;, v, v)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    case Student:</span></span>
<span class="line"><span>        fmt.Printf(&quot;%p %v\\n&quot;, &amp;v, v)</span></span>
<span class="line"><span>        fmt.Printf(&quot;Student type[%T] %v\\n&quot;, v, v)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    case *Student:</span></span>
<span class="line"><span>        fmt.Printf(&quot;%p %v\\n&quot;, &amp;v, v)</span></span>
<span class="line"><span>        fmt.Printf(&quot;*Student type[%T] %v\\n&quot;, v, v)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    default:</span></span>
<span class="line"><span>        fmt.Printf(&quot;%p %v\\n&quot;, &amp;v, v)</span></span>
<span class="line"><span>        fmt.Printf(&quot;unknow\\n&quot;)</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Student struct {</span></span>
<span class="line"><span>    Name string</span></span>
<span class="line"><span>    Age int</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>main</code> 函数里有三行不同的声明，每次运行一行，注释另外两行，得到三组运行结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>// --- var i interface{} = new(Student)</span></span>
<span class="line"><span>0xc4200701b0 [Name: ], [Age: 0]</span></span>
<span class="line"><span>0xc4200701d0 [Name: ], [Age: 0]</span></span>
<span class="line"><span>0xc420080020 [Name: ], [Age: 0]</span></span>
<span class="line"><span>*Student type[*main.Student] [Name: ], [Age: 0]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// --- var i interface{} = (*Student)(nil)</span></span>
<span class="line"><span>0xc42000e1d0 </span></span>
<span class="line"><span>0xc42000e1f0 </span></span>
<span class="line"><span>0xc42000c030 </span></span>
<span class="line"><span>*Student type[*main.Student] </span></span>
<span class="line"><span></span></span>
<span class="line"><span>// --- var i interface{}</span></span>
<span class="line"><span>0xc42000e1d0 </span></span>
<span class="line"><span>0xc42000e1e0 </span></span>
<span class="line"><span>0xc42000e1f0 </span></span>
<span class="line"><span>nil type[]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>对于第一行语句：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>var i interface{} = new(Student)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p><code>i</code> 是一个 <code>*Student</code> 类型，匹配上第三个 case，从打印的三个地址来看，这三处的变量实际上都是不一样的。在 <code>main</code> 函数里有一个局部变量 <code>i</code>；调用函数时，实际上是复制了一份参数，因此函数里又有一个变量 <code>v</code>，它是 <code>i</code> 的拷贝；断言之后，又生成了一份新的拷贝。所以最终打印的三个变量的地址都不一样。</p><p>对于第二行语句：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>var i interface{} = (*Student)(nil)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>这里想说明的其实是 <code>i</code> 在这里动态类型是 <code>(*Student)</code>, 数据为 <code>nil</code>，它的类型并不是 <code>nil</code>，它与 <code>nil</code> 作比较的时候，得到的结果也是 <code>false</code>。</p><p>最后一行语句：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>var i interface{}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>这回 <code>i</code> 才是 <code>nil</code> 类型。</p><p>【引申1】<br><code>fmt.Println</code> 函数的参数是 <code>interface</code>。对于内置类型，函数内部会用穷举法，得出它的真实类型，然后转换为字符串打印。而对于自定义类型，首先确定该类型是否实现了 <code>String()</code> 方法，如果实现了，则直接打印输出 <code>String()</code> 方法的结果；否则，会通过反射来遍历对象的成员进行打印。</p><p>再来看一个简短的例子，比较简单，不要紧张：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Student struct {</span></span>
<span class="line"><span>    Name string</span></span>
<span class="line"><span>    Age int</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var s = Student{</span></span>
<span class="line"><span>        Name: &quot;qcrao&quot;,</span></span>
<span class="line"><span>        Age: 18,</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    fmt.Println(s)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>因为 <code>Student</code> 结构体没有实现 <code>String()</code> 方法，所以 <code>fmt.Println</code> 会利用反射挨个打印成员变量：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>{qcrao 18}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>增加一个 <code>String()</code> 方法的实现：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func (s Student) String() string {</span></span>
<span class="line"><span>    return fmt.Sprintf(&quot;[Name: %s], [Age: %d]&quot;, s.Name, s.Age)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>打印结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>[Name: qcrao], [Age: 18]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>按照我们自定义的方法来打印了。</p><p>【引申2】<br> 针对上面的例子，如果改一下：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func (s *Student) String() string {</span></span>
<span class="line"><span>    return fmt.Sprintf(&quot;[Name: %s], [Age: %d]&quot;, s.Name, s.Age)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>注意看两个函数的接受者类型不同，现在 <code>Student</code> 结构体只有一个接受者类型为 <code>指针类型</code> 的 <code>String()</code> 函数，打印结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>{qcrao 18}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>为什么？</p><blockquote><p>类型 <code>T</code> 只有接受者是 <code>T</code> 的方法；而类型 <code>*T</code> 拥有接受者是 <code>T</code> 和 <code>*T</code> 的方法。语法上 <code>T</code> 能直接调 <code>*T</code> 的方法仅仅是 <code>Go</code> 的语法糖。</p></blockquote><p>所以， <code>Student</code> 结构体定义了接受者类型是值类型的 <code>String()</code> 方法时，通过</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>fmt.Println(s)</span></span>
<span class="line"><span>fmt.Println(&amp;s)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>均可以按照自定义的格式来打印。</p><p>如果 <code>Student</code> 结构体定义了接受者类型是指针类型的 <code>String()</code> 方法时，只有通过</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>fmt.Println(&amp;s)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>才能按照自定义的格式打印。</p><h1 id="_8-接口转换的原理" tabindex="-1"><a class="header-anchor" href="#_8-接口转换的原理"><span>8. 接口转换的原理</span></a></h1><p>通过前面提到的 <code>iface</code> 的源码可以看到，实际上它包含接口的类型 <code>interfacetype</code> 和 实体类型的类型 <code>_type</code>，这两者都是 <code>iface</code> 的字段 <code>itab</code> 的成员。也就是说生成一个 <code>itab</code> 同时需要接口的类型和实体的类型。</p><blockquote><p>-&gt;itable</p></blockquote><p>当判定一种类型是否满足某个接口时，Go 使用类型的方法集和接口所需要的方法集进行匹配，如果类型的方法集完全包含接口的方法集，则可认为该类型实现了该接口。</p><p>例如某类型有 <code>m</code> 个方法，某接口有 <code>n</code> 个方法，则很容易知道这种判定的时间复杂度为 <code>O(mn)</code>，Go 会对方法集的函数按照函数名的字典序进行排序，所以实际的时间复杂度为 <code>O(m+n)</code>。</p><p>这里我们来探索将一个接口转换给另外一个接口背后的原理，当然，能转换的原因必然是类型兼容。</p><p>直接来看一个例子：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type coder interface {</span></span>
<span class="line"><span>    code()</span></span>
<span class="line"><span>    run()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type runner interface {</span></span>
<span class="line"><span>    run()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Gopher struct {</span></span>
<span class="line"><span>    language string</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (g Gopher) code() {</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (g Gopher) run() {</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    var c coder = Gopher{}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    var r runner</span></span>
<span class="line"><span>    r = c</span></span>
<span class="line"><span>    fmt.Println(c, r)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>简单解释下上述代码：定义了两个 <code>interface</code>: <code>coder</code> 和 <code>runner</code>。定义了一个实体类型 <code>Gopher</code>，类型 <code>Gopher</code> 实现了两个方法，分别是 <code>run()</code> 和 <code>code()</code>。main 函数里定义了一个接口变量 <code>c</code>，绑定了一个 <code>Gopher</code> 对象，之后将 <code>c</code> 赋值给另外一个接口变量 <code>r</code> 。赋值成功的原因是 <code>c</code> 中包含 <code>run()</code> 方法。这样，两个接口变量完成了转换。</p><p>执行命令：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go tool compile -S ./src/main.go</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>得到 main 函数的汇编命令，可以看到： <code>r = c</code> 这一行语句实际上是调用了 <code>runtime.convI2I(SB)</code>，也就是 <code>convI2I</code> 函数，从函数名来看，就是将一个 <code>interface</code> 转换成另外一个 <code>interface</code>，看下它的源代码：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func convI2I(inter *interfacetype, i iface) (r iface) {</span></span>
<span class="line"><span>    tab := i.tab</span></span>
<span class="line"><span>    if tab == nil {</span></span>
<span class="line"><span>        return</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    if tab.inter == inter {</span></span>
<span class="line"><span>        r.tab = tab</span></span>
<span class="line"><span>        r.data = i.data</span></span>
<span class="line"><span>        return</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    r.tab = getitab(inter, tab._type, false)</span></span>
<span class="line"><span>    r.data = i.data</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>代码比较简单，函数参数 <code>inter</code> 表示接口类型，<code>i</code> 表示绑定了实体类型的接口，<code>r</code> 则表示接口转换了之后的新的 <code>iface</code>。通过前面的分析，我们又知道， <code>iface</code> 是由 <code>tab</code> 和 <code>data</code> 两个字段组成。所以，实际上 <code>convI2I</code> 函数真正要做的事，找到新 <code>interface</code> 的 <code>tab</code> 和 <code>data</code>，就大功告成了。</p><p>我们还知道，<code>tab</code> 是由接口类型 <code>interfacetype</code> 和 实体类型 <code>_type</code>。所以最关键的语句是 <code>r.tab = getitab(inter, tab._type, false)</code>。</p><p>因此，重点来看下 <code>getitab</code> 函数的源码，只看关键的地方：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func getitab(inter *interfacetype, typ *_type, canfail bool) *itab {</span></span>
<span class="line"><span>    // ……</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 根据 inter, typ 计算出 hash 值</span></span>
<span class="line"><span>    h := itabhash(inter, typ)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // look twice - once without lock, once with.</span></span>
<span class="line"><span>    // common case will be no lock contention.</span></span>
<span class="line"><span>    var m *itab</span></span>
<span class="line"><span>    var locked int</span></span>
<span class="line"><span>    for locked = 0; locked &lt; 2; locked++ {</span></span>
<span class="line"><span>        if locked != 0 {</span></span>
<span class="line"><span>            lock(&amp;ifaceLock)</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        // 遍历哈希表的一个 slot</span></span>
<span class="line"><span>        for m = (*itab)(atomic.Loadp(unsafe.Pointer(&amp;hash[h]))); m != nil; m = m.link {</span></span>
<span class="line"><span></span></span>
<span class="line"><span>            // 如果在 hash 表中已经找到了 itab（inter 和 typ 指针都相同）</span></span>
<span class="line"><span>            if m.inter == inter &amp;&amp; m._type == typ {</span></span>
<span class="line"><span>                // ……</span></span>
<span class="line"><span>                </span></span>
<span class="line"><span>                if locked != 0 {</span></span>
<span class="line"><span>                    unlock(&amp;ifaceLock)</span></span>
<span class="line"><span>                }</span></span>
<span class="line"><span>                return m</span></span>
<span class="line"><span>            }</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 在 hash 表中没有找到 itab，那么新生成一个 itab</span></span>
<span class="line"><span>    m = (*itab)(persistentalloc(unsafe.Sizeof(itab{})+uintptr(len(inter.mhdr)-1)*sys.PtrSize, 0, &amp;memstats.other_sys))</span></span>
<span class="line"><span>    m.inter = inter</span></span>
<span class="line"><span>    m._type = typ</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    // 添加到全局的 hash 表中</span></span>
<span class="line"><span>    additab(m, true, canfail)</span></span>
<span class="line"><span>    unlock(&amp;ifaceLock)</span></span>
<span class="line"><span>    if m.bad {</span></span>
<span class="line"><span>        return nil</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    return m</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>简单总结一下：getitab 函数会根据 <code>interfacetype</code> 和 <code>_type</code> 去全局的 itab 哈希表中查找，如果能找到，则直接返回；否则，会根据给定的 <code>interfacetype</code> 和 <code>_type</code> 新生成一个 <code>itab</code>，并插入到 itab 哈希表，这样下一次就可以直接拿到 <code>itab</code>。</p><p>这里查找了两次，并且第二次上锁了，这是因为如果第一次没找到，在第二次仍然没有找到相应的 <code>itab</code> 的情况下，需要新生成一个，并且写入哈希表，因此需要加锁。这样，其他协程在查找相同的 <code>itab</code> 并且也没有找到时，第二次查找时，会被挂住，之后，就会查到第一个协程写入哈希表的 <code>itab</code>。</p><p>再来看一下 <code>additab</code> 函数的代码：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>// 检查 _type 是否符合 interface_type 并且创建对应的 itab 结构体 将其放到 hash 表中</span></span>
<span class="line"><span>func additab(m *itab, locked, canfail bool) {</span></span>
<span class="line"><span>    inter := m.inter</span></span>
<span class="line"><span>    typ := m._type</span></span>
<span class="line"><span>    x := typ.uncommon()</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // both inter and typ have method sorted by name,</span></span>
<span class="line"><span>    // and interface names are unique,</span></span>
<span class="line"><span>    // so can iterate over both in lock step;</span></span>
<span class="line"><span>    // the loop is O(ni+nt) not O(ni*nt).</span></span>
<span class="line"><span>    // </span></span>
<span class="line"><span>    // inter 和 typ 的方法都按方法名称进行了排序</span></span>
<span class="line"><span>    // 并且方法名都是唯一的。所以循环的次数是固定的</span></span>
<span class="line"><span>    // 只用循环 O(ni+nt)，而非 O(ni*nt)</span></span>
<span class="line"><span>    ni := len(inter.mhdr)</span></span>
<span class="line"><span>    nt := int(x.mcount)</span></span>
<span class="line"><span>    xmhdr := (*[1 &lt;&lt; 16]method)(add(unsafe.Pointer(x), uintptr(x.moff)))[:nt:nt]</span></span>
<span class="line"><span>    j := 0</span></span>
<span class="line"><span>    for k := 0; k &lt; ni; k++ {</span></span>
<span class="line"><span>        i := &amp;inter.mhdr[k]</span></span>
<span class="line"><span>        itype := inter.typ.typeOff(i.ityp)</span></span>
<span class="line"><span>        name := inter.typ.nameOff(i.name)</span></span>
<span class="line"><span>        iname := name.name()</span></span>
<span class="line"><span>        ipkg := name.pkgPath()</span></span>
<span class="line"><span>        if ipkg == &quot;&quot; {</span></span>
<span class="line"><span>            ipkg = inter.pkgpath.name()</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        for ; j &lt; nt; j++ {</span></span>
<span class="line"><span>            t := &amp;xmhdr[j]</span></span>
<span class="line"><span>            tname := typ.nameOff(t.name)</span></span>
<span class="line"><span>            // 检查方法名字是否一致</span></span>
<span class="line"><span>            if typ.typeOff(t.mtyp) == itype &amp;&amp; tname.name() == iname {</span></span>
<span class="line"><span>                pkgPath := tname.pkgPath()</span></span>
<span class="line"><span>                if pkgPath == &quot;&quot; {</span></span>
<span class="line"><span>                    pkgPath = typ.nameOff(x.pkgpath).name()</span></span>
<span class="line"><span>                }</span></span>
<span class="line"><span>                if tname.isExported() || pkgPath == ipkg {</span></span>
<span class="line"><span>                    if m != nil {</span></span>
<span class="line"><span>                        // 获取函数地址，并加入到itab.fun数组中</span></span>
<span class="line"><span>                        ifn := typ.textOff(t.ifn)</span></span>
<span class="line"><span>                        *(*unsafe.Pointer)(add(unsafe.Pointer(&amp;m.fun[0]), uintptr(k)*sys.PtrSize)) = ifn</span></span>
<span class="line"><span>                    }</span></span>
<span class="line"><span>                    goto nextimethod</span></span>
<span class="line"><span>                }</span></span>
<span class="line"><span>            }</span></span>
<span class="line"><span>        }</span></span>
<span class="line"><span>        // ……</span></span>
<span class="line"><span>        </span></span>
<span class="line"><span>        m.bad = true</span></span>
<span class="line"><span>        break</span></span>
<span class="line"><span>    nextimethod:</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    if !locked {</span></span>
<span class="line"><span>        throw(&quot;invalid itab locking&quot;)</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 计算 hash 值</span></span>
<span class="line"><span>    h := itabhash(inter, typ)</span></span>
<span class="line"><span>    // 加到Hash Slot链表中</span></span>
<span class="line"><span>    m.link = hash[h]</span></span>
<span class="line"><span>    m.inhash = true</span></span>
<span class="line"><span>    atomicstorep(unsafe.Pointer(&amp;hash[h]), unsafe.Pointer(m))</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>additab</code> 会检查 <code>itab</code> 持有的 <code>interfacetype</code> 和 <code>_type</code> 是否符合，就是看 <code>_type</code> 是否完全实现了 <code>interfacetype</code> 的方法，也就是看两者的方法列表重叠的部分就是 <code>interfacetype</code> 所持有的方法列表。注意到其中有一个双层循环，乍一看，循环次数是 <code>ni * nt</code>，但由于两者的函数列表都按照函数名称进行了排序，因此最终只执行了 <code>ni + nt</code> 次，代码里通过一个小技巧来实现：第二层循环并没有从 0 开始计数，而是从上一次遍历到的位置开始。</p><p>求 hash 值的函数比较简单：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func itabhash(inter *interfacetype, typ *_type) uint32 {</span></span>
<span class="line"><span>    h := inter.typ.hash</span></span>
<span class="line"><span>    h += 17 * typ.hash</span></span>
<span class="line"><span>    return h % hashSize</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>hashSize</code> 的值是 1009。</p><p>更一般的，当把实体类型赋值给接口的时候，会调用 <code>conv</code> 系列函数，例如空接口调用 <code>convT2E</code> 系列、非空接口调用 <code>convT2I</code> 系列。这些函数比较相似：</p><blockquote><ol><li>具体类型转空接口时，_type 字段直接复制源类型的 _type；调用 mallocgc 获得一块新内存，把值复制进去，data 再指向这块新内存。</li><li>具体类型转非空接口时，入参 tab 是编译器在编译阶段预先生成好的，新接口 tab 字段直接指向入参 tab 指向的 itab；调用 mallocgc 获得一块新内存，把值复制进去，data 再指向这块新内存。</li><li>而对于接口转接口，itab 调用 getitab 函数获取。只用生成一次，之后直接从 hash 表中获取。</li></ol></blockquote><h1 id="_9-如何用-interface-实现多态" tabindex="-1"><a class="header-anchor" href="#_9-如何用-interface-实现多态"><span>9. 如何用 interface 实现多态</span></a></h1><p><code>Go</code> 语言并没有设计诸如虚函数、纯虚函数、继承、多重继承等概念，但它通过接口却非常优雅地支持了面向对象的特性。</p><p>多态是一种运行期的行为，它有以下几个特点：</p><blockquote><ol><li>一种类型具有多种类型的能力</li><li>允许不同的对象对同一消息做出灵活的反应</li><li>以一种通用的方式对待个使用的对象</li><li>非动态语言必须通过继承和接口的方式来实现</li></ol></blockquote><p>看一个实现了多态的代码例子：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;fmt&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>    qcrao := Student{age: 18}</span></span>
<span class="line"><span>    whatJob(&amp;qcrao)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    growUp(&amp;qcrao)</span></span>
<span class="line"><span>    fmt.Println(qcrao)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    stefno := Programmer{age: 100}</span></span>
<span class="line"><span>    whatJob(stefno)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    growUp(stefno)</span></span>
<span class="line"><span>    fmt.Println(stefno)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func whatJob(p Person) {</span></span>
<span class="line"><span>    p.job()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func growUp(p Person) {</span></span>
<span class="line"><span>    p.growUp()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Person interface {</span></span>
<span class="line"><span>    job()</span></span>
<span class="line"><span>    growUp()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Student struct {</span></span>
<span class="line"><span>    age int</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p Student) job() {</span></span>
<span class="line"><span>    fmt.Println(&quot;I am a student.&quot;)</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p *Student) growUp() {</span></span>
<span class="line"><span>    p.age += 1</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type Programmer struct {</span></span>
<span class="line"><span>    age int</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p Programmer) job() {</span></span>
<span class="line"><span>    fmt.Println(&quot;I am a programmer.&quot;)</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func (p Programmer) growUp() {</span></span>
<span class="line"><span>    // 程序员老得太快 ^_^</span></span>
<span class="line"><span>    p.age += 10</span></span>
<span class="line"><span>    return</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>代码里先定义了 1 个 <code>Person</code> 接口，包含两个函数：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>job()</span></span>
<span class="line"><span>growUp()</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>然后，又定义了 2 个结构体，<code>Student</code> 和 <code>Programmer</code>，同时，类型 <code>*Student</code>、<code>Programmer</code> 实现了 <code>Person</code> 接口定义的两个函数。注意，<code>*Student</code> 类型实现了接口， <code>Student</code> 类型却没有。</p><p>之后，我又定义了函数参数是 <code>Person</code> 接口的两个函数：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func whatJob(p Person)</span></span>
<span class="line"><span>func growUp(p Person)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p><code>main</code> 函数里先生成 <code>Student</code> 和 <code>Programmer</code> 的对象，再将它们分别传入到函数 <code>whatJob</code> 和 <code>growUp</code>。函数中，直接调用接口函数，实际执行的时候是看最终传入的实体类型是什么，调用的是实体类型实现的函数。于是，不同对象针对同一消息就有多种表现，<code>多态</code>就实现了。</p><p>更深入一点来说的话，在函数 <code>whatJob()</code> 或者 <code>growUp()</code> 内部，接口 <code>person</code> 绑定了实体类型 <code>*Student</code> 或者 <code>Programmer</code>。根据前面分析的 <code>iface</code> 源码，这里会直接调用 <code>fun</code> 里保存的函数，类似于： <code>s.tab-&gt;fun[0]</code>，而因为 <code>fun</code> 数组里保存的是实体类型实现的函数，所以当函数传入不同的实体类型时，调用的实际上是不同的函数实现，从而实现多态。</p><p>运行一下代码：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>I am a student.</span></span>
<span class="line"><span>{19}</span></span>
<span class="line"><span>I am a programmer.</span></span>
<span class="line"><span>{100}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_10-go-接口与-c-接口有何异同" tabindex="-1"><a class="header-anchor" href="#_10-go-接口与-c-接口有何异同"><span>10. Go 接口与 C++ 接口有何异同</span></a></h1><p>接口定义了一种规范，描述了类的行为和功能，而不做具体实现。</p><p>C++ 的接口是使用抽象类来实现的，如果类中至少有一个函数被声明为纯虚函数，则这个类就是抽象类。纯虚函数是通过在声明中使用 &quot;= 0&quot; 来指定的。例如：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>class Shape</span></span>
<span class="line"><span>{</span></span>
<span class="line"><span>   public:</span></span>
<span class="line"><span>      // 纯虚函数</span></span>
<span class="line"><span>      virtual double getArea() = 0;</span></span>
<span class="line"><span>   private:</span></span>
<span class="line"><span>      string name;      // 名称</span></span>
<span class="line"><span>};</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>设计抽象类的目的，是为了给其他类提供一个可以继承的适当的基类。抽象类不能被用于实例化对象，它只能作为接口使用。</p><p>派生类需要明确地声明它继承自基类，并且需要实现基类中所有的纯虚函数。</p><p>C++ 定义接口的方式称为“侵入式”，而 Go 采用的是 “非侵入式”，不需要显式声明，只需要实现接口定义的函数，编译器自动会识别。</p><p>C++ 和 Go 在定义接口方式上的不同，也导致了底层实现上的不同。C++ 通过虚函数表来实现基类调用派生类的函数；而 Go 通过 <code>itab</code> 中的 <code>fun</code> 字段来实现接口变量调用实体类型的函数。C++ 中的虚函数表是在编译期生成的；而 Go 的 <code>itab</code> 中的 <code>fun</code> 字段是在运行期间动态生成的。原因在于，Go 中实体类型可能会无意中实现 N 多接口，很多接口并不是本来需要的，所以不能为类型实现的所有接口都生成一个 <code>itab</code>， 这也是“非侵入式”带来的影响；这在 C++ 中是不存在的，因为派生需要显示声明它继承自哪个基类。</p><figure><img src="https://user-images.githubusercontent.com/7698088/51420568-305b1800-1bce-11e9-962a-52b12be7eb2e.png" alt="QR" tabindex="0" loading="lazy"><figcaption>QR</figcaption></figure><h1 id="参考资料" tabindex="-1"><a class="header-anchor" href="#参考资料"><span>参考资料</span></a></h1><p>【包含反射、接口等源码分析】<a href="https://zhuanlan.zhihu.com/p/27055513" target="_blank" rel="noopener noreferrer">https://zhuanlan.zhihu.com/p/27055513</a></p><p>【虚函数表和C++的区别】<a href="https://mp.weixin.qq.com/s/jU9HeR1tOyh-ME5iEYM5-Q" target="_blank" rel="noopener noreferrer">https://mp.weixin.qq.com/s/jU9HeR1tOyh-ME5iEYM5-Q</a></p><p>【具体类型向接口赋值】<a href="https://tiancaiamao.gitbooks.io/go-internals/content/zh/07.2.html" target="_blank" rel="noopener noreferrer">https://tiancaiamao.gitbooks.io/go-internals/content/zh/07.2.html</a></p><p>【Go夜读群的讨论】<a href="https://github.com/developer-learning/reading-go/blob/master/content/discuss/2018-08-30-understanding-go-interfaces.md" target="_blank" rel="noopener noreferrer">https://github.com/developer-learning/reading-go/blob/master/content/discuss/2018-08-30-understanding-go-interfaces.md</a></p><p>【廖雪峰 鸭子类型】<a href="https://www.liaoxuefeng.com/wiki/0014316089557264a6b348958f449949df42a6d3a2e542c000/001431865288798deef438d865e4c2985acff7e9fad15e3000" target="_blank" rel="noopener noreferrer">https://www.liaoxuefeng.com/wiki/0014316089557264a6b348958f449949df42a6d3a2e542c000/001431865288798deef438d865e4c2985acff7e9fad15e3000</a></p><p>【值类型和指针类型，iface源码】<a href="https://www.jianshu.com/p/5f8ecbe4f6af" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/5f8ecbe4f6af</a></p><p>【总体说明itab的生成方式、作用】<a href="http://www.codeceo.com/article/go-interface.html" target="_blank" rel="noopener noreferrer">http://www.codeceo.com/article/go-interface.html</a></p><p>【conv系列函数的作用】<a href="https://blog.csdn.net/zhonglinzhang/article/details/85772336" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/zhonglinzhang/article/details/85772336</a></p><p>【convI2I itab作用】<a href="https://www.jianshu.com/p/a5e99b1d50b1" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/a5e99b1d50b1</a></p><p>【interface 源码解读 很不错 包含反射】<a href="http://wudaijun.com/2018/01/go-interface-implement/" target="_blank" rel="noopener noreferrer">http://wudaijun.com/2018/01/go-interface-implement/</a></p><p>【what why how思路来写interface】<a href="http://legendtkl.com/2017/06/12/understanding-golang-interface/" target="_blank" rel="noopener noreferrer">http://legendtkl.com/2017/06/12/understanding-golang-interface/</a></p><p>【有汇编分析，不错】<a href="http://legendtkl.com/2017/07/01/golang-interface-implement/" target="_blank" rel="noopener noreferrer">http://legendtkl.com/2017/07/01/golang-interface-implement/</a></p><p>【第一幅图可以参考 gdb调试】<a href="https://www.do1618.com/archives/797/golang-interface%E5%88%86%E6%9E%90/" target="_blank" rel="noopener noreferrer">https://www.do1618.com/archives/797/golang-interface%E5%88%86%E6%9E%90/</a></p><p>【类型转换和断言】<a href="https://my.oschina.net/goal/blog/194308" target="_blank" rel="noopener noreferrer">https://my.oschina.net/goal/blog/194308</a></p><p>【interface 和 nil】<a href="https://my.oschina.net/goal/blog/194233" target="_blank" rel="noopener noreferrer">https://my.oschina.net/goal/blog/194233</a></p><p>【函数和方法】<a href="https://www.jianshu.com/p/5376e15966b3" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/5376e15966b3</a></p><p>【反射】<a href="https://flycode.co/archives/267357" target="_blank" rel="noopener noreferrer">https://flycode.co/archives/267357</a></p><p>【接口特点列表】<a href="https://segmentfault.com/a/1190000011451232" target="_blank" rel="noopener noreferrer">https://segmentfault.com/a/1190000011451232</a></p><p>【interface 全面介绍，包含C++对比】<a href="https://www.jianshu.com/p/b38b1719636e" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/b38b1719636e</a></p><p>【Go四十二章经 interface】<a href="https://github.com/ffhelicopter/Go42/blob/master/content/42_19_interface.md" target="_blank" rel="noopener noreferrer">https://github.com/ffhelicopter/Go42/blob/master/content/42_19_interface.md</a></p><p>【对Go接口的反驳，有说到接口的定义】<a href="http://blog.zhaojie.me/2013/04/why-i-dont-like-go-style-interface-or-structural-typing.html" target="_blank" rel="noopener noreferrer">http://blog.zhaojie.me/2013/04/why-i-dont-like-go-style-interface-or-structural-typing.html</a></p><p>【gopher 接口】<a href="http://fuxiaohei.me/2017/4/22/gopherchina-2017.html" target="_blank" rel="noopener noreferrer">http://fuxiaohei.me/2017/4/22/gopherchina-2017.html</a></p><p>【译文 还不错】<a href="https://mp.weixin.qq.com/s/tBg8D1qXHqBr3r7oRt6iGA" target="_blank" rel="noopener noreferrer">https://mp.weixin.qq.com/s/tBg8D1qXHqBr3r7oRt6iGA</a></p><p>【infoQ 文章】<a href="https://www.infoq.cn/article/go-interface-talk" target="_blank" rel="noopener noreferrer">https://www.infoq.cn/article/go-interface-talk</a></p><p>【Go接口详解】<a href="https://zhuanlan.zhihu.com/p/27055513" target="_blank" rel="noopener noreferrer">https://zhuanlan.zhihu.com/p/27055513</a></p><p>【Go interface】<a href="https://sanyuesha.com/2017/07/22/how-to-understand-go-interface/" target="_blank" rel="noopener noreferrer">https://sanyuesha.com/2017/07/22/how-to-understand-go-interface/</a></p><p>【getitab源码说明】<a href="https://www.twblogs.net/a/5c245d59bd9eee16b3db561d" target="_blank" rel="noopener noreferrer">https://www.twblogs.net/a/5c245d59bd9eee16b3db561d</a></p><p>【浅显易懂】<a href="https://yami.io/golang-interface/" target="_blank" rel="noopener noreferrer">https://yami.io/golang-interface/</a></p><p>【golang io包的妙用】<a href="https://www.jianshu.com/p/8c33f7c84509" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/8c33f7c84509</a></p><p>【探索C++与Go的接口底层实现】<a href="https://www.jianshu.com/p/073c09a05da7" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/073c09a05da7</a><br><a href="https://github.com/teh-cmc/go-internals/blob/master/chapter2_interfaces/README.md" target="_blank" rel="noopener noreferrer">https://github.com/teh-cmc/go-internals/blob/master/chapter2_interfaces/README.md</a></p><p>【汇编层面】<a href="http://xargin.com/go-and-interface/" target="_blank" rel="noopener noreferrer">http://xargin.com/go-and-interface/</a></p><p>【有图】<a href="https://i6448038.github.io/2018/10/01/Golang-interface/" target="_blank" rel="noopener noreferrer">https://i6448038.github.io/2018/10/01/Golang-interface/</a></p><p>【图】<a href="https://mp.weixin.qq.com/s/px9BRQrTCLX6BbvXJbysCA" target="_blank" rel="noopener noreferrer">https://mp.weixin.qq.com/s/px9BRQrTCLX6BbvXJbysCA</a></p><p>【英文开源书】<a href="https://github.com/cch123/go-internals/blob/master/chapter2_interfaces/README.md" target="_blank" rel="noopener noreferrer">https://github.com/cch123/go-internals/blob/master/chapter2_interfaces/README.md</a></p><p>【曹大的翻译】<a href="http://xargin.com/go-and-interface/" target="_blank" rel="noopener noreferrer">http://xargin.com/go-and-interface/</a></p><hr><p>有疑问加站长微信联系（非本文作者）</p><figure><img src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>`,337)]))}const t=s(l,[["render",p],["__file","深度解密Go语言之关于-interface-的-10-个问题.html.vue"]]),o=JSON.parse('{"path":"/golang/%E5%8E%9F%E7%90%86/theory/%E6%B7%B1%E5%BA%A6%E8%A7%A3%E5%AF%86Go%E8%AF%AD%E8%A8%80%E4%B9%8B%E5%85%B3%E4%BA%8E-interface-%E7%9A%84-10-%E4%B8%AA%E9%97%AE%E9%A2%98.html","title":"深度解密Go语言之关于 interface 的 10 个问题","lang":"zh-CN","frontmatter":{"title":"深度解密Go语言之关于 interface 的 10 个问题","source_url":"https://studygolang.com/articles/19997","category":"Go原理教程","description":"这次文章依然很长，基本上涵盖了 interface 的方方面面，有例子，有源码分析，有汇编分析，前前后后写了 20 多天。洋洋洒洒，长篇大论，依然有些东西没有涉及到，比如文章里没有写到反射，当然，后面会单独写一篇关于反射的文章，这是后话。 还是希望看你在看完文章后能有所收获，有任何问题或意见建议，欢迎在文章后面留言。 这篇文章的架构比较简单，直接抛出 ...","head":[["meta",{"property":"og:url","content":"https://Cospk.github.io/vuepress-app/golang/%E5%8E%9F%E7%90%86/theory/%E6%B7%B1%E5%BA%A6%E8%A7%A3%E5%AF%86Go%E8%AF%AD%E8%A8%80%E4%B9%8B%E5%85%B3%E4%BA%8E-interface-%E7%9A%84-10-%E4%B8%AA%E9%97%AE%E9%A2%98.html"}],["meta",{"property":"og:site_name","content":"Golang全栈指南"}],["meta",{"property":"og:title","content":"深度解密Go语言之关于 interface 的 10 个问题"}],["meta",{"property":"og:description","content":"这次文章依然很长，基本上涵盖了 interface 的方方面面，有例子，有源码分析，有汇编分析，前前后后写了 20 多天。洋洋洒洒，长篇大论，依然有些东西没有涉及到，比如文章里没有写到反射，当然，后面会单独写一篇关于反射的文章，这是后话。 还是希望看你在看完文章后能有所收获，有任何问题或意见建议，欢迎在文章后面留言。 这篇文章的架构比较简单，直接抛出 ..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://user-images.githubusercontent.com/7698088/56564826-82527600-65e1-11e9-956d-d98a212bc863.png"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-08-27T12:02:38.000Z"}],["meta",{"property":"article:modified_time","content":"2025-08-27T12:02:38.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"深度解密Go语言之关于 interface 的 10 个问题\\",\\"image\\":[\\"https://user-images.githubusercontent.com/7698088/56564826-82527600-65e1-11e9-956d-d98a212bc863.png\\",\\"https://user-images.githubusercontent.com/7698088/56565105-318f4d00-65e2-11e9-96bd-4b2e192791dc.png\\",\\"https://user-images.githubusercontent.com/7698088/51420568-305b1800-1bce-11e9-962a-52b12be7eb2e.png\\",\\"https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280\\"],\\"dateModified\\":\\"2025-08-27T12:02:38.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Cospk\\",\\"url\\":\\"https://savvygo.cn\\"}]}"]]},"headers":[{"level":2,"title":"方法","slug":"方法","link":"#方法","children":[]},{"level":2,"title":"值接收者和指针接收者","slug":"值接收者和指针接收者","link":"#值接收者和指针接收者","children":[]},{"level":2,"title":"两者分别在何时使用","slug":"两者分别在何时使用","link":"#两者分别在何时使用","children":[]},{"level":2,"title":"类型转换","slug":"类型转换","link":"#类型转换","children":[]},{"level":2,"title":"断言","slug":"断言","link":"#断言","children":[]}],"git":{"createdTime":1756202807000,"updatedTime":1756296158000,"contributors":[{"name":"shiwei","username":"shiwei","email":"xie@gmail.com","commits":2,"url":"https://github.com/shiwei"}]},"readingTime":{"minutes":36.4,"words":10919},"filePathRelative":"golang/原理/theory/深度解密Go语言之关于-interface-的-10-个问题.md","localizedDate":"2025年8月26日","autoDesc":true,"excerpt":"<p>这次文章依然很长，基本上涵盖了 <code>interface</code> 的方方面面，有例子，有源码分析，有汇编分析，前前后后写了 20 多天。洋洋洒洒，长篇大论，依然有些东西没有涉及到，比如文章里没有写到<code>反射</code>，当然，后面会单独写一篇关于<code>反射</code>的文章，这是后话。</p>\\n<p>还是希望看你在看完文章后能有所收获，有任何问题或意见建议，欢迎在文章后面留言。</p>\\n<p>这篇文章的架构比较简单，直接抛出 10 个问题，一一解答。</p>\\n<h1>1. Go 语言与鸭子类型的关系</h1>\\n<p>先直接来看维基百科里的定义：</p>\\n<blockquote>\\n<p>If it looks like a duck, swims like a duck, and quacks like a duck, then it probably is a duck.</p>\\n</blockquote>"}');export{t as comp,o as data};
