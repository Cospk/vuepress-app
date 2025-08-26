---
title: Go语言反射规则 - The Laws of Reflection
source_url: 'https://studygolang.com/articles/5326'
category: Go原理教程
---


						<div><h1 id="go语言反射规则-the-laws-of-reflection">Go语言反射规则 - The Laws of Reflection</h1>

<p>原文地址：<a href="http://blog.golang.org/laws-of-reflection">http://blog.golang.org/laws-of-reflection</a></p>



<h2 id="介绍">介绍</h2>

<p>反射在计算机的概念里是指一段程序审查自身结构的能力，主要通过类型进行审查。它是元编程的一种形式，同样也是引起混乱的重大来源。</p>

<p>在这篇文章里我们试图阐明Go语言中的反射是如何工作的。每种语言的反射模型是不同的(许多语言不支持反射），然而本文只与Go有关，所以我们接下来所提到的“反射”都是指Go语言中的反射。</p>



<h2 id="类型与接口">类型与接口</h2>

<p>由于反射是建立在类型系统(type system)上的，所以我们先来复习一下Go语言中的类型。</p>

<p>Go是一门静态类型的语言。每个变量都有一个静态类型，类型在编译的时后被知晓并确定了下来。</p>

<pre><code class="language-go">
type MyInt int

var i int
var j MyInt
</code></pre>

<p>变量<code>i</code>的类型是<code>int</code>，变量<code>j</code>的类型是<code>MyInt</code>。虽然它们有着相同的基本类型，但静态类型却不一样，在没有类型转换的情况下，它们之间无法互相赋值。</p>

<p>接口是一个重要的类型，它意味着一个确定的的方法集合。一个接口变量可以存储任何实现了接口的方法的具体值(除了接口本身)。一个著名的例子就是<code>io.Reader</code>和<code>io.Writer</code>：</p>


<pre><code class="language-go">
// Reader is the interface that wraps the basic Read method.
type Reader interface {
    Read(p []byte) (n int, err error)
}

// Writer is the interface that wraps the basic Write method.
type Writer interface {
    Write(p []byte) (n int, err error)
}
</code></pre>

<p>如果一个类型声明实现了<code>Reader</code>（或<code>Writer</code>）方法，那么它便实现了<code>io.Reader</code>（或<code>io.Writer</code>）。这意味着一个<code>io.Reader</code>的变量可以持有任何一个实现了<code>Read</code>方法的的类型的值。</p>

<pre><code class="language-go">
var r io.Reader
r = os.Stdin
r = bufio.NewReader(r)
r = new(bytes.Buffer)
// and so on
</code></pre>

<p>必须要弄清楚的一点是，不管变量<code>r</code>中的具体值是什么，<code>r</code>的类型永远是<code>io.Reader</code>：Go是静态类型的，r的静态类型就是<code>io.Reader</code>。</p>

<p>在接口类型中有一个极为重要的例子——空接口：</p>

<pre><code class="language-go">
interface{}
</code></pre>

<p>它表示了一个空的方法集，一切值都可以满足它，因为它们都有零值或方法。</p>

<p>有人说Go的接口是动态类型，这是错误的。它们都是静态类型：虽然在运行时中，接口变量存储的值也许会变，但接口变量的类型是永不会变的。我们必须精确地了解这些，因为反射与接口是密切相关的。</p>



<h2 id="深入接口">深入接口</h2>

<p>Russ Cox在博客里写了一篇<a href="http://research.swtch.com/2009/12/go-data-structures-interfaces.html">详细的文章</a>，讲述了Go中的接口变量的意义。我们不需要列出全文，只需在这里给出一点点总结。</p>

<blockquote>
  <p>一个接口类型的变量里有两样东西：变量的的具体值和这个值的类型描述。更准确地来讲，这个实现了接口的值是一个基础的具体数据项，而类型描述了数据项里的所有类型。</p>
</blockquote>

<p>如下所示：</p>

<pre><code class="language-go">
var r io.Reader
tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
if err != nil {
    return nil, err
}
r = tty
</code></pre>

<p>在此之后，<code>r</code>包含了<code>(value, type)</code>组合，<code>(tty,  *os.File)</code>。值得注意的是，<code>*os.File</code>实现了<code>Read</code>以外的方法；虽然接口值只提供了<code>Read</code>方法，但它内置了所有的类型信息，这就是为什么我们可以么做：</p>

<pre><code class="language-go">
var w io.Writer
w = r.(io.Writer)
</code></pre>

<p>上面的所展示表达式是一个类型断言，它断言了<code>r</code>中所包含的数据项实现了<code>io.Writer</code>，所以我们可以用它对<code>w</code>赋值。在此之后，<code>w</code>将与<code>r</code>一样，包含<code>(tty, *os.File)</code>组合。接口的静态类型决定了接口变量的哪些方法会被调用，即便也许它所含的具体值有一个更大的方法集。</p>

<p>接下来，我们可以这么做：</p>

<pre><code class="language-go">
var empty interface{}
empty = w
</code></pre>

<p>我们的空接口变量将会在此包含同样的“组合”：<code>(tty, *os.File)</code>。这非常方便：一个空接口可以包含任何值和它的类型信息，我们可以在任何需要的时候了解它。</p>

<p>（在这里我们无需类型断言是因为<code>w</code>已经满足了空接口。在前面的例子中我们将一个值从一个<code>Reader</code>传到了<code>Writer</code>，因为<code>Writer</code>不是<code>Reader</code>的子集，所以我们需要使用类型断言。）</p>

<p>这里有一个重要细节：接口里“组合”的格式永远是（值，实体类型），而不是（值，接口类型）。接口不会包含接口值。</p>

<p>好了，现在让我们进入反射部分。</p>



<h2 id="反射规则一-从接口到反射对象">反射规则（一） - 从接口到反射对象</h2>

<p>在基础上，反射是一个审查在接口变量中的<code>(type, value)</code>组合的机制。现在，我们需要了解<a href="https://gowalker.org/reflect">reflect包</a>中的两个类型：<code>Type</code>和<code>Value</code>，可以让我们访问接口变量的内容。<code>reflect.TypeOf</code>函数和<code>reflect.ValueOf</code>函数返回的<code>reflect.Type</code>和<code>reflect.Value</code>可以拼凑出一个接口值。（当然，从<code>reflect.Value</code>可以很轻易地得到<code>reflect.Type</code>，但现在还是让我们把<code>Value</code>和<code>Type</code>的概念分开来看。）</p>

<p>我们从<code>TypeOf</code>开始：</p>


<pre><code class="language-go">
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x float64 = 3.4
    fmt.Println("type:", reflect.TypeOf(x))
}
</code></pre>

