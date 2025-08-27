---
title: Go 内存管理
source_url: 'https://studygolang.com/articles/11978'
category: Go原理教程
---
```

```
 ## \[\](#内存管理缓存结构 "内存管理缓存结构")内存管理缓存结构 Go实现的内存管理采用了\*\*tcmalloc\*\*这种架构，并配合goroutine和垃圾回收。\*\*tcmalloc的基本策略\*\*就是将内存分为多个级别。申请对象优先从最小级别的内存管理集合\`mcache\`中获取，若mcache无法命中则需要向mcentral申请一批内存块缓存到本地mcache中，若\`mcentral\`无空闲的内存块，则向\`mheap\`申请来填充mcentral，最后向系统申请。 ### \[\](#mcache-mspan "mcache + mspan")mcache + mspan 最小级别的\*\*内存块管理集合\*\*\`mcache\`由goroutine自己维护，这样从中申请内存不用加锁。它是一个大小为67的数组，不同的index对应不同规格的\`mspan\`。\`newobject\`的时候通过\`sizetoclass\`计算对应的规格，然后在mcache中获取mspan对象。 
```
go type mcache struct { alloc \[\_NumSizeClasses\]\*mspan // spans to allocate from } 
```
 \`mspan\`包含着一批大小相同的空闲的\`object\`，由freelist指针查找。\*\*mspan内部的object是连续内存块，即连续的n个page(4KB)的连续内存空间。然后这块空间被平均分成了规格相同的object，这些object又连接成链表\*\*。当newobject时找到mcache中对应规格的mspan，从它的freelist取一个object即可。 
```
go type mspan struct { next \*mspan // in a span linked list prev \*mspan // in a span linked list start pageID // starting page number npages uintptr // number of pages in span freelist gclinkptr // list of free objects sizeclass uint8 // size class incache bool // being used by an mcache } 
```
 ### \[\](#mheap-mcentral "mheap + mcentral")mheap + mcentral 如果某个规格的span里已经没有freeObject了 需要从\`mcentral\`当中\*\*获取这种规格的mspan\*\*。正好mcentral也是按照class规格存储在数组中，只要按规格去\`mheap\`的mcentral数组取mspan就好。 
```
go // 某种规格的mspan正好对应一个mcentral type mcentral struct { lock mutex sizeclass int32 nonempty mspan //还有空闲object的mspan empty mspan //没有空闲object或已被cache取走的mspan } 
```
 如果central数组中这种规格的mcentral没有freeSpan了，则需要从\`mheap\`的\`free\`数组获取。这里规格并不对齐，��以应该要重新切分成相应规格的mspan。 
```
go type mheap struct { lock mutex free \[\_MaxMHeapList\]mspan // 页数在127以内的空闲span链表 freelarge mspan spans \*\*mspan bitmap uintptr bitmap\_mapped uintptr arena\_start uintptr arena\_used uintptr arena\_end uintptr arena\_reserved bool central \[\_NumSizeClasses\]struct { mcentral mcentral pad \[\_CacheLineSize\]byte } spanalloc fixalloc // allocator for span\* cachealloc fixalloc // allocator for mcache\* } 
```
 ## \[\](#内存的初始化 "内存的初始化")内存的初始化 很早之前看过这个图，当时对他的理解有误，因为看漏了一句话 \`struct Mcache alloc from 'cachealloc' by FixAlloc\`。就是说用户进程newobject是从下图的arena区域分配的，而runtime层自身管理的结构 比如mcache等是专门设计了fixAlloc来分配的，原因可能是这些runtime层的管理对象类型和长度都相对固定，而且生命周期很长，不适合占用arena区域。 !\[\](https://ninokop.github.io/2017/11/08/Go-%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86/goalloc.png) ### \[\](#mallocinit "mallocinit")mallocinit 通过\`sysReserve\` 向系统申请一块连续的内存 \*\*spans+bitmap+arena\*\*。其中arena为各个级别缓存结构提供的分配的内存块，spans是个指针数组用来按照page寻址arena区域。 > 最终sysReserve调用的是系统调用\`mmap\`。申请了512GB的虚拟地址空间，真正的物理内存则是用到的时候发生缺页才真实占用的。 
```
go func mallocinit() { // 初始化规格class和size的对照方法 initSizes() if ptrSize == 8 && (limit == 0 || limit > 1<<30) { arenaSize := round(\_MaxMem, \_PageSize) bitmapSize = arenaSize / (ptrSize \* 8 / 4) spansSize = arenaSize / \_PageSize \* ptrSize pSize = bitmapSize + spansSize + arenaSize + \_PageSize p1 = uintptr(sysReserve(unsafe.Pointer(p), pSize, &reserved)) } mheap\_.spans = (\*\*mspan)(unsafe.Pointer(p1)) mheap\_.bitmap = p1 + spansSize mheap\_.arena\_start = p1 + (spansSize + bitmapSize) mheap\_.arena\_used = mheap\_.arena\_start mheap\_.arena\_end = p + pSize mheap\_.arena\_reserved = reserved mHeap\_Init(&mheap\_, spansSize) \_g\_ := getg() \_g\_.m.mcache = allocmcache() } 
```
 mheap初始化相关指针，使之可以寻址arena这块内存。同时初始化\*\*cachealloc\*\*这个固定分配器。最后执行的 \`m.mcache = allocmcache()\` 是每个gouroutine创建时都要初始化的。直到这时才真正创建了\`mcache\`，并且初始化mcache里整个数组对应的mspan为emptyspan。 
```
go func (h \*mheap) init(spansStart, spansBytes uintptr) { h.spanalloc.init(unsafe.Sizeof(mspan{}), recordspan, unsafe.Pointer(h), &memstats.mspan\_sys) h.cachealloc.init(unsafe.Sizeof(mcache{}), nil, nil, &memstats.mcache\_sys) h.spanalloc.zero = false for i := range h.free { h.free\[i\].init() h.busy\[i\].init() } h.freelarge.init() h.busylarge.init() for i := range h.central { h.central\[i\].mcentral.init(int32(i)) } sp := (\*slice)(unsafe.Pointer(&h.spans)) sp.array = unsafe.Pointer(spansStart) sp.len = 0 sp.cap = int(spansBytes / sys.PtrSize) } func allocmcache() \*mcache { // lock and fixalloc mcache c := (\*mcache)(mheap\_.cachealloc.alloc()) for i := 0; i < \_NumSizeClasses; i++ { c.alloc\[i\] = &emptymspan } return c } 
```
 ### \[\](#fixalloc "fixalloc")fixalloc fixalloc分配器通过init初始化每次分配的size。chunk是每次分配的固定大小的内存块，list是内存块链表。\*\*当fixalloc初始化为cachealloc时，每次调用alloc就分配一块mcache\*\*。persistantalloc看起来是runtime有个全局存储的后备内存的地方，优先从这儿取没有再从系统mmap一块。 
```
go type fixalloc struct { size uintptr first func(arg, p unsafe.Pointer) arg unsafe.Pointer list \*mlink chunk unsafe.Pointer nchunk uint32 inuse uintptr // in-use bytes now stat \*uint64 zero bool // zero allocations } func (f \*fixalloc) alloc() unsafe.Pointer { // 优先从可复用链表中获取对象块 if f.list != nil { f.list = f.list.next return v } // 如果没有从系统申请chunk大小的内存块 if uintptr(f.nchunk) < f.size { f.chunk = persistentalloc(\_FixAllocChunk, 0, f.stat) } v := f.chunk // 为调用方提供了fist函数作为hook点 return v } 
```
 ## \[\](#内存分配 "内存分配")内存分配 ### \[\](#mallocgc "mallocgc")mallocgc 以下总结了malloc的流程，基本普通的小对象都是从mcache中找到相应规格的mspan，在其中的freelist上拿到object对象内存块。\`nextfree\`中隐藏了整个内存数据块的查找和流向。 
```
go func mallocgc(size uintptr, typ \*\_type, needzero bool) unsafe.Pointer { c := gomcache() if size <= maxSmallSize { // size小于16bit的不用扫描的对象 直接从mcache的tiny上分 if noscan && size < maxTinySize { off := c.tinyoffset if off+size <= maxTinySize && c.tiny != 0 { x = unsafe.Pointer(c.tiny + off) return x } // 若没有tiny了则从mcache的中相应规格的mspan查找 span := c.alloc\[tinySizeClass\] v, \_, shouldhelpgc = c.nextFree(tinySizeClass) x = unsafe.Pointer(v) } else { // 普通小于4KB小对象先计算规格 span := c.alloc\[sizeclass\] v, span, shouldhelpgc = c.nextFree(sizeclass) } } else { // 大对象直接从heap分配span systemstack(func() { s = largeAlloc(size, needzero) }) x = unsafe.Pointer(s.base()) } return x } func (c \*mcache) nextFree(sizeclass uint8) (v gclinkptr, s \*mspan, shouldhelpgc bool) { s = c.alloc\[sizeclass\] freeIndex := s.nextFreeIndex() if freeIndex == s.nelems { systemstack(func() { c.refill(int32(sizeclass)) }) s = c.alloc\[sizeclass\] freeIndex = s.nextFreeIndex() } v = gclinkptr(freeIndex\*s.elemsize + s.base()) return } 
```
 ### \[\](#refill-cachespan "refill + cachespan")refill + cachespan 如果\`nextfree\`在mcache相应规格的mspan里拿不到object那么需要从mcentral中\`refill\`内存块。 > 这里面有个细节要将alloc中原本已经没有可用object的这块mspan还给central，应该要放进central的empty链表中。这里只是把相应的mspan的incache设置为false，等待sweep的回收。 
```
go func (c \*mcache) refill(sizeclass int32) \*mspan { s := c.alloc\[sizeclass\] if s != &emptymspan { s.incache = false } s = mheap\_.central\[sizeclass\].mcentral.cacheSpan() c.alloc\[sizeclass\] = s return s } 
```
 sweepgen是个回收标记，当sweepgen=sg-2时表示等待回收，sweepgen-1表示正在回收，sweepgen表示已经回收。\*\*从mcentral中获取mspan时有可能当前的span正在等待或正在回收，我们把等待回收的mspan可以返回用来refill mcache，因此将它insert到empty链表中。\*\* 
```
go func (c \*mcentral) cacheSpan() \*mspan { sg := mheap\_.sweepgen retry: var s \*mspan for s = c.nonempty.first; s != nil; s = s.next { if s.sweepgen == sg-2 && atomic.Cas(&s.sweepgen, sg-2, sg-1) { // 等待回收 可以返回使用 c.nonempty.remove(s) c.empty.insertBack(s) s.sweep(true) goto havespan } if s.sweepgen == sg-1 { // 正在回收 忽略 continue } c.nonempty.remove(s) c.empty.insertBack(s) goto havespan } for s = c.empty.first; s != nil; s = s.next {...} s = c.grow() c.empty.insertBack(s) havespan: ... return s } 
```
 ### \[\](#mcentral-grow "mcentral grow")mcentral grow 如果mcentral中没有mspan可以用 那么需要grow，即从mheap中获取。\*\*要计算出当前规格对应的page数目，从mheap中直接去nPage的mspan。\*\*free区域是个指针数组，每个指针对应一个mspan的链表，数组按照npage寻址。\*\*若大于要求的npage的链表中 都没有空闲mspan，则mheap也需要扩张。\*\* 
```
go func (c \*mcentral) grow() \*mspan { npages := uintptr(class\_to\_allocnpages\[c.sizeclass\]) size := uintptr(class\_to\_size\[c.sizeclass\]) n := (npages << \_PageShift) / size s := mheap\_.alloc(npages, c.sizeclass, false, true) heapBitsForSpan(s.base()).initSpan(s) return s } func (h \*mheap) allocSpanLocked(npage uintptr) \*mspan { for i := int(npage); i < len(h.free); i++ { list = &h.free\[i\] if !list.isEmpty() { s = list.first goto HaveSpan } } list = &h.freelarge s = h.allocLarge(npage) if s == nil { if !h.grow(npage) { return nil } s = h.allocLarge(npage) } HaveSpan: // Mark span in use. return s } 
```
 ### \[\](#mheap-grow "mheap grow")mheap grow mheap的扩张\`h.sysAlloc\`直接向arena区域申请nbytes的内存，数目按照npage大小计算。arena区域的一些指针标记开始移动，最终将mspan加入链表，等待分配。 
```
go func (h \*mheap) grow(npage uintptr) bool { ask := npage << \_PageShift v := h.sysAlloc(ask) s := (\*mspan)(h.spanalloc.alloc()) s.init(uintptr(v), ask>>\_PageShift) p := (s.base() - h.arena\_start) >> \_PageShift for i := p; i < p+s.npages; i++ { h.spans\[i\] = s } atomic.Store(&s.sweepgen, h.sweepgen) s.state = \_MSpanInUse h.pagesInUse += uint64(s.npages) // 加入链表 h.freeSpanLocked(s, false, true, 0) return true } 
```
 ## \[\](#内存回收与释放 "内存回收与释放")内存回收与释放 简单说两句：mspan里有sweepgen回收标记，回收的内存会先全部回到mcentral。如果已经回收所有的mspan那么可以返还给mheap的freelist。回收的内存块当然是为了复用，并不直接释放。 
```
go func (s \*mspan) sweep(preserve bool) bool { res = mheap\_.central\[cl\].mcentral.freeSpan(s, preserve, wasempty) } func (c \*mcentral) freeSpan(s \*mspan, preserve bool, wasempty bool) bool { if wasempty { c.empty.remove(s) c.nonempty.insert(s) } ... c.nonempty.remove(s) mheap\_.freeSpan(s, 0) return true } 
```
 监控线程\*\*sysmon\*\*又出现了，它会遍历mheap中所有的free freelarge里的mspan，发现空闲时间超过阈值就\`madvise\`建议内核释放它相关的物理内存。
