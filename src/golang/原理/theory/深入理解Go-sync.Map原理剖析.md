---
title: 深入理解Go-sync.Map原理剖析
source_url: 'https://studygolang.com/articles/23359'
category: Go原理教程
---


						<blockquote>Map is like a Go map[interface{}]interface{} but is safe for concurrent use<p>by multiple goroutines without additional locking or coordination.</p>
<p>Loads, stores, and deletes run in amortized constant time.</p>
</blockquote>
<p>上面一段是官方对<code>sync.Map</code> 的描述，从描述中看，<code>sync.Map</code> 跟<code>map</code> 很像，<code>sync.Map</code> 的底层实现也是依靠了<code>map</code>，但是<code>sync.Map</code> 相对于 <code>map</code> 来说，是并发安全的。</p>
<h1>1. 结构概览</h1>
<h2>1.1. sync.Map</h2>
<p>sync.Map的结构体了</p>
<pre><code class="go">type Map struct {
    mu Mutex

  // 后面是readOnly结构体，依靠map实现，仅仅只用来读
    read atomic.Value // readOnly

    // 这个map主要用来写的，部分时候也承担读的能力
    dirty map[interface{}]*entry

    // 记录自从上次更新了read之后，从read读取key失败的次数
    misses int
}</code></pre>
<h2>1.2. readOnly</h2>
<p>sync.Map.read属性所对应的结构体了，这里不太明白为什么不把readOnly结构体的属性直接放入到sync.Map结构体里</p>
<pre><code class="go">type readOnly struct {
  // 读操作所对应的map
    m       map[interface{}]*entry
  // dirty是否包含m中不存在的key
    amended bool // true if the dirty map contains some key not in m.
}</code></pre>
<h2>1.3. entry</h2>
<p>entry就是unsafe.Pointer，记录的是数据存储的真实地址</p>
<pre><code class="go">type entry struct {
    p unsafe.Pointer // *interface{}
}
</code></pre>
<h2>1.4. 结构示意图</h2>
<p>通过上面的结构体，我们可以简单画出来一个结构示意图</p>
<p><span class="img-wrap"><img referrerpolicy="no-referrer" data-src="/img/remote/1460000020325766" src="https://static.studygolang.com/190908/9b44fb7c5d8a9f565729517e69910006.png" alt="" title=""/></span></p>
<h1>2. 流程分析</h1>
<p>我们通过下面的动图（也可以手动debug），看一下在我们执行<code>Store</code> <code>Load</code> <code>Delete</code> 的时候，这个结构体的变换是如何的，先增加一点我们的认知</p>
<pre><code class="go">func main() {
    m := sync.Map{}
    m.Store("test1", "test1")
    m.Store("test2", "test2")
    m.Store("test3", "test3")
    m.Load("test1")
    m.Load("test2")
    m.Load("test3")
    m.Store("test4", "test4")
    m.Delete("test")
    m.Load("test")
}</code></pre>
<p>以上面代码为例，我们看一下m的结构变换</p>
<p><span class="img-wrap"><img referrerpolicy="no-referrer" data-src="/img/remote/1460000020325767" src="https://static.studygolang.com/190908/0e63f3dddda4f7f431219fc055aaadf6.gif" alt="" title=""/></span></p>
<h1>3. 源码分析</h1>
<h2>3.1. 新增key</h2>
<p>新增一个key value，通过<code>Store</code>方法来实现</p>
<pre><code class="go">func (m *Map) Store(key, value interface{}) {
    read, _ := m.read.Load().(readOnly)
  // 如果这个key存在，通过tryStore更新
    if e, ok := read.m[key]; ok && e.tryStore(&value) {
        return
    }
  // 走到这里有两种情况，1. key不存在 2. key对应的值被标记为expunged，read中的entry拷贝到dirty时，会将key标记为expunged，需要手动解锁
    m.mu.Lock()
    read, _ = m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok {
    // 第二种情况，先解锁，然后添加到dirty
        if e.unexpungeLocked() {
            // The entry was previously expunged, which implies that there is a
            // non-nil dirty map and this entry is not in it.
            m.dirty[key] = e
        }
        e.storeLocked(&value)
    } else if e, ok := m.dirty[key]; ok {
    // m中没有，但是dirty中存在，更新dirty中的值
        e.storeLocked(&value)
    } else {
    // 如果amend==false，说明dirty和read是一致的，但是我们需要新加key到dirty里面，所以更新read.amended
        if !read.amended {
            // We're adding the first new key to the dirty map.
            // Make sure it is allocated and mark the read-only map as incomplete.
      // 这一步会将read中所有的key标记为 expunged
            m.dirtyLocked()
            m.read.Store(readOnly{m: read.m, amended: true})
        }
        m.dirty[key] = newEntry(value)
    }
    m.mu.Unlock()
}</code></pre>
<h3>3.1.1. tryLock</h3>
<pre><code class="go">func (e *entry) tryStore(i *interface{}) bool {
    p := atomic.LoadPointer(&e.p)
  // 这个entry是key对应的entry，p是key对应的值，如果p被设置为expunged，不能直接更新存储
    if p == expunged {
        return false
    }
    for {
    // 原子更新
        if atomic.CompareAndSwapPointer(&e.p, p, unsafe.Pointer(i)) {
            return true
        }
        p = atomic.LoadPointer(&e.p)
        if p == expunged {
            return false
        }
    }
}</code></pre>
<p>tryLock会对key对应的值，进行判断，是否被设置为了expunged，这种情况下不能直接更新</p>
<h3>3.1.2. dirtyLock</h3>
<p>这里就是设置 expunged 标志的地方了，而这个函数正是将read中的数据同步到dirty的操作</p>
<pre><code class="go">func (m *Map) dirtyLocked() {
  // dirty != nil 说明dirty在上次read同步dirty数据后，已经有了修改了，这时候read的数据不一定准确，不能同步
    if m.dirty != nil {
        return
    }

    read, _ := m.read.Load().(readOnly)
    m.dirty = make(map[interface{}]*entry, len(read.m))
    for k, e := range read.m {
    // 这里调用tryExpungeLocked 来给entry，即key对应的值 设置标志位
        if !e.tryExpungeLocked() {
            m.dirty[k] = e
        }
    }
}</code></pre>
<h3>3.1.3. tryExpungeLocked</h3>
<p>通过原子操作，给entry，key对应的值设置 expunged 标志</p>
<pre><code class="go">func (e *entry) tryExpungeLocked() (isExpunged bool) {
    p := atomic.LoadPointer(&e.p)
    for p == nil {
        if atomic.CompareAndSwapPointer(&e.p, nil, expunged) {
            return true
        }
        p = atomic.LoadPointer(&e.p)
    }
    return p == expunged
}</code></pre>
<h3>3.1.4. unexpungeLocked</h3>
<pre><code class="go">func (e *entry) unexpungeLocked() (wasExpunged bool) {
    return atomic.CompareAndSwapPointer(&e.p, expunged, nil)
}</code></pre>
<p>根据上面分析，我们发现，在新增的时候，分为四种情况：</p>
<ol>
<li>key原先就存在于read中，获取key所对应内存地址，原子性修改</li>
<li>key存在，但是key所对应的值被标记为 expunged，解锁，解除标记，并更新dirty中的key，与read中进行同步，然后修改key对应的值</li>
<li>read中没有key，但是dirty中存在这个key，直接修改dirty中key的值</li>
<li>read和dirty中都没有值，先判断自从read上次同步dirty的内容后有没有再修改过dirty的内容，没有的话，先同步read和dirty的值，然后添加新的key value到dirty上面</li>
</ol>
<p>��出现第四种情况的时候，很容易产生一个困惑：既然read.amended == false，表示数据没有修改，为什么还要将read的数据同步到dirty里面呢？</p>
<p>这个答案在<code>Load</code> 函数里面会有答案，因为，read同步dirty的数据的时候，是直接把dirty指向map的指针交给了read.m，然后将dirty的指针设置为nil，所以，同步之后，dirty就为nil</p>
<p>下面看看具体的实现</p>
<h2>3.2. 读取（Load）</h2>
<pre><code class="go">func (m *Map) Load(key interface{}) (value interface{}, ok bool) {
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]
  // 如果read的map中没有，且存在修改
    if !ok && read.amended {
        m.mu.Lock()
        // Avoid reporting a spurious miss if m.dirty got promoted while we were
        // blocked on m.mu. (If further loads of the same key will not miss, it's
        // not worth copying the dirty map for this key.)
    // 再查找一次，有可能刚刚将dirty升级为read了
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]
        if !ok && read.amended {
      // 如果amended 还是处于修改状态，则去dirty中查找
            e, ok = m.dirty[key]
            // Regardless of whether the entry was present, record a miss: this key
            // will take the slow path until the dirty map is promoted to the read
            // map.
      // 增加misses的计数，在计数达到一定规则的时候，触发升级dirty为read
            m.missLocked()
        }
        m.mu.Unlock()
    }
  // read dirty中都没有找到
    if !ok {
        return nil, false
    }
  // 找到了，通过load判断具体返回内容
    return e.load()
}

