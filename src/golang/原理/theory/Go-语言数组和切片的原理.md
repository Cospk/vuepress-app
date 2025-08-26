---
title: Go 语言数组和切片的原理
source_url: 'https://studygolang.com/articles/19057'
category: Go原理教程
---


						<p>数组和切片是 Go 语言中常见的数据结构，很多刚刚使用 Go 的开发者往往会混淆这两个概念，数组作为最常见的集合在编程语言中是非常重要的，除了数组之外，Go 语言引入了另一个概念 — 切片，切片与数组有一些类似，但是它们的不同之处导致使用上会产生巨大的差别。</p>

<p>这里我们将从 Go 语言 <a href="https://draveness.me/golang-compile-intro">编译期间</a> 的工作和运行时来介绍数组以及切片的底层实现原理，其中会包括数组的初始化以及访问、切片的结构和常见的基本操作。</p>

<h2 id="数组">
<a id="数组" class="anchor" href="#%E6%95%B0%E7%BB%84" aria-hidden="true"><span class="octicon octicon-link"></span></a>数组</h2>

<p>数组是由相同类型元素的集合组成的数据结构，计算机会为数组分配一块连续的内存来保存数组中的元素，我们可以利用数组中元素的索引快速访问元素对应的存储地址，常见的数组大多都是一维的线性数组，而多维数组在数值和图形计算领域却有比较常见的应用。</p>

<p><img src="https://static.studygolang.com/190331/78c06eaba0f32c619b1b897af6258dc3.jpg" alt="3D-array"/></p>

<p>数组作为一种数据类型，一般情况下由两部分组成，其中一部分表示了数组中存储的元素类型，另一部分表示数组最大能够存储的元素个数，Go 语言的数组类型一般是这样的：</p>

<pre><code class="language-go">[10]int
[200]interface{}
</code></pre>

<p>Go 语言中数组的大小在初始化之后就无法改变，数组存储元素的类型相同，但是大小不同的数组类型在 Go 语言看来也是完全不同的，只有两个条件都相同才是同一个类型。</p>

<pre><code class="language-go">func NewArray(elem *Type, bound int64) *Type {
	if bound < 0 {
		Fatalf("NewArray: invalid bound %v", bound)
	}
	t := New(TARRAY)
	t.Extra = &Array{Elem: elem, Bound: bound}
	t.SetNotInHeap(elem.NotInHeap())
	return t
}
</code></pre>

<p>编译期间的数组类型 <code>Array</code> 就包含两个结构，一个是元素类型 <code>Elem</code>，另一个是数组的大小上限 <code>Bound</code>，这两个字段构成了数组类型，而当前数组是否应该在堆栈中初始化也在编译期间就确定了。</p>

<h3 id="创建">
<a id="创建" class="anchor" href="#%E5%88%9B%E5%BB%BA" aria-hidden="true"><span class="octicon octicon-link"></span></a>创建</h3>

<p>Go 语言中的数组有两种不同的创建方式，一种是我们显式指定数组的大小，另一种是编译器通过源代码自行推断数组的大小：</p>

<pre><code class="language-go">arr1 := [3]int{1, 2, 3}
arr2 := [...]int{1, 2, 3}
</code></pre>

<p>后一种声明方式在编译期间就会被『转换』成为���一种，下面我们先来介绍数组大小的编译期推导过程。</p>

<h4 id="上限推导">
<a id="上限推导" class="anchor" href="#%E4%B8%8A%E9%99%90%E6%8E%A8%E5%AF%BC" aria-hidden="true"><span class="octicon octicon-link"></span></a>上限推导</h4>

<p>这两种不同的方式会导致编译器做出不同的处理，如果我们使用第一种方式 <code>[10]T</code>，那么变量的类型在编译进行到 <a href="https://draveness.me/golang-typecheck">类型检查</a> 阶段就会被推断出来，在这时编译器会使用 <code>NewArray</code> 创建包含数组大小的 <code>Array</code> 类型，而如果使用 <code>[...]T</code> 的方式，虽然在这一步也会创建一个 <code>Array</code> 类型 <code>Array{Elem: elem, Bound: -1}</code>，但是其中的数组大小上限会是 <code>-1</code>  的结构，这意味着还需要后面的 <code>typecheckcomplit</code> 函数推导该数组的大小：</p>

