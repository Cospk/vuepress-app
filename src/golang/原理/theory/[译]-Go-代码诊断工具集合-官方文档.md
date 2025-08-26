---
title: [译] Go 代码诊断工具集合-官方文档
source_url: 'https://studygolang.com/articles/22260'
category: Go原理教程
---


						<ul id="markdown-toc">
  <li><a href="#introduction" id="markdown-toc-introduction">Introduction</a></li>
  <li><a href="#profiling" id="markdown-toc-profiling">Profiling</a></li>
  <li><a href="#tracing" id="markdown-toc-tracing">Tracing</a></li>
  <li><a href="#debugging" id="markdown-toc-debugging">Debugging</a></li>
  <li><a href="#runtime-statistics-and-events" id="markdown-toc-runtime-statistics-and-events">Runtime statistics and events</a>    <ul>
      <li><a href="#execution-tracer" id="markdown-toc-execution-tracer">Execution tracer</a></li>
      <li><a href="#godebug" id="markdown-toc-godebug">GODEBUG</a></li>
    </ul>
  </li>
</ul>

<h3 id="introduction">Introduction</h3>

<p>Go生态系统提供了大量API和工具来诊断Go程序中的逻辑和性能问题。 此页面总结了可用的工具，并帮助Go用户针对他们的特定问题选择正确的工具。</p>

<p>诊断解决方案可分为以下几组：</p>
<ul>
  <li><strong>Profiling</strong>：Profiling 工具分析Go程序的复杂性和成本，例如其内存使用情况和频繁调用的函数，以识别Go程序的昂贵部分。</li>
  <li><strong>Tracing</strong>：Tracing 是一种检测代码的方法，用于分析调用或用户请求的整个生命周期中的延迟。 Traces 提供了每个组件对系统总体延迟影响的概览。 Traces 可以跨越多个Go进程。</li>
  <li><strong>Debugging</strong>: Debugging 允许我们暂停Go程序并检查其执行。可以通过 debugging 验证程序状态和流程。</li>
  <li><strong>Runtime statistics and events</strong>： 对运行时统计信息、事件的收集和分析提供了Go程序运行状况的高层次概览。 指标的尖峰/下降有助于我们识别吞吐量，利用率和性能的变化。</li>
</ul>

<blockquote>
  <p>注意：某些诊断工具可能会相互干扰。 例如，精确的 memory profiling 会扭曲 CPU profiles，而goroutine blocking profiling 会影响 scheduler trace。 隔离使用工具可获得更精确的信息。</p>
</blockquote>

<h3 id="profiling">Profiling</h3>

<p>Profiling 对于识别昂贵或经常调用的代码段很有用。 Go runtime 以 <a href="https://github.com/google/pprof/blob/master/doc/README.md">pprof 可视化工具</a>所期望的格式提供 <a href="https://golang.org/pkg/runtime/pprof/">profiling data</a>。 在测试期间可以通过 <code class="highlighter-rouge">go test</code> 或 <a href="https://golang.org/pkg/net/http/pprof/">net/http/pprof</a> 包提供的 endpoints 收集 profiling data。 用户需要收集 profiling data 并使用 pprof 工具来过滤和可视化顶部代码路径。</p>

<p><a href="https://golang.org/pkg/runtime/pprof">runtime/pprof</a> 包提供的预定义 profiles：</p>

<ul>
  <li><strong>cpu</strong>: CPU profile 确定程序在活跃的消耗CPU周期（而不是在睡眠或等待I/O时）花费时间的位置。</li>
  <li><strong>heap</strong>: Heap profile  报告内存分配样本; 用于监视当前和历史内存使用情况，并检查内存泄漏。</li>
  <li><strong>threadcreate</strong>: Thread creation profile 报告程序中导致创建新OS线程的部分。</li>
  <li><strong>goroutine</strong>: Goroutine profile 报告所有当前 goroutines 的 stack traces。</li>
  <li><strong>block</strong>: Block profile 显示goroutine阻止等待同步原语（包括 timer channels）的位置。 Block profile 默认情况下未开启; 使用 <code class="highlighter-rouge">runtime.SetBlockProfileRate</code> 启用。</li>
  <li><strong>mutex</strong>: Mutex profile 报告锁竞争。 如果您认为由于互斥竞争而未充分利用您的CPU，请使用此 profile。 Mutex profile 默认情况下未开启，请参阅 <code class="highlighter-rouge">runtime.SetMutexProfileFraction</code> 启用。</li>
</ul>

<p><strong>我可以使用其他哪些 profilers 来介绍Go程序？</strong></p>

<p>在Linux上，<a href="https://perf.wiki.kernel.org/index.php/Tutorial">perf tools</a> 可用于分析Go程序。 Perf 可以 profile 和展开 cgo/SWIG 代码和内核，因此深入了解native/内核性能瓶颈非常有用。 在macOS上， <a href="https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/">Instruments</a> 套件可以用来 profile Go 程序。</p>

<p><strong>我可以 profile 我的生产环境的服务吗？</strong></p>

