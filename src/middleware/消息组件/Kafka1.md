# 01、消息队列与Kafka

## 01、Kafka简介

- Kafka使用scala开发，支持多语言客户端（c++、java、python、go等）
- Kafka最先由LinkedIn公司开发，之后成为Apache的顶级项目。
- Kafka是一个==分布式的、分区化、==可复制提交的日志服务
- LinkedIn使用Kafka实现了公司不同应用程序之间的松耦和，那么作为一个可扩展、高可靠的消息系统 支持高Throughput的应用

- scale out：无需停机即可扩展机器

- 持久化：通过将数据持久化到硬盘以及replication防止数据丢失

- 支持online和offline的场景

##  02、Kafka的特点

Apache Kafka是一种高吞吐量的分布式发布订阅消息系统，它最初是由Linkedin开发，之后成为了Apache项目的一部分。其具有以下几个特点：

1. 面向记录（Message Oriented）: 支持不同的数据类型，允许每个记录包含多个字段；
2. 可扩展性：支持水平可伸缩性，可以动态增加分区数；
3. 容错性：支持持久化日志，提供零丢失保证；
4. 消息顺序：生产者发送的消息将严格按照顺序存储到对应的分区，消费者接收到的消息也将按照先进先出的顺序消费；
5. 分布式：跨多台服务器部署，能提供更高的吞吐量和容错性；
6. 时效性：通过自动复制机制确保消息在不间断的时间段内传递到所有副本，保证了可靠性；
7. API友好：提供多种编程接口，包括Java、Scala、C/C++、Python等。

总之，Kafka是一个用于构建实时数据管道和可靠的数据传输系统的优秀工具。本文只涉及到其中几方面的内容，比如消息的存储、分发、发布、消费、可靠性保证等。

- Kafka是分布式的，其所有的构件borker(服务端集群)、producer(消息生产)、consumer(消息消费者)都可以是分布式的。
- 在消息的生产时可以使用一个标识topic来区分，且可以进行分区；每一个分区都是一个顺序的、不可变的消息队列， 并且可以持续的添加。
- 同时为发布和订阅提供高吞吐量。据了解，Kafka每秒可以生产约25万消息（50 MB），每秒处理55万消息（110 MB）。
- 消息被处理的状态是在consumer端维护，而不是由server端维护。当失败时能自动平衡



## 03、常用的场景

1、监控：主机通过Kafka发送与系统和应用程序健康相关的指标，然后这些信息会被收集和处理从而创建监控仪表盘并发送警告。

2、消息队列： 应用程度使用Kafka作为传统的消息系统实现标准的队列和消息的发布—订阅，例如搜索和内容提要（Content Feed）。比起大多数的消息系统来说，Kafka有更好的吞吐量，内置的分区，冗余及容错性，这让Kafka成为了一个很好的大规模消息处理应用的解决方案。消息系统 一般吞吐量相对较低，但是需要更小的端到端延时，并尝尝依赖于Kafka提供的强大的持久性保障。在这个领域，Kafka足以媲美传统消息系统，如ActiveMR或RabbitMQ

3、站点的用户活动追踪: 为了更好地理解用户行为，改善用户体验，将用户查看了哪个页面、点击了哪些内容等信息发送到每个数据中心的Kafka集群上，并通过Hadoop进行分析、生成日常报告。

4、流处理：保存收集流数据，以提供之后对接的Storm或其他流式计算框架进行处理。很多用户会将那些从原始topic来的数据进行 阶段性处理，汇总，扩充或者以其他的方式转换到新的topic下再继续后面的处理。例如一个文章推荐的处理流程，可能是先从RSS数据源中抓取文章的内 容，然后将其丢入一个叫做“文章”的topic中；后续操作可能是需要对这个内容进行清理，比如回复正常数据或者删除重复数据，最后再将内容匹配的结果返 还给用户。这就在一个独立的topic之外，产生了一系列的实时数据处理的流程。

5、日志聚合:使用Kafka代替日志聚合（log aggregation）。日志聚合一般来说是从服务器上收集日志文件，然后放到一个集中的位置（文件服务器或HDFS）进行处理。然而Kafka忽略掉 文件的细节，将其更清晰地抽象成一个个日志或事件的消息流。这就让Kafka处理过程延迟更低，更容易支持多数据源和分布式数据处理。比起以日志为中心的 系统比如Scribe或者Flume来说，Kafka提供同样高效的性能和因为复制导致的更高的耐用性保证，以及更低的端到端延迟

