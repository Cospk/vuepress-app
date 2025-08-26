---
title: 关于Go GC - Rick's ISMM keynote
source_url: 'https://studygolang.com/articles/14128'
category: Go原理教程
---


						<p>Go Blog上最近发表了<a href="https://blog.golang.org/ismmkeynote" target="_blank">一篇文章</a>，内容是Richard Hudson在ISMM 2018上面的"Getting to Go"的讲座，包括keynote以及笔记，从中可以看到Go GC设计的考量，以及演进的脉络，文章下面摘要一些内容出来。</p><p><br/></p>

<img src="https://static.studygolang.com/180811/b42ea2c534ebe1298d8cc2ac7bbcbb9f.jpg" alt="">

<p>Go调度的单位是轻量级的goroutine，goroutine被调度器调度到有限的几个线程里执行，每个goroutine都有自己的stack，所以Go会有成千上万个的stack作为GC的Root，在GC safepoint需要去停止和遍历。</p>

<img src="https://static.studygolang.com/180811/b8834f4821d12d484de3122edb74cae5.jpg" alt="">

<p>Go支持值类型，或者说主要是基于值类型，值类型没有额外的object header之类的开销。因为值类型的存在，能够控制layout，通过FFI和C++的交互速度也很快，对于GC来说栈上分配的值类型可以降低GC压力。值类型可以分配在堆上，指向值类型的指针，或者值类型内部某个字段的指针，能够保持值类型在GC中存活。</p>

<img src="https://static.studygolang.com/180811/f5654817322de6bee2b2a25a3d203bbc.jpg" alt="">

<p>静态AOT编译。Go只做了静态编译，不支持JIT。好处是编译出的结果具有可预测的、稳定的执行性能，不好的地方不能像JIT那样利用执行时的反馈来优化编译。</p>

<img src="https://static.studygolang.com/180811/349d0eec3a331f13651e6acd92665884.jpg" alt="">

<p>Go现在只有两个可以控制GC的方式，这也反应了GC——或者Go语言设计上追求简单的基调。</p><p>一个是很早就有的设置，可以设置一个自上次GC后新分配的内存的和上次GC后的使用的内存的比例，达到这个比例就触发一次新的GC，默认是100。可以通过GOGC参数指定，也可以通过SetGCPercent在运行时指定。</p><p>另外一个SetMaxHeap，现在还只在内部使用，是Go可以使用的最大Heap的大小，类似于Java的-Xmx。增加这个参数是基于：如果GC已经无法把内存降下去了，就应该降低程序的负载，而不是一直分配更多的内存出来。</p>

<img src="https://static.studygolang.com/180811/9c52dcea8d61ff03b9f23d628aa7f1ac.jpg" alt="">

<p>Go的GC在最初设计的时候，就以低延迟为主要的目标，这是一个无比正确的决定。现在JVM的GC也在从以吞吐量为目标的GC转向低延迟的G1，ZGC等。</p><p>一道简单的数学题，如果能保证99%的系统GC延迟在10ms以下，用户的浏览器需要向服务器发送100个请求，或者访问五次页面，每次需要发送20个请求，那么只有37%的用户能够享受到完全10ms以下的延迟——在服务化的架构中，这个用户可以认为是一台调用其他服务的server，问题就更明显了。</p><p>如果想要让99%的用户都能够有10ms以下的延迟，那么系统的就需要保证99.99%的GC延迟在10ms以下。Jeff Dean在2014年发表的论文， "The Tail at Scale"，详细阐述了这个称为 tyranny of the 9s的问题。</p>

<img src="https://static.studygolang.com/180811/16e02f8d63e2d4e006b95bced373564c.jpg" alt="">

<p>2014年制定的的Go GC目标。2014年的时候其他语言的GC实现在延迟方面基本还都是灾难性的，这个目标看着是给自己挖了很大的坑?</p>

<img src="https://static.studygolang.com/180811/9af9d220d7937b1bf9a9eb39069ee2d6.jpg" alt="">

<p>本来打算是做一个不需要read barrier 的，并行的，带内存copying的GC，但是时间紧任务重，所以最后做的是没有copying的GC。Read Barrier的开销，低延迟，内存compaction，这三个目标权衡之下放弃了最后一个，通常舍弃compaction的后果是可能出现内存碎片，降低内存分配速度。不过TCMalloc, Hoard, Intel's Scalable Malloc等这些在C中实现的allocator给了Go team信心，GC并不一定要做内存move。</p><p>当然目前来看实现的并发Copy的低延迟GC都是带read barrier的，Go一开始的野心是大了点。</p>

<img src="https://static.studygolang.com/180811/9b0e75d4266748a46f2a0e388dead28a.jpg" alt="">

<p>Write barrier是省不了的，并发标记需要write barrier的支持。因为write barrier只在GC的时候开启，程序性能的影响被尽量的降低了。</p>

