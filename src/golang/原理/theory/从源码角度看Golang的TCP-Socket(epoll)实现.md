---
title: 从源码角度看Golang的TCP Socket(epoll)实现
source_url: 'https://studygolang.com/articles/22460'
category: Go原理教程
---
```

# 从源码角度看Golang的TCP Socket(epoll)实现

```
 Golang的TCP是基于系统的epoll IO模型进行封装实现，本章从TCP的预备工作到runtime下的实时运行工作原理进行分析。仅关注linux系统下的逻辑。代码版本GO1.12.6。 本章例子中的代码对应详细注释参考：\[gosrc1.12.6\](https://links.jianshu.com/go?to=https%3A%2F%2Fgithub.com%2Fthinkboy%2Fgosrc1.12.6) > 读文章可能并不是最好的读懂源码的办法，读文章只能有个大致概念，最好的办法拿文章是对照源码理解。 --- # 目录 先来个目录方便读者理解文本结构 - 1.\[TCP预备工作\](#TCP%E9%A2%84%E5%A4%87%E5%B7%A5%E4%BD%9C) - 1.1 \[Server端\](#Server%E7%AB%AF) - 1.2 \[Client端\](#Client%E7%AB%AF) - 2.\[epoll\](#epoll) - 2.1 \[如何实现异步非阻塞\](#%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0%E5%BC%82%E6%AD%A5%E9%9D%9E%E9%98%BB%E5%A1%9E) - 2.2 \[epoll的创建与事件注册\](#epoll%E7%9A%84%E4%BA%8B%E4%BB%B6%E7%9B%91%E5%90%AC) - 2.3 \[小结\](#%E5%B0%8F%E7%BB%93) - 3.\[TCP的超时机制\](#TCP%E7%9A%84%E8%B6%85%E6%97%B6%E6%9C%BA%E5%88%B6) # TCP预备工作 ## Server端 
```
 //TcpServer.go package main import ( "fmt" "net" ) func main() { ln, err := net.Listen("tcp", ":8080") if err != nil { panic(err) } for { conn, err := ln.Accept() if err != nil { panic(err) } // 每个Client一个Goroutine go handleConnection(conn) } } func handleConnection(conn net.Conn) { defer conn.Close() var body \[4\]byte addr := conn.RemoteAddr() for { // 读取客户端消息 \_, err := conn.Read(body\[:\]) if err != nil { break } fmt.Printf("收到%s消息: %s\\n", addr, string(body\[:\])) // 回包 \_, err = conn.Write(body\[:\]) if err != nil { break } fmt.Printf("发送给%s: %s\\n", addr, string(body\[:\])) } fmt.Printf("与%s断开!\\n", addr) } 
```
 上面是一个简单的TCP Server的例子，代码并不是很多。通过一张图先来看下TCP相关源代码的大致结构。
