---
title: 如何定位 golang 进程 hang 死的 bug
source_url: 'https://studygolang.com/articles/11880'
category: Go原理教程
---


						<div class="content markitup-box">
                                <p>之前在 golang 群里有人问过为什么程序会莫名其妙的 hang 死然后不再响应任何请求。单核 cpu 打满。</p>
<p>这个特征和我们公司的某个系统曾经遇到的情况很相似，内部经过了很长时间的定位分析总结，期间还各种阅读 golang 的 runtime 和 gc 代码，最终才定位到是业务里出现了类型下面这样的代码：</p>
<pre class="prettyprint linenums"><code>package main

import "runtime"

func main() {
    var ch = make(chan int, 100)
    go func() {
        for i := 0; i < 100; i++ {
            ch <- 1
            if i == 88 {
                runtime.GC()
            }
        }
    }()

    for {
        // the wrong part
        if len(ch) == 100 {
            sum := 0
            itemNum := len(ch)
            for i := 0; i < itemNum; i++ {
                sum += <-ch
            }
            if sum == itemNum {
                return
            }
        }
    }

}</code></pre>
<p>在 main goroutine 里循环判断 ch 里是否数据被填满，在另一个 goroutine 里把 100 条数据塞到 ch 里。看起来程序应该是可以正常结束的对不对？</p>
<p>感兴趣的话你可以自己尝试运行一下。实际上这个程序在稍微老一些版本的 golang 上是会卡死在后面这个 for 循环上的。原因呢？</p>
<p>使用：</p>
<pre class="prettyprint linenums"><code>GODEBUG="schedtrace=300,scheddetail=1" ./test1</code></pre>
<p>应该可以看到这时候 gcwaiting 标记为 1。所以当初都怀疑是 golang gc 的 bug。。但最终折腾了半天才发现还是自己的代码的问题。</p>
<p>因为在 for 循环中没有函数调用的话，编译器不会插入调度代码，所以这个执行 for 循环的 goroutine 没有办法被调出，而在循环期间碰到 gc，那么就会卡在 gcwaiting 阶段，并且整个进程永远 hang 死在这个循环上。并不再对外响应。</p>
<p>当然，上面这段程序在最新版本的 golang 1.8/1.9 中已经不会 hang 住了(实验结果，没有深究原因)。某次更新说明中官方声称在密集循环中理论上也会让其它的 goroutine 有被调度的机会，那么我们选择相信官方，试一下下面这个程序：</p>
<pre class="prettyprint linenums"><code>package main

import (
    "fmt"
    "io"
    "log"
    "net/http"
    "runtime"
    "time"
)

func main() {
    runtime.GOMAXPROCS(runtime.NumCPU())
    go server()
    go printNum()
    var i = 1
    for {
        // will block here, and never go out
        i++
    }
    fmt.Println("for loop end")
    time.Sleep(time.Second * 3600)
}

func printNum() {
    i := 0
    for {
        fmt.Println(i)
        i++
    }
}

func HelloServer(w http.ResponseWriter, req *http.Request) {
    io.WriteString(w, "hello, world!\n")
}

func server() {
    http.HandleFunc("/", HelloServer)
    err := http.ListenAndServe(":12345", nil)

    if err != nil {
        log.Fatal("ListenAndServe: ", err)
    }
}</code></pre>
<p>运行几秒之后 curl 一发：</p>
<pre class="prettyprint linenums"><code>curl localhost:12345</code></pre>
<p>感觉还是不要再相信官方了。研究研究之后不小心写出了这样的 bug 怎么定位比较好。首先分析一下这种类型 bug 发生时的程序特征：</p>
<pre class="prettyprint linenums"><code>1. 卡死在 for 循环上
2. gcwaiting=1
3. 没有系统调用</code></pre>
<p>由于没有系统调用，不是系统调用导致的锅，所以我们没有办法借助 strace 之类的工具看程序是不是 hang 在系统调用上。而 gcwaiting=1 实际上并不能帮我们定位到问题到底出现在哪里。</p>
<p>然后就剩卡死在 for 循环上了，密集的 for 循环一般会导致一个 cpu 核心被打满。如果之前做过系统编程的同学应该对 perf 这个工具很了解，可以使用：</p>
<pre class="prettyprint linenums"><code>perf top</code></pre>
<p>对 cpu 的使用情况进行采样，这样我们就可以对 cpu 使用排名前列的程序函数进行定位。实际上 <code>perf top</code> 的执行结果也非常直观：</p>
<pre class="prettyprint linenums"><code>  99.52%  ffff                     [.] main.main
   0.06%  [kernel]                 [k] __do_softirq
   0.05%  [kernel]                 [k] 0x00007fff81843a35
   0.03%  [kernel]                 [k] mpt_put_msg_frame
   0.03%  [kernel]                 [k] finish_task_switch
   0.03%  [kernel]                 [k] tick_nohz_idle_enter
   0.02%  perf                     [.] 0x00000000000824d7
   0.02%  [kernel]                 [k] e1000_xmit_frame
   0.02%  [kernel]                 [k] VbglGRPerform</code></pre>
<p>你看，我们的程序实际上是卡在了 main.main 函数上。一发命令秒级定位。</p>
<p>妈妈再也不用担心我的程序不小心写出死循环了。实际上有时候我的一个普通循环为什么变成了死循环并不是像上面这样简单的 demo 那样好查，这时候你还可以用上 delve，最近就帮 jsoniter 定位了一个类似上面这样的 bug：</p>
<blockquote>
<p><a href="https://github.com/gin-gonic/gin/issues/1086">https://github.com/gin-gonic/gin/issues/1086</a></p>
</blockquote>
<p>从 perf 定位到函数，再用 pid attach 到进程，找到正在执行循环的 goroutine，然后结合 locals 的打印一路 next。</p>
<p>问题定位 over。</p>
<p>最后一行小字：感谢之前毛总在 golang 群的指导。</p>
<p>本文行文仓促，应该还是难免疏漏，如果你觉得哪里写的有问题，或者对文末提到的毛总顶礼膜拜，再或者对即将进入 k8s 的 json 解析库 jsoniter 非常感性趣，想要深入了解 jsoniter 作者大牛的心路历程，那么你有下面几个选择：</p>
<p>1.加入b站和毛总学习先进姿势水平</p>
<p>2.加入滴滴和 jsoniter 作者大牛 @taowen 做同事</p>
<p>3.加入滴滴来喷本文作者</p>
<p>简历可以发送到：
<a href="mailto:caochunhui@didichuxing.com">caochunhui@didichuxing.com</a></p>