func (e *entry) load() (value interface{}, ok bool) {
    p := atomic.LoadPointer(&e.p)
  // 如果p为nil或者expunged标识，则key不存在
    if p == nil || p == expunged {
        return nil, false
    }
    return *(*interface{})(p), true
}</code></pre>
<p>为什么找到了p，但是p对应的值为nil呢？这个答案在后面解析<code>Delete</code>函数的时候会被揭晓</p>
<h3>3.2.1. missLocked</h3>
<pre><code class="go">func (m *Map) missLocked() {
    m.misses++
    if m.misses < len(m.dirty) {
        return
    }
  // 直接把dirty的指针给read.m，并且设置dirty为nil，这里也就是 Store 函数的最后会调用 m.dirtyLocked的原因
    m.read.Store(readOnly{m: m.dirty})
    m.dirty = nil
    m.misses = 0
}</code></pre>
<h2>3.3. 删除（Delete）</h2>
<p>这里的删除并不是简单的将key从map中删除</p>
<pre><code class="go">func (m *Map) Delete(key interface{}) {
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]
  // read中没有这个key，但是Map被标识修改了，那么去dirty里面看看
    if !ok && read.amended {
        m.mu.Lock()
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]
        if !ok && read.amended {
      // 调用delete删除dirty的map，delete会判断key是否存在的
            delete(m.dirty, key)
        }
        m.mu.Unlock()
    }
  // 如果read中存在，则假删除
    if ok {
        e.delete()
    }
}

