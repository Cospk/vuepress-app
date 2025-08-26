---
title: 浅谈 Go 语言 select 的实现原理
source_url: 'https://studygolang.com/articles/19414'
category: Go原理教程
---


						<p>很多 C 语言或者 Unix 开发者听到 <code>select</code> 想到的都是系统调用，而谈到 I/O 模型时最终大都会提到基于 <code>select</code>、<code>poll</code> 和 <code>epoll</code> 等函数构建的 IO 多路复用模型，我们在这一节中即将介绍的 Go 语言中的 <code>select</code> 关键字其实就与 C 语言中的 <code>select</code> 有比较相似的功能。</p>

<p>这一节会介绍 Go 语言中的 <code>select</code> 的实现原理，包括 <code>select</code> 的结构和常见问题、编译期间的多种优化以及运行时的执行过程。</p>

<h2 id="概述">
<a id="概述" class="anchor" href="#%E6%A6%82%E8%BF%B0" aria-hidden="true"><span class="octicon octicon-link"></span></a>概述</h2>

<p>C 语言中的 <code>select</code> 关键字可以同时监听多个文件描述符的可读或者可写的状态，在文件描述符发生状态改变之前，<code>select</code> 会一直阻塞当前的线程，Go 语言中的 <code>select</code> 关键字与 C 语言中的有些类似，只是它能够让一个 Goroutine 同时等待多个 Channel 达到准备状态。</p>

<p><img src="https://static.studygolang.com/190331/c9e3597593cbee18752218ecc985a30a.png" alt="Golang-Select-Channels"/></p>

<p><code>select</code> 是一种与 <code>switch</code> 非常相似的控制结构，与 <code>switch</code> 不同的是，<code>select</code> 中虽然也有多个 <code>case</code>，但是这些 <code>case</code> 中的表达式都必须与 <a href="https://draveness.me/golang-channel">Channel</a> 的操作有关，也就是 Channel 的读写操作，下面的函数就展示了一个包含从 Channel 中读取数据和向 Channel 发送数据的 <code>select</code> 结构：</p>

<pre><code class="language-go">func fibonacci(c, quit chan int) {
	x, y := 0, 1
	for {
		select {
		case c <- x:
			x, y = y, x+y
		case <-quit:
			fmt.Println("quit")
			return
		}
	}
}
</code></pre>

<p>这个 <code>select</code> 控制结构就会等待 <code>c <- x</code> 或者 <code><-quit</code> 两个表达式中任意一个的返回，无论哪一个返回都会立刻执行 <code>case</code> 中的代码，不过如果了 <code>select</code> 中的两个 <code>case</code> 同时被触发，就会随机选择一个 <code>case</code> 执行。</p>

<h3 id="结构">
<a id="结构" class="anchor" href="#%E7%BB%93%E6%9E%84" aria-hidden="true"><span class="octicon octicon-link"></span></a>结构</h3>

<p><code>select</code> 在 Go 语言的源代码中其实不存在任何的结构体表示，但是 <code>select</code> 控制结构中 <code>case</code> 却使用了 <code>scase</code> 结构体来表示：</p>

<pre><code class="language-go">type scase struct {
	c           *hchan
	elem        unsafe.Pointer
	kind        uint16
	pc          uintptr
	releasetime int64
}
</code></pre>

<p>由于非 <code>default</code> 的 <code>case</code> 中都与 Channel 的发送和接收数据有关，所以在 <code>scase</code> 结构体中也包含一个 <code>c</code> 字段用于存储 <code>case</code> 中使用的 Channel，<code>elem</code> 是用于接收或者发送数据的变量地址、<code>kind</code> 表示当前 <code>case</code> 的种类，总共包含以下四种：</p>

<pre><code class="language-go">const (
	caseNil = iota
	caseRecv
	caseSend
	caseDefault
)
</code></pre>

<p>这四种常量分别表示不同类型的 <code>case</code>，相信它们的命名已经能够充分帮助我们理解它们的作用了，所以在这里也不再展开介绍了。</p>

