---
title: Golang 如何进行类型检查
source_url: 'https://studygolang.com/articles/19062'
category: Go原理教程
---


						<p>我们在上一节中介绍了 Golang 的第一个编译阶段 — 通过 <a href="https://draveness.me/golang-lexer-and-parser">词法和语法分析器</a> 的解析得到了抽象语法树，在这里就会继续介绍编译器执行的下一个过程 — 类型检查。</p>

<p>提到类型检查和编程语言的类型系统，很多人都会想到几个非常模糊并且难以区分和理解的术语：强类型、弱类型、静态类型和动态类型。这几个术语有的可能在并没有被广泛认同的明确定义，但是我们既然即将谈到 Go 语言编译器的类型检查过程，就不得不讨论一下这些『类型』的含义与异同。</p>

<h2 id="强弱类型">
<a id="强弱类型" class="anchor" href="#%E5%BC%BA%E5%BC%B1%E7%B1%BB%E5%9E%8B" aria-hidden="true"><span class="octicon octicon-link"></span></a>强弱类型</h2>

<p>强类型和弱类型经常会被放在一起进行讨论，然而这两者并没有一个学术上的严格定义，作者以前也尝试对强弱类型这两个概念进行理解，但是查阅了非常多的资料之后发现理解不同编程语言的类型系统反而更加困难。</p>

<p><img src="https://static.studygolang.com/190331/7773d643969c163af1477abd607cbc51.png" alt="strong-and-weak-typing"/></p>

<p>对于强弱类型来说，我们很多时候也只能根据现象和特性从直觉上进行判断，强类型的编程语言在编译期间会有着更严格的类型限制，也就是编译器会在编译期间发现变量赋值、返回值和函数调用时的类型错误，而弱类型的语言在出现类型错误时可能会在运行时进行隐式的类型转换。</p>

<blockquote>
  <p>一个接受广泛一些的说法是，强类型在遇到类型不匹配时需要显式类型转换，而弱类型在遇到相同情况时可能会选择偏向于进行隐式类型转换，由于学术界没有明确的定义，这种说法不一定完全正确，放在这里也仅作为参考提供给各位读者。</p>
</blockquote>

<p>假如我们从上面的定义出发，我们就可以认为 Java、C# 等大多数需要编译的编程语言往往都是强类型的，同样地按照这个标准，Go 语言因为会在编译期间发现类型错误，所以也应该是强类型的编程语言。</p>

<p>理解强弱类型这两个具有非常明确歧义并且定义不严格的概念是没有太多实际价值的，作为一种抽象的定义，我们使用它更多的时候是为了方便沟通和分类，这对于我们真正使用和理解编程语言可能没有什么帮助，相比没有明确定义的强弱类型，更应该被关注的应该是下面的这些问题：</p>

<ol>
  <li>类型的转换是显式的还是隐式的？</li>
  <li>编译器会帮助我们推断变量的类型么？</li>
</ol>

<p>这些具体的问题在这种语境下其实更有价值，也希望各位读者能够减少和避免对强���类型的争执。</p>

<h2 id="静态与动态类型">
<a id="静态与动态类型" class="anchor" href="#%E9%9D%99%E6%80%81%E4%B8%8E%E5%8A%A8%E6%80%81%E7%B1%BB%E5%9E%8B" aria-hidden="true"><span class="octicon octicon-link"></span></a>静态与动态类型</h2>

<p>静态类型和动态类型的编程语言其实也是两个不精确的表述，它们其实是应该被称为使用<em>静态类型检查</em>和<em>动态类型检查</em>的编程语言，这一小节会分别介绍两种类型检查的特点以及它们的区别。</p>

<h3 id="静态类型检查">
<a id="静态类型检查" class="anchor" href="#%E9%9D%99%E6%80%81%E7%B1%BB%E5%9E%8B%E6%A3%80%E6%9F%A5" aria-hidden="true"><span class="octicon octicon-link"></span></a>静态类型检查</h3>

<p><a href="https://en.wikipedia.org/wiki/Type_system#Static_type_checking">静态类型检查</a> 是基于对源代码的分析来确定运行程序类型安全的过程，如果我们的代码能够通过静态类型的检查，那么当前程序在一定程度上就满足了类型安全的要求，它可以被看作是一种代码优化的方式，能够减少程序在运行时的类型检查。</p>

