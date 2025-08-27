---
title: go语言死循环分析
source_url: 'https://studygolang.com/articles/11881'
category: Go原理教程
---
```

```
 最近看了一篇文章，\[如何定位 golang 进程 hang 死的 bug\](/articles/11880)，里面有这样一段代码： 
```
go package main import ( "fmt" "io" "log" "net/http" "runtime" "time" ) func main() { runtime.GOMAXPROCS(runtime.NumCPU()) go server() go printNum() var i = 1 for { // will block here, and never go out i++ } fmt.Println("for loop end") time.Sleep(time.Second \* 3600) } func printNum() { i := 0 for { fmt.Println(i) i++ } } func HelloServer(w http.ResponseWriter, req \*http.Request) { fmt.Println("hello world") io.WriteString(w, "hello, world!\\n") } func server() { http.HandleFunc("/", HelloServer) err := http.ListenAndServe(":12345", nil) if err != nil { log.Fatal("ListenAndServe: ", err) } } 
```
 运行，会发现打印一会儿数字后停了，我们执行 
```
 curl localhost:12345 
```
 程序卡死。关于程序挂在哪里借助\`dlv\`是很好定位的： 
```
 dlv debug hang.go 
```
 进去之后运行程序，打印停止进入卡死状态，我们执行\`ctrl C\`，\`dlv\`会显示断开的地方： 
```
 received SIGINT, stopping process (will not forward signal)> main.main() ./hang.go:17 (PC: 0x12dd7c8) 12: func main() { 13: runtime.GOMAXPROCS(runtime.NumCPU()) 14: go server() 15: go printNum() 16: var i = 1 => 17: for { 18: // will block here, and never go out 19: i++ 20: } 21: fmt.Println("for loop end") 22: time.Sleep(time.Second \* 3600) (dlv) 
```
 但是我还是不明白，不明白的地方主要是因为： - 我又看了两篇文章\[Goroutine调度实例简要分析\](http://tonybai.com/2017/11/23/the-simple-analysis-of-goroutine-schedule-examples/)和\[也谈goroutine调度器\](http://tonybai.com/2017/06/23/an-intro-about-goroutine-scheduler/)，是同一位作者Tony Bai写的，写得非常好。第二篇文章解释了goroutine的调度和cpu数量的关系（不多加解释，建议大家看看），我的mac是双核四线程（这里不明白的同学自行google cpu 超线程），go版本是1.9，理论上讲可以跑4个goroutine而不用考虑死循环，一个死循环最多把一个cpu打死，上面的代码中只有3个goroutine，而且他们看上去都挂住了。 - 上面说的理论上讲，不是我主观臆测的，我跑了\`1\`中\[第一篇文章\](http://tonybai.com/2017/11/23/the-simple-analysis-of-goroutine-schedule-examples/)中的一个例子: 
```
go package main import ( "fmt" "time" ) func deadloop() { for { } } func main() { go deadloop() for { time.Sleep(time.Second \* 1) fmt.Println("I got scheduled!") } } 
```
 上面代码有两个goroutine，一个是\`main goroutine\`，一个是\`deadloop goroutine\`，跑得时候\`deadloop gouroutine\`不会对\`main goroutine\`造成影响，打印一直在持续，作者的文章解释了原因。 - \[如何定位 golang 进程 hang 死的 bug\](/articles/11880)这篇文章提到了\`gcwaiting\`，然而没有解释。 在\[如何定位 golang 进程 hang 死的 bug\](/articles/11880)有这样一段话： > 因为在 for 循环中没有函数调用的话，编译器不会插入调度代码，所以这个执行 for 循环的 goroutine 没有办法被调出，而在循环期间碰到 gc，那么就会卡在 gcwaiting 阶段，并且整个进程永远 hang 死在这个循环上。并不再对外响应。 这个其实就是我们的第一段代码卡死的原因，也是我们第二段代码没有卡死的原因，就是在\`gc\`上！ 我们再看一篇文章，\[golang的垃圾回收（GC）机制\](https://studygolang.com/articles/9004)，这篇文章很短，但每句话都很重要： > 1. 设置gcwaiting=1，这个在每一个G任务之前会检查一次这个状态，如是，则会将当前M 休眠； > 2. 如果这个M里面正在运行一个长时间的G任务，咋办呢，难道会等待这个G任务自己切换吗？这样的话可要等10ms啊，不能等！坚决不能等！\\ > 所以会主动发出抢占标记（类似于上一篇），让当前G任务中断，再运行下一个G任务的时候，就会走到第1步 那么如果这时候运行的是没有函数调用的死循环呢，gc也发出了抢占标记，但是如果死循环没有函数调用，就没有地方被标记，无法被抢占，那就只能设置\`gcwaiting=1\`，而\*\*M没有休眠\*\*，\`stop the world\`卡住了（死锁），\`gcwaiting\`一直是1，整个程序都卡住了！ 这里其实已经解释了第一份代码的现象，第二份代码为什么没有hang住相信大家也能猜到了：代码里没有触发gc！我们来手动触发一下： 
```
go package main import ( "fmt" "log" "net/http" \_ "net/http/pprof" // "runtime" "time" ) func deadloop() { for { } } func main() { go func() { log.Println(http.ListenAndServe("localhost:6060", nil)) }() go deadloop() i := 3 for { time.Sleep(time.Second \* 1) i-- fmt.Println("I got scheduled!") if i == 0 { runtime.GC() } } } 
```
 会发现打印了3行之后，程序也卡死了，bingo? 我们来看看\`gcwaiting\`是不是等于1: 
```
 $ go build hang2.go $ GODEBUG="schedtrace=300,scheddetail=1" ./hang2 SCHED 2443ms: gomaxprocs=4 idleprocs=3 threads=7 spinningthreads=0 idlethreads=2 runqueue=0 gcwaiting=0 nmidlelocked=0 stopwait=0 sysmonwait=0 P0: status=1 schedtick=4 syscalltick=5 m=5 runqsize=0 gfreecnt=1 P1: status=0 schedtick=14 syscalltick=0 m=-1 runqsize=0 gfreecnt=0 P2: status=0 schedtick=3 syscalltick=4 m=-1 runqsize=0 gfreecnt=0 ...... SCHED 2751ms: gomaxprocs=4 idleprocs=0 threads=7 spinningthreads=0 idlethreads=2 runqueue=0 gcwaiting=1 nmidlelocked=0 stopwait=1 sysmonwait=0 P0: status=1 schedtick=4 syscalltick=5 m=5 runqsize=0 gfreecnt=1 P1: status=3 schedtick=14 syscalltick=0 m=-1 runqsize=0 gfreecnt=0 P2: status=3 schedtick=3 syscalltick=10 m=-1 runqsize=0 gfreecnt=0 P3: status=3 schedtick=1 syscalltick=26 m=0 runqsize=0 gfreecnt=0 M6: p=-1 curg=-1 mallocing=0 throwing=0 preemptoff= locks=0 dying=0 helpgc=0 spinning=false blocked=false lockedg=-1 M5: p=0 curg=19 mallocing=0 throwing=0 preemptoff= locks=0 dying=0 helpg 
```
 代码诚不欺我也！ ## \[\](#参考资料 "参考资料")参考资料 - \[如何定位 golang 进程 hang 死的 bug\](https://gocn.io/article/441) - \[Goroutine调度实例简要分析\](http://tonybai.com/2017/11/23/the-simple-analysis-of-goroutine-schedule-examples/) - \[也谈goroutine调度器\](http://tonybai.com/2017/06/23/an-intro-about-goroutine-scheduler/) - \[golang的垃圾回收（GC）机制\](https://studygolang.com/articles/9004)
