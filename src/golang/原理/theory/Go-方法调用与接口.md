---
title: Go 方法调用与接口
source_url: 'https://studygolang.com/articles/11992'
category: Go原理教程
---


						<div class="post-body" itemprop="articleBody">

<p>在比较C++和Go的时候，通常会说到Go不支持继承和多态，但通过组合和接口实现了类似的语言特性。总结一下Go不支持的原因：(1) 首先struct是值类型，赋值和传参都会复制全部内容。struct的内存布局跟C几乎一致，没有任何附加的object信息，比如指向虚函数表的指针。(2)其次Go不支持隐式的类型转换，因此用基类的指针指向子类会编译错误。</p>
<blockquote>
<p><strong>Go程序抽象的基本原则</strong><font color="#1E90FF">依赖于接口而不是实现，优先使用组合而不是继承。</font></p>
</blockquote>
<h2 id="struct的方法调用"><a href="#struct的方法调用" class="headerlink" title="struct的方法调用"></a>struct的方法调用</h2><p>对象的方法调用相当于普通函数调用的语法糖。Value方法的调用<code>m.Value()</code>等价于<code>func Value(m M)</code> 即把<strong>对象实例m</strong>作为函数调用的第一个实参压栈，这时m称为<strong>receiver</strong>。通过实例或实例的指针其实都可以调用所有方法，区别是复制给函数的receiver不同。</p>
<blockquote>
<p>通过实例m调用Value时，以及通过指针p调用Value时，receiver是m和*p，即复制的是m实例本身。因此receiver是m实例的副本，他们地址不同。通过实例m调用Pointer时，以及通过指针p调用Pointer时，复制的是都是&m和p，即复制的都是指向m的指针，返回的都是m实例的地址。</p>
</blockquote>

<pre><code class="language-go">
type M struct {
    a int
}
func (m M) Value() string {return fmt.Sprintf("Value: %p\n", &m)}
func (m *M) Pointer() string {return fmt.Sprintf("Pointer: %p\n", m)}
var m M
p := &m      // p is address of m 0x2101ef018
m.Value()    // value(m) return 0x2101ef028
m.Pointer()  // value(&m) return 0x2101ef018
p.Value()    // value(*p) return 0x2101ef030
p.Pointer()  // value(p) return 0x2101ef018
</code></pre>

<font color="#1E90FF">如果想在方法中修改对象的值只能用pointer receiver，对象较大时避免拷贝也要用pointer receiver。</font>

<h3 id="方法集理解"><a href="#方法集理解" class="headerlink" title="方法集理解"></a>方法集理解</h3><p>上面例子中通过实例m和p都可以调用全部方法，由编译器自动转换。在很多go的语法书里有方法集的概念。类型T方法集包含全部receiver T方法，类型*T包含全部receiver T和*T的方法。这句话一直不理解，既然通过实例和指针可以访问T和*T的所有方法，那方法集的意义是什么。</p>
<blockquote>
<p>定义在M类型的方法除了通过实例和实例指针访问，还可以通过<code>method expression</code>的方式调用。这时Pointer对M类型就是不可见的。</p>
</blockquote>

<pre><code class="language-go">
(M).Value(m)       // valid
(M).Pointer(m)     // invalid M does not have Pointer
(*M).Value(&m)     // valid
(*M).Pointer(&m)   // valid
</code></pre>

<p>再解释一下method value的receiver复制的问题。这里u.Test返回的类型类似于闭包返回的FuncVal类型，也就是<code>FuncVal{method_address, receiver_copy}</code>对象。因此下面例子中mValue中已经包含了实例u的副本。当然如果Test方法的receiver是*User，结果将不一样。</p>

<pre><code class="language-go">
u := User{1}     // User{Id int}
mValue := u.Test // func(s User) Test() {fmt.Println(s.Id)}
u.Id = 2
u.Test()  // output: 2
mValue()  // output: 1
</code></pre>

<h3 id="匿名字段与组合"><a href="#匿名字段与组合" class="headerlink" title="匿名字段与组合"></a>匿名字段与组合</h3><p>Go没有继承，但是有结构体嵌入。当一个类型T被匿名的嵌入另一类型M时，T的方法也就会拷贝到M的方法表当中。这时根据方法集的规则，如果M包含的是*T，则M包含T与*T上所有的方法。</p>
<blockquote>
<font color="#1E90FF">通过匿名字段，Go实现了类似继承的复用能力，并且可以在M上定义相同的方法名实现<strong>override</strong>。</font>

