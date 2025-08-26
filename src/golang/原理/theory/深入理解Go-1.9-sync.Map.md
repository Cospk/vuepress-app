---
title: 深入理解Go 1.9 sync.Map
source_url: 'https://studygolang.com/articles/12000'
category: Go原理教程
---


						<p>Go官方的<a href="https://golang.org/doc/faq#atomic_maps">faq</a>已经提到内建的map不是线程(goroutine)安全的。在Go 1.6之前， 内置的map类型是部分goroutine安全的，并发的读没有问题，并发的写可能有问题。自go 1.6之后， 并发地读写map会报错，这在一些知名的开源库中都存在这个问题，所以go 1.9之前的解决方案是额外绑定一个锁，封装成一个新的struct或者单独使用锁都可以。另外笔者在go 1.9之前通常是使用<a href="https://github.com/orcaman/concurrent-map">concurrent-map</a>来解决这类问题，但是不是所有的第三方库都以此来解决问题。</p>
<p>我们先来看看这个代码样例：程序中一个goroutine一直读，一个goroutine一直写同一个键值，即使读写的键不相同，而且map也没有"扩容"等操作，代码还是会报错的，<code>错误信息是: fatal error: concurrent map read and map write。</code>。</p>
<pre><code>package main
func main() {
	m := make(map[int]int)
	go func() {
		for {
			_ = m[1]
		}
	}()
	go func() {
		for {
			m[2] = 2
		}
	}()
	select {}
}
</code></pre>
<p>问题的根源在Go的源代码: <a href="https://github.com/golang/go/blob/master/src/runtime/hashmap_fast.go#L118">hashmap_fast.go#L118</a>,会看到读的时候会检查hashWriting标志， 如果有这个标志，就会报并发错误。</p>
<p>写的时候会设置这个标志:<a href="https://github.com/golang/go/blob/master/src/runtime/hashmap.go#L542"> hashmap.go#L542</a></p>
<pre><code>h.flags |= hashWriting
</code></pre>
<p><a href="https://github.com/golang/go/blob/master/src/runtime/hashmap.go#L628">hashmap.go#L628</a>设置完之后会取消这个标记。这样并发读写的检查有很多处， 比如写的时候也会检查是不是有并发的写，删除键的时候类似写，遍历的时候并发读写问题等。map的并发问题并不是那么容易被发现, 你可以利用-race参数来检查。</p>
<p>并发地使用map对象是我们日常开发中一个很常见的需求，特别是在一些大项目中。map总会保存goroutine共享的数据。Go 1.9之前在Go官方blog的<a href="https://blog.golang.org/go-maps-in-action">Go maps in action</a>一文中，给出了一种简便的解决方案。</p>
<p>首先，通过嵌入struct为map增加一个读写锁</p>
<pre><code>var counter = struct{
    sync.RWMutex
    m map[string]int
}{m: make(map[string]int)}

</code></pre>
<p>读写数据时，可以很方便的加锁</p>
<pre><code>counter.RLock()
n := counter.m["some_key"]
counter.RUnlock()
fmt.Println("some_key:", n)

counter.Lock()
counter.m["some_key"]++
counter.Unlock()
</code></pre>
<p>当然，你也可以使用<a href="https://github.com/orcaman/concurrent-map">concurrent-map</a>来解决问题</p>
<pre><code>// Create a new map.
map := cmap.New()
	
// Sets item within map, sets "bar" under key "foo"
map.Set("foo", "bar")

// Retrieve item from map.
if tmp, ok := map.Get("foo"); ok {
	bar := tmp.(string)
}