6、持久性日志：Kafka可以为一种外部的持久性日志的分布式系统提供服务。这种日志可以在节点间备份数据，并为故障节点数据回复提供一种重新同步的机制。Kafka中日志压缩功能为这种用法提供了条件。在这种用法中，Kafka类似于Apache BookKeeper项目。







# 02、Kafka基本概念

## 2.1、 Kafka的基本角色

Kafka中的生产过程设计多个概念的配合，理清这些概念的关系，有利于理解Kafka的生产机制。

| 角色        | 作用                                                         |
| ----------- | ------------------------------------------------------------ |
| producer    | 生产消息，向Kafka推送消息，非Kafka组件之一                   |
| topic       | 逻辑概念，用于组织一类消息                                   |
| broker      | broker运行着Kafka实例                                        |
| partition   | 存储同一个topic的分区（多个分区共同存储一个topic的消息）     |
| replication | partition的副本，为保证稳定性，同一个partition需要在不同broker上设置备份 |
| leader      | partition的众多replication的一个，生产方向其中写入，消费方从中读取 |
| follower    | partition除leader外的replication。用于备份partition的内容保证稳定性 |

下图直观反映了Kafka的各种概念的关系。

![img](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_concept.jpg)

- Producer：Producer即生产者，消息的产生者，是消息的入口。

- Kafka cluster：Kafka集群，一台或多台服务器组成

  - Broker：Broker是指部署了Kafka实例的服务器节点。每个服务器上有一个或多个Kafka的实 例，我们姑且认为每个broker对应一台服务器。每个Kafka集群内的broker都有一个不重复的 编号，如图中的broker-0、broker-1等……

  - Topic：消息的主题，可以理解为消息的分类，Kafka的数据就保存在topic。在每个broker上 都可以创建多个topic。实际应用中通常是一个业务线建一个topic。

  - Partition：Topic的分区，每个topic可以有多个分区，分区的作用是做负载，提高Kafka的吞 吐量。同一个topic在不同的分区的数据是不重复的，partition的表现形式就是一个一个的文件夹！

  - Replication:每一个分区都有多个副本，副本的作用是做备胎。当主分区（Leader）故障的 时候会选择一个备胎（Follower）上位，成为Leader。在Kafka中默认副本的最大数量是10 个，且副本的数量不能大于Broker的数量，follower和leader绝对是在不同的机器，同一机 器对同一个分区也只可能存放一个副本（包括自己）。

- Consumer：消费者，即消息的消费方，是消息的出口。
  - Consumer Group：我们可以将多个消费组组成一个消费者组，在Kafka的设计中同一个分 区的数据只能被消费者组中的某一个消费者消费。同一个消费者组的消费者可以消费同一个 topic的不同分区的数据，这也是为了提高Kafka的吞吐量！





## 2.2、zookeeper在Kafka中的角色

zookeeper为大型分布式计算提供开源的分布式配置服务、同步服务和命名注册。它可以保证一致性和分区容错性，在Kafka中zookeeper为broker，producer和consumer提供一致的配置信息。在下面的讲解中我们将会具体展示。

- produce会计算本条消息需要发送的partition。
- produce根据发送的分区，向zookeeper获取对应partition的leader信息，发送消息到leader所在的broker。
- leader在本地记录该消息。
- follower通过轮询监控到leader新写入消息，主动拉取消息。
- follower同步消息成功向leader发送ack。
- leader收到所有follower同步的消息，向producer发送确认ack。

![producer生产过程](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_zookeeper_work.png)





# 03、Kafka工作流程

### 3.1 工作流程

我们看上面的架构图中，producer就是生产者，是数据的入口。Producer在写入数据的时候会把数据 写入到leader中，不会直接将数据写入follower！那leader怎么找呢？写入的流程又是什么样的呢？我 们看下图：

![img](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kafka_work.jpg)

- 1.生产者从Kafka集群获取分区leader信息
- 2.生产者将消息发送给leader
- 3.leader将消息写入本地磁盘
- 4.follower从leader拉取消息数据
- 5.follower将消息写入本地磁盘后向leader发送ACK
- 6.leader收到所有的follower的ACK之后向生产者发送ACK



### 3.2 选择partition的原则

那在Kafka中，如果某个topic有多个partition，producer⼜怎么知道该将数据发往哪个partition呢？ Kafka中有几个原则：

