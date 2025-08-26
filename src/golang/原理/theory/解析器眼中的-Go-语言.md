---
title: 解析器眼中的 Go 语言
source_url: 'https://studygolang.com/articles/19061'
category: Go原理教程
---


						<p>代码其实就是按照约定格式编写的一堆字符串，工程师可以在脑内对语言的源代码进行编译并运行目标程序，这是因为经过训练的软件工程师能够对本来无意义的字符串进行分组和分析，按照约定的语法来理解源代码。既然工程师能够按照一定的方式理解和编译 Go 语言的源代码，那么我们如何模拟人理解源代码的方式构建一个能够分析编程语言代码的程序呢。</p>

<p>我们在这一节中将介绍词法分析和语法分析这两个非常重要的编译过程，这两个过程的主要作用就是将原本机器看来无序并且不容易理解的源文件转换成机器非常容易理解和分析的抽象语法树，接下来我们就看一看解析器眼中的 Go 语言是什么样的。</p>

<h2 id="词法分析">
<a id="词法分析" class="anchor" href="#%E8%AF%8D%E6%B3%95%E5%88%86%E6%9E%90" aria-hidden="true"><span class="octicon octicon-link"></span></a>词法分析</h2>

<p>源代码文件在编译器的眼中其实就是一团乱麻，一个由『无实际意义』字符组成的、无法被理解的字符串，所有的字符在编译器看来并没有什么区别，为了理解这些字符我们需要做的第一件事情就是<strong>将字符串分组</strong>，这样能够降低理解字符串的成本，简化分析源代码的过程。</p>

<pre><code class="language-go">make(chan int)
</code></pre>

<p>作为一个不懂任何编程语言的人，看到上述文本的第一反应就是将上述字符串分成几部分理解 - <code>make</code>、<code>chan</code>、<code>int</code> 和括号，这个凭直觉分解文本的过程其实就是词法分析。</p>

<blockquote>
  <p>词法分析是计算机科学中将字符序列转换为标记（token）序列的过程。</p>
</blockquote>

<p>很多语言在设计早期都会选择 lex 生成词法分析器，lex 生成的代码能够将一个文件中的字符分解成一系列的 Token 序列，Go 语言在稍微早一些的版本也是使用 lex 作词法分析的，我们除了会介绍 lex 的使用和工作原理还会介绍 Go 语言如何进行词法分析。</p>

<h4 id="lex">
<a id="lex" class="anchor" href="#lex" aria-hidden="true"><span class="octicon octicon-link"></span></a>lex</h4>

<p>词法分析作为具有固定模式和功能的任务，出现这种更抽象的工具其实是必然的，lex 作为一个代码生成器，使用了类似 C 语言的语法，我们可以理解成 lex 使用正则匹配对输入的字符流进行扫描，加入我们有以下的 lex 文件：</p>

<pre><code class="language-c">%{
#include <stdio.h>
%}

%%
package      printf("PACKAGE ");
import       printf("IMPORT ");
\.           printf("DOT ");
\{           printf("LBRACE ");
\}           printf("RBRACE ");
\(           printf("LPAREN ");
\)           printf("RPAREN ");
\"           printf("QUOTE ");
\n           printf("\n");
[0-9]+       printf("NUMBER ");
[a-zA-Z_]+   printf("IDENT ");
%%
</code></pre>

<p>这个定义好的文件能够解析 <code>package</code> 和 <code>import</code> 关键字、常见的特殊字符、数字以及标识符，虽然这里的规则可能有一些简陋和不完善，但是如果用来解析下面的这一段代码还是比较轻松的：</p>

<pre><code class="language-go">package main

import (
	"fmt"
)

func main() {
	fmt.Println("Hello")
}
</code></pre>

<p><code>.l</code> 结尾的 lex 代码并不能直接运行，我们首先需要将上述的代码『展开』成 C 语言代码，这里可以直接执行如下的命令编译并打印当前文件中的内容：</p>

