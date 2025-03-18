---
# 这是文章的标题
title: Sentinel


# 这是侧边栏的顺序
order: 5
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2020-01-01

# 一个页面可以有多个标签
tag:
  - 微服务

# 此页面会出现在星标文章中
star: true
---

# 限流 & 降级 & 熔断





## 快速理解



> 我们一般开发的服务处理请求的能力是有限的，若是接收请求数量达到一定程度服务就会崩溃，不能处理其他的服务的请求引起雪崩效应
>
> 本节考虑的主要是解决大量请求导致服务器崩溃而引起的雪崩效应问题
>
> 核心：**限流**将流量请求限制在服务能力范围内
>
> ​             **熔断降级**是为了解决服务崩溃导致其他服务不可用甚至扩展效应导致服务雪崩效应



|              |            **限流**            |                 **熔断**                 |
| :----------: | :----------------------------: | :--------------------------------------: |
| **保护目标** |            当前服务            |            当前服务与下游服务            |
| **触发条件** |           请求量过大           |        调用下游服务失败或响应过慢        |
| **处理方式** |          拒绝部分请求          |             停止调用下游服务             |
| **恢复机制** |          持续控制流量          |    半开状态检测下游服务恢复后恢复调用    |
| **典型场景** | 短时间内流量暴增（如秒杀活动） | 下游服务不可用或性能下降（如故障或拥堵） |

---



### 举两个例子



**限流场景：秒杀活动**

假如一个商品秒杀活动开始，10万个用户同时发起请求，但你的服务只能处理 1000 QPS：

1. 配置限流规则，限制最大 QPS 为 1000。
2. Sentinel 会拦截超过 1000 QPS 的请求，直接返回 "服务繁忙，请稍后再试"。
3. 避免服务因流量过大被压垮。

---

#### **熔断场景：调用下游支付服务**

你的订单服务调用支付服务，如果支付服务突然响应超时或错误激增：

1. Sentinel 监控到支付服务的响应时间过长或错误比率过高。
2. 触发熔断，直接返回 "支付服务繁忙，请稍后再试" 给用户。
3. 一段时间后，Sentinel 半开状态尝试调用支付服务，如果恢复正常，解除熔断。
4. 避免订单服务因等待支付服务导致线程资源耗尽，同时提升响应速度。





---



### 什么是服务雪崩：



服务雪崩效应是一种因服务提供者不可用导致服务调用者的不可用，并将不可用扩大的过程



#### 原因：

a、一些设备出现故障：硬件问题，比如驱动错误，内存中断或者出现死锁

b、服务器的负载承受不住：用户行为，比如双十一活动，导致大量请求超出服务器可以承受的范围导致服务器崩溃不可以

c、代码问题：比如服务运行出现一些代码上的bug也会导致服务直接挂掉





#### 解决：



4中策略：服务隔离、超时机制、**限流模式、服务熔断降级**

+ 服务隔离：2种方式-线程池隔离和信号量隔离

  1、线程池隔离：每一个服务接口都有自己独立的线程池，每个线程互不影响

  2、信号量隔离：用一个计数器记录当前有多少个线程，请求进来先判断是否超出最大，超出拒绝，没有就+1，执行结束-1

+ 超时机制：2种方式 - 请求等待超时、请求运行超时

  1、等待超时：判断入队时间是否超出最大超时时间，超过了直接丢弃

  2、运行超时：直接使用线程池提供的get方法

+ **限流模式：**其他的属于出错后的容错机制，而**限流模式是预防机制。设置最大的QPS阈值**，超出的根据规则处理，比如直接丢弃或等待多少秒再丢弃，不再提供服务。这种机制只能解决系统资源分配问题，因为对于没有被限流的服务也可能出现雪崩效应

+ **服务熔断降级：熔断机制是为了保护服务，降级是不可以但是给用户一个友好的提示**，两者一般一起用。在高并发情况下，如果请求达到一定极限会直接拒绝访问。然后一段时间判断是否可以重新启用。设计分了三个模块：熔断请求判断算法、熔断恢复机制、熔断报警



