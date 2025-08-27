import{_ as s}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,a as i,o as e}from"./app-DIJDtupu.js";const l={};function p(c,n){return e(),a("div",null,n[0]||(n[0]=[i(`<p>切片是 Go 中的一种基本的数据结构，使用这种结构可以用来管理数据集合。切片的设计想法是由动态数组概念而来，为了开发者可以更加方便的使一个数据结构可以自动增加和减少。但是切片本身并不是动态数据或者数组指针。切片常见的操作有 reslice、append、copy。与此同时，切片还具有可索引，可迭代的优秀特性。</p><h2 id="一-切片和数组" tabindex="-1"><a class="header-anchor" href="#一-切片和数组"><span>一. 切片和数组</span></a></h2><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_1.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>关于切片和数组怎么选择？接下来好好讨论讨论这个问题。</p><p>在 Go 中，与 C 数组变量隐式作为指针使用不同，Go 数组是值类型，赋值和函数传参操作都会复制整个数组数据。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	arrayA := [2]int{100, 200}</span></span>
<span class="line"><span>	var arrayB [2]int</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	arrayB = arrayA</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	fmt.Printf(&quot;arrayA : %p , %v\\n&quot;, &amp;arrayA, arrayA)</span></span>
<span class="line"><span>	fmt.Printf(&quot;arrayB : %p , %v\\n&quot;, &amp;arrayB, arrayB)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	testArray(arrayA)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func testArray(x [2]int) {</span></span>
<span class="line"><span>	fmt.Printf(&quot;func Array : %p , %v\\n&quot;, &amp;x, x)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>打印结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>arrayA : 0xc4200bebf0 , [100 200]</span></span>
<span class="line"><span>arrayB : 0xc4200bec00 , [100 200]</span></span>
<span class="line"><span>func Array : 0xc4200bec30 , [100 200]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以看到，三个内存地址都不同，这也就验证了 Go 中数组赋值和函数传参都是值复制的。那这会导致什么问题呢？</p><p>假想每次传参都用数组，那么每次数组都要被复制一遍。如果数组大小有 100万，在64位机器上就需要花费大约 800W 字节，即 8MB 内存。这样会消耗掉大量的内存。于是乎有人想到，函数传参用数组的指针。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	arrayA := [2]int{100, 200}</span></span>
<span class="line"><span>	testArrayPoint(&amp;arrayA)   // 1.传数组指针</span></span>
<span class="line"><span>	arrayB := arrayA[:]</span></span>
<span class="line"><span>	testArrayPoint(&amp;arrayB)   // 2.传切片</span></span>
<span class="line"><span>	fmt.Printf(&quot;arrayA : %p , %v\\n&quot;, &amp;arrayA, arrayA)</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func testArrayPoint(x *[]int) {</span></span>
<span class="line"><span>	fmt.Printf(&quot;func Array : %p , %v\\n&quot;, x, *x)</span></span>
<span class="line"><span>	(*x)[1] += 100</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>打印结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func Array : 0xc4200b0140 , [100 200]</span></span>
<span class="line"><span>func Array : 0xc4200b0180 , [100 300]</span></span>
<span class="line"><span>arrayA : 0xc4200b0140 , [100 400]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这也就证明了数组指针确实到达了我们想要的效果。现在就算是传入10亿的数组，也只需要再栈上分配一个8个字节的内存给指针就可以了。这样更加高效的利用内存，性能也比之前的好。</p><p>不过传指针会有一个弊端，从打印结果可以看到，第一行和第三行指针地址都是同一个，万一原数组的指针指向更改了，那么函数里面的指针指向都会跟着更改。</p><p>切片的优势也就表现出来了。用切片传数组参数，既可以达到节约内存的目的，也可以达到合理处理好共享内存的问题。打印结果第二行就是切片，切片的指针和原来数组的指针是不同的。</p><p>由此我们可以得出结论：</p><p>把第一个大数组传递给函数会消耗很多内存，采用切片的方式传参可以避免上述问题。切片是引用传递，所以它们不需要使用额外的内存并且比使用数组更有效率。</p><p>但是，依旧有反例。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;testing&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func array() [1024]int {</span></span>
<span class="line"><span>	var x [1024]int</span></span>
<span class="line"><span>	for i := 0; i &lt; len(x); i++ {</span></span>
<span class="line"><span>		x[i] = i</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	return x</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func slice() []int {</span></span>
<span class="line"><span>	x := make([]int, 1024)</span></span>
<span class="line"><span>	for i := 0; i &lt; len(x); i++ {</span></span>
<span class="line"><span>		x[i] = i</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	return x</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func BenchmarkArray(b *testing.B) {</span></span>
<span class="line"><span>	for i := 0; i &lt; b.N; i++ {</span></span>
<span class="line"><span>		array()</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func BenchmarkSlice(b *testing.B) {</span></span>
<span class="line"><span>	for i := 0; i &lt; b.N; i++ {</span></span>
<span class="line"><span>		slice()</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们做一次性能测试，并且禁用内联和优化，来观察切片的堆上内存分配的情况。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  go test -bench . -benchmem -gcflags &quot;-N -l&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出结果比较“令人意外”：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>vim</span></span>
<span class="line"><span></span></span>
<span class="line"><span>BenchmarkArray-4          500000              3637 ns/op               0 B/op          0 alloc s/op</span></span>
<span class="line"><span>BenchmarkSlice-4          300000              4055 ns/op            8192 B/op          1 alloc s/op</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>解释一下上述结果，在测试 Array 的时候，用的是4核，循环次数是500000，平均每次执行时间是3637 ns，每次执行堆上分配内存总量是0，分配次数也是0 。</p><p>而切片的结果就“差”一点，同样也是用的是4核，循环次数是300000，平均每次执行时间是4055 ns，但是每次执行一次，堆上分配内存总量是8192，分配次数也是1 。</p><p>这样对比看来，并非所有时候都适合用切片代替数组，因为切片底层数组可能会在堆上分配内存，而且小数组在栈上拷贝的消耗也未必比 make 消耗大。</p><h2 id="二-切片的数据结构" tabindex="-1"><a class="header-anchor" href="#二-切片的数据结构"><span>二. 切片的数据结构</span></a></h2><p>切片本身并不是动态数组或者数组指针。它内部实现的数据结构通过指针引用底层数组，设定相关属性将数据读写操作限定在指定的区域内。<strong>切片本身是一个只读对象，其工作机制类似数组指针的一种封装</strong>。</p><p>切片（slice）是对数组一个连续片段的引用，所以切片是一个引用类型（因此更类似于 C/C++ 中的数组类型，或者 Python 中的 list 类型）。这个片段可以是整个数组，或者是由起始和终止索引标识的一些项的子集。需要注意的是，终止索引标识的项不包括在切片内。切片提供了一个与指向数组的动态窗口。</p><p>给定项的切片索引可能比相关数组的相同元素的索引小。和数组不同的是，切片的长度可以在运行时修改，最小为 0 最大为相关数组的长度：切片是一个长度可变的数组。</p><p>Slice 的数据结构定义如下:</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span></span></span>
<span class="line"><span>type slice struct {</span></span>
<span class="line"><span>	array unsafe.Pointer</span></span>
<span class="line"><span>	len   int</span></span>
<span class="line"><span>	cap   int</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_2.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>切片的结构体由3部分构成，Pointer 是指向一个数组的指针，len 代表当前切片的长度，cap 是当前切片的容量。cap 总是大于等于 len 的。</p><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_3.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>如果想从 slice 中得到一块内存地址，可以这样做：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>s := make([]byte, 200)</span></span>
<span class="line"><span>ptr := unsafe.Pointer(&amp;s[0])</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如果反过来呢？从 Go 的内存地址中构造一个 slice。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span></span></span>
<span class="line"><span>var ptr unsafe.Pointer</span></span>
<span class="line"><span>var s1 = struct {</span></span>
<span class="line"><span>    addr uintptr</span></span>
<span class="line"><span>    len int</span></span>
<span class="line"><span>    cap int</span></span>
<span class="line"><span>}{ptr, length, length}</span></span>
<span class="line"><span>s := *(*[]byte)(unsafe.Pointer(&amp;s1))</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>构造一个虚拟的结构体，把 slice 的数据结构拼出来。</p><p>当然还有更加直接的方法，在 Go 的反射中就存在一个与之对应的数据结构 SliceHeader，我们可以用它来构造一个 slice</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>var o []byte</span></span>
<span class="line"><span>sliceHeader := (*reflect.SliceHeader)((unsafe.Pointer(&amp;o)))</span></span>
<span class="line"><span>sliceHeader.Cap = length</span></span>
<span class="line"><span>sliceHeader.Len = length</span></span>
<span class="line"><span>sliceHeader.Data = uintptr(ptr)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="三-创建切片" tabindex="-1"><a class="header-anchor" href="#三-创建切片"><span>三. 创建切片</span></a></h2><p>make 函数允许在运行期动态指定数组长度，绕开了数组类型必须使用编译期常量的限制。</p><p>创建切片有两种形式，make 创建切片，空切片。</p><h3 id="_1-make-和切片字面量" tabindex="-1"><a class="header-anchor" href="#_1-make-和切片字面量"><span>1. make 和切片字面量</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func makeslice(et *_type, len, cap int) slice {</span></span>
<span class="line"><span>	// 根据切片的数据类型，获取切片的最大容量</span></span>
<span class="line"><span>	maxElements := maxSliceCap(et.size)</span></span>
<span class="line"><span>    // 比较切片的长度，长度值域应该在[0,maxElements]之间</span></span>
<span class="line"><span>	if len &lt; 0 || uintptr(len) &gt; maxElements {</span></span>
<span class="line"><span>		panic(errorString(&quot;makeslice: len out of range&quot;))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>    // 比较切片的容量，容量值域应该在[len,maxElements]之间</span></span>
<span class="line"><span>	if cap &lt; len || uintptr(cap) &gt; maxElements {</span></span>
<span class="line"><span>		panic(errorString(&quot;makeslice: cap out of range&quot;))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>    // 根据切片的容量申请内存</span></span>
<span class="line"><span>	p := mallocgc(et.size*uintptr(cap), et, true)</span></span>
<span class="line"><span>    // 返回申请好内存的切片的首地址</span></span>
<span class="line"><span>	return slice{p, len, cap}</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>还有一个 int64 的版本：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func makeslice64(et *_type, len64, cap64 int64) slice {</span></span>
<span class="line"><span>	len := int(len64)</span></span>
<span class="line"><span>	if int64(len) != len64 {</span></span>
<span class="line"><span>		panic(errorString(&quot;makeslice: len out of range&quot;))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	cap := int(cap64)</span></span>
<span class="line"><span>	if int64(cap) != cap64 {</span></span>
<span class="line"><span>		panic(errorString(&quot;makeslice: cap out of range&quot;))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	return makeslice(et, len, cap)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>实现原理和上面的是一样的，只不过多了把 int64 转换成 int 这一步罢了。</p><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_4.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>上图是用 make 函数创建的一个 len = 4， cap = 6 的切片。内存空间申请了6个 int 类型的内存大小。由于 len = 4，所以后面2个暂时访问不到，但是容量还是在的。这时候数组里面每个变量都是0 。</p><p>除了 make 函数可以创建切片以外，字面量也可以创建切片。</p><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_5.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>这里是用字面量创建的一个 len = 6，cap = 6 的切片，这时候数组里面每个元素的值都初始化完成了。<strong>需要注意的是 [ ] 里面不要写数组的容量，因为如果写了个数以后就是数组了，而不是切片了。</strong></p><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_6.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>还有一种简单的字面量创建切片的方法。如上图。上图就 Slice A 创建出了一个 len = 3，cap = 3 的切片。从原数组的第二位元素(0是第一位)开始切，一直切到第四位为止(不包括第五位)。同理，Slice B 创建出了一个 len = 2，cap = 4 的切片。</p><h3 id="_2-nil-和空切片" tabindex="-1"><a class="header-anchor" href="#_2-nil-和空切片"><span>2. nil 和空切片</span></a></h3><p>nil 切片和空切片也是常用的。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>var slice []int</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_7.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>nil 切片被用在很多标准库和内置函数中，描述一个不存在的切片的时候，就需要用到 nil 切片。比如函数在发生异常的时候，返回的切片就是 nil 切片。nil 切片的指针指向 nil。</p><p>空切片一般会用来表示一个空的集合。比如数据库查询，一条结果也没有查到，那么就可以返回一个空切片。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>silce := make( []int , 0 )</span></span>
<span class="line"><span>slice := []int{ }</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_8.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>空切片和 nil 切片的区别在于，空切片指向的地址不是nil，指向的是一个内存地址，但是���没有分配任何内存空间，即底层元素包含0个元素。</p><p>最后需要说明的一点是。不管是使用 nil 切片还是空切片，对其调用内置函数 append，len 和 cap 的效果都是一样的。</p><h2 id="四-切片扩容" tabindex="-1"><a class="header-anchor" href="#四-切片扩容"><span>四. 切片扩容</span></a></h2><p>当一个切片的容量满了，就需要扩容了。怎么扩，策略是什么？</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func growslice(et *_type, old slice, cap int) slice {</span></span>
<span class="line"><span>	if raceenabled {</span></span>
<span class="line"><span>		callerpc := getcallerpc(unsafe.Pointer(&amp;et))</span></span>
<span class="line"><span>		racereadrangepc(old.array, uintptr(old.len*int(et.size)), callerpc, funcPC(growslice))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	if msanenabled {</span></span>
<span class="line"><span>		msanread(old.array, uintptr(old.len*int(et.size)))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	if et.size == 0 {</span></span>
<span class="line"><span>		// 如果新要扩容的容量比原来的容量还要小，这代表要缩容了，那么可以直接报panic了。</span></span>
<span class="line"><span>		if cap &lt; old.cap {</span></span>
<span class="line"><span>			panic(errorString(&quot;growslice: cap out of range&quot;))</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>		// 如果当前切片的大小为0，还调用了扩容方法，那么就新生成一个新的容量的切片返回。</span></span>
<span class="line"><span>		return slice{unsafe.Pointer(&amp;zerobase), old.len, cap}</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    // 这里就是扩容的策略</span></span>
<span class="line"><span>	newcap := old.cap</span></span>
<span class="line"><span>	doublecap := newcap + newcap</span></span>
<span class="line"><span>	if cap &gt; doublecap {</span></span>
<span class="line"><span>		newcap = cap</span></span>
<span class="line"><span>	} else {</span></span>
<span class="line"><span>		if old.len &lt; 1024 {</span></span>
<span class="line"><span>			newcap = doublecap</span></span>
<span class="line"><span>		} else {</span></span>
<span class="line"><span>			// Check 0 &lt; newcap to detect overflow</span></span>
<span class="line"><span>			// and prevent an infinite loop.</span></span>
<span class="line"><span>			for 0 &lt; newcap &amp;&amp; newcap &lt; cap {</span></span>
<span class="line"><span>				newcap += newcap / 4</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			// Set newcap to the requested cap when</span></span>
<span class="line"><span>			// the newcap calculation overflowed.</span></span>
<span class="line"><span>			if newcap &lt;= 0 {</span></span>
<span class="line"><span>				newcap = cap</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	// 计算新的切片的容量，长度。</span></span>
<span class="line"><span>	var lenmem, newlenmem, capmem uintptr</span></span>
<span class="line"><span>	const ptrSize = unsafe.Sizeof((*byte)(nil))</span></span>
<span class="line"><span>	switch et.size {</span></span>
<span class="line"><span>	case 1:</span></span>
<span class="line"><span>		lenmem = uintptr(old.len)</span></span>
<span class="line"><span>		newlenmem = uintptr(cap)</span></span>
<span class="line"><span>		capmem = roundupsize(uintptr(newcap))</span></span>
<span class="line"><span>		newcap = int(capmem)</span></span>
<span class="line"><span>	case ptrSize:</span></span>
<span class="line"><span>		lenmem = uintptr(old.len) * ptrSize</span></span>
<span class="line"><span>		newlenmem = uintptr(cap) * ptrSize</span></span>
<span class="line"><span>		capmem = roundupsize(uintptr(newcap) * ptrSize)</span></span>
<span class="line"><span>		newcap = int(capmem / ptrSize)</span></span>
<span class="line"><span>	default:</span></span>
<span class="line"><span>		lenmem = uintptr(old.len) * et.size</span></span>
<span class="line"><span>		newlenmem = uintptr(cap) * et.size</span></span>
<span class="line"><span>		capmem = roundupsize(uintptr(newcap) * et.size)</span></span>
<span class="line"><span>		newcap = int(capmem / et.size)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	// 判断非法的值，保证容量是在增加，并且容量不超过最大容量</span></span>
<span class="line"><span>	if cap &lt; old.cap || uintptr(newcap) &gt; maxSliceCap(et.size) {</span></span>
<span class="line"><span>		panic(errorString(&quot;growslice: cap out of range&quot;))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	var p unsafe.Pointer</span></span>
<span class="line"><span>	if et.kind&amp;kindNoPointers != 0 {</span></span>
<span class="line"><span>		// 在老的切片后面继续扩充容量</span></span>
<span class="line"><span>		p = mallocgc(capmem, nil, false)</span></span>
<span class="line"><span>		// 将 lenmem 这个多个 bytes 从 old.array地址 拷贝到 p 的地址处</span></span>
<span class="line"><span>		memmove(p, old.array, lenmem)</span></span>
<span class="line"><span>		// 先将 P 地址加上新的容量得到新切片容量的地址，然后将新切片容量地址后面的 capmem-newlenmem 个 bytes 这块内存初始化。为之后继续 append() 操作腾出空间。</span></span>
<span class="line"><span>		memclrNoHeapPointers(add(p, newlenmem), capmem-newlenmem)</span></span>
<span class="line"><span>	} else {</span></span>
<span class="line"><span>		// 重新申请新的数组给新切片</span></span>
<span class="line"><span>		// 重新申请 capmen 这个大的内存地址，并且初始化为0值</span></span>
<span class="line"><span>		p = mallocgc(capmem, et, true)</span></span>
<span class="line"><span>		if !writeBarrier.enabled {</span></span>
<span class="line"><span>			// 如果还不能打开写锁，那么只能把 lenmem 大小的 bytes 字节从 old.array 拷贝到 p 的地址处</span></span>
<span class="line"><span>			memmove(p, old.array, lenmem)</span></span>
<span class="line"><span>		} else {</span></span>
<span class="line"><span>			// 循环拷贝老的切片的值</span></span>
<span class="line"><span>			for i := uintptr(0); i &lt; lenmem; i += et.size {</span></span>
<span class="line"><span>				typedmemmove(et, add(p, i), add(old.array, i))</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 返回最终新切片，容量更新为最新扩容之后的容量</span></span>
<span class="line"><span>	return slice{p, old.len, newcap}</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上述就是扩容的实现。主要需要关注的有两点，一个是扩容时候的策略，还有一个就是扩容是生成全新的内存地址还是在原来的地址后追加。</p><h4 id="_1-扩容策略" tabindex="-1"><a class="header-anchor" href="#_1-扩容策略"><span>1. 扩容策略</span></a></h4><p>先看看扩容策略。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	slice := []int{10, 20, 30, 40}</span></span>
<span class="line"><span>	newSlice := append(slice, 50)</span></span>
<span class="line"><span>	fmt.Printf(&quot;Before slice = %v, Pointer = %p, len = %d, cap = %d\\n&quot;, slice, &amp;slice, len(slice), cap(slice))</span></span>
<span class="line"><span>	fmt.Printf(&quot;Before newSlice = %v, Pointer = %p, len = %d, cap = %d\\n&quot;, newSlice, &amp;newSlice, len(newSlice), cap(newSlice))</span></span>
<span class="line"><span>	newSlice[1] += 10</span></span>
<span class="line"><span>	fmt.Printf(&quot;After slice = %v, Pointer = %p, len = %d, cap = %d\\n&quot;, slice, &amp;slice, len(slice), cap(slice))</span></span>
<span class="line"><span>	fmt.Printf(&quot;After newSlice = %v, Pointer = %p, len = %d, cap = %d\\n&quot;, newSlice, &amp;newSlice, len(newSlice), cap(newSlice))</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出结果：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Before slice = [10 20 30 40], Pointer = 0xc4200b0140, len = 4, cap = 4</span></span>
<span class="line"><span>Before newSlice = [10 20 30 40 50], Pointer = 0xc4200b0180, len = 5, cap = 8</span></span>
<span class="line"><span>After slice = [10 20 30 40], Pointer = 0xc4200b0140, len = 4, cap = 4</span></span>
<span class="line"><span>After newSlice = [10 30 30 40 50], Pointer = 0xc4200b0180, len = 5, cap = 8</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>用图表示出上述过程。</p><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_9.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>从图上我们可以很容易的看出，新的切片和之前的切片已经不同了，因为新的切片更改了一个值，并没有影响到原来的数组，新切片指向的数组是一个全新的数组。并且 cap 容量也发生了变化。这之间究竟发生了什么呢？</p><p>Go 中切片扩容的策略是这样的：</p><ul><li>首先判断，如果新申请容量（cap）大于2倍的旧容量（old.cap），最终容量（newcap）就是新申请的容量（cap）</li><li>否则判断，如果旧切片的长度小于1024，则最终容量(newcap)就是旧容量(old.cap)的两倍，即（newcap=doublecap）</li><li>否则判断，如果旧切片长度大于等于1024，则最终容量（newcap）从旧容量（old.cap）开始循环增加原来的 1/4，即（newcap=old.cap,for {newcap += newcap/4}）直到最终容量（newcap）大于等于新申请的容量(cap)，即（newcap &gt;= cap）</li><li>如果最终容量（cap）计算值溢出，则最终容量（cap）就是新申请容量（cap）</li></ul><p><s>如果切片的容量小于 1024 个元素，于是扩容的时候就翻倍增加容量。上面那个例子也验证了这一情况，总容量从原来的4个翻倍到现在的8个。</s></p><p><s>一旦元素个数超过 1024 个元素，那么增长因子就变成 1.25 ，即每次增加原来容量的四分之一。</s></p><p><strong>注意：扩容扩大的容量都是针对原来的容量而言的，而不是针对原来数组的长度而言的。</strong></p><h4 id="_2-新数组-or-老数组" tabindex="-1"><a class="header-anchor" href="#_2-新数组-or-老数组"><span>2. 新数组 or 老数组 ？</span></a></h4><p>再谈谈扩容之后的数组一定是新的么？这个不一定，分两种情况。</p><p>情况一：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	array := [4]int{10, 20, 30, 40}</span></span>
<span class="line"><span>	slice := array[0:2]</span></span>
<span class="line"><span>	newSlice := append(slice, 50)</span></span>
<span class="line"><span>	fmt.Printf(&quot;Before slice = %v, Pointer = %p, len = %d, cap = %d\\n&quot;, slice, &amp;slice, len(slice), cap(slice))</span></span>
<span class="line"><span>	fmt.Printf(&quot;Before newSlice = %v, Pointer = %p, len = %d, cap = %d\\n&quot;, newSlice, &amp;newSlice, len(newSlice), cap(newSlice))</span></span>
<span class="line"><span>	newSlice[1] += 10</span></span>
<span class="line"><span>	fmt.Printf(&quot;After slice = %v, Pointer = %p, len = %d, cap = %d\\n&quot;, slice, &amp;slice, len(slice), cap(slice))</span></span>
<span class="line"><span>	fmt.Printf(&quot;After newSlice = %v, Pointer = %p, len = %d, cap = %d\\n&quot;, newSlice, &amp;newSlice, len(newSlice), cap(newSlice))</span></span>
<span class="line"><span>	fmt.Printf(&quot;After array = %v\\n&quot;, array)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>打印输出：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Before slice = [10 20], Pointer = 0xc4200c0040, len = 2, cap = 4</span></span>
<span class="line"><span>Before newSlice = [10 20 50], Pointer = 0xc4200c0060, len = 3, cap = 4</span></span>
<span class="line"><span>After slice = [10 30], Pointer = 0xc4200c0040, len = 2, cap = 4</span></span>
<span class="line"><span>After newSlice = [10 30 50], Pointer = 0xc4200c0060, len = 3, cap = 4</span></span>
<span class="line"><span>After array = [10 30 50 40]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>把上述过程用图表示出来，如下图。</p><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_10.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>通过打印的结果，我们可以看到，在这种情况下，扩容以后并没有新建一个新的数组，扩容前后的数组都是同一个，这也就导致了新的切片修改了一个值，也影响到了老的切片了。并且 append() 操作也改变了原来数组里面的值。一��� append() 操作影响了这么多地方，如果原数组上有多个切片，那么这些切片都会被影响！无意间就产生了莫名的 bug！</p><p>这种情况，由于原数组还有容量可以扩容，所以执行 append() 操作以后，会在原数组上直接操作，所以这种情况下，扩容以后的数组还是指向原来的数组。</p><p>这种情况也极容易出现在字面量创建切片时候，第三个参数 cap 传值的时候，如果用字面量创建切片，cap 并不等于指向数组的总容量，那么这种情况就会发生。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>slice := array[1:2:3]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>上面这种情况非常危险，极度容易产生 bug 。</strong></p><p>建议用字面量创建切片的时候，cap 的值一定要保持清醒，避免共享原数组导致的 bug。</p><p>情况二：</p><p>情况二其实就是在扩容策略里面举的例子，在那个例子中之所以生成了新的切片，是因为原来数组的容量已经达到了最大值，再想扩容， Go 默认会先开一片内存区域，把原来的值拷贝过来，然后再执行 append() 操作。这种情况丝毫不影响原数组。</p><p>所以建议尽量避免情况一，尽量使用情况二，避免 bug 产生。</p><h2 id="五-切片拷贝" tabindex="-1"><a class="header-anchor" href="#五-切片拷贝"><span>五. 切片拷贝</span></a></h2><p>Slice 中拷贝方法有2个。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func slicecopy(to, fm slice, width uintptr) int {</span></span>
<span class="line"><span>	// 如果源切片或者目标切片有一个长度为0，那么就不需要拷贝，直接 return </span></span>
<span class="line"><span>	if fm.len == 0 || to.len == 0 {</span></span>
<span class="line"><span>		return 0</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// n 记录下源切片或者目标切片较短的那一个的长度</span></span>
<span class="line"><span>	n := fm.len</span></span>
<span class="line"><span>	if to.len &lt; n {</span></span>
<span class="line"><span>		n = to.len</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 如果入参 width = 0，也不需要拷贝了，返回较短的切片的长度</span></span>
<span class="line"><span>	if width == 0 {</span></span>
<span class="line"><span>		return n</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 如果开启了竞争检测</span></span>
<span class="line"><span>	if raceenabled {</span></span>
<span class="line"><span>		callerpc := getcallerpc(unsafe.Pointer(&amp;to))</span></span>
<span class="line"><span>		pc := funcPC(slicecopy)</span></span>
<span class="line"><span>		racewriterangepc(to.array, uintptr(n*int(width)), callerpc, pc)</span></span>
<span class="line"><span>		racereadrangepc(fm.array, uintptr(n*int(width)), callerpc, pc)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 如果开启了 The memory sanitizer (msan)</span></span>
<span class="line"><span>	if msanenabled {</span></span>
<span class="line"><span>		msanwrite(to.array, uintptr(n*int(width)))</span></span>
<span class="line"><span>		msanread(fm.array, uintptr(n*int(width)))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	size := uintptr(n) * width</span></span>
<span class="line"><span>	if size == 1 { </span></span>
<span class="line"><span>		// TODO: is this still worth it with new memmove impl?</span></span>
<span class="line"><span>		// 如果只有一个元素，那么指针直接转换即可</span></span>
<span class="line"><span>		*(*byte)(to.array) = *(*byte)(fm.array) // known to be a byte pointer</span></span>
<span class="line"><span>	} else {</span></span>
<span class="line"><span>		// 如果不止一个元素，那么就把 size 个 bytes 从 fm.array 地址开始，拷贝到 to.array 地址之后</span></span>
<span class="line"><span>		memmove(to.array, fm.array, size)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	return n</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在这个方法中，slicecopy 方法会把源切片值(即 fm Slice )中的元素复制到目标切片(即 to Slice )中，并返回被复制的元素个数，copy 的两个类型必须一致。slicecopy 方法最终的复制结果取决于较短的那个切片，当较短的切片复制完成，整个复制过程就全部完成了。</p><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_11.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>举个例子，比如：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	array := []int{10, 20, 30, 40}</span></span>
<span class="line"><span>	slice := make([]int, 6)</span></span>
<span class="line"><span>	n := copy(slice, array)</span></span>
<span class="line"><span>	fmt.Println(n,slice)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>还有一个拷贝的方法，这个方法原理和 slicecopy 方法类似，不在赘述了，注释写在代码里面了。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span></span></span>
<span class="line"><span>func slicestringcopy(to []byte, fm string) int {</span></span>
<span class="line"><span>	// 如果源切片或者目标切片有一个长度为0，那么就不需要拷贝，直接 return </span></span>
<span class="line"><span>	if len(fm) == 0 || len(to) == 0 {</span></span>
<span class="line"><span>		return 0</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// n 记录下源切片或者目标切片较短的那一个的长度</span></span>
<span class="line"><span>	n := len(fm)</span></span>
<span class="line"><span>	if len(to) &lt; n {</span></span>
<span class="line"><span>		n = len(to)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 如果开启了竞争检测</span></span>
<span class="line"><span>	if raceenabled {</span></span>
<span class="line"><span>		callerpc := getcallerpc(unsafe.Pointer(&amp;to))</span></span>
<span class="line"><span>		pc := funcPC(slicestringcopy)</span></span>
<span class="line"><span>		racewriterangepc(unsafe.Pointer(&amp;to[0]), uintptr(n), callerpc, pc)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 如果开启了 The memory sanitizer (msan)</span></span>
<span class="line"><span>	if msanenabled {</span></span>
<span class="line"><span>		msanwrite(unsafe.Pointer(&amp;to[0]), uintptr(n))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 拷贝字符串至字节数组</span></span>
<span class="line"><span>	memmove(unsafe.Pointer(&amp;to[0]), stringStructOf(&amp;fm).str, uintptr(n))</span></span>
<span class="line"><span>	return n</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>再举个例子，比如：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	slice := make([]byte, 3)</span></span>
<span class="line"><span>	n := copy(slice, &quot;abcdef&quot;)</span></span>
<span class="line"><span>	fmt.Println(n,slice)</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3 [97,98,99]</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>说到拷贝，切片中有一个需要注意的问题。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	slice := []int{10, 20, 30, 40}</span></span>
<span class="line"><span>	for index, value := range slice {</span></span>
<span class="line"><span>		fmt.Printf(&quot;value = %d , value-addr = %x , slice-addr = %x\\n&quot;, value, &amp;value, &amp;slice[index])</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>输出：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>go</span></span>
<span class="line"><span></span></span>
<span class="line"><span>value = 10 , value-addr = c4200aedf8 , slice-addr = c4200b0320</span></span>
<span class="line"><span>value = 20 , value-addr = c4200aedf8 , slice-addr = c4200b0328</span></span>
<span class="line"><span>value = 30 , value-addr = c4200aedf8 , slice-addr = c4200b0330</span></span>
<span class="line"><span>value = 40 , value-addr = c4200aedf8 , slice-addr = c4200b0338</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>从上面结果我们可以看到，如果用 range 的方式去遍历一个切片，拿到的 Value 其实是切片里面的值拷贝。所以每次打印 Value 的地址都不变。</p><figure><img src="https://img.halfrost.com/Blog/ArticleImage/57_12.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>由于 Value 是值拷贝的，并非引用传递，所以直接改 Value 是达不到更改原切片值的目的的，需要通过 <code>&amp;slice[index]</code> 获取真实的地址。</p><hr><p>Reference：<br> 《Go in action》<br> 《Go 语言学习笔记》</p><blockquote><p>GitHub Repo：<a href="https://github.com/halfrost/Halfrost-Field" target="_blank" rel="noopener noreferrer">Halfrost-Field</a></p><p>Follow: <a href="https://github.com/halfrost" target="_blank" rel="noopener noreferrer">halfrost · GitHub</a></p><p>Source: <a href="https://halfrost.com/go_slice/" target="_blank" rel="noopener noreferrer">https://halfrost.com/go_slice/</a></p></blockquote><p><a href="/tag/go/" target="_blank" rel="noopener noreferrer">Go</a> <a href="/tag/slice/" target="_blank" rel="noopener noreferrer">Slice</a></p>`,126)]))}const r=s(l,[["render",p],["__file","深入解析-Go-中-Slice-底层实现.html.vue"]]),v=JSON.parse('{"path":"/golang/%E5%8E%9F%E7%90%86/theory/%E6%B7%B1%E5%85%A5%E8%A7%A3%E6%9E%90-Go-%E4%B8%AD-Slice-%E5%BA%95%E5%B1%82%E5%AE%9E%E7%8E%B0.html","title":"深入解析 Go 中 Slice 底层实现","lang":"zh-CN","frontmatter":{"title":"深入解析 Go 中 Slice 底层实现","source_url":"https://studygolang.com/articles/12983","category":"Go原理教程","description":"切片是 Go 中的一种基本的数据结构，使用这种结构可以用来管理数据集合。切片的设计想法是由动态数组概念而来，为了开发者可以更加方便的使一个数据结构可以自动增加和减少。但是切片本身并不是动态数据或者数组指针。切片常见的操作有 reslice、append、copy。与此同时，切片还具有可索引，可迭代的优秀特性。 一. 切片和数组 关于切片和数组怎么选择？...","head":[["meta",{"property":"og:url","content":"https://Cospk.github.io/vuepress-app/golang/%E5%8E%9F%E7%90%86/theory/%E6%B7%B1%E5%85%A5%E8%A7%A3%E6%9E%90-Go-%E4%B8%AD-Slice-%E5%BA%95%E5%B1%82%E5%AE%9E%E7%8E%B0.html"}],["meta",{"property":"og:site_name","content":"Golang全栈指南"}],["meta",{"property":"og:title","content":"深入解析 Go 中 Slice 底层实现"}],["meta",{"property":"og:description","content":"切片是 Go 中的一种基本的数据结构，使用这种结构可以用来管理数据集合。切片的设计想法是由动态数组概念而来，为了开发者可以更加方便的使一个数据结构可以自动增加和减少。但是切片本身并不是动态数据或者数组指针。切片常见的操作有 reslice、append、copy。与此同时，切片还具有可索引，可迭代的优秀特性。 一. 切片和数组 关于切片和数组怎么选择？..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://img.halfrost.com/Blog/ArticleImage/57_1.png"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-08-27T12:02:38.000Z"}],["meta",{"property":"article:modified_time","content":"2025-08-27T12:02:38.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"深入解析 Go 中 Slice 底层实现\\",\\"image\\":[\\"https://img.halfrost.com/Blog/ArticleImage/57_1.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_2.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_3.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_4.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_5.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_6.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_7.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_8.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_9.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_10.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_11.png\\",\\"https://img.halfrost.com/Blog/ArticleImage/57_12.png\\"],\\"dateModified\\":\\"2025-08-27T12:02:38.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Cospk\\",\\"url\\":\\"https://savvygo.cn\\"}]}"]]},"headers":[{"level":2,"title":"一. 切片和数组","slug":"一-切片和数组","link":"#一-切片和数组","children":[]},{"level":2,"title":"二. 切片的数据结构","slug":"二-切片的数据结构","link":"#二-切片的数据结构","children":[]},{"level":2,"title":"三. 创建切片","slug":"三-创建切片","link":"#三-创建切片","children":[{"level":3,"title":"1. make 和切片字面量","slug":"_1-make-和切片字面量","link":"#_1-make-和切片字面量","children":[]},{"level":3,"title":"2. nil 和空切片","slug":"_2-nil-和空切片","link":"#_2-nil-和空切片","children":[]}]},{"level":2,"title":"四. 切片扩容","slug":"四-切片扩容","link":"#四-切片扩容","children":[]},{"level":2,"title":"五. 切片拷贝","slug":"五-切片拷贝","link":"#五-切片拷贝","children":[]}],"git":{"createdTime":1756202807000,"updatedTime":1756296158000,"contributors":[{"name":"shiwei","username":"shiwei","email":"xie@gmail.com","commits":2,"url":"https://github.com/shiwei"}]},"readingTime":{"minutes":16.83,"words":5050},"filePathRelative":"golang/原理/theory/深入解析-Go-中-Slice-底层实现.md","localizedDate":"2025年8月26日","autoDesc":true,"excerpt":"<p>切片是 Go 中的一种基本的数据结构，使用这种结构可以用来管理数据集合。切片的设计想法是由动态数组概念而来，为了开发者可以更加方便的使一个数据结构可以自动增加和减少。但是切片本身并不是动态数据或者数组指针。切片常见的操作有 reslice、append、copy。与此同时，切片还具有可索引，可迭代的优秀特性。</p>\\n<h2>一. 切片和数组</h2>\\n<figure><img src=\\"https://img.halfrost.com/Blog/ArticleImage/57_1.png\\" alt=\\"\\" tabindex=\\"0\\" loading=\\"lazy\\"><figcaption></figcaption></figure>"}');export{r as comp,v as data};
