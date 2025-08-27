---
title: Go Select的实现
source_url: 'https://studygolang.com/articles/12054'
category: Go原理教程
---
```

```
 \*\*select语法总结\*\* select对应的每个case如果有已经准备好的case 则进行chan读写操作；若没有则执行defualt语句；若都没有则阻塞当前goroutine，直到某个chan准备好可读或可写，完成对应的case后退出。 ## \[\](#Select的内存布局 "Select的内存布局")Select的内存布局 了解chanel的实现后对select的语法有个疑问，select如何实现多路复用的，为什么没有在第一个channel操作时阻塞 从而导致后面的case都执行不了。为了解决疑问，对应代码看一下汇编调用了哪些runtime层的函数，发现select语法块被编译器翻译成了以下过程。 > 创建select–>注册case–>执行select–>释放select 
```
go select { case c1 <-1: // non-blocking case <-c2: // non-blocking default: // will do this } 
```
 
```
go runtime.newselect runtime.selectsend runtime.selectrecv runtime.selectdefault runtime.selectgo 
```
 select实际上是个hselect结构体，其中注册的case放到scase中。scase保存有当前case操作的hchan。pollorder指向的是乱序后的scase序号。lockorder中将要保存的是每个case对应的hchan的地址。 
```
go type hselect struct { tcase uint16 // total count of scase\[\] ncase uint16 // currently filled scase\[\] pollorder \*uint16 // case poll order lockorder \*\*hchan // channel lock order scase \[1\]scase // one per case (in order of appearance) } type scase struct { elem unsafe.Pointer // data element c \*hchan // chan pc uintptr // return pc kind uint16 so uint16 // vararg of selected bool receivedp \*bool // pointer to received bool (recv2) releasetime int64 } 
```
 select最后是\\\[1\]scase表示select中只保存了一个case的空间，说明select只是个头部，select后面保存了所有的scase，这段Scases的大小就是tcase。在go runtime实现中经常看到这种头部+连续内存的方式。 !\[\](https://ninokop.github.io/2017/11/07/Go-Select%E7%9A%84%E5%AE%9E%E7%8E%B0/select1.png) ## \[\](#select的实现 "select的实现")select的实现 ### \[\](#select创建 "select创建")select创建 在newSelect对象时已经知道了case的数目，并已经分配好上述空间。 
```
go func selectsize(size uintptr) uintptr { selsize := unsafe.Sizeof(hselect{}) + (size-1)\*unsafe.Sizeof(hselect{}.scase\[0\]) + size\*unsafe.Sizeof(\*hselect{}.lockorder) + size\*unsafe.Sizeof(\*hselect{}.pollorder) return round(selsize, \_Int64Align) } func newselect(sel \*hselect, selsize int64, size int32) { if selsize != int64(selectsize(uintptr(size))) { print("runtime: bad select size ", selsize, ", want ", selectsize(uintptr(size)), "\\n") throw("bad select size") } sel.tcase = uint16(size) sel.ncase = 0 sel.lockorder = (\*\*hchan)(add(unsafe.Pointer(&sel.scase), uintptr(size)\*unsafe.Sizeof(hselect{}.scase\[0\]))) sel.pollorder = (\*uint16)(add(unsafe.Pointer(sel.lockorder), uintptr(size)\*unsafe.Sizeof(\*hselect{}.lockorder))) } 
```
 ### \[\](#注册case "注册case")注册case case channel有三种注册 \`selectsend\` \`selectrecv\` \`selectdefault\`，分别对应着不同的case。他们的注册方式一致，都是ncase+1，然后按照当前的index填充scases域的scase数组的相关字段，主要是用case中的chan和case类型填充c和kind字段。 
```
go func selectsendImpl(sel \*hselect, c \*hchan, pc uintptr, elem unsafe.Pointer, so uintptr) { i := sel.ncase sel.ncase = i + 1 cas := (\*scase)(add(unsafe.Pointer(&sel.scase), uintptr(i)\*unsafe.Sizeof(sel.scase\[0\]))) cas.pc = pc cas.c = c cas.so = uint16(so) cas.kind = caseSend cas.elem = elem } 
```
 ### \[\](#select执行 "select执行")select执行 > pollorder保存的是scase的序号，乱序是为了之后执行时的随机性。 > > lockorder保存了所有case中channel的地址，这里按照地址大小堆排了一下lockorder对应的这片连续内存。\*\*对chan排序是为了去重，保证之后对所有channel上锁时不会重复上锁。\*\* > > select语句执行时会对整个chanel加锁 > > select语句会创建select对象 如果放在for循环中长期执行可能会频繁的分配内存 select执行过程总结如下： - 通过pollorder的序号，遍历scase找出已经准备好的case。如果有就执行普通的chan读写操作。其中准备好的case是指\*\*可以不阻塞完成读写chan的case，或者读已经关闭的chan的case\*\*。 - 如果没有准备好的case，则尝试defualt case。 - 如果以上都没有，则把当前的G封装好挂到scase所有chan的阻塞链表中，按照chan的操作类型挂到sendq或recvq中。 - 这个G被某个chan唤醒，遍历scase找到目标case，放弃当前G在其他chan中的等待，返回。 
```
go func selectgoImpl(sel \*hselect) (uintptr, uint16) { // 对pollorder乱序 填充序号 // 对lockorder排序 填充scase中对应的hchan // 通过lockorder遍历每个chan上锁 sellock(sel) loop: // 按照pollorder的顺序遍历scase 查看有没有case已经准备好 for i := 0; i < int(sel.ncase); i++ { cas = &scases\[pollorder\[i\]\] switch cas.kind { case caseRecv: case caseSend: case caseDefault: dfl = cas } } // 如果没有准备好的scase 则尝试执行defaut if dfl != nil { selunlock(sel) cas = dfl goto retc } // 如果没有任何可以执行的case 将当前的G挂到所有case对应的chan // 的等待链表sendq或recvq上 等待被唤醒 for i := 0; i < int(sel.ncase); i++ { cas = &scases\[pollorder\[i\]\] c = cas.c sg := acquireSudog() switch cas.kind { case caseRecv: c.recvq.enqueue(sg) case caseSend: c.sendq.enqueue(sg) } } gp.param = nil gopark(selparkcommit, unsafe.Pointer(sel), "select", traceEvGoBlockSelect|futile, 2) // 被唤醒后又上锁！ sellock(sel) sg = (\*sudog)(gp.param) gp.param = nil // 唤醒了当前G的sudoG是sg 遍历之前保存的sglist链表匹配 for i := int(sel.ncase) - 1; i >= 0; i-- { k = &scases\[pollorder\[i\]\] if sg == sglist { cas = k } else { // 若不匹配则收回当前G在这个chan中的排队 c = k.c if k.kind == caseSend { c.sendq.dequeueSudoG(sglist) } else { c.recvq.dequeueSudoG(sglist) } } sgnext = sglist.waitlink releaseSudog(sglist) sglist = sgnext } selunlock(sel) goto retc retc: return cas.pc, cas.so } 
```
 ## \[\](#参考文章 "参考文章")参考文章 \[select in go runtime\](http://skoo.me/go/2013/09/26/go-runtime-select) \[Go1.5源码剖析\](https://github.com/qyuhen/book/blob/master/Go%201.5%20%E6%BA%90%E7%A0%81%E5%89%96%E6%9E%90%20%EF%BC%88%E4%B9%A6%E7%AD%BE%E7%89%88%EF%BC%89.pdf)
