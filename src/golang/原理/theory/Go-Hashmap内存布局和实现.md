---
title: Go Hashmap内存布局和实现
source_url: 'https://studygolang.com/articles/11979'
category: Go原理教程
---


						<div class="post-body" itemprop="articleBody">
<p>想了解Go内置类型的内存布局的契机，是一次在调试“不同类型的小对象频繁创建对gc性能的影响”时发现map的gc性能不佳，而作为对比的包含slice的struct却很好。这里总结Go runtime里map的实现，可以解释这个问题。</p>
<h2 id="hash-table内部结构"><a href="#hash-table内部结构" class="headerlink" title="hash table内部结构"></a>hash table内部结构</h2><p>Go的map就是hashmap，源码在src/runtime/hashmap.go。对比C++用红黑树实现的map，Go的map是unordered map，即无法对key值排序遍历。跟传统的hashmap的实现方法一样，它通过一个buckets数组实现，所有元素被hash到数组的bucket中，<strong>buckets</strong>就是指向了这个内存连续分配的数组。<strong>B</strong>字段说明hash表大小是2的指数，即<code>2^B</code>。每次扩容会增加到上次大小的两倍，即<code>2^(B+1)</code>。当bucket填满后，将通过<strong>overflow</strong>指针来<code>mallocgc</code>一个bucket出来形成链表，也就是为哈希表解决冲突问题。</p>

<pre><code class="language-go">
// A header for a Go map.
type hmap struct {
	count int // len()返回的map的大小 即有多少kv对
	flags uint8
	B     uint8  // 表示hash table总共有2^B个buckets 
	hash0 uint32 // hash seed
	buckets    unsafe.Pointer // 按照low hash值可查找的连续分配的数组，初始时为16个Buckets.
	oldbuckets unsafe.Pointer 
	nevacuate  uintptr      
	overflow *[2]*[]*bmap //溢出链 当初始buckets都满了之后会使用overflow
}
</code></pre>

<pre><code class="language-go">
// A bucket for a Go map.
type bmap struct {
	tophash [bucketCnt]uint8
	// Followed by bucketCnt keys and then bucketCnt values.
	// NOTE: packing all the keys together and then all the values together makes the
	// code a bit more complicated than alternating key/value/key/value/... but it allows
	// us to eliminate padding which would be needed for, e.g., map[int64]int8.
	// Followed by an overflow pointer.
}
</code></pre>

<p>上图是一个bucket的数据结构，tophash是个大小为8(bucketCnt)的数组，存储了8个key的hash值的高八位值，在对key/value对增删查的时候，先比较key的hash值高八位是否相等，然后再比较具体的key值。根据官方注释在tophash数组之后跟着8个key/value对，每一对都对应tophash当中的一条记录。最后bucket中还包含指向链表下一个bucket的指针。内存布局如下图。</p>
<p><img src="https://ninokop.github.io/2017/10/24/Go-Hashmap%E5%86%85%E5%AD%98%E5%B8%83%E5%B1%80%E5%92%8C%E5%AE%9E%E7%8E%B0/hashmap.png" style="zoom:40%"/></p>
<blockquote>
<p>之所以把所有k1k2放一起而不是k1v1是因为key和value的数据类型内存大小可能差距很大，比如map[int64]int8，考虑到字节对齐，kv存在一��会浪费很多空间。</p>
</blockquote>
<h2 id="map相关操作"><a href="#map相关操作" class="headerlink" title="map相关操作"></a>map相关操作</h2><h3 id="map初始化"><a href="#map初始化" class="headerlink" title="map初始化"></a>map初始化</h3><p>B的初始大小是0，若指定了map的大小hint且hint大于8，那么buckets会在make时就通过newarray分配好，否则buckets会在第一次put的时候分配。随着hashmap中key/value对的增多，buckets需要重新分配，每一次都要<strong>重新hash并进行元素拷贝</strong>。所以最好在初始化时就给map指定一个合适的大小。</p>
<blockquote>
<p>makemap有h和bucket这两个参数，是留给编译器的。如果编译器决定hmap结构体和第一个bucket可以在栈上创建，这两个入参可能不是nil的。</p>
</blockquote>

