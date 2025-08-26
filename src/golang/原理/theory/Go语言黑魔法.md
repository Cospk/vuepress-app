---
title: Go语言黑魔法
source_url: 'https://studygolang.com/articles/2909'
category: Go原理教程
---

<pre><code class="language-go"><span class="kn">package</span> <span class="nx">labs28</span>

<span class="kn">import</span> <span class="s">"testing"</span>
<span class="kn">import</span> <span class="s">"unsafe"</span>

<span class="kd">func</span> <span class="nx">Test_ByteString</span><span class="p">(</span><span class="nx">t</span> <span class="o">*</span><span class="nx">testing</span><span class="p">.</span><span class="nx">T</span><span class="p">)</span> <span class="p">{</span>
	<span class="kd">var</span> <span class="nx">x</span> <span class="p">=</span> <span class="p">[]</span><span class="nb">byte</span><span class="p">(</span><span class="s">"Hello World!"</span><span class="p">)</span>
	<span class="kd">var</span> <span class="nx">y</span> <span class="p">=</span> <span class="o">*</span><span class="p">(</span><span class="o">*</span><span class="kt">string</span><span class="p">)(</span><span class="nx">unsafe</span><span class="p">.</span><span class="nx">Pointer</span><span class="p">(</span><span class="o">&</span><span class="nx">x</span><span class="p">))</span>
	<span class="kd">var</span> <span class="nx">z</span> <span class="p">=</span> <span class="nb">string</span><span class="p">(</span><span class="nx">x</span><span class="p">)</span>

	<span class="k">if</span> <span class="nx">y</span> <span class="o">!=</span> <span class="nx">z</span> <span class="p">{</span>
		<span class="nx">t</span><span class="p">.</span><span class="nx">Fail</span><span class="p">()</span>
	<span class="p">}</span>
<span class="p">}</span>

<span class="kd">func</span> <span class="nx">Benchmark_Normal</span><span class="p">(</span><span class="nx">b</span> <span class="o">*</span><span class="nx">testing</span><span class="p">.</span><span class="nx">B</span><span class="p">)</span> <span class="p">{</span>
	<span class="kd">var</span> <span class="nx">x</span> <span class="p">=</span> <span class="p">[]</span><span class="nb">byte</span><span class="p">(</span><span class="s">"Hello World!"</span><span class="p">)</span>
	<span class="k">for</span> <span class="nx">i</span> <span class="o">:=</span> <span class="mi">0</span><span class="p">;</span> <span class="nx">i</span> <span class="p"><</span> <span class="nx">b</span><span class="p">.</span><span class="nx">N</span><span class="p">;</span> <span class="nx">i</span> <span class="o">++</span> <span class="p">{</span>
		<span class="nx">_</span> <span class="p">=</span> <span class="nb">string</span><span class="p">(</span><span class="nx">x</span><span class="p">)</span>
	<span class="p">}</span>
<span class="p">}</span>

<span class="kd">func</span> <span class="nx">Benchmark_ByteString</span><span class="p">(</span><span class="nx">b</span> <span class="o">*</span><span class="nx">testing</span><span class="p">.</span><span class="nx">B</span><span class="p">)</span> <span class="p">{</span>
	<span class="kd">var</span> <span class="nx">x</span> <span class="p">=</span> <span class="p">[]</span><span class="nb">byte</span><span class="p">(</span><span class="s">"Hello World!"</span><span class="p">)</span>
	<span class="k">for</span> <span class="nx">i</span> <span class="o">:=</span> <span class="mi">0</span><span class="p">;</span> <span class="nx">i</span> <span class="p"><</span> <span class="nx">b</span><span class="p">.</span><span class="nx">N</span><span class="p">;</span> <span class="nx">i</span> <span class="o">++</span> <span class="p">{</span>
		<span class="nx">_</span> <span class="p">=</span> <span class="o">*</span><span class="p">(</span><span class="o">*</span><span class="kt">string</span><span class="p">)(</span><span class="nx">unsafe</span><span class="p">.</span><span class="nx">Pointer</span><span class="p">(</span><span class="o">&</span><span class="nx">x</span><span class="p">))</span>
	<span class="p">}</span>
<span class="p">}</span>
</code></pre>