<h3 id="现象">
<a id="现象" class="anchor" href="#%E7%8E%B0%E8%B1%A1" aria-hidden="true"><span class="octicon octicon-link"></span></a>现象</h3>

<p>当我们在 Go 语言中使用 <code>select</code> 控制结构时，其实会遇到两个非常有趣的问题，一个是 <code>select</code> 能在 Channel 上进行<strong>非阻塞</strong>的收发操作，另一个是 <code>select</code> 在遇到多个 Channel 同时响应时能够随机挑选 <code>case</code> 执行。</p>

<h4 id="非阻塞的收发">
<a id="非阻塞的收发" class="anchor" href="#%E9%9D%9E%E9%98%BB%E5%A1%9E%E7%9A%84%E6%94%B6%E5%8F%91" aria-hidden="true"><span class="octicon octicon-link"></span></a>非阻塞的收发</h4>

<p>如果一个 <code>select</code> 控制结构中包含一个 <code>default</code> 表达式，那么这个 <code>select</code> 并不会等待其它的 Channel 准备就绪，而是会非阻塞地读取或者写入数据：</p>

<pre><code class="language-bash">func main() {
	ch := make(chan int)
	select {
	case i := <-ch:
		println(i)

	default:
		println("default")
	}
}

$ go run main.go
default
</code></pre>

<p>当我们运行上面的代码时其实也并不会阻塞当前的 Goroutine，而是会直接执行 <code>default</code> 条件中的内容并返回。</p>

<h4 id="随机执行">
<a id="随机执行" class="anchor" href="#%E9%9A%8F%E6%9C%BA%E6%89%A7%E8%A1%8C" aria-hidden="true"><span class="octicon octicon-link"></span></a>随机执行</h4>

<p>另一个使用 <code>select</code> 遇到的情况其实就是同时有多个 <code>case</code> 就绪后，<code>select</code> 如何进行选择的问题，我们通过下面的代码可以简单了解一下：</p>

<pre><code class="language-bash">func main() {
	ch := make(chan int)
	go func() {
		for range time.Tick(1 * time.Second) {
			ch <- 0
		}
	}()

	for {
		select {
		case <-ch:
			println("case1")

		case <-ch:
			println("case2")
		}
	}
}

$ go run main.go
case1
case2
case1
case2
case2
case1
...
</code></pre>

<p>从上述代码输出的结果中我们可以看到，<code>select</code> 在遇到两个 <code><-ch</code> 同时响应时其实会随机选择一个 <code>case</code> 执行其中的表达式，我们会在这一节中介绍这一现象的实现原理。</p>

<h2 id="编译期间">
<a id="编译期间" class="anchor" href="#%E7%BC%96%E8%AF%91%E6%9C%9F%E9%97%B4" aria-hidden="true"><span class="octicon octicon-link"></span></a>编译期间</h2>

<p><code>select</code> 语句在编译期间会被转换成 <code>OSELECT</code> 节点，每一个 <code>OSELECT</code> 节点都会持有一系列的 <code>OCASE</code> 节点，如果 <code>OCASE</code> 节点的都是空的，就意味着这是一个 <code>default</code> 节点:</p>

<p><img src="https://static.studygolang.com/190331/468525b30045eb0b38ddad5d54b05ed5.png" alt="Golang-Select-Case-Struct"/></p>

<p>上图展示的其实就是 <code>select</code> 在编译期间的结构，每一个 <code>OCASE</code> 既包含了执行条件也包含了满足条件后执行的代码，我们在这一节中就会介绍 <code>select</code> 语句在编译期间进行的优化和转换。</p>

<p>编译器在中间代码生成期间会根据 <code>select</code> 中 <code>case</code> 的不同对控制语句进行优化，这一过程其实都发生在 <code>walkselectcases</code> 函数中，我们在这里会分四种情况分别介绍优化的过程和结果：</p>

<ol>
  <li>
<code>select</code> 中不存在任何的 <code>case</code>；</li>
  <li>
<code>select</code> 中只存在一个 <code>case</code>；</li>
  <li>
<code>select</code> 中存在两个 <code>case</code>，其中一个 <code>case</code> 是 <code>default</code> 语句；</li>
  <li>通用的 <code>select</code> 条件；</li>
