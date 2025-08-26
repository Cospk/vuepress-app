---
title: Golang网络:核心API实现剖析二)
source_url: 'https://studygolang.com/articles/11955'
category: Go原理教程
---

<pre><code class="language-text"><span></span>func netpollWait(pd *pollDesc, mode int) int {
    // 先检查该socket是否有error发生（如关闭、超时等） 
    err := netpollcheckerr(pd, int32(mode))
    if err != 0 {
        return err
    }

    // As for now only Solaris uses level-triggered IO. 
    if GOOS == "solaris" {
        onM(func() {
            netpollarm(pd, mode)
        })
    }
    // 循环等待netpollblock返回值为true 
    // 如果返回值为false且该socket未出现任何错误 
    // 那该协程可能被意外唤醒，需要重新被挂起 
    // 还有一种可能：该socket由于超时而被唤醒 
    // 此时netpollcheckerr就是用来检测超时错误的 
    for !netpollblock(pd, int32(mode), false) {
        err = netpollcheckerr(pd, int32(mode))
        if err != 0 {
            return err
        }
    }
    return 0 
}

func netpollblock(pd *pollDesc, mode int32, waitio bool) bool {
    gpp := &pd.rg
    if mode == 'w' {
        gpp = &pd.wg
    }

    // set the gpp semaphore to WAIT 
    // 首先将轮询状态设置为pdWait 
    // 为什么要使用for呢？因为casuintptr使用了自旋锁 
    // 为什么使用自旋锁就要加for循环呢？ 
    for {
        old := *gpp
        if old == pdReady {
            *gpp = 0 
            return true 
        }
        if old != 0 {
            gothrow("netpollblock: double wait")
        }
        // 将socket轮询相关的状态设置为pdWait 
        if casuintptr(gpp, 0, pdWait) {
            break 
        }
    }
    // 如果未出错将该协程挂起，解锁函数是netpollblockcommit 
    if waitio || netpollcheckerr(pd, mode) == 0 {
        f := netpollblockcommit
        gopark(**(**unsafe.Pointer)(unsafe.Pointer(&f)), unsafe.Pointer(gpp), "IO wait")
    }
    // 可能是被挂起的协程被唤醒 
    // 或者由于某些原因该协程压根未被挂起 
    // 获取其当前状态记录在old中 
    old := xchguintptr(gpp, 0)
    if old > pdWait {
        gothrow("netpollblock: corrupted state")
    }
    return old == pdReady
}
</code></pre>