<img src="https://static.studygolang.com/180811/6bfac76fa266afe3461e1273dabeb506.jpg" alt="">

<p>Go GC内存分配的实现。内存划分成span，每个span只分配同样大小的内存，不同size的对象分配通过span互相隔离。这样做的好处:</p><ol><li>分配的内存大小都是固定的，如果指向对象内部某个field的指针，可以直接算出对象的起始地址。</li><li>低内存碎片。即使GC的时候不做compaction也不会遭受严重的内存碎片问题。</li><li>内存按size划分后，分配内存的竞争很低，因而有较高的性能。</li><li>分配速度。虽然没有像JVM那样整理内存的GC后可以直接bump pointer来分配快，但是已经比C快了。</li></ol>

<img src="https://static.studygolang.com/180811/02dd86ca40d6e382f7d315c37b4ebe46.jpg" alt="">

<p>使用单独的mark bits 记录，记录每个字段是是不是指针这样的元信息。给GC标记和内存allocation使用。</p>

<img src="https://static.studygolang.com/180811/b6ac9c932acc95b0633a2edde36cf9fe.jpg" alt="">

<img src="https://static.studygolang.com/180811/b6ac9c932acc95b0633a2edde36cf9fe.jpg" alt="">

<img src="https://static.studygolang.com/180811/f3c7db85470cf36f5fc45ddc53ea45da.jpg" alt="">

<img src="https://static.studygolang.com/180811/ac788b415249af8fddf1645c48a154e2.jpg" alt="">

<p>1.6，1.7，1.8，连续三个版本GC大幅降低了GC的延迟，从40ms降低到了1ms的级别。</p>

<img src="https://static.studygolang.com/180811/31e123e121c6b8bde2f2ec01be3ccbb1.jpg" alt="">

<p>2014年的SLO中，10ms延迟的目标在1.6.3就达到了。如今是8012年，现在有了新的SLO，500微秒的STW时间看着是又给自己挖了坑。</p><p>Rick还讲了一些失败的工作，主要是面向请求的GC和分代GC。</p>

<img src="https://static.studygolang.com/180811/000229404f7cd28963fbe3eb48562302.jpg" alt="">

<p>ROC是针对大部分Request-Response型的在线应用场景，更高效率的回收一次请求期间短生命周期的对象。思路是，一个goroutine死掉的时候，把只有这个goroutine使用的对象，都回收了，因为回收的对象不被别的goroutine使用，所以是不需要同步的，这点会比分代回收要强。</p><p>然而这需要一直开着write barrier去记录一个对象是只被当前的goroutine使用，还是被传递给其他goroutine了，而write barrier太慢了。</p>

<img src="https://static.studygolang.com/180811/d0095975fd54a93b192718abd55f855f.jpg" alt="">

<p>ROC失败之后的下一步还是尝试使用历史悠久，也很成熟的分代GC。但是出于低延迟的目标，分代GC也不打算做copying，这就难办了，不做copying怎么做promotion呢？变通的方法是不区分old区和young区，而是用一个bit verctor来记录区域内的每块内存是old(1)还是young(0)。每次young gc，被old的指针指向的都标记成old，然后所有标记为0的都被回收。然后分配的时候从这个bitvetcor里找下一个值为0的区域分配，直到下一次young gc。</p><p>这个方案依然需要writer barrier一直开着，但是非GC期间可以有个fast writer barrier的优化。分代GC最终的性能也不理想，fast writer barrier虽然快，但是还没有足够快。</p>

<img src="https://static.studygolang.com/180811/d17487f4c9d55ac5f4f8b97ca594bf20.jpg" alt="">

<p>另外一个分代GC不理想的原因，是因为Go是基于value类型，即使有用指针，只要逃逸分析发现作用域没有逃逸，也会在栈上分配对象。结果是Go的短寿命周期对象通常在栈上分配，让young gc的收益变小。</p>

<img src="https://static.studygolang.com/180811/e6b10a20252beb97573cabc8505159f8.jpg" alt="">

<p>使用Card Marking可以消除非GC时的writer barrier。Card Table是分代GC常用的优化方法，可以省去writer barrier的开销，但要有个pointer hash的开销。Card 记录一定区域内pointer的hash值，如果有pointer变化，hash就会变化，card就被认为是dirty的。在现代支持AES((Advanced Encryption Standard)指令的硬件上，维护这样的一个hash非常的快。</p><p>使用Card Marking的分代GC性能测试仍然不是特别理想，影响的因素很多。或许可以在GC中发现分代会比较快的话就开启分代，否则就关闭。</p>

<img src="https://static.studygolang.com/180811/df5b965f6712de896f29106d26cb0108.jpg" alt="">

<p>看看硬件方面，RAM的容量增长很快，价格下降也快，也许不用在GC上这么抠了嘞?</p>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						