</ol>

<p>我们会按照这四种不同的情况拆分 <code>walkselectcases</code> 函数并分别介绍不同场景下优化的结果。</p>

<h3 id="直接阻塞">
<a id="直接阻塞" class="anchor" href="#%E7%9B%B4%E6%8E%A5%E9%98%BB%E5%A1%9E" aria-hidden="true"><span class="octicon octicon-link"></span></a>直接阻塞</h3>

<p>首先介绍的其实就是最简单的情况，也就是当 <code>select</code> 结构中不包含任何的 <code>case</code> 时，编译器是如何进行处理的：</p>

<pre><code class="language-go">func walkselectcases(cases *Nodes) []*Node {
	n := cases.Len()

	if n == 0 {
		return []*Node{mkcall("block", nil, nil)}
	}
	// ...
}
</code></pre>

<p>这段代码非常简单并且容易理解，它直接将类似 <code>select {}</code> 的空语句，转换成对 <code>block</code> 函数的调用：</p>

<pre><code class="language-go">func block() {
	gopark(nil, nil, waitReasonSelectNoCases, traceEvGoStop, 1)
}
</code></pre>

<p><code>block</code> 函数的实现非常简单，它会运行 <code>gopark</code> 让出当前 Goroutine 对处理器的使用权，该 Goroutine 也会进入永久休眠的状态也没有办法被其他的 Goroutine 唤醒，我们可以看到调用 <code>gopark</code> 方法时传入的等待原因是 <code>waitReasonSelectNoCases</code>，这其实也在告诉我们一个空的 <code>select</code> 语句会直接阻塞当前的 Goroutine。</p>

<h3 id="独立情况">
<a id="独立情况" class="anchor" href="#%E7%8B%AC%E7%AB%8B%E6%83%85%E5%86%B5" aria-hidden="true"><span class="octicon octicon-link"></span></a>独立情况</h3>

<p>如果当前的 <code>select</code> 条件只包含一个 <code>case</code>，那么就会就会执行如下的优化策略将原来的 <code>select</code> 语句改写成 <code>if</code> 条件语句，下面是在 <code>select</code> 中从 Channel 接受数据时被改写的情况：</p>

<pre><code class="language-go">select {
case v, ok <-ch:
    // ...    
}

if ch == nil {
    block()
}
v, ok := <-ch
// ...
</code></pre>

<p>在 <code>walkselectcases</code> 函数中，如果只包含一个发送的 <code>case</code>，那么就不会包含 <code>v, ok := <- ch</code> 这个表达式，因为向 Channel 发送数据并没有任何的返回值。</p>

<p>我们可以看到如果在 <code>select</code> 中仅存在一个 <code>case</code>，那么当 <code>case</code> 中处理的 Channel 是空指针时，就会发生和没有 <code>case</code> 的 <code>select</code> 语句一样的情况，也就是直接挂起当前 Goroutine 并且永远不会被唤醒。</p>

<h3 id="非阻塞操作">
<a id="非阻塞操作" class="anchor" href="#%E9%9D%9E%E9%98%BB%E5%A1%9E%E6%93%8D%E4%BD%9C" aria-hidden="true"><span class="octicon octicon-link"></span></a>非阻塞操作</h3>

<p>在下一次的优化策略执行之前，<code>walkselectcases</code> 函数会先将 <code>case</code> 中所有 Channel 都转换成指向 Channel 的地址以便于接下来的优化和通用逻辑的执行，改写之后就会进行最后一次的代码优化，触发的条件就是 — <code>select</code> 中包含两个 <code>case</code>，但是其中一个是 <code>default</code>，我们可以分成发送和接收两种情况介绍处理的过程。</p>

<h4 id="发送">
<a id="发送" class="anchor" href="#%E5%8F%91%E9%80%81" aria-hidden="true"><span class="octicon octicon-link"></span></a>发送</h4>

<p>首先就是 Channel 的发送过程，也就是 <code>case</code> 中的表达式是 <code>OSEND</code> 类型，在这种情况下会使用 <code>if/else</code> 语句改写代码：</p>

