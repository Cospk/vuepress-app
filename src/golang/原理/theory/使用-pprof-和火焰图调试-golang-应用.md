---
title: 使用 pprof 和火焰图调试 golang 应用
source_url: 'https://studygolang.com/articles/11006'
category: Go原理教程
---
```

## 什么是 Profiling?

```
 Profiling 这个词比较难翻译，一般译成\`画像\`。比如在案件侦破的时候会对嫌疑人做画像，从犯罪现场的种种证据，找到嫌疑人的各种特征，方便对嫌疑人进行排查；还有就是互联网公司会对用户信息做画像，通过了解用户各个属性（年龄、性别、消费能力等），方便为用户推荐内容或者广告。 在计算机性能调试领域里，profiling 就是对应用的画像，这里画像就是应用使用 CPU 和内存的情况。也就是说应用使用了多少 CPU 资源？都是哪些部分在使用？每个函数使用的比例是多少？有哪些函数在等待 CPU 资源？知道了这些，我们就能对应用进行规划，也能快速定位性能瓶颈。 golang 是一个对性能特别看重的语言，因此语言中自带了 profiling 的库，这篇文章就要讲解怎么在 golang 中做 profiling。 在 go 语言中，主要关注的应用运行情况主要包括以下几种： - CPU profile：报告程序的 CPU 使用情况，按照一定频率去采集应用程序在 CPU 和寄存器上面的数据 - Memory Profile（Heap Profile）：报告程序的内存使用情况 - Block Profiling：报告 goroutines 不在运行状态的情况，可以用来分析和查找死锁等性能瓶颈 - Goroutine Profiling：报告 goroutines 的使用情况，有哪些 goroutine，它们的调用关系是怎样的 ## 两种收集方式 做 Profiling 第一步就是怎么获取应用程序的运行情况数据。go 语言提供了 \`runtime/pprof\` 和 \`net/http/pprof\` 两个库，这部分我们讲讲它们的用法以及使用场景。 ### 工具型应用 如果你的应用是一次性的，运行一段时间就结束。那么最好的办法，就是在应用退出的时候把 profiling 的报告保存到文件中，进行分析。对于这种情况，可以使用 \[\`runtime/pprof\` 库\](https://golang.org/pkg/runtime/pprof/)。 \`pprof\` 封装了很好的接口供我们使用，比如要想进行 CPU Profiling，可以调用 \`pprof.StartCPUProfile()\` 方法，它会对当前应用程序进行 CPU profiling，并写入到提供的参数中（\`w io.Writer\`），要停止调用 \`StopCPUProfile()\` 即可。 去除��误处理只需要三行内容，一般把部分内容写在 \`main.go\` 文件中，应用程序启动之后就开始执行： 
```
 f, err := os.Create(\*cpuprofile) ... pprof.StartCPUProfile(f) defer pprof.StopCPUProfile() 
```