</blockquote>
<h2 id="interface接口实现"><a href="#interface接口实现" class="headerlink" title="interface接口实现"></a>interface接口实现</h2><p>Go的interface是一种内置类型，属于动态风格的<strong>duck-typing</strong>类型。接口作为方法签名的集合，任何类型的方法集中只要拥有与之对应的全部方法，就表示它实现了该接口。</p>
<h3 id="interface底层结构"><a href="#interface底层结构" class="headerlink" title="interface底层结构"></a>interface底层结构</h3><p>interface是一个结构体，包含两个成员。根据interface是否包含方法，底层又分为两个结构体。eface主要是保存了类型信息，以后总结反射时具体讲，这里先总结带方法的iface。结构体定义在<code>runtime2.go</code>显然iface由两部分组成，data域保存元数据，tab描述接口。</p>

<pre><code class="language-go">
type eface struct {
    _type *_type
    data unsafe.Pointer
}
type iface struct {
    tab *itab
    data unsafe.Pointer
}
</code></pre>

<pre><code class="language-go">
type itab struct {
  inter *interfacetype // 保存该接口的方法签名
  _type *_type // 保存动态类型的type类型信息
  link *itab // 可能有嵌套的itab
  bad int32
  unused int32
  fun [1]uintptr  // 保存动态类型对应的实现
}
type interfacetype struct {
  type _type
  mhdr []imethod
}
</code></pre>

<p>为了理解iface的数据结构，找到一个<a href="https://juejin.im/entry/59a6284df265da24921b3e36" target="_blank" rel="external">唐老鸭接口</a>接口的例子，通过gdb看看iface的数据到底是什么。首先<code>dd=&DonalDuck{}</code>这个类型的方法集包括<code>MakeFun Walking Speaking</code> 它实现了<strong>Duck</strong>和<strong>Actor</strong>两个接口。</p>

<pre><code class="language-go">
type Duck interface {
	GaGaSpeaking()
	OfficialWalking()
}
type Actor interface {
	MakeFun()
}
type DonaldDuck struct {
	height uint
	name   string
}
func (dd *DonaldDuck) GaGaSpeaking() { fmt.Println("DonaldDuck gaga") }
func (dd *DonaldDuck) OfficialWalking() { fmt.Println("DonaldDuck walk") }
func (dd *DonaldDuck) MakeFun() { fmt.Println("DonaldDuck make fun") }
func main() {
	dd := &DonaldDuck{10, "tang lao ya"}
	var duck Duck = dd
	var actor Actor = dd
	duck.GaGaSpeaking()
	actor.MakeFun()
	dd.OfficialWalking()
}
</code></pre>

<p>可以看出来当dd赋值给接口Duck后，接口duck的<strong>data域</strong>保存的地址就是dd对象指向的地址。<strong>tab域</strong>的inter字段里保存了实现这个接口的两个<strong>方法声明</strong>，其中name保存了方法的名字。<strong>tab域</strong>的func指针指向了具体实现，即这个符号对应的代码段<code>.text</code>地址。</p>
<p><img src="https://ninokop.github.io/2017/10/29/Go-%E6%96%B9%E6%B3%95%E8%B0%83%E7%94%A8%E4%B8%8E%E6%8E%A5%E5%8F%A3/gdb.png" style="zoom:90%"/></p>
<blockquote>
<p><font color="#1E90FF">具体T类型到Iface的转换涉及到3个内容的复制</font> (1) iface的tab域的func字段保存T类型的方法集，即对tab域inter声明的方法的实现。(2) iface的data域指针指向用于赋值的对象的副本。(3) iface的tab域的_type字段保存T类型的_type。</p>
</blockquote>
<p><img src="https://ninokop.github.io/2017/10/29/Go-%E6%96%B9%E6%B3%95%E8%B0%83%E7%94%A8%E4%B8%8E%E6%8E%A5%E5%8F%A3/itab.png" style="zoom:40%"/></p>
<h3 id="编译期检测"><a href="#编译期检测" class="headerlink" title="编译期检测"></a>编译期检测</h3><p>当T类型没有实现I接口中所有方法时，从T到I的赋值将抛出<code>TypeAssertionError</code>编译错误。检查的方法在函数additab当中，即查看T类型的<strong>_type</strong>方法表<strong>uncommentType</strong>是否包含了I接口<strong>interfacetype</strong>中所有的<strong>imethod</strong>，同时将T类型对方法的实现拷贝到tab的<strong>func</strong>指向的表中。</p>