<pre><code class="language-go">func typecheckcomplit(n *Node) (res *Node) {
	// ...

	switch t.Etype {
	case TARRAY, TSLICE:
		var length, i int64
		nl := n.List.Slice()
		for i2, l := range nl {
			i++
			if i > length {
				length = i
			}
		}

		if t.IsDDDArray() {
			t.SetNumElem(length)
		}
	}
}
</code></pre>

<p>这个删减后的 <code>typecheckcomplit</code> 函数通过遍历元素来推导当前数组的长度，我们能看出 <code>[...]T</code> 类型的声明不是在运行时被推导的，它会在类型检查期间就被推断出正确的数组大小。</p>

<h4 id="语句转换">
<a id="语句转换" class="anchor" href="#%E8%AF%AD%E5%8F%A5%E8%BD%AC%E6%8D%A2" aria-hidden="true"><span class="octicon octicon-link"></span></a>语句转换</h4>

<p>虽然 <code>[...]T{1, 2, 3}</code> 和 <code>[3]T{1, 2, 3}</code> 在运行时是完全等价的，但是这种简短的初始化方式也只是 Go 语言为我们提供的一种语法糖，对于一个由字面量组成的数组，根据数组元素数量的不同，编译器会在负责初始化字面量的 <code>anylit</code> 函数中做两种不同的优化：</p>

<pre><code class="language-go">func anylit(n *Node, var_ *Node, init *Nodes) {
	t := n.Type
	switch n.Op {
	case OSTRUCTLIT, OARRAYLIT:
		if n.List.Len() > 4 {
			vstat := staticname(t)
			vstat.Name.SetReadonly(true)

			fixedlit(inNonInitFunction, initKindStatic, n, vstat, init)

			a := nod(OAS, var_, vstat)
			a = typecheck(a, ctxStmt)
			a = walkexpr(a, init)
			init.Append(a)
			break
		}


		fixedlit(inInitFunction, initKindLocalCode, n, var_, init)
	// ...
	}
}
</code></pre>

<ol>
  <li>当元素数量小于或者等于 4 个时，会直接将数组中的元素放置在栈上；</li>
  <li>当元素数量大于 4 个时，会将数组中的元素放置到静态区并在运行时取出；</li>
</ol>

<p>当数组的元素<strong>小于或者等于四个</strong>时，<code>fixedlit</code> 会负责在函数编译之前将批了语法糖外衣的代码转换成原有的样子：</p>

<pre><code class="language-go">func fixedlit(ctxt initContext, kind initKind, n *Node, var_ *Node, init *Nodes) {
	var splitnode func(*Node) (a *Node, value *Node)
	// ...

	for _, r := range n.List.Slice() {
		a, value := splitnode(r)

		a = nod(OAS, a, value)
		a = typecheck(a, ctxStmt)
		switch kind {
		case initKindStatic:
			genAsStatic(a)
		case initKindLocalCode:
			a = orderStmtInPlace(a, map[string][]*Node{})
			a = walkstmt(a)
			init.Append(a)
		default:
			Fatalf("fixedlit: bad kind %d", kind)
		}
	}
}
</code></pre>

<p>由于传入的类型是 <code>initKindLocalCode</code>，上述代码会将原有的初始化语法拆分成一个声明变量的语句和 N 个用于赋值的语句：</p>

<pre><code class="language-go">var arr [3]int
arr[0] = 1
arr[1] = 2
arr[2] = 3
</code></pre>

<p>但是如果当前数组的元素大于 4 个时，<code>anylit</code> 方法会先获取一个唯一的 <code>staticname</code>，然后调用 <code>fixedlit</code> 函数在静态存储区初始化数组中的元素并将临时变量赋值给当前的数组：</p>

<pre><code class="language-go">func fixedlit(ctxt initContext, kind initKind, n *Node, var_ *Node, init *Nodes) {
	var splitnode func(*Node) (a *Node, value *Node)
	// ...

	for _, r := range n.List.Slice() {
		a, value := splitnode(r)

		setlineno(value)
		a = nod(OAS, a, value)
		a = typecheck(a, ctxStmt)
		switch kind {
		case initKindStatic:
			genAsStatic(a)
		default:
			Fatalf("fixedlit: bad kind %d", kind)
		}

	}
}
</code></pre>

