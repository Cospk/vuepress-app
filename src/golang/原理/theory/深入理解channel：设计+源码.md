---
title: 深入理解channel：设计+源码
source_url: 'https://studygolang.com/articles/18664'
category: Go原理教程
---


						<p>channel是大家在Go中用的最频繁的特性，也是Go最自豪的特性之一，你有没有思考过：</p>
<ul>
<li>Why：为什么要设计channel？</li>
<li>What：channel是什么样的？</li>
<li>How：channel是如何实现的？</li>
</ul>
<p>这篇文章，就来回答这3个问题。</p>
<h3 id="channel解决什么问题？"><a href="#channel解决什么问题？" class="headerlink" title="channel解决什么问题？"></a>channel解决什么问题？</h3><p>在Golang诞生之前，各编程语言都使用多线程进行编程，但多线程复杂、混乱、难以管理，对开发者并不是多么友好。</p>
<p>Golang是Google为了解决高并发搜索而设计的，它们想使用简单的方式，高效解决并发问题，最后做成了，然后又把Golang开源了出来，以及到处推广，所以Golang自从诞生之初，就风风火火。</p>
<p>从Golang文档中，我们可以知道，为啥Golang设计了channel，以及channel解决了什么问题？</p>
<p><a href="https://golang.org/doc/#go_concurrency_patterns" target="_blank" rel="noopener">Go Concurrency Patterns:</a></p>
<blockquote>
<p>Concurrency is the key to designing high performance network services. Go’s concurrency primitives (goroutines and channels) provide a simple and efficient means of expressing concurrent execution. In this talk we see how tricky concurrency problems can be solved gracefully with simple Go code.</p>
</blockquote>
<p>Golang使用<code>goroutine</code>和<code>channel</code>简单、高效的解决并发问题，<strong>channel解决的是goroutine之间的通信</strong>。</p>
<h3 id="channel是怎么设计的？"><a href="#channel是怎么设计的？" class="headerlink" title="channel是怎么设计的？"></a>channel是怎么设计的？</h3><p>我们以为channel是一个通道：</p>
<p><img src="http://img.lessisbetter.site/2019-03-pipeline.jpeg" alt=""></p>
<p>实际上，channel的内在是这样的：</p>
<p><img src="http://img.lessisbetter.site/2019-03-channel_design.png" alt=""></p>
<p>channel设计涉及的数据结构很简单：</p>
<ul>
<li>基于数组的循环队列，有缓冲的channel用它暂存数据</li>
<li>基于链表的单向队列，用于保存阻塞在此channel上的goroutine</li>
</ul>
<p>我本来想自己码一篇channel的设计文章，但已经有大牛：Kavya深入分析了Channel的设计，我也相信自己写的肯定不如他好，所以我把<strong>Kavya在Gopher Con上的PPT推荐给你，如果你希望成为Go大牛，你一定要读一下，现在请收藏好</strong>。</p>
<p>Kavya在Gopher Con上的演讲主题是：理解channel，他并不是教你如何使用channel，而是<strong>把channel的设计和goroutine的调度结合起来，从内在方式向你介绍</strong>。这份PPT足足有80页，包含了大量的动���，非常容易理解，你会了解到：</p>
<ul>
<li>channel的创建</li>
<li>各种场景的发送和接收</li>
<li>goroutine的调度</li>
<li>goroutine的阻塞和唤醒</li>
<li>channel和goroutine在select操作下</li>
</ul>
<p>Kavya的PPT应该包含了channel的80%的设计思想，但也有一些缺失，需要你阅读源码：</p>
<ul>
<li>channel关闭时，gorontine的处理</li>
<li>创建channel时，不同的创建方法</li>
<li>读channel时的非阻塞操作</li>
<li>…</li>
</ul>
<p>PPT在此：<a href="https://speakerdeck.com/kavya719/understanding-channels" target="_blank" rel="noopener">Understanding Channels</a>，如果你有心，还可以在这个网站看到Kavya关于goroutine调度的PPT，福利哦????。(访问不了请翻墙，或最下面看Github备份)</p>
<h3 id="channel是怎么实现的？"><a href="#channel是怎么实现的？" class="headerlink" title="channel是怎么实现的？"></a>channel是怎么实现的？</h3><p><a href="https://github.com/golang/go/blob/master/src/runtime/chan.go" target="_blank" rel="noopener">chan.go</a>是channel的主要实现文件，只有700行，十分佩服Go团队，<strong>实现的如此精简，却发挥如此大的作用</strong>！！！</p>
<p>看完Kavya的PPT，你已经可以直接看channel的源码了，如果有任何问题，思考一下你也可以想通，如果有任何问题可博客文章留言或公众号私信进行讨论。</p>
<p>另外，推荐一篇在Medium（国外高质量文章社区）上获得500+赞的源码分析文章，非常详细。</p>
<p>文章链接：<a href="https://codeburst.io/diving-deep-into-the-golang-channels-549fd4ed21a8" target="_blank" rel="noopener">Diving deep into the golang channels</a></p>
<h3 id="我学到了什么？"><a href="#我学到了什么？" class="headerlink" title="我学到了什么？"></a>我学到了什么？</h3><p>阅读channel源码我学到了一些东西，分享给大家。</p>
<p>channel的4个特性的实现：</p>
<ul>
<li>channel的goroutine安全，是通过mutex实现的。</li>
<li>channel的FIFO，是通过循环队列实现的。</li>
<li>channel的通信：在goroutine间传递数据，是通过仅共享hchan+数据拷贝实现的。</li>
<li>channel的阻塞是通过goroutine自己挂起，唤醒goroutine是通过对方goroutine唤醒实现的。</li>
</ul>
<p>channel的其他实现：</p>
<ul>
<li>发送goroutine是可以访问接收goroutine的内存空间的，接收goroutine也是可以直接访问发送goroutine的内存空间的，看<code>sendDirect</code>、<code>recvDirect</code>函数。</li>
<li>无缓冲的channel始终都是直接访问对方goroutine内存的方式，把手伸到别人的内存，把数据放到接收变量的内存，或者从发送goroutine的内存拷贝到自己内存。省掉了对方再加锁获取数据的过程。</li>
<li>接收goroutine读不到数据和发送goroutine无法写入数据时，是把自己挂起的，这就是channel的阻塞操作。阻塞的接收goroutine是由发送goroutine唤醒的，阻塞的发送goroutine是由接收goroutine唤醒的，看<code>gopark</code>、<code>goready</code>函数在<code>chan.go</code>中的调用。</li>
<li>接收goroutine当channel关闭时，读channel会得到0值，并不是channel保存了0值，而是它发现channel关闭了，把接收数据的变量的值设置为0值。</li>
<li>channel的操作/调用，是通过reflect实现的，可以看reflect包的<code>makechan</code>, <code>chansend</code>, <code>chanrecv</code>函数。</li>
</ul>
<p>如果阅读<a href="https://github.com/golang/go/blob/master/src/runtime/chan_test.go" target="_blank" rel="noopener">chan_test.go</a>还会学到一些骚操作，比如：</p>