1.partition在写入的时候可以指定需要写入的partition，如果有指定，则写入对应的partition。

2.如果没有指定partition，但是设置了数据的key，则会根据key的值hash出一个partition。

3.如果既没指定partition，又没有设置key，则会采用轮询方式，即每次取一小段时间的数据写入某partition，下一小段的时间写入下一个partition



### 3.3 ACK应答机制

producer在向Kafka写入消息的时候，可以设置参数来确定是否确认Kafka接收到数据，这个参数可设置 的值为 0,1,all

- 0代表producer往集群发送数据不需要等到集群的返回，不确保消息发送成功。安全性最低但是效 率最高。
- 1代表producer往集群发送数据只要leader应答就可以发送下一条，只确保leader发送成功。
- all代表producer往集群发送数据需要所有的follower都完成从leader的同步才会发送下一条，确保 leader发送成功和所有的副本都完成备份。安全性最⾼高，但是效率最低。

最后要注意的是，如果往不存在的topic写数据，Kafka会自动创建topic，partition和replication的数量 默认配置都是1。



### 3.4 Topic和数据日志

topic 是同⼀类别的消息记录（record）的集合。在Kafka中，⼀个主题通常有多个订阅者。对于每个 主题，Kafka集群维护了⼀个分区数据日志文件结构如下：

![img](assets/f7d39a2c96e617d520d73924fc987b9c.jpg)

每个partition都是⼀个有序并且不可变的消息记录集合。当新的数据写入时，就被追加到partition的末 尾。在每个partition中，每条消息都会被分配⼀个顺序的唯⼀标识，这个标识被称为offset，即偏移 量。注意，Kafka只保证在同⼀个partition内部消息是有序的，在不同partition之间，并不能保证消息 有序。

Kafka可以配置⼀个保留期限，用来标识日志会在Kafka集群内保留多⻓时间。Kafka集群会保留在保留 期限内所有被发布的消息，不管这些消息是否被消费过。比如保留期限设置为两天，那么数据被发布到 Kafka集群的两天以内，所有的这些数据都可以被消费。当超过两天，这些数据将会被清空，以便为后 续的数据腾出空间。由于Kafka会将数据进行持久化存储（即写入到硬盘上），所以保留的数据⼤小可以设置为⼀个比较⼤的值。



### 3.5 Partition结构

Partition在服务器上的表现形式就是⼀个⼀个的文件夹，每个partition的文件夹下面会有多组segment 文件，每组segment文件⼜包含 .index 文件、 .log 文件、 .timeindex 文件三个文件，其中 .log 文 件就是实际存储message的地方，⽽ .index 和 .timeindex 文件为索引文件，用于检索消息。



### 3.6 消费数据

多个消费者实例可以组成⼀个消费者组，并用⼀个标签来标识这个消费者组。⼀个消费者组中的不同消 费者实例可以运行在不同的进程甚⾄不同的服务器上。

如果所有的消费者实例都在同⼀个消费者组中，那么消息记录会被很好的均衡的发送到每个消费者实 例。

如果所有的消费者实例都在不同的消费者组，那么每⼀条消息记录会被⼴播到每⼀个消费者实例。

![img](assets/cf7313e2ee2269c112983caa1ba3c8cd.jpg)

举个例⼦，如上图所示⼀个两个节点的Kafka集群上拥有⼀个四个partition（P0-P3）的topic。有两个 消费者组都在消费这个topic中的数据，消费者组A有两个消费者实例，消费者组B有四个消费者实例。 从图中我们可以看到，在同⼀个消费者组中，每个消费者实例可以消费多个分区，但是每个分区最多只 能被消费者组中的⼀个实例消费。也就是说，如果有⼀个4个分区的主题，那么消费者组中最多只能有4 个消费者实例去消费，多出来的都不会被分配到分区。其实这也很好理解，如果允许两个消费者实例同 时消费同⼀个分区，那么就⽆法记录这个分区被这个消费者组消费的offset了。如果在消费者组中动态 的上线或下线消费者，那么Kafka集群会自动调整分区与消费者实例间的对应关系。



# 04、Kafka的安装

## 1、下载与安装Kafka

Kafka官网https://Kafka.apache.org/downloads

![image-20231115005406983](assets/image-20231115005406983.png)

