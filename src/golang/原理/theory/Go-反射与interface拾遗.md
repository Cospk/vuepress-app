---
title: Go 反射与interface拾遗
source_url: 'https://studygolang.com/articles/11994'
category: Go原理教程
---


						<div class="post-body" itemprop="articleBody">

<p>Go能实现接口的动态性和反射的基础是：编译期为运行时提供了类型信息。interface底层有两种结构，上一节讲了带方法的iface，这一节补充不带方法的eface结构。</p>
<h2 id="interface之eface"><a href="#interface之eface" class="headerlink" title="interface之eface"></a>interface之eface</h2><p>Go中的任何对象都可以表示为<strong>interface{}</strong>。它扮演的角色与C中的<strong>void*</strong>差不多，区别在于interface{}中包含有类型信息，可以实现反射。</p>
<blockquote>
<p><strong>eface数据结构描述</strong>：<code>gcdata</code>域用于垃圾回收，<code>size</code>描述类型的大小，<code>hash</code>表示数据的hash值，<code>align</code>是对齐，<code>fieldalign</code>是这个数据嵌入结构体时的对齐，<code>kind</code>是枚举值。<code>alg</code>是函数指针的数组，存储了<code>hash/equal/print/copy</code>四个函数操作。<code>uncommentType</code>指向这个类型的方法集。</p>
</blockquote>

<pre><code class="language-go">
type eface struct {
	_type *_type
	data unsafe.Pointer
}
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
</code></pre>

<h3 id="运行时convT2E"><a href="#运行时convT2E" class="headerlink" title="运行时convT2E"></a>运行时convT2E</h3><p><strong>T2E的转换</strong> 赋值给空interface{}，运行时会调用conv类函数<code>convT2E</code>。与<code>convT2I</code>一样，向interface的类型转换<code>var i interface{} = u</code>都存在内存拷贝。看iface.go源码时发现<code>convI2I</code>等接口转换时没有分配内存和拷贝数据，原因可能是Go接口内部的data域，并不开放途径让外部修改，所以接口之间转换可以用同一块内存。</p>

<pre><code class="language-go">
func convT2E(t *_type, elem unsafe.Pointer, x unsafe.Pointer) (e interface{}) {
	ep := (*eface)(unsafe.Pointer(&e))
  ...
	if x == nil {
		x = newobject(t)
	}
	typedmemmove(t, x, elem)
	ep._type = t
	ep.data = x
	}
	return
}
</code></pre>

<p>下面的例子中修改u并不影响i interface的内存数据，因为i在赋值时通过convT2E对u进行了拷贝。这也是<strong>反射非指针变量时无法直接改变变量数据</strong>的原因，因为反射会先把变量转成interface类型，拿到的是变量的副本。</p>

<pre><code class="language-go">
u := User{1, "Tom"}
var i interface{} = u
u.id = 2
u.name = "Jack"
// u {2, "Jack"}
// i.(User) {1, "Tom"}
</code></pre>

<h3 id="nil的理解"><a href="#nil的理解" class="headerlink" title="nil的理解"></a>nil的理解</h3><p>未初始化的interface类型，指针，函数，slice，cannel和map都是nil的。<strong>对于interface比较特殊，只有eface的type和data都是nil，或者iface的type和data都是nil时，interface{}才是nil。</strong></p>

<pre><code class="language-go">
type Duck interface{
    Walk()
}
var i interface{}   // nil
var d Duck   // nil
var v *T   // nil
i = v   // (*T)(nil) not nil
</code></pre>

<h3 id="type-assertion"><a href="#type-assertion" class="headerlink" title="type assertion"></a>type assertion</h3><p>严格来说Go并不支持泛型编程，但通过interface可实现泛型编程，后面reflect浅析中有个通过reflect实现泛型的例子。interface像其它类型转换的时候一般需要断言。下面只给出了eface的例子，当然也可以通过断言来判断某个类型是否实现了某个接口。</p>

<pre><code class="language-go">
func do(v interface{}) {
	n, ok := v.(int)
	if !ok {...}
}
func doswitch(i interface{}) {
	switch v := i.(type) {
	case int: ...
	}
}
</code></pre>

<p>对应的go源码在iface.go当中。<code>assertE2T</code>过程判断了eface的type字段是否和目标type相等，相等则还需要拷贝数据。<code>assertI2T</code>也要拷贝数据，不过他比较的是iface.tab._type与目标type是否一致。</p>

<pre><code class="language-go">
func assertE2T(t *_type, e interface{}, r unsafe.Pointer) {
	ep := (*eface)(unsafe.Pointer(&e))
	if ep._type == nil {
		panic(&TypeAssertionError{"", "", *t._string, ""})
	}
	if ep._type != t {
		panic(&TypeAssertionError{"", *ep._type._string, *t._string, ""})
	}
	if r != nil {
		if isDirectIface(t) {
			writebarrierptr((*uintptr)(r), uintptr(ep.data))
		} else {
			typedmemmove(t, r, ep.data)
		}
	}
}
</code></pre>