<pre><code class="language-go">select {
case ch <- i:
    // ...
default:
    // ...
}

if selectnbsend(ch, i) {
    // ...
} else {
    // ...
}
</code></pre>

<p>这里最重要的函数其实就是 <code>selectnbsend</code>，它的主要作用就是非阻塞地向 Channel 中发送数据，我们在 <a href="https://draveness.me/golang-channel">Channel</a> 一节曾经提到过发送数据的 <code>chansend</code> 函数包含一个 <code>block</code> 参数，这个参数会决定这一次的发送是不是阻塞的：</p>

<pre><code class="language-go">func selectnbsend(c *hchan, elem unsafe.Pointer) (selected bool) {
	return chansend(c, elem, false, getcallerpc())
}
</code></pre>

<p>在这里我们只需要知道当前的发送过程不是阻塞的，哪怕是没有接收方、缓冲区空间不足导致失败了也会立即返回。</p>

<h4 id="接收">
<a id="接收" class="anchor" href="#%E6%8E%A5%E6%94%B6" aria-hidden="true"><span class="octicon octicon-link"></span></a>接收</h4>

<p>由于从 Channel 中接收数据可能会返回一个或者两个值，所以这里的情况会比发送时稍显复杂，不过改写的套路和逻辑确是差不多的：</p>

<pre><code class="language-go">select {
case v <- ch: // case v, received <- ch:
    // ...
default:
    // ...
}

if selectnbrecv(&v, ch) { // if selectnbrecv2(&v, &received, ch) {
    // ...
} else {
    // ...
}
</code></pre>

<p>返回值数量不同会导致最终使用函数的不同，两个用于非阻塞接收消息的函数 <code>selectnbrecv</code> 和 <code>selectnbrecv2</code> 其实只是对 <code>chanrecv</code> 返回值的处理稍有不同：</p>

<pre><code class="language-go">func selectnbrecv(elem unsafe.Pointer, c *hchan) (selected bool) {
	selected, _ = chanrecv(c, elem, false)
	return
}

func selectnbrecv2(elem unsafe.Pointer, received *bool, c *hchan) (selected bool) {
	selected, *received = chanrecv(c, elem, false)
	return
}
</code></pre>

<p>因为接收方不需要，所以 <code>selectnbrecv</code> 会直接忽略返回的布尔值，而 <code>selectnbrecv2</code> 会将布尔值回传给上层；与 <code>chansend</code> 一样，<code>chanrecv</code> 也提供了一个 <code>block</code> 参数用于控制这一次接收是否阻塞。</p>

<h3 id="通用情况">
<a id="通用情况" class="anchor" href="#%E9%80%9A%E7%94%A8%E6%83%85%E5%86%B5" aria-hidden="true"><span class="octicon octicon-link"></span></a>通用情况</h3>

<p>在默认的情况下，<code>select</code> 语句会在编译阶段经过如下过程的处理：</p>

<ol>
  <li>将所有的 <code>case</code> 转换成包含 Channel 以及类型等信息的 <code>scase</code> 结构体；</li>
  <li>调用运行时函数 <code>selectgo</code> 获取被选择的 <code>scase</code> 结构体索引，如果当前的 <code>scase</code> 是一个接收数据的操作，还会返回一个指示当前 <code>case</code> 是否是接收的布尔值；</li>
  <li>通过 <code>for</code> 循环生成一组 <code>if</code> 语句，在语句中判断自己是不是被选中的 <code>case</code>
</li>
</ol>

<p>一个包含三个 <code>case</code> 的正常 <code>select</code> 语句其实会被展开成如下所示的逻辑，我们可以看到其中处理的三个部分：</p>

<pre><code class="language-go">selv := [3]scase{}
order := [6]uint16
for i, cas := range cases {
    c := scase{}
    c.kind = ...
    c.elem = ...
    c.c = ...
}
chosen, revcOK := selectgo(selv, order, 3)
if chosen == 0 {
    // ...
    break
}
if chosen == 1 {
    // ...
    break
}
if chosen == 2 {
    // ...
    break
}
</code></pre>