<p>这个程序打印了：</p>


<pre><code class="language-go">
type: float64
</code></pre>

<p>看了这段代码你也许会想“接口在哪？”，这段程序里只有<code>float64</code>的变量<code>x</code>，并没有接口变量传进<code>reflect.TypeOf</code>。其实它是在这儿：在<a href="https://gowalker.org/reflect/#TypeOf">godoc reports</a>的<code>reflect.TypeOf</code>的声明中包含了一个空接口：</p>

<pre><code class="language-go">
// TypeOf returns the reflection Type of the value in the interface{}.
func TypeOf(i interface{}) Type
</code></pre>

<p>当我们调用<code>reflect.TypeOf(x)</code>时，作为参数传入的<code>x</code>在此之前已被存进了一个空接口。而<code>reflect.TypeOf</code>解包了空接口，恢复了它所含的类型信息。</p>

<p>相对的，<code>reflect.ValueOf</code>函数则是恢复了值（从这里开始我们将修改例子并且只关注于可执行代码）：</p>


<pre><code class="language-go">
var x float64 = 3.4
fmt.Println("value:", reflect.ValueOf(x))
</code></pre>

<p>打印：</p>


<pre>
value: <float64 Value>
</pre>

<p><code>reflect.Type</code>和<code>reflect.Value</code>拥有许多方法让我们可以审查和操作接口变量。一个重要的例子就是<code>Value</code>有一个<code>Type</code>方法返回<code>reflect.Value</code>的<code>Type</code>。另一个例子就是，<code>Type</code>和<code>Value</code>都有<code>Kind</code>方法，它返回一个常量，这个常量表示了被存储的元素的排列顺序：<code>Uint, Float64, Slice</code>等等。并且，<code>Value</code>的一系列方法（如<code>Int</code>或<code>Float</code>），能让我们获取被存储的值（如<code>int64</code>或<code>float64</code>）:</p>