<p>假设，我们在代码中初始化 <code>[]int{1, 2, 3, 4, 5}</code> 数组，那么我们可以将上述过程理解成以下的伪代码：</p>

<pre><code class="language-go">var arr [5]int
statictmp_0[0] = 1
statictmp_0[1] = 2
statictmp_0[2] = 3
statictmp_0[3] = 4
statictmp_0[4] = 5
arr = statictmp_0
</code></pre>

<p>总结起来，如果数组中元素的个数小于或者等于 4 个，那么所有的变量会直接在栈上初始化，如果数组元素大于 4 个，变量就会在静态存储区初始化然后拷贝到栈上，这些转换后的代码才会继续进入 <a href="https://draveness.me/golang-ir-ssa">中间代码生成</a> 和 <a href="https://draveness.me/golang-machinecode">机器码生成</a> 两个阶段，最后生成可以执行的二进制文件。</p>

<h3 id="访问和赋值">
<a id="访问和赋值" class="anchor" href="#%E8%AE%BF%E9%97%AE%E5%92%8C%E8%B5%8B%E5%80%BC" aria-hidden="true"><span class="octicon octicon-link"></span></a>访问和赋值</h3>

<p>无论是在栈上还是静态存储区，数组在内存中其实就是一连串的内存空间，表示数组的方法就是一个指向数组开头的指针，这一片内存空间不知道自己存储的是什么变量：</p>

<p><img src="https://static.studygolang.com/190331/8d4074628ed67eaebf9ba17d9fbd986b.png" alt="golang-array-memory"/></p>

<p>数组访问越界的判断也都是在编译期间由静态类型检查完成的，<code>typecheck1</code> 函数会对访问的数组索引进行验证：</p>

<pre><code class="language-go">func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	case OINDEX:
		ok |= ctxExpr
		l := n.Left
		r := n.Right
		t := l.Type
		switch t.Etype {
		case TSTRING, TARRAY, TSLICE:
			why := "string"
			if t.IsArray() {
				why = "array"
			} else if t.IsSlice() {
				why = "slice"
			}

			if n.Right.Type != nil && !n.Right.Type.IsInteger() {
				yyerror("non-integer %s index %v", why, n.Right)
				break
			}

			if !n.Bounded() && Isconst(n.Right, CTINT) {
				x := n.Right.Int64()
				if x < 0 {
					yyerror("invalid %s index %v (index must be non-negative)", why, n.Right)
				} else if t.IsArray() && x >= t.NumElem() {
					yyerror("invalid array index %v (out of bounds for %d-element array)", n.Right, t.NumElem())
				} else if Isconst(n.Left, CTSTR) && x >= int64(len(n.Left.Val().U.(string))) {
					yyerror("invalid string index %v (out of bounds for %d-byte string)", n.Right, len(n.Left.Val().U.(string)))
				}
			}
		}
	//...
	}
}
</code></pre>

<p>无论是编译器还是字符串，它们的越界错误都会在编译期间发现，但是数组访问操作 <code>OINDEX</code> 会在编译期间被转换成两个 SSA 指令：</p>

<pre><code class="language-go">PtrIndex <t> ptr idx
Load <t> ptr mem
</code></pre>

<p>编译器会先获取数组的内存地址和访问的下标，然后利用 <code>PtrIndex</code> 计算出目标元素的地址，再使用 <code>Load</code> 操作将指针中的元素加载到内存中。</p>

<p>数组的赋值和更新操作 <code>a[i] = 2</code> 也会生成 SSA 期间就计算出数组当前元素的内存地址，然后修改当前内存地址的内容，其实会被转换成如下所示的 SSA 操作：</p>

<pre><code class="language-go">LocalAddr {sym} base _
PtrIndex <t> ptr idx
Store {t} ptr val mem
</code></pre>

<p>在这个过程中会确实能够目标数组的地址，再通过 <code>PtrIndex</code> 获取目标元素的地址，最后将数据存入地址中，从这里我��可以看出无论是数组的寻址还是赋值都是在编译阶段完成的，没有运行时的参与。</p>