<pre><code class="language-c">$ lex simplego.l
$ cat lex.yy.c
// ...
int yylex (void) {
	register yy_state_type yy_current_state;
	register char *yy_cp, *yy_bp;
	register int yy_act;
	
	// ...
	while ( 1 ) {
		yy_cp = (yy_c_buf_p);
		*yy_cp = (yy_hold_char);
		yy_bp = yy_cp;
		yy_current_state = (yy_start);
yy_match:
		do {
			register YY_CHAR yy_c = yy_ec[YY_SC_TO_UI(*yy_cp)];
			if ( yy_accept[yy_current_state] ) {
				(yy_last_accepting_state) = yy_current_state;
				(yy_last_accepting_cpos) = yy_cp;
			}
			while ( yy_chk[yy_base[yy_current_state] + yy_c] != yy_current_state ) {
				yy_current_state = (int) yy_def[yy_current_state];
				if ( yy_current_state >= 30 )
					yy_c = yy_meta[(unsigned int) yy_c];
				}
			yy_current_state = yy_nxt[yy_base[yy_current_state] + (unsigned int) yy_c];
			++yy_cp;
		} while ( yy_base[yy_current_state] != 37 );
		
		//...

do_action:
		switch ( yy_act )
			case 0:
    			*yy_cp = (yy_hold_char);
    			yy_cp = (yy_last_accepting_cpos);
    			yy_current_state = (yy_last_accepting_state);
    			goto yy_find_action;

			case 1:
    			YY_RULE_SETUP
    			printf("PACKAGE ");
    			YY_BREAK
			// ...
}
</code></pre>

<blockquote>
  <p>由于这个文件中大多数的代码都是自动生成的，所以空行和缩进使用的十分混乱，这里省略了一些代码并简单进行了排版。</p>
</blockquote>

<p><a href="https://gist.github.com/draveness/85db6ec4a4088b63ccccf7f09424f474">lex.yy.c</a> 的前 600 行基本都是宏和函数的声明和定义，后面生成的代码大都是为 <code>yylex</code> 这个函数服务的，这个函数使用 <a href="https://en.wikipedia.org/wiki/Deterministic_finite_automaton">有限自动机（DFA）</a> 的程序结构来分析输入的字符流，你如果仔细看这个文件生成的代码时，会发现当前的文件中并不存在 <code>main</code> 函数的定义，主函数其实是在 liblex 这个库中定义的，所以在编译时其实需要添加额外的 <code>-ll</code> 选项：</p>

<pre><code class="language-bash">$ cc lex.yy.c -o simplego -ll
$ cat main.go | ./simplego
</code></pre>

<p>当我们将 C 语言代码通过 gcc 编译成二进制代码之后，就可以使用管道将上面提到的 Go 语言代码作为输入传递到生成的词法分析器中，随后会得到如下的输出：</p>

<pre><code class="language-go">PACKAGE  IDENT

IMPORT  LPAREN
	QUOTE IDENT QUOTE
RPAREN

IDENT  IDENT LPAREN RPAREN  LBRACE
	IDENT DOT IDENT LPAREN QUOTE IDENT QUOTE RPAREN
RBRACE
</code></pre>

<p>从上面的输出，我们能够看到 Go 源代码的影子，lex 生成的词法分析器 lexer 通过正则匹配的方式将机器原本很难理解的字符串进行分解成很多的 Token，有利于后面的继续处理。</p>

<h4 id="go">
<a id="go" class="anchor" href="#go" aria-hidden="true"><span class="octicon octicon-link"></span></a>Go</h4>

<p>Go 语言的词法解析是通过 <code>cmd/compile/internal/syntax</code> 包中的 <code>scanner</code> 结构实现的，这个结构体会持有当前扫描的数据源、启用的��式和当前被扫描到的 Token：</p>

<pre><code class="language-go">type scanner struct {
	source
	mode   uint
	nlsemi bool

	// current token, valid after calling next()
	line, col uint
	tok       token
	lit       string
	kind      LitKind
	op        Operator
	prec      int
}
</code></pre>

<p>tokens.go 文件中定义了 Go 语言中支持的全部 Token 类型，<code>token</code> 类型其实被定义成了正整数，在这里可以看到一些常见 Token 的类型：</p>

<pre><code class="language-go">const (
	_    token = iota
	_EOF       // EOF

	// names and literals
	_Name    // name
	_Literal // literal

	// operators and operations
	_Operator // op
	// ...

	// delimiters
	_Lparen    // (
	_Lbrack    // [
	// ...

	// keywords
	_Break       // break
	// ...
	_Type        // type
	_Var         // var

	tokenCount //
)
</code></pre>

<p>从 Go 语言中定义的 Token 类型，我们可以将语言中的元素分成几个不同的类别，分别是名称和字面量、操作符、分隔符和关键字。词法分析主要是由 <code>scanner</code> 这个结构体中的 <code>next</code> 方法驱动的，这个 250 行函数的主体就是一个 <code>switch/case</code> 结构：</p>

<pre><code class="language-go">func (s *scanner) next() {
	c := s.getr()
	for c == ' ' || c == '\t' || c == '\n' || c == '\r' {
		c = s.getr()
	}

	s.line, s.col = s.source.line0, s.source.col0

	if isLetter(c) || c >= utf8.RuneSelf && s.isIdentRune(c, true) {
		s.ident()
		return
	}

	switch c {
	case -1:
		s.tok = _EOF

	case '0', '1', '2', '3', '4', '5', '6', '7', '8', '9':
		s.number(c)

	// ...
	}
}
</code></pre>

<p><code>scanner</code> 每次都会通过 <code>getr</code> 函数获取文件中最近的未被解析的字符，然后根据当前字符的不同执行不同的 case，如果遇到了空格和换行符这些空白字符会直接跳过，如果当前字符是 <code>0</code> 就会执行 <code>number</code> 方法尝试匹配一个数字。</p>

<pre><code class="language-go">func (s *scanner) number(c rune) {
	s.startLit()

	if c != '.' {
		s.kind = IntLit
		for isDigit(c) {
			c = s.getr()
		}
	}

	s.ungetr()
	s.nlsemi = true
	s.lit = string(s.stopLit())
	s.tok = _Literal
}
</code></pre>

<p>上述的方法其实省略了非常多的代码，包括如何匹配浮点数、指数和复数，我们就是简单看一下词法分析匹配的逻辑。这里只是在开始具体匹配之前调用 <code>startLit</code> 记录一下当前 Token 的开始位置，随后在 for 循环中不断获取最新的字符，方法返回之前会通过 <code>ungetr</code> 撤销最近获取的错误字符（非数字）并将字面量和 Token 的类型传递回 <code>scanner</code>，到这里为止，一次 <code>next</code> 的函数调用就结束了。</p>

<p>当前包中的词法分析器 <code>scanner</code> 也只是为上层提供了 <code>next</code> 方法，词法解析的过程都是惰性的，只有在上层的解析器需要时才会调用 <code>next</code> 获取最新的 Token。</p>

<p>Go 语言的词法元素相对来说还是比较简单，使用这种巨大的 switch/case 进行词法解析也比较方便和顺手，早期的 Go 语言虽然使用 lex 这种工具来生成词法解析器，但是最后还是使用 Go 语言实现词法分析器，用自己写的词法分析器来解析自己。</p>

<h2 id="语法分析">
<a id="语法分析" class="anchor" href="#%E8%AF%AD%E6%B3%95%E5%88%86%E6%9E%90" aria-hidden="true"><span class="octicon octicon-link"></span></a>语法分析</h2>

<p>说完了编译最开始的词法分析过程，接下来就到了语法分析，<a href="https://zh.wikipedia.org/wiki/%E8%AA%9E%E6%B3%95%E5%88%86%E6%9E%90%E5%99%A8">语法分析</a> 是根据某种特定的形式文法（Grammar）对 Token 序列构成的输入文本进行分析并确定其语法结构的一种过程。从上面的定义来看，词法分析器输出的结果 — Token 序列就是语法分析器的输入。</p>

<p>在语法分析的过程会使用<em>自顶向下</em>或者<em>自底向上</em>的方式进行推导，在介绍 Go 语言的语法分析的实现原理之前，我们会先介绍语法分析中的文法和分析方法。</p>

<h3 id="文法">
<a id="文法" class="anchor" href="#%E6%96%87%E6%B3%95" aria-hidden="true"><span class="octicon octicon-link"></span></a>文法</h3>

<p><em>上下文无关文法</em>是用来对某种编程语言进行形式化的、精确的描述工具，我们能够通过文法定义一种语言的语法，它主要包含了一系列用于转换字符串的生产规则（production rule）。上下文无关文法中的每一个生产规则都会将规则左侧的<em>非终结符</em>转换成右侧的字符串，文法都由以下的四个部分组成：</p>

<blockquote>
  <p>终结符是文法中无法再被展开的符号，而非终结符与之相反，还可以通过生产规则进行展开，例如 “id”、”123” 等标识或者字面量。</p>
</blockquote>

<ul>
  <li>$N$ 有限个<em>非终结符</em>的集合；</li>
  <li>$\Sigma$ 有限个<em>终结符</em>的集合；</li>
  <li>$P$ 有限个<em>生产规则</em>的集合；</li>
  <li>$S$ 非终结符集合中唯一的<em>开始符号</em>；</li>
</ul>

<p>文法被定义成一个四元组 $(N, \Sigma, P, S)$，这个元组中的几部分就是上面提到的四个符号，其中最为重要的就是生产规则了，每一个生产规则会包含其他的成员 — 非终结符、终结符或者开始符号，我们在这里可以举一个简单的例子：</p>

<ol>
  <li>$S \rightarrow aSb $</li>
  <li>$S \rightarrow ab $</li>
</ol>

<p>上述规则构成的文法就能够表示 <code>ab</code>、<code>aabb</code> 以及 <code>aaa..bbb</code> 等字符串，编程语言的文法就是由这一系列的生产规则表示的，在这里我们可以从 <code>cmd/compile/internal/syntax</code> 包中的 <code>parser.go</code> 中简单展示一些 Go 语言文法的生产规则：</p>

<pre><code class="language-go">SourceFile = PackageClause ";" { ImportDecl ";" } { TopLevelDecl ";" } .
PackageClause  = "package" PackageName .
PackageName    = identifier .

ImportDecl       = "import" ( ImportSpec | "(" { ImportSpec ";" } ")" ) .
ImportSpec       = [ "." | PackageName ] ImportPath .
ImportPath       = string_lit .

TopLevelDecl  = Declaration | FunctionDecl | MethodDecl .
Declaration   = ConstDecl | TypeDecl | VarDecl .
</code></pre>

<blockquote>
  <p>Go 语言更详细的文法可以从 <a href="https://golang.org/ref/spec">Language Specification</a> 中找到，这里不仅包含语言的文法，还包含此词法元素、内置函数等信息。</p>
</blockquote>

<p>因为<strong>每个 Go 源代码文件最终都会被解析成一个独立的抽象语法树</strong>，所以语法树最顶层的结构或者开始符号其实就是 <code>SourceFile</code>，从文法中我们可以看出，每一个文件都包含一个 <code>package</code> 的定义以及可选的 <code>import</code> 声明和其他的顶层声明。</p>

<pre><code class="language-go">type File struct {
	PkgName  *Name
	DeclList []Decl
	Lines    uint
	node
}
</code></pre>

<p>顶层声明的种类有五大类型，分别是常量、类型、变量、函数和方法，这五种声明会在文件的最外层进行定义。</p>

<pre><code class="language-go">ConstDecl = "const" ( ConstSpec | "(" { ConstSpec ";" } ")" ) .
ConstSpec = IdentifierList [ [ Type ] "=" ExpressionList ] .

TypeDecl  = "type" ( TypeSpec | "(" { TypeSpec ";" } ")" ) .
TypeSpec  = AliasDecl | TypeDef .
AliasDecl = identifier "=" Type .
TypeDef   = identifier Type .

VarDecl = "var" ( VarSpec | "(" { VarSpec ";" } ")" ) .
VarSpec = IdentifierList ( Type [ "=" ExpressionList ] | "=" ExpressionList ) .
</code></pre>

<p>上述的文法分别定义了 Go 语言中常量、类型和变量三种常见定义的语法结构，从中可���看到语言中的很多关键字 <code>const</code>、<code>type</code> 和 <code>var</code>，稍微回想一下我们日常接触的 Go 语言代码就能验证这里文法的正确性。</p>

<p>除了三种简单的语法结构之外，函数和方法的定义就更加复杂，从下面的文法我们可以看到 <code>Statement</code> 总共可以转换成 15 种不同的语法结构，这些语法结构就包括我们经常使用的 switch/case、if/else、for 循环以及 select 等语句：</p>

<pre><code class="language-go">FunctionDecl = "func" FunctionName Signature [ FunctionBody ] .
FunctionName = identifier .
FunctionBody = Block .

MethodDecl = "func" Receiver MethodName Signature [ FunctionBody ] .
Receiver   = Parameters .

Block = "{" StatementList "}" .
StatementList = { Statement ";" } .

Statement =
	Declaration | LabeledStmt | SimpleStmt |
	GoStmt | ReturnStmt | BreakStmt | ContinueStmt | GotoStmt |
	FallthroughStmt | Block | IfStmt | SwitchStmt | SelectStmt | ForStmt |
	DeferStmt .

SimpleStmt = EmptyStmt | ExpressionStmt | SendStmt | IncDecStmt | Assignment | ShortVarDecl .
</code></pre>

<p>这些不同的语法结构共同定义了 Go 语言中能够使用的语法结构和表达式，对于 <code>Statement</code> 展开的更多内容这篇文章就不会详细介绍了，感兴趣的读者可以直接阅读 <a href="https://golang.org/ref/spec#Statement">Go 语言说明书</a> 或者直接从 <a href="https://github.com/golang/go/blob/master/src/cmd/compile/internal/syntax/parser.go">源代码</a> 中找到想要的答案。</p>

<h3 id="分析方法">
<a id="分析方法" class="anchor" href="#%E5%88%86%E6%9E%90%E6%96%B9%E6%B3%95" aria-hidden="true"><span class="octicon octicon-link"></span></a>分析方法</h3>

<p>语法分析的分析方法一般分为自顶向上和自底向下两种，这两种方式会使用不同的方式对输入的 Token 序列进行推导：</p>

<ul>
  <li>自顶向下分析：可以被看作找到当前输入流最左推导的过程，对于任意一个输入流，根据当前的输入符号，确定一个生产规则，使用生产规则右侧的符号替代相应的非终结符向下推导；</li>
  <li>自底向上分析：语法分析器从输入流开始，每次都尝试重写最右侧的多个符号，这其实就是说解析器会从最简单的符号进行推导，在解析的最后合并成开始符号；</li>
</ul>

<p>如果读者无法理解上述的定义也没有关系，我们会在这一节的剩余部分介绍两种不同的分析方法以及它们的具体分析过程。</p>

<h4 id="自顶向下">
<a id="自顶向下" class="anchor" href="#%E8%87%AA%E9%A1%B6%E5%90%91%E4%B8%8B" aria-hidden="true"><span class="octicon octicon-link"></span></a>自顶向下</h4>

<p>LL 文法就是一种使用自顶向上分析方法的文法，下面给出了一个常见的 LL 文法：</p>

<ol>
  <li>$S \rightarrow aS_1$</li>
  <li>$S_1 \rightarrow bS_1 $</li>
  <li>$S_1 \rightarrow \epsilon$</li>
</ol>

<p>假设我们存在以上的生产规则和输入流 <code>abb</code>，如果这里使用自顶向上的方式进行语法分析，我们可以理解为每次解析器会通过新加入的字符判断应该使用什么方式展开当前的输入流：</p>

<ol>
  <li>$S$ （开始符号）</li>
  <li>$aS_1$（规则 1)</li>
  <li>$abS_1$（规则 2)</li>
  <li>$abbS_1$（规则 2)</li>
  <li>$abb$（规则 3)</li>
