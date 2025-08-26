---
title: Go 笔记之如何防止 goroutine 泄露
source_url: 'https://studygolang.com/articles/22463'
category: Go原理教程
---

<pre><code class="language-go"><span class="kn">package</span> <span class="nx">main</span>

<span class="kn">import</span> <span class="s">"time"</span>

<span class="kd">func</span> <span class="nf">gen</span><span class="p">(</span><span class="nx">done</span> <span class="kd">chan</span> <span class="kd">struct</span><span class="p">{},</span> <span class="nx">nums</span> <span class="o">...</span><span class="kt">int</span><span class="p">)</span> <span class="o"><-</span><span class="kd">chan</span> <span class="kt">int</span> <span class="p">{</span>
    <span class="nx">out</span> <span class="o">:=</span> <span class="nb">make</span><span class="p">(</span><span class="kd">chan</span> <span class="kt">int</span><span class="p">)</span>
    <span class="k">go</span> <span class="kd">func</span><span class="p">()</span> <span class="p">{</span>
        <span class="k">defer</span> <span class="nb">close</span><span class="p">(</span><span class="nx">out</span><span class="p">)</span>
        <span class="k">for</span> <span class="nx">_</span><span class="p">,</span> <span class="nx">n</span> <span class="o">:=</span> <span class="k">range</span> <span class="nx">nums</span> <span class="p">{</span>
            <span class="k">select</span> <span class="p">{</span>
            <span class="k">case</span> <span class="nx">out</span> <span class="o"><-</span> <span class="nx">n</span><span class="p">:</span>
            <span class="k">case</span> <span class="o"><-</span><span class="nx">done</span><span class="p">:</span>
                <span class="k">return</span>
            <span class="p">}</span>
        <span class="p">}</span>
    <span class="p">}()</span>
    <span class="k">return</span> <span class="nx">out</span>
<span class="p">}</span>

<span class="kd">func</span> <span class="nf">main</span><span class="p">()</span> <span class="p">{</span>
    <span class="k">defer</span> <span class="kd">func</span><span class="p">()</span> <span class="p">{</span>
        <span class="nx">time</span><span class="p">.</span><span class="nf">Sleep</span><span class="p">(</span><span class="nx">time</span><span class="p">.</span><span class="nx">Second</span><span class="p">)</span>
        <span class="nx">fmt</span><span class="p">.</span><span class="nf">Println</span><span class="p">(</span><span class="s">"the number of goroutines: "</span><span class="p">,</span> <span class="nx">runtime</span><span class="p">.</span><span class="nf">NumGoroutine</span><span class="p">())</span>
    <span class="p">}()</span>

    <span class="c1">// Set up the pipeline.
</span><span class="c1"></span>    <span class="nx">done</span> <span class="o">:=</span> <span class="nb">make</span><span class="p">(</span><span class="kd">chan</span> <span class="kd">struct</span><span class="p">{})</span>
    <span class="k">defer</span> <span class="nb">close</span><span class="p">(</span><span class="nx">done</span><span class="p">)</span>

    <span class="nx">out</span> <span class="o">:=</span> <span class="nf">gen</span><span class="p">(</span><span class="nx">done</span><span class="p">,</span> <span class="mi">2</span><span class="p">,</span> <span class="mi">3</span><span class="p">)</span>

    <span class="k">for</span> <span class="nx">n</span> <span class="o">:=</span> <span class="k">range</span> <span class="nx">out</span> <span class="p">{</span>
        <span class="nx">fmt</span><span class="p">.</span><span class="nf">Println</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span> <span class="c1">// 2
</span><span class="c1"></span>        <span class="nx">time</span><span class="p">.</span><span class="nf">Sleep</span><span class="p">(</span><span class="mi">5</span> <span class="o">*</span> <span class="nx">time</span><span class="p">.</span><span class="nx">Second</span><span class="p">)</span> <span class="c1">// done thing, 可能异常中断接收
</span><span class="c1"></span>        <span class="k">if</span> <span class="kc">true</span> <span class="p">{</span> <span class="c1">// if err != nil 
</span><span class="c1"></span>            <span class="k">break</span>
        <span class="p">}</span>
    <span class="p">}</span>
<span class="p">}</span></code></pre>