func (e *entry) delete() (hadValue bool) {
    for {
        p := atomic.LoadPointer(&e.p)
    // 已经是被删除了，不需要管了
        if p == nil || p == expunged {
            return false
        }
    // 原子性 将key的值设置为nil
        if atomic.CompareAndSwapPointer(&e.p, p, nil) {
            return true
        }
    }
}</code></pre>
<p>根据上面的逻辑可以看出，删除的时候，存在以下几种情况</p>
<ol>
<li>read中没有，且Map存在修改，则尝试删除dirty中的map中的key</li>
<li>read中没有，且Map不存在修改，那就是没有这个key，无需操作</li>
<li>read中有，尝试将key对应的值设置为nil，后面读取的时候就知道被删了，因为dirty中map的值跟read的map中的值指向的都是同一个地址空间，所以，修改了read也就是修改了dirty</li>
</ol>
<h2>3.3. 遍历（Range）</h2>
<p>遍历的逻辑就比较简单了，Map只有两种状态，被修改过和没有修改过</p>
<p>修改过：将dirty的指针交给read，read就是最新的数据了，然后遍历read的map</p>
<p>没有修改过：遍历read的map就好了</p>
<pre><code class="go">func (m *Map) Range(f func(key, value interface{}) bool) {
    read, _ := m.read.Load().(readOnly)
    if read.amended {
        m.mu.Lock()
        read, _ = m.read.Load().(readOnly)
        if read.amended {
            read = readOnly{m: m.dirty}
            m.read.Store(read)
            m.dirty = nil
            m.misses = 0
        }
        m.mu.Unlock()
    }

    for k, e := range read.m {
        v, ok := e.load()
        if !ok {
            continue
        }
        if !f(k, v) {
            break
        }
    }
}</code></pre>
<h2>3.4. 适用场景</h2>
<p>在官方介绍的时候，也对适用场景做了说明</p>
<blockquote>The Map type is optimized for two common use cases: <p>(1) when the entry for a given key is only ever written once but read many times, as in caches that only grow,</p>
<p>(2) when multiple goroutines read, write, and overwrite entries for disjoint sets of keys. </p>
<p>In these two cases, use of a Map may significantly reduce lock contention compared to a Go map paired with a separate Mutex or RWMutex.</p>
</blockquote>
<p>通过对源码的分析来理解一下产生这两条规则的原因：</p>
<p>读多写少：读多写少的环境下，都是从read的map去读取，不需要加锁，而写多读少的情况下，需要加锁，其次，存在将read数据同步到dirty的操作的可能性，大量的拷贝操作会大大的降低性能</p>
<p>读写不同的key：sync.Map是针对key的值的原子操作，相当于加锁加载 key上，所以，多个key的读写是可以同时并发的</p>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						