</ol>

<p>这种分析方法一定会从开始符号分析，通过下一个即将入栈的符号判断应该如何对当前堆栈中最右侧的非终结符（$S$ 或 $S_1$）进行展开，直到整个字符串中不存在任何的非终结符，整个解析过程才会结束。</p>

<h4 id="自底向上">
<a id="自底向上" class="anchor" href="#%E8%87%AA%E5%BA%95%E5%90%91%E4%B8%8A" aria-hidden="true"><span class="octicon octicon-link"></span></a>自底向上</h4>

<p>但是如果我们使用自底向上的方式对输入流进行分析时，处理过程就会完全不同了，常见的四种文法 LR(0)、SLR、LR(1) 和 LALR(1) 使用了自底向上的处理方式，我们可以简单写一个与上一节中效果相同的 LR(0) 文法：</p>

<ol>
  <li>$S \rightarrow S_1 $</li>
  <li>$S_1 \rightarrow S_1b $</li>
  <li>$S_1 \rightarrow a $</li>
</ol>

<p>使用上述等效的文法处理同样地输入流 <code>abb</code> 会使用完全不同的过程对输入流进行展开：</p>

<ol>
  <li>$a$（入栈）</li>
  <li>$S_1$（规则 3）</li>
  <li>$S_1b$（入栈）</li>
  <li>$S_1$（规则 2）</li>
  <li>$S_1b$（入栈）</li>
  <li>$S_1$（规则 2）</li>
  <li>$S$（规则 1）</li>
