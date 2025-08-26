---
title: Go调度器系列（3）图解调度原理
source_url: 'https://studygolang.com/articles/19563'
category: Go原理教程
---


						<p>如果你已经阅读了前2篇文章：<a href="http://lessisbetter.site/2019/03/10/golang-scheduler-1-history/">《调度起源》</a>和<a href="http://lessisbetter.site/2019/03/26/golang-scheduler-2-macro-view/">《宏观看调度器》</a>，你对G、P、M肯定已经不再陌生，我们这篇文章就介绍Go调度器的基本原理，本文总结了12个主要的场景，覆盖了以下内容：</p>
<ol>
<li>G的创建和分配。</li>
<li>P的本地队列和全局队列的负载均衡。</li>
<li>M如何寻找G。</li>
<li>M如何从G1切换到G2。</li>
<li>work stealing，M如何去偷G。</li>
<li>为何需要自旋线程。</li>
<li>G进行系统调用，如何保证P的其他G’可以被执行，而不是饿死。</li>
<li>Go调度器的抢占。</li>
</ol>
<h3 id="12场景"><a href="#12场景" class="headerlink" title="12场景"></a>12场景</h3><blockquote>
<p>提示：图在前，场景描述在后。</p>
</blockquote>
<p><img src="http://img.lessisbetter.site/2019-04-image-20190331190809649-4030489.png" alt=""></p>
<blockquote>
<p>上图中三角形、正方形、圆形分别代表了M、P、G，正方形连接的绿色长方形代表了P的本地队列。</p>
</blockquote>
<p><strong>场景1</strong>：p1拥有g1，m1获取p1后开始运行g1，g1使用<code>go func()</code>创建了g2，为了局部性g2优先加入到p1的本地队列。</p>
<p><img src="http://img.lessisbetter.site/2019-04-image-20190331190826838-4030506.png" alt=""></p>
<p><strong>场景2</strong>：<strong>g1运行完成后(函数：<code>goexit</code>)，m上运行的goroutine切换为g0，g0负责调度时协程的切换（函数：<code>schedule</code>）</strong>。从p1的本地队列取g2，从g0切换到g2，并开始运行g2(函数：<code>execute</code>)。实现了<strong>线程m1的复用</strong>。</p>
<p><img src="http://img.lessisbetter.site/2019-04-image-20190331160718646-4019638.png" alt=""></p>
<p><strong>场景3</strong>：假设每个p的本地队列只能存4个g。g2要创建了6个g，前4个g（g3, g4, g5, g6）已经加入p1的本地队列，p1本地队列满了。</p>
<p><img src="http://img.lessisbetter.site/2019-04-image-20190331160728024-4019648.png" alt=""></p>
<blockquote>
<p>蓝色长方形代表全局队列。</p>
</blockquote>
<p><strong>场景4</strong>：g2在创建g7的时候，发现p1的本地队列已满，需要执行<strong>负载均衡</strong>，把p1中本地队列中前一半的g，还有新创建的g<strong>转移</strong>到全局队列（实现中并不一定是新的g，如果g是g2之后就执行的，会被保存在本地队列，利用某个老的g替换新g加入全局队列），这些g被转移到全局队列时，会被打乱顺序。所以g3,g4,g7被转移到全局队列。</p>
<p><img src="http://img.lessisbetter.site/2019-04-image-20190331161138353-4019898.png" alt=""></p>
<p><strong>场景5</strong>：g2创建g8时，p1的本地队列未满，所以g8会被加入到p1的本地队列。</p>
<p><img src="http://img.lessisbetter.site/2019-04-image-20190331162734830-4020854.png" alt=""></p>
<p><strong>场景6</strong>：<strong>在创建g时，运行的g会尝试唤醒其他空闲的p和m执行</strong>。假定g2唤醒了m2，m2绑定了p2，并运行g0，但p2本地队列没有g，m2此时为自旋线程（没有G但为运行状态的线程，不断寻找g，后续场景会有介绍）。</p>
<p><img src="http://img.lessisbetter.site/2019-04-image-20190331162717486-4020837.png" alt=""></p>
<p><strong>场景7</strong>：m2尝试从全局队列(GQ)取一批g放到p2的本地队列（函数：<code>findrunnable</code>）。m2从全局队列取的g数量符合下面的公式：</p>
<div class="highlight-wrap"><button class="copy-btn">复制</button><figure class="highlight plain"><table><tbody><tr><td class="gutter"><pre><span class="line">1</span><br></pre></td><td class="code"><pre><span class="line">n = min(len(GQ)/GOMAXPROCS + 1, len(GQ/2))</span><br></pre></td></tr></tbody></table></figure>