<pre><code class="language-go">
// makemap implemments a Go map creation make(map[k]v, hint)
func makemap(t *maptype, hint int64, h *hmap, bucket unsafe.Pointer) *hmap{
  B := uint8(0)
  for ; hint > bucketCnt && float32(hint) > loadFactor*float32(uintptr(1)<&ltB); B++ {
  }
  // 确定初始B的初始值 这里hint是指kv对的数目 而每个buckets中可以保存8个kv对
  // 因此上式是要找到满足不等式 hint > loadFactor*(2^B) 最小的B
  if B != 0 {
    buckets = newarray(t.bucket, uintptr(1)<<B)
  }
  h = (*hmap)(newobject(t.hmap))
  return h
}
</code></pre>

<h3 id="map存值"><a href="#map存值" class="headerlink" title="map存值"></a>map存值</h3><p>存储的步骤和第一部分的分析一致。首先用key的hash值低8位找到bucket，然后在bucket内部比对tophash和高8位与其对应的key值与入参key是否相等，若找到则更新这个值。若key不存在，则key优先存入在查找的过程中遇到的空的tophash数组位置。若当前的bucket已满则需要另外分配空间给这个key，新分配的bucket将挂在overflow链表后。</p>

<pre><code class="language-go">
func mapassign1(t *maptype, h *hmap, key unsafe.Pointer, val unsafe.Pointer) {
  hash := alg.hash(key, uintptr(h.hash0))
  if h.buckets == nil {
    h.buckets = newarray(t.bucket, 1)
  }
again:
  //根据低8位hash值找到对应的buckets
  bucket := hash & (uintptr(1)<<h.B - 1)
  b := (bmap)(unsafe.Pointer(uintptr(h.buckets) + bucketuintptr(t.bucketsize)))
  //计算hash值的高8位
  top := uint8(hash >> (sys.PtrSize*8 - 8))
  for {
    //遍历每一个bucket 对比所有tophash是否与top相等
    //若找到空tophash位置则标记为可插入位置
    for i := uintptr(0); i < bucketCnt; i++ {
      if b.tophash[i] != top {
        if b.tophash[i] == empty && inserti == nil {
          inserti = &b.tophash[i]
        } 
        continue
      }
      //当前tophash对应的key位置可以根据bucket的偏移量找到
      k2 := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))
      if !alg.equal(key, k2) {
        continue
      }
      //找到符合tophash对应的key位置
      typedmemmove(t.elem, v2, val)
      goto done
    }
    //若overflow为空则break
    ovf := b.overflow(t)
  }
  // did not find mapping for key.  Allocate new cell & add entry.
  if float32(h.count) >= loadFactor*float32((uintptr(1)<<h.B)) && h.count >= bucketCnt {
    hashGrow(t, h)
    goto again // Growing the table invalidates everything, so try again
  }
  // all current buckets are full, allocate a new one.
  if inserti == nil {
    newb := (*bmap)(newobject(t.bucket))
    h.setoverflow(t, b, newb)
    inserti = &newb.tophash[0]
  }
  // store new key/value at insert position
  kmem := newobject(t.key)
  vmem := newobject(t.elem)
  typedmemmove(t.key, insertk, key) 
  typedmemmove(t.elem, insertv, val)
  *inserti = top
  h.count++
}
</code></pre>