</ol>

<p>自底向上的分析过程会维护一个堆栈用于存储未被归约的符号，在整个过程中会执行两种不同的操作，一种叫做入栈（shift），也就是将下一个符号入栈，另一种叫做归约（reduce），也就是对最右侧的字符串按照生产规则进行合并。</p>

<p>上述的分析过程和自顶向上的分析方法完全不同，这两种不同的分析方法其实也代表了计算机科学中两种不同的思想 — 从抽象到具体和从具体到抽象。</p>

<h4 id="lookahead">
<a id="lookahead" class="anchor" href="#lookahead" aria-hidden="true"><span class="octicon octicon-link"></span></a>Lookahead</h4>

<p>在语法分析中除了 LL 和 LR 这两种不同类型的语法分析方法之外，还存在另一个非常重要的概念，就是向前查看（Lookahead），在不同生产规则发生冲突时，当前解析器需要通过预读一些 Token 判断当前应该用什么生产规则对输入流进行展开或者归约，例如在 LALR(1) 文法中，就需要预读一个 Token 保证出现冲突的生产规则能够被正确处理。</p>

<h3 id="go-1">
<a id="go-1" class="anchor" href="#go-1" aria-hidden="true"><span class="octicon octicon-link"></span></a>Go</h3>

<p>Go 语言的解析器就使用了 LALR(1) 的文法来解析词法分析过程中输出的 Token 序列，最右推导加向前查看构成了 Go 语言解析器的最基本原理，也是大多数编程语言的选择。</p>