// Removes item under key "foo"
map.Remove("foo")
</code></pre>
<p>两者本质上都是使用<code>sync.RWMutex</code>来保障线程(goroutine)安全的。这种解决方案相当简洁，并且利用读写锁而不是Mutex可以进一步减少读写的时候因为锁带来的性能。但在map的数据非常大的情况下，一把锁会导致大并发的客户端共争一把锁，这时，在Go 1.9中sync.Map就非常实用。（除了以上这些之外，还有一个笔者想提到的库，<a href="http://github.com/OneOfOne/cmap">cmap</a>也是一个相当好，安全且性能出色的第三方库）</p>
<p>Go 1.9中sync.Map的实现有以下优化点：</p>
<ol>
<li>空间换时间。 通过冗余的两个数据结构(read、dirty),实现加锁对性能的影响。</li>
<li>使用只读数据(read)，避免读写冲突。</li>
<li>动态调整，miss次数多了之后，将dirty数据提升为read。</li>
<li>double-checking。</li>
<li>延迟删除。 删除一个键值只是打标记，只有在提升dirty的时候才清理删除的数据。</li>
<li>优先从read读取、更新、删除，因为对read的读取不需要锁。</li>
</ol>
<p>sync.Map数据结构很简单，包含四个字段：<code>read</code>、<code>mu</code>、<code>dirty</code>、<code>misses</code>。</p>
<pre><code>type Map struct {
	// 当涉及到dirty数据的操作的时候，需要使用此锁
	mu Mutex
	// 一个只读的数据结构，因为只读，所以不会有读写冲突。
	// 所以从这个数据中读取总是安全的。
	// 实际上，实际也会更新这个数据的entries,如果entry是未删除的(unexpunged), 并不需要加锁。如果entry已经被删除了，需要加锁，以便更新dirty数据。
	read atomic.Value // readOnly
	// dirty数据包含当前的map包含的entries,它包含最新的entries(包括read中未删除的数据,虽有冗余，但是提升dirty字段为read的时候非常快，不用一个一个的复制，而是直接将这个数据结构作为read字段的一部分),有些数据还可能没有移动到read字段中。
	// 对于dirty的操作需要加锁，因为对它的操作可能会有读写竞争。
	// 当dirty为空的时候， 比如初始化或者刚提升完，下一次的写操作会复制read字段中未删除的数据到这个数据中。
	dirty map[interface{}]*entry
	// 当从Map中读取entry的时候，如果read中不包含这个entry,会尝试从dirty中读取，这个时候会将misses加一，
	// 当misses累积到 dirty的长度的时候， 就会将dirty提升为read,避免从dirty中miss太多次。因为操作dirty需要加锁。
	misses int
}