<h2 id="切片">
<a id="切片" class="anchor" href="#%E5%88%87%E7%89%87" aria-hidden="true"><span class="octicon octicon-link"></span></a>切片</h2>

<p>数组其实在 Go 语言中没有那么常用，更加常见的数据结构其实是切片，切片其实就是动态数组，它的长度并不固定，可以追加元素并会在切片容量不足时进行扩容。</p>

<p>在 Golang 中，切片类型的声明与数组有一些相似，由于切片是『动态的』，它的长度并不固定，所以声明类型时只需要指定切片中的元素类型：</p>

<pre><code class="language-go">[]int
[]interface{}
</code></pre>

<p>从这里的定义我们其实也能推测出，切片在编译期间的类型应该只会包含切片中的元素类型，<code>NewSlice</code> 就是编译期间用于创建 <code>Slice</code> 类型的函数：</p>

<pre><code class="language-go">func NewSlice(elem *Type) *Type {
	if t := elem.Cache.slice; t != nil {
		if t.Elem() != elem {
			Fatalf("elem mismatch")
		}
		return t
	}

	t := New(TSLICE)
	t.Extra = Slice{Elem: elem}
	elem.Cache.slice = t
	return t
}
</code></pre>

<p>我们可以看到上述方法返回的类型 <code>TSLICE</code> 的 <code>Extra</code> 字段是一个只包含切片内元素类型的 <code>Slice{Elem: elem}</code> 结构，也就是说切片内元素的类型是在编译期间确定的。</p>

<h3 id="结构">
<a id="结构" class="anchor" href="#%E7%BB%93%E6%9E%84" aria-hidden="true"><span class="octicon octicon-link"></span></a>结构</h3>

<p>编译期间的切片其实就是一个 <code>Slice</code> 类型，但是在运行时切片其实由如下的 <code>SliceHeader</code> 结构体表示，其中 <code>Data</code> 字段是一个指向数组的指针，<code>Len</code> 表示当前切片的长度，而 <code>Cap</code> 表示当前切片的容量，也就是 <code>Data</code> 数组的大小：</p>

<pre><code class="language-go">type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
</code></pre>

<p><code>Data</code> 作为一个指针指向的数组其实就是一片连续的内存空间，这片内存空间可以用于存储切片中保存的全部元素，数组其实就是一片连续的内存空间，数组中的元素只是逻辑上的概念，底层存储其实都是连续的，所以我们可以将切片理解成一片连续的内存空间加上长度与容量标识。</p>

<p><img src="https://static.studygolang.com/190331/d9f872aef6cc33d3a2a1a3d01cf50aa9.png" alt="golang-slice-struct"/></p>

<p>与数组不同，数组中大小、其中的元素还有对数组的访问和更新在编译期间就已经全部转换成了直接对内存的操作，但是切片是运行时才会确定的结构，所有的操作还需要依赖 Go 语言的运行时来完成，我们接下来就会介绍切片的一些常见操作的实现原理。</p>

<h3 id="初始化">
<a id="初始化" class="anchor" href="#%E5%88%9D%E5%A7%8B%E5%8C%96" aria-hidden="true"><span class="octicon octicon-link"></span></a>初始化</h3>

<p>首先需要介绍的就是切片的创建过程，Go 语言中的切片总共有两种初始化的方式，一种是使用字面量初始化新的切片，另一种是使用关键字 <code>make</code> 创建切片：</p>

<pre><code class="language-go">slice := []int{1, 2, 3}
slice := make([]int, 10)
</code></pre>

<h4 id="字面量">
<a id="字面量" class="anchor" href="#%E5%AD%97%E9%9D%A2%E9%87%8F" aria-hidden="true"><span class="octicon octicon-link"></span></a>字面量</h4>

<p>我们先来介绍如何使用字面量的方式创建新的切片结构，<code>[]int{1, 2, 3}</code> 其实会在编译期间由 <code>slicelit</code> 转换成如下所示的代码：</p>

<pre><code class="language-go">var vstat [3]int
vstat[0] = 1
vstat[1] = 2
vstat[2] = 3
var vauto *[3]int = new([3]int)
*vauto = vstat
slice := vauto[:]
</code></pre>