<blockquote>
  <p>对于 Go 语言使用的文法，作者并没有找到确切的答案，比较可信的依据是 11 年的一个 Google Group 的讨论 <a href="https://groups.google.com/forum/#!msg/golang-nuts/jVjbH2-emMQ/UdZlSNhd3DwJ">what type of grammar GO programming language?</a>，不过讨论的内容是否过时其实不得而知，语言的文法相比其他语言虽然简单，但是要详细分析文法还是需要比较长的时间，各位读者如果有确切的答案可以在文章下面留言。</p>
</blockquote>

<p><a href="https://draveness.me/golang-compile-intro">Go 语言编译过程</a> 中介绍了编译器中的主函数，在 <code>Main</code> 中调用了 <code>parseFiles</code> 函数，这个函数主要完成了两部分工作，一部分是调用 syntax 包中的 <code>Parse</code> 方法对文件中的源代码进行解析，另一部分通过调用 <code>node</code> 函数将抽象语法树中的节点加入全局的 <code>xtop</code> 变量中：</p>

<pre><code class="language-go">func parseFiles(filenames []string) uint {
	var noders []*noder

	for _, filename := range filenames {
		p := &noder{
			basemap: make(map[*syntax.PosBase]*src.PosBase),
			err:     make(chan syntax.Error),
		}
		noders = append(noders, p)

		go func(filename string) {
			base := syntax.NewFileBase(filename)

			f, _ := os.Open(filename)
			defer f.Close()

			p.file, _ = syntax.Parse(base, f, p.error, p.pragma, syntax.CheckBranches)
		}(filename)
	}

	var lines uint
	for _, p := range noders {
		p.node()
		lines += p.file.Lines
	}

	return lines
}
</code></pre>