<pre><code class="language-go">
var x float64 = 3.4
v := reflect.ValueOf(x)
fmt.Println("type:", v.Type())
fmt.Println("kind is float64:", v.Kind() == reflect.Float64)
fmt.Println("value:", v.Float())
</code></pre>

<p>打印：</p>


<pre><code>
type: float64
kind is float64: true
value: 3.4
</code></pre>

<p>有一些方法如<code>SetInt</code>和<code>SetFloat</code>涉及到了“可设置”(settability)的概念，这是反射规则的第三条，我们将在后面讨论。</p>

<p>反射库有两个特性是需要指出的。其一，为了保持API的简洁，<code>Value</code>的Getter和Setter方法是用最大的类型去操作数据：例如让所有的整型都使用<code>int64</code>表示。所以，<code>Value</code>的<code>Int</code>方法返回一个<code>int64</code>的值，<code>SetInt</code>需要传入<code>int64</code>参数；将数值转换成它的实际类型在某些时候是有必要的：</p>

<pre><code class="language-go">
var x uint8 = 'x'
v := reflect.ValueOf(x)
fmt.Println("type:", v.Type())                            // uint8.
fmt.Println("kind is uint8: ", v.Kind() == reflect.Uint8) // true.
x = uint8(v.Uint())
</code></pre>

<p>其二，反射对象的<code>Kind</code>方法描述的是基础类型，而不是静态类型。如果一个反射对象包含了用户定义类型的值，如下：</p>

<pre><code class="language-go">
type MyInt int
var x MyInt = 7
v := reflect.ValueOf(x)
</code></pre>

<p>虽然<code>x</code>的静态类型是<code>MyInt</code>而非<code>int</code>，但<code>v</code>的<code>Kind</code>依然是<code>reflect.Int</code>。虽然<code>Type</code>可以区分开<code>int</code>和<code>MyInt</code>，但<code>Kind</code>无法做到。</p>



<h2 id="反射规则二-从反射对象到接口">反射规则（二） - 从反射对象到接口</h2>

<p>如同物理学中的反射一样，Go语言的反射也是可逆的。</p>

<p>通过一个<code>reflect.Value</code>我们可以使用<code>Interface</code>方法恢复一个接口；这个方法将类型和值信息打包成一个接口并将其返回：</p>



<pre><code class="language-go">
// Interface returns v's value as an interface{}.
func (v Value) Interface() interface{}
</code></pre>

<p>于是我们得到一个结果：</p>


<pre><code class="language-go">
y := v.Interface().(float64) // y will have type float64.
fmt.Println(y)
</code></pre>

<p>以上代码会打印由反射对象<code>v</code>表现出的<code>float64</code>值。</p>

<p>然而，我们还可以做得更好。<code>fmt.Println</code>和<code>fmt.Printf</code>的参数都是通过interface{}传入的，传入之后由<code>fmt</code>的私��方法解包（就像我们前面的例子所做的一样）。正是因为<code>fmt</code>把<code>Interface</code>方法的返回结果传递给了格式化打印事务（formatted print routine），所以程序才能正确打印出<code>reflect.Value</code>的内容：</p>

<pre><code class="language-go">
fmt.Println(v.Interface())
</code></pre>

<p>（为什么不是<code>fmt.Println(v)</code>？因为v是一个<code>reflect.Value</code>，而我们想要的是它的具体值） <br/>
由于值的类型是<code>float64</code>，我们可以用浮点格式化打印它：</p>


<pre><code class="language-go">
fmt.Printf("value is %7.1e\n", v.Interface())
</code></pre>

<p>并得出结果：</p>



<pre><code>3.4e+00</code></pre>

<p>在这里我们无需对<code>v.Interface()</code>做类型断言，这个空接口值包含了具体的值的类型信息，<code>Printf</code>会恢复它。</p>

<p>简而言之，<code>Interface</code>方法就是<code>ValueOf</code>函数的逆，除非<code>ValueOf</code>所得结果的类型是<code>interface{}</code></p>

