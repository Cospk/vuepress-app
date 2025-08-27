---
title: 从底层理解 Golang 的 map 实现
source_url: 'https://studygolang.com/articles/23404'
category: Go原理教程
---
## 定义

golang 中的 `map` 就是常用的 [hashtable](https://link.juejin.im?target=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FHash_table)，底层实现由 `hmap`，维护着若干个 `bucket` 数组，通常每个 `bucket` 保存着8组kv对，如果 超过8个(发生hash冲突时)，会在 `extra` 字段结构体中的 `overflow` ，使用链地址法一直扩展下去。 先看下 `hmap` 结构体：

```
type hmap struct {
    count     int // 元素的个数
    flags     uint8 // 标记读写状态，主要是做竞态检测，避免并发读写
    B         uint8  // 可以容纳 2 ^ N 个bucket
    noverflow uint16 // 溢出的bucket个数
    hash0     uint32 // hash 因子
    
    buckets    unsafe.Pointer // 指向数组buckets的指针
    oldbuckets unsafe.Pointer // growing 时保存原buckets的指针
    nevacuate  uintptr        // growing 时已迁移的个数
    
    extra *mapextra
}

type mapextra struct {
	overflow    *[]*bmap
	oldoverflow *[]*bmap

	nextOverflow *bmap
}
复制代码
```

`bucket` 的结构体：

```
// A bucket for a Go map.
type bmap struct {
    // tophash generally contains the top byte of the hash value
    // for each key in this bucket. If tophash[0] < minTopHash,
    // tophash[0] is a bucket evacuation state instead.
    tophash [bucketCnt]uint8    // 记录着每个key的高8个bits
    // Followed by bucketCnt keys and then bucketCnt elems.
    // NOTE: packing all the keys together and then all the elems together makes the
    // code a bit more complicated than alternating key/elem/key/elem/... but it allows
    // us to eliminate padding which would be needed for, e.g., map[int64]int8.
    // Followed by an overflow pointer.
}
复制代码
```

其中 `kv` 对是按照 key0/key1/key2/...val0/val1/val2/... 的格式排列，虽然在保存上面会比key/value对更复杂一些，但是避免了因为cpu要求固定长度读取，字节对齐，造成的空间浪费。

## 初始化 && 插入

```
package main

func main() {
	a := map[string]int{"one": 1, "two": 2, "three": 3}

	_ = a["one"]
}
复制代码
```

初始化3个key/value的map

```
TEXT main.main(SB) /Users/such/gomodule/runtime/main.go
=>      main.go:3       0x10565fb*      4881ec70010000          sub rsp, 0x170
        main.go:3       0x1056602       4889ac2468010000        mov qword ptr [rsp+0x168], rbp
        main.go:3       0x105660a       488dac2468010000        lea rbp, ptr [rsp+0x168]
        main.go:4       0x105664b       488b6d00                mov rbp, qword ptr [rbp]
        main.go:4       0x105666d       e8de9cfeff              call $runtime.fastrand
        main.go:4       0x1056672       488b442450              mov rax, qword ptr [rsp+0x50]
        main.go:4       0x1056677       8400                    test byte ptr [rax], al
        main.go:4       0x10566c6       48894c2410              mov qword ptr [rsp+0x10], rcx
        main.go:4       0x10566cb       4889442418              mov qword ptr [rsp+0x18], rax
        main.go:4       0x10566d0       e80b8efbff              call $runtime.mapassign_faststr
        main.go:4       0x1056726       48894c2410              mov qword ptr [rsp+0x10], rcx
        main.go:4       0x105672b       4889442418              mov qword ptr [rsp+0x18], rax
        main.go:4       0x1056730       e8ab8dfbff              call $runtime.mapassign_faststr
        main.go:4       0x1056786       4889442410              mov qword ptr [rsp+0x10], rax
        main.go:4       0x105678b       48894c2418              mov qword ptr [rsp+0x18], rcx
        main.go:4       0x1056790       e84b8dfbff              call $runtime.mapassign_faststr
复制代码
```

(省略了部分) 可以看出来，声明时连续调用三次 `call $runtime.mapassign_faststr` 添加键值对

```
func mapassign(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
	if h == nil {
		panic(plainError("assignment to entry in nil map"))
	}
	if raceenabled {
		callerpc := getcallerpc()
		pc := funcPC(mapassign)
		racewritepc(unsafe.Pointer(h), callerpc, pc)
		raceReadObjectPC(t.key, key, callerpc, pc)
	}
	// 看到这里，发现和之前 slice 声明时一样，都会做竞态检测
	if msanenabled {
		msanread(key, t.key.size)
	}
	
	// 这里就是并发读写map时，panic的地方
	if h.flags&hashWriting != 0 {
		throw("concurrent map writes")
	}
	// t 是 map 的类型，因此在编译时，可以确定key的类型，继而确定hash算法。
	alg := t.key.alg
	hash := alg.hash(key, uintptr(h.hash0))

	// 设置flag为writing
	h.flags ^= hashWriting

	if h.buckets == nil {
		h.buckets = newobject(t.bucket) // newarray(t.bucket, 1)
	}

again:  // 重新计算bucket的hash
	bucket := hash & bucketMask(h.B)
	if h.growing() {
		growWork(t, h, bucket)
	}
	b := (*bmap)(unsafe.Pointer(uintptr(h.buckets) + bucket*uintptr(t.bucketsize)))
	top := tophash(hash)

	var inserti *uint8
	var insertk unsafe.Pointer
	var elem unsafe.Pointer
bucketloop:
    // 遍历找到bucket
	for {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if isEmpty(b.tophash[i]) && inserti == nil {
					inserti = &b.tophash[i]
					insertk = add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))
					elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))
				}
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))
			if t.indirectkey() {
				k = *((*unsafe.Pointer)(k))
			}
			// equal 方法也是根据不同的数据类型，在编译时确定
			if !alg.equal(key, k) {
				continue
			}
			// map 中已经存在 key，修改 key 对应的 value
			if t.needkeyupdate() {
				typedmemmove(t.key, k, key)
			}
			elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))
			goto done
		}
		ovf := b.overflow(t)
		if ovf == nil {
			break
		}
		b = ovf
	}

	// Did not find mapping for key. Allocate new cell & add entry.

	// If we hit the max load factor or we have too many overflow buckets,
	// and we're not already in the middle of growing, start growing.
	if !h.growing() && (overLoadFactor(h.count+1, h.B) || tooManyOverflowBuckets(h.noverflow, h.B)) {
		hashGrow(t, h)
		goto again // Growing the table invalidates everything, so try again
	}

	if inserti == nil 
	    // 如果没有找到插入的node，即当前所有桶都已放满
		newb := h.newoverflow(t, b)
		inserti = &newb.tophash[0]
		insertk = add(unsafe.Pointer(newb), dataOffset)
		elem = add(insertk, bucketCnt*uintptr(t.keysize))
	}

	// store new key/elem at insert position
	if t.indirectkey() {
		kmem := newobject(t.key)
		*(*unsafe.Pointer)(insertk) = kmem
		insertk = kmem
	}
	if t.indirectelem() {
		vmem := newobject(t.elem)
		*(*unsafe.Pointer)(elem) = vmem
	}
	typedmemmove(t.key, insertk, key)
	*inserti = top
	h.count++

done:
    // 再次检查（双重校验锁的思路）是否并发写
	if h.flags&hashWriting == 0 {
		throw("concurrent map writes")
	}
	h.flags &^= hashWriting
	if t.indirectelem() {
		elem = *((*unsafe.Pointer)(elem))
	}
	return elem
}
复制代码
```

## 查找

```
TEXT main.main(SB) /Users/such/gomodule/runtime/main.go
=>      main.go:6       0x10567a9*      488d0550e10000          lea rax, ptr [rip+0xe150]
        main.go:6       0x10567c5       4889442410              mov qword ptr [rsp+0x10], rax
        main.go:6       0x10567ca       48c744241803000000      mov qword ptr [rsp+0x18], 0x3
        main.go:6       0x10567d3       e89885fbff              call $runtime.mapaccess1_faststr
复制代码
```

在 map 中找一个 key 的时候，runtime 调用了 `mapaccess1` 方法，和添加时很类似

```
func mapaccess1(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {
	if raceenabled && h != nil {
		callerpc := getcallerpc()
		pc := funcPC(mapaccess1)
		racereadpc(unsafe.Pointer(h), callerpc, pc)
		raceReadObjectPC(t.key, key, callerpc, pc)
	}
	if msanenabled && h != nil {
		msanread(key, t.key.size)
	}
	if h == nil || h.count == 0 {
		if t.hashMightPanic() {
			t.key.alg.hash(key, 0) // see issue 23734
		}
		return unsafe.Pointer(&zeroVal[0])
	}
	if h.flags&hashWriting != 0 {
		throw("concurrent map read and map write")
	}
	alg := t.key.alg
	hash := alg.hash(key, uintptr(h.hash0))
	m := bucketMask(h.B)
	b := (*bmap)(add(h.buckets, (hash&m)*uintptr(t.bucketsize)))
	if c := h.oldbuckets; c != nil {
		if !h.sameSizeGrow() {
			// There used to be half as many buckets; mask down one more power of two.
			m >>= 1
		}
		oldb := (*bmap)(add(c, (hash&m)*uintptr(t.bucketsize)))
		if !evacuated(oldb) {
			b = oldb
		}
	}
	top := tophash(hash)
bucketloop:
	for ; b != nil; b = b.overflow(t) {
		for i := uintptr(0); i < bucketCnt; i++ {
			if b.tophash[i] != top {
				if b.tophash[i] == emptyRest {
					break bucketloop
				}
				continue
			}
			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))
			if t.indirectkey() {
				k = *((*unsafe.Pointer)(k))
			}
			// 如果找到 key，就返回 key 指向的 value 指针的值，
			// 在计算 ptr 的时候，初始位置当前bmap, 偏移量 offset，是一个 bmap 结构体的大小，但对于amd64架构，
			// 还需要考虑字节对齐，即 8 字节对齐（dataOffset）+ 8个key的大小 + i (当前索引) 个value的大小
			if alg.equal(key, k) {
				e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))
				if t.indirectelem() {
					e = *((*unsafe.Pointer)(e))
				}
				return e
			}
		}
	}
	// 如果未找到的话，返回零对象的引用的指针
	return unsafe.Pointer(&zeroVal[0])
}
复制代码
```

在 map 包里，还有个类似的方法， `mapaccess2` 在经过验证，在 `_, ok := a["one"]` 一般用于判断key是否存在的写法时，是会用到。其实根据函数的返回值也可以看出。

### Growing

和 slice 一样，在 map 的元素持续增长时，每个bucket极端情况下会有很多overflow，退化成链表，需要 rehash。一般扩容是在 `h.count > loadFactor(2^B)`。 负载因子一般是：容量 / bucket数量，golang 的负载因子 loadFactorNum / loadFactorDen = 6.5，为什么不选择1呢，像 Redis 的 dictentry，只能保存一组键值对，golang的话，一个bucket正常情况下可以保存8组键值对； 那为什么选择6.5这个值呢，作者给出了一组数据。

loadFactor

%overflow

bytes/entry

hitprobe

missprobe

4.00

2.13

20.77

3.00

4.00

4.50

4.05

17.30

3.25

4.50

5.00

6.85

14.77

3.50

5.00

5.50

10.55

12.94

3.75

5.50

6.00

15.27

11.67

4.00

6.00

6.50

20.90

10.79

4.25

6.50

7.00

27.14

10.15

4.50

7.00

7.50

34.03

9.73

4.75

7.50

8.00

41.10

9.40

5.00

8.00

loadFactor：负载因子；  
%overflow：溢出率，有溢出 bucket 的占比；  
bytes/entry：每个 key/value 对占用字节比；  
hitprobe：找到一个存在的key平均查找个数；  
missprobe：找到一个不存在的key平均查找个数；

通常在负载因子 > 6.5时，就是平均每个bucket存储的键值对 超过6.5个或者是overflow的数量 > 2 ^ 15时会发生扩容（迁移）。它分为两种情况：  
第一种：由于map在不断的insert 和 delete 中，bucket中的键值存储不够均匀，内存利用率很低，需要进行迁移。（注：bucket数量不做增加）  
第二种：真正的，因为负载因子过大引起的扩容，bucket 增加为原 bucket 的两倍  
不论上述哪一种 rehash，都是调用 `hashGrow` 方法：

1.  定义原 hmap 中指向 buckets 数组的指针
2.  创建 bucket 数组并设置为 hmap 的 bucket 字段
3.  将 extra 中的 oldoverflow 指向 overflow，overflow 指向 nil
4.  如果正在 growing 的话，开始渐进式的迁移，在 `growWork` 方法里是 bucket 中 key/value 的迁移
5.  在全部迁移完成后，释放内存

> 注意： **golang在rehash时，和Redis一样采用渐进式的rehash，没有一次性迁移所有的buckets，而是把key的迁移分摊到每次插入或删除时， 在 bucket 中的 key/value 全部迁移完成释放oldbucket和extra.oldoverflow（尽可能不去使用map存储大量数据；最好在初始化一次性声明cap，避免频繁扩容）**

## 删除

```
func mapdelete(t *maptype, h *hmap, key unsafe.Pointer) {
...省略
search:
	for ; b != nil; b = b.overflow(t) {
		for i := uintptr(0); i < bucketCnt; i++ {
			if t.indirectkey() {
				*(*unsafe.Pointer)(k) = nil
			} else if t.key.ptrdata != 0 {
				memclrHasPointers(k, t.key.size)
			}
			e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))
			if t.indirectelem() {
				*(*unsafe.Pointer)(e) = nil
			} else if t.elem.ptrdata != 0 {
				memclrHasPointers(e, t.elem.size)
			} else {
				memclrNoHeapPointers(e, t.elem.size)
			}
			
			b.tophash[i] = emptyOne
			
			if i == bucketCnt-1 {
				if b.overflow(t) != nil && b.overflow(t).tophash[0] != emptyRest {
					goto notLast
				}
			} else {
				if b.tophash[i+1] != emptyRest {
					goto notLast
				}
			}
			for {
				b.tophash[i] = emptyRest
				if i == 0 {
					if b == bOrig {
						break // beginning of initial bucket, we're done.
					}
					// Find previous bucket, continue at its last entry.
					c := b
					for b = bOrig; b.overflow(t) != c; b = b.overflow(t) {
					}
					i = bucketCnt - 1
				} else {
					i--
				}
				if b.tophash[i] != emptyOne {
					break
				}
			}
		notLast:
			h.count--
			break search
		}
	}
    ...
}
复制代码
```

key 和value，如果是值类型的话，直接设置为nil, 如果是指针的话，就从 ptr 位置开始清除 n 个bytes; 接着在删除时，只是在tophash对应的位置上，设置为 empty 的标记（`b.tophash[i] = emptyOne`），没有真正的释放内存空间，因为频繁的申请、释放内存空间开销很大，如果真正想释放的话，只有依赖GC； 如果bucket是以一些 emptyOne 的标记结束，最终，就设置为 emptyRest 标记，emptyOne 和 emptyRest 都是空的标记，emptyRest的区别就是：标记在 高索引位 和 overflow bucket 都是空的， 应该是考虑在之后重用时，插入和删除操作需要查找位置时，减少查找次数。

### 建议

做两组试验，第一组是：提前分配好 map 的总容量后追加k/v；另一组是：初始化 0 容量的 map 后做追加

```
package main

import "testing"
var count int = 100000
func addition(m map[int]int) map[int]int {
	for i := 0; i < count; i++ {
		m[i] = i
	}
	return m
}
func BenchmarkGrows(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		m := make(map[int]int)
		addition(m)
	}
}
func BenchmarkNoGrows(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		m := make(map[int]int, count)
		addition(m)
	}
}
复制代码
```

```
$ go test -bench=. ./
goos: darwin
goarch: amd64
# benchmark名字 -CPU数       执行次数      平均执行时间ns
BenchmarkGrows-4             200           8298505 ns/op
BenchmarkNoGrows-4           300           4627118 ns/op
PASS
ok      _/Users/such/gomodule/runtime   4.401s
复制代码
```

提前定义容量的case平均执行时间比未定义容量的快了80% --- **扩容时的数据拷贝和重新哈希成本很高！**  
再看看内存的分配次数：

```
$ go test -bench=. -benchmem ./
goos: darwin
goarch: amd64
# benchmark名字 -CPU数       执行次数      平均执行时间ns         每次分配内存大小        每次内存分配次数
BenchmarkGrows-4             200           9265553 ns/op         5768155 B/op       4010 allocs/op
BenchmarkNoGrows-4           300           4855000 ns/op         2829115 B/op       1678 allocs/op
PASS
ok      _/Users/such/gomodule/runtime   4.704s
复制代码
```

两个方法执行相同的次数，GC的次数也会多出一倍

```
func main() {
	for i := 0; i < 5; i++ {
		n := make(map[int]int, count)
		addition(n)
		//m := make(map[int]int)
		//addition(m)
	}
}
// 第一组，预分配
$ go build -o growth && GODEBUG=gctrace=1 ./growth
gc 1 @0.006s 0%: 0.002+0.091+0.015 ms clock, 0.011+0.033/0.011/0.088+0.060 ms cpu, 5->5->2 MB, 6 MB goal, 4 P
gc 2 @0.012s 0%: 0.001+0.041+0.002 ms clock, 0.007+0.032/0.007/0.033+0.009 ms cpu, 5->5->2 MB, 6 MB goal, 4 P
gc 3 @0.017s 0%: 0.002+0.090+0.010 ms clock, 0.008+0.035/0.006/0.084+0.041 ms cpu, 5->5->2 MB, 6 MB goal, 4 P
gc 4 @0.022s 0%: 0.001+0.056+0.008 ms clock, 0.007+0.026/0.003/0.041+0.034 ms cpu, 5->5->2 MB, 6 MB goal, 4 P

// 第二组，未分配
$ go build -o growth && GODEBUG=gctrace=1 ./growth
gc 1 @0.005s 0%: 0.001+0.10+0.001 ms clock, 0.007+0.076/0.004/0.13+0.007 ms cpu, 5->5->3 MB, 6 MB goal, 4 P
gc 2 @0.012s 0%: 0.002+0.071+0.010 ms clock, 0.008+0.016/0.010/0.075+0.040 ms cpu, 5->5->0 MB, 7 MB goal, 4 P
gc 3 @0.015s 0%: 0.001+0.13+0.009 ms clock, 0.007+0.006/0.037/0.082+0.036 ms cpu, 4->5->3 MB, 5 MB goal, 4 P
gc 4 @0.021s 0%: 0.001+0.13+0.009 ms clock, 0.007+0.040/0.007/0.058+0.038 ms cpu, 6->6->1 MB, 7 MB goal, 4 P
gc 5 @0.024s 0%: 0.001+0.084+0.001 ms clock, 0.005+0.036/0.006/0.052+0.006 ms cpu, 4->4->3 MB, 5 MB goal, 4 P
gc 6 @0.030s 0%: 0.002+0.075+0.001 ms clock, 0.008+0.056/0.004/0.072+0.007 ms cpu, 6->6->1 MB, 7 MB goal, 4 P
gc 7 @0.033s 0%: 0.013+0.11+0.003 ms clock, 0.053+0.047/0.013/0.075+0.012 ms cpu, 4->4->3 MB, 5 MB goal, 4 P
gc 8 @0.041s 0%: 0.002+0.073+0.024 ms clock, 0.008+0.033/0.010/0.067+0.097 ms cpu, 6->6->1 MB, 7 MB goal, 4 P
gc 9 @0.043s 0%: 0.001+0.067+0.001 ms clock, 0.006+0.046/0.003/0.070+0.006 ms cpu, 4->4->3 MB, 5 MB goal, 4 P
复制代码
```

有个1千万kv的 map，测试在什么情况下会回收内存

```
package main

var count = 10000000
var dict = make(map[int]int, count)
func addition() {
	for i := 0; i < count; i++ {
		dict[i] = i
	}
}
func clear() {
	for k := range dict {
		delete(dict, k)
	}
	//dict = nil
}
func main() {
	addition()
	clear()
	debug.FreeOSMemory()
}

$ go build -o clear && GODEBUG=gctrace=1 ./clear
gc 1 @0.007s 0%: 0.006+0.12+0.015 ms clock, 0.025+0.037/0.038/0.12+0.061 ms cpu, 306->306->306 MB, 307 MB goal, 4 P
gc 2 @0.963s 0%: 0.004+1.0+0.025 ms clock, 0.017+0/0.96/0.48+0.10 ms cpu, 307->307->306 MB, 612 MB goal, 4 P
gc 3 @1.381s 0%: 0.004+0.081+0.003 ms clock, 0.018+0/0.051/0.086+0.013 ms cpu, 309->309->306 MB, 612 MB goal, 4 P (forced)
scvg-1: 14 MB released
scvg-1: inuse: 306, idle: 77, sys: 383, released: 77, consumed: 306 (MB)
复制代码
```

删除了所有kv，堆大小（goal）并无变化

```
func clear() {
	for k := range dict {
		delete(dict, k)
	}
	dict = nil
}

$ go build -o clear && GODEBUG=gctrace=1 ./clear
gc 1 @0.006s 0%: 0.004+0.12+0.010 ms clock, 0.019+0.035/0.016/0.17+0.043 ms cpu, 306->306->306 MB, 307 MB goal, 4 P
gc 2 @0.942s 0%: 0.003+1.0+0.010 ms clock, 0.012+0/0.85/0.54+0.043 ms cpu, 307->307->306 MB, 612 MB goal, 4 P
gc 3 @1.321s 0%: 0.003+0.072+0.002 ms clock, 0.013+0/0.050/0.090+0.010 ms cpu, 309->309->0 MB, 612 MB goal, 4 P (forced)
scvg-1: 319 MB released
scvg-1: inuse: 0, idle: 383, sys: 383, released: 383, consumed: 0 (MB)
复制代码
```

清除过后，设置为nil，才会真正释放内存。（本身每2分钟强制 runtime.GC()，每5分钟 scavenge 释放内存，其实不必太过纠结是否真正释放，未真正释放也是为了后面有可能的重用， **但有时需要真实释放时，清楚怎么做才能解决问题**）

**Reference**

> Map：[golang.org/src/runtime…](https://link.juejin.im?target=https%3A%2F%2Fgolang.org%2Fsrc%2Fruntime%2Fmap.go%3Fh%3Dhmap%23L115) Benchmark：[dave.cheney.net/2013/06/30/…](https://link.juejin.im?target=https%3A%2F%2Fdave.cheney.net%2F2013%2F06%2F30%2Fhow-to-write-benchmarks-in-go)  
> Gctrace：[dave.cheney.net/tag/godebug](https://link.juejin.im?target=https%3A%2F%2Fdave.cheney.net%2Ftag%2Fgodebug)  
> FreeOsMemory：[golang.org/pkg/runtime…](https://link.juejin.im?target=https%3A%2F%2Fgolang.org%2Fpkg%2Fruntime%2Fdebug%2F%23FreeOSMemory)

* * *

有疑问加站长微信联系（非本文作者）

![](https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280)
