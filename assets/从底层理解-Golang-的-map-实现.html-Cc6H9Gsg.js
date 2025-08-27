import{_ as n}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,a as e,o as i}from"./app-DIJDtupu.js";const l={};function p(t,s){return i(),a("div",null,s[0]||(s[0]=[e(`<h2 id="定义" tabindex="-1"><a class="header-anchor" href="#定义"><span>定义</span></a></h2><p>golang 中的 <code>map</code> 就是常用的 <a href="https://link.juejin.im?target=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FHash_table" target="_blank" rel="noopener noreferrer">hashtable</a>，底层实现由 <code>hmap</code>，维护着若干个 <code>bucket</code> 数组，通常每个 <code>bucket</code> 保存着8组kv对，如果 超过8个(发生hash冲突时)，会在 <code>extra</code> 字段结构体中的 <code>overflow</code> ，使用链地址法一直扩展下去。 先看下 <code>hmap</code> 结构体：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>type hmap struct {</span></span>
<span class="line"><span>    count     int // 元素的个数</span></span>
<span class="line"><span>    flags     uint8 // 标记读写状态，主要是做竞态检测，避免并发读写</span></span>
<span class="line"><span>    B         uint8  // 可以容纳 2 ^ N 个bucket</span></span>
<span class="line"><span>    noverflow uint16 // 溢出的bucket个数</span></span>
<span class="line"><span>    hash0     uint32 // hash 因子</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    buckets    unsafe.Pointer // 指向数组buckets的指针</span></span>
<span class="line"><span>    oldbuckets unsafe.Pointer // growing 时保存原buckets的指针</span></span>
<span class="line"><span>    nevacuate  uintptr        // growing 时已迁移的个数</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    extra *mapextra</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>type mapextra struct {</span></span>
<span class="line"><span>	overflow    *[]*bmap</span></span>
<span class="line"><span>	oldoverflow *[]*bmap</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	nextOverflow *bmap</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>bucket</code> 的结构体：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>// A bucket for a Go map.</span></span>
<span class="line"><span>type bmap struct {</span></span>
<span class="line"><span>    // tophash generally contains the top byte of the hash value</span></span>
<span class="line"><span>    // for each key in this bucket. If tophash[0] &lt; minTopHash,</span></span>
<span class="line"><span>    // tophash[0] is a bucket evacuation state instead.</span></span>
<span class="line"><span>    tophash [bucketCnt]uint8    // 记录着每个key的高8个bits</span></span>
<span class="line"><span>    // Followed by bucketCnt keys and then bucketCnt elems.</span></span>
<span class="line"><span>    // NOTE: packing all the keys together and then all the elems together makes the</span></span>
<span class="line"><span>    // code a bit more complicated than alternating key/elem/key/elem/... but it allows</span></span>
<span class="line"><span>    // us to eliminate padding which would be needed for, e.g., map[int64]int8.</span></span>
<span class="line"><span>    // Followed by an overflow pointer.</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>其中 <code>kv</code> 对是按照 key0/key1/key2/...val0/val1/val2/... 的格式排列，虽然在保存上面会比key/value对更复杂一些，但是避免了因为cpu要求固定长度读取，字节对齐，造成的空间浪费。</p><h2 id="初始化-插入" tabindex="-1"><a class="header-anchor" href="#初始化-插入"><span>初始化 &amp;&amp; 插入</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	a := map[string]int{&quot;one&quot;: 1, &quot;two&quot;: 2, &quot;three&quot;: 3}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	_ = a[&quot;one&quot;]</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>初始化3个key/value的map</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>TEXT main.main(SB) /Users/such/gomodule/runtime/main.go</span></span>
<span class="line"><span>=&gt;      main.go:3       0x10565fb*      4881ec70010000          sub rsp, 0x170</span></span>
<span class="line"><span>        main.go:3       0x1056602       4889ac2468010000        mov qword ptr [rsp+0x168], rbp</span></span>
<span class="line"><span>        main.go:3       0x105660a       488dac2468010000        lea rbp, ptr [rsp+0x168]</span></span>
<span class="line"><span>        main.go:4       0x105664b       488b6d00                mov rbp, qword ptr [rbp]</span></span>
<span class="line"><span>        main.go:4       0x105666d       e8de9cfeff              call $runtime.fastrand</span></span>
<span class="line"><span>        main.go:4       0x1056672       488b442450              mov rax, qword ptr [rsp+0x50]</span></span>
<span class="line"><span>        main.go:4       0x1056677       8400                    test byte ptr [rax], al</span></span>
<span class="line"><span>        main.go:4       0x10566c6       48894c2410              mov qword ptr [rsp+0x10], rcx</span></span>
<span class="line"><span>        main.go:4       0x10566cb       4889442418              mov qword ptr [rsp+0x18], rax</span></span>
<span class="line"><span>        main.go:4       0x10566d0       e80b8efbff              call $runtime.mapassign_faststr</span></span>
<span class="line"><span>        main.go:4       0x1056726       48894c2410              mov qword ptr [rsp+0x10], rcx</span></span>
<span class="line"><span>        main.go:4       0x105672b       4889442418              mov qword ptr [rsp+0x18], rax</span></span>
<span class="line"><span>        main.go:4       0x1056730       e8ab8dfbff              call $runtime.mapassign_faststr</span></span>
<span class="line"><span>        main.go:4       0x1056786       4889442410              mov qword ptr [rsp+0x10], rax</span></span>
<span class="line"><span>        main.go:4       0x105678b       48894c2418              mov qword ptr [rsp+0x18], rcx</span></span>
<span class="line"><span>        main.go:4       0x1056790       e84b8dfbff              call $runtime.mapassign_faststr</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>(省略了部分) 可以看出来，声明时连续调用三次 <code>call $runtime.mapassign_faststr</code> 添加键值对</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func mapassign(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {</span></span>
<span class="line"><span>	if h == nil {</span></span>
<span class="line"><span>		panic(plainError(&quot;assignment to entry in nil map&quot;))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	if raceenabled {</span></span>
<span class="line"><span>		callerpc := getcallerpc()</span></span>
<span class="line"><span>		pc := funcPC(mapassign)</span></span>
<span class="line"><span>		racewritepc(unsafe.Pointer(h), callerpc, pc)</span></span>
<span class="line"><span>		raceReadObjectPC(t.key, key, callerpc, pc)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 看到这里，发现和之前 slice 声明时一样，都会做竞态检测</span></span>
<span class="line"><span>	if msanenabled {</span></span>
<span class="line"><span>		msanread(key, t.key.size)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	</span></span>
<span class="line"><span>	// 这里就是并发读写map时，panic的地方</span></span>
<span class="line"><span>	if h.flags&amp;hashWriting != 0 {</span></span>
<span class="line"><span>		throw(&quot;concurrent map writes&quot;)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// t 是 map 的类型，因此在编译时，可以确定key的类型，继而确定hash算法。</span></span>
<span class="line"><span>	alg := t.key.alg</span></span>
<span class="line"><span>	hash := alg.hash(key, uintptr(h.hash0))</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	// 设置flag为writing</span></span>
<span class="line"><span>	h.flags ^= hashWriting</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	if h.buckets == nil {</span></span>
<span class="line"><span>		h.buckets = newobject(t.bucket) // newarray(t.bucket, 1)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>again:  // 重新计算bucket的hash</span></span>
<span class="line"><span>	bucket := hash &amp; bucketMask(h.B)</span></span>
<span class="line"><span>	if h.growing() {</span></span>
<span class="line"><span>		growWork(t, h, bucket)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	b := (*bmap)(unsafe.Pointer(uintptr(h.buckets) + bucket*uintptr(t.bucketsize)))</span></span>
<span class="line"><span>	top := tophash(hash)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	var inserti *uint8</span></span>
<span class="line"><span>	var insertk unsafe.Pointer</span></span>
<span class="line"><span>	var elem unsafe.Pointer</span></span>
<span class="line"><span>bucketloop:</span></span>
<span class="line"><span>    // 遍历找到bucket</span></span>
<span class="line"><span>	for {</span></span>
<span class="line"><span>		for i := uintptr(0); i &lt; bucketCnt; i++ {</span></span>
<span class="line"><span>			if b.tophash[i] != top {</span></span>
<span class="line"><span>				if isEmpty(b.tophash[i]) &amp;&amp; inserti == nil {</span></span>
<span class="line"><span>					inserti = &amp;b.tophash[i]</span></span>
<span class="line"><span>					insertk = add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))</span></span>
<span class="line"><span>					elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))</span></span>
<span class="line"><span>				}</span></span>
<span class="line"><span>				if b.tophash[i] == emptyRest {</span></span>
<span class="line"><span>					break bucketloop</span></span>
<span class="line"><span>				}</span></span>
<span class="line"><span>				continue</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))</span></span>
<span class="line"><span>			if t.indirectkey() {</span></span>
<span class="line"><span>				k = *((*unsafe.Pointer)(k))</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			// equal 方法也是根据不同的数据类型，在编译时确定</span></span>
<span class="line"><span>			if !alg.equal(key, k) {</span></span>
<span class="line"><span>				continue</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			// map 中已经存在 key，修改 key 对应的 value</span></span>
<span class="line"><span>			if t.needkeyupdate() {</span></span>
<span class="line"><span>				typedmemmove(t.key, k, key)</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			elem = add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))</span></span>
<span class="line"><span>			goto done</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>		ovf := b.overflow(t)</span></span>
<span class="line"><span>		if ovf == nil {</span></span>
<span class="line"><span>			break</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>		b = ovf</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	// Did not find mapping for key. Allocate new cell &amp; add entry.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	// If we hit the max load factor or we have too many overflow buckets,</span></span>
<span class="line"><span>	// and we&#39;re not already in the middle of growing, start growing.</span></span>
<span class="line"><span>	if !h.growing() &amp;&amp; (overLoadFactor(h.count+1, h.B) || tooManyOverflowBuckets(h.noverflow, h.B)) {</span></span>
<span class="line"><span>		hashGrow(t, h)</span></span>
<span class="line"><span>		goto again // Growing the table invalidates everything, so try again</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	if inserti == nil </span></span>
<span class="line"><span>	    // 如果没有找到插入的node，即当前所有桶都已放满</span></span>
<span class="line"><span>		newb := h.newoverflow(t, b)</span></span>
<span class="line"><span>		inserti = &amp;newb.tophash[0]</span></span>
<span class="line"><span>		insertk = add(unsafe.Pointer(newb), dataOffset)</span></span>
<span class="line"><span>		elem = add(insertk, bucketCnt*uintptr(t.keysize))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>	// store new key/elem at insert position</span></span>
<span class="line"><span>	if t.indirectkey() {</span></span>
<span class="line"><span>		kmem := newobject(t.key)</span></span>
<span class="line"><span>		*(*unsafe.Pointer)(insertk) = kmem</span></span>
<span class="line"><span>		insertk = kmem</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	if t.indirectelem() {</span></span>
<span class="line"><span>		vmem := newobject(t.elem)</span></span>
<span class="line"><span>		*(*unsafe.Pointer)(elem) = vmem</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	typedmemmove(t.key, insertk, key)</span></span>
<span class="line"><span>	*inserti = top</span></span>
<span class="line"><span>	h.count++</span></span>
<span class="line"><span></span></span>
<span class="line"><span>done:</span></span>
<span class="line"><span>    // 再次检查（双重校验锁的思路）是否并发写</span></span>
<span class="line"><span>	if h.flags&amp;hashWriting == 0 {</span></span>
<span class="line"><span>		throw(&quot;concurrent map writes&quot;)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	h.flags &amp;^= hashWriting</span></span>
<span class="line"><span>	if t.indirectelem() {</span></span>
<span class="line"><span>		elem = *((*unsafe.Pointer)(elem))</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	return elem</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="查找" tabindex="-1"><a class="header-anchor" href="#查找"><span>查找</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>TEXT main.main(SB) /Users/such/gomodule/runtime/main.go</span></span>
<span class="line"><span>=&gt;      main.go:6       0x10567a9*      488d0550e10000          lea rax, ptr [rip+0xe150]</span></span>
<span class="line"><span>        main.go:6       0x10567c5       4889442410              mov qword ptr [rsp+0x10], rax</span></span>
<span class="line"><span>        main.go:6       0x10567ca       48c744241803000000      mov qword ptr [rsp+0x18], 0x3</span></span>
<span class="line"><span>        main.go:6       0x10567d3       e89885fbff              call $runtime.mapaccess1_faststr</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在 map 中找一个 key 的时候，runtime 调用了 <code>mapaccess1</code> 方法，和添加时很类似</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func mapaccess1(t *maptype, h *hmap, key unsafe.Pointer) unsafe.Pointer {</span></span>
<span class="line"><span>	if raceenabled &amp;&amp; h != nil {</span></span>
<span class="line"><span>		callerpc := getcallerpc()</span></span>
<span class="line"><span>		pc := funcPC(mapaccess1)</span></span>
<span class="line"><span>		racereadpc(unsafe.Pointer(h), callerpc, pc)</span></span>
<span class="line"><span>		raceReadObjectPC(t.key, key, callerpc, pc)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	if msanenabled &amp;&amp; h != nil {</span></span>
<span class="line"><span>		msanread(key, t.key.size)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	if h == nil || h.count == 0 {</span></span>
<span class="line"><span>		if t.hashMightPanic() {</span></span>
<span class="line"><span>			t.key.alg.hash(key, 0) // see issue 23734</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>		return unsafe.Pointer(&amp;zeroVal[0])</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	if h.flags&amp;hashWriting != 0 {</span></span>
<span class="line"><span>		throw(&quot;concurrent map read and map write&quot;)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	alg := t.key.alg</span></span>
<span class="line"><span>	hash := alg.hash(key, uintptr(h.hash0))</span></span>
<span class="line"><span>	m := bucketMask(h.B)</span></span>
<span class="line"><span>	b := (*bmap)(add(h.buckets, (hash&amp;m)*uintptr(t.bucketsize)))</span></span>
<span class="line"><span>	if c := h.oldbuckets; c != nil {</span></span>
<span class="line"><span>		if !h.sameSizeGrow() {</span></span>
<span class="line"><span>			// There used to be half as many buckets; mask down one more power of two.</span></span>
<span class="line"><span>			m &gt;&gt;= 1</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>		oldb := (*bmap)(add(c, (hash&amp;m)*uintptr(t.bucketsize)))</span></span>
<span class="line"><span>		if !evacuated(oldb) {</span></span>
<span class="line"><span>			b = oldb</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	top := tophash(hash)</span></span>
<span class="line"><span>bucketloop:</span></span>
<span class="line"><span>	for ; b != nil; b = b.overflow(t) {</span></span>
<span class="line"><span>		for i := uintptr(0); i &lt; bucketCnt; i++ {</span></span>
<span class="line"><span>			if b.tophash[i] != top {</span></span>
<span class="line"><span>				if b.tophash[i] == emptyRest {</span></span>
<span class="line"><span>					break bucketloop</span></span>
<span class="line"><span>				}</span></span>
<span class="line"><span>				continue</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			k := add(unsafe.Pointer(b), dataOffset+i*uintptr(t.keysize))</span></span>
<span class="line"><span>			if t.indirectkey() {</span></span>
<span class="line"><span>				k = *((*unsafe.Pointer)(k))</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			// 如果找到 key，就返回 key 指向的 value 指针的值，</span></span>
<span class="line"><span>			// 在计算 ptr 的时候，初始位置当前bmap, 偏移量 offset，是一个 bmap 结构体的大小，但对于amd64架构，</span></span>
<span class="line"><span>			// 还需要考虑字节对齐，即 8 字节对齐（dataOffset）+ 8个key的大小 + i (当前索引) 个value的大小</span></span>
<span class="line"><span>			if alg.equal(key, k) {</span></span>
<span class="line"><span>				e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))</span></span>
<span class="line"><span>				if t.indirectelem() {</span></span>
<span class="line"><span>					e = *((*unsafe.Pointer)(e))</span></span>
<span class="line"><span>				}</span></span>
<span class="line"><span>				return e</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	// 如果未找到的话，返回零对象的引用的指针</span></span>
<span class="line"><span>	return unsafe.Pointer(&amp;zeroVal[0])</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在 map 包里，还有个类似的方法， <code>mapaccess2</code> 在经过验证，在 <code>_, ok := a[&quot;one&quot;]</code> 一般用于判断key是否存在的写法时，是会用到。其实根据函数的返回值也可以看出。</p><h3 id="growing" tabindex="-1"><a class="header-anchor" href="#growing"><span>Growing</span></a></h3><p>和 slice 一样，在 map 的元素持续增长时，每个bucket极端情况下会有很多overflow，退化成链表，需要 rehash。一般扩容是在 <code>h.count &gt; loadFactor(2^B)</code>。 负载因子一般是：容量 / bucket数量，golang 的负载因子 loadFactorNum / loadFactorDen = 6.5，为什么不选择1呢，像 Redis 的 dictentry，只能保存一组键值对，golang的话，一个bucket正常情况下可以保存8组键值对； 那为什么选择6.5这个值呢，作者给出了一组数据。</p><p>loadFactor</p><p>%overflow</p><p>bytes/entry</p><p>hitprobe</p><p>missprobe</p><p>4.00</p><p>2.13</p><p>20.77</p><p>3.00</p><p>4.00</p><p>4.50</p><p>4.05</p><p>17.30</p><p>3.25</p><p>4.50</p><p>5.00</p><p>6.85</p><p>14.77</p><p>3.50</p><p>5.00</p><p>5.50</p><p>10.55</p><p>12.94</p><p>3.75</p><p>5.50</p><p>6.00</p><p>15.27</p><p>11.67</p><p>4.00</p><p>6.00</p><p>6.50</p><p>20.90</p><p>10.79</p><p>4.25</p><p>6.50</p><p>7.00</p><p>27.14</p><p>10.15</p><p>4.50</p><p>7.00</p><p>7.50</p><p>34.03</p><p>9.73</p><p>4.75</p><p>7.50</p><p>8.00</p><p>41.10</p><p>9.40</p><p>5.00</p><p>8.00</p><p>loadFactor：负载因子；<br> %overflow：溢出率，有溢出 bucket 的占比；<br> bytes/entry：每个 key/value 对占用字节比；<br> hitprobe：找到一个存在的key平均查找个数；<br> missprobe：找到一个不存在的key平均查找个数；</p><p>通常在负载因子 &gt; 6.5时，就是平均每个bucket存储的键值对 超过6.5个或者是overflow的数量 &gt; 2 ^ 15时会发生扩容（迁移）。它分为两种情况：<br> 第一种：由于map在不断的insert 和 delete 中，bucket中的键值存储不够均匀，内存利用率很低，需要进行迁移。（注：bucket数量不做增加）<br> 第二种：真正的，因为负载因子过大引起的扩容，bucket 增加为原 bucket 的两倍<br> 不论上述哪一种 rehash，都是调用 <code>hashGrow</code> 方法：</p><ol><li>定义原 hmap 中指向 buckets 数组的指针</li><li>创建 bucket 数组并设置为 hmap 的 bucket 字段</li><li>将 extra 中的 oldoverflow 指向 overflow，overflow 指向 nil</li><li>如果正在 growing 的话，开始渐进式的迁移，在 <code>growWork</code> 方法里是 bucket 中 key/value 的迁移</li><li>在全部迁移完成后，释放内存</li></ol><blockquote><p>注意： <strong>golang在rehash时，和Redis一样采用渐进式的rehash，没有一次性迁移所有的buckets，而是把key的迁移分摊到每次插入或删除时， 在 bucket 中的 key/value 全部迁移完成释放oldbucket和extra.oldoverflow（尽可能不去使用map存储大量数据；最好在初始化一次性声明cap，避免频繁扩容）</strong></p></blockquote><h2 id="删除" tabindex="-1"><a class="header-anchor" href="#删除"><span>删除</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func mapdelete(t *maptype, h *hmap, key unsafe.Pointer) {</span></span>
<span class="line"><span>...省略</span></span>
<span class="line"><span>search:</span></span>
<span class="line"><span>	for ; b != nil; b = b.overflow(t) {</span></span>
<span class="line"><span>		for i := uintptr(0); i &lt; bucketCnt; i++ {</span></span>
<span class="line"><span>			if t.indirectkey() {</span></span>
<span class="line"><span>				*(*unsafe.Pointer)(k) = nil</span></span>
<span class="line"><span>			} else if t.key.ptrdata != 0 {</span></span>
<span class="line"><span>				memclrHasPointers(k, t.key.size)</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			e := add(unsafe.Pointer(b), dataOffset+bucketCnt*uintptr(t.keysize)+i*uintptr(t.elemsize))</span></span>
<span class="line"><span>			if t.indirectelem() {</span></span>
<span class="line"><span>				*(*unsafe.Pointer)(e) = nil</span></span>
<span class="line"><span>			} else if t.elem.ptrdata != 0 {</span></span>
<span class="line"><span>				memclrHasPointers(e, t.elem.size)</span></span>
<span class="line"><span>			} else {</span></span>
<span class="line"><span>				memclrNoHeapPointers(e, t.elem.size)</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			</span></span>
<span class="line"><span>			b.tophash[i] = emptyOne</span></span>
<span class="line"><span>			</span></span>
<span class="line"><span>			if i == bucketCnt-1 {</span></span>
<span class="line"><span>				if b.overflow(t) != nil &amp;&amp; b.overflow(t).tophash[0] != emptyRest {</span></span>
<span class="line"><span>					goto notLast</span></span>
<span class="line"><span>				}</span></span>
<span class="line"><span>			} else {</span></span>
<span class="line"><span>				if b.tophash[i+1] != emptyRest {</span></span>
<span class="line"><span>					goto notLast</span></span>
<span class="line"><span>				}</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>			for {</span></span>
<span class="line"><span>				b.tophash[i] = emptyRest</span></span>
<span class="line"><span>				if i == 0 {</span></span>
<span class="line"><span>					if b == bOrig {</span></span>
<span class="line"><span>						break // beginning of initial bucket, we&#39;re done.</span></span>
<span class="line"><span>					}</span></span>
<span class="line"><span>					// Find previous bucket, continue at its last entry.</span></span>
<span class="line"><span>					c := b</span></span>
<span class="line"><span>					for b = bOrig; b.overflow(t) != c; b = b.overflow(t) {</span></span>
<span class="line"><span>					}</span></span>
<span class="line"><span>					i = bucketCnt - 1</span></span>
<span class="line"><span>				} else {</span></span>
<span class="line"><span>					i--</span></span>
<span class="line"><span>				}</span></span>
<span class="line"><span>				if b.tophash[i] != emptyOne {</span></span>
<span class="line"><span>					break</span></span>
<span class="line"><span>				}</span></span>
<span class="line"><span>			}</span></span>
<span class="line"><span>		notLast:</span></span>
<span class="line"><span>			h.count--</span></span>
<span class="line"><span>			break search</span></span>
<span class="line"><span>		}</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>    ...</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>key 和value，如果是值类型的话，直接设置为nil, 如果是指针的话，就从 ptr 位置开始清除 n 个bytes; 接着在删除时，只是在tophash对应的位置上，设置为 empty 的标记（<code>b.tophash[i] = emptyOne</code>），没有真正的释放内存空间，因为频繁的申请、释放内存空间开销很大，如果真正想释放的话，只有依赖GC； 如果bucket是以一些 emptyOne 的标记结束，最终，就设置为 emptyRest 标记，emptyOne 和 emptyRest 都是空的标记，emptyRest的区别就是：标记在 高索引位 和 overflow bucket 都是空的， 应该是考虑在之后重用时，插入和删除操作需要查找位置时，减少查找次数。</p><h3 id="建议" tabindex="-1"><a class="header-anchor" href="#建议"><span>建议</span></a></h3><p>做两组试验，第一组是：提前分配好 map 的总容量后追加k/v；另一组是：初始化 0 容量的 map 后做追加</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>import &quot;testing&quot;</span></span>
<span class="line"><span>var count int = 100000</span></span>
<span class="line"><span>func addition(m map[int]int) map[int]int {</span></span>
<span class="line"><span>	for i := 0; i &lt; count; i++ {</span></span>
<span class="line"><span>		m[i] = i</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	return m</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>func BenchmarkGrows(b *testing.B) {</span></span>
<span class="line"><span>	b.ResetTimer()</span></span>
<span class="line"><span>	for i := 0; i &lt; b.N; i++ {</span></span>
<span class="line"><span>		m := make(map[int]int)</span></span>
<span class="line"><span>		addition(m)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>func BenchmarkNoGrows(b *testing.B) {</span></span>
<span class="line"><span>	b.ResetTimer()</span></span>
<span class="line"><span>	for i := 0; i &lt; b.N; i++ {</span></span>
<span class="line"><span>		m := make(map[int]int, count)</span></span>
<span class="line"><span>		addition(m)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>$ go test -bench=. ./</span></span>
<span class="line"><span>goos: darwin</span></span>
<span class="line"><span>goarch: amd64</span></span>
<span class="line"><span># benchmark名字 -CPU数       执行次数      平均执行时间ns</span></span>
<span class="line"><span>BenchmarkGrows-4             200           8298505 ns/op</span></span>
<span class="line"><span>BenchmarkNoGrows-4           300           4627118 ns/op</span></span>
<span class="line"><span>PASS</span></span>
<span class="line"><span>ok      _/Users/such/gomodule/runtime   4.401s</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>提前定义容量的case平均执行时间比未定义容量的快了80% --- <strong>扩容时的数据拷贝和重新哈希成本很高！</strong><br> 再看看内存的分配次数：</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>$ go test -bench=. -benchmem ./</span></span>
<span class="line"><span>goos: darwin</span></span>
<span class="line"><span>goarch: amd64</span></span>
<span class="line"><span># benchmark名字 -CPU数       执行次数      平均执行时间ns         每次分配内存大小        每次内存分配次数</span></span>
<span class="line"><span>BenchmarkGrows-4             200           9265553 ns/op         5768155 B/op       4010 allocs/op</span></span>
<span class="line"><span>BenchmarkNoGrows-4           300           4855000 ns/op         2829115 B/op       1678 allocs/op</span></span>
<span class="line"><span>PASS</span></span>
<span class="line"><span>ok      _/Users/such/gomodule/runtime   4.704s</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>两个方法执行相同的次数，GC的次数也会多出一倍</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func main() {</span></span>
<span class="line"><span>	for i := 0; i &lt; 5; i++ {</span></span>
<span class="line"><span>		n := make(map[int]int, count)</span></span>
<span class="line"><span>		addition(n)</span></span>
<span class="line"><span>		//m := make(map[int]int)</span></span>
<span class="line"><span>		//addition(m)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>// 第一组，预分配</span></span>
<span class="line"><span>$ go build -o growth &amp;&amp; GODEBUG=gctrace=1 ./growth</span></span>
<span class="line"><span>gc 1 @0.006s 0%: 0.002+0.091+0.015 ms clock, 0.011+0.033/0.011/0.088+0.060 ms cpu, 5-&gt;5-&gt;2 MB, 6 MB goal, 4 P</span></span>
<span class="line"><span>gc 2 @0.012s 0%: 0.001+0.041+0.002 ms clock, 0.007+0.032/0.007/0.033+0.009 ms cpu, 5-&gt;5-&gt;2 MB, 6 MB goal, 4 P</span></span>
<span class="line"><span>gc 3 @0.017s 0%: 0.002+0.090+0.010 ms clock, 0.008+0.035/0.006/0.084+0.041 ms cpu, 5-&gt;5-&gt;2 MB, 6 MB goal, 4 P</span></span>
<span class="line"><span>gc 4 @0.022s 0%: 0.001+0.056+0.008 ms clock, 0.007+0.026/0.003/0.041+0.034 ms cpu, 5-&gt;5-&gt;2 MB, 6 MB goal, 4 P</span></span>
<span class="line"><span></span></span>
<span class="line"><span>// 第二组，未分配</span></span>
<span class="line"><span>$ go build -o growth &amp;&amp; GODEBUG=gctrace=1 ./growth</span></span>
<span class="line"><span>gc 1 @0.005s 0%: 0.001+0.10+0.001 ms clock, 0.007+0.076/0.004/0.13+0.007 ms cpu, 5-&gt;5-&gt;3 MB, 6 MB goal, 4 P</span></span>
<span class="line"><span>gc 2 @0.012s 0%: 0.002+0.071+0.010 ms clock, 0.008+0.016/0.010/0.075+0.040 ms cpu, 5-&gt;5-&gt;0 MB, 7 MB goal, 4 P</span></span>
<span class="line"><span>gc 3 @0.015s 0%: 0.001+0.13+0.009 ms clock, 0.007+0.006/0.037/0.082+0.036 ms cpu, 4-&gt;5-&gt;3 MB, 5 MB goal, 4 P</span></span>
<span class="line"><span>gc 4 @0.021s 0%: 0.001+0.13+0.009 ms clock, 0.007+0.040/0.007/0.058+0.038 ms cpu, 6-&gt;6-&gt;1 MB, 7 MB goal, 4 P</span></span>
<span class="line"><span>gc 5 @0.024s 0%: 0.001+0.084+0.001 ms clock, 0.005+0.036/0.006/0.052+0.006 ms cpu, 4-&gt;4-&gt;3 MB, 5 MB goal, 4 P</span></span>
<span class="line"><span>gc 6 @0.030s 0%: 0.002+0.075+0.001 ms clock, 0.008+0.056/0.004/0.072+0.007 ms cpu, 6-&gt;6-&gt;1 MB, 7 MB goal, 4 P</span></span>
<span class="line"><span>gc 7 @0.033s 0%: 0.013+0.11+0.003 ms clock, 0.053+0.047/0.013/0.075+0.012 ms cpu, 4-&gt;4-&gt;3 MB, 5 MB goal, 4 P</span></span>
<span class="line"><span>gc 8 @0.041s 0%: 0.002+0.073+0.024 ms clock, 0.008+0.033/0.010/0.067+0.097 ms cpu, 6-&gt;6-&gt;1 MB, 7 MB goal, 4 P</span></span>
<span class="line"><span>gc 9 @0.043s 0%: 0.001+0.067+0.001 ms clock, 0.006+0.046/0.003/0.070+0.006 ms cpu, 4-&gt;4-&gt;3 MB, 5 MB goal, 4 P</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>有个1千万kv的 map，测试在什么情况下会回收内存</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>package main</span></span>
<span class="line"><span></span></span>
<span class="line"><span>var count = 10000000</span></span>
<span class="line"><span>var dict = make(map[int]int, count)</span></span>
<span class="line"><span>func addition() {</span></span>
<span class="line"><span>	for i := 0; i &lt; count; i++ {</span></span>
<span class="line"><span>		dict[i] = i</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>func clear() {</span></span>
<span class="line"><span>	for k := range dict {</span></span>
<span class="line"><span>		delete(dict, k)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	//dict = nil</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>func main() {</span></span>
<span class="line"><span>	addition()</span></span>
<span class="line"><span>	clear()</span></span>
<span class="line"><span>	debug.FreeOSMemory()</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>$ go build -o clear &amp;&amp; GODEBUG=gctrace=1 ./clear</span></span>
<span class="line"><span>gc 1 @0.007s 0%: 0.006+0.12+0.015 ms clock, 0.025+0.037/0.038/0.12+0.061 ms cpu, 306-&gt;306-&gt;306 MB, 307 MB goal, 4 P</span></span>
<span class="line"><span>gc 2 @0.963s 0%: 0.004+1.0+0.025 ms clock, 0.017+0/0.96/0.48+0.10 ms cpu, 307-&gt;307-&gt;306 MB, 612 MB goal, 4 P</span></span>
<span class="line"><span>gc 3 @1.381s 0%: 0.004+0.081+0.003 ms clock, 0.018+0/0.051/0.086+0.013 ms cpu, 309-&gt;309-&gt;306 MB, 612 MB goal, 4 P (forced)</span></span>
<span class="line"><span>scvg-1: 14 MB released</span></span>
<span class="line"><span>scvg-1: inuse: 306, idle: 77, sys: 383, released: 77, consumed: 306 (MB)</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>删除了所有kv，堆大小（goal）并无变化</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" data-title="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span>func clear() {</span></span>
<span class="line"><span>	for k := range dict {</span></span>
<span class="line"><span>		delete(dict, k)</span></span>
<span class="line"><span>	}</span></span>
<span class="line"><span>	dict = nil</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>$ go build -o clear &amp;&amp; GODEBUG=gctrace=1 ./clear</span></span>
<span class="line"><span>gc 1 @0.006s 0%: 0.004+0.12+0.010 ms clock, 0.019+0.035/0.016/0.17+0.043 ms cpu, 306-&gt;306-&gt;306 MB, 307 MB goal, 4 P</span></span>
<span class="line"><span>gc 2 @0.942s 0%: 0.003+1.0+0.010 ms clock, 0.012+0/0.85/0.54+0.043 ms cpu, 307-&gt;307-&gt;306 MB, 612 MB goal, 4 P</span></span>
<span class="line"><span>gc 3 @1.321s 0%: 0.003+0.072+0.002 ms clock, 0.013+0/0.050/0.090+0.010 ms cpu, 309-&gt;309-&gt;0 MB, 612 MB goal, 4 P (forced)</span></span>
<span class="line"><span>scvg-1: 319 MB released</span></span>
<span class="line"><span>scvg-1: inuse: 0, idle: 383, sys: 383, released: 383, consumed: 0 (MB)</span></span>
<span class="line"><span>复制代码</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>清除过后，设置为nil，才会真正释放内存。（本身每2分钟强制 runtime.GC()，每5分钟 scavenge 释放内存，其实不必太过纠结是否真正释放，未真正释放也是为了后面有可能的重用， <strong>但有时需要真实释放时，清楚怎么做才能解决问题</strong>）</p><p><strong>Reference</strong></p><blockquote><p>Map：<a href="https://link.juejin.im?target=https%3A%2F%2Fgolang.org%2Fsrc%2Fruntime%2Fmap.go%3Fh%3Dhmap%23L115" target="_blank" rel="noopener noreferrer">golang.org/src/runtime…</a> Benchmark：<a href="https://link.juejin.im?target=https%3A%2F%2Fdave.cheney.net%2F2013%2F06%2F30%2Fhow-to-write-benchmarks-in-go" target="_blank" rel="noopener noreferrer">dave.cheney.net/2013/06/30/…</a><br> Gctrace：<a href="https://link.juejin.im?target=https%3A%2F%2Fdave.cheney.net%2Ftag%2Fgodebug" target="_blank" rel="noopener noreferrer">dave.cheney.net/tag/godebug</a><br> FreeOsMemory：<a href="https://link.juejin.im?target=https%3A%2F%2Fgolang.org%2Fpkg%2Fruntime%2Fdebug%2F%23FreeOSMemory" target="_blank" rel="noopener noreferrer">golang.org/pkg/runtime…</a></p></blockquote><hr><p>有疑问加站长微信联系（非本文作者）</p><figure><img src="https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>`,94)]))}const r=n(l,[["render",p],["__file","从底层理解-Golang-的-map-实现.html.vue"]]),v=JSON.parse('{"path":"/golang/%E5%8E%9F%E7%90%86/theory/%E4%BB%8E%E5%BA%95%E5%B1%82%E7%90%86%E8%A7%A3-Golang-%E7%9A%84-map-%E5%AE%9E%E7%8E%B0.html","title":"从底层理解 Golang 的 map 实现","lang":"zh-CN","frontmatter":{"title":"从底层理解 Golang 的 map 实现","source_url":"https://studygolang.com/articles/23404","category":"Go原理教程","description":"定义 golang 中的 map 就是常用的 hashtable，底层实现由 hmap，维护着若干个 bucket 数组，通常每个 bucket 保存着8组kv对，如果 超过8个(发生hash冲突时)，会在 extra 字段结构体中的 overflow ，使用链地址法一直扩展下去。 先看下 hmap 结构体： bucket 的结构体： 其中 kv 对是...","head":[["meta",{"property":"og:url","content":"https://Cospk.github.io/vuepress-app/golang/%E5%8E%9F%E7%90%86/theory/%E4%BB%8E%E5%BA%95%E5%B1%82%E7%90%86%E8%A7%A3-Golang-%E7%9A%84-map-%E5%AE%9E%E7%8E%B0.html"}],["meta",{"property":"og:site_name","content":"Golang全栈指南"}],["meta",{"property":"og:title","content":"从底层理解 Golang 的 map 实现"}],["meta",{"property":"og:description","content":"定义 golang 中的 map 就是常用的 hashtable，底层实现由 hmap，维护着若干个 bucket 数组，通常每个 bucket 保存着8组kv对，如果 超过8个(发生hash冲突时)，会在 extra 字段结构体中的 overflow ，使用链地址法一直扩展下去。 先看下 hmap 结构体： bucket 的结构体： 其中 kv 对是..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-08-27T12:02:38.000Z"}],["meta",{"property":"article:modified_time","content":"2025-08-27T12:02:38.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"从底层理解 Golang 的 map 实现\\",\\"image\\":[\\"https://static.golangjob.cn/static/img/footer.png?imageView2/2/w/280\\"],\\"dateModified\\":\\"2025-08-27T12:02:38.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"Cospk\\",\\"url\\":\\"https://savvygo.cn\\"}]}"]]},"headers":[{"level":2,"title":"定义","slug":"定义","link":"#定义","children":[]},{"level":2,"title":"初始化 && 插入","slug":"初始化-插入","link":"#初始化-插入","children":[]},{"level":2,"title":"查找","slug":"查找","link":"#查找","children":[{"level":3,"title":"Growing","slug":"growing","link":"#growing","children":[]}]},{"level":2,"title":"删除","slug":"删除","link":"#删除","children":[{"level":3,"title":"建议","slug":"建议","link":"#建议","children":[]}]}],"git":{"createdTime":1756202807000,"updatedTime":1756296158000,"contributors":[{"name":"shiwei","username":"shiwei","email":"xie@gmail.com","commits":2,"url":"https://github.com/shiwei"}]},"readingTime":{"minutes":11.68,"words":3503},"filePathRelative":"golang/原理/theory/从底层理解-Golang-的-map-实现.md","localizedDate":"2025年8月26日","autoDesc":true,"excerpt":"<h2>定义</h2>\\n<p>golang 中的 <code>map</code> 就是常用的 <a href=\\"https://link.juejin.im?target=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FHash_table\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\">hashtable</a>，底层实现由 <code>hmap</code>，维护着若干个 <code>bucket</code> 数组，通常每个 <code>bucket</code> 保存着8组kv对，如果 超过8个(发生hash冲突时)，会在 <code>extra</code> 字段结构体中的 <code>overflow</code> ，使用链地址法一直扩展下去。 先看下 <code>hmap</code> 结构体：</p>"}');export{r as comp,v as data};
