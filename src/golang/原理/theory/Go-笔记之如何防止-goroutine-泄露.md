---
title: Go 笔记之如何防止 goroutine 泄露
source_url: 'https://studygolang.com/articles/22463'
category: Go原理教程
---
```
go package main import "time" func gen(done chan struct{}, nums ...int) <-chan int { out := make(chan int) go func() { defer close(out) for \_, n := range nums { select { case out <- n: case <-done: return } } }() return out } func main() { defer func() { time.Sleep(time.Second) fmt.Println("the number of goroutines: ", runtime.NumGoroutine()) }() // Set up the pipeline. done := make(chan struct{}) defer close(done) out := gen(done, 2, 3) for n := range out { fmt.Println(n) // 2 time.Sleep(5 \* time.Second) // done thing, 可能异常中断接收 if true { // if err != nil break } } } 
```
