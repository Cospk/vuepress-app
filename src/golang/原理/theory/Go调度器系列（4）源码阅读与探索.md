---
title: Go调度器系列（4）源码阅读与探索
source_url: 'https://studygolang.com/articles/19762'
category: Go原理教程
---


						<p>各位朋友，这次想跟大家分享一下Go调度器源码阅读相关的知识和经验，网络上已经有很多剖析源码的好文章，所以这篇文章<strong>不是又一篇源码剖析文章，注重的不是源码分析分享，而是带给大家一些学习经验，希望大家能更好的阅读和掌握Go调度器的实现</strong>。</p>
<p>本文主要分2个部分：</p>
<ol>
<li><strong>解决如何阅读源码的问题</strong>。阅读源码本质是把脑海里已经有的调度设计，看看到底是不是这么实现的，是怎么实现的。</li>
<li><strong>带给你一个探索Go调度器实现的办法</strong>。源码都到手了，你可以修改、<strong>窥探</strong>，通过这种方式解决阅读源码过程中的疑问，验证一些想法。比如：负责调度的是g0，怎么才能<code>schedule()</code>在执行时，当前是g0呢？</li>
</ol>
<h2 id="如何阅读源码"><a href="#如何阅读源码" class="headerlink" title="如何阅读源码"></a>如何阅读源码</h2><h3 id="阅读前提"><a href="#阅读前提" class="headerlink" title="阅读前提"></a>阅读前提</h3><p>阅读Go源码前，最好已经掌握Go调度器的设计和原理，如果你还无法回答以下问题：</p>
<ol>
<li>为什么需要Go调度器？</li>
<li>Go调度器与系统调度器有什么区别和关系/联系？</li>
<li>G、P、M是什么，三者的关系是什么？</li>
<li>P有默认几个？</li>
<li>M同时能绑定几个P？</li>
<li>M怎么获得G？</li>
<li>M没有G怎么办？</li>
<li>为什么需要全局G队列？</li>
<li>Go调度器中的负载均衡的2种方式是什么？</li>
<li>work stealing是什么？什么原理？</li>
<li>系统调用对G、P、M有什么影响？</li>
<li>Go调度器抢占是什么样的？一定能抢占成功吗？</li>
</ol>
<p>建议阅读Go调度器系列文章，以及文章中的参考资料：</p>
<ol>
<li><a href="http://lessisbetter.site/2019/03/10/golang-scheduler-1-history/">Go调度器系列（1）起源</a></li>
<li><a href="http://lessisbetter.site/2019/03/26/golang-scheduler-2-macro-view/">Go调度器系列（2）宏观看调度器</a></li>
<li><a href="http://lessisbetter.site/2019/04/04/golang-scheduler-3-principle-with-graph/">Go调度器系列（3）图解调度原理</a></li>
</ol>
<h3 id="优秀源码资料推荐"><a href="#优秀源码资料推荐" class="headerlink" title="优秀源码资料推荐"></a>优秀源码资料推荐</h3><p>既然你已经能回答以上问题，说明你对Go调度器的设计已经有了一定的掌握，关于Go调度器源码的优秀资料已经有很多，我这里推荐2个：</p>
<ol>
<li><strong>雨痕的Go源码剖析</strong>六章并发调度，不止是源码，是以源码为基础进行了详细的Go调度器介绍：ttps://github.com/qyuhen/book</li>
<li><strong>Go夜读</strong>第12期，golang中goroutine的调度，M、P、G各自的一生状态，以及转换关系：<a href="https://reading.developerlearning.cn/reading/12-2018-08-02-goroutine-gpm/" target="_blank" rel="noopener">https://reading.developerlearning.cn/reading/12-2018-08-02-goroutine-gpm/</a></li>
</ol>
<p>Go调度器的源码还涉及GC等，阅读源码时，可以暂时先跳过，主抓调度的逻辑。</p>
<p>另外，Go调度器涉及汇编，也许你不懂汇编，不用担心，雨痕的文章对汇编部分有进行解释。</p>
<p>最后，送大家一幅流程图，画出了主要的调度流程，大家也可边阅读边画，增加理解，<strong>高清版可到博客下载（原图原文跳转）</strong>。</p>
<p><img src="http://img.lessisbetter.site/2019-04-shcedule-flow.png" alt=""></p>
<h2 id="如何探索调度器"><a href="#如何探索调度器" class="headerlink" title="如何探索调度器"></a>如何探索调度器</h2><p>这部分教你探索Go调度器的源码，验证想法，主要思想就是，下载Go的源码，添加调试打印，编译修改的源文件，生成修改的go，然后使用修改go运行测试代码，观察结果。</p>
<h3 id="下载和编译Go"><a href="#下载和编译Go" class="headerlink" title="下载和编译Go"></a>下载和编译Go</h3><ol>
<li><p>Github下载，并且换到go1.11.2分支，本文所有代码修改都基于go1.11.2版本。</p>