<p>我们在这里可以先分析 <code>Parse</code> 函数的具体实现，该函数初始化了一个新的 <code>parser</code> 结构体并通过 <code>fileOrNil</code> 方法开启对当前文件的词法和语法解析：</p>

<pre><code class="language-go">func Parse(base *PosBase, src io.Reader, errh ErrorHandler, pragh PragmaHandler, mode Mode) (_ *File, first error) {
	var p parser
	p.init(base, src, errh, pragh, mode)
	p.next()
	return p.fileOrNil(), p.first
}
</code></pre>

<p><code>fileOrNil</code> 方法其实就是对上面介绍的 Go 语言文法的实现，该方法首先会解析文件开头的 <code>package</code> 定义：</p>

<pre><code class="language-go">// SourceFile = PackageClause ";" { ImportDecl ";" } { TopLevelDecl ";" } .
func (p *parser) fileOrNil() *File {
	f := new(File)
	f.pos = p.pos()

	if !p.got(_Package) {
		p.syntaxError("package statement must be first")
		return nil
	}
	f.PkgName = p.name()
	p.want(_Semi)
</code></pre>

<p>从上面的这一段方法中我们可以看出，当前方法会通过 <code>got</code> 来判断下一个 Token 是不是 <code>package</code> 关键字，如果确定是 <code>package</code> 关键字，就会执行 <code>name</code> 来匹配一个包名并将结果保存到返回的文件结构体中：</p>

<pre><code class="language-go">	for p.got(_Import) {
		f.DeclList = p.appendGroup(f.DeclList, p.importDecl)
		p.want(_Semi)
	}
</code></pre>

<p>确定了当前文件的包名之后，就开始解析可选的 <code>import</code> 声明，每一个 <code>import</code> 在解析器看来都是一个声明语句，这些声明语句都会被加入到文件的 <code>DeclList</code> 列表中。</p>

<p>在这之后就会根据编译器获取的关键字进入 switch 语句的不同分支，这些分支调用 <code>appendGroup</code> 方法并在方法中传入用于处理对应类型语句的 <code>constDecl</code>、<code>typeDecl</code> 等函数。</p>

<pre><code class="language-go">	for p.tok != _EOF {
		switch p.tok {
		case _Const:
			p.next()
			f.DeclList = p.appendGroup(f.DeclList, p.constDecl)

		case _Type:
			p.next()
			f.DeclList = p.appendGroup(f.DeclList, p.typeDecl)

		case _Var:
			p.next()
			f.DeclList = p.appendGroup(f.DeclList, p.varDecl)

		case _Func:
			p.next()
			if d := p.funcDeclOrNil(); d != nil {
				f.DeclList = append(f.DeclList, d)
			}
		}
	}

	f.Lines = p.source.line

	return f
}
</code></pre>