<ol>
  <li>根据切片中的元素数量对底层数组的大小进行推断并创建一个数组；</li>
  <li>将这些字面量元素存储到初始化的数组中；</li>
  <li>创建一个同样指向 <code>[3]int</code> 类型的数组指针；</li>
  <li>将静态存储区的数组 <code>vstat</code> 赋值给 <code>vauto</code> 指针所在的地址；</li>
  <li>通过 <code>[:]</code> 操作获取一个底层使用 <code>vauto</code> 的切片；</li>
</ol>

<p><code>[:]</code> 以及类似的操作 <code>[:10]</code> 其实都会在 <a href="https://draveness.me/golang-ir-ssa">SSA 代码生成</a> 阶段被转换成 <code>OpSliceMake</code> 操作，这个操作会接受四个参数创建一个新的切片，切片元素类型、数组指针、切片大小和容量。</p>

<h4 id="关键字">
<a id="关键字" class="anchor" href="#%E5%85%B3%E9%94%AE%E5%AD%97" aria-hidden="true"><span class="octicon octicon-link"></span></a>关键字</h4>

<p>如果使用字面量的方式创建切片，大部分的工作就都会在编译期间完成，但是当我们使用 <code>make</code> 关键字创建切片时，在 <a href="https://draveness.me/golang-typecheck">类型检查</a> 期间会检查 <code>make</code>『函数』的参数，调用方必须传入一个切片的大小以及可选的容量：</p>

<pre><code class="language-go">func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	// ...
	case OMAKE:
		args := n.List.Slice()

		i := 1
		switch t.Etype {
		case TSLICE:
			if i >= len(args) {
				yyerror("missing len argument to make(%v)", t)
				return n
			}

			l = args[i]
			i++
			var r *Node
			if i < len(args) {
				r = args[i]
			}

			// ...
			if Isconst(l, CTINT) && r != nil && Isconst(r, CTINT) && l.Val().U.(*Mpint).Cmp(r.Val().U.(*Mpint)) > 0 {
				yyerror("len larger than cap in make(%v)", t)
				return n
			}

			n.Left = l
			n.Right = r
			n.Op = OMAKESLICE
		}
	// ...
	}
}
</code></pre>

<p><code>make</code> 参数的检查都是在 <code>typecheck1</code> 函数中完成的，它不仅会检查 <code>len</code>，而且会保证传入的容量 <code>cap</code> 一定大于或者等于 <code>len</code>；随后的中间代码生成阶段会把这里的 <code>OMAKESLICE</code> 类型的操作都转换成如下所示的函数调用：</p>

<pre><code class="language-go">makeslice(type, len, cap)
</code></pre>

<p>当切片的容量和大小不能使用 <code>int</code> 来表示时，就会实现 <code>makeslice64</code> 处理容量和大小更大的切片，无论是 <code>makeslice</code> 还是 <code>makeslice64</code>，这两个方法都是在结构逃逸到堆上初始化时才需要调用的，如果当前的切片不会发生逃逸并且切片非常小的时候，<code>make([]int, 3, 4)</code> 才会被转换成如下所示的代码：</p>

<pre><code class="language-go">var arr [4]int
n := arr[:3]
</code></pre>

<p>在这时，数组的初始化和 <code>[:3]</code> 操作就都会在编译阶段完成大部分的工作，前者会在静态存储区被创建，后者会被转换成 <code>OpSliceMake</code> 操作。</p>

<p>接下来，我们回到用于创建切片的 <code>makeslice</code> 函数，这个函数的实现其实非常简单：</p>

<pre><code class="language-go">func makeslice(et *_type, len, cap int) unsafe.Pointer {
	mem, overflow := math.MulUintptr(et.size, uintptr(cap))
	if overflow || mem > maxAlloc || len < 0 || len > cap {
		mem, overflow := math.MulUintptr(et.size, uintptr(len))
		if overflow || mem > maxAlloc || len < 0 {
			panicmakeslicelen()
		}
		panicmakeslicecap()
	}

	return mallocgc(mem, et, true)
}
</code></pre>

<p>上述代码的主要工作就是用切片中元素大小和切片容量相乘计算出切片占用的内存空间，如果内存空间的大小发生了溢出、申请的内存大于最大可分配的内存、传入的长度小于 0 或者长度大于容量，那么就会直接报错，当然大多数的错误都会在编译期间就检查出来，<code>mallocgc</code> 就是用于申请内存的函数，这个函数的实现还是比较��杂，如果遇到了比较小的对象会直接初始化在 Golang 调度器里面的 P 结构中，而大于 32KB 的一些对象会在堆上初始化。</p>