<p>是的。 在生产环境中对程序进行 profile 是安全的，但启用某些 profiles（例如：CPU profile）会增加消耗。 您应该会看到性能降级。 在生产中打开探测器之前，可以通过测量 profiler 的开销来估计性能损失。</p>

<p>您可能希望定期分析您的生产服务。 特别是在具有单进程多副本的系统中，定期选择随机副本是安全的选择。 选择一个生产服务，  每隔Y秒 profile X秒并保存结果以进行可视化和分析; 然后定期重复。 可以 手动/自动 检查结果以发现问题。 profiles 收集可能会相互干扰，因此建议一次只收集一个 profile。</p>

<p><strong>可视化分析数据的最佳方法是什么？</strong></p>

<p>Go tools使用 <a href="https://github.com/google/pprof/blob/master/doc/README.md"><code class="highlighter-rouge">go tool pprof</code></a> 提供文本，图形和 <a href="http://valgrind.org/docs/manual/cl-manual.html">callgrind</a> 可视化的 profile data。 阅读 <a href="https://blog.golang.org/profiling-go-programs">Profiling Go programs</a> 以查看它们的实际使用。</p>

<p><img src="https://storage.googleapis.com/golangorg-assets/pprof-text.png" alt="738fb1d54bd36c74ac3c98052ed7db24.png"/></p>

<blockquote>
  <p>文本方式查看最大的消耗的调用</p>
</blockquote>

<p><img src="https://storage.googleapis.com/golangorg-assets/pprof-dot.png" alt="9271bb2658eb3b3fb8bf034d2675f4d2.png"/></p>

<blockquote>
  <p>图片方式可视化最大的消耗的调用</p>
</blockquote>

<p>Weblist视图在HTML页面中逐行显示源代码最大消耗的部分。 在以下示例中，530ms用于 <code class="highlighter-rouge">runtime.concatstrings</code>，每行的消耗显示在列表中。</p>

<p><img src="https://storage.googleapis.com/golangorg-assets/pprof-weblist.png" alt="18b069d57a4f697cc580ea69478dea77.png"/></p>

<blockquote>
  <p>weblist方式可视化最大的消耗的调用</p>
</blockquote>

<p>另一种可视化轮廓数据的方法是<a href="http://www.brendangregg.com/flamegraphs.html">火焰图</a>。 火焰图允许您在特定的祖先路径中移动，因此您可以放大/缩小特定的代码段。<a href="https://github.com/google/pprof">upstream pprof</a>支持火焰图。</p>

<p><img src="https://storage.googleapis.com/golangorg-assets/flame.png" alt="77471e15e5c54e282982377b454320c5.png"/></p>

<blockquote>
  <p>火焰图方式可视化以发现最昂贵的代码路径</p>
</blockquote>

<p><strong>我是否仅限于内置profiles？</strong></p>

<p>除了 runtime 提供的工具之外，Go用户还可以通过 <a href="https://golang.org/pkg/runtime/pprof/#Profile">pprof.Profile</a> 创建自定义 profiles，并使用现有工具对其进行检查。</p>

<p><strong>我可以在不同的路径和端口上提供 profiler handlers(/debug/pprof/…) 吗？</strong></p>

<p>是的。 默认情况下， <code class="highlighter-rouge">net/http/pprof</code> 包将其 handlers 注册到默认的mux，但您也可以使用从包中导出的handler net/http/pprof注册它们。</p>

<p>例如，以下示例将在7777端口/custom_debug_path/profile上提供 pprof.Profile handler：</p>

<div class="language-go highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">package</span><span class="x"> </span><span class="n">main</span><span class="x">

</span><span class="k">import</span><span class="x"> </span><span class="p">(</span><span class="x">
	</span><span class="s">"log"</span><span class="x">
	</span><span class="s">"net/http"</span><span class="x">
	</span><span class="s">"net/http/pprof"</span><span class="x">
</span><span class="p">)</span><span class="x">

</span><span class="k">func</span><span class="x"> </span><span class="n">main</span><span class="p">()</span><span class="x"> </span><span class="p">{</span><span class="x">
	</span><span class="n">mux</span><span class="x"> </span><span class="o">:=</span><span class="x"> </span><span class="n">http</span><span class="o">.</span><span class="n">NewServeMux</span><span class="p">()</span><span class="x">
	</span><span class="n">mux</span><span class="o">.</span><span class="n">HandleFunc</span><span class="p">(</span><span class="s">"/custom_debug_path/profile"</span><span class="p">,</span><span class="x"> </span><span class="n">pprof</span><span class="o">.</span><span class="n">Profile</span><span class="p">)</span><span class="x">
	</span><span class="n">log</span><span class="o">.</span><span class="n">Fatal</span><span class="p">(</span><span class="n">http</span><span class="o">.</span><span class="n">ListenAndServe</span><span class="p">(</span><span class="s">":7777"</span><span class="p">,</span><span class="x"> </span><span class="n">mux</span><span class="p">))</span><span class="x">
</span><span class="p">}</span><span class="x">
</span></code></pre>