<p>在 <code>fileOrNil</code> 方法的最后就会返回文件最开始创建的 <code>File</code> 结构体，除此之外，该方法使用了非常多的子方法对输入的文件进行语法分析。</p>

<p>读到这里的人可能会有一些疑惑，为什么没有看到词法分析的代码，词法分析的过程其实嵌入到了语法分析过程中，一方面是因为 <code>scanner</code> 作为结构体被嵌入到了 <code>parser</code> 中，所以这个方法中的 <code>p.next()</code> 实际上调用的是 <code>scanner</code> 的 <code>next</code> 方法，它会直接获取文件中的下一个 Token，从这里我们就可以看出词法分析和语法分析其实是一起进行的。</p>

<p><code>fileOrNil</code> 与在这个方法中执行的其他子方法共同构成一颗树，根节点就是 <code>fileOrNil</code> 方法，子节点就是 <code>importDecl</code>、<code>constDecl</code> 等方法。</p>

<p><img src="https://static.studygolang.com/190331/ea36d41e40cf233d2c959478a02c495d.png" alt="golang-parse"/></p>

<p>对于每一个方法 <code>fileOrNil</code>、<code>constDecl</code> 其实就代表了一个 Go 语言中的生产规则，例如 <code>fileOrNil</code> 实现的就是：</p>

<pre><code class="language-go">SourceFile = PackageClause ";" { ImportDecl ";" } { TopLevelDecl ";" } .
</code></pre>

<p>我们根据这个规则就能很好地理解语法分析器 <code>parser</code> 的实现原理 - 将编程语言的所有生产规则映射到对应的方法上，这些方法构成的树形结构最终会返回一个抽象语法树。</p>

<p>因为大多数方法的实现都非常相似，所以这里就仅介绍 <code>fileOrNil</code> 方法的实现了，想要了解其他方法的实现原理，读者可以自行查看 <a href="https://github.com/golang/go/blob/master/src/cmd/compile/internal/syntax/parser.go">parser.go</a> 文件，这个文件包含了语法分析阶段的全部方法。</p>

<h4 id="辅助方法">
<a id="辅助方法" class="anchor" href="#%E8%BE%85%E5%8A%A9%E6%96%B9%E6%B3%95" aria-hidden="true"><span class="octicon octicon-link"></span></a>辅助方法</h4>

<p>虽然这里不会展开介绍其他类似方法的实现，但是解析器运行过程中有几个辅助方法我们还是要简单说明一下，首先就是 <code>got</code> 和 <code>want</code> 这两个常见的方法：</p>

<pre><code class="language-go">func (p *parser) got(tok token) bool {
	if p.tok == tok {
		p.next()
		return true
	}
	return false
}

func (p *parser) want(tok token) {
	if !p.got(tok) {
		p.syntaxError("expecting " + tokstring(tok))
		p.advance()
	}
}
</code></pre>

<p><code>got</code> 其实只是用于快速判断一些语句中的关键字，如果当前解析器中的 Token 是传入的 Token 就会直接跳过该 Token 并返回 <code>true</code>；而 <code>want</code> 就是对 <code>got</code> 的简单封装了，如果当前的 Token 不是我们期望的，就会立刻返回语法错误并结束这次编译。</p>

<p>这两个方法的引入能够帮助工程师在上层减少判断关键字的相关逻辑和冗余代码，让上层语法分析过程的实现更加清晰和简洁。</p>

<p>另一个方法 <code>appendGroup</code> 的实现就稍微复杂了一点，它的主要作用就是找出批量的定义，我们可以简单举一个例子：</p>

<pre><code class="language-go">var (
   a int
   b int 
)
</code></pre>

<p>这两个变量其实属于同一个组（Group），各种顶层定义的结构体 <code>ConstDecl</code>、<code>VarDecl</code> 在进行语法分析时有一个额外的参数 <code>Group</code>，这个参数就是通过 <code>appendGroup</code> 方法传递进去的：</p>

