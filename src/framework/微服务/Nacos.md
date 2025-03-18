---
# 这是文章的标题
title: Nacos


# 这是侧边栏的顺序
order: 4
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

# 为什么要微服务

## 现有项目存在的问题



- 现在我们已经完成了，用户api服务和用户srv服务的调用。按理来说应该就可以去进行后续的接口开发了。在这里先反思一个问题，这个现在能称之为微服务项目吗？答案肯定不是。你可能会问是不是引入了后续的微服务组件nacos,consul,hystrix,sentinel等分布式的组件就是微服务项目开发呢？答案：对，也不正确，就看你怎么理解。

- 如果你理解就是用了微服务组件就是微服务项目，这个有点太片面了。怎么说呢，大家有在使用微服务组件的时候真正去理解和思考为什么要用一个组件，这个为什么是很多人没去弄明白的事情，然后就去学习微服务，反正别人这样用我也这样用。在遇到真正的问题或者面试的时候就回答不出来个所以然来。不知道大家是不是有这样的问题存在，如果是，接下来就好好来听飞哥分析分析这些组件的认识。

- 大家有没想过一个问题就是 如果提供user-srv突然都挂了，或者服务器宕机了会怎么样？宕机的原因可能是：服务器坏了，程序出错了，并发太大扛不住宕机阻塞了等等，哈哈这个时候问题就来了？

  这个时候user-api那边就调用不到服务了，就会出现服务忙的提示和异常。这个时候你会怎么处理？你可能立马想到的是去重启user-srv服务。哈哈，但是这个运行一下又挂了。重启解决不了根本问题。怎么办？答案肯定是集群。

  把user-srv集群。想到web框架的集群方案肯定是nginx。但是nginx虽然可以完成，

  - 第一个问题：但是你会增加了服务器成本了。假设你部署的user-srv服务器的配置都是：2core4g。 要做集群就必须：4台服务器，一个nginx + 三个user-srv服务器。是不是服务器成本增加了。

  - 第二个问题：你在开发阶段去使用nginx，难免有点笨重。还要额外的去启动nginx的服务来进行调试和处理

  - 第三个问题：你必须要掌握和学习nginx的集群配置以及出现的问题和故障的解决方案，增加了运维部署成本。
  - 第四个问题：如果这个时候并发扛不住，你必须不停的更改nginx的服务配置，增加节点，下线节点，会不停的重启nginx服务，而这个时候nginx管理的服务过多，影响太广了。虽然nginx启动很快，但是对新服务的感知需要时间处理。如何做到服务快速的上线，下线，感知服务的有效性就成为了难题。
  - 综上所述，使用nginx并不是不可以，传统的方式都是这样做集群，但是有没用更好的方案呢？答案就是微服务组件。

- 大家有没用发现，gin调用gprc的本质是什么？就是tcp/ip链接，在说清楚点就是只要有IP和port就能找到服务, 如下代码：

  ```go
  conn, err := grpc.Dial(fmt.Sprintf("%s:%d", "112.25.25.11", 8080))
  ```

  集群的其实也就是把用户服务部署多份，假设部署三个user-srv如下：

  - 112.25.25.10:8080 —-user-srv
  - 112.25.25.11:8080 —-user-srv
  - 112.25.25.12:8080 —-user-srv

  这个时候三个服务都正常的启动了。这个只需要有一个什么框架或者技术能够管理它们。

  - 管理它们的：上线，下线，是否有效健康。

  - 同时提供一个api方法，获取一个健康的服务给我即可，比如轮询或者随机获取一个健康的服务：

    112.25.25.11:8080 —-user-srv

  - 然后gin去调用gprc就是:112.25.25.11:8080 —-user-srv

    ```go
    conn, err := grpc.Dial(fmt.Sprintf("%s:%d", "112.25.25.11", 8080))
    ```

    如果获取的是112.25.25.12:8080 —-user-srv，那就是：

    ```go
    conn, err := grpc.Dial(fmt.Sprintf("%s:%d", "112.25.25.11", 8080))
    ```

  - 然后在采用一些负载均衡的算法，比如轮询，随机等。

  - 这样不同的用户请求用户服务接口，底层的gin调用grpc就是不停的给予一个健康的user-srv服务。

  是不是也可以完成nginx的事情，而且比使用nginx更加的放和快捷。这个微服务组件就是：服务注册和发现组件

## 常用的服务注册和发现组件有

- Eureka:
  开发者：Netflix
  特点：Eureka是一个基于REST的服务，用于定位服务以实现中间层服务器的负载平衡和故障转移。它的设计哲学是“注册中心为主”，服务实例先向Eureka注册，然后由客户端通过Eureka查询可用服务。