#### 技术选型：Sentinel组件

Sentinel：是面向分布式服务架构的轻量级高可用流量控制组件。Sentinel 主要以流量为切入点，从流量控制、熔断降级、系统负载保护等多个维度来帮助用户提升服务的稳定性。



后续直接使用sentinel组件完成限流、熔断降级





---



## Sentinel 的限流和熔断实现的底层原理



Sentinel 是阿里巴巴开源的一款**分布式流量控制和熔断框架**，主要用于**保护微服务系统的稳定性**。其底层实现围绕流量统计、规则

匹配和策略执行来展开。以下是它实现限流和熔断的核心原理：

------



### **1. 限流的实现原理**

#### **1.1 数据采集与统计**

Sentinel 通过对资源访问的实时统计，监控请求的流量、并发量等关键指标，主要使用**滑动窗口和令牌桶算法**进行流量控制：

- **滑动窗口**

  + 分段统计固定时间窗口内的请求数量，用于流量统计。

  - 将时间分成多个小片段（Bucket），每个桶记录片段内的请求数。
  - 滑动时按时间移动窗口，通过累加当前窗口所有桶的数据得到实时流量。

- **令牌桶**：实现请求速率限制，按照固定速率生成令牌，只有当请求获取令牌时才能通过，否则被限流。

> Sentinel 底层采用滑动窗口 + 令牌桶相结合的方式，根据实际规则执行流量控制。



#### **1.2 配置规则**

用户可以为特定资源设置限流规则：

- **QPS 限流**：限制每秒通过的请求数。
- **并发限流**：限制并发请求数。
- **基于调用链路的限流**：针对调用链路中的某些资源设定规则，防止链路关键点的过载。
- **基于自定义条件的限流**：用户可以通过扩展接口，基于自定义条件执行限流。



#### **1.3 执行限流**

- 当一个请求到达时，Sentinel 通过拦截器（例如 AOP 或 HTTP 过滤器）检查当前资源的流量统计数据。
- 根据规则匹配，判断是否允许请求通过：
  - **允许通过**：更新统计数据，并放行请求。
  - **拒绝通过**：触发限流逻辑（如返回特定错误、执行降级逻辑等）。

------



### **2. 熔断的实现原理**

#### **2.1 熔断指标统计**

Sentinel 会实时统计资源调用的状态，包括以下指标：

- **请求数量**：一段时间内的总请求数。
- **失败率**：失败请求数占总请求数的百分比。
- **响应时间**：请求的平均响应时间。

这些统计指标也是基于滑动窗口实现的，每个窗口细分为多个桶，确保统计数据的实时性和准确性。



#### **2.2 熔断规则**

用户可以为资源配置熔断规则，Sentinel 支持以下几种熔断策略：

1. 响应时间策略：
   - 当请求的平均响应时间超过阈值，且请求量达到设定的最小值时，触发熔断。
2. 错误比率策略：
   - 当错误请求数占总请求数的比率超过设定阈值时，触发熔断。
3. 错误数量策略：
   - 当错误请求数量超过设定的阈值时，触发熔断。

#### **2.3 执行熔断**

- 当某个熔断规则被触发时，Sentinel 会将该资源标记为“熔断状态”，在一定时间内拒绝请求，保护下游系统。
- **半开状态**：熔断的资源经过一个恢复期（`RecoveryTimeout`）后，会进入半开状态，允许少量请求通过以测试系统是否恢复正常。
- 如果恢复正常（通过请求无异常），关闭熔断；如果恢复失败（异常仍然存在），重新进入熔断状态。

------

### **3. 核心模块**

#### **3.1 流量统计模块**

- **滑动窗口**：记录请求的时间、数量、响应状态等数据，精度可调。
- **令牌桶算法**：控制请求速率。
- **并发计数**：通过原子计数或信号量控制并发量。

#### **3.2 规则管理模块**

- 动态加载规则，支持从配置文件、数据库、控制台等多种来源加载规则。
- 规则存储在内存中，高效匹配并动态更新。