<p>展开后的 <code>select</code> 其实包含三部分，最开始初始化数组并转换 <code>scase</code> 结构体，使用 <code>selectgo</code> 选择执行的 <code>case</code> 以及最后通过 <code>if</code> 判断选中的情况并执行 <code>case</code> 中的表达式，需要注意的是这里其实也仅仅展开了 <code>select</code> 控制结构，<code>select</code> 语句执行最重要的过程其实也是选择 <code>case</code> 执行的过程，这是我们在下一节运行��重点介绍的。</p>

<h2 id="运行时">
<a id="运行时" class="anchor" href="#%E8%BF%90%E8%A1%8C%E6%97%B6" aria-hidden="true"><span class="octicon octicon-link"></span></a>运行时</h2>

<p>我们已经充分地了解了 <code>select</code> 在编译期间的处理过程，接下来可以展开介绍 <code>selectgo</code> 函数的实现原理了。</p>

<pre><code class="language-go">func selectgo(cas0 *scase, order0 *uint16, ncases int) (int, bool) {
}
</code></pre>

<p><code>selectgo</code> 是会在运行期间运行的函数，这个函数的主要作用就是从 <code>select</code> 控制结构中的多个 <code>case</code> 中选择一个需要执行的 <code>case</code>，随后的多个 <code>if</code> 条件语句就会根据 <code>selectgo</code> 的返回值执行相应的语句。</p>

<h3 id="初始化">
<a id="初始化" class="anchor" href="#%E5%88%9D%E5%A7%8B%E5%8C%96" aria-hidden="true"><span class="octicon octicon-link"></span></a>初始化</h3>

<p><code>selectgo</code> 函数首先会进行执行必要的一些初始化操作，也就是决定处理 <code>case</code> 的两个顺序，其中一个是 <code>pollOrder</code> 另一个是 <code>lockOrder</code>：</p>

<pre><code class="language-go">func selectgo(cas0 *scase, order0 *uint16, ncases int) (int, bool) {
	cas1 := (*[1 << 16]scase)(unsafe.Pointer(cas0))
	order1 := (*[1 << 17]uint16)(unsafe.Pointer(order0))

	scases := cas1[:ncases:ncases]
	pollorder := order1[:ncases:ncases]
	lockorder := order1[ncases:][:ncases:ncases]

	for i := range scases {
		cas := &scases[i]
		if cas.c == nil && cas.kind != caseDefault {
			*cas = scase{}
		}
	}

	for i := 1; i < ncases; i++ {
		j := fastrandn(uint32(i + 1))
		pollorder[i] = pollorder[j]
		pollorder[j] = uint16(i)
	}

	// sort the cases by Hchan address to get the locking order.
	// ...
	
	sellock(scases, lockorder)

	// ...
}
</code></pre>

<p>Channel 的轮询顺序是通过 <code>fastrandn</code> 随机生成的，这其实就导致了如果多个 Channel 同时『响应』，<code>select</code> 会随机选择其中的一个执行；而另一个 <code>lockOrder</code> 就是根据 Channel 的地址确定的，根据相同的顺序锁定 Channel 能够避免死锁的发生，最后调用的 <code>sellock</code> 就会按照之前生成的顺序锁定所有的 Channel。</p>

<h3 id="循环">
<a id="循环" class="anchor" href="#%E5%BE%AA%E7%8E%AF" aria-hidden="true"><span class="octicon octicon-link"></span></a>循环</h3>

<p>当我们为 <code>select</code> 语句确定了轮询和锁定的顺序并锁定了所有的 Channel 之后就会开始进入 <code>select</code> 的主循环，查找或者等待 Channel 准备就绪，循环中会遍历所有的 <code>case</code> 并找到需要被唤起的 <code>sudog</code> 结构体，在这段循环的代码中，我们会分四种不同的情况处理 <code>select</code> 中的多个 <code>case</code>：</p>

<ol>
  <li>
<code>caseNil</code> — 当前 <code>case</code> 不包含任何的 Channel，就直接会被跳过；</li>
  <li>