- Consul:
  开发者：HashiCorp
  特点：Consul提供了服务发现、健康检查、Key/Value配置、和多数据中心支持。它通过简单的HTTP API接口和DNS来提供服务注册与发现功能，支持服务网格配置。
- ZooKeeper:
  开发者：Apache软件基金会
  特点：虽然ZooKeeper不是专门设计用于服务发现的，但它提供了一个可靠的分布式协调存储系统，可以被用于跟踪服务实例的信息，从而实现服务发现和注册。
- Etcd:
  开发者：CoreOS
  特点：Etcd是一个高可用的键值存储，用于配置共享和服务发现。它基于RAFT协议，提供强一致性和分区容忍性，被广泛用于Kubernetes中作为其后端存储，支持服务发现。
- Nacos:
  开发者：阿里巴巴
  特点：Nacos提供服务发现、配置管理、服务管理等功能，支持动态服务发现和健康状态检测，适用于云原生应用场景。Nacos旨在帮助您发现、配置和管理微服务。

推荐：nacos和consul，追求高性能高一致性使用：Etcd ，目前能支持go的也只有这三个。后续课程会使用nacos来完成。



# Nacos完成服务注册和发现

## Nacos是什么

官网：https://nacos.io/

Nacos `/nɑ:kəʊs/` 是 Dynamic Naming and Configuration Service的首字母简称，一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。Nacos 致力于帮助您发现、配置和管理微服务。Nacos 提供了一组简单易用的特性集，帮助您快速实现动态服务发现、服务配置、服务元数据及流量管理。

Nacos 帮助您更敏捷和容易地构建、交付和管理微服务平台。 Nacos 是构建以“服务”为中心的现代应用架构 (例如微服务范式、云原生范式) 的服务基础设施。

## Nacos得下载和安装

1：准备工作