<p>初始化后会返回指向这片内存空间的指针，在之前版本的 Go 语言中，指针会和长度与容量一起被合成一个 <code>slice</code> 结构返回到 <code>makeslice</code> 的调用方，但是从 <a href="https://github.com/golang/go/commit/020a18c545bf49ffc087ca93cd238195d8dcc411#diff-d9238ca551e72b3a80da9e0da10586a4">020a18c5</a> 这个 commit 开始，构建结构体 <code>SliceHeader</code> 的工作就都由上层在类型检查期间完成了：</p>

<pre><code class="language-go">func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	// ...
	case OSLICEHEADER:
	switch 
		t := n.Type
		n.Left = typecheck(n.Left, ctxExpr)
		l := typecheck(n.List.First(), ctxExpr)
		c := typecheck(n.List.Second(), ctxExpr)
		l = defaultlit(l, types.Types[TINT])
		c = defaultlit(c, types.Types[TINT])

		n.List.SetFirst(l)
		n.List.SetSecond(c)
	// ...
	}
}
</code></pre>

<p><code>OSLICEHEADER</code> 操作会创建一个如下所示的结构体，其中包含数组指针、切片长度和容量，它是切片在运行时的表示：</p>

<pre><code class="language-go">type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
</code></pre>

<p>正是因为大多数对切片类型的操作并不需要直接操作原 <code>slice</code> 结构体，所以 <code>SliceHeader</code> 的引入能够减少切片初始化时的开销，这个改动能够减少 0.2% 的 Go 语言包大小并且能够减少 92 个 <code>panicindex</code> 的调用。</p>

<h3 id="访问">
<a id="访问" class="anchor" href="#%E8%AE%BF%E9%97%AE" aria-hidden="true"><span class="octicon octicon-link"></span></a>访问</h3>

<p>对切片常见的操作就是获取它的长度或者容量，这两个不同的函数 <code>len</code> 和 <code>cap</code> 其实被 Go 语言的编译器看成是两种特殊的操作 <code>OLEN</code> 和 <code>OCAP</code>，它们会在 <a href="https://draveness.me/golang-ir-ssa">SSA 生成阶段</a> 被转换成 <code>OpSliceLen</code> 和 <code>OpSliceCap</code> 操作：</p>

<pre><code class="language-go">func (s *state) expr(n *Node) *ssa.Value {
	switch n.Op {
	case OLEN, OCAP:
		switch {
		case n.Left.Type.IsSlice():
			op := ssa.OpSliceLen
			if n.Op == OCAP {
				op = ssa.OpSliceCap
			}
			return s.newValue1(op, types.Types[TINT], s.expr(n.Left))
		// ...
		}
	// ...
	}
}
</code></pre>

<p>除了获取切片的长度和容量之外，访问切片中元素使用的 <code>OINDEX</code> 操作也都在 SSA 中间代码生成期间就转换成对地址的获取操作：</p>

<pre><code class="language-go">func (s *state) expr(n *Node) *ssa.Value {
	switch n.Op {
	case OINDEX:
		switch {
		case n.Left.Type.IsSlice():
			p := s.addr(n, false)
			return s.load(n.Left.Type.Elem(), p)
		// ...
		}
	// ...
	}
}
</code></pre>

<p>切片的操作基本都是在编译期间完成的，除了访问切片的长度、容量或者其中的元素之外，使用 <code>range</code> 遍历切片时也是在编译期间被转换成了形式更简单的代码，我们会在后面的章节中介绍 <code>range</code> 关键字的实现原理。</p>

<h3 id="追加">
<a id="追加" class="anchor" href="#%E8%BF%BD%E5%8A%A0" aria-hidden="true"><span class="octicon octicon-link"></span></a>追加</h3>

<p>向切片中追加元素应该是最常见的切片操作，在 Go 语言中我们会使用 <code>append</code> 关键字向切片中追加元素，追加元素会根据是否 <code>inplace</code> 在中间代码生成阶段转换成以下的两种不同流程，如果 <code>append</code> 之后的切片不需要赋值回原有的变量，也就是如 <code>append(slice, 1, 2, 3)</code> 所示的表达式会被转换成如下的过程：</p>

