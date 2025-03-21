---
index: false
title: 消息组件
icon: /assets/icon/MQ.png
---

## 目录



<br>



- [EMQX](/middleware/消息组件/EMQX.md)
- [RocketMQ](/middleware/消息组件/RocketMQ.md)
- [Kafka](/middleware/消息组件/kafka.md)



<br>

<br>

<br>

### 技术选型

消息队列（MQ）是指利用消息进行通信或交换的中间件产品，是分布式系统常用的组件之一。典型的消息队列有ActiveMQ、RabbitMQ、RocketMQ等。它们的差异主要体现在三个方面：

### 消息队列的作用

- 1、应用耦合：多应用间通过消息队列对同一消息进行处理，避免调用接口失败导致整个过程失败；
- 2、异步处理：多应用对消息队列中同一消息进行处理，应用间并发处理消息，相比串行处理，减少处理时间；
- 3、限流削峰：广泛应用于秒杀或抢购活动中，避免流量过大导致应用系统挂掉的情况；
- 4、消息驱动的系统：系统分为消息队列、消息生产者、消息消费者，生产者负责产生消息，消费者(可能有多个)负责对消息进行处理；

*首先选择消息队列要满足以下几个条件：*

:::tip

- 1、开源
- 2、流行
- 3、兼容性强

消息队列需要：

- 1、消息的可靠传递：确保不丢消息；
- 2、Cluster：支持集群，确保不会因为某个节点宕机导致服务不可用，当然也不能丢消息；
- 3、性能：具备足够好的性能，能满足绝大多数场景的性能要求。

:::

### RabbitMQ

RabbitMQ 2007年发布，是一个在 AMQP (高级消息队列协议)基础上完成的，可复用的企业消息系统，是当前最主流的消息中间件之一。

**优点**

1、RabbitMQ 的特点 Messaging that just works，“开箱即用的消息队列”。 RabbitMQ 是一个相对轻量的消息队列，非常容易部署和使用；

2、多种协议的支持：支持多种消息队列协议，算得上是最流行的消息队列之一；

3、灵活的路由配置，和其他消息队列不同的是，它在生产者 （Producer）和队列（Queue）之间增加了一个Exchange模块，你可以理解为交换机。这个Exchange模块的作用和交换机也非常相似，根据配置的路由规则将生产者发出的消息分发到不同的队 列中。路由的规则也非常灵活，甚至你可以自己来实现路由规则。

4、健壮、稳定、易用、跨平台、支持多种语言、文档齐全，RabbitMQ的客户端支持的编程语言大概是所有消息队列中最多的；

5、管理界面较丰富，在互联网公司也有较大规模的应用；

6、社区比较活跃。

**缺点**

1、RabbitMQ 对消息堆积的处理不好，在它的设计理念里面，消息队列是一个管道，大量的消息积压是一种不正常的情况，应当尽量去避免。当大量消息积压的时候，会导致RabbitMQ的性能急剧下降；

2、性能上有瓶颈，它大概每秒钟可以处理几万到十几万条消息，这个对于大多数场景足够使用了，如果对需求对性能要求非常高，那么就不太合适了。

3、RabbitMQ 使用 Erlang。开发，Erlang 的学习成本还是很高的，如果后期进行二次开发，就不太容易了。

### RocketMQ

RocketMQ出自阿里公司的开源产品，用 Java 语言实现，在设计时参考了 Kafka，并做出了自己的一些改进，消息可靠性上比 Kafka 更好。经历过多次双十一的考验，性能和稳定性还是值得信赖的，RocketMQ在阿里集团被广泛应用在订单，交易，充值，流计算，消息推送，日志流式处理，binglog分发等场景。

**优点**

1、单机吞吐量：十万级；

2、可用性：非常高，分布式架构；

3、消息可靠性：经过参数优化配置，消息可以做到0丢失，RocketMQ 的所有消息都是持久化的，先写入系统 PAGECACHE，然后刷盘，可以保证内存与磁盘都有一份数据；

4、功能支持：MQ功能较为完善，还是分布式的，扩展性好；

5、支持10亿级别的消息堆积，不会因为堆积导致性能下降；

6、源码是java，我们可以自己阅读源码，定制自己公司的MQ，可以掌控。

**缺点**

1、支持的客户端语言不多，目前是 java 及 c++，其中 c++ 不成熟；