Nacos 依赖 [Java](https://docs.oracle.com/cd/E19182-01/820-7851/inst_cli_jdk_javahome_t/) 环境来运行。如果您是从代码开始构建并运行Nacos，还需要为此配置 [Maven](https://maven.apache.org/index.html)环境，请确保是在以下版本环境中安装使用:

1. 64 bit OS，支持 Linux/Unix/Mac/Windows，推荐选用 Linux/Unix/Mac。
2. 64 bit JDK 1.8+；[下载](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) & [配置](https://docs.oracle.com/cd/E19182-01/820-7851/inst_cli_jdk_javahome_t/)。
3. Maven 3.2.x+；[下载](https://maven.apache.org/download.cgi) & [配置](https://maven.apache.org/settings.html)。

2:  下载nacos

- 当下得最新版本是nacos2.3.2 。但是和go不兼容。建议下载低一个版本2.3.0

  下载地址：https://github.com/alibaba/nacos/releases 

  

- 然后解压`nacos-server-2.3.0.zip` 即可

- 然后找到nacos得bin目录，然后执行命令行启动nacos服务接口，启动命令如下：

  ==注：Nacos的运行建议至少在2C4G 60G的机器配置下运行。==

  - Windows
    启动命令(standalone代表着单机模式运行，非集群模式):

    ```sh
    startup.cmd -m standalone
    ```

    

  - Linux

    启动命令(standalone代表着单机模式运行，非集群模式):

    ```sh
    sh startup.sh -m standalone
    ```

- 启动成功以后，访问服务 `http://localhost:8848/nacos即可` ，8848是中国珠穆朗玛峰高度。以此而定义的端口。

  



## 02、配置账号和密码

在nacos的2.3以后隐藏了账号和密码的功能。需要自己在nacos的配置文件进行配置即可。

参考：https://blog.csdn.net/qfyh_djh/article/details/137006862

```properties
## 1）修改前
# nacos.core.auth.enabled=false
## 1）修改后：开启鉴权
nacos.core.auth.enabled=true

# 2）关闭使用 user-agent 判断服务端请求并放行鉴权的功能  
nacos.core.auth.enable.userAgentAuthWhite=false

## 3）修改前：
# nacos.core.auth.caching.enabled=false 
## 3）修改后：权限缓存开关，开启后权限缓存的更新默认有15秒的延迟，默认 : false
nacos.core.auth.caching.enabled=true


## 4）修改前
# nacos.core.auth.server.identity.key=
# nacos.core.auth.server.identity.value=
## 4）修改后 :   配置自定义身份识别的 key 和 value （不可为空）
nacos.core.auth.server.identity.key=nacos
nacos.core.auth.server.identity.value=nacos

## 5）修改前
nacos.core.auth.plugin.nacos.token.secret.key=
##  5）修改后：自定义用于生成JWT令牌的密钥，注意：原始密钥长度不得低于32字符，且一定要进行Base64编码，否则无法启动节点。
nacos.core.auth.plugin.nacos.token.secret.key=${NACOS_AUTH_TOKEN:SecretKey01234567890123456789012345345678999987654901234567890123456789}

```



## 04、完成Nacos管理用户服务

### 版本要求：

- go > 1.15
- nacos >2.x

### 具体代码

#### 1：安装go的nacos服务组件

官网文档：https://github.com/nacos-group/nacos-sdk-go

```go
go get -u github.com/nacos-group/nacos-sdk-go/v2
go get -u github.com/flairamos/go-component/nacos
```

#### 2:  完成用户服务的注册



核心代码如下：

```go
package micro

import (
	"fmt"
	"github.com/flairamos/go-component/nacos"
	"github.com/nacos-group/nacos-sdk-go/vo"
	"kuangstudy-mall/srvs/user-srv/global"
)

func InitNacosRegister() {
	port := global.Args.Port
	ip := global.Args.IP

	param := vo.RegisterInstanceParam{
		Ip:          *ip,
		Port:        *port,
		Enable:      true,
		Healthy:     true,
		Weight:      10,
		Metadata:    map[string]string{"version": "1.0"},
		ClusterName: "DEFAULT",
		GroupName:   "DEFAULT_GROUP",
		Ephemeral:   true,
		ServiceName: "kuangstudy-user-service",
	}
	config := nacos.DefaultClient("public", "mysql", "DEFAULT_GROUP", nil)
	service := nacos.RegisterInstance(config, param)
	if !service {
		fmt.Println("nacos register failed")
		return
	}
	fmt.Println("nacos register success")

}

```

记得在main.go中去初始化用户srv服务注册到nacos中，如下：



#### 3: 然后分别启动三个用户服务

先进入到服务编辑界面：



增加：user-srv的集群节点：9000



增加：user-srv的集群节点：9001



增加：user-srv的集群节点：9002



#### 4:可以看到nacos的服务注册中心用户服务有三个



点击详情进入，可以控制服务的上下线：



是不是很方便。如果某个用户服务节点出现了宕机或者故障，会自己上报告诉nacos服务停止了。nacos会自动下线和剔除这个服务。

#### 5：在用户api进行服务的发现即可。然后最后的调用

整体目录结构如下：



代码如下：

```go
package micro

import (
	"fmt"
	"github.com/flairamos/go-component/nacos"
	"github.com/nacos-group/nacos-sdk-go/vo"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"kuangstudy-mall/apis/user-web/proto"
)

func GetInitClient() proto.UserClient {
	config := nacos.DefaultClient("public", "regservice", "DEFAULT_GROUP", nil)
	// 从nacos中获取一个健康的服务即可
	instance, err2 := nacos.SelectOneHealthyInstance(config, vo.SelectOneHealthInstanceParam{
		ServiceName: "kuangstudy-user-service",
		Clusters:    []string{"DEFAULT"},
		GroupName:   "DEFAULT_GROUP",
	})

	if err2 != nil {
		panic(err2)
	}

	fmt.Println(fmt.Sprintf("nacos获取和管理的服务是：%s:%d", instance.Ip, instance.Port))
	conn, err := grpc.Dial(fmt.Sprintf("%s:%d", instance.Ip, instance.Port),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy": "round_robin"}`),
	)
	if err != nil {
		panic(err)
	}
	return proto.NewUserClient(conn)
}

```

#### 6：开始测试

- 正常请求：你会看到用户api 在不停的调用三个服务。而且是不同的服务。
- 如果这个时候下线一个user-srv。user-api就不会在调用了。会在nacos中标识下线了。这个在调用的刹那没下线这个时候服务就会出现500。这个情况还是会出现的，所以要容错处理。后续组件hystrix来完成的事情。

底层代码其实是一种：权重的区间范围随时轮询策略：

```go
func (a instances) Less(i, j int) bool {
	return a[i].Weight < a[j].Weight
}

//比如三个节点：

// NewChooser initializes a new Chooser for picking from the provided Choices.
func newChooser(instances instances) Chooser {
    // 根据实例端口排序：9000 9001 9002
	sort.Sort(instances)
	totals := make([]int, len(instances))
	runningTotal := 0
	for i, c := range instances {
		runningTotal += int(c.Weight)
		totals[i] = runningTotal
	}
    // 循环以后：
    //9000---weight:10
    //9000---weight:20
    //9000---weight:30
    // runningTotal = max = 30 
	return Chooser{data: instances, totals: totals, max: runningTotal}
}

func (chs Chooser) pick() model.Instance {
	r := rand.Intn(chs.max) + 1 // 在最大值30取一个随机数
	i := sort.SearchInts(chs.totals, r)// 最关键的地方来了，这个地方底层是二分法查找，会在10 <= 20 <==== 30 之间进行比对，如果小于等于10 i = 0  如果小于等于20 i = 1 如果小于等于30 i =2  
	return chs.data[i] // 然后获根据索引获取一个服务实例出来
}

```

