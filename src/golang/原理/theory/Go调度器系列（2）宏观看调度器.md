---
title: Go调度器系列（2）宏观看调度器
source_url: 'https://studygolang.com/articles/19299'
category: Go原理教程
---
上一篇文章[《Go语言高阶：调度器系列（1）起源》](http://lessisbetter.site/2019/03/10/golang-scheduler-1-history/)，学goroutine调度器之前的一些背景知识，**这篇文章则是为了对调度器有个宏观的认识，从宏观的3个角度，去看待和理解调度器是什么样子的，但仍然不涉及具体的调度原理**。

三个角度分别是：

1.  调度器的宏观组成
2.  调度器的生命周期
3.  GMP的可视化感受

在开始前，先回忆下调度器相关的3个缩写：

-   **G**: goroutine，每个G都代表1个goroutine
-   **M**: 工作线程，是Go语言定义出来在用户层面描述系统线程的对象 ，每个M代表一个系统线程
-   **P**: 处理器，它包含了运行Go代码的资源。

3者的简要关系是P拥有G，M必须和一个P关联才能运行P拥有的G。

### [](#调度器的功能 "调度器的功能")调度器的功能

[《Go语言高阶：调度器系列（1）起源》](http://lessisbetter.site/2019/03/10/golang-scheduler-1-history/)中介绍了协程和线程的关系，协程需要运行在线程之上，线程由CPU进行调度。

在Go中，**线程是运行goroutine的实体，调度器的功能是把可运行的goroutine分配到工作线程上**。

Go的调度器也是经过了多个版本的开发才是现在这个样子的，

-   1.0版本发布了最初的、最简单的调度器，是G-M模型，存在4类问题
-   1.1版本重新设计，修改为G-P-M模型，奠定当前调度器基本模样
-   [1.2版本](https://golang.org/doc/go1.2#preemption)加入了抢占式调度，防止协程不让出CPU导致其他G饿死

> 在`$GOROOT/src/runtime/proc.go`的开头注释中包含了对Scheduler的重要注释，介绍Scheduler的设计曾拒绝过3种方案以及原因，本文不再介绍了，希望你不要忽略为数不多的官方介绍。

### [](#Scheduler的宏观组成 "Scheduler的宏观组成")Scheduler的宏观组成

[Tony Bai](https://tonybai.com/)在[《也谈goroutine调度器》](https://tonybai.com/2017/06/23/an-intro-about-goroutine-scheduler/)中的这幅图，展示了goroutine调度器和系统调度器的关系，而不是把二者割裂开来，并且从宏观的角度展示了调度器的重要组成。

![](http://img.lessisbetter.site/2019-03-goroutine-scheduler-model.png)

自顶向下是调度器的4个部分：

1.  **全局队列**（Global Queue）：存放等待运行的G。
2.  **P的本地队列**：同全局队列类似，存放的也是等待运行的G，存的数量有限，不超过256个。新建G’时，G’优先加入到P的本地队列，如果队列满了，则会把本地队列中一半的G移动到全局队列。
3.  **P列表**：所有的P都在程序启动时创建，并保存在数组中，最多有GOMAXPROCS个。
4.  **M**：线程想运行任务就得获取P，从P的本地队列获取G，P队列为空时，M也会尝试从全局队列**拿**一批G放到P的本地队列，或从其他P的本地队列**偷**一半放到自己P的本地队列。M运行G，G执行之后，M会从P获取下一个G，不断重复下去。

**Goroutine调度器和OS调度器是通过M结合起来的，每个M都代表了1个内核线程，OS调度器负责把内核线程分配到CPU的核上执行**。

### [](#调度器的生命周期 "调度器的生命周期")调度器的生命周期

接下来我们从另外一个宏观角度——生命周期，认识调度器。

所有的Go程序运行都会经过一个完整的调度器生命周期：从创建到结束。

![](http://img.lessisbetter.site/2019-03-scheduler-lifetime.png)

即使下面这段简单的代码：

复制

1  
2  
3  
4  
5  
6  
7  
8  

package main  
  
import "fmt"  
  
// main.main  
func main() {  
	fmt.Println("Hello scheduler")  
}