<p>作为一个开发者来说，静态类型检查能够帮助我们在编译期间发现程序中出现的类型错误，一些动态类型的编程语言都会有社区提供的工具为这些编程语言加入静态类型检查，例如 Javascript 的 <a href="https://flow.org/">Flow</a>，这些工具能够在编译期间发现代码中的类型错误。</p>

<p>相信很多读者也都听过『动态类型一时爽，代码重构火葬场』，同时使用过动态类型和静态类型编程语言的开发者一定对这句话深有体会，静态类型为代码在编译期间提供了一种约束，如果代码没有满足这种约束就没有办法通过编译器的检查，在重构时这种特性能够帮助我们节省大量的时间并且避免一些遗漏的错误，但是如果使用动态语言，就需要额外写大量的测试用例保证重构不会出现类型错误了。</p>

<h3 id="动态类型检查">
<a id="动态类型检查" class="anchor" href="#%E5%8A%A8%E6%80%81%E7%B1%BB%E5%9E%8B%E6%A3%80%E6%9F%A5" aria-hidden="true"><span class="octicon octicon-link"></span></a>动态类型检查</h3>

<p><a href="https://en.wikipedia.org/wiki/Type_system#Dynamic_type_checking_and_runtime_type_information">动态类型检查</a> 就是在运行时确定程序类型安全的过程，这个过程需要编程语言在编译时为所有的对象加入类型标签和信息，运行时就可以使用这些存储的类型信息来实现动态派发、向下转型、反射以及相似的特性。</p>

<p>这种类型检查的方式能够为工程师提供更多的操作空间，让我们能在运行时获取一些类型相关的上下文并根据对象的类型完成一些动态操作。</p>

<p>只使用动态类型检查的编程语言就叫做动态类型编程语言，常见的动态类型编程语言就包括 Javascript、Ruby 和 PHP，这些编程语言在使用上非常灵活也不需要经过编译器的编译。</p>

<h3 id="小结">
<a id="小结" class="anchor" href="#%E5%B0%8F%E7%BB%93" aria-hidden="true"><span class="octicon octicon-link"></span></a>小结</h3>

<p>静态类型检查和动态类型检查其实并不是两种完全冲突和对立的特点，很多编程语言都会同时允许静态和动态类型，Java 就同时使用了这两种检查的方法，不仅在编译期间对类型提前检查发现类型错误，还为对象添加了类型信息，这样能够在运行时使用反射根据对象的类型动态地执行方法减少了冗余代码。</p>

<h2 id="go-语言的类型检查">
<a id="go-语言的类型检查" class="anchor" href="#go-%E8%AF%AD%E8%A8%80%E7%9A%84%E7%B1%BB%E5%9E%8B%E6%A3%80%E6%9F%A5" aria-hidden="true"><span class="octicon octicon-link"></span></a>Go 语言的类型检查</h2>

<p>Go 语言的编译器使用静态类型检查来保证程序运行的类型安全，当然它也会在编程期引入类型信息，让工程师能够使用反射来判断参数和变量的类型。在这一节中我们还是会重点介绍编译期间的静态类型检查，回到 <a href="https://draveness.me/golang-compile-intro">Go 语言编译过程概述</a> 一节，我们曾经介绍过 Go 语言编译器主程序中的代码，其中有一段是这样的：</p>

<pre><code class="language-go">	for i := 0; i < len(xtop); i++ {
		n := xtop[i]
		if op := n.Op; op != ODCL && op != OAS && op != OAS2 && (op != ODCLTYPE || !n.Left.Name.Param.Alias) {
			xtop[i] = typecheck(n, ctxStmt)
		}
	}

	for i := 0; i < len(xtop); i++ {
		n := xtop[i]
		if op := n.Op; op == ODCL || op == OAS || op == OAS2 || op == ODCLTYPE && n.Left.Name.Param.Alias {
			xtop[i] = typecheck(n, ctxStmt)
		}
	}
	
	// ...

	checkMapKeys()
</code></pre>

<p>这段代码可以分成两个部分，首先通过 <code>typecheck</code> 检查常量、类型、函数声明以及变量赋值语句的类型，然后使用 <code>checkMapKeys</code> 检查哈希中键的类型，我们会分几个部分对上述代码的实现原理进行分析。</p>