</code></pre>
<p><code>read</code>的数据结构</p>
<pre><code>type readOnly struct {
	m       map[interface{}]*entry
	amended bool // 如果Map.dirty有些数据不在其中的时候，这个值为true
}
</code></pre>
<p>这里的精髓是，使用了冗余的数据结构<code>read</code>、<code>dirty</code>。<code>dirty</code>中会包含<code>read</code>中未删除的entries，新增加的entries会加入到<code>dirty</code>中。<code>amended</code>指明<code>Map.dirty</code>中有<code>readOnly.m</code>未包含的数据，所以如果从<code>Map.read</code>找不到数据的话，还要进一步到<code>Map.dirty</code>中查找。而对<code>Map.read</code>的修改是通过原子操作进行的。虽然<code>read</code>和<code>dirty</code>有冗余数据，但这些数据是通过指针指向同一个数据，所以尽管Map的value会很大，但是冗余的空间占用还是有限的。<code>readOnly.m</code>和<code>Map.dirty</code>存储的值类型是<code>*entry</code>,它包含一个指针p, 指向用户存储的value值。</p>
<pre><code>type entry struct {
	p unsafe.Pointer // *interface{}
}
</code></pre>
<p>p有三种值：</p>
<ul>
<li>nil: entry已被删除了，并且m.dirty为nil</li>
<li>expunged: entry已被删除了，并且m.dirty不为nil，而且这个entry不存在于m.dirty中</li>
<li>其它： entry是一个正常的值</li>
</ul>
<p>理解了sync.Map的数据结构，那么我们先来看看sync.Map的Load方法实现</p>
<pre><code>func (m *Map) Load(key interface{}) (value interface{}, ok bool) {
	// 1.首先从m.read中得到只读readOnly,从它的map中查找，不需要加锁
	read, _ := m.read.Load().(readOnly)
	e, ok := read.m[key]
	// 2. 如果没找到，并且m.dirty中有新数据，需要从m.dirty查找，这个时候需要加锁
	if !ok && read.amended {
		m.mu.Lock()
		// 双检查，避免加锁的时候m.dirty提升为m.read,这个时候m.read可能被替换了。
		read, _ = m.read.Load().(readOnly)
		e, ok = read.m[key]
		// 如果m.read中还是不存在，并且m.dirty中有新数据
		if !ok && read.amended {
			// 从m.dirty查找
			e, ok = m.dirty[key]
			// 不管m.dirty中存不存在，都将misses计数加一
			// missLocked()中满足条件后就会提升m.dirty
			m.missLocked()
		}
		m.mu.Unlock()
	}
	if !ok {
		return nil, false
	}
	return e.load()
}
</code></pre>
<p>Load加载方法，提供一个键key,查找对应的值value,如果不存在，通过ok反映。这里的精髓是从m.read中加载，不存在的情况下，并且m.dirty中有新数据，加锁，然后从m.dirty中加载。另外一点是这里使用了双检查的处理，因为在下面的两个语句中，这两行语句并不是一个原子操作。</p>
<pre><code>if !ok && read.amended {
		m.mu.Lock()

</code></pre>
<p>虽然第一句执行的时候条件满足，但是在加锁之前，<code>m.dirty</code>可能被提升为<code>m.read</code>,所以加锁后还得再检查<code>m.read</code>，后续的方法中都使用了这个方法。如果我们查询的键值正好存在于<code>m.read</code>中，则无须加锁，直接返回，理论上性能优异。即使不存在于<code>m.read</code>中，经过miss几次之后，<code>m.dirty</code>会被提升为<code>m.read</code>，又会从<code>m.read</code>中查找。所以对于更新／增加较少，加载存在的key很多的场景,性能基本和无锁的map相差无几。</p>
<p>经过miss几次之后，<code>m.dirty</code>会被提升为<code>m.read</code>，那么<code>m.dirty</code>又是如何被提升的呢？重点在missLocked方法中。</p>
<pre><code>func (m *Map) missLocked() {
	m.misses++
	if m.misses < len(m.dirty) {
		return
	}
	m.read.Store(readOnly{m: m.dirty})
	m.dirty = nil
	m.misses = 0
}
</code></pre>
<p>最后三行代码就是提升<code>m.dirty</code>的，很简单的将<code>m.dirty</code>作为<code>readOnly</code>的<code>m</code>字段，原子更新<code>m.read</code>。提升后<code>m.dirty</code>、<code>m.misses</code>重置， 并且<code>m.read.amended</code>为false。</p>
<p>sync.Map的Store方法实现</p>
<pre><code>func (m *Map) Store(key, value interface{}) {
	// 如果m.read存在这个键，并且这个entry没有被标记删除，尝试直接存储。
	// 因为m.dirty也指向这个entry,所以m.dirty也保持最新的entry。
	read, _ := m.read.Load().(readOnly)
	if e, ok := read.m[key]; ok && e.tryStore(&value) {
		return
	}
	// 如果`m.read`不存在或者已经被标记删除
	m.mu.Lock()
	read, _ = m.read.Load().(readOnly)
	if e, ok := read.m[key]; ok {
		if e.unexpungeLocked() { //标记成未被删除
			m.dirty[key] = e //m.dirty中不存在这个键，所以加入m.dirty
		}
		e.storeLocked(&value) //更新
	} else if e, ok := m.dirty[key]; ok { // m.dirty存在这个键，更新
		e.storeLocked(&value)
	} else { //新键值
		if !read.amended { //m.dirty中没有新的数据，往m.dirty中增加第一个新键
			m.dirtyLocked() //从m.read中复制未删除的数据
			m.read.Store(readOnly{m: read.m, amended: true})
		}
		m.dirty[key] = newEntry(value) //将这个entry加入到m.dirty中
	}
	m.mu.Unlock()
}

func (m *Map) dirtyLocked() {
	if m.dirty != nil {
		return
	}
	read, _ := m.read.Load().(readOnly)
	m.dirty = make(map[interface{}]*entry, len(read.m))
	for k, e := range read.m {
		if !e.tryExpungeLocked() {
			m.dirty[k] = e
		}
	}
}

func (e *entry) tryExpungeLocked() (isExpunged bool) {
	p := atomic.LoadPointer(&e.p)
	for p == nil {
		// 将已经删除标记为nil的数据标记为expunged
		if atomic.CompareAndSwapPointer(&e.p, nil, expunged) {
			return true
		}
		p = atomic.LoadPointer(&e.p)
	}
	return p == expunged
}
</code></pre>
<p>Store方法是更新或者新增一个entry。以上操作都是先从操作<code>m.read</code>开始的，不满足条件再加锁，然后操作<code>m.dirty</code>。Store可能会在某种情况下(初始化或者<code>m.dirty</code>刚被提升后)从m.read中复制数据，如果这个时候m.read中数据量非常大，可能会影响性能。</p>
<p>sync.Map的Delete方法实现</p>
<pre><code>func (m *Map) Delete(key interface{}) {
	read, _ := m.read.Load().(readOnly)
	e, ok := read.m[key]
	if !ok && read.amended {
		m.mu.Lock()
		read, _ = m.read.Load().(readOnly)
		e, ok = read.m[key]
		if !ok && read.amended {
			delete(m.dirty, key)
		}
		m.mu.Unlock()
	}
	if ok {
		e.delete()
	}
}

func (e *entry) delete() (hadValue bool) {
	for {
		p := atomic.LoadPointer(&e.p)
		// 已标记为删除
		if p == nil || p == expunged {
			return false
		}
		// 原子操作，e.p标记为nil
		if atomic.CompareAndSwapPointer(&e.p, p, nil) {
			return true
		}
	}
}
</code></pre>
<p>Delete方法删除一个键值。和Store方法一样，删除操作还是从<code>m.read</code>中开始， 如果这个entry不存在于<code>m.read</code>中，并且<code>m.dirty</code>中有新数据，则加锁尝试从<code>m.dirty</code>中删除。注意，还是要双检查的。 从<code>m.dirty</code>中直接删除即可，就当它没存在过，但是如果是从<code>m.read</code>中删除，并不会直接删除，而是打标记而已。</p>
<p>sync.Map的Range方法实现</p>
<pre><code>func (m *Map) Range(f func(key, value interface{}) bool) {
	read, _ := m.read.Load().(readOnly)
	// 如果m.dirty中有新数据，则提升m.dirty,然后在遍历
	if read.amended {
		//提升m.dirty
		m.mu.Lock()
		read, _ = m.read.Load().(readOnly) //双检查
		if read.amended {
			read = readOnly{m: m.dirty}
			m.read.Store(read)
			m.dirty = nil
			m.misses = 0
		}
		m.mu.Unlock()
	}
	// 遍历, for range是安全的
	for k, e := range read.m {
		v, ok := e.load()
		if !ok {
			continue
		}
		if !f(k, v) {
			break
		}
	}
}
</code></pre>
<p>在Go语言中，<code>for ... range map</code>是内建的语言特性，所以没有办法使用<code>for range</code>遍历sync.Map, 于是变通的有了Range方法，通过回调的方式遍历。Range方法调用前可能会做一个m.dirty的提升，不过提升m.dirty不是一个耗时的操作。</p>
<p>sync.Map的LoadOrStore 方法实现</p>
<pre><code>func (m *Map) LoadOrStore(key, value interface{}) (actual interface{}, loaded bool) {
	read, _ := m.read.Load().(readOnly)
	if e, ok := read.m[key]; ok {
		actual, loaded, ok := e.tryLoadOrStore(value)
		if ok {
			return actual, loaded
		}
	}

	m.mu.Lock()
	read, _ = m.read.Load().(readOnly)
	if e, ok := read.m[key]; ok {
		if e.unexpungeLocked() {
			m.dirty[key] = e
		}
		actual, loaded, _ = e.tryLoadOrStore(value)
	} else if e, ok := m.dirty[key]; ok {
		actual, loaded, _ = e.tryLoadOrStore(value)
		m.missLocked()
	} else {
		if !read.amended {
			// 给dirty添加一个新key，
			// 标记只读为不完整
			m.dirtyLocked()
			m.read.Store(readOnly{m: read.m, amended: true})
		}
		m.dirty[key] = newEntry(value)
		actual, loaded = value, false
	}
	m.mu.Unlock()

	return actual, loaded
}

func (e *entry) tryLoadOrStore(i interface{}) (actual interface{}, loaded, ok bool) {
	p := atomic.LoadPointer(&e.p)
	if p == expunged {
		return nil, false, false
	}
	if p != nil {
		return *(*interface{})(p), true, true
	}
	ic := i
	for {
		if atomic.CompareAndSwapPointer(&e.p, nil, unsafe.Pointer(&ic)) {
			return i, false, true
		}
		p = atomic.LoadPointer(&e.p)
		if p == expunged {
			return nil, false, false
		}
		if p != nil {
			return *(*interface{})(p), true, true
		}
	}
}
</code></pre>
<p>LoadOrStore方法如果提供的key存在，则返回已存在的值(Load)，否则保存提供的键值(Store)。同样是从<code>m.read</code>开始，然后是<code>m.dirty</code>，最后还有双检查机制。</p>
<p>Go 1.9源代码中提供了性能的测试： <a href="https://github.com/golang/go/blob/master/src/sync/map_bench_test.go">map_bench_test.go</a>、<a href="https://github.com/golang/go/blob/master/src/sync/map_reference_test.go">map_reference_test.go</a>，和以前的解决方案比较，性能会有不少的提升。</p>
<p>最后sync.Map没有Len方法，并且目前没有迹象要加上 (<a href="https://github.com/golang/go/issues/20680">issue#20680</a>),所以如果想得到当前Map中有效的entries的数量，需要使用Range方法遍历一次。</p>
						<hr>
						<div>
								<p class="text-center" style="color:red">有疑问加站长微信联系（非本文作者）</p>
								<img alt="" src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" class="img-responsive center-block">
						