所以这里推荐的版本是 : https://archive.apache.org/dist/kafka/2.7.2/kafka_2.12-2.7.2.tgz

将下载下来的安装包直接解压到一个路径下即可完成Kafka的安装，这里统一将Kafka安装到/usr/local目录下

基本操作过程如下：

```bash
mkdir -p /www/kuangstudy
cd /www/kuangstudy
wget https://archive.apache.org/dist/kafka/2.7.2/kafka_2.12-2.7.2.tgz
tar -zxvf kafka_2.12-2.7.2.tgz -C /usr/local/
mv /usr/local/kafka_2.12-2.7.2 /usr/local/kafka
#新建存放日志和数据的文件夹
mkdir /usr/local/kafka/logs
```

这里我们将Kafka安装到了**/usr/local**目录下。

## 2、配置Kafka

这里将Kafka安装到/usr/local目录下

因此，Kafka的主配置文件为/usr/local/Kafka/config/server.properties，这里以节点Kafkazk1为例，重点介绍一些常用配置项的含义：

```bash
broker.id=1
listeners=PLAINTEXT://127.0.0.1:9092
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.dirs=/usr/local/Kafka/logs
num.partitions=6
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
zookeeper.connect=localhost:2181
#不是集群，所以可以写成localhost
#zookeeper.connect=127.0.0.1:2181,10.0.0.7:2181,10.0.0.8:2181
zookeeper.connection.timeout.ms=18000
group.initial.rebalance.delay.ms=0
auto.create.topics.enable=true
delete.topic.enable=true
```

每个配置项含义如下：

- `broker.id`：每一个broker在集群中的唯一表示，要求是正数。当该服务器的IP地址发生改变时，broker.id没有变化，则不会影响consumers的消息情况。

- `listeners`：设置Kafka的监听地址与端口，可以将监听地址设置为主机名或IP地址，这里将监听地址设置为IP地址。

- `log.dirs`：这个参数用于配置Kafka保存数据的位置，Kafka中所有的消息都会存在这个目录下。可以通过逗号来指定多个路径， Kafka会根据最少被使用的原则选择目录分配新的parition。需要注意的是，Kafka在分配parition的时候选择的规则不是按照磁盘的空间大小来定的，而是根据分配的 parition的个数多小而定。

- `num.partitions`：这个参数用于设置新创建的topic有多少个分区，可以根据消费者实际情况配置，配置过小会影响消费性能。这里配置6个。

- `log.retention.hours`：这个参数用于配置Kafka中消息保存的时间，还支持log.retention.minutes和 log.retention.ms配置项。这三个参数都会控制删除过期数据的时间，推荐使用log.retention.ms。如果多个同时设置，那么会选择最小的那个。

- `log.segment.bytes`：配置partition中每个segment数据文件的大小，默认是1GB，超过这个大小会自动创建一个新的segment file。

- ```
  zookeeper.connect
  ```

  ：这个参数用于指定zookeeper所在的地址，它存储了broker的元信息。 这个值可以通过逗号设置多个值，每个值的格式均为：hostname:port/path，每个部分的含义如下：

  - **hostname**：表示zookeeper服务器的主机名或者IP地址，这里设置为IP地址。
  - **port**： 表示是zookeeper服务器监听连接的端口号。
  - **/path**：表示Kafka在zookeeper上的根目录。如果不设置，会使用根目录。

- `auto.create.topics.enable`：这个参数用于设置是否自动创建topic，如果请求一个topic时发现还没有创建， Kafka会在broker上自动创建一个topic，如果需要严格的控制topic的创建，那么可以设置auto.create.topics.enable为false，禁止自动创建topic。

- `delete.topic.enable`：在0.8.2版本之后，Kafka提供了删除topic的功能，但是默认并不会直接将topic数据物理删除。如果要从物理上删除（即删除topic后，数据文件也会一同删除），就需要设置此配置项为true。

## 3、添加环境变量

```bash
$ vim /etc/profile
export kafka_HOME=/usr/local/kafka
export PATH=$PATH:$kafka_HOME/bin
#生效
$ source /etc/profile
```

## zookeeper服务的启动

```sh
cd /usr/local/kafka/bin
# 占用启动
./zookeeper-server-start.sh /usr/local/kafka/config/zookeeper.properties &
# 后台启动
nohup ./zookeeper-server-start.sh /usr/local/kafka/config/zookeeper.properties &
```



## 4、Kafka启动脚本