<code>caseRecv</code> — 当前 <code>case</code> 会从 Channel 中接收数据；
    <ul>
      <li>如果当前 Channel 的 <code>sendq</code> 上有等待的 Goroutine 就会直接跳到 <code>recv</code> 标签所在的代码段，从 Goroutine 中获取最新发送的数据；</li>
      <li>如果当前 Channel 的缓冲区不为空就会跳到 <code>bufrecv</code> 标签处从缓冲区中获取数据；</li>
      <li>如果当前 Channel 已经被关闭就会跳到 <code>rclose</code> 做一些清除的收尾工作；</li>
    </ul>
  </li>
  <li>
<code>caseSend</code> — 当前 <code>case</code> 会向 Channel 发送数据；
    <ul>
      <li>如果当前 Channel 已经被关闭就会直接跳到 <code>rclose</code> 代码段；</li>
      <li>如果当前 Channel 的 <code>recvq</code> 上有等待的 Goroutine 就会跳到 <code>send</code> 代码段向 Channel 直接发送数据；</li>
    </ul>
  </li>
  <li>
<code>caseDefault</code> — 当前 <code>case</code> 表示默认情况，如果循环执行到了这种情况就表示前面的所有 <code>case</code> 都没有被执行，所以这里会直接解锁所有的 Channel 并退出 <code>selectgo</code> 函数，这时也就意味着当前 <code>select</code> 结构中的其他收发语句都是非阻塞的。</li>
</ol>

<p><img src="https://static.studygolang.com/190331/fb9dca4d0e72ab090d8e8617da913a77.png" alt="Golang-Select-Go-Loop"/></p>

<blockquote>
  <p>相关的代码其实还是比较长的，为了阅读的体验这里没有展示，但是通过描述和流程图也能清晰地展示具体的执行过程，仍然想要了解相关代码的读者可以查看 <a href="https://github.com/golang/go/blob/master/src/runtime/select.go#L219-L272">select.go</a> 文件。</p>
</blockquote>

<p>这其实是循环执行的第一次遍历，主要作用就是寻找所有 <code>case</code> 中 Channel 是否有可以立刻被处理的情况，无论是在包含等待的 Goroutine 还是缓冲区中存在数据，只要满足条件就会立刻处理，如果不能立刻找到活跃的 Channel 就会进入循环的下一个过程，按照需要将当前的 Goroutine 加入到所有 Channel 的 <code>sendq</code> 或者 <code>recvq</code> 队列中：</p>

<pre><code class="language-go">func selectgo(cas0 *scase, order0 *uint16, ncases int) (int, bool) {
	// ...
	gp = getg()
	nextp = &gp.waiting
	for _, casei := range lockorder {
		casi = int(casei)
		cas = &scases[casi]
		if cas.kind == caseNil {
			continue
		}
		c = cas.c
		sg := acquireSudog()
		sg.g = gp
		sg.isSelect = true
		sg.elem = cas.elem
		sg.c = c
		*nextp = sg
		nextp = &sg.waitlink

		switch cas.kind {
		case caseRecv:
			c.recvq.enqueue(sg)

		case caseSend:
			c.sendq.enqueue(sg)
		}
	}

	gp.param = nil
	gopark(selparkcommit, nil, waitReasonSelect, traceEvGoBlockSelect, 1)

	// ...
}
</code></pre>

<p>这里创建 <code>sudog</code> 并入队的过程其实和 <a href="https://draveness.me/golang-channel">Channel</a> 中直接进行发送和接收时的过程几乎完全相同，只是除了在入队之外，这些 <code>sudog</code> 结构体都会被串成链表附着在当前 Goroutine 上，在入队之后会调用 <code>gopark</code> 函数挂起当前的 Goroutine 等待调度器的唤醒。</p>

<p><img src="https://static.studygolang.com/190331/e616089232b9bee57ee5f0dd02ba7f77.png" alt="Golang-Select-Waiting"/></p>

<p>等到 <code>select</code> 对应的一些 Channel 准备好之后，当前 Goroutine 就会被调度器唤醒，这时就会继续执行 <code>selectgo</code> 函数中剩下的逻辑，也就是从上面 入队的 <code>sudog</code> 结构体中获取数据：</p>

