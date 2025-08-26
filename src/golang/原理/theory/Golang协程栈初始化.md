---
title: Golang协程栈初始化
source_url: 'https://studygolang.com/articles/11859'
category: Go原理教程
---


						<h2>主协程初始化</h2><p>Golang的主协程指的是运行main函数的协程，而子协程指的是在程序运行过程中由主协程创建的协程。每个线程(m)只会有一个主协程，而子协程可能会有很多很多。</p><p>子协程和主协程在概念和内部实现上几乎没有任何区别，唯一的不同在于它们的初始栈大小不同。</p><p>我们先看看测试过程中生成的主协程堆栈示例。我测试代码中就生成了一个主协程，通过反汇编代码看到他的样子大概如下：</p>

<img src="https://static.studygolang.com/171207/50b07f36861aac261f0b344753dcbc0a.jpg" alt="">

<h2>主协程启动</h2>
<p>分析连接器（libinit()）发现go程序的入口函数是_rt0_amd64_linux（linux amd64机器）</p><h2>子协程初始化</h2><p>Golang子协程堆栈在协程被创建时也一并创建，代码如下：</p><div class="highlight"><pre><code class="language-go">func newproc1(fn *funcval, argp *uint8, narg int32, nret int32, callerpc uintptr) *g {
    _g_ := getg()

    ......

    _p_ := _g_.m.p.ptr()
    newg := gfget(_p_)
    if newg == nil {
        // 创建协程栈
        newg = malg(_StackMin)
        casgstatus(newg, _Gidle, _Gdead)
        allgadd(newg) // publishes with a g->status of Gdead so GC scanner doesn't look at uninitialized stack.
    }
    ......

    totalSize := 4*regSize + uintptr(siz) // extra space in case of reads slightly beyond frame
    if hasLinkRegister {
        totalSize += ptrSize
    }
    totalSize += -totalSize & (spAlign - 1) // align to spAlign
    // 新协程的栈顶计算，将栈的基地址减去参数占用的空间
    sp := newg.stack.hi - totalSize
    spArg := sp
    if hasLinkRegister {
        // caller's LR
        *(*unsafe.Pointer)(unsafe.Pointer(sp)) = nil
        spArg += ptrSize
    }
    ...
    // 设置新建协程的栈顶sp
    newg.sched.sp = sp
}

// Allocate a new g, with a stack big enough for stacksize bytes.
func malg(stacksize int32) *g {
    newg := new(g)
    if stacksize >= 0 {
        stacksize = round2(_StackSystem + stacksize)
        systemstack(func() {
            newg.stack, newg.stkbar = stackalloc(uint32(stacksize))
        })
        // 设置stackguard，在协程栈不够用时再重新申请新的栈
        newg.stackguard0 = newg.stack.lo + _StackGuard
        newg.stackguard1 = ^uintptr(0)
        newg.stackAlloc = uintptr(stacksize)
    }
    return newg
}
</code></pre>