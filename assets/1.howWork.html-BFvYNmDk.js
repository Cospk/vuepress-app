import{_ as s}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,d as n,o as l}from"./app-CG6bgqhH.js";const t={};function e(h,i){return l(),a("div",null,i[0]||(i[0]=[n(`<h2 id="_01、入门指南" tabindex="-1"><a class="header-anchor" href="#_01、入门指南"><span>01、入门指南</span></a></h2><p>Gorm 是一个基于 Go 语言的对象关系映射（ORM）库，用于简化与关系型数据库的交互。它提供了丰富的功能，帮助开发者通过 Go 的结构体来操作数据库，而无需直接编写 SQL 语句。</p><h3 id="特性" tabindex="-1"><a class="header-anchor" href="#特性"><span>特性</span></a></h3><p><strong>主要特性</strong></p><ol><li><strong>全功能 ORM</strong>： <ul><li>支持关联（一对一、一对多、多对多）。</li><li>提供钩子（BeforeSave, AfterCreate 等）用于在数据库操作前后执行自定义逻辑。</li><li>支持预加载（Eager Loading），减少查询次数。</li></ul></li><li><strong>数据库支持</strong>： <ul><li>兼容多种数据库，如 MySQL、PostgreSQL、SQLite、SQL Server 等。</li></ul></li><li><strong>链式调用</strong>： <ul><li>支持链式调用，便于构建复杂查询。</li></ul></li><li><strong>自动迁移</strong>： <ul><li>根据结构体自动创建或更新数据库表结构。</li></ul></li><li><strong>事务支持</strong>： <ul><li>提供事务处理，确保数据一致性。</li></ul></li><li><strong>SQL 生成器</strong>： <ul><li>内置 SQL 生成器，支持复杂查询。</li></ul></li><li><strong>扩展性</strong>： <ul><li>支持自定义数据类型和插件。</li></ul></li></ol><h3 id="模型" tabindex="-1"><a class="header-anchor" href="#模型"><span>模型</span></a></h3><div class="hint-container tip"><p class="hint-container-title">提示</p><p>GORM 通过将 <strong>Go 结构体（Go structs） 映射到数据库表</strong>来简化数据库交互，通过定义<strong>模型，Gorm 可以自动创建、更新和查询数据库表</strong>。模型的定义和使用是 Gorm 的核心功能之一。</p></div><h4 id="_1模型的基本结构" tabindex="-1"><a class="header-anchor" href="#_1模型的基本结构"><span>①模型的基本结构</span></a></h4><p>一个基本的 Gorm 模型通常是一个 Go 结构体，结构体的字段对应数据库表的列。Gorm 通过结构体的标签（Tag）来指定字段的属性和行为。</p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">type</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> User</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> struct</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> {</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">    gorm</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Model</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">       // 可嵌入其他结构体，这个是gorm默认提供的额，具体字段可看下面的结构体</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    Name</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">  string</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    Email</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> string</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> \`gorm:&quot;uniqueIndex&quot;\`</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    Age</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">   int</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">type</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> Model</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> struct</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> {</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    ID</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        uint</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> \`gorm:&quot;primaryKey&quot;\`</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    CreatedAt</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> time</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Time</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    UpdatedAt</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> time</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Time</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    DeletedAt</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> gorm</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">DeletedAt</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> \`gorm:&quot;index&quot;\`</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="_2模型字段的标签" tabindex="-1"><a class="header-anchor" href="#_2模型字段的标签"><span>②模型字段的标签</span></a></h4><p>Gorm 通过结构体标签来指定字段的属性和行为。常用的标签包括：</p><ul><li><code>primaryKey</code>：指定字段为主键。</li><li><code>uniqueIndex</code>：指定字段为唯一索引。</li><li><code>not null</code>：指定字段不能为空。</li><li><code>default</code>：指定字段的默认值。</li><li><code>size</code>：指定字段的大小（适用于字符串和数值类型）。</li><li><code>column</code>：指定字段对应的数据库列名。</li></ul><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">type</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> Product</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> struct</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> {</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">    gorm</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Model</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    Code</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">  string</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> \`gorm:&quot;uniqueIndex;not null&quot;\`</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="_3模型的增删改查操作" tabindex="-1"><a class="header-anchor" href="#_3模型的增删改查操作"><span>③模型的增删改查操作</span></a></h4><p>使用Gorm 提供的方法来操作模型，包括创建、查询、更新和删除</p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// Gorm提供：增Create、查First/Take/Last、改Update/Updates/Save、删Delete</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">user</span><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;"> :=</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> User</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">{</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">Name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;Alice&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">Email</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;alice@example.com&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">Age</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">25</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">}</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">Create</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#383A42;--shiki-dark:#C678DD;">&amp;</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">user</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">var</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> user</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> User</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">First</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#383A42;--shiki-dark:#C678DD;">&amp;</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">user</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">1</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 根据主键查询</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">First</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#383A42;--shiki-dark:#C678DD;">&amp;</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">user</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;name = ?&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;Alice&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 根据条件查询</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">Model</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#383A42;--shiki-dark:#C678DD;">&amp;</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">user</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">).</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">Update</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;Age&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">30</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">Delete</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#383A42;--shiki-dark:#C678DD;">&amp;</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">user</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">1</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="连接到数据库" tabindex="-1"><a class="header-anchor" href="#连接到数据库"><span>连接到数据库</span></a></h3><p><strong>连接已有的数据库</strong></p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// GORM 允许通过一个现有的数据库连接来初始化 *gorm.DB</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">sqlDB</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">err</span><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;"> :=</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> sql</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">Open</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;mysql&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;mydb_dsn&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">gormDB</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">err</span><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;"> :=</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> gorm</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">Open</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">mysql</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">New</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">mysql</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Config</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">{</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  Conn</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">sqlDB</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">}), </span><span style="--shiki-light:#383A42;--shiki-dark:#C678DD;">&amp;</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">gorm</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Config</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">{})</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>高级配置连接到数据库</strong></p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">err</span><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;"> :=</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> gorm</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">Open</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">mysql</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">New</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">mysql</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Config</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">{</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  DSN</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;gorm:gorm@tcp(127.0.0.1:3306)/gorm?charset=utf8&amp;parseTime=True&amp;loc=Local&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// DSN data source name</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  DefaultStringSize</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">256</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// string 类型字段的默认长度</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  DisableDatetimePrecision</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">true</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 禁用 datetime 精度，MySQL 5.6 之前的数据库不支持</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  DontSupportRenameIndex</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">true</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 重命名索引时采用删除并新建的方式，MySQL 5.7 之前的数据库和 MariaDB 不支持重命名索引</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  DontSupportRenameColumn</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">true</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 用 \`change\` 重命名列，MySQL 8 之前的数据库和 MariaDB 不支持重命名列</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  SkipInitializeWithVersion</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">false</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 根据当前 MySQL 版本自动配置</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">}), </span><span style="--shiki-light:#383A42;--shiki-dark:#C678DD;">&amp;</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">gorm</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Config</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">{})</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 注意：要正确的处理 time.Time ，需要带上 parseTime 参数、要支持完整的 UTF-8 编码，要将 charset=utf8 更改为 charset=utf8mb4</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>连接池</strong></p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 获取通用数据库对象 sql.DB ，然后使用其提供的功能</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">sqlDB</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">err</span><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;"> :=</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">DB</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">()</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// SetMaxIdleConns 用于设置连接池中空闲连接的最大数量。</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">sqlDB</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">SetMaxIdleConns</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">10</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// SetMaxOpenConns 设置打开数据库连接的最大数量。</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">sqlDB</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">SetMaxOpenConns</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">100</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// SetConnMaxLifetime 设置了连接可复用的最大时间。</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">sqlDB</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">SetConnMaxLifetime</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">time</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">Hour</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,24)]))}const r=s(t,[["render",e],["__file","1.howWork.html.vue"]]),d=JSON.parse('{"path":"/golang/Gorm%E6%A1%86%E6%9E%B6/1.howWork.html","title":"gorm实现原理","lang":"zh-CN","frontmatter":{"title":"gorm实现原理","order":2,"author":"xiaoxie","date":"2020-01-01T00:00:00.000Z","tag":["golang"],"star":true,"description":"01、入门指南 Gorm 是一个基于 Go 语言的对象关系映射（ORM）库，用于简化与关系型数据库的交互。它提供了丰富的功能，帮助开发者通过 Go 的结构体来操作数据库，而无需直接编写 SQL 语句。 特性 主要特性 全功能 ORM： 支持关联（一对一、一对多、多对多）。 提供钩子（BeforeSave, AfterCreate 等）用于在数据库操作前...","head":[["meta",{"property":"og:url","content":"https://Cospk.github.io/vuepress-app/golang/Gorm%E6%A1%86%E6%9E%B6/1.howWork.html"}],["meta",{"property":"og:site_name","content":"Golang全栈指南"}],["meta",{"property":"og:title","content":"gorm实现原理"}],["meta",{"property":"og:description","content":"01、入门指南 Gorm 是一个基于 Go 语言的对象关系映射（ORM）库，用于简化与关系型数据库的交互。它提供了丰富的功能，帮助开发者通过 Go 的结构体来操作数据库，而无需直接编写 SQL 语句。 特性 主要特性 全功能 ORM： 支持关联（一对一、一对多、多对多）。 提供钩子（BeforeSave, AfterCreate 等）用于在数据库操作前..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-03-18T03:55:25.000Z"}],["meta",{"property":"article:author","content":"xiaoxie"}],["meta",{"property":"article:tag","content":"golang"}],["meta",{"property":"article:published_time","content":"2020-01-01T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2025-03-18T03:55:25.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"gorm实现原理\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2020-01-01T00:00:00.000Z\\",\\"dateModified\\":\\"2025-03-18T03:55:25.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"xiaoxie\\"}]}"]]},"headers":[{"level":2,"title":"01、入门指南","slug":"_01、入门指南","link":"#_01、入门指南","children":[{"level":3,"title":"特性","slug":"特性","link":"#特性","children":[]},{"level":3,"title":"模型","slug":"模型","link":"#模型","children":[]},{"level":3,"title":"连接到数据库","slug":"连接到数据库","link":"#连接到数据库","children":[]}]}],"git":{"createdTime":1734622519000,"updatedTime":1742270125000,"contributors":[{"name":"xiaoxie01","username":"xiaoxie01","email":"xie18115@gmail.com","commits":1,"url":"https://github.com/xiaoxie01"},{"name":"xiaoxie001","username":"xiaoxie001","email":"xie18115@outlook.com","commits":1,"url":"https://github.com/xiaoxie001"}]},"readingTime":{"minutes":3.37,"words":1012},"filePathRelative":"golang/Gorm框架/1.howWork.md","localizedDate":"2020年1月1日","autoDesc":true,"excerpt":"<h2>01、入门指南</h2>\\n<p>Gorm 是一个基于 Go 语言的对象关系映射（ORM）库，用于简化与关系型数据库的交互。它提供了丰富的功能，帮助开发者通过 Go 的结构体来操作数据库，而无需直接编写 SQL 语句。</p>\\n<h3>特性</h3>\\n<p><strong>主要特性</strong></p>\\n<ol>\\n<li><strong>全功能 ORM</strong>：\\n<ul>\\n<li>支持关联（一对一、一对多、多对多）。</li>\\n<li>提供钩子（BeforeSave, AfterCreate 等）用于在数据库操作前后执行自定义逻辑。</li>\\n<li>支持预加载（Eager Loading），减少查询次数。</li>\\n</ul>\\n</li>\\n<li><strong>数据库支持</strong>：\\n<ul>\\n<li>兼容多种数据库，如 MySQL、PostgreSQL、SQLite、SQL Server 等。</li>\\n</ul>\\n</li>\\n<li><strong>链式调用</strong>：\\n<ul>\\n<li>支持链式调用，便于构建复杂查询。</li>\\n</ul>\\n</li>\\n<li><strong>自动迁移</strong>：\\n<ul>\\n<li>根据结构体自动创建或更新数据库表结构。</li>\\n</ul>\\n</li>\\n<li><strong>事务支持</strong>：\\n<ul>\\n<li>提供事务处理，确保数据一致性。</li>\\n</ul>\\n</li>\\n<li><strong>SQL 生成器</strong>：\\n<ul>\\n<li>内置 SQL 生成器，支持复杂查询。</li>\\n</ul>\\n</li>\\n<li><strong>扩展性</strong>：\\n<ul>\\n<li>支持自定义数据类型和插件。</li>\\n</ul>\\n</li>\\n</ol>"}');export{r as comp,d as data};