<pre><code class="language-go">func selectgo(cas0 *scase, order0 *uint16, ncases int) (int, bool) {
	// ...
	gp.selectDone = 0
	sg = (*sudog)(gp.param)
	gp.param = nil

	casi = -1
	cas = nil
	sglist = gp.waiting
	gp.waiting = nil

	for _, casei := range lockorder {
		k = &scases[casei]
		if sg == sglist {
			casi = int(casei)
			cas = k
		} else {
			if k.kind == caseSend {
				c.sendq.dequeueSudoG(sglist)
			} else {
				c.recvq.dequeueSudoG(sglist)
			}
		}
		sgnext = sglist.waitlink
		sglist.waitlink = nil
		releaseSudog(sglist)
		sglist = sgnext
	}

	c = cas.c

	if cas.kind == caseRecv {
		recvOK = true
	}

	selunlock(scases, lockorder)
	goto retc
	// ...
}
</code></pre>

<p>在第三次根据 <code>lockOrder</code> 遍历全部 <code>case</code> 的过程中，我们会先获取 Goroutine 接收到的参数 <code>param</code>，这个参数其实就是被唤醒的 <code>sudog</code> 结构，我们会依次对比所有 <code>case</code> 对应的 <code>sudog</code> 结构找到被唤醒的 <code>case</code> 并释放其他未被使用的 <code>sudog</code> 结构。</p>

<p>由于当前的 <code>select</code> 结构已经挑选了其中的一个 <code>case</code> 进行执行，那么剩下 <code>case</code> 中没有被用到的 <code>sudog</code> 其实就会直接忽略并且释放掉了，为了不影响 Channel 的正常使用，我们还是需要将这些���弃的 <code>sudog</code> 从 Channel 中出队；而除此之外的发生事件导致我们被唤醒的 <code>sudog</code> 结构已经在 Channel 进行收发时就已经出队了，不需要我们再次处理，出队的代码以及相关分析其实都在 <a href="https://draveness.me/golang-channel">Channel</a> 一节中发送和接收的章节。</p>

<p>当我们在循环中发现缓冲区中有元素或者缓冲区未满时就会通过 <code>goto</code> 关键字跳转到以下的两个代码段，这两段代码的执行过程其实都非常简单，都只是向 Channel 中发送或者从缓冲区中直接获取新的数据：</p>

<pre><code class="language-go">bufrecv:
	recvOK = true
	qp = chanbuf(c, c.recvx)
	if cas.elem != nil {
		typedmemmove(c.elemtype, cas.elem, qp)
	}
	typedmemclr(c.elemtype, qp)
	c.recvx++
	if c.recvx == c.dataqsiz {
		c.recvx = 0
	}
	c.qcount--
	selunlock(scases, lockorder)
	goto retc

bufsend:
	typedmemmove(c.elemtype, chanbuf(c, c.sendx), cas.elem)
	c.sendx++
	if c.sendx == c.dataqsiz {
		c.sendx = 0
	}
	c.qcount++
	selunlock(scases, lockorder)
	goto retc
</code></pre>

<p>这里在缓冲区中进行的操作和直接对 Channel 调用 <code>chansend</code> 和 <code>chanrecv</code> 进行收发的过程差不多，执行结束之后就会直接跳到 <code>retc</code> 字段。</p>

<p>两个直接收发的情况，其实也就是调用 Channel 运行时的两个方法 <code>send</code> 和 <code>recv</code>，这两个方法会直接操作对应的 Channel：</p>

<pre><code class="language-go">recv:
	recv(c, sg, cas.elem, func() { selunlock(scases, lockorder) }, 2)
	recvOK = true
	goto retc

send:
	send(c, sg, cas.elem, func() { selunlock(scases, lockorder) }, 2)
	goto retc
</code></pre>

<p>不过当发送或者接收时，情况就稍微有一点复杂了，从一个关闭 Channel 中接收数据会直接清除 Channel 中的相关内容，而向一个关闭的 Channel 发送数据就会直接 <code>panic</code> 造成程序崩溃：</p>

