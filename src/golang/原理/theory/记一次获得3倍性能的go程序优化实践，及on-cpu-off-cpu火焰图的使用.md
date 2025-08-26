---
title: 记一次获得3倍性能的go程序优化实践，及on-cpu/off-cpu火焰图的使用
source_url: 'https://studygolang.com/articles/10449'
category: Go原理教程
---


						<blockquote>
<p>先把结论列在前面：</p>
<ol>
<li>Golang的性能可以做到非常好，但是一些native包的性能很可能会拖后腿，比如regexp和encoding/json。如果在性能要求较高的场合使用，要根据实际情况做相应优化。</li>
<li>on-cpu/off-cpu火焰图的使用是程序性能分析的利器，往往一针见血。虽然生成一张火焰图比较繁琐（尤其是off-cpu图），但绝对值得拥有！</li>
</ol>
</blockquote>
<p>之前一直使用Logstash作为日志文件采集客户端程序。Logstash功能强大，有丰富的数据处理插件及很好的扩展能力，但由于使用JRuby实现，性能堪忧。而Filebeat是后来出现的一个用go语言实现的，更轻量级的日志文件采集客户端。性能不错、资源占用少，但几乎没有任何解析处理能力。通常的使用场景是使用Filebeat采集到Logstash解析处理，然后再上传到Kafka或Elasticsearch。值得注意的是，Logstash和Filebeat都是Elastic公司的优秀开源产品。</p>
<p>为了提高客户端的日志采集性能，又减少数据传输环节和部署复杂度，并更充分的将go语言的性能优势利用于日志解析，于是决定在Filebeat上通过开发插件的方式，实现针对公司日志格式规范的解析，直接作为Logstash的替代品。</p>
<p>背景介绍完毕，下面是实现和优化的过程。</p>
<hr/>
<h3>Version 1</h3>
<p>先做一个最简单的实现，即用go自带的正则表达式包regexp做日志解析。性能已经比Logstash（也是通过开发插件做规范日志解析）高出30%。</p>
<p>这里的性能测试着眼于日志采集的瓶颈——解析处理环节，指标是在限制只使用一个cpu core的条件下（在服务器上要尽量减少对业务应用的资源占用），采集并解析1百万条指定格式和长度的日志所花费的时间。测试环境是1台主频为3.2GHz的PC。为了避免disk IO及page cache的影响，将输入文件和输出文件都放在/dev/shm中。对于Filebeat的CPU限制，是通过启动时指定环境变量GOMAXPROCS=1实现。</p>
<p>这一版本处理1百万条日志花费的时间为122秒，即每秒8200条日志。</p>
<h3>Version 2</h3>
<p>接下来尝试做一些优化，看看这个go插件的性能还可不可以有些提升。首先想到的是替换regexp包。Linux下有一个C实现的PCRE库，<a href="https://github.com/glenn-brown/golang-pkg-pcre" target="_blank">github.com/glenn-brown/golang-pkg-pcre/src/pkg/pcre</a>这个第三方包正是将PCRE库应用到golang中。CentOS下需要先安装<code>pcre-devel</code>这个包。<br/>这个版本的处理时间为97秒，结果显示比第一个版本的处理性能提升了25%。</p>
<h3>Version 3</h3>
<p>第三个版本，是完全不使用正则表达式，而是针对固定的日志格式规则，利用strings.Index()做字符串分解和提取操作。这个版本的处理时间为70秒，性能又大大的提升了将近40%。</p>
<h3>Version 4</h3>
<p>那还有没有进一步提升的空间呢。有，就是go语言的自带json包。我们的日志上传使用json格式，而go的encoding/json是基于反射实现的，性能一直广受诟病。如果对json解析有优化的话，性能提高会是很可观的。既然我们的日志格式是固定的，解析出来的字段也是固定的，这时就可以基于固定的日志结构体做json的序列化，而不必用低效率的反射来实现。go有多个针对给定结构体做json序列化/反序列化的第三方包，我们这里使用的是<a href="https://github.com/mailru/easyjson" target="_blank">easyjson</a>。在安装完easyjson包后，对我们包含了日志格式结构体定义的程序文件执行easyjson命令，会生成一个xxx_easyjson.go的文件，里面包含了这个结构体专用的Marshal/Unmarshal方法。这样一来，处理时间又缩短为61秒，性能提高15%。</p>
<p>这时，代码在我面前，已经想不出有什么大的方面还可以优化的了。是时候该本文的另一个主角，火焰图出场了。</p>
<hr/>
<p>火焰图是性能分析的一个有效工具，<a href="http://www.brendangregg.com/flamegraphs.html" target="_blank">这里</a>是它的说明。通常看到的火焰图，是指<code>on-cpu火焰图</code>，用来分析cpu都消耗在哪些函数调用上。</p>
<p>安装完<a href="https://github.com/brendangregg/FlameGraph" target="_blank">FlameGraph</a>工具后，先对目前版本的程序运行一次性能测试，按照说明抓取数据生成火焰图如下。</p>
<div class="image-package">
<img src="http://upload-images.jianshu.io/upload_images/5494980-3dbf94baebed8543.png?imageMogr2/auto-orient/strip%7CimageView2/2" data-original-src="http://upload-images.jianshu.io/upload_images/5494980-3dbf94baebed8543.png?imageMogr2/auto-orient/strip%7CimageView2/2"/><br/><div class="image-caption">perf_on_cpu_orig.png