<pre><code class="language-go">
type _type struct {
	size       uintptr
	ptrdata    uintptr // size of memory prefix holding all pointers
	hash       uint32
	_unused    uint8
	align      uint8
	fieldalign uint8
	kind       uint8
	alg        *typeAlg
	gcdata  *byte
	_string *string
	x       *uncommontype
	ptrto   *_type
	zero    *byte // ptr to the zero value for this type
}
type uncommontype struct {
	name    *string
	pkgpath *string
	mhdr    []method
}
</code></pre>

<h3 id="三张方法表的区别"><a href="#三张方法表的区别" class="headerlink" title="三张方法表的区别"></a>三张方法表的区别</h3><p>1) 每个<strong>具体T类型type</strong>结构对应的方法表是<code>uncommontype</code>，类型的方法集都在这里。reflect包中的Method和MethodByName方法都是通过查询这张表实现的。表中每一项都是<code>method</code>。</p>

<pre><code class="language-go">
type method struct {
	name    *string
	pkgpath *string
	mtyp    *_type
	typ     *_type
	ifn     unsafe.Pointer
	tfn     unsafe.Pointer
}
</code></pre>

<p>2) itab的<strong>interfacetype</strong>域是一张方法表，它声明了接口所有的方法，每一项都是<code>imethod</code>，可见它<code>没有实现只有声明</code>。</p>

<pre><code class="language-go">
type imethod struct {
  name *string
  pkgpath *string
  _type *type
}
</code></pre>

<p>3) itab的<strong>func</strong>域也是一张方法表，表中每一项是一个函数指针，也就是<code>只有实现没有声明</code>。即赋值的时候只是把具体类型的实现，即函数指针拷贝给了itab的func域。</p>
<h3 id="运行时-ConvT2I"><a href="#运行时-ConvT2I" class="headerlink" title="运行时 ConvT2I"></a>运行时 ConvT2I</h3><p><a href="https://blog.altoros.com/golang-internals-part-2-diving-into-the-go-compiler.html" target="_blank" rel="external">Go-internals</a>分析了go编译器在编译期生成的语法树节点。在T2I的转换时，通过<code>getitab</code>产生了中间状态<code>itab</code>。并且调用<code>convT2I</code>完成了运行时数据<strong>data域</strong>的内存拷贝，以及中间状态itab到<strong>tab域</strong>的赋值。</p>
<p>可以看到<code>getitab</code>完成了T类型的方法表的实现地址到tab的fnc[0]的赋值。完成<code>getiab</code>需要T类型的_type信息，以及I接口类型的interfacetype方法表，这些都是编译期提供的。因此<font color="#1E90FF">接口的动态性和反射的实现都是以编译期为运行时提供的类型信息为基础的。</font></p>

<pre><code class="language-go">
func getitab(inter *interfacetype, typ *_type, canfail bool) *itab {
..
  m = (*itab)(persistentalloc(unsafe.Sizeof(itab{})+
      uintptr(len(inter.mhdr)-1)*ptrSize, 0, &memstats.other_sys))
  m.inter = inter
  m._type = typ
...
  for k := 0; k < ni; k++ {
    for ; j < nt; j++ { 
    *(*unsafe.Pointer)(add(unsafe.Pointer(&m.fun[0]), uintptr(k)*ptrSize)) = t.ifn
    }
    goto nextimethod
   }
  // didn't find method
  if !canfail {
    panic(&TypeAssertionError{"", *typ._string, *inter.typ._string, *iname})
  }
  return m
}
</code></pre>

<p>最后的<code>convT2I</code>存在数据的内存拷贝，可见<strong>data域</strong>是T类型对象的一个拷贝。</p>

<pre><code class="language-go">
func convT2I(t *_type, inter *interfacetype, cache **itab, 
elem unsafe.Pointer, x unsafe.Pointer) (i fInterface) {
  tab := (*itab)(atomicloadp(unsafe.Pointer(cache)))
...
  if x == nil {
    x = newobject(t)
  }
  typedmemmove(t, x, elem)
  pi.tab = tab
  pi.data = x
  return
}
</code></pre>

<p><strong>总结</strong> 将对象赋值给接口时，编译期检查对象是否实现了接口所有的方法。运行时将对象的数据、类型、实现拷贝到iface接口当中。</p>