<h3 id="执行流程">
<a id="执行流程" class="anchor" href="#%E6%89%A7%E8%A1%8C%E6%B5%81%E7%A8%8B" aria-hidden="true"><span class="octicon octicon-link"></span></a>执行流程</h3>

<p>编译器类型检查的主要逻辑都在 <code>typecheck</code> 和 <code>typecheck1</code> 这两个函数中，其中 <code>typecheck</code> 中逻辑不是特别多，它的主要作用就是判断编译器是否对当前节点执行过类型检查，同时做一些类型检查之前的准备工作：</p>

<pre><code class="language-go">func typecheck(n *Node, top int) (res *Node) {
	if n == nil {
		return nil
	}

	for n.Op == OPAREN {
		n = n.Left
	}

	n = resolve(n)
	n = typecheck1(n, top)
	return n
}
</code></pre>

<p>避免多次类型检查的代码从当前方法中已经被省略掉了，我们可以直接来看核心的类型检查逻辑 <a href="https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/typecheck.go#L359-L2259">typecheck1</a> 函数，这个函数全部的实现总共有将近 2000 行，大部分的代码都是由一个巨型 switch/case 构成的：</p>

<pre><code class="language-go">func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	case OLITERAL, ONAME, ONONAME, OTYPE:
		if n.Sym == nil {
			break
		}

		typecheckdef(n)
		if n.Op == ONONAME {
			n.Type = nil
			return n
		}
	}

	switch n.Op {
	default:
		Dump("typecheck", n)
		Fatalf("typecheck %v", n.Op)

	case OTARRAY:
		// ...

	case OTMAP:
		// ...

	case OTCHAN:
		// ...
	}

	// ...	

	evconst(n)

	return n
}
</code></pre>

<p>这个 switch 语句根据传入节点操作的不同，进入不同的 case 执行其中逻辑，所有的操作类型都定义在 <a href="https://github.com/golang/go/blob/master/src/cmd/compile/internal/gc/syntax.go#L574-L761">syntax.go</a> 这个文件中，由于节点的操作种类确实非常多，所以我们简单节选几个比较重要和有趣的 case 深入分析一下。</p>

<h4 id="切片-otarray">
<a id="切片-otarray" class="anchor" href="#%E5%88%87%E7%89%87-otarray" aria-hidden="true"><span class="octicon octicon-link"></span></a>切片 OTARRAY</h4>

<p>如果当前节点的操作类型是 <code>OTARRAY</code>，那么这个分支首先会对右节点进行类型检查，也就是切片中元素的类型：</p>

<pre><code class="language-go">	case OTARRAY:
		r := typecheck(n.Right, Etype)
		if r.Type == nil {
			n.Type = nil
			return n
		}
		
</code></pre>

<p>然后该分支会根据当前节点左节点的不同，分三种不同的情况对当前 <code>Node</code> 的类型进行更新，相信对 Go 语言比较熟悉的读者应该已经猜到了是哪三种不同的切片声明形式：<code>[]int</code>、<code>[...]int</code> 和 <code>[3]int</code>，第一种相对来说比较简单，这里会直接调用 <code>NewSlice</code> 函数返回一个切片类型：</p>

<pre><code class="language-go">		if n.Left == nil {
			// t.Extra = Slice{r.Type}
			t = types.NewSlice(r.Type)
</code></pre>

<p><code>NewSlice</code> 函数直接返回了一个 <code>TSLICE</code> 类型的结构，它的 <code>Extra</code> 字段保存着结构体 <code>Slice{r.Type}</code>，切片中元素的类型信息 <code>r.Type</code> 也会存储在这里；当遇到了 <code>[...]int</code> 这种形式的切片类型时就会使用 <code>NewDDDArray</code> 函数创建一个存储着 <code>&Array{Elem: elem, Bound: -1}</code> 结构的 <code>TARRAY</code> 类型，<code>-1</code> 就代表当前的数组类型的大小需要进行推导：</p>

<pre><code class="language-go">		} else if n.Left.Op == ODDD {
			if top&ctxCompLit == 0 {
				if !n.Diag() {
					n.SetDiag(true)
					yyerror("use of [...] array outside of array literal")
				}
				n.Type = nil
				return n
			}
			// t.Extra = &Array{Elem: r.Type, Bound: -1}
			t = types.NewDDDArray(r.Type)
</code></pre>

<p>在最后，如果源代码中直接包含了数组的大小，就会调用 <code>NewArray</code> 函数创建一个 <code>TARRAY</code> 类型的结构体，结构体存储着数组中元素的类型信息和数组的大小：</p>

<pre><code class="language-go">		} else {
			n.Left = indexlit(typecheck(n.Left, ctxExpr))
			l := n.Left
			v := l.Val()
			bound := v.U.(*Mpint).Int64()
			// t.Extra = &Array{Elem: r.Type, Bound: bound}
			t = types.NewArray(r.Type, bound)		}

		n.Op = OTYPE
		n.Type = t
		n.Left = nil
		n.Right = nil
