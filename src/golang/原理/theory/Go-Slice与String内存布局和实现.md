---
title: Go Slice与String内存布局和实现
source_url: 'https://studygolang.com/articles/11980'
category: Go原理教程
---


						<div class="post-body" itemprop="articleBody">
<p>上一篇提到的关于gc性能的问题，对比slice和map的结构可以看出为了存储数据map用了更多的内存空间，并且可能存在链表，链表的每个节点在gc时都做为一个小对象对待，增加了扫描的时间，因此gc时间相对更长。</p>
<h2 id="slice初始化与复制"><a href="#slice初始化与复制" class="headerlink" title="slice初始化与复制"></a>slice初始化与复制</h2><p>slice通过内部指针和相关属性引用数组片段，来实现变长方案。实现方式和数据结构都类似C++中的vector。它本身是结构体，作为参数传递时传递的是slice本身而不是它引用的底层数组。len()可获得slice长度，cap()可获得slice容量。</p>

<pre><code class="language-go">
type slice struct {
	array unsafe.Pointer
	len   int
	cap   int
}
</code></pre>

<p>slice可以通过数组初始化，也可以直接make。make时直接使用cap作为new的长度来创建底层数组，返回的是slice结构体。如果通过<code>new([]int)</code>来初始化，它返回的是一个指向slice结构体的指针，不能直接对它进行下标操作。</p>

<pre><code class="language-go">
func makeslice(t *slicetype, len64, cap64 int64) slice {
	p := newarray(t.elem, uintptr(cap))
	return slice{p, len, cap}
}
</code></pre>

<p>遍历slice时经常用到range操作，range会复制range的对象。下面例子中在循环内部改变slice的属性，最终会作用到slice上导致最后输出<code>[1 2 101]</code>。但是并不会导致循环在第三次就结束，因为range s是从s的复本中读取i和n的。s的复本只复制了指针，底层元素仍指向同一片，因此可以在循环内改变slice元素的值并在循环期内可见。</p>

<pre><code class="language-go">
func main() {
	s := []int{1, 2, 3, 4, 5}
	for i, n := range s {
		if i == 0 {
			s = s[:3]
			s[2] = n + 100
		}
		fmt.Println(i, n) // 输出1 2;2 101;3 4;4 5
	}
	fmt.Println(s)//输出 1 2 101
}
</code></pre>

<h2 id="reslice扩容"><a href="#reslice扩容" class="headerlink" title="reslice扩容"></a>reslice扩容</h2><blockquote>
<p>reslice的增长规则：如果新的size是当前size的2倍以上，则大小增长为新size。如果新的size不到当前size的2倍，则按当前size的不同有不同操作。当前size不超过1024，按每次2倍增长，否则按当前大小的1/4增长。</p>
</blockquote>
<p>slice通过append元素使得元素达到cap，就会<a href="">重新分配内存，复制内容并接着append</a>，即便指向的数组还有空位。比如这个例子a初始化为长度和容量都是3的slice，再往a中append数据时a将在堆上重新分配空间并复制原始内容，因此这时原始数组的后几位已经看不到了。</p>

<pre><code class="language-go">
func main() {
	data := [6]int{0, 1, 2, 3, 4, 5}
	a := data[:3]
    a = append(a, 100) // output [0 1 2 100]
}
</code></pre>

<p>如果slice作为函数的入参，通常希望对slice的操作可以影响到底层数据，但是如果在函数内部append数据超过了cap，导致重新分配底层数组，这时<a href="">入参a指向的底层数组跟调用方实参指向的不再是同一个</a>。如下面的例子这样因为扩容导致与代码<strong>实现</strong>原意相违背，因此通常不建议在函数内部对slice有append操作，若有需要则显示的返回这个slice。</p>

<pre><code class="language-go">
func main() {
	a := []int{1} // afeter initialization len=1 cap=1
	test(a)       // call test to append slice, but a is [1], not [1 2]
}
func test(a []int) { a = append(a, 2) }
</code></pre>

<h2 id="string内存分布和复制"><a href="#string内存分布和复制" class="headerlink" title="string内存分布和复制"></a>string内存分布和复制</h2><p>string的结构和C++STL实现的string类似。都是由指向固定地址的str指针和len组成的结构体。对string的复制只是对指针和len的复制，作为函数参数时入参只不过是指向同一个底层数据的相同指针。</p>
<blockquote>
<p>通常string常量是编译器分配到<strong>只读段</strong>的(.rodata)，对应的数据地址不可写入。<code>fmt.Sprintf</code>生成的字符串<strong>分配在堆</strong>上，对应数据地址可修改。</p>
</blockquote>

<pre><code class="language-go">
struct string {
  byte* str;
  intgo len;
}
</code></pre>

<h2 id="string与-byte转化"><a href="#string与-byte转化" class="headerlink" title="string与[]byte转化"></a>string与[]byte转化</h2><p>平常使用中经常将两者互相转化，每次相互转化时都会发生底层数据的复制。如果是动态生成的字符串可以通过以下对指针的操作来直接转化数据，而不需要拷贝，性能好接近4倍。</p>

<pre><code class="language-go">
//return GoString's buffer slice(enable modify string)
func StringBytes(s string) Bytes {
    return *(*Bytes)(unsafe.Pointer(&s))
}
// convert b to string without copy
func BytesString(b []byte) String {
    return *(*String)(unsafe.Pointer(&b))
}
</code></pre>

<p>参考博客：</p>
<p><a href="http://blog.csdn.net/vipally/article/details/52940119" target="_blank" rel="external">http://blog.csdn.net/vipally/article/details/52940119</a></p>
<p><a href="https://studygolang.com/articles/2909" target="_blank" rel="external">https://studygolang.com/articles/2909</a></p>
