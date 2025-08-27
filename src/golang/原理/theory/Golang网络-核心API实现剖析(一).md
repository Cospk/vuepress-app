---
title: '""Golang网络:核心API实现剖析(一)""'
source_url: 'https://studygolang.com/articles/11868'
category: Go原理教程
---
```

这一章节我们将详细描述网络关键API的实现，主要包括Listen、Accept、Read、Write等。 另外，为了突出关键流程，我们选择忽略所有的错误。这样可以使得代码看起来更为简单。 而且我们只关注tcp协议实现，udp和unix socket不是我们关心的。

## **Listen**

`
```
text
func Listen(net, laddr string) (Listener, error) {
```

la, err := resolveAddr("listen", net, laddr, noDeadline) ...... switch la := la.toAddr().(type) { case \*TCPAddr: l, err = ListenTCP(net, la) case \*UnixAddr: ...... } ...... }

// 对于tcp协议，返回的的是TCPListener func ListenTCP(net string, laddr \*TCPAddr) (\*TCPListener, error) { ...... fd, err := internetSocket(net, laddr, nil, noDeadline, syscall.SOCK\_STREAM, 0, "listen") ...... return \&TCPListener{fd}, nil }

func internetSocket(net string, laddr, raddr sockaddr, deadline time.Time, sotype, proto int, mode string) (fd \*netFD, err error) { ...... return socket(net, family, sotype, proto, ipv6only, laddr, raddr, deadline) }

func socket(net string, family, sotype, proto int, ipv6only bool, laddr, raddr sockaddr, deadline time.Time) (fd \*netFD, err error) { // 创建底层socket，设置属性为O\_NONBLOCK s, err := sysSocket(family, sotype, proto) ...... setDefaultSockopts(s, family, sotype, ipv6only) // 创建新netFD结构 fd, err = newFD(s, family, sotype, net) ...... if laddr != nil && raddr == nil { switch sotype { case syscall.SOCK\_STREAM, syscall.SOCK\_SEQPACKET: // 调用底层listen监听创建的套接字 fd.listenStream(laddr, listenerBacklog) return fd, nil case syscall.SOCK\_DGRAM: ...... } }\
}

// 最终调用该函数来创建一个socket // 并且将socket属性设置为O\_NONBLOCK func sysSocket(family, sotype, proto int) (int, error) { syscall.ForkLock.RLock() s, err := syscall.Socket(family, sotype, proto) if err == nil { syscall.CloseOnExec(s) } syscall.ForkLock.RUnlock() if err != nil { return -1, err } if err = syscall.SetNonblock(s, true); err != nil { syscall.Close(s) return -1, err } return s, nil }

func (fd \*netFD) listenStream(laddr sockaddr, backlog int) error { if err := setDefaultListenerSockopts(fd.sysfd) if lsa, err := laddr.sockaddr(fd.family); err != nil { return err } else if lsa != nil { // Bind绑定至该socket if err := syscall.Bind(fd.sysfd, lsa); err != nil { return os.NewSyscallError("bind", err) } } // 监听该socket if err := syscall.Listen(fd.sysfd, backlog); // 这里非常关键：初始化socket与异步IO相关的内容 if err := fd.init(); err != nil { return err } lsa, \_ := syscall.Getsockname(fd.sysfd) fd.setAddr(fd.addrFunc()(lsa), nil) return nil }
`
```
