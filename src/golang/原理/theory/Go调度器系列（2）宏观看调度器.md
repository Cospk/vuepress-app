---
title: Go调度器系列（2）宏观看调度器
source_url: 'https://studygolang.com/articles/19299'
category: Go原理教程
---


						<p>上一篇文章<a href="http://lessisbetter.site/2019/03/10/golang-scheduler-1-history/">《Go语言高阶：调度器系列（1）起源》</a>，学goroutine调度器之前的一些背景知识，<strong>这篇文章则是为了对调度器有个宏观的认识，从宏观的3个角度，去看待和理解调度器是什么样子的，但仍然不涉及具体的调度原理</strong>。</p>
<p>三个角度分别是：</p>
<ol>
<li>调度器的宏观组成</li>
<li>调度器的生命周期</li>
<li>GMP的可视化感受</li>
</ol>
<p>在开始前，先回忆下调度器相关的3个缩写：</p>
<ul>
<li><strong>G</strong>: goroutine，每个G都代表1个goroutine </li>
<li><strong>M</strong>: 工作线程，是Go语言定义出来在用户层面描述系统线程的对象 ，每个M代表一个系统线程</li>
<li><strong>P</strong>: 处理器，它包含了运行Go代码的资源。</li>
</ul>
<p>3者的简要关系是P拥有G，M必须和一个P关联才能运行P拥有的G。 </p>
<h3 id="调度器的功能"><a href="#调度器的功能" class="headerlink" title="调度器的功能"></a>调度器的功能</h3><p><a href="http://lessisbetter.site/2019/03/10/golang-scheduler-1-history/">《Go语言高阶：调度器系列（1）起源》</a>中介绍了协程和线程的关系，协程需要运行在线程之上，线程由CPU进行调度。</p>
<p>在Go中，<strong>线程是运行goroutine的实体，调度器的功能是把可运行的goroutine分配到工作线程上</strong>。</p>
<p>Go的调度器也是经过了多个版本的开发才是现在这个样子的，</p>
<ul>
<li>1.0版本发布了最初的、最简单的调度器，是G-M模型，存在4类问题</li>
<li>1.1版本重新设计，修改为G-P-M模型，奠定当前调度器基本模样</li>
<li><a href="https://golang.org/doc/go1.2#preemption" target="_blank" rel="noopener">1.2版本</a>加入了抢占式调度，防止协程不让出CPU导致其他G饿死</li>
</ul>
<blockquote>
<p>在<code>$GOROOT/src/runtime/proc.go</code>的开头注释中包含了对Scheduler的重要注释，介绍Scheduler的设计曾拒绝过3种方案以及原因，本文不再介绍了，希望你不要忽略为数不多的官方介绍。</p>
</blockquote>
<h3 id="Scheduler的宏观组成"><a href="#Scheduler的宏观组成" class="headerlink" title="Scheduler的宏观组成"></a>Scheduler的宏观组成</h3><p><a href="https://tonybai.com/" target="_blank" rel="noopener">Tony Bai</a>在<a href="https://tonybai.com/2017/06/23/an-intro-about-goroutine-scheduler/" target="_blank" rel="noopener">《也谈goroutine调度器》</a>中的这幅图，展示了goroutine调度器和系统调度器的关系，而不是把二者割裂开来，并且从宏观的角度展示了调度器的重要组成。</p>
<p><img src="http://img.lessisbetter.site/2019-03-goroutine-scheduler-model.png" alt=""></p>
<p>自顶向下是调度器的4个部分：</p>
<ol>
<li><strong>全局队列</strong>（Global Queue）：存放等待运行的G。</li>
<li><strong>P的本地队列</strong>：同全局队列类似，存放的也是等待运行的G，存的数量有限，不超过256个。新建G’时，G’优先加入到P的本地队列，如果队列满了，则会把本地队列中一半的G移动到全局队列。</li>
<li><strong>P列表</strong>：所有的P都在程序启动时创建，并保存在数组中，最多有GOMAXPROCS个。</li>
<li><strong>M</strong>：线程想运行任务就得获取P，从P的本地队列获取G，P队列为空时，M也会尝试从全局队列<strong>拿</strong>一批G放到P的本地队列，或从其他P的本地队列<strong>偷</strong>一半放到自己P的本地队列。M运行G，G执行之后，M会从P获取下一个G，不断重复下去。</li>
</ol>
<p><strong>Goroutine调度器和OS调度器是通过M结合起来的，每个M都代表了1个内核线程，OS调度器负责把内核线程分配到CPU的核上执行</strong>。</p>
<h3 id="调度器的生命周期"><a href="#调度器的生命周期" class="headerlink" title="调度器的生命周期"></a>调度器的生命周期</h3><p>接下来我们从另外一个宏观角度——生命周期，认识调度器。</p>
<p>所有的Go程序运行都会经过一个完整的调度器生命周期：从创建到结束。</p>
<p><img src="http://img.lessisbetter.site/2019-03-scheduler-lifetime.png" alt=""></p>
<p>即使下面这段简单的代码：</p>
<div class="highlight-wrap"><button class="copy-btn">复制</button><figure class="highlight go"><table><tbody><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br><span class="line">6</span><br><span class="line">7</span><br><span class="line">8</span><br></pre></td><td class="code"><pre><span class="line"><span class="keyword">package</span> main</span><br><span class="line"></span><br><span class="line"><span class="keyword">import</span> <span class="string">"fmt"</span></span><br><span class="line"></span><br><span class="line"><span class="comment">// main.main</span></span><br><span class="line"><span class="function"><span class="keyword">func</span> <span class="title">main</span><span class="params">()</span></span> {</span><br><span class="line">	fmt.Println(<span class="string">"Hello scheduler"</span>)</span><br><span class="line">}</span><br></pre></td></tr></tbody></table></figure>