</code></pre>

<p>由于这段方法相对有些复杂，所以省略了判断数组的大小是否溢出或者不合法的代码，不同的分支会判断数组和切片声明的不同形式，每一个分支都会更新 <code>Node</code> 中的类型，修改了抽象语法树中的内容。由此看来，无论是生成切片还是数组，都在类型检查期间确定了。</p>

<h4 id="哈希-otmap">
<a id="哈希-otmap" class="anchor" href="#%E5%93%88%E5%B8%8C-otmap" aria-hidden="true"><span class="octicon octicon-link"></span></a>哈希 OTMAP</h4>

<p>对于哈希或者映射这种类型来说，编译器会对它的键值类型分别进行检查，验证它们的合法性：</p>

<pre><code class="language-go">	case OTMAP:
		n.Left = typecheck(n.Left, Etype)
		n.Right = typecheck(n.Right, Etype)
		l := n.Left
		r := n.Right
		n.Op = OTYPE
		n.Type = types.NewMap(l.Type, r.Type)
		mapqueue = append(mapqueue, n)
		n.Left = nil
		n.Right = nil
</code></pre>

<p>与处理切片时几乎完全相同，这里会通过 <code>NewMap</code> 创建一个新的 <code>TMAP</code> 类型并将哈希的键值类型都存储到该结构体中：</p>

<pre><code class="language-go">func NewMap(k, v *Type) *Type {
	t := New(TMAP)
	mt := t.MapType()
	mt.Key = k
	mt.Elem = v
	return t
}
</code></pre>

<p>代表当前哈希的节点最终也会被加入 <code>mapqueue</code> 队列，等待稍后对其键的类型进行再次检查，检查键类型调用的其实就是上面提到的 <code>checkMapKeys</code> 函数：</p>

<pre><code class="language-go">func checkMapKeys() {
	for _, n := range mapqueue {
		k := n.Type.MapType().Key
		if !k.Broke() && !IsComparable(k) {
			yyerrorl(n.Pos, "invalid map key type %v", k)
		}
	}
	mapqueue = nil
}
</code></pre>

<p>该函数会遍历 <code>mapqueue</code> 队列中等待检查的节点，判断这些类型能否作为哈希的键，如果当前类型并不合法就会在类型检查的阶段直接报错中止整个检查的过程。</p>

<h4 id="关键字-omake">
<a id="关键字-omake" class="anchor" href="#%E5%85%B3%E9%94%AE%E5%AD%97-omake" aria-hidden="true"><span class="octicon octicon-link"></span></a>关键字 OMAKE</h4>

<p>最后要介绍的其实就是 Go 语言中很常见的内置函数 <code>make</code>，在类型检查开始之前编译器其实没有区分不同的类型创建方法的不同，<code>make</code> 函数的第一个参数是一个类型，所以这里会先对该类型进行检查，类型检查之后根据类型进入不同的分支：</p>

<pre><code class="language-go">	case OMAKE:
		args := n.List.Slice()

		n.List.Set(nil)
		l := args[0]
		l = typecheck(l, Etype)
		t := l.Type

		i := 1
		switch t.Etype {
		case TSLICE:
			// ...

		case TMAP:
			// ...

		case TCHAN:
			// ...
		}

		n.Type = t
</code></pre>