#### **3.3 策略执行模块**

- **限流策略**：在统计数据达到设定阈值时，执行限流逻辑。
- **熔断策略**：在满足熔断条件时，阻断后续请求。
- **降级策略**：当资源被限流或熔断时，可以执行备选逻辑（如返回兜底数据）。







---



## 单测功能

### 

### 流量控制 -- QPS限流

> 定义限流规则：Threshold限定阈值，ControlBehavior流控策略设置直接拒绝







### 流量控制 -- 预热模式





### 流量控制 -- 匀速





### 熔断策略 -- error_count





### 熔断策略 -- 错误率





### 熔断策略 -- 慢请求



---



## 项目实战

### 

### 1、初始化

```go
package initialize

import (
	sentinel "github.com/alibaba/sentinel-golang/api"
	"github.com/alibaba/sentinel-golang/core/flow"
	"go.uber.org/zap"
)

func InitSentinel() {
	err := sentinel.InitDefault()
	if err != nil {
		zap.S().Fatalf("初始化sentinel 异常: %v", err)
	}

	//配置限流规则
	//这种配置应该从nacos中读取
	_, err = flow.LoadRules([]*flow.Rule{
		{
			Resource:               "goods_list",
			TokenCalculateStrategy: flow.Direct,
			ControlBehavior:        flow.Reject, //匀速通过
			//Threshold:              20,          //100ms只能就已经来了1W的并发， 1s就是10W的并发
			//StatIntervalInMs:       6000,
			Threshold:        3, // 6秒钟只能3个请求进来，方便测试
			StatIntervalInMs: 6000,
		},
	})

	if err != nil {
		zap.S().Fatalf("加载规则失败: %v", err)
	}
}
```





### 2、main函数初始化

```go
package main

import (
	"fmt"
	"go.uber.org/zap"
	"kuangstudy-mall/apis/goods-web/global"
	"kuangstudy-mall/apis/goods-web/initialize"
	"kuangstudy-mall/apis/goods-web/validation"
)

func main() {

	// 解析命令行参数
	initialize.InitArgs()
	// 日志
	initialize.InitLogger()
	// 解析配置件
	initialize.InitializeConfig()
	// 初始化gprc服务
	//initialize.InitClient()
	initialize.InitSentinel()
	// 初始化自定义验证器
	validation.InitValidator(*global.Args.Locale)
	// gin 服务的封装和路由模块划分
	Router := initialize.InitWebRouter()

	err := Router.Run(fmt.Sprintf("%s:%d", *global.Args.IP, *global.Args.Port))
	zap.S().Infof("gin服务端口是：%d，启动了", *global.Args.Port)
	if err != nil {
		zap.S().Panicf("gin服务端口是：%d，启动失败了", *global.Args.Port)
	}
}
```





### 3、具体使用

```go
// FindGoodsList 查询商品列表
func (api *GoodsApi) FindGoodsList(ctx *gin.Context) {
	var goodsContext context.GoodsContext
	err := ctx.ShouldBindJSON(&goodsContext)
	if err != nil {
		api.FailCodeMsgAny(603, validation.GetErrors(err, goodsContext), ctx)
		return
	}

	// 开始远程服务调用
	bannerInfoRequest := proto.GoodsFilterRequest{
		PageNo:     goodsContext.PageNo,
		PageSize:   goodsContext.PageSize,
		Keyword:    goodsContext.Keyword,
		IsHot:      goodsContext.IsHot,
		IsNew:      goodsContext.IsNew,
		CategoryId: goodsContext.CategoryId,
		MinPrice:   goodsContext.MinPrice,
		MaxPrice:   goodsContext.MaxPrice,
	}

	entry, blockError := sentinel.Entry("goods_list", sentinel.WithTrafficType(base.Inbound))
	if blockError != nil {
		// 意味着被限流了
		api.FailCodeMsgAny(606, "请求过于频繁，请稍后再试!", ctx)
		return
	}
	entry.Exit()
	api.OK(bannerInfoRequest, ctx)
}
```







### 测试