<p>重申一遍：反射从接口中来，经过反射对象，又回到了接口中去。 <br/>
(Reflection goes from interface values to reflection objects and back again.)</p>



<h2 id="反射规则三-若要修改反射对象值必须可设置">反射规则（三） - 若要修改反射对象，值必须可设置</h2>

<p>第三条规则是最微妙同时也是最混乱的，但如果我们从它的基本原理开始，那么一切都不在话下。</p>

<p>以下的代码虽然无法运行，但值得学习：</p>

<pre><code class="language-go">
var x float64 = 3.4
v := reflect.ValueOf(x)
v.SetFloat(7.1) // Error: will panic.
</code></pre>

<p>如果你运行这些代码，它会panic这些神秘信息：</p>



<pre><code>
panic: reflect.Value.SetFloat using unaddressable value
</code></pre>

<p>问题在于<code>7.1</code>是不可寻址的，这意味着<code>v</code>就会变得不可设置。“可设置”(settability)是<code>reflect.Value</code>的特性之一，但并非所有的<code>Value</code>都是可设置的。</p>

<p><code>Value</code>的<code>CanSet</code>方法返回一个布尔值，表示这个<code>Value</code>是否可设置：</p>


<pre><code class="language-go">
var x float64 = 3.4
v := reflect.ValueOf(x)
fmt.Println("settability of v:", v.CanSet())</code></pre>

<p>打印：</p>


<pre><code>settability of v: false</code></pre>

<p>对一个不可设置的<code>Value</code>调用的<code>Set</code>方法是错误的。那么，什么是“可设置”？</p>

<p>“可设置”和“可寻址”(addressable)有些类似，但更严格。一个反射对象可以对创建它的实际内容进行修改，这就是“可设置”。反射对象的“可设置性”由它是否拥有原项目(orginal item)所决定。</p>

<p>当我们这样做的时候：</p>

<pre><code class="language-go">
var x float64 = 3.4
v := reflect.ValueOf(x)
</code></pre>

<p>我们传递了一份<code>x</code>的拷贝到<code>reflect.ValueOf</code>中，所以传到<code>reflect.ValueOf</code>的接口值不是由<code>x</code>，而是由<code>x</code>的拷贝创建的。因此，如果下列语句</p>


<pre><code class="language-go">
v.SetFloat(7.1)
</code></pre>

<p>被允许执行成功，它将不会更新<code>x</code>，即使看上去<code>v</code>是由<code>x</code>创建的。相反，它更新的是存于反射值中的<code>x</code>拷贝，<code>x</code>本身将不会受到影响。这是混乱且毫无用处的，所以这么做是非法的。“可设置”作为反射的特性之一就是为了预防这样的情况。</p>

<p>这虽然看起来怪异，但事实恰好相反。它实际上是一个我们很熟悉的情形，只是披上了一件不寻常的外衣。思考一下<code>x</code>是如何传递到一个函数里的：</p>


<pre><code class="language-go">
f(x)
</code></pre>

<p>我们不会指望<code>f</code>能够修改<code>x</code>因为我们传递的是一个<code>x</code>的拷贝，而非<code>x</code>。如果我们想让<code>f</code>直接修改<code>x</code>我们必须给我们的函数传入<code>x</code>的地址（即是<code>x</code>的指针）：</p>

<pre><code class="language-go">
f(&x)
</code></pre>

<p>这是直接且熟悉的，反射的工作方式也与此相同。如果我们想用反射修改<code>x</code>，我们必须把值的指针传给反射库。</p>

<p>开始吧。首先我们像刚才一样初始化<code>x</code>，然后创建一个指向它的反射值，命名为<code>p</code>：</p>

<pre><code class="language-go">
var x float64 = 3.4
p := reflect.ValueOf(&x) // Note: take the address of x.
fmt.Println("type of p:", p.Type())
fmt.Println("settability of p:", p.CanSet())
</code></pre>


<p>目前的输出是：</p>



<pre><code>
type of p: *float64
settability of p: false
</code></pre>