<p>如果 <code>make</code> 的第一个参数是切片类型，那么就会从参数中获取切片的长度 <code>len</code> 和容量 <code>cap</code> 并对这两个参数进行校验，切片的长度必须要小于或者等于切片的容量，在这段代码的最后会将当前节点的操作改成 <code>OMAKESLICE</code>，后面 <a href="https://draveness.me/golang-ir-ssa">生成中间代码</a> 的过程就不再会处理 <code>OMAKE</code> 类型的节点了，而是会根据这里更加细分的操作类型进行判断：</p>

<pre><code class="language-go">		case TSLICE:
			if i >= len(args) {
				yyerror("missing len argument to make(%v)", t)
				n.Type = nil
				return n
			}

			l = args[i]
			i++
			l = typecheck(l, ctxExpr)
			var r *Node
			if i < len(args) {
				r = args[i]
				i++
				r = typecheck(r, ctxExpr)
			}

			if !checkmake(t, "len", l) || r != nil && !checkmake(t, "cap", r) {
				n.Type = nil
				return n
			}
			if Isconst(l, CTINT) && r != nil && Isconst(r, CTINT) && l.Val().U.(*Mpint).Cmp(r.Val().U.(*Mpint)) > 0 {
				yyerror("len larger than cap in make(%v)", t)
				n.Type = nil
				return n
			}

			n.Left = l
			n.Right = r
			n.Op = OMAKESLICE
</code></pre>

<p>第二种情况就是 <code>make</code> 的第一个参数是 <code>map</code> 类型，在这种情况下，第二个可选的参数就是 map 的初始大小，在默认情况下它的大小是 0，当前分支最后也会改变当前节点的 <code>Op</code> 属性：</p>

<pre><code class="language-go">		case TMAP:
			if i < len(args) {
				l = args[i]
				i++
				l = typecheck(l, ctxExpr)
				l = defaultlit(l, types.Types[TINT])
				if !checkmake(t, "size", l) {
					n.Type = nil
					return n
				}
				n.Left = l
			} else {
				n.Left = nodintconst(0)
			}
			n.Op = OMAKEMAP
</code></pre>

<p><code>make</code> 内置函数能够初始化的最后一种结构就是 Channel 了，从下面的代码我们可以发现第二个参数表示的就是该 Channel 的缓冲区大小：</p>

<pre><code class="language-go">		case TCHAN:
			l = nil
			if i < len(args) {
				l = args[i]
				i++
				l = typecheck(l, ctxExpr)
				l = defaultlit(l, types.Types[TINT])
				if !checkmake(t, "buffer", l) {
					n.Type = nil
					return n
				}
				n.Left = l
			} else {
				n.Left = nodintconst(0)
			}
			n.Op = OMAKECHAN
</code></pre>

<p>在类型检查的过程中，无论 <code>make</code> 的第一个参数是什么类型，都会对当前节点的 <code>Op</code> 类型进行修改并且对传入参数的合法性进行一定的验证。</p>

<h2 id="总结">
<a id="总结" class="anchor" href="#%E6%80%BB%E7%BB%93" aria-hidden="true"><span class="octicon octicon-link"></span></a>总结</h2>

<p>类型检查是 Go 语言编译的第二个阶段，在词法和语法分析之后我们得到了每个文件对应的抽象语法树，随后的类型检查会遍历抽象语法树中的节点，对每个节点的类型进行检验，找出其中存在的语法错误，在这个过程中也可能会对抽象语法树进行改写，这不仅能够去除一些不会被执行的代码对编译进行优化提高执行效率，而且也会修改 <code>make</code>、<code>new</code> 等关键字对应节点的操作类型。</p>

<p><code>make</code> 和 <code>new</code> 这些内置函数其实并不存在对应的函数实现，它们会在编译期间被转换成真正存在的其他函数，我们在下一节 <a href="https://draveness.me/golang-ir-ssa">中间代码生成</a> 中会介绍编译器对它们做了什么。</p>

<h2 id="reference">
<a id="reference" class="anchor" href="#reference" aria-hidden="true"><span class="octicon octicon-link"></span></a>Reference</h2>

<ul>
  <li><a href="https://en.wikipedia.org/wiki/Strong_and_weak_typing">Strong and weak typing</a></li>
  <li><a href="https://en.wikipedia.org/wiki/Type_system">Type system</a></li>
  <li><a href="http://wiki.c2.com/?WeakAndStrongTyping">Weak And Strong Typing</a></li>
</ul>

						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						