<pre class="language-go"><code>
if <-stopCh {
    // do stop
}
</code></pre>

<p>而不是写成：</p>

<pre class="language-go"><code>
if stop := <-stopCh; stop {
    // do stop
}
</code></pre>

<p>这就是关于channel的设计和实现的分享，希望你通过Kavya的PPT和代码阅读能深入了解channel。</p>
<h3 id="链接"><a href="#链接" class="headerlink" title="链接"></a>链接</h3><ul>
<li>chan.go：<a href="https://github.com/golang/go/blob/master/src/runtime/chan.go" target="_blank" rel="noopener">https://github.com/golang/go/blob/master/src/runtime/chan.go</a></li>
<li>chan_test.go：<a href="https://github.com/golang/go/blob/master/src/runtime/chan_test.go" target="_blank" rel="noopener">https://github.com/golang/go/blob/master/src/runtime/chan_test.go</a></li>
<li>Understanding channels在Github的备份: <a href="https://github.com/Shitaibin/shitaibin.github.io/blob/hexo_resource/files/GopherCon_v10.0.pdf" target="_blank" rel="noopener">https://github.com/Shitaibin/shitaibin.github.io/blob/hexo_resource/files/GopherCon_v10.0.pdf</a></li>
</ul>
<blockquote>
<ol>
<li>如果这篇文章对你有帮助，不妨关注下我的Github，有文章会收到通知。</li>
<li>本文作者：<a href="http://lessisbetter.site/about/">大彬</a></li>
<li>如果喜欢本文，随意转载，但请保留此原文链接：<a href="http://www.lessisbetter.site/2019/03/03/golang-channel-design-and-source/" target="_blank" rel="noopener">http://www.lessisbetter.site/2019/03/03/golang-channel-design-and-source/</a></li>
</ol>
</blockquote>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						