2、社区活跃度一般，作为国产的消息队列，相比国外的比较流行的同类产品，在国际上还没有那么流行，与周边生态系统的集成和兼容程度要略逊一筹；

3、没有在 mq 核心中去实现 JMS 等接口，有些系统要迁移需要修改大量代码。

### Kafka

Apache Kafka是一个分布式消息发布订阅系统。它最初由LinkedIn公司基于独特的设计实现为一个分布式的提交日志系统( a distributed commit log)，之后成为Apache项目的一部分。

这是一款为大数据而生的消息中间件，在数据采集、传输、存储的过程中发挥着举足轻重的作用。

**优点**

1、性能卓越，单机写入TPS约在百万条/秒，最大的优点，就是吞吐量高；

2、性能卓越，单机写入TPS约在百万条/秒，消息大小10个字节；

3、可用性：非常高，Kafka是分布式的，一个数据多个副本，少数机器宕机，不会丢失数据，不会导致不可用；

4、消费者采用Pull方式获取消息, 消息有序, 通过控制能够保证所有消息被消费且仅被消费一次;

5、有优秀的第三方Kafka Web管理界面Kafka-Manager；

6、在日志领域比较成熟，被多家公司和多个开源项目使用；

7、功能支持：功能较为简单，主要支持简单的MQ功能，在大数据领域的实时计算以及日志采集被大规模使用

**缺点**

由于“攒一波再处理”导致延迟比较高

### Pulsar

Pulsar 是一个用于服务器到服务器的消息系统，具有多租户、高性能等优势。 Pulsar 最初由 Yahoo 开发，目前由 Apache 软件基金会管理。

**优点**

1、更多功能：Pulsar Function、多租户、Schema registry、n 层存储、多种消费模式和持久性模式等；

2、Pulsar 的单个实例原生支持多个集群，可跨机房在集群间无缝地完成消息复制；

3、极低的发布延迟和端到端延迟；

4、可无缝扩展到超过一百万个 topic；

5、简单的客户端 API，支持 Java、Go、Python 和 C++。

6、Pulsar 的单个实例原生支持多个集群，可跨机房在集群间无缝地完成消息复制。

**缺点**

正处于成长期，流行度和成熟度相对没有那么高

### 2.3、如何选择合适的消息队列

- 如果对于消息队列的功能和性能要求不是很高，那么RabbitMQ就够了，开箱即用。

- 如果系统使用消息队列主要场景是处理在线业务，比如在交易系统中用消息队列传递订单，RocketMQ 的低延迟和金融级的稳定性就可以满足。

- 要处理海量的消息，像收集日志、监控信息或是前端的埋点这类数据，或是你的应用场景大量使用 了大数据、流计算相关的开源产品，那 Kafka 就是最合适的了。

- 如果数据量很大，同时不希望有 Kafka 的高延迟，刚好业务场景是金融场景。RocketMQ 对 Topic 运营不太友好，特别是不支持按 Topic 删除失效消息，以及不具备宕机 Failover 能力。那么 Pulsar 可能就是你的一个选择了。



<br>



| 维度                    | RabbitMQ               | Kafka                     | RocketMQ                     | EMQX                     |
| ----------------------- | ---------------------- | ------------------------- | ---------------------------- | ------------------------ |
| `开发语言`              | Erlang                 | Scala/Java                | Java                         | Erlang                   |
| `单机吞吐`              | 万级/秒                | 十万级/秒                 | 万级/秒                      | 万级/秒                  |
| `延迟`                  | 微妙级                 | 毫秒级                    | 毫秒级                       | 亚毫秒级                 |
| `单机支持队列数/连接数` | 数万/数万              | 数千（topic分区）/十万级  | 数万/数万                    | 不适用/百万级            |
| `消息协议`              | amqp、mqtt、stomq      | 自定义协议                | 自定义协议                   | mqtt                     |
| `易用性`                | 可视化界面，操作简单   | 命令行+开源工具，操作中等 | 控制台，操作中等             | 企业版有可视化，操作简单 |
| `适用场景`              | 中小规模企业级消息服务 | 大规模日志处理、流计算    | 中大规模的金融交易、订单处理 | 物联网中的实时通讯       |

<br>

:::tip

EMQX是基于MQTT协议，使用主题(Topic)而不是队列来组织消息，为此没有队列数说法

:::

