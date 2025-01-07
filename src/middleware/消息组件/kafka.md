---
# 这是文章的标题
title: -Kafka


# 这是侧边栏的顺序
order: 1
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2020-01-01

# 一个页面可以有多个标签
tag:
  - mq

# 此页面会出现在星标文章中
star: true
---

  

这个版本就渐进式了解kafka

假设两个服务：A和B

B服务处理消息能力是100qps、但是A服务可发送200pqs，这么多的消息请求过来B服务很容易跨掉，那如何可用做的A可用正常产生这么多消息，B不被压垮并处理掉A的消息呢？



加一层**中间层 -- 消息队列kafka**



![kafka_simper1](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_simper1.jpeg)

先总结一些：

- kafka 是消息队列，像消息队列投递消息的是生产者，消费消息的是消费者。增加生产者和消费者的实例个数可以提升系统吞吐。多个消费者可以组成一个消费者组，不同消费者组维护自己的消费进度，互不打搅。
- kafka 将消息分为多个 topic，每个 topic 内部拆分为多个 partition，每个 partition 又有自己的副本，不同的 partition 会分布在不同的 broker 上，提升性能的同时，还增加了系统可用性和可扩展性。



## 什么是消息队列



我们首先可用想到的是在B服务中单独加一个队列，存储和消费消息,然后队列可用通过链表的结构，用一个offset定位处理的位置，这样B根据能力进行处理，执行完一个移动offset位置即可

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/mq_simper1.jpeg" alt="mq_simper1" style="zoom:40%;" />

![mq_simperOffset](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/mq_simperOffset.jpeg)

上面这个还有一个问题：若是B服务会奔溃。消息直接全部丢失，那怎么解决呢？



用一个服务单独处理这些消息队列，即使B服务挂了也不影响。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/mq_simperOneServer.jpeg" alt="mq_simperOneServer" style="zoom:50%;" />

![mq_simperProducerConsumer](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/mq_simperProducerConsumer.jpeg)

但这个只是一个简陋的消息组件，并没有高可用可性能高扩展的特性，下面开始优化



## 高性能



若是单个A和B的话，这个消息队列的吞吐量是很受限的，性能会很差，且消息队列会一直堆积直到奔溃，这么解决？

解决方案：增加A和B的数量、将队列按topic拆分、一个topic继续拆分为Partiton让一个B对应一个Partition

@slidestart

- 提升性能，我们可用扩展多个消费者和生产者，这样消息队列的吞吐量就上去了

  ![mq_simper2](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/mq_simper2.jpeg)

---

- 消息队列有点多，就将消息队列按照topic进行分类，比如topic1、topic2等等，减低topic压力

![mq_simper3](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/mq_simper3.jpeg)

---

- 单个topic还是有点多，单个topic拆分几段，每段就是一个partition分区，每个消费者负责一个partition

  ![kafka_simperPartition](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_simperPartition.jpeg)

@slideend











## 高扩展

随着 partition 变多，如果 partition 都在同一台机器上的话，就会导致单机 cpu 和内存过高影响整体系统性能。

继续优化：申请更多设备，然后将partition分散部署到多个设备。这样拆分一个机器就是一个broker来缓解

![image-20250103181643832](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_simperBroker.png)

## 高可用

上面这个还存在问题：若是一个partition所在的broker挂了，那里面的消息不直接丢失了嘛，就扯不上高可用了。

解决方案：怕丢失都会想到多做备份嘛，然后可用考虑分布式存储系统使用的raft算法，来保证单个节点故障时保证一致性和高可用性

我们可用为partition做一些副本，也就是replicas，并将这些分为Leader和Follower

- leader：负责生产者和消费者的读写请求
- Follower：只管同步leader的消息

@slidestart

- 正常运行时，follower会一直同步leader的消息（做备份）

  ![kafka_simperReplicas](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_simperReplicas.jpeg)

  

---

- Leader所在的broker挂了，会从Follower选举一个作为leader继续工作

![kafka_simperAva](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_simperAva.jpeg)

@slideend





## 持久化和过期策略

若是挂一个broker还可用继续可用，那极端点，所有都挂了呢？数据直接丢失了

为此还是要额外将数据存储到磁盘中去做持久化，这样重启依旧可继续工作

那还会有问题：数据一直存储的话磁盘会奔溃，为此还有给一个保存的策略 --  retention policy（比如超过大小或者超过一定的时限就会清除掉）







 

## zookeeper

好像上面组件太多了，而且每个组件都有自己的数据和状态，所以还需要有个组件去统一维护这些组件的状态信息，于是我们引入 **ZooKeeper** 组件。通过定期于broker通信获取整个集群的状态，判断哪些broker可用

![kafka_simperZookeeper](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_simperZookeeper.jpeg)

## Kafka是什么？

到这里，当初那个简陋的消息队列，就成了一个高性能，高扩展性，高可用，支持持久化的超强消息队列，没错，它就是我们常说的消息队列 **Kafka**，上面涉及到各种概念，比如 partition 和 broker 什么的，都出自它。

![kafka_simperKafka](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_simperKafka.jpeg)



## kafka的使用场景

消息队列是架构中最常见的中间件之一，使用场景之多，堪称万金油！
比如上游流量忽高忽低，想要**削峰填谷**，提升 cpu/gpu 利用率，用它。
又比如系统过大，消息流向盘根错节，想要拆解组件，**降低系统耦合**，还是用它。
再比如秒杀活动，请求激增，想要**保护服务**的同时又尽量不影响用户，还得用它。
当然，凡事无绝对，方案还得根据实际情况来定，做架构做到最后，都是在做**折中**