<pre><code class="language-go">rclose:
	selunlock(scases, lockorder)
	recvOK = false
	if cas.elem != nil {
		typedmemclr(c.elemtype, cas.elem)
	}
	goto retc

sclose:
	selunlock(scases, lockorder)
	panic(plainError("send on closed channel"))
</code></pre>

<p>总体来看，Channel 相关的收发操作和上一节 <a href="https://draveness.me/golang-channel">Channel</a> 实现原理中介绍的没有太多出入，只是由于 <code>select</code> 多出了 <code>default</code> 关键字所以会出现非阻塞收发的情况。</p>

<h2 id="总结">
<a id="总结" class="anchor" href="#%E6%80%BB%E7%BB%93" aria-hidden="true"><span class="octicon octicon-link"></span></a>总结</h2>

<p>到这一节的最后我们需要总结一下，<code>select</code> 结构的执行过程与实现原理，首先在编译期间，Go 语言会对 <code>select</code> 语句进行优化，以下是根据 <code>select</code> 中语句的不同选择了不同的优化路径：</p>

<ol>
  <li>空的 <code>select</code> 语句会被直接转换成 <code>block</code> 函数的调用，直接挂起当前 Goroutine；</li>
  <li>如果 <code>select</code> 语句中只包含一个 <code>case</code>，就会被转换成 <code>if ch == nil { block }; n;</code> 表达式；
    <ul>
      <li>首先判断操作的 Channel 是不是空的；</li>
      <li>然后执行 <code>case</code> 结构中的内容；</li>
    </ul>
  </li>
  <li>如果 <code>select</code> 语句中只包含两个 <code>case</code> 并且其中一个是 <code>default</code>，那么 Channel 和接收和发送操作都会使用 <code>selectnbrecv</code> 和 <code>selectnbsend</code> 非阻塞地执行接收和发送操作；</li>
  <li>在默认情况下会通过 <code>selectgo</code> 函数选择需要执行的 <code>case</code> 并通过多个 <code>if</code> 语句执行 <code>case</code> 中的表达式；</li>
</ol>

<p>在编译器已经对 <code>select</code> 语句进行优化之后，Go 语言会在运行时执行编译期间展开的 <code>selectgo</code> 函数，这个函数会按照以下的过程执行：</p>

<ol>
  <li>随机生成一个遍历的轮询顺序 <code>pollOrder</code> 并根据 Channel 地址生成一个用于遍历的锁定顺序 <code>lockOrder</code>；</li>
  <li>根据 <code>pollOrder</code> 遍历所有的 <code>case</code> 查看是否有可以立刻处理的 Channel 消息；
    <ol>
      <li>如果有消息就直接获取 <code>case</code> 对应的索引并返回；</li>
    </ol>
  </li>
  <li>如果没有消息就会创建 <code>sudog</code> 结构体，将当前 Goroutine 加入到所有相关 Channel 的 <code>sendq</code> 和 <code>recvq</code> 队列中并调用 <code>gopark</code> 触发调度器的调度；</li>
  <li>当调度器唤醒当前 Goroutine 时就会再次按照 <code>lockOrder</code> 遍历所有的 <code>case</code>，从中查找需要被处理的 <code>sudog</code> 结构并返回对应的索引；</li>
</ol>

<p>然而并不是所有的 <code>select</code> 控制结构都会走到 <code>selectgo</code> 上，很多情况都会被直接优化掉，没有机会调用 <code>selectgo</code> 函数。</p>

<p>Go 语言中的 <code>select</code> 关键字与 IO 多路复用中的 <code>select</code>、<code>epoll</code> 等函数非常相似，不但 Channel 的收发操作与等待 IO 的读写能找到这种一一对应的关系，这两者的作用也非常相似；总的来说，<code>select</code> 关键字的实现原理稍显复杂，与 <a href="https://draveness.me/golang-channel">Channel</a> 的关系非常紧密，这里省略了很多 Channel 操作的细节，数据结构一章其实就介绍了 <a href="https://draveness.me/golang-channel">Channel</a> 收发的相关细节。</p>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						