<pre><code class="language-go">ptr, len, cap := slice
newlen := len + 3
if newlen > cap {
    ptr, len, cap = growslice(slice, newlen)
    newlen = len + 3
}
*(ptr+len) = 1
*(ptr+len+1) = 2
*(ptr+len+2) = 3
return makeslice(ptr, newlen, cap)
</code></pre>

<p>我们会先对切片结构体进行解构获取它的数组指针、大小和容量，如果新的切片大小大于容量，那么就会使用 <code>growslice</code> 对切片进行扩容并将新的元素依次加入切片并创建新的切片，但是 <code>slice = apennd(slice, 1, 2, 3)</code> 这种 <code>inplace</code> 的表达式就只会改变原来的 <code>slice</code> 变量：</p>

<pre><code class="language-go">a := &slice
ptr, len, cap := slice
newlen := len + 3
if uint(newlen) > uint(cap) {
   newptr, len, newcap = growslice(slice, newlen)
   vardef(a)
   *a.cap = newcap
   *a.ptr = newptr
}
newlen = len + 3
*a.len = newlen
*(ptr+len) = 1
*(ptr+len+1) = 2
*(ptr+len+2) = 3
</code></pre>

<p>上述两段代码的逻辑其实差不多，最大的区别在于最后的结果是不是赋值会原有的变量，不过从 <code>inplace</code> 的代码可以看出 Go 语言对类似的过程进行了优化，所以我们并不需要担心 <code>append</code> 会在数组容量足够时导致发生切片的复制。</p>

<p><img src="https://static.studygolang.com/190331/564b260ac17812bda011852f19a8d7b3.png" alt="golang-slice-append"/></p>

<p>到这里我们已经了解了在切片容量足够时如何向切片中追加元素，但是如果切片的容量不足时就会调用 <code>growslice</code> 为切片扩容：</p>

<pre><code class="language-go">func growslice(et *_type, old slice, cap int) slice {
	newcap := old.cap
	doublecap := newcap + newcap
	if cap > doublecap {
		newcap = cap
	} else {
		if old.len < 1024 {
			newcap = doublecap
		} else {
			for 0 < newcap && newcap < cap {
				newcap += newcap / 4
			}
			if newcap <= 0 {
				newcap = cap
			}
		}
	}
</code></pre>

<p>扩容其实就是需要为切片分配一块新的内存空间，分配内存空间之前需要先确定新的切片容量，Go 语言根据切片的当前容量选择不同的策略进行扩容：</p>

<ol>
  <li>如果期望容量大于当前容量的两倍就会使用期望容量；</li>
  <li>如果当前切片容量小于 1024 就会将容量翻倍；</li>
  <li>如果当前切片容量大于 1024 就会每次增加 25% 的容量，直到新容量大于期望容量；</li>
</ol>

<p>确定了切片的容量之后，我们就可以开始计算切片中新数组的内存占用了，计算的方法就是将目标容量和元素大小相乘：</p>

<pre><code class="language-go">	var overflow bool
	var lenmem, newlenmem, capmem uintptr
	switch {
	// ...
	default:
		lenmem = uintptr(old.len) * et.size
		newlenmem = uintptr(cap) * et.size
		capmem, overflow = math.MulUintptr(et.size, uintptr(newcap))
		capmem = roundupsize(capmem)
		newcap = int(capmem / et.size)
	}

	var p unsafe.Pointer
	if et.kind&kindNoPointers != 0 {
		p = mallocgc(capmem, nil, false)
		memclrNoHeapPointers(add(p, newlenmem), capmem-newlenmem)
	} else {
		p = mallocgc(capmem, et, true)
		if writeBarrier.enabled {
			bulkBarrierPreWriteSrcOnly(uintptr(p), uintptr(old.array), lenmem)
		}
	}
	memmove(p, old.array, lenmem)

	return slice{p, old.len, newcap}
}
</code></pre>