<pre><code class="language-go">func (p *parser) appendGroup(list []Decl, f func(*Group) Decl) []Decl {
	if p.tok == _Lparen {
		g := new(Group)
		p.list(_Lparen, _Semi, _Rparen, func() bool {
			list = append(list, f(g))
			return false
		})
	} else {
		list = append(list, f(nil))
	}

	return list
}
</code></pre>

<blockquote>
  <p>如果我们确实在定义变量或者常量等结构时使用了组定义的语法，那么这些语法结构的 <code>Group</code> 属性就不会为空。</p>
</blockquote>

<p><code>appendGroup</code> 方法会调用传入的 <code>f</code> 方法对输入流进行匹配并将匹配的结果追加到另一个参数 <code>File</code> 结构体中的 <code>DeclList</code> 数组中，<code>import</code>、<code>const</code>、<code>var</code>、<code>type</code> 和 <code>func</code> 声明语句都是调用 <code>appendGroup</code> 方法进行解析的。</p>

<h4 id="节点">
<a id="节点" class="anchor" href="#%E8%8A%82%E7%82%B9" aria-hidden="true"><span class="octicon octicon-link"></span></a>节点</h4>

<p>语法分析器最终会使用不同的结构体来构建抽象语法树中的节点，其中根节点 <code>File</code> 我们已经在上面介绍过了，其中包含了当前文件的包名、所有声明结构的列表和文件的行数：</p>

<pre><code class="language-go">type File struct {
	PkgName  *Name
	DeclList []Decl
	Lines    uint
	node
}
</code></pre>

<p>其他节点的结构体也都在 <a href="https://github.com/golang/go/blob/master/src/cmd/compile/internal/syntax/nodes.go">nodes.go</a> 文件中定义了，文件中定义了全部声明类型的结构体，我们在这里就简单看一下函数定义的结构：</p>

<pre><code class="language-go">
type (
	Decl interface {
		Node
		aDecl()
	}

	FuncDecl struct {
		Attr   map[string]bool
		Recv   *Field
		Name   *Name
		Type   *FuncType
		Body   *BlockStmt
		Pragma Pragma
		decl
	}
}
</code></pre>

<p>从函数定义中我们可以看出，函数在语法结构上主要由接受者、函数名、函数类型和函数体几个部分组成，函数体 <code>BlockStmt</code> 是由一系列的表达式组成的，这些表达式共同组成了函数的主体：</p>

<p><img src="https://static.studygolang.com/190331/cc111f9db2baa644eebad405cc06715c.png" alt="golang-funcdecl-struct"/></p>

<p>函数的主体其实就是一个 <code>Stmt</code> 数组，<code>Stmt</code> 是一个接口，实现该接口的类型其实也非常多，总共有 14 种不同类型的 <code>Stmt</code> 实现：</p>

<p><img src="https://static.studygolang.com/190331/ff16c86c0c216be77358df1eefeda12b.png" alt="golang-statement"/></p>

<p>这些不同类型的 <code>Stmt</code> 构成了全部命令式的 Go 语言代码，从中我们可以看到非常多熟悉的控制结构，例如 <code>if</code>、<code>for</code>、<code>switch</code> 和 <code>select</code>，这些命令式的结构在其他的编程语言中也非常常见。</p>

<h2 id="总结">
<a id="总结" class="anchor" href="#%E6%80%BB%E7%BB%93" aria-hidden="true"><span class="octicon octicon-link"></span></a>总结</h2>

<p>这一节介绍了 Go 语言的词法分析和语法分析过程，我们不仅从理论的层面介绍了词法和语法分析的原理，还从 Golang 的源代码出发详细分析 Go 语言的编译器是如何在底层实现词法和语法解析功能的。</p>

<p>了解 Go 语言的词法分析器 <code>scanner</code> 和语法分析器 <code>parser</code> 让我们对解析器处理源代码的过程有着比较清楚的认识，同时我们也在 Go 语言的文法和语法分析器中找到了熟悉的关键字和语法结构，加深了对 Go 语言的理解。</p>

<h2 id="reference">
<a id="reference" class="anchor" href="#reference" aria-hidden="true"><span class="octicon octicon-link"></span></a>Reference</h2>

<ul>
  <li><a href="https://zh.wikipedia.org/wiki/%E8%AF%8D%E6%B3%95%E5%88%86%E6%9E%90">词法分析 · Wikipedia</a></li>
  <li><a href="https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_71/com.ibm.aix.cmds3/lex.htm">lex 命令</a></li>
  <li><a href="https://groups.google.com/forum/#!msg/golang-nuts/jVjbH2-emMQ/UdZlSNhd3DwJ">what type of grammar GO programming language?</a></li>
</ul>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						