<h2 id="reflect浅析"><a href="#reflect浅析" class="headerlink" title="reflect浅析"></a>reflect浅析</h2><p>反射机制提供了检查存储在接口变量中的[类型 值]对的机制。根据<a href="https://studygolang.com/articles/2157" target="_blank" rel="external">Laws Of Reflection</a>Go的反射可以总结三点，即反射可以从interface中获取reflect对象；同时可以通过<code>Interface()</code>方法恢复reflect对象为一个interface；如果要修改反射对象，该对象必须是<code>settable</code>的。</p>
<h3 id="TypeOf与ValueOf实现"><a href="#TypeOf与ValueOf实现" class="headerlink" title="TypeOf与ValueOf实现"></a>TypeOf与ValueOf实现</h3><p>获取反射对象的实现，是基于对interface底层数据的操作。首先对象经过了<code>convT2E</code>，然后emptyInterface直接指向了eface的type字段。<code>typeOf</code>返回的<strong>Type</strong>是接口，在类型_type上实现了很多操作。<code>valueOf</code>返回的就是<strong>Value</strong>结构体，它包含了数据域和type域信息。</p>

<pre><code class="language-go">
func TypeOf(i interface{}) Type {
	eface := *(*emptyInterface)(unsafe.Pointer(&i))
	return toType(eface.typ)
}
func ValueOf(i interface{}) Value {
	if i == nil {
		return Value{}
	}
	escapes(i)
	return unpackEface(i)
}
func unpackEface(i interface{}) Value {
	e := (*emptyInterface)(unsafe.Pointer(&i))
	t := e.typ
	if t == nil {
		return Value{}
	}
	f := flag(t.Kind())
	if ifaceIndir(t) {
		f |= flagIndir
	}
	return Value{t, unsafe.Pointer(e.word), f}
}
</code></pre>

<pre><code class="language-go">
type Type interface{
  ...
	Method(int) Method
	MethodByName(string) (Method, bool)
	NumMethod() int
	NumField()
	Field(i) StructField
	FieldByName(name string) (StructField, bool)
  ...
}
type Value struct {
	typ *rtype
	ptr unsafe.Pointer
	flag
}
</code></pre>

<h3 id="通过Type获取Struct-Field信息"><a href="#通过Type获取Struct-Field信息" class="headerlink" title="通过Type获取Struct Field信息"></a>通过Type获取Struct Field信息</h3><p>可以通过reflect获取类型实例的结构体信息，比如每个field的名字类型或标签。</p>

<pre><code class="language-go">
// A StructField describes a single field in a struct.
type StructField struct {
	Name string  // Name is the field name.
	PkgPath string
	Type      Type      // field type
	Tag       StructTag // field tag string
	Offset    uintptr   // offset within struct, in bytes
	Index     []int     // index sequence for Type.FieldByIndex
	Anonymous bool      // is an embedded field
}
type Person struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}
func main() {
	nino := Person{"nino", 27}
	t := reflect.TypeOf(nino)
	n := t.NumField()
	for i := 0; i < n; i++ {
		fmt.Println(t.Field(i).Name, t.Field(i).Type, t.Field(i).Tag)
	}
}
// Name string json:"name"
// Age int json:"age"
</code></pre>

<h3 id="通过Value实现泛型"><a href="#通过Value实现泛型" class="headerlink" title="通过Value实现泛型"></a>通过Value实现泛型</h3><p>为了解决method接受不同类型的slice为入参，可以用反射来完成。对于可记长度和可随机访问的类型，可以通过<code>v.Len()</code>和<code>v.Index(i)</code>获取他们的第几个元素。</p>
<blockquote>
<p><strong>v.Index(i).Interface()</strong>将reflect.Value反射回了interface类型</p>
</blockquote>

<pre><code class="language-go">
func method(in interface{}) (ok bool) {
	v := reflect.ValueOf(in)
	if v.Kind() == reflect.Slice {
		ok = true
	} else {
		return false
	}
	num := v.Len()
	for i := 0; i < num; i++ {
		fmt.Println(v.Index(i).Interface())
	}
	return ok
}
func main() {
	s := []int{1, 3, 5, 7, 9}
	b := []float64{1.2, 3.4, 5.6, 7.8}
	method(s)
	method(b)
}
</code></pre>

<h3 id="通过Elem修改reflect对象值"><a href="#通过Elem修改reflect对象值" class="headerlink" title="通过Elem修改reflect对象值"></a>通过Elem修改reflect对象值</h3><p><strong>对LawsOfReflect第三点的理解</strong> <code>reflect.ValueOf</code> 如果直接传入x，则v是x的一个副本的<strong>reflect</strong>对象。修改v的值并不会作用到x上。p是指向x的指针的reflect对象，修改p的值是在修改指针的指向，同样不会作用到x上，因此也是<strong>CanNotSet</strong>的。只有通过<code>p.Elem()</code>相当于获取了*p的<strong>reflect</strong>对象，这时才能使用<code>v.SetFloat(7.2)</code>来对原始的数据进行修改。</p>

<pre><code class="language-go">
var x float64 = 3.4
v := reflect.ValueOf(x)   // can not set
p := reflect.ValueOf(&x)  // can not set
e := p.Elem()  // can set
</code></pre>
      