<pre><code>
$ GODIR=$GOPATH/src/github.com/golang/go
$ mkdir -p $GODIR
$ cd $GODIR/..
$ git clone https://github.com/golang/go.git
$ cd go
$ git fetch origin go1.11.2
$ git checkout origin/go1.11.2
$ git checkout -b go1.11.2
$ git checkout go1.11.2
</code></pre>

</li>
<li><p>初次编译，会跑测试，耗时长一点</p>

<pre><code>
$ cd $GODIR/src
$ ./all.bash
</code></pre>

</li>
<li><p>以后每次修改go源码后可以这样，4分钟左右可以编译完成</p>

<pre><code>
$ cd  $GODIR/src
$ time ./make.bash
Building Go cmd/dist using /usr/local/go.
Building Go toolchain1 using /usr/local/go.
Building Go bootstrap cmd/go (go_bootstrap) using Go toolchain1.
Building Go toolchain2 using go_bootstrap and Go toolchain1.
Building Go toolchain3 using go_bootstrap and Go toolchain2.
Building packages and commands for linux/amd64.
---
Installed Go for linux/amd64 in /home/xxx/go/src/github.com/golang/go
Installed commands in /home/xxx/go/src/github.com/golang/go/bin

real	1m11.675s
user	4m4.464s
sys	0m18.312s
</code></pre>

</li>
</ol>
<p>编译好的go和gofmt在<code>$GODIR/bin</code>目录。<br></p>

<pre><code>
$ ll $GODIR/bin
total 16044
-rwxrwxr-x 1 vnt vnt 13049123 Apr 14 10:53 go
-rwxrwxr-x 1 vnt vnt  3377614 Apr 14 10:53 gofmt
</code></pre>

<ol start="4">
<li><p>为了防止我们修改的go和过去安装的go冲突，创建igo软连接，指向修改的go。</p>

<pre><code>
$ mkdir -p ~/testgo/bin
$ cd ~/testgo/bin
$ ln -sf $GODIR/bin/go igo
</code></pre>

</li>
<li><p>最后，把<code>~/testgo/bin</code>加入到<code>PATH</code>，就能使用<code>igo</code>来编译代码了，运行下igo，应当获得go1.11.2的版本：</p>

<pre><code>
$ igo version
go version go1.11.2 linux/amd64
</code></pre>

</li>
</ol>
<p>当前，已经掌握编译和使用修改的go的办法，接下来就以1个简单的例子，教大家如何验证想法。</p>
<h3 id="验证schedule-由g0执行"><a href="#验证schedule-由g0执行" class="headerlink" title="验证schedule()由g0执行"></a>验证schedule()由g0执行</h3><p>阅读源码的文章，你已经知道了g0是负责调度的，并且g0是全局变量，可在runtime包的任何地方直接使用，看到<code>schedule()</code>代码如下（所在文件：<code>$GODIR/src/runtime/proc.go</code>）：</p>

<pre><code class=" language-go">
// One round of scheduler: find a runnable goroutine and execute it.
// Never returns.
func schedule() {
	// 获取当前g，调度时这个g应当是g0
	_g_ := getg()

	if _g_.m.locks != 0 {
		throw("schedule: holding locks")
	}

	// m已经被某个g锁定，先停止当前m，等待g可运行时，再执行g，并且还得到了g所在的p
	if _g_.m.lockedg != 0 {
		stoplockedm()
		execute(_g_.m.lockedg.ptr(), false) // Never returns.
	}

	// 省略...
}
</code></pre>