<h2 id="hash-Grow扩容和迁移"><a href="#hash-Grow扩容和迁移" class="headerlink" title="hash Grow扩容和迁移"></a>hash Grow扩容和迁移</h2><p>在往map中存值时若所有的bucket已满，需要在堆中new新的空间时需要计算是否需要扩容。扩容的时机是count > loadFactor(2^B)。这里的loadfactor选择为6.5。<strong>扩容时机的物理意义的理解</strong> 在没有溢出时hashmap总共可以存储8(2^B)个KV对，当hashmap已经存储到6.5(2^B)个KV对时表示hashmap已经趋于溢出，即很有可能在存值时用到overflow链表，这样会增加hitprobe和missprobe。为了使hashmap保持读取和超找的高性能，在hashmap快满时需要在新分配的bucket中重新hash元素并拷贝，源码中称之为evacuate。</p>
<blockquote>
<p>overflow溢出率是指平均一个bucket有多少个kv的时候会溢出。bytes/entry是指平均存一个kv需要额外存储多少字节的数据。hitprobe是指找到一个存在的key平均需要找多少次。missprobe是指找到一个不存在的key平均需要找多少次。选取6.5是为了平衡这组数据。</p>
</blockquote>
<table>
<thead>
<tr>
<th style="text-align:center">loadFactor</th>
<th style="text-align:center">%overflow</th>
<th style="text-align:center">bytes/entry</th>
<th style="text-align:center">hitprobe</th>
<th style="text-align:center">missprobe</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center">4.00</td>
<td style="text-align:center">2.13</td>
<td style="text-align:center">20.77</td>
<td style="text-align:center">3.00</td>
<td style="text-align:center">4.00</td>
</tr>
<tr>
<td style="text-align:center">4.50</td>
<td style="text-align:center">4.05</td>
<td style="text-align:center">17.30</td>
<td style="text-align:center">3.25</td>
<td style="text-align:center">4.50</td>
</tr>
<tr>
<td style="text-align:center">5.00</td>
<td style="text-align:center">6.85</td>
<td style="text-align:center">14.77</td>
<td style="text-align:center">3.50</td>
<td style="text-align:center">5.00</td>
</tr>
<tr>
<td style="text-align:center">5.50</td>
<td style="text-align:center">10.55</td>
<td style="text-align:center">12.94</td>
<td style="text-align:center">3.75</td>
<td style="text-align:center">5.50</td>
</tr>
<tr>
<td style="text-align:center">6.00</td>
<td style="text-align:center">15.27</td>
<td style="text-align:center">11.67</td>
<td style="text-align:center">4.00</td>
<td style="text-align:center">6.00</td>
</tr>
<tr>
<td style="text-align:center">6.50</td>
<td style="text-align:center">20.90</td>
<td style="text-align:center">10.79</td>
<td style="text-align:center">4.25</td>
<td style="text-align:center">6.50</td>
</tr>
<tr>
<td style="text-align:center">7.00</td>
<td style="text-align:center">27.14</td>
<td style="text-align:center">10.15</td>
<td style="text-align:center">4.50</td>
<td style="text-align:center">7.00</td>
</tr>
<tr>
<td style="text-align:center">7.50</td>
<td style="text-align:center">34.03</td>
<td style="text-align:center">9.73</td>
<td style="text-align:center">4.75</td>
<td style="text-align:center">7.50</td>
</tr>
<tr>
<td style="text-align:center">8.00</td>
<td style="text-align:center">41.10</td>
<td style="text-align:center">9.40</td>
<td style="text-align:center">5.00</td>
<td style="text-align:center">8.00</td>
</tr>
</tbody>
</table>
<p>但这个迁移并没有在扩容之后一次性完成，而是逐步完成的，每一次insert或remove时迁移1到2个pair，即增量扩容。<a href="">增量扩容的原因</a> 主要是缩短map容器的响应时间。若hashmap很大扩容时很容易导致系统停顿无响应。增量扩容本质上就是将总的扩容时间分摊到了每一次hash操作上。由于这个工作是逐渐完成的，导致数据一部分在old table中一部分在new table中。old的bucket不会删除，只是加上一个已删除的标记。只有当所有的bucket都从old table里迁移后才会将其释放掉。</p>
