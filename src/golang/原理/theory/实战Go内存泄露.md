---
title: 实战Go内存泄露
source_url: 'https://studygolang.com/articles/20529'
category: Go原理教程
---
复制

1  
2  
3  
4  
5  
6  
7  
8  
9  
10  
11  
12  
13  
14  
15  
16  
17  
18  
19  
20  
21  
22  
23  
24  
25  
26  
27  
28  
29  
30  
31  
32  
33  
34  
35  
36  
37  
38  
39  
40  
41  
42  
43  
44  
45  
46  
47  
48  
49  
50  
51  
52  
53  
54  
55  

// goroutine泄露导致内存泄露  
package main  
  
import (  
	"fmt"  
	"net/http"  
	\_ "net/http/pprof"  
	"os"  
	"time"  
)  
  
func main() {  
	// 开启pprof  
	go func() {  
		ip := "0.0.0.0:6060"  
		if err := http.ListenAndServe(ip, nil); err != nil {  
			fmt.Printf("start pprof failed on %s\\n", ip)  
			os.Exit(1)  
		}  
	}()  
  
	outCh := make(chan int)  
	// 死代码，永不读取  
	go func() {  
		if false {  
			<-outCh  
		}  
		select {}  
	}()  
  
	// 每s起100个goroutine，goroutine会阻塞，不释放内存  
	tick := time.Tick(time.Second / 100)  
	i := 0  
	for range tick {  
		i++  
		fmt.Println(i)  
		alloc1(outCh)  
	}  
}  
  
func alloc1(outCh chan<- int) {  
	go alloc2(outCh)  
}  
  
func alloc2(outCh chan<- int) {  
	func() {  
		defer fmt.Println("alloc-fm exit")  
		// 分配内存，假用一下  
		buf := make(\[\]byte, 1024\*1024\*10)  
		\_ = len(buf)  
		fmt.Println("alloc done")  
  
		outCh <- 0 // 53行  
	}()  
}