```bash
$ vim /usr/lib/systemd/system/kafka.service

[Unit]
Description=Apache kafka server (broker)
After=network.target  zookeeper.service

[Service]
Type=simple
User=root
Group=root
ExecStart=/usr/local/kafka/bin/kafka-server-start.sh /usr/local/kafka/config/server.properties
ExecStop=/usr/local/kafka/bin/kafka-server-stop.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target

```

```sh
systemctl daemon-reload
```



## 5、启动Kafka

在启动Kafka集群前，需要确保ZooKeeper集群已经正常启动。接着，依次在Kafka各个节点上执行如下命令即可：

```bash
$ cd /usr/local/kafka
$ nohup bin/kafka-server-start.sh config/server.properties &

# 或者

$ systemctl start kafka
$ jps
21840 kafka
15593 Jps
15789 QuorumPeerMain
```

这里将Kafka放到后台运行，启动后，会在启动Kafka的当前目录下生成一个nohup.out文件，可通过此文件查看Kafka的启动和运行状态。通过jps指令，可以看到有个Kafka标识，这是Kafka进程成功启动的标志。

## 6、测试Kafka基本命令操作

kefka提供了多个命令用于查看、创建、修改、删除topic信息，也可以通过命令测试如何生产消息、消费消息等，这些命令位于Kafka安装目录的bin目录下，这里是**/usr/local/Kafka/bin**。

登录任意一台Kafka集群节点，切换到此目录下，即可进行命令操作。



下面列举Kafka的一些常用命令的使用方法。
（1）显示topic列表

```bash
#kafka-topics.sh  --zookeeper 127.0.0.1:2181,10.0.0.7:2181,10.0.0.8:2181 --list
$ kafka-topics.sh  --zookeeper 127.0.0.1:2181 --list
topic123
```

（2）创建一个topic，并指定topic属性（副本数、分区数等）

```bash
#kafka-topics.sh --create --zookeeper 127.0.0.1:2181,10.0.0.7:2181,10.0.0.8:2181 --replication-factor 1 --partitions 3 --topic topic123 
$ kafka-topics.sh --create --zookeeper 127.0.0.1:2181 --replication-factor 1 --partitions 3 --topic topic123
Created topic topic123.
#--replication-factor表示指定副本的个数
```

（3）查看某个topic的状态

```bash
#kafka-topics.sh --describe --zookeeper 127.0.0.1:2181,10.0.0.7:2181,10.0.0.8:2181 --topic topic123
$ kafka-topics.sh --describe --zookeeper 127.0.0.1:2181 --topic topic123
Topic: topic123	PartitionCount: 3	ReplicationFactor: 1	Configs: 
	Topic: topic123	Partition: 0	Leader: 1	Replicas: 1	Isr: 1
	Topic: topic123	Partition: 1	Leader: 1	Replicas: 1	Isr: 1
	Topic: topic123	Partition: 2	Leader: 1	Replicas: 1	Isr: 1
```

（4）生产消息 阻塞状态

```bash
#kafka-console-producer.sh --broker-list 127.0.0.1:9092,10.0.0.7:9092,10.0.0.8:9092 --topic topic123
$ kafka-console-producer.sh --broker-list 127.0.0.1:9092 --topic topic123
```

（5）消费消息 阻塞状态

```bash
#kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092,10.0.0.7:9092,10.0.0.8:9092 --topic topic123
$ kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092 --topic topic123
#从头开始消费消息
#Kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092 --topic topic123 --from-beginning
$ kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092,10.0.0.7:9092,10.0.0.8:9092 --topic topic123 --from-beginning
```

（6）删除topic

```bash
#kafka-topics.sh --delete --zookeeper 127.0.0.1:2181,10.0.0.7:2181,10.0.0.8:2181 --topic topic123
$ kafka-topics.sh --delete --zookeeper 127.0.0.1:2181 --topic topic_
```









# 05、GO整合Kafka实现消息发送和订阅

### 4.1 消息生产代码示例