<p>反射对象<code>p</code>不是可设置的，但我们想要设置的不是它，而是<code>*p</code>。 <br/>
为了知道<code>p</code>指向了哪，我们调用<code>Value</code>的<code>Elem</code>方法，它通过指针定向并把结果保存在了一个<code>Value</code>中，命名为<code>v</code>：</p>


<pre><code class="language-go">
v := p.Elem()
fmt.Println("settability of v:", v.CanSet())
</code></pre>

<p>现在的<code>v</code>是一个可设置的反射对象，如下所示：</p>



<pre><code>settability of v: true</code></pre>

<p>因为它表示<code>x</code>，我们终于可以用<code>v.SetFloat</code>来修改<code>x</code>的值了：</p>

<pre><code class="language-go">
v.SetFloat(7.1)
fmt.Println(v.Interface())
fmt.Println(x)
</code></pre>

<p>正如意料中的一样：</p>



<pre><code>
7.1
7.1
</code></pre>

<p>反射可能很难理解，但它所做的事正是编程语言所做的，尽管通过反射类型和值可以掩饰正在发生的事。 <br/>
记住，用反射修改数据的时候需要传入它的指针哦。</p>



<h2 id="结构体">结构体</h2>

<p>在前面的例子中，<code>v</code>并不是指针本身，它只是来源于此。 <br/>
我们一般在使用反射去修改结构体字段的时候会用到。只要我们有结构体的指针，我们就可以修改它的字段。</p>

<p>这里有一个解析结构体变量<code>t</code>的例子。我们用结构体的地址创建了反射变量，待会儿我们要修改它。然后我们对它的类型设置了<code>typeOfT</code>，并用调用简单的方法迭代字段（详情请见<a href="https://gowalker.org/reflect">reflect包</a>）。 <br/>
注意，我们从结构体的类型中提取了字段的名字，但每个字段本身是正常的<code>reflect.Value</code>对象。</p>



<pre><code class="language-go">
type T struct {
    A int
    B string
}
t := T{23, "skidoo"}
s := reflect.ValueOf(&t).Elem()
typeOfT := s.Type()
for i := 0; i < s.NumField(); i++ {
    f := s.Field(i)
    fmt.Printf("%d: %s %s = %v\n", i,
        typeOfT.Field(i).Name, f.Type(), f.Interface())
}
</code></pre>

<p>程序输出：</p>



<pre><code>
0: A int = 23
1: B string = skidoo
</code></pre>

<p>关于可设置性还有一点需要介绍：<code>T</code>的字段名是大写（字段可导出/公共字段）的原因在于，结构体中只有可导出的的字段是“可设置”的。</p>

<p>因为<code>s</code>包含了一个可设置的反射对象，我们可以修改结构体字段：</p>


<pre><code class="language-go">
s.Field(0).SetInt(77)
s.Field(1).SetString("Sunset Strip")
fmt.Println("t is now", t)
</code></pre>

<p>结果：</p>


<pre><code>
t is now {77 Sunset Strip}
</code></pre>

<p>如果我们修改了程序让<code>s</code>由<code>t</code>（而不是<code>&t</code>）创建，程序就会在调用<code>SetInt</code>和<code>SetString</code>的地方失败，因为<code>t</code>的字段是不可设置的。</p>



<h2 id="结论">结论</h2>

<p>再次列出反射法则： <br/>
* 反射从接口值到反射对象中(Reflection goes from interface value to reflection object.) <br/>
* 反射从反射对象到接口值中(Reflection goes from reflection object to interface value.) <br/>
* 要修改反射对象，值必须是“可设置”的(To modify a reflection object, the value must be settable.)</p>

<p>一旦你了解反射法则，Go就会变得更加得心应手（虽然它仍旧微妙）。这是一个强大的工具，除非在绝对必要的时候，我们应该谨慎并避免使用它。</p>

<p>我们还有非常多的反射知识没有提及——chan的发送和接收，内存分配，使用slice和map，调用方法和函数——但是这篇文章已足够长了。我们将在以后的文章中涉及这些。</p>

<p>译文地址：<a href="https://github.com/cuebyte/The-Laws-of-Reflection/blob/master/README.md">https://github.com/cuebyte/The-Laws-of-Reflection/blob/master/README.md</a> <br/>
<em>By Rob Pike</em></p>