<p>如果当前切片中元素不是指针类型，那么就会调用 <code>memclrNoHeapPointers</code> 函数将超出当前长度的位置置空并在最后使用 <code>memmove</code> 将原数组内存中的内容拷贝到新申请的内存中，
不过无论是 <code>memclrNoHeapPointers</code> 还是 <code>memmove</code> 函数都使用目标机器上的汇编指令进行实现，例如 WebAssembly 使用如下的命令实现 <code>memclrNoHeapPointers</code> 函数：</p>

<pre><code class="language-go">TEXT runtime·memclrNoHeapPointers(SB), NOSPLIT, $0-16
	MOVD ptr+0(FP), R0
	MOVD n+8(FP), R1

loop:
	Loop
		Get R1
		I64Eqz
		If
			RET
		End

		Get R0
		I32WrapI64
		I64Const $0
		I64Store8 $0

		Get R0
		I64Const $1
		I64Add
		Set R0

		Get R1
		I64Const $1
		I64Sub
		Set R1

		Br loop
	End
	UNDEF
</code></pre>

<p><code>growslice</code> 函数最终会返回一个新的 <code>slice</code> 结构，其中���含了新的数组指针、大小和容量，这个返回的三元组最终会改变原有的切片，帮助 <code>append</code> 完成元素追加的功能。</p>

<h3 id="拷贝">
<a id="拷贝" class="anchor" href="#%E6%8B%B7%E8%B4%9D" aria-hidden="true"><span class="octicon octicon-link"></span></a>拷贝</h3>

<p>切片的拷贝虽然不是一个常见的操作类型，但是却是我们学习切片实现原理必须要谈及的一个问题，当我们使用 <code>copy(a, b)</code> 的形式对切片进行拷贝时，编译期间会被转换成 <code>slicecopy</code> 函数：</p>

<pre><code class="language-go">func slicecopy(to, fm slice, width uintptr) int {
	if fm.len == 0 || to.len == 0 {
		return 0
	}

	n := fm.len
	if to.len < n {
		n = to.len
	}

	if width == 0 {
		return n
	}
	
	// ...

	size := uintptr(n) * width
	if size == 1 {
		*(*byte)(to.array) = *(*byte)(fm.array)
	} else {
		memmove(to.array, fm.array, size)
	}
	return n
}
</code></pre>

<p>上述函数的实现非常直接，它将切片中的全部元素通过 <code>memmove</code> 或者数组指针的方式将整块内存中的内容拷贝到目标的内存区域：</p>

<p><img src="https://static.studygolang.com/190331/0deec5b20be1d616b7939b4aa77825fe.png" alt="golang-slice-copy"/></p>

<p>相比于依次对元素进行拷贝，这种方式能够提供更好的性能，但是需要注意的是，哪怕使用 <code>memmove</code> 对内存成块进行拷贝，但是这个操作还是会占用非常多的资源，在大切片上执行拷贝操作时一定要注意性能影响。</p>

<h2 id="总结">
<a id="总结" class="anchor" href="#%E6%80%BB%E7%BB%93" aria-hidden="true"><span class="octicon octicon-link"></span></a>总结</h2>

<p>数组和切片是  Go 语言中重要的数据结构，所以了解它们的实现能够帮助我们更好地理解这门语言，通过对它们实现的分析，我们知道了数组和切片的实现同时依赖编译器和运行时两部分。</p>

<p>数组的大多数操作在 <a href="https://draveness.me/golang-compile-intro">编译期间</a> 都会转换成对内存的直接读写；而切片的很多功能就都是在运行时实现的了，无论是初始化切片，还是对切片进行追加或扩容都需要运行时的支持，需要注意的是在遇到大切片扩容或者复制时可能会发生大规模的内存拷贝，一定要在使用时减少这种情况的发生避免对程序的性能造成影响。</p>
<h2 id="reference">
<a id="reference" class="anchor" href="#reference" aria-hidden="true"><span class="octicon octicon-link"></span></a>Reference</h2>

<ul>
  <li><a href="https://blog.golang.org/slices">Arrays, slices (and strings): The mechanics of ‘append’</a></li>
  <li><a href="https://blog.golang.org/go-slices-usage-and-internals">Go Slices: usage and internals</a></li>
  <li><a href="https://stackoverflow.com/questions/30525184/array-vs-slice-accessing-speed">Array vs Slice: accessing speed</a></li>
</ul>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						