```go
package main

import (
	"fmt"
	"github.com/IBM/sarama"
)

func main() {
	// 配置生产者信息
	conf := sarama.NewConfig()
	conf.Producer.RequiredAcks = sarama.WaitForAll // 生产者等待所有分区副本成功提交消息
	conf.Producer.Return.Successes = true          // 成功消息写入返回
	client, err := sarama.NewSyncProducer([]string{"47.115.230.36:9092"}, conf)
	if nil != err {
		fmt.Println("create Kafka sync producer failed", err)
		return
	}
	defer client.Close()

	msg := &sarama.ProducerMessage{
		Topic: "topic123",                          // 指定消息主题
		Value: sarama.StringEncoder("hello world"), // 构造消息
	}

	// 发送消息
	_, _, err = client.SendMessage(msg)
	if nil != err {
		fmt.Println("send message to Kafka failed", err)
		return
	}
	fmt.Println("send message success")
}

```

### 4.2 消息消费代码示例

```go
package main

import (
	"fmt"
	"github.com/IBM/sarama"
)

/**
 * @desc 生产者
 * @author feige
 * @date 2023-11-15
 * @version 1.0
 */
func main() {
	// 创建一个消费者
	consumer, err := sarama.NewConsumer([]string{"47.115.230.36:9092"}, nil)
	if err != nil {
		fmt.Println("消费者kafka连接服务失败，失败的原因：", err)
		return
	}
	// 从topic123这个主题去获取消息
	partitions, err := consumer.Partitions("topic123")
	if err != nil {
		fmt.Println("主题获取失败，失败的原因：", err)
		return
	}
	fmt.Println(partitions)

	// 开始遍历分区中的消息，开始进行消费
	for _, partition := range partitions {
		pc, err := consumer.ConsumePartition("topic123", int32(partition), sarama.OffsetNewest)
		if err != nil {
			fmt.Println("分区数据获取失败，失败的原因：", err)
			return
		}
		defer pc.AsyncClose()
		// 开始异步获取消息
		go func(sarama.PartitionConsumer) {
			for message := range pc.Messages() {
				fmt.Printf("当前消费的分区是：%d,offset：%d,key:%v，消息的内容是：%v", message.Partition,
					message.Offset, message.Key, string(message.Value))
				fmt.Println("")
			}
		}(pc)
	}

	// 阻塞让消费一直处于监听状态
	select {}
}

```

### 4.3 创建主题代码示例

```go
package main

import (
	"fmt"

	"github.com/Shopify/sarama"
)

func CreateTopic(addrs []string, topic string) bool {
	config := sarama.NewConfig()
	config.Version = sarama.V2_0_0_0         // 设置客户端版本
	config.Admin.Timeout = 3 * time.Second // 设置Admin请求超时时间

	admin, err := sarama.NewClusterAdmin(addrs, config)
	if err!= nil {
		return false
	}
	defer admin.Close()

	err = admin.CreateTopic(topic, &sarama.TopicDetail{NumPartitions: 3, ReplicationFactor: 2}, false)
	if err == nil {
		fmt.Println("success create topic:", topic)
	} else {
		fmt.Println("failed create topic:", topic)
	}

	return err == nil
}
```

### 4.4 性能测试结果

Kafka目前已经成为云计算领域中的“事件驱动”架构、微服务架构中的主要消息队列，随着越来越多的公司和组织开始采用Kafka作为基础消息队列技术，越来越多的性能测试报告也陆续出来。笔者提前做了一轮性能测试，并发现它的消费性能比其它消息队列还要好，甚至更好些。下面是测试结果：

#### 测试环境：

- 操作系统：Ubuntu 16.04
- CPU：Intel® Xeon® Gold 6148 CPU @ 2.40GHz
- 内存：128G DDR4 ECC
- Kafka集群：3节点，每节点配置6个CPU、32G内存、SSD
- 测试用例：生产者每秒钟发送2万条消息，消费者每秒钟消费100条消息。

#### 测试结果：

##### Kafka消费者

###### 每秒消费100条消息，平均耗时：67毫秒

###### 每秒消费1000条消息，平均耗时：6.7毫秒

##### RabbitMQ消费者

###### 每秒消费100条消息，平均耗时：1038毫秒

###### 每秒消费1000条消息，平均耗时：10.38毫秒



# 06、文献

https://zhuanlan.zhihu.com/p/651160141

```sh
github.com/Shopify/sarama
github.com/bsm/sarama-cluster
```

## 生产者