<p><strong>问题</strong>：既然g0是负责调度的，为何<code>schedule()</code>每次还都执行<code>_g_ := getg()</code>，直接使用g0不行吗？<code>schedule()</code>真的是g0执行的吗？</p>
<p>在<a href="http://lessisbetter.site/2019/03/26/golang-scheduler-2-macro-view/">《Go调度器系列（2）宏观看调度器》</a>这篇文章中我曾介绍了trace的用法，阅读代码时发现<strong>使用<code>debug.schedtrace</code>和<code>print()</code>函数可以用作打印调试信息</strong>，那我们是不是可以使用这种方法打印我们想获取的信息呢？当然可以。</p>
<p>另外，注意<code>print()</code>并不是<code>fmt.Print()</code>，也不是C语言的<code>printf</code>，所以不是格式化输出，它是汇编实现的，我们不深入去了解它的实现了，现在要掌握它的用法：</p>

<pre><code class=" language-go">
// The print built-in function formats its arguments in an
// implementation-specific way and writes the result to standard error.
// Print is useful for bootstrapping and debugging; it is not guaranteed
// to stay in the language.
func print(args ...Type)
</code></pre>

<p>从上面可以看到，它接受可变长参数，我们使用的时候只需要传进去即可，但要手动控制格式。</p>
<p>我们修改<code>schedule()</code>函数，使用<code>debug.schedtrace > 0</code>控制打印，加入3行代码，把goid给打印出来，如果始终打印goid为0，则代表调度确实是由g0执行的：</p>

<pre><code class=" language-go">
if debug.schedtrace > 0 {
	print("schedule(): goid = ", _g_.goid, "\n") // 会是0吗？是的
}
</code></pre>

<p><code>schedule()</code>如下：</p>

<pre><code class=" language-go">
// One round of scheduler: find a runnable goroutine and execute it.
// Never returns.
func schedule() {
	// 获取当前g，调度时这个g应当是g0
	_g_ := getg()

	if debug.schedtrace > 0 {
		print("schedule(): goid = ", _g_.goid, "\n") // 会是0吗？是的
	}

	if _g_.m.locks != 0 {
		throw("schedule: holding locks")
	}
	// ...
}
</code></pre>

<p>编译igo：<br></p>

<pre><code>
$ cd  $GODIR/src
$ ./make.bash
</code></pre>

<p>编写一个简单的demo（不能更简单）：</p>

<pre><code class=" language-go">
package main

func main() {
}
</code></pre>

<p>结果如下，你会发现所有的<code>schedule()</code>函数调用都打印<code>goid = 0</code>，足以证明Go调度器的调度由g0完成（如果你认为还是缺乏说服力，可以写复杂一些的demo）：<br></p>

<pre><codo>
$ GODEBUG=schedtrace=1000 igo run demo1.go
schedule(): goid = 0
schedule(): goid = 0
SCHED 0ms: gomaxprocs=8 idleprocs=6 threads=4 spinningthreads=1 idlethreads=0 runqueue=0 [0 0 0 0 0 0 0 0]
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
schedule(): goid = 0
// 省略几百行
</code></pre>

<p><strong>启发比结论更重要，希望各位朋友在学习Go调度器的时候，能多一些自己的探索和研究，而不仅仅停留在看看别人文章之上</strong>。</p>
<h3 id="参考资料"><a href="#参考资料" class="headerlink" title="参考资料"></a>参考资料</h3><ol>
<li><a href="https://golang.org/doc/install/source" target="_blank" rel="noopener">Installing Go from source</a></li>
</ol>
<blockquote>
<ol>
<li>如果这篇文章对你有帮助，不妨关注下我的Github，有文章会收到通知。</li>
<li>本文作者：<a href="http://lessisbetter.site/about/">大彬</a></li>
<li>如果喜欢本文，随意转载，但请保留此原文链接：<a href="http://lessisbetter.site/2019/04/14/golang-scheduler-4-explore-source-code/">http://lessisbetter.site/2019/04/14/golang-scheduler-4-explore-source-code/</a></li>
</ol>
</blockquote>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						