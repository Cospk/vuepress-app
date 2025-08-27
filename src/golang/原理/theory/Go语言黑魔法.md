---
title: Go语言黑魔法
source_url: 'https://studygolang.com/articles/2909'
category: Go原理教程
---
```
go package labs28 import "testing" import "unsafe" func Test\_ByteString(t \*testing.T) { var x = \[\]byte("Hello World!") var y = \*(\*string)(unsafe.Pointer(&x)) var z = string(x) if y != z { t.Fail() } } func Benchmark\_Normal(b \*testing.B) { var x = \[\]byte("Hello World!") for i := 0; i < b.N; i ++ { \_ = string(x) } } func Benchmark\_ByteString(b \*testing.B) { var x = \[\]byte("Hello World!") for i := 0; i < b.N; i ++ { \_ = \*(\*string)(unsafe.Pointer(&x)) } } 
```