```java
import (
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/Shopify/sarama"
	"github.com/golang/glog"
)

//同步生产者
func Produce() {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll          //赋值为-1：这意味着producer在follower副本确认接收到数据后才算一次发送完成。
	config.Producer.Partitioner = sarama.NewRandomPartitioner //写到随机分区中，默认设置8个分区
	config.Producer.Return.Successes = true
	msg := &sarama.ProducerMessage{}
	msg.Topic = `test0`
	msg.Value = sarama.StringEncoder("Hello World!")
	client, err := sarama.NewSyncProducer([]string{"Kafka_master:9092"}, config)
	if err != nil {
		fmt.Println("producer close err, ", err)
		return
	}
	defer client.Close()
	pid, offset, err := client.SendMessage(msg)

	if err != nil {
		fmt.Println("send message failed, ", err)
		return
	}
	fmt.Printf("分区ID:%v, offset:%v \n", pid, offset)
}


//异步生产者
func AsyncProducer() {
	var topics = "test0"
	config := sarama.NewConfig()
	config.Producer.Return.Successes = true //必须有这个选项
	config.Producer.Timeout = 5 * time.Second
	p, err := sarama.NewAsyncProducer(strings.Split("Kafka_master:9092", ","), config)
	defer p.Close()
	if err != nil {
		return
	}
	//这个部分一定要写，不然通道会被堵塞
	go func(p sarama.AsyncProducer) {
		errors := p.Errors()
		success := p.Successes()
		for {
			select {
			case err := <-errors:
				if err != nil {
					glog.Errorln(err)
				}
			case <-success:
			}
		}
	}(p)
	for {
		v := "async: " + strconv.Itoa(rand.New(rand.NewSource(time.Now().UnixNano())).Intn(10000))
		fmt.Fprintln(os.Stdout, v)
		msg := &sarama.ProducerMessage{
			Topic: topics,
			Value: sarama.ByteEncoder(v),
		}
		p.Input() <- msg
		time.Sleep(time.Second * 1)
	}

}

```

消费者

```go
package consumer

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/Shopify/sarama"
	cluster "github.com/bsm/sarama-cluster"
	"github.com/golang/glog"
)

//单个消费者
func Consumer() {
	var wg sync.WaitGroup
	consumer, err := sarama.NewConsumer([]string{"Kafka_master:9092"}, nil)
	if err != nil {
		fmt.Println("Failed to start consumer: %s", err)
		return
	}
	partitionList, err := consumer.Partitions("test0") //获得该topic所有的分区
	if err != nil {
		fmt.Println("Failed to get the list of partition:, ", err)
		return
	}

	for partition := range partitionList {
		pc, err := consumer.ConsumePartition("test0", int32(partition), sarama.OffsetNewest)
		if err != nil {
			fmt.Println("Failed to start consumer for partition %d: %s\n", partition, err)
			return
		}
		wg.Add(1)
		go func(sarama.PartitionConsumer) { //为每个分区开一个go协程去取值
			for msg := range pc.Messages() { //阻塞直到有值发送过来，然后再继续等待
				fmt.Printf("Partition:%d, Offset:%d, key:%s, value:%s\n", msg.Partition, msg.Offset, string(msg.Key), string(msg.Value))
			}
			defer pc.AsyncClose()
			wg.Done()
		}(pc)
	}
	wg.Wait()
}

//消费组
func ConsumerGroup() {
	groupID := "test-consumer-group"
	config := cluster.NewConfig()
	config.Group.Return.Notifications = true
	config.Consumer.Offsets.CommitInterval = 1 * time.Second
	config.Consumer.Offsets.Initial = sarama.OffsetNewest //初始从最新的offset开始

	c, err := cluster.NewConsumer(strings.Split("Kafka_master:9092", ","), groupID, strings.Split("test0", ","), config)
	if err != nil {
		glog.Errorf("Failed open consumer: %v", err)
		return
	}
	defer c.Close()
	go func(c *cluster.Consumer) {
		errors := c.Errors()
		noti := c.Notifications()
		for {
			select {
			case err := <-errors:
				glog.Errorln(err)
			case <-noti:
			}
		}
	}(c)
	for msg := range c.Messages() {
		fmt.Printf("Partition:%d, Offset:%d, key:%s, value:%s\n", msg.Partition, msg.Offset, string(msg.Key), string(msg.Value))
		c.MarkOffset(msg, "") //MarkOffset 并不是实时写入Kafka，有可能在程序crash时丢掉未提交的offset
	}
}
```

主函数

```go
package main

import (
	"strom-huang-go/go_Kafka/consumer"
)

func main() {
	// produce.AsyncProducer()
	consumer.Consumer()
}


```



