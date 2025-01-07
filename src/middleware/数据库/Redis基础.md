---
# 这是文章的标题
title: -Redis


# 这是侧边栏的顺序
order: 2
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2020-01-01

# 一个页面可以有多个标签
tag:
  - db

# 此页面会出现在星标文章中
star: true
---



# Redis入门到实战系列

<br>

:::tip

### NoSQL介绍

NoSQL，泛指非关系型的数据库。随着互联网[web2.0](https://link.zhihu.com/?target=https%3A//baike.baidu.com/item/web2.0)网站的兴起，传统的关系数据库在应付web2.0网站，特别是超大规模和高并发的[SNS](https://link.zhihu.com/?target=https%3A//baike.baidu.com/item/SNS/10242)类型的web2.0纯[动态网](https://link.zhihu.com/?target=https%3A//baike.baidu.com/item/%E5%8A%A8%E6%80%81%E7%BD%91)站已经显得力不从心，暴露了很多难以克服的问题，而非关系型的数据库则由于其本身的特点得到了非常迅速的发展。**NoSQL数据库的产生就是为了解决大规模数据集合多重数据种类带来的挑战，尤其是大数据应用难题**。

**NoSQL数据库的四大分类**：键值存储数据库、列存储数据库、文档型数据库、图形数据库。

我们这里介绍的**Redis**就是属于键值存储数据库（key-value）

:::

<br>

官方网站：https://redis.io/

中文网站：https://www.redis.net.cn/

<br>

## 01、Redis 简介



Redis 是完全开源免费的，遵守BSD协议，是一个高性能的==key-value==数据库。

Redis 特点：

- Redis支持数据的持久化，可以将内存中的数据保持在磁盘中，重启的时候可以再次加载进行使用。
- Redis不仅仅支持简单的key-value类型的数据，同时还提供list，set，zset，hash等数据结构的存储。
- Redis支持数据的备份，即master-slave模式的数据备份。

------

### Redis 优势

- 性能极高 – Redis能读的速度是110000次/s,写的速度是81000次/s 。
- 丰富的数据类型 – Redis支持二进制案例的 Strings, Lists, Hashes, Sets 及 Ordered Sets 数据类型操作。
- 原子 – Redis的所有操作都是原子性的，同时Redis还支持对几个操作全并后的原子性执行。
- 丰富的特性 – Redis还支持 publish/subscribe, 通知, key 过期等等特性。

------

### Redis与其他key-value存储有什么不同？

- Redis有着更为复杂的数据结构并且提供对他们的原子性操作，这是一个不同于其他数据库的进化路径。Redis的数据类型都是基于基本数据结构的同时对程序员透明，无需进行额外的抽象。
- Redis运行在内存中但是可以持久化到磁盘，所以在对不同数据集进行高速读写时需要权衡内存，应为数据量不能大于硬件内存。在内存数据库方面的另一个优点是， 相比在磁盘上相同的复杂的数据结构，在内存中操作起来非常简单，这样Redis可以做很多内部复杂性很强的事情。 同时，在磁盘格式方面他们是紧凑的以追加的方式产生的，因为他们并不需要进行随机访问。



---



### 为什么要使用redis

<br>

````markmap
---
Redis快的原因:
  colorFreezeLevel: 5
---

# Redis快的原因

## 基于内存实现
## 高效的数据结构
- 1、简单动态字符串
- 2、双端链表
- 3、压缩列表
- 4、字典
- 5、跳跃表
## 合理的数据编码
## 合适的线程模型
- 1、I/O多路复用
- 2、避免上下文切换
- 3、单线程模型
## 总结
````



#### 高性能

- ==单线程简单、无线程开销==  使用单线程简单，避免了多线程的竞争；同时还省去了多线程切换带来的时间和性能上的开销。

- redis主要基于内存操作内存的执行效率本身就很快，并且redis还采用了高效的数据结构。

- 在请求上采用I\O多路复用机制多路复用机制是一种基于非阻塞I/O模型，可以使redis高效的进行网络通信，I/O的读写也不再阻塞，就可以处理大量的客户端socket请求。

#### 高并发

- mysql单机一般只能支撑到2000Qps，而redis由于是K/V式的操作，单机可以支撑并发量几万到十几万。

- redis分布式集群化扩展性极高，而且稳定，能够支撑大量的数据吞吐，只要硬件支持。

#### **与传统关系型数据库对比：**

- redis 的优势比较多，如高性能，高可用，丰富的数据类型、原子性、扩展性比较强、可持久化、生态完善等等，但是比较有决定性的还是高性能和丰富的数据类型支持（string、list、set、sortedset（有序集合）、hash等），

- 一般一个东西好不好用，多数比较出来的，一般我们项目中引入redis 多数是为了减轻关系型数据库压力的，那就跟关系型数据库来比较，常见的关系型数据库是基于磁盘存储的，数据存取IO较高，

- 一般1W次/秒的速度，影响因素比较多，如磁盘IO、表结构、SQL质量、数据量等等都会影响到我们操作关系型数据库的响应速度。redis以上的问题基本上不存在，它是基于内存存储操作的可达到11W次/秒，远超关系型数据库，而且随着数据量的增加响应速度几乎影响很小，并且能够持久化保证数据的安全性。



## 02、Redis的下载和安装

### a、Windows下安装Redis服务

- 要安装Redis，首先要获取安装包。

- Windows的Redis安装包需要到以下GitHub链接找到。

- 链接：https://github.com/MSOpenTech/redis

  ​                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

  

​	

1. 双击刚下载好的msi格式的安装包（Redis-x64-3.2.100.msi）开始安装。

   

2. 选择“同意协议”，点击下一步继续。

   ![Windows下安装Redis服务](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_install1.jpg)

3. 选择“添加Redis目录到环境变量PATH中”，这样方便系统自动识别Redis执行文件在哪里。

   ![Windows下安装Redis服务](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_install2.jpg)

4. 端口号可保持默认的6379，并选择防火墙例外，从而保证外部可以正常访问Redis服务。

   ![Windows下安装Redis服务](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_install3.jpg)

5. 设定最大值为100M。作为实验和学习，100M足够了。

   ![Windows下安装Redis服务](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_install4.jpg)

6. 点击安装后，正式的安装过程开始。稍等一会即可完成。

   ![Windows下安装Redis服务](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_install5.jpg)

   

   

   7、安装完毕后，需要先做一些设定工作，以便服务启动后能正常运行。

   使用文本编辑器，这里使用Notepad++，打开Redis服务配置文件。

   注意：不要找错了，通常为==redis.windows-service.conf==，而不是redis.windows.conf。后者是以非系统服务方式启动程序使用的配置文件。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_installWinConfig.png" alt="image-20241222145654119" style="zoom:67%;" />



打开网站后，找到Release，点击前往下载页面。

找到含有requirepass字样的地方，追加一行，输入requirepass 12345。

这是访问Redis时所需的密码，一般测试情况下可以不用设定密码。

不过，即使是作为本地访问，也建议设定一个密码。此处以简单的12345来演示。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_installSetPassword.png" alt="image-20241222150007164" style="zoom:67%;" />



点击“开始”>右击“计算机”>选择“管理”。在左侧栏中依次找到并点击“计算机管理（本地）”>服务和应用程序>服务。再在右侧找到Redis名称的服务，查看启动情况。如未启动，则手动启动之。

正常情况下，服务应该正常启动并运行了。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_installService.png" alt="image-20241222150325386" style="zoom:67%;" />

最后来测试一下Redis是否正常提供服务。

进入Redis的目录，cd C:\Program Files\Redis。

输入redis-cli并回车。（redis-cli是客户端程序）

如图正常提示进入，并显示正确端口号，则表示服务已经启动。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_installCMD.png" alt="image-20241222150541940" style="zoom:67%;" />



使用服务前需要先通过密码验证。输入“auth 12345”并回车（12345是之前设定的密码）。返回提示OK表示验证通过。



实际测试一下读写。输入set firstKey "hello World!”并回车，用来保存一个键值。再输入get firstKey ，获取刚才保存的键值。读取没有问题，表明Redis服务安装成功。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_installTest.png" alt="image-20241222150949067" style="zoom:67%;" />

### b、Linux下安装Redis服务

- Linux的Redis下载：https://redis.io/download/
- https://redis.io/download/#redis-downloads

由于redis是由**C语言编写的**，它的运行**需要C环境**，因此我们需要先安装gcc。安装命令如下：

```sh
yum install gcc-c++
```

下载，解压，编译:

```sh
$ wget https://github.com/redis/redis/archive/7.0.8.tar.gz
$ tar xzf 7.0.8.tar.gz
$ cd redis-7.0.8
$ make
```

二进制文件是编译完成后在`src`目录下. 运行如下:

```sh
$ src/redis-server
```

你能使用Redis的内置客户端进行进行redis代码的编写:

**本地连接：**

```sh
$ src/redis-cli
redis> set foo barOKredis
> get foo"bar"
```

**远程链接：**

```sh
$ redis-cli -h host -p port -a password
```

以下实例演示了如何连接到主机为 127.0.0.1，端口为 6379 ，密码为 mypass 的 redis 服务上。

```sh
$ redis-cli -h 127.0.0.1 -p 6379 -a "mypass"
redis 127.0.0.1:6379>PING 
PONG
```

## 03、Redis命令

### a、key相关命令

命令文档：https://redis.io/commands/

下表给出了与 Redis 键相关的基本命令：

| 序号 | 命令及描述                                                   |
| :--- | :----------------------------------------------------------- |
| 1    | [DEL key](https://www.redis.net.cn/order/3528.html) 该命令用于在 key 存在是删除 key。 |
| 2    | [DUMP key](https://www.redis.net.cn/order/3529.html) 序列化给定 key ，并返回被序列化的值。 |
| 3    | [EXISTS key](https://www.redis.net.cn/order/3530.html) 检查给定 key 是否存在。 |
| 4    | [EXPIRE key](https://www.redis.net.cn/order/3531.html) seconds 为给定 key 设置过期时间。 |
| 5    | [EXPIREAT key timestamp](https://www.redis.net.cn/order/3532.html) EXPIREAT 的作用和 EXPIRE 类似，都用于为 key 设置过期时间。 不同在于 EXPIREAT 命令接受的时间参数是 UNIX 时间戳(unix timestamp)。 |
| 6    | [PEXPIRE key milliseconds](https://www.redis.net.cn/order/3533.html) 设置 key 的过期时间亿以毫秒计。 |
| 7    | [PEXPIREAT key milliseconds-timestamp](https://www.redis.net.cn/order/3534.html) 设置 key 过期时间的时间戳(unix timestamp) 以毫秒计 |
| 8    | [KEYS pattern](https://www.redis.net.cn/order/3535.html) 查找所有符合给定模式( pattern)的 key 。 |
| 9    | [MOVE key db](https://www.redis.net.cn/order/3536.html) 将当前数据库的 key 移动到给定的数据库 db 当中。 |
| 10   | [PERSIST key](https://www.redis.net.cn/order/3537.html) 移除 key 的过期时间，key 将持久保持。 |
| 11   | [PTTL key](https://www.redis.net.cn/order/3538.html) 以毫秒为单位返回 key 的剩余的过期时间。 |
| 12   | [TTL key](https://www.redis.net.cn/order/3539.html) 以秒为单位，返回给定 key 的剩余生存时间(TTL, time to live)。 |
| 13   | [RANDOMKEY](https://www.redis.net.cn/order/3540.html) 从当前数据库中随机返回一个 key 。 |
| 14   | [RENAME key newkey](https://www.redis.net.cn/order/3541.html) 修改 key 的名称 |
| 15   | [RENAMENX key newkey](https://www.redis.net.cn/order/3542.html) 仅当 newkey 不存在时，将 key 改名为 newkey 。 |
| 16   | [TYPE key](https://www.redis.net.cn/order/3543.html) 返回 key 所储存的值的类型。 |

**1、查看所有的key**

```sh
keys *
```

**2、删除的key**

```sh
del key
```

**3、检查给定 key 是否存在**

```sh
EXISTS key
```

**4、 为给定 key 设置过期时间**

```sh
EXPIRE key seconds
```

**5、PERSIST 用户删除key的过期时间**

```sh
PERSIST age
```

**6、将当前数据库的 key 移动到给定的数据库 db 当中。**

```sh
move key db
```

**7、以秒为单位，返回给定 key 的剩余生存时间(TTL, time to live)。**

```sh
ttl key
```

**8、以毫秒为单位返回 key 的剩余的过期时间**

```sh
PTTL key
```

**9、从当前数据库中随机返回一个 key**

```sh
RANDOMKEY
```

**10、修改 key 的名称**

```sh
RENAME key newkey 
```

**11、返回 key 所储存的值的类型**

```sh
TYPE key
```

**12、用于选择数据库，数据库一共0~15**

```sh
select 1
```



### b、服务器端的相关命令

**1、ping，如果服务器运行正常的话，使用ping 返回一个pong**

```sh
ping
```

**2、QUIT 可以通过命令退出当前Redis的客户端链接**

```sh
QUIT
```

**3、DBSIZE 查看当前数据库中key的条目，类似于keys**

```sh
dbsize
```

**4、INFO 用于查看Redis服务器各种信息和统计数值**

```sh
info
```

**5、CONFIG GET 查看redis服务器的配置信息**

```sh
# 查看redis安装的位置，如果你想获取所有的redis服务配置的信息使用:config get *
config get dir
```

**6、FLUSHDB 用于删除当前选择的数据库所有的key**

```sh
flush db
```

**7、FLUSHALL 用于删除所有数据库中的key**

```sh
flushall
```



<br><br>

## 04、Redis数据类型

<br>



### 1：String数据结构



上面我们说过redis采用了高效的数据结构，Redis支持5种数据类型：string，hash，list，set，zset。

![img](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_struct.png)

**Redis 字符串命令**

下表列出了常用的 redis 字符串命令：

| 序号 | 命令及描述                                                   |
| :--- | :----------------------------------------------------------- |
| 1    | ==[SET key value](https://www.redis.net.cn/order/3544.html) 设置指定 key 的值== |
| 2    | ==[GET key](https://www.redis.net.cn/order/3545.html) 获取指定 key 的值。== |
| 3    | [GETRANGE key start end](https://www.redis.net.cn/order/3546.html) 返回 key 中字符串值的子字符 |
| 4    | [GETSET key value](https://www.redis.net.cn/order/3547.html) 将给定 key 的值设为 value ，并返回 key 的旧值(old value)。 |
| 5    | ==[GETBIT key offset](https://www.redis.net.cn/order/3548.html) 对 key 所储存的字符串值，获取指定偏移量上的位(bit)。== |
| 6    | ==[MGET key1 [key2..\]](https://www.redis.net.cn/order/3549.html) 获取所有(一个或多个)给定 key 的值。== |
| 7    | ==[SETBIT key offset value](https://www.redis.net.cn/order/3550.html) 对 key 所储存的字符串值，设置或清除指定偏移量上的位(bit)。== |
| 8    | ==[SETEX key seconds value](https://www.redis.net.cn/order/3551.html) 将值 value 关联到 key ，并将 key 的过期时间设为 seconds (以秒为单位)。== |
| 9    | ==[SETNX key value](https://www.redis.net.cn/order/3552.html) 只有在 key 不存在时设置 key 的值。== |
| 10   | [SETRANGE key offset value](https://www.redis.net.cn/order/3553.html) 用 value 参数覆写给定 key 所储存的字符串值，从偏移量 offset 开始。 |
| 11   | [STRLEN key](https://www.redis.net.cn/order/3554.html) 返回 key 所储存的字符串值的长度。 |
| 12   | [MSET key value [key value ...\]](https://www.redis.net.cn/order/3555.html) 同时设置一个或多个 key-value 对。 |
| 13   | [MSETNX key value [key value ...\]](https://www.redis.net.cn/order/3556.html) 同时设置一个或多个 key-value 对，当且仅当所有给定 key 都不存在。 |
| 14   | [PSETEX key milliseconds value](https://www.redis.net.cn/order/3557.html) 这个命令和 SETEX 命令相似，但它以毫秒为单位设置 key 的生存时间，而不是像 SETEX 命令那样，以秒为单位。 |
| 15   | ==[INCR key](https://www.redis.net.cn/order/3558.html) 将 key 中储存的数字值增一。== |
| 16   | ==[INCRBY key increment](https://www.redis.net.cn/order/3559.html) 将 key 所储存的值加上给定的增量值（increment） 。== |
| 17   | ==[INCRBYFLOAT key increment](https://www.redis.net.cn/order/3560.html) 将 key 所储存的值加上给定的浮点增量值（increment） 。== |
| 18   | ==[DECR key](https://www.redis.net.cn/order/3561.html) 将 key 中储存的数字值减一。== |
| 19   | ==[DECRBY key decrement](https://www.redis.net.cn/order/3562.html) key 所储存的值减去给定的减量值（decrement） ==。 |
| 20   | [APPEND key value](https://www.redis.net.cn/order/3563.html) 如果 key 已经存在并且是一个字符串， APPEND 命令将 value 追加到 key 原来的值的末尾。 |



### 2：Hash数据结构

下表列出了 redis hash 基本的相关命令：

| 序号 | 命令及描述                                                   |
| :--- | :----------------------------------------------------------- |
| 1    | ==[HDEL key field2 [field2\]](https://www.redis.net.cn/order/3564.html) 删除一个或多个哈希表字段== |
| 2    | ==[HEXISTS key field](https://www.redis.net.cn/order/3565.html) 查看哈希表 key 中，指定的字段是否存在。== |
| 3    | ==[HGET key field](https://www.redis.net.cn/order/3566.html) 获取存储在哈希表中指定字段的值/td>== |
| 4    | ==[HGETALL key](https://www.redis.net.cn/order/3567.html) 获取在哈希表中指定 key 的所有字段和值== |
| 5    | [HINCRBY key field increment](https://www.redis.net.cn/order/3568.html) 为哈希表 key 中的指定字段的整数值加上增量 increment 。 |
| 6    | [HINCRBYFLOAT key field increment](https://www.redis.net.cn/order/3569.html) 为哈希表 key 中的指定字段的浮点数值加上增量 increment 。 |
| 7    | [HKEYS key](https://www.redis.net.cn/order/3570.html) 获取所有哈希表中的字段 |
| 8    | [HLEN key](https://www.redis.net.cn/order/3571.html) 获取哈希表中字段的数量 |
| 9    | [HMGET key field1 [field2\]](https://www.redis.net.cn/order/3572.html) 获取所有给定字段的值 |
| 10   | [HMSET key field1 value1 [field2 value2 \]](https://www.redis.net.cn/order/3573.html) 同时将多个 field-value (域-值)对设置到哈希表 key 中。 |
| 11   | ==[HSET key field value](https://www.redis.net.cn/order/3574.html) 将哈希表 key 中的字段 field 的值设为 value 。== |
| 12   | ==[HSETNX key field value](https://www.redis.net.cn/order/3575.html) 只有在字段 field 不存在时，设置哈希表字段的值。== |
| 13   | ==[HVALS key](https://www.redis.net.cn/order/3576.html) 获取哈希表中所有值== |
| 14   | ==HSCAN key cursor [MATCH pattern] [COUNT count] 迭代哈希表中的键值对。== |

### 3：List数据结构

| 序号 | 命令及描述                                                   |
| :--- | :----------------------------------------------------------- |
| 1    | [BLPOP key1 [key2 \] timeout](https://www.redis.net.cn/order/3577.html) 移出并获取列表的第一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。 |
| 2    | [BRPOP key1 [key2 \] timeout](https://www.redis.net.cn/order/3578.html) 移出并获取列表的最后一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。 |
| 3    | [BRPOPLPUSH source destination timeout](https://www.redis.net.cn/order/3579.html) 从列表中弹出一个值，将弹出的元素插入到另外一个列表中并返回它； 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。 |
| 4    | [LINDEX key index](https://www.redis.net.cn/order/3580.html) 通过索引获取列表中的元素 |
| 5    | [LINSERT key BEFORE\|AFTER pivot value](https://www.redis.net.cn/order/3581.html) 在列表的元素前或者后插入元素 |
| 6    | [LLEN key](https://www.redis.net.cn/order/3582.html) 获取列表长度 |
| 7    | [LPOP key](https://www.redis.net.cn/order/3583.html) 移出并获取列表的第一个元素 |
| 8    | [LPUSH key value1 [value2\]](https://www.redis.net.cn/order/3584.html) 将一个或多个值插入到列表头部 |
| 9    | [LPUSHX key value](https://www.redis.net.cn/order/3585.html) 将一个或多个值插入到已存在的列表头部 |
| 10   | [LRANGE key start stop](https://www.redis.net.cn/order/3586.html) 获取列表指定范围内的元素 |
| 11   | [LREM key count value](https://www.redis.net.cn/order/3587.html) 移除列表元素 |
| 12   | ==[LSET key index value](https://www.redis.net.cn/order/3588.html) 通过索引设置列表元素的值== |
| 13   | [LTRIM key start stop](https://www.redis.net.cn/order/3589.html) 对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除。 |
| 14   | [RPOP key](https://www.redis.net.cn/order/3590.html) 移除并获取列表最后一个元素 |
| 15   | [RPOPLPUSH source destination](https://www.redis.net.cn/order/3591.html) 移除列表的最后一个元素，并将该元素添加到另一个列表并返回 |
| 16   | [RPUSH key value1 [value2\]](https://www.redis.net.cn/order/3592.html) 在列表中添加一个或多个值 |
| 17   | [RPUSHX key value](https://www.redis.net.cn/order/3593.html) 为已存在的列表添加值 |

### 4：Set数据结构

| 序号 | 命令及描述                                                   |
| :--- | :----------------------------------------------------------- |
| 1    | [SADD key member1 [member2\]](https://www.redis.net.cn/order/3594.html) 向集合添加一个或多个成员 |
| 2    | [SCARD key](https://www.redis.net.cn/order/3595.html) 获取集合的成员数 |
| 3    | [SDIFF key1 [key2\]](https://www.redis.net.cn/order/3596.html) 返回给定所有集合的差集 |
| 4    | [SDIFFSTORE destination key1 [key2\]](https://www.redis.net.cn/order/3597.html) 返回给定所有集合的差集并存储在 destination 中 |
| 5    | [SINTER key1 [key2\]](https://www.redis.net.cn/order/3598.html) 返回给定所有集合的交集 |
| 6    | [SINTERSTORE destination key1 [key2\]](https://www.redis.net.cn/order/3599.html) 返回给定所有集合的交集并存储在 destination 中 |
| 7    | [SISMEMBER key member](https://www.redis.net.cn/order/3600.html) 判断 member 元素是否是集合 key 的成员 |
| 8    | [SMEMBERS key](https://www.redis.net.cn/order/3601.html) 返回集合中的所有成员 |
| 9    | [SMOVE source destination member](https://www.redis.net.cn/order/3602.html) 将 member 元素从 source 集合移动到 destination 集合 |
| 10   | [SPOP key](https://www.redis.net.cn/order/3603.html) 移除并返回集合中的一个随机元素 |
| 11   | [SRANDMEMBER key [count\]](https://www.redis.net.cn/order/3604.html) 返回集合中一个或多个随机数 |
| 12   | [SREM key member1 [member2\]](https://www.redis.net.cn/order/3605.html) 移除集合中一个或多个成员 |
| 13   | [SUNION key1 [key2\]](https://www.redis.net.cn/order/3606.html) 返回所有给定集合的并集 |
| 14   | [SUNIONSTORE destination key1 [key2\]](https://www.redis.net.cn/order/3607.html) 所有给定集合的并集存储在 destination 集合中 |
| 15   | [SSCAN key cursor [MATCH pattern\] [COUNT count]](https://www.redis.net.cn/order/3608.html) 迭代集合中的元素 |

### 5：Zset数据结构

下表列出了 redis 有序集合的基本命令:

| 序号 | 命令及描述                                                   |
| :--- | :----------------------------------------------------------- |
| 1    | [ZADD key score1 member1 [score2 member2\]](https://www.redis.net.cn/order/3609.html) 向有序集合添加一个或多个成员，或者更新已存在成员的分数 |
| 2    | [ZCARD key](https://www.redis.net.cn/order/3610.html) 获取有序集合的成员数 |
| 3    | [ZCOUNT key min max](https://www.redis.net.cn/order/3611.html) 计算在有序集合中指定区间分数的成员数 |
| 4    | [ZINCRBY key increment member](https://www.redis.net.cn/order/3612.html) 有序集合中对指定成员的分数加上增量 increment |
| 5    | [ZINTERSTORE destination numkeys key [key ...\]](https://www.redis.net.cn/order/3613.html) 计算给定的一个或多个有序集的交集并将结果集存储在新的有序集合 key 中 |
| 6    | [ZLEXCOUNT key min max](https://www.redis.net.cn/order/3614.html) 在有序集合中计算指定字典区间内成员数量 |
| 7    | [ZRANGE key start stop [WITHSCORES\]](https://www.redis.net.cn/order/3615.html) 通过索引区间返回有序集合成指定区间内的成员 |
| 8    | [ZRANGEBYLEX key min max [LIMIT offset count\]](https://www.redis.net.cn/order/3616.html) 通过字典区间返回有序集合的成员 |
| 9    | [ZRANGEBYSCORE key min max [WITHSCORES\] [LIMIT]](https://www.redis.net.cn/order/3617.html) 通过分数返回有序集合指定区间内的成员 |
| 10   | [ZRANK key member](https://www.redis.net.cn/order/3618.html) 返回有序集合中指定成员的索引 |
| 11   | [ZREM key member [member ...\]](https://www.redis.net.cn/order/3619.html) 移除有序集合中的一个或多个成员 |
| 12   | [ZREMRANGEBYLEX key min max](https://www.redis.net.cn/order/3620.html) 移除有序集合中给定的字典区间的所有成员 |
| 13   | [ZREMRANGEBYRANK key start stop](https://www.redis.net.cn/order/3621.html) 移除有序集合中给定的排名区间的所有成员 |
| 14   | [ZREMRANGEBYSCORE key min max](https://www.redis.net.cn/order/3622.html) 移除有序集合中给定的分数区间的所有成员 |
| 15   | [ZREVRANGE key start stop [WITHSCORES\]](https://www.redis.net.cn/order/3623.html) 返回有序集中指定区间内的成员，通过索引，分数从高到底 |
| 16   | [ZREVRANGEBYSCORE key max min [WITHSCORES\]](https://www.redis.net.cn/order/3624.html) 返回有序集中指定分数区间内的成员，分数从高到低排序 |
| 17   | [ZREVRANK key member](https://www.redis.net.cn/order/3625.html) 返回有序集合中指定成员的排名，有序集成员按分数值递减(从大到小)排序 |
| 18   | [ZSCORE key member](https://www.redis.net.cn/order/3626.html) 返回有序集中，成员的分数值 |
| 19   | [ZUNIONSTORE destination numkeys key [key ...\]](https://www.redis.net.cn/order/3627.html) 计算给定的一个或多个有序集的并集，并存储在新的 key 中 |
| 20   | [ZSCAN key cursor [MATCH pattern\] [COUNT count]](https://www.redis.net.cn/order/3628.html) 迭代有序集合中的元素（包括元素成员和元素分值） |

## 05、Redis的其他应用



### Geo地理位置

Redis GEO 提供了 6 个常用命令：

- GEOADD
- GEOPOS
- GEODIST
- GEORADIUS
- GEORADIUSBYMEMBER
- GEOHASH


Redis GEO 有很多应用场景，举一个简单的例子，你一定点过外卖，或者用过打车软件，在这种 APP上会显示“店家距离你有多少米”或者“司机师傅距离你有多远”，类似这种功能就可以使用 Redis GEO 实现。数据库中存放着商家所处的经纬度，你的位置则由手机定位获取，这样 APP 就计算出了最终的距离。再比如微信中附近的人、摇一摇、实时定位等功能都依赖地理位置实现。

GEO 提供以下操作命令，如下表所示：

| 序号 | 命令              | 说明                                                         |
| ---- | ----------------- | ------------------------------------------------------------ |
| 1    | GEOADD            | 将指定的地理空间位置（纬度、经度、名称）添加到指定的 key 中。 |
| 2    | GEOPOS            | 从 key 里返回所有给定位置元素的位置（即经度和纬度）          |
| 3    | GEODIST           | 返回两个地理位置间的距离，如果两个位置之间的其中一个不存在， 那么命令返回空值。 |
| 4    | GEORADIUS         | 根据给定地理位置坐标(经纬度)获取指定范围内的地理位置集合。   |
| 5    | GEORADIUSBYMEMBER | 根据给定地理位置(具体的位置元素)获取指定范围内的地理位置集合。 |
| 6    | GEOHASH           | 获取一个或者多个的地理位置的 GEOHASH 值。                    |
| 7    | ZREM              | 通过有序集合的 zrem 命令实现对地理位置信息的删除。           |

####  1) GEOADD

将指定的地理空间位置（纬度、经度、名称）添加到指定的 key 中。语法格式如下：

GEOADD key longitude latitude member [longitude latitude member ...]  

- longitude：位置地点所处的经度；
- latitude：位置地点所处的纬度；
- member：位置名称。


将给定的经纬度的位置名称（纬度、经度、名字）与 key 相对应，这些数据以有序集合的形式进行储存。

`GEOADD`命令以标准的`x,y`形式接受参数， 所以用户必须先输入经度，然后再输入纬度。`GEOADD`命令能够记录的坐标数量是有限的，如果位置非常接近两极（南极/北极）区域，那么将无法被索引到。因此当您输入经纬度时，需要注意以下规则：

- 有效的经度介于 -180 度至 180 度之间。
- 有效的纬度介于 -85.05112878 度至 85.05112878 度之间。

注意：如果您输入一个超出范围的经纬度时，GEOADD 命令将返回一个错误。

示例演示如下：

```sh
#添加城市地理位置
127.0.0.1:6379> geoadd city 116.20 39.56 beijing 120.52 30.40 shanghai
(integer) 2
#查询城市地理位置
127.0.0.1:6379> GEOPOS city beijing shanghai
1) 1) "116.19999736547470093"
   2) "39.56000019952067248"
2) 1) "120.52000075578689575"
   2) "30.39999952668997452"
```

#### 2) GEODIST

 该命令用于获取两个地理位置间的距离。返回值为双精度浮点数，其语法格式如下：

GEODIST key member1 member2 [unit]  

参数 unit 是表示距离单位，取值如下所示：

- m 表示单位为米；
- km 表示单位为千米；
- mi 表示单位为英里；
- ft 表示单位为英尺。


注意：如果没有指出距离单位，那么默认取值为`m`。示例如下：

```sh
127.0.0.1:6379> GEODIST city beijing shanghai
"1091868.8970"
127.0.0.1:6379> GEODIST city beijing shanghai km
"1091.8689"
127.0.0.1:6379> GEODIST city beijing shanghai mi
"678.4576"
```

注意：计算举例时存在 0.5% 左右的误差，这是由于 Redis GEO 把地球假设成了完美的球体。

#### 3) GEORADIUS

以给定的经纬度为中心，计算出 key 包含的地理位置元素与中心的距离不超过给定最大距离的所有位置元素，并将其返回。

GEORADIUS key longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC]

参数说明：

- WITHDIST ：在返回位置元素的同时， 将位置元素与中心之间的距离也一并返回。
- WITHCOORD ：返回位置元素的经度和维度。
- WITHHASH ：采用 GEOHASH 对位置元素进行编码，以 52 位有符号整数的形式返回有序集合的分值，该选项主要用于底层调试，实际作用不大。
- COUNT：指定返回位置元素的数量，在数据量非常大时，可以使用此参数限制元素的返回数量，从而加快计算速度。

注意：该命令默认返回的是未排序的位置元素。通过 ASC 与 DESC 可让返回的位置元素以升序或者降序方式排列。


命令应用示例如下：

```sh
#添加几个地理位置元素
127.0.0.1:6379> GEOADD city 106.45 29.56 chongqing 120.33 36.06 qingdao 103.73 36.03 lanzhou
(integer) 3
127.0.0.1:6379> GEOADD city 106.71 26.56 guiyang
(integer) 1
#以首都的坐标为中心，计算各个城市距离首都的距离，最大范围设置为1500km
#同时返回距离，与位置元素的经纬度
127.0.0.1:6379> GEORADIUS city 116.41 39.91 1500 km WITHCOORD WITHDIST
1) 1) "chongqing"
   2) "1465.5618"
   3) 1) "106.4500012993812561"
      2) "29.56000053864853072"
2) 1) "lanzhou"
   2) "1191.2793"
   3) 1) "103.72999995946884155"
      2) "36.03000049919800318"
3) 1) "shanghai"
   2) "1121.4882"
   3) 1) "120.52000075578689575"
      2) "30.39999952668997452"
4) 1) "qingdao"
   2) "548.9304"
   3) 1) "120.3299984335899353"
      2) "36.05999892411877994"
5) 1) "beijing"
   2) "42.8734"
   3) 1) "116.19999736547470093"
      2) "39.56000019952067248"
```

#### 4) GEORADIUSBYMEMBER

根据给定的地理位置坐标（即经纬度）获取指定范围内的位置元素集合。其语法格式如下：

GEORADIUSBYMEMBER key member radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DES]

- m ：米，默认单位；
- km ：千米（可选）；
- mi ：英里（可选）；
- ft ：英尺（可选）；
- ASC：根据距离将查找结果从近到远排序；
- DESC：根据距离将查找结果从远到近排序。


该命令与 GEORADIUS 命令相似，不过它选择的中心的是具体的位置元素，而非经纬度坐标。示例如下：

```sh
#以贵阳为中心，最大距离不超过900km
127.0.0.1:6379> GEORADIUSBYMEMBER city guiyang 900 km WITHCOORD WITHDIST
1) 1) "guiyang"
   2) "0.0000"
   3) 1) "106.70999854803085327"
      2) "26.56000089385899798"
#只有重庆符合条件
2) 1) "chongqing"
   2) "334.6529"
   3) 1) "106.4500012993812561"
      2) "29.56000053864853072"
```

#### 5) GEOHASH

返回一个或多个位置元素的哈希字符串，该字符串具有唯一 ID 标识，它与给定的位置元素一一对应。示例如下：

```sh
127.0.0.1:6379> GEOHASH city lanzhou beijing shanghai
1) "wq3ubrjcun0"
2) "wx49h1wm8n0"
3) "wtmsyqpuzd0"
```

#### 6) ZREM

用于删除指定的地理位置元素，示例如下：

```sh
127.0.0.1:6379> zrem city beijing shanghai
(integer) 2
```

了解更多命令请参考：http://redisdoc.com/geo/geohash.html



### HyperLoglog技术统计

Redis 在 2.8.9 版本添加了 HyperLogLog 结构。

Redis HyperLogLog 是用来做基数统计的算法，HyperLogLog 的优点是，在输入元素的数量或者体积非常非常大时，计算基数所需的空间总是固定 的、并且是很小的。

在 Redis 里面，每个 HyperLogLog 键只需要花费 12 KB 内存，就可以计算接近 2^64 个不同元素的基 数。这和计算基数时，元素越多耗费内存就越多的集合形成鲜明对比。

但是，因为 HyperLogLog 只会根据输入元素来计算基数，而不会储存输入元素本身，所以 HyperLogLog 不能像集合那样，返回输入的各个元素。

------

#### 什么是基数?

比如数据集 {1, 3, 5, 7, 5, 7, 8}， 那么这个数据集的基数集为 {1, 3, 5 ,7, 8}, 基数(不重复元素)为5。 基数估计就是在误差可接受的范围内，快速计算基数。

------

#### 实例

以下实例演示了 HyperLogLog 的工作过程：

```sh
redis 127.0.0.1:6379> PFADD w3ckey "redis" 
1) (integer) 1 
redis 127.0.0.1:6379> PFADD w3ckey "mongodb"
1) (integer) 1 
redis 127.0.0.1:6379> PFADD w3ckey "mysql" 
1) (integer) 1 
redis 127.0.0.1:6379> PFCOUNT w3ckey 
(integer) 3
```

------

#### Redis HyperLogLog 命令

下表列出了 redis HyperLogLog 的基本命令：

| 序号 | 命令及描述                                                   |
| :--- | :----------------------------------------------------------- |
| 1    | [PFADD key element [element ...\]](https://www.redis.net.cn/order/3629.html) 添加指定元素到 HyperLogLog 中。 |
| 2    | [PFCOUNT key [key ...\]](https://www.redis.net.cn/order/3630.html) 返回给定 HyperLogLog 的基数估算值。 |
| 3    | [PFMERGE destkey sourcekey [sourcekey ...\]](https://www.redis.net.cn/order/3631.html) 将多个 HyperLogLog 合并为一个 HyperLogLog |

#### 应用场景

- 统计注册 IP 数 
- 统计每日访问 IP 数
- 统计页面实时 UV 数
- 统计在线用户数
- 统计用户每天搜索不同词条的个数

说明：基数不大，数据量不大就用不上，会有点大材小用浪费空间有局限性，就是只能统计基数数量，而没办法去知道具体的内容是什么和[bitmap](https://so.csdn.net/so/search?q=bitmap&spm=1001.2101.3001.7020)相比，属于两种特定统计情况，简单来说，HyperLogLog 去重比 bitmap 方便很多一般可以bitmap和hyperloglog配合使用，bitmap标识哪些用户活跃，hyperloglog计数



#### 总结

- 1：HyperLogLog是一种算法，并非redis独有
- 2：目的是做基数统计，故不是集合，不会保存元数据，只记录数量而不是数值。
- 3：耗空间极小，支持输入非常体积的数据量
- 4：核心是基数估算算法，主要表现为计算时内存的使用和数据合并的处理。最终数值存在一定误差
- 5：redis中每个hyperloglog key占用了12K的内存用于标记基数
- 6：pfadd命令并不会一次性分配12k内存，而是随着基数的增加而逐渐增加内存分配；而pfmerge操作则会将sourcekey合并后存储在12k大小的key中，这由hyperloglog合并操作的原理（两个hyperloglog合并时需要单独比较每个桶的值）可以很容易理解。
- 7：误差说明：基数估计的结果是一个带有 0.81% 标准错误（standard error）的近似值。是可接受的范围
- 8：Redis 对 HyperLogLog 的存储进行了优化，在计数比较小时，它的存储空间采用稀疏矩阵存储，空间占用很小，仅仅在计数慢慢变大，稀疏矩阵占用空间渐渐超过了阈值时才会一次性转变成稠密矩阵，才会占用 12k 的空间
- 9：HyperLogLog算法一开始就是为了大数据量的统计而发明的，所以很适合那种数据量很大，然后又没要求不能有一点误差的计算，HyperLogLog 提供不精确的去重计数方案，虽然不精确但是也不是非常不精确，标准误差是 0.81%，不过这对于页面用户访问量是没影响的，因为这种统计可能是访问量非常巨大，但是又没必要做到绝对准确，访问量对准确率要求没那么高，但是性能存储方面要求就比较高了，而HyperLogLog正好符合这种要求，不会占用太多存储空间，同时性能不错。

## 06、Redis的事务处理

Redis 事务的目的是方便用户一次执行多个命令。执行 Redis 事务可分为三个阶段：

- 开始事务
- 命令入队
- 执行事务

### Redis事务特性

Redis 事务具有两个重要特性：

#### 1) 单独的隔离操作

事务中的所有命令都会被序列化，它们将按照顺序执行，并且在执行过的程中，不会被其他客户端发送来的命令打断。

#### 2) 不保证原子性

在 Redis 的事务中，如果存在命令执行失败的情况，那么其他命令依然会被执行，不支持事务回滚机制。

注意：Redis 不支持事务回滚，原因在于 Redis 是一款基于内存的存储系统，其内部结构比较简单，若支持回滚机制，则让其变得冗余，并且损耗性能，这与 Redis 简单、快速的理念不相符合。

### Redis事务命令

| 命令                | 说明                                                         |
| ------------------- | ------------------------------------------------------------ |
| MULTI               | 开启一个事务                                                 |
| EXEC                | 执行事务中的所有命令                                         |
| WATCH key [key ...] | 在开启事务之前用来监视一个或多个key 。如果事务执行时这些 key 被改动过，那么事务将被打断。 |
| DISCARD             | 取消事务。                                                   |
| UNWATCH             | 取消 WATCH 命令对 key 的监控。                               |

### Redis事务应用

您可以把事务可以理解为一个批量执行 Redis 命令的脚本，但这个操作并非原子性操作，也就是说，如果中间某条命令执行失败，并不会导致前面已执行命令的回滚，同时不会中断后续命令的执行（不包含监听 key 的情况）。示例如下：

```sh
开启事务
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379> INCR 1
QUEUED #命令入队成功
127.0.0.1:6379> SET num 10
QUEUED
#批量执行命令
127.0.0.1:6379> EXEC
1) (integer) 1
2) OK
```

若您在事务开启之前监听了某个 key，那么您不应该在事务中尝试修改它，否则会导致事务中断。

```sh
开启事务之前设置key/value，并监听
127.0.0.1:6379> set www.biancheng.net hello
OK
127.0.0.1:6379> WATCH www.biancheng.net
OK
127.0.0.1:6379> get www.biancheng.net
"hello"
#开启事务
127.0.0.1:6379> MULTI
OK
#更改key的value值
127.0.0.1:6379> set www.biancheng.net HELLO
QUEUED
127.0.0.1:6379> GET www.biancheng.net
QUEUED
#命令执行失败
127.0.0.1:6379> EXEC
(error) EXECABORT Transaction discarded because of previous errors.
#取消监听key
127.0.0.1:6379> UNWATCH 
OK 
```

（1）正常执行

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_multi.png" alt="image-20241222151737621" style="zoom:67%;" />

（2）放弃事务

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_celmulti.png" alt="image-20241222152326646" style="zoom:67%;" />

（3）若在事务队列中存在命令性错误（类似于java编译性错误），则执行EXEC命令时，所有命令都不会执行

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_multiTestError.png" alt="image-20241222152950860" style="zoom:67%;" />

（4）若在事务队列中存在语法性错误（类似于java的1/0的运行时异常），则执行EXEC命令时，其他正确命令会被执行，错误命令抛出异常。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_multiTestBadGram.png" alt="image-20241222154147181" style="zoom:67%;" />

（5）使用watch
案例一：使用watch检测balance，事务期间balance数据未变动，事务执行成功

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_multiTestWatch1.png" alt="image-20241222155935150" style="zoom:80%;" />

案例二：使用watch检测balance，在开启事务后，在新窗口（左侧）执行更改balance的值，模拟其他客户端在事务执行期间更改watch监控的数据，然后事务才执行EXEC，这个时候事务不会成功执行。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_multiTestWatch2.png" alt="image-20241222160626258" style="zoom:67%;" />

==一但执行 EXEC 开启事务的执行后，无论事务使用执行成功， WARCH 对变量的监控都将被取消。
故当事务执行失败后，需重新执行WATCH命令对变量进行监控，并开启新的事务进行操作。==

### 总结

watch指令类似于乐观锁，在事务提交时，如果watch监控的多个KEY中任何KEY的值已经被其他客户端更改，则使用EXEC执行事务时，事务队列将不会被执行，同时返回Nullmulti-bulk应答以通知调用者事务执行失败。

## 07、Redis的配置文件详解

- Redis 的配置文件位于 Redis 安装目录下，文件名为 redis.conf。
- 你可以通过 **CONFIG** 命令查看或设置配置项。

```sh
参数说明
redis.conf 配置项说明如下：

1. Redis默认不是以守护进程的方式运行，可以通过该配置项修改，使用yes启用守护进程
    daemonize no
2. 当Redis以守护进程方式运行时，Redis默认会把pid写入/var/run/redis.pid文件，可以通过pidfile指定
    pidfile /var/run/redis.pid
3. 指定Redis监听端口，默认端口为6379，作者在自己的一篇博文中解释了为什么选用6379作为默认端口，因为6379在手机按键上MERZ对应的号码，而MERZ取自意大利歌女Alessia Merz的名字
    port 6379
4. 绑定的主机地址
    bind 127.0.0.1
5.当 客户端闲置多长时间后关闭连接，如果指定为0，表示关闭该功能
    timeout 300
6. 指定日志记录级别，Redis总共支持四个级别：debug、verbose、notice、warning，默认为verbose
    loglevel verbose
7. 日志记录方式，默认为标准输出，如果配置Redis为守护进程方式运行，而这里又配置为日志记录方式为标准输出，则日志将会发送给/dev/null
    logfile stdout
8. 设置数据库的数量，默认数据库为0，可以使用SELECT <dbid>命令在连接上指定数据库id
    databases 16
9. 指定在多长时间内，有多少次更新操作，就将数据同步到数据文件，可以多个条件配合
    save <seconds> <changes>
    Redis默认配置文件中提供了三个条件：
    save 900 1 900秒（15分钟）内有1个更改，
    save 300 10  300秒（5分钟）内有10个更改
    save 60 10000 60秒内有10000个更改。
 

10. 指定存储至本地数据库时是否压缩数据，默认为yes，Redis采用LZF压缩，如果为了节省CPU时间，可以关闭该选项，但会导致数据库文件变的巨大
    rdbcompression yes
11. 指定本地数据库文件名，默认值为dump.rdb
    dbfilename dump.rdb
12. 指定本地数据库存放目录
    dir ./
13. 设置当本机为slav服务时，设置master服务的IP地址及端口，在Redis启动时，它会自动从master进行数据同步
    slaveof <masterip> <masterport>
14. 当master服务设置了密码保护时，slav服务连接master的密码
    masterauth <master-password>
15. 设置Redis连接密码，如果配置了连接密码，客户端在连接Redis时需要通过AUTH <password>命令提供密码，默认关闭
    requirepass foobared
16. 设置同一时间最大客户端连接数，默认无限制，Redis可以同时打开的客户端连接数为Redis进程可以打开的最大文件描述符数，如果设置 maxclients 0，表示不作限制。当客户端连接数到达限制时，Redis会关闭新的连接并向客户端返回max number of clients reached错误信息
    maxclients 128
17. 指定Redis最大内存限制，Redis在启动时会把数据加载到内存中，达到最大内存后，Redis会先尝试清除已到期或即将到期的Key，当此方法处理 后，仍然到达最大内存设置，将无法再进行写入操作，但仍然可以进行读取操作。Redis新的vm机制，会把Key存放内存，Value会存放在swap区
    maxmemory <bytes>
18. 指定是否在每次更新操作后进行日志记录，Redis在默认情况下是异步的把数据写入磁盘，如果不开启，可能会在断电时导致一段时间内的数据丢失。因为 redis本身同步数据文件是按上面save条件来同步的，所以有的数据会在一段时间内只存在于内存中。默认为no
    appendonly no
19. 指定更新日志文件名，默认为appendonly.aof
     appendfilename appendonly.aof
20. 指定更新日志条件，共有3个可选值：     no：表示等操作系统进行数据缓存同步到磁盘（快）     always：表示每次更新操作后手动调用fsync()将数据写到磁盘（慢，安全）     everysec：表示每秒同步一次（折衷，默认值）
    appendfsync everysec
21. 指定是否启用虚拟内存机制，默认值为no，简单的介绍一下，VM机制将数据分页存放，由Redis将访问量较少的页即冷数据swap到磁盘上，访问多的页面由磁盘自动换出到内存中（在后面的文章我会仔细分析Redis的VM机制）
     vm-enabled no
22. 虚拟内存文件路径，默认值为/tmp/redis.swap，不可多个Redis实例共享
     vm-swap-file /tmp/redis.swap
23. 将所有大于vm-max-memory的数据存入虚拟内存,无论vm-max-memory设置多小,所有索引数据都是内存存储的(Redis的索引数据 就是keys),也就是说,当vm-max-memory设置为0的时候,其实是所有value都存在于磁盘。默认值为0
     vm-max-memory 0
24. Redis swap文件分成了很多的page，一个对象可以保存在多个page上面，但一个page上不能被多个对象共享，vm-page-size是要根据存储的 数据大小来设定的，作者建议如果存储很多小对象，page大小最好设置为32或者64bytes；如果存储很大大对象，则可以使用更大的page，如果不 确定，就使用默认值
     vm-page-size 32
25. 设置swap文件中的page数量，由于页表（一种表示页面空闲或使用的bitmap）是在放在内存中的，，在磁盘上每8个pages将消耗1byte的内存。
     vm-pages 134217728
26. 设置访问swap文件的线程数,最好不要超过机器的核数,如果设置为0,那么所有对swap文件的操作都是串行的，可能会造成比较长时间的延迟。默认值为4
     vm-max-threads 4
27. 设置在向客户端应答时，是否把较小的包合并为一个包发送，默认为开启
    glueoutputbuf yes
28. 指定在超过一定的数量或者最大的元素超过某一临界值时，采用一种特殊的哈希算法
    hash-max-zipmap-entries 64
    hash-max-zipmap-value 512
29. 指定是否激活重置哈希，默认为开启（后面在介绍Redis的哈希算法时具体介绍）
    activerehashing yes
30. 指定包含其它的配置文件，可以在同一主机上多个Redis实例之间使用同一份配置文件，而同时各个实例又拥有自己的特定配置文件
    include /path/to/local.conf
```



## 08、Redis持久化



### RDB

Redis 是一款基于内存的非关系型数据库，它会将数据全部存储在内存中。但是如果 Redis 服务器出现某些意外情况，比如宕机或者断电等，那么内存中的数据就会全部丢失。因此必须有一种机制能够保证 Redis 储存的数据不会因故障而丢失，这就是 Redis 的数据持久化机制。

数据的持久化存储是 Redis 的重要特性之一，它能够将内存中的数据保存到本地磁盘中，实现对数据的持久存储。这样即使在服务器发生故障之后，也能通过本地磁盘对数据进行恢复。

Redis 提供了两种持久化机制：第一种是 RDB，又称快照（snapshot）模式，第二种是 AOF 日志，也就追加模式。本节先讲解 RDB 快照模式，关于 AOF 日志会在《[Redis AOF持久化详解](http://c.biancheng.net/redis/aof.html)》一节讲解。

#### RDB快照模式原理

RDB 即快照模式，它是 Redis 默认的数据持久化方式，它会将Redis数据库的快照保存在 dump.rdb 这个二进制文件中。

==提示：所谓“快照”就是将内存数据以二进制文件的形式保存起来。==

我们知道 Redis 是单线程的，也就说一个线程要同时负责多个客户端套接字的并发读写，以及内存数据结构的逻辑读写。

==Redis 服务器不仅需要服务线上请求，同时还要备份内存快照。在备份过程中 Redis 必须进行文件 IO 读写，而 IO 操作会严重服务器的性能。那么如何实现既不影响客户端的请求，又实现快照备份操作呢，这时就用到了多进程。==

Redis 使用操作系统的多进程 COW(Copy On Write) 机制来实现快照持久化操作。

RDB 实际上是 Redis 内部的一个定时器事件，它每隔一段固定时间就去检查当前数据发生改变的次数和改变的时间频率，看它们是否满足配置文件中规定的持久化触发条件。当满足条件时，Redis 就会通过操作系统调用 fork() 来创建一个子进程，该子进程与父进程享有相同的地址空间。

Redis 通过子进程遍历整个内存空间来获取存储的数据，从而完成数据持久化操作。注意，此时的主进程则仍然可以对外提供服务，父子进程之间通过操作系统的 COW 机制实现了数据段分离，从而保证了父子进程之间互不影响。

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_storeRDB.png" alt="image-20230207222908123" style="zoom:67%;" />

#### RDB持久化触发策略

RDB 持久化提供了两种触发策略：一种是手动触发，另一种是自动触发。

#### 配置文件定义

```sh
# 数据库备份的文件
dbfilename dump.rdb
# 默认是：dir ./  也就是redis安装目录
dir /www/redis-7.0.8/data
```

注意授权：`chmod 777 /data/opt/redis/data`

##### 1) 手动触发策略

手动触发是通过`SAVAE`命令或者`BGSAVE`命令将内存数据保存到磁盘文件中。如下所示：

```sh
127.0.0.1:6379> SAVE
OK
127.0.0.1:6379> BGSAVE
Background saving started
127.0.0.1:6379>  LASTSAVE
(integer) 1611298430
```

上述命令`BGSAVE`从后台执行数据保存操作，其可用性要优于执行 SAVE 命令。

SAVE 命令会阻塞 Redis 服务器进程，直到 dump.rdb 文件创建完毕为止，在这个过程中，服务器不能处理任何的命令请求。

`BGSAVE`命令是非阻塞式的，所谓非阻塞式，指的是在该命令执行的过程中，并不影响 Redis 服务器处理客户端的其他请求。这是因为 Redis 服务器会 fork() 一个子进程来进行持久化操作（比如创建新的 dunp.rdb 文件），而父进程则继续处理客户端请求。当子进程处理完后会向父进程发送一个信号，通知它已经处理完毕。此时，父进程会用新的 dump.rdb 文件覆盖掉原来的旧文件。

因为`SAVE`命令无需创建子进程，所以执行速度要略快于`BGSAVE`命令，但是`SAVE`命令是阻塞式的，因此其可用性欠佳，如果在数据量较少的情况下，基本上体会不到两个命令的差别，不过仍然建议您使用 `BGSAVE`命令。

注意：LASTSAVE 命令用于查看 BGSAVE 命令是否执行成功。

##### 2) 自动触发策略

- **bgsave**

自动触发策略，是指 Redis 在指定的时间内，数据发生了多少次变化时，会自动执行`BGSAVE`命令。自动触发的条件包含在了 Redis 的配置文件中，如下所示：

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_saveBGSAVE.png" alt="image-20241222161225554" style="zoom:60%;" />
图1：数据持久化策略


上图所示， save m n 的含义是在时间 m 秒内，如果 Redis 数据至少发生了 n 次变化，那么就自动执行`BGSAVE`命令。配置策略说明如下：

- save 900 1 表示在 900 秒内，至少更新了 1 条数据，Redis 自动触发 BGSAVE 命令，将数据保存到硬盘。
- save 300 10 表示在 300 秒内，至少更新了 10 条数据，Redis 自动触 BGSAVE 命令，将数据保存到硬盘。
- save 60 10000 表示 60 秒内，至少更新了 10000 条数据，Redis 自动触发 BGSAVE 命令，将数据保存到硬盘。


只要上述三个条件任意满足一个，服务器就会自动执行`BGSAVE`命令。当然您可以根据实际情况自己调整触发策略。

注意：每次创建 RDB 文件之后，Redis 服务器为实现自动持久化而设置的时间计数和次数计数就会被清零，并重新开始计数，因此多个策略的效果不会叠加。

- **save**

#### RDB的错误处理

```sh
stop-writes-on-bgsave-error yes
```

后台存储发送错误时，禁止写入，默认值是yes,默认情况下，redis在后台生成的快照文件时失败，就会停止接收数据，目的是让用户能知道没有持久化功能。

#### RDB的数据压缩

```sh
 rdbcompression yes
```

指定存储至本地数据库时是否压缩数据，默认为yes，Redis采用LZF压缩，如果为了节省CPU时间，可以关闭该选项，但会导致数据库文件变的巨大,不建议关闭。

#### RDB的数据校验

```sh
rdbchecksum yes
```

对RDB的数据进行校验，会消耗CPU资源，默认值是yes。也就是说在执行过程中如果一些失败的命令就会丢失。

#### RDB持久化优劣势

最后我们对 RDB 持久化的优劣势做简单地分析：

我们知道，在 RDB 持久化的过程中，子进程会把 Redis 的所有数据都保存到新建的 dump.rdb 文件中，这是一个既消耗资源又浪费时间的操作。因此 Redis 服务器不能过于频繁地创建 rdb 文件，否则会严重影响服务器的性能。

RDB 持久化的最大不足之处在于，最后一次持久化的数据可能会出现丢失的情况。我们可以这样理解，在 持久化进行过程中，服务器突然宕机了，这时存储的数据可能并不完整，比如子进程已经生成了 rdb 文件，但是主进程还没来得及用它覆盖掉原来的旧 rdb 文件，这样就把最后一次持久化的数据丢失了。

RDB 数据持久化适合于大规模的数据恢复，并且还原速度快，如果对数据的完整性不是特别敏感（可能存在最后一次丢失的情况），那么 RDB 持久化方式非常合适。

<br>

### AOF

<br>

AOF 被称为追加模式，或日志模式，是 Redis 提供的另一种持久化策略，它能够存储 Redis 服务器已经执行过的的命令，并且只记录对内存有过修改的命令，这种数据记录方法，被叫做“增量复制”，其默认存储文件为`appendonly.aof`。

```sh
Redis客户端/go redis/java jedis———发送写命令————–>Redis服务器—————同步写命令——————>AOF文件
```

#### 开启AOF持久化

==AOF 机制默认处于未开启状态==，可以通过修改 Redis 配置文件开启 AOF，如下所示：

##### 1) Windows系统

执行如下操作：

```sh
#修改配置文件，把no改为 yes
appendonly yes
#确定存储文件名是否正确
appendfilename "appendonly.aof"
#重启服务器
redis-server --service-stop
redis-server --service-start
```

##### 2) Linux系统

执行如下操作：

```sh
#修改配置文件：
vim /etc/redis/redis.conf
appendonly yes # 把 no 改为 yes
#确定存储文件名是否正确
appendfilename "appendonly.aof"
#重启服务：
sudo /etc/init.d/redis-server restart
```

提示：本节建议在您在 Linux 系统上操作 Redis，否则一些 AOF 的性能无法体现。

#### AOF持久化机制

每当有一个修改数据库的命令被执行时，服务器就将命令写入到 appendonly.aof 文件中，该文件存储了服务器执行过的所有修改命令，因此，只要服务器重新执行一次 .aof 文件，就可以实现还原数据的目的，这个过程被形象地称之为“命令重演”。

##### 1) 写入机制

Redis 在收到客户端修改命令后，先进行相应的校验，如果没问题，就立即将该命令存追加到 .aof 文件中，也就是先存到磁盘中，然后服务器再执行命令。这样就算遇到了突发的宕机情况情况，也只需将存储到 .aof 文件中的命令，进行一次“命令重演”就可以恢复到宕机前的状态。

在上述执行过程中，有一个很重要的环节就是命令的写入，这是一个 IO 操作。Redis 为了提升写入效率，它不会将内容直接写入到磁盘中，而是将其放到一个内存缓存区（buffer）中，等到缓存区被填满时才真正将缓存区中的内容写入到磁盘里。

##### 2) 重写机制

Redis 在长期运行的过程中，aof 文件会越变越长。如果机器宕机重启，“重演”整个 aof 文件会非常耗时，导致长时间 Redis 无法对外提供服务。因此就需要对 aof 文件做一下“瘦身”运动。

为了让 aof 文件的大小控制在合理的范围内，Redis 提供了 AOF 重写机制，手动执行`BGREWRITEAOF`命令，开始重写 aof 文件，如下所示：

```sh
127.0.0.1:6379> BGREWRITEAOF
Background append only file rewriting started
```

通过上述操作后，服务器会生成一个新的 aof 文件，该文件具有以下特点：

- 新的 aof 文件记录的数据库数据和原 aof 文件记录的数据库数据完全一致；
- 新的 aof 文件会使用尽可能少的命令来记录数据库数据，因此新的 aof 文件的体积会小很多；
- AOF 重写期间，服务器不会被阻塞，它可以正常处理客户端发送的命令。


下表对原有 aof 文件和新生成的 aof 文件做了对比，如下所示：

| 原有aof文件                     | 重写后aof文件                 |
| ------------------------------- | ----------------------------- |
| select 0                        | SELECT 0                      |
| sadd myset Jack                 | SADD myset Jack Helen JJ Lisa |
| sadd myset Helen                | SET msg 'hello tarena'        |
| sadd myset JJ                   | RPUSH num 4 6 8               |
| sadd myset Lisa                 |                               |
| INCR number                     |                               |
| INCR number                     |                               |
| DEL number                      |                               |
| SET message 'www.baidu.com'     |                               |
| SET message 'www.biancheng.net' |                               |
| RPUSH num 2 4 6                 |                               |
| RPUSH num 8                     |                               |
| LPOP num                        |                               |


从上表可以看出，新生成的 aof 文件中，它的命令格式做了很大程度的简化。

##### 3) 自动触发AOF重写

Redis 为自动触发 AOF 重写功能，提供了相应的配置策略。如下所示：修改 Redis 配置文件，让服务器自动执行 BGREWRITEAOF 命令。

```sh
#默认配置项
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb #表示触发AOF重写的最小文件体积,大于或等于64MB自动触发。
```

该配置项表示：触发重写所需要的 aof 文件体积百分比，只有当 aof 文件的增量大于 100% 时才进行重写，也就是大一倍。比如，第一次重写时文件大小为 64M，那么第二次触发重写的体积为 128M，第三次重写为 256M，以此类推。如果将百分比值设置为 0 就表示关闭 AOF 自动重写功能。

#### AOF策略配置

在上述介绍写入机制的过程中，如果遇到宕机前，缓存内的数据未能写入到磁盘中，那么数据仍然会有丢失的风险。服务器宕机时，丢失命令的数量，取决于命令被写入磁盘的时间，越早地把命令写入到磁盘中，发生意外时丢失的数据就会越少，否则越多。

Redis 为数据的安全性考虑，同样为 AOF 持久化提供了策略配置，打开 Redis 配置文件，如下图所示：



<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_saveAOF.png" alt="image-20241222161508599" style="zoom:67%;" />
图1：AOF策略配置

**上述配置策略说明如下：**

- Always：服务器每写入一个命令，就调用一次 fsync 函数，将缓冲区里面的命令写入到硬盘。这种模式下，服务器出现故障，也不会丢失任何已经成功执行的命令数据，但是其执行速度较慢；
- Everysec（默认）：服务器每一秒调用一次 fsync 函数，将缓冲区里面的命令写入到硬盘。这种模式下，服务器出现故障，最多只丢失一秒钟内的执行的命令数据，通常都使用它作为 AOF 配置策略；
- No：服务器不主动调用 fsync 函数，由操作系统决定何时将缓冲区里面的命令写入到硬盘。这种模式下，服务器遭遇意外停机时，丢失命令的数量是不确定的，所以这种策略，不确定性较大，不安全。

注意：Linux 系统的 fsync() 函数可以将指定文件的内容从内核缓存刷到硬盘中。

由于是 fsync 是磁盘 IO 操作，所以它很慢！如果 Redis 执行一条指令就要 fsync 一次（Always），那么 Redis 高性能将严重受到影响。

在生产环境的服务器中，Redis 通常是每隔 1s 左右执行一次 fsync 操作（ Everysec），这样既保持了高性能，也让数据尽可能的少丢失。最后一种策略（No），让操作系统来决定何时将数据同步到磁盘，这种策略存在许多不确定性，所以不建议使用。

从三种策略的运行速度来看，Always 的速度最慢，而 Everysec 和 No 都很快。

#### AOF和RDB对比

| RDB持久化                                                    | AOF持久化                                    |
| ------------------------------------------------------------ | -------------------------------------------- |
| 全量备份，一次保存整个数据库。                               | 增量备份，一次只保存一个修改数据库的命令。   |
| 每次执行持久化操作的间隔时间较长。                           | 保存的间隔默认为一秒钟（Everysec）           |
| 数据保存为二进制格式，其还原速度快。                         | 使用文本格式还原数据，所以数据还原速度一般。 |
| 执行 SAVE 命令时会阻塞服务器，但手动或者自动触发的 BGSAVE 不会阻塞服务器 | AOF持久化无论何时都不会阻塞服务器。          |

**==如果进行数据恢复时，既有 dump.rdb文件，又有 appendonly.aof 文件，您应该先通过 appendonly.aof 恢复数据，这能最大程度地保证数据的安全性。==**



**这种工作方式使得Redis可以从copy-on-write机制中获益。(AOF的重写也利用了写时复制)**

**写时复制 是一种计算机程序设计领域的优化策略。核心思想是，如果有多个调用者同时要求相同资源，他们会共同获取相同的指针指向相同的资源，直到某个调用者试图修改资源的内容时，系统才会真正复制一份专用副本给该调用者，而其他调用者所见到的最初的资源仍然保持不变。这过程对其他的调用者都是透明的。此作法主要的优点是如果调用者没有修改该资源，就不会有副本被创建，因此多个调用者只是读取操作时可以共享同一份资源。**



## 09、Redis主从复制

主从复制也称之为：主从模式，当用户向Master写入数据时，Master通过Redis同步机制将数据文件发送至slave。slave也会通过redis的同步机制讲数据文件发送至master以确保数据一致。从而实现redis的主从复制。

- 如果master和slave之间的链接中断。slave可以自动重连master，但是链接成功之后，将自动执行一次完成同步。
- 配置主从复制后，==master可以负责读写服务，slave只负责读服务。==
- Redis复制在master端是非阻塞的，也就是说在和slave同步数据的时候，master仍然可以执行客户端的命令而不受气影响。

在软件的架构中，主从模式（Master-Slave）是使用较多的一种架构。主（Master）和从（Slave）分别部署在不同的服务器上，当主节点服务器写入数据时，同时也会将数据同步至从节点服务器，通常情况下，主节点负责写入数据，而从节点负责读取数据。

```sh
# 查看master/slave的关系
info replcation
##主从关联复制
savelof 主从复制关联
## 终止复制
saveof no one 
```



### Redis主从复制的特点

- 同一个master可以拥有多个slave节点
- master下的slave可以接受同一个架构中其他的slave链接和同步请求，实现数据的级联复制，即master -slave-slave.
- master以非阻塞的方式同步数据至slave，这将意味着master会继续处理一个或者多个slave的读写请求。
- 主从复制不会阻塞master，当一个或多个slave与master进行初次同步数据时，master可以继续处理客户端发来的请求。
- 通过配置禁止master数据持久化机制，将其数据持久化操作交给slave完成，避免master中有独立的进程来完成此操作。
- 主节点的数据的清空，也会清空从slave节点的数据信息.



### Redis主从复制的好处

- 避免Redis的单点故障
- 做到读写分离，构建读写分离架构，满足读多写少的应用场景。

### 主从模式原理的解析

主从模式的结构图如下：

master–slave1

master–slave2

master—slave1—slave2



![16133214H-0](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_masterSlave.gif)
图1：Redis 主从模式

如图 1 所示，Redis 主机会一直将自己的数据复制给 Redis 从机，从而实现主从同步。在这个过程中，只有 master 主机可执行写命令，其他 salve 从机只能只能执行读命令，这种读写分离的模式可以大大减轻 Redis 主机的数据读取压力，从而提高了Redis 的效率，并同时提供了多个数据备份。主从模式是搭建 Redis Cluster 集群最简单的一种方式。



### 单机部署多应用

- master 127.0.0.1 6379 
- slave 127.0.0.1 6300
- slave 127.0.0.1 6301

### 多机部署多应用

- master 127.0.0.1 6379
- slave 127.0.0.2 6379
- slave 127.0.0.3 6379

### 主从模式实现

Redis 提供了两种实现主从模式的方法，下面进行逐一介绍。为了方便演示，我们只从一台机器上搭建主从模式。

#### 1) 使用命令实现

使用命令在服务端搭建主从模式，其语法格式如下：

```sh
redis-server --port <slave-port> --slaveof <master-ip> <master-port>
```

执行以下命令：

```sh
#开启开启一个port为6300的从机，它依赖的主机port=6379
redis-server --port 6300 --slaveof 127.0.0.1 6379
# 命令启动
redis-server --port 6300 --slaveof 127.0.0.1 6379 --masterauth mkxiaoer --requirepass mkxiaoer --daemonize yes
```


输出结果如下图：

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_masterSlaveInit.png" alt="image-20241222162810743" style="zoom:70%;" />
图2：Redis 主从模式


接下来开启客户端，并执行查询命令，如下所示： 

```sh
C:\Users\Administrator>redis-cli -p 6300
127.0.0.1:6300> get name
"jack"
127.0.0.1:6300> get website
"www.biancheng.net"
#不能执行写命令
127.0.0.1:6300> set myname BangDe
(error) READONLY You can't write against a read only slave.
127.0.0.1:6300> keys *
1) "myset:__rand_int__"
2) "ID"
3) "title"
4) "course2"
5) "website"
6) "age"
7) "user:2"
8) "salary"
9) "mystream"
10) "key:__rand_int__"
11) "user:uv:2021011308"
....
```

注意：此时 port=6300 的服务端界面不能关闭。从上述命令可以看出，port =6300 的从机，完全备份了主机的数据，它可以执行查询命令，但是不能执行写入命令。

如果你注意观察服务端的话，您会看到以下提示：

```sh
[18160] 20 Jan 17:40:34.101 # Server initialized #服务初始化
[18160] 20 Jan 17:40:34.108 * Ready to accept connections #准备连接
[18160] 20 Jan 17:40:34.108 * Connecting to MASTER 127.0.0.1:6379 #连接到主服务器
[18160] 20 Jan 17:40:34.109 * MASTER <-> REPLICA sync started #启动副本同步
[18160] 20 Jan 17:40:34.110 * Non blocking connect for SYNC fired the event.#自动触发SYNC命令，请求同步数据
[18160] 20 Jan 17:40:34.110 * Master replied to PING, replication can continue...
[18160] 20 Jan 17:40:34.112 * Partial resynchronization not possible (no cached master)
[18160] 20 Jan 17:40:34.431 * Full resync from master: 6eb220706f73107990c2b886dbc2c12a8d0d9d05:0
[18160] 20 Jan 17:40:34.857 * MASTER <-> REPLICA sync: receiving 6916 bytes from master #从主机接受了数据，并将其存在于磁盘
[18160] 20 Jan 17:40:34.874 * MASTER <-> REPLICA sync: Flushing old data #清空原有数据
[18160] 20 Jan 17:40:34.874 * MASTER <-> REPLICA sync: Loading DB in memory #将磁盘中数据载入内存
[18160] 20 Jan 17:40:34.879 * MASTER <-> REPLICA sync: Finished with success #同步数据完成
```

可以看出主从模式下，数据的同步是自动完成的，这个数据同步的过程，又称为全量复制。

您也可以使用下面的命令来创建主从模式。启动一个服务端，并指定端口号：

```sh
#指定端口号为63001，不要关闭
redis-server --port 63001
```


打开一个客户端，连接服务器，如下所示：

```sh
#连接port=63001的服务器
C:\Users\Administrator>redis-cli -p 63001
#现在处于主机模式下，所以允许读写数据
127.0.0.1:63001> keys *
1) "FANS"
2) "user:login"
3) "course2"
4) "1"
5) "age"
6) "ID"
7) "title"
8) "counter:__rand_int__"
9) "key:__rand_int__"
10) "user:3"
11) "user:2"
...
127.0.0.1:63001> set myname 123456
OK
#将当前服务器设置成从服务器，从属于6379
127.0.0.1:63001> SLAVEOF 127.0.0.1 6379
OK
#写入命令执行失败
127.0.0.1:63001> SET mywebsite www.biancheng.net
(error) READONLY You can't write against a read only replica.
#再次切换为主机模式，执行下面命令
127.0.0.1:63001> SLAVEOF no one
OK
#写入成功
127.0.0.1:63001> SET mywebsite www.biancheng.net
OK
```

上述示例中，主要使用了两个命令，如下所示：

```sh
slaveof IP PORT #设置从服务器
slaveof no one  #使服务器切换为独立主机
```

#### 2) 修改配置文件实现

每个 Redis 服务器都有一个与其对应的配置文件，通过修改该配置文件也可以实现主从模式，下面在 Ubuntu 环境下对该方法进行演练。

新建 redis_6302.conf 文件,并添加以下配置信息：

```sh
slaveof 127.0.0.1 6379 #指定主机的ip与port
port 6302 #指定从机的端口
```

启动 Redis 服务器，执行以下命令：

```sh
$ redis-server redis_6302.conf
```

客户端连接服务器，并进行简单测试。执行以下命令：

```sh
$ redis-cli -p 6302
127.0.0.1:6300> HSET user:username biangcheng
#写入失败
(error) READONLY You can't write against a read only slave.
```

==提示：通过命令搭建主从模式，简单又快捷，所以不建议您使用修改配置文件的方法。==

### 主从模式不足

主从模式并不完美，它也存在许多不足之处，下面做了简单地总结：

- **1)** Redis 主从模式不具备自动容错和恢复功能，如果主节点宕机，Redis 集群将无法工作，==此时需要人为干预，将从节点提升为主节点。==
- **2)** 如果主机宕机前有一部分数据未能及时同步到从机，即使切换主机后也会造成数据不一致的问题，从而降低了系统的可用性。
- **3)** 因为只有一个主节点，所以其写入能力和存储能力都受到一定程度地限制。
- **4)** 在进行数据全量同步时，若同步的数据量较大可能会造卡顿的现象。



## 10、Redis哨兵

在 Redis 主从复制模式中，因为系统不具备自动恢复的功能，所以当主服务器（master）宕机后，需要手动把一台从服务器（slave）切换为主服务器。在这个过程中，不仅需要人为干预，而且还会造成一段时间内服务器处于不可用状态，同时数据安全性也得不到保障，因此主从模式的可用性较低，不适用于线上生产环境。

==Redis 官方推荐一种高可用方案，也就是 Redis Sentinel 哨兵模式，它弥补了主从模式的不足。Sentinel 通过监控的方式获取主机的工作状态是否正常，当主机发生故障时， Sentinel 会自动进行 Failover（即故障转移），并将其监控的从机提升主服务器（master），从而保证了系统的高可用性。==

### 哨兵模式原理

哨兵模式是一种特殊的模式，Redis 为其提供了专属的哨兵命令，它是一个独立的进程，能够独立运行。下面使用 Sentinel 搭建 Redis 集群，基本结构图如下所示：

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_sentryWork.png)


图1：哨兵基本模式


在上图过程中，哨兵主要有两个重要作用：

- 第一：哨兵节点会以每秒一次的频率对每个 Redis 节点发送`PING`命令，并通过 Redis 节点的回复来判断其运行状态。
- 第二：当哨兵监测到主服务器发生故障时，会自动在从节点中选择一台将机器，并其提升为主服务器，然后使用 PubSub 发布订阅模式，通知其他的从节点，修改配置文件，跟随新的主服务器。

==在实际生产情况中，Redis Sentinel 是集群的高可用的保障，为避免 Sentinel 发生意外，它一般是由 3～5 个节点组成，这样就算挂了个别节点，该集群仍然可以正常运转。其结构图如下所示：==



![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_sentryMore.png)
图2：多哨兵模式


上图所示，多个哨兵之间也存在互相监控，这就形成了多哨兵模式，现在对该模式的工作过程进行讲解，介绍如下：

#### 1) 主观下线

主观下线，适用于主服务器和从服务器。如果在规定的时间内(配置参数：down-after-milliseconds)，Sentinel 节点没有收到目标服务器的有效回复，则判定该服务器为“主观下线”。比如 Sentinel1 向主服务发送了`PING`命令，在规定时间内没收到主服务器`PONG`回复，则 Sentinel1 判定主服务器为“主观下线”。

#### 2) 客观下线

客观下线，只适用于主服务器。 Sentinel1 发现主服务器出现了故障，它会通过相应的命令，询问其它 Sentinel 节点对主服务器的状态判断。如果超过半数以上的 Sentinel 节点认为主服务器 down 掉，则 Sentinel1 节点判定主服务为“客观下线”。

#### 3) 投票选举

投票选举，所有 Sentinel 节点会通过投票机制，按照谁发现谁去处理的原则，选举 Sentinel1 为领头节点去做 Failover（故障转移）操作。Sentinel1 节点则按照一定的规则在所有从节点中选择一个最优的作为主服务器，然后通过发布订功能通知其余的从节点（slave）更改配置文件，跟随新上任的主服务器（master）。至此就完成了主从切换的操作。

对上对述过程做简单总结：

Sentinel 负责监控主从节点的“健康”状态。当主节点挂掉时，自动选择一个最优的从节点切换为主节点。客户端来连接 Redis 集群时，会首先连接 Sentinel，通过 Sentinel 来查询主节点的地址，然后再去连接主节点进行数据交互。当主节点发生故障时，客户端会重新向 Sentinel 要地址，Sentinel 会将最新的主节点地址告诉客户端。因此应用程序无需重启即可自动完成主从节点切换。

### 哨兵模式应用

Redis Sentinel 哨兵模式适合于在 Linux 系统中使用，所以下面的应用都基于 centos实现。

#### 1) 搭建主从模式

接下来，在本地环境使用主从模式搭建一个拥有三台服务器的 Redis 集群节点

```sh
redis-server redis.conf
redis-server redis6300.conf
redis-server redis6301.conf
```

配置master6379—slave 6300/6301

分别在slave6300/6301的节点下去执行：

```sh
slaveof 127.0.0.1 6379
```

#### 2) 单版本配置sentinel哨兵

```sh
cp sentinel.conf sentinel23679.conf
```

1: 新建sentinel26379.conf文件

```sh
sentinel monitor myredis 127.0.0.1 6379 1
sentinel auth-pass myredis mkxiaoer
# 主节点宕机以后选举的间隔时间10s 单位是毫秒
sentinel down-after-milliseconds myredis 10000
 
# Generated by CONFIG REWRITE
dir "/www/redis-7.0.8"
protected-mode no
port 26379
latency-tracking-info-percentiles 50 99 99.9
user default on nopass ~* &* +@all
sentinel myid c71c7cc530f5d800db6c78bc537c9a4764a7895f
sentinel config-epoch myredis 0
sentinel leader-epoch myredis 1
sentinel current-epoch 1


```

2：启动哨兵即可

```sh
redis-sentinel ./sentinel26379.conf
```

3：然后把master节点挂掉, 可以很清楚看到，会自动选举到6301节点去了

4：如果把旧的master6379启动，就会自动变成6301的slave节点。

#### 3) 集群版本配置sentinel哨兵

首先新建 sentinel.conf 文件，并对其进行配置，如下所示：

 **sentinel26379.conf** 

```sh
sentinel monitor myredis 127.0.0.1 6379 2
sentinel auth-pass myredis mkxiaoer
# 主节点宕机以后选举的间隔时间10s 单位是毫秒
sentinel down-after-milliseconds myredis 10000

# Generated by CONFIG REWRITE
dir "/www/redis-7.0.8"
protected-mode no
port 26379

```

 **sentinel26380.conf** 

```sh
sentinel monitor myredis 127.0.0.1 6379 2
sentinel auth-pass myredis mkxiaoer
# 主节点宕机以后选举的间隔时间10s 单位是毫秒
sentinel down-after-milliseconds myredis 10000

# Generated by CONFIG REWRITE
dir "/www/redis-7.0.8"
protected-mode no
port 26380

```

 **sentinel26381.conf** 

```sh
sentinel monitor myredis 127.0.0.1 6379 2
sentinel auth-pass myredis mkxiaoer
# 主节点宕机以后选举的间隔时间10s 单位是毫秒
sentinel down-after-milliseconds myredis 10000

# Generated by CONFIG REWRITE
dir "/www/redis-7.0.8"
protected-mode no
port 26381
```

配置文件说明如下：

```sh
port 26379 #sentinel监听端口，默认是26379，可以更改
sentinel monitor <master-name> <ip> <redis-port> <quorum>
```

第二个配置项表示：让 sentinel 去监控一个地址为 ip:port 的主服务器，这里的 master-name 可以自定义；<quorum> 是一个数字，表示当有多少个 sentinel 认为主服务器宕机时，它才算真正的宕机掉，通常数量为半数或半数以上才会认为主机已经宕机，<quorum> 需要根据 sentinel 的数量设置。

-  <quorum>  sentinel monitor ：sentinel监控的master节点的名称、地址和端口号，最后一个quorums表示至少需要多少个sentinel判定master节点故障才进行故障转移。一般配置为sentinel数量/2+1

#### 4) 启动sentienl哨兵

```sh
方式一: 
redis-sentinel sentinel.conf
方式二: 
redis-server sentinel.conf --sentinel
```



### sentinel.conf配置项

下面对 Sentinel 配置文件的其他配置项做简单说明：

| 配置项                                      | 参数类型                   | 说明                                                         |
| ------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| dir                                         | 文件目录                   | 哨兵进程服务的文件存放目录，默认为 /tmp。                    |
| port                                        | 端口号                     | 启动哨兵的进程端口号，默认为 26379。                         |
| sentinel down-after-milliseconds            | <服务名称><毫秒数(整数)>   | 在指定的毫秒数内，若主节点没有应答哨兵的 PING 命令，此时哨兵认为服务器主观下线，默认时间为 30 秒。 |
| sentinel parallel-syncs                     | <服务名称><服务器数(整数)> | 指定可以有多少个 Redis 服务同步新的主机，一般而言，这个数字越小同步时间越长，而越大，则对网络资源要求就越高。 |
| sentinel failover-timeout                   | <服务名称><毫秒数(整数)>   | 指定故障转移允许的毫秒数，若超过这个时间，就认为故障转移执行失败，默认为 3 分钟。 |
| sentinel notification-script                | <服务名称><脚本路径>       | 脚本通知，配置当某一事件发生时所需要执行的脚本，可以通过脚本来通知管理员，例如当系统运行不正常时发邮件通知相关人员。 |
| sentinel auth-pass <master-name> <password> | <服务器名称><密码>         | 若主服务器设置了密码，则哨兵必须也配置密码，否则哨兵无法对主从服务器进行监控。该密码与主服务器密码相同。 |

## 11、Redis集群

Redis集群是一个由多个主从节点组成的分布式服务器群，它具有复制，高可用和分片特性。Redis的集群将所有的数据存储区域划分为==16384个槽（slot）==。每个节点负责一部分槽。槽的信息存储于每个节点中。Redis集群要将每个节点设置成集群模式，它没有中心节点的概念，可以水平扩展，它的性能和高可用用性均优越于主从模式和哨兵模式。而且集群配置非常简单。如下图：

![img](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_cluster.png)

从Redis集群架构中可以很容易的看出来，首先将数据根据散列规则分配到6个槽中。然后根据循环冗余校验CRC算法和取模算法讲6个槽分别存储到3个不同的master节点中，每个master节点又配套部署一个slave节点，当一个master节点出现问题后，slave节点会自动顶上，相比于哨兵模式，这个方案的有点在于：提高了读写的并发率，分散了i/o。在保障高可用性的前提下提供了性能。



### Redis集群环境的准备

- 主节点不能少于总节点的一半
- 主节点至少要有3个



### Redis单机部署Redis集群

- IP: 116.62.68.227
- redis的集群端口：
  - 8001
  - 8002
  - 8003
  - 8004
  - 8005
  - 8006
- redis的版本：7.0.8
- 操作系统：centos7.8

### Redis多机部署Redis集群

- redis的集群端口：
  - 116.62.68.227 8001
  - 116.62.68.228 8001
  - 116.62.68.229 8001
  - 116.62.68.230 8001
  - 116.62.68.233 8001
  - 116.62.68.221 8001
- redis的版本：7.0.8
- 操作系统：centos7.8



### 具体实现步骤

- 第一步：先解压安装redis7.0.8

  - ==记得配置redis的环境变量==

- 第二步：然后把redis.conf文件复制6份

  ```properties
  mkdir /cluster
  cd /cluster
  mkdir -p 8001 8002 8003 8004 8005 8006 
  cp /www/redis-7.0.8/redis.conf /www/redis-7.0.8/cluster/redis.conf
  cp redis.conf /www/redis-7.0.8/cluster/8001/redis.conf
  cp redis.conf /www/redis-7.0.8/cluster/8002/redis.conf
  cp redis.conf /www/redis-7.0.8/cluster/8003/redis.conf
  cp redis.conf /www/redis-7.0.8/cluster/8004/redis.conf
  cp redis.conf /www/redis-7.0.8/cluster/8005/redis.conf
  cp redis.conf /www/redis-7.0.8/cluster/8006/redis.conf
  ```

  

- 第三步：每个对应的配置如下，这里以8001为例子

  ```properties
  # 1: 保护模式启动
  daemonize yes
  # 2: 修改端口
  port 8001
  # 3：修改数据存储的目录，这里必须要指定不同的目录位置，否则会造成数据的丢失
  dir /www/redis-7.0.8/cluster/8001
  # 4：开启集群模式
  cluster-enabled yes
  # 5:集群节点信息文件，这里最好和端口保持一致
  cluster-config-file nodes-8001.conf
  # 6: 集群节点的超时时限，单位是毫秒
  cluster-node-timeout 10000
  # 7：修改为主讲的ip地址，默认地址是：127.0.0.1，需要修改成其他节点计算机可以访问的ip地址，否则创建集群的时候无法访问对应节单机的端口，无法创建集群。
  # 本机建议设置： 本机ip
  # 如果是多机设置：阿里云的内网IP或者注释掉或者bind:0.0.0.0
  bind 0.0.0.0
  # 8: 受保护的模式，关闭，否则也会造成集群没办法创建成功
  protected-mode no
  # 9: 开启aof的数据持久化
  appendonly yes
  # 10: aof持久化的文件名
  appendfilename "appendonly8001.aof"
  # 11:aof放文件所放的位置，它是和dir一起拼接形成，比如：/www/redis-7.0.8/cluster/8001/aof/appendonly8001.aof
  appenddirname "aof"
  # 12:当前服务节点的密码
  requirepass mkxiaoer
  # 13:如果自身作为从节点以后，如果链接master节点有密码，一定要配置，建议设置密码的时候都保持一致
  masterauth mkxiaoer
  ```

- 第四步：然后把修改redis8001.conf文件，分别复制到8002,8003,8004,8005,8006中，每个文件只需要修改 （2），（3），（5），（10里的端口信息即可

- 第五步：然后分别把6个redis节点启动，然后检查是否启动成功

  ```properties
  redis-server /www/redis-7.0.8/cluster/8001/redis.conf
  redis-server /www/redis-7.0.8/cluster/8002/redis.conf
  redis-server /www/redis-7.0.8/cluster/8003/redis.conf
  redis-server /www/redis-7.0.8/cluster/8004/redis.conf
  redis-server /www/redis-7.0.8/cluster/8005/redis.conf
  redis-server /www/redis-7.0.8/cluster/8006/redis.conf
  ```

  检查是否启动成功

  ```sh
  ps -ef | grep  redis
  ```

  

- 第六步：使用redis-cli创建redis集群

  - redis-cli --cluster create --cluster-replicas 1 这个数字1代表是未来节点都会有一个从节点，代表一注意从，如果写2，就是代表一主2从。
  - -a 每个节点的密码，建议大家写成一样的即可

  ```sh
  redis-cli --cluster create --cluster-replicas 1 127.0.0.1:8001  127.0.0.1:8002 127.0.0.1:8003 127.0.0.1:8004 127.0.0.1:8005 127.0.0.1:8006 -a mkxiaoer
  ```

  

- 第七步：查看效果以及它们的映射关系，进入任意一个节点都可以。

  ```properties
  redis-cli -c -h 127.0.0.1 -p 8001 
  redis-cli -c -h 127.0.0.1 -p 8002 
  redis-cli -c -h 127.0.0.1 -p 8003 
  redis-cli -c -h 127.0.0.1 -p 8004 
  redis-cli -c -h 127.0.0.1 -p 8005 
  redis-cli -c -h 127.0.0.1 -p 8006 
  ```

  ```properties
  > redis-cli -c -h 127.0.0.1 -p 8001 
  > auth mkxiaoer
  > cluster info
  #集群状态正常
  cluster_state:ok
  cluster_slots_assigned:16384
  cluster_slots_ok:16384
  cluster_slots_pfail:0
  cluster_slots_fail:0
  # 6个节点
  cluster_known_nodes:6
  cluster_size:3
  
  > cluster nodes
  d88b17b0abb2a82dc4350e93abaebe0353228df2 127.0.0.1:8004@18004 slave 6192b1d7512ec3fd4bd880cc455a47da54f4feca 0 1675915939398 2 connected
  6192b1d7512ec3fd4bd880cc455a47da54f4feca 127.0.0.1:8002@18002 master - 0 1675915938000 2 connected 5461-10922
  41f8ccda22abebaa726191b765c88eae00cd3655 127.0.0.1:8006@18006 slave 
  6d555d82e36280900e8de704896e4b3846465655 0 1675915939000 1 connected
  6d555d82e36280900e8de704896e4b3846465655 127.0.0.1:8001@18001 myself,master - 0 1675915938000 1 connected 0-5460
  d45cce869590400ad7dbda32a825ab0741d0e41e 127.0.0.1:8005@18005 slave e1df9acf919b9234611883d093a7ff4b687a9dee 0 1675915939000 3 connected
  e1df9acf919b9234611883d093a7ff4b687a9dee 127.0.0.1:8003@18003 master - 0 1675915940399 3 connected 10923-16383
  ```

  可以看到3主3从的集群架构就搭建好了：

  -  8002master—8004slave
  -  8001master—8006slave
  -  8003master—8005slave

- 在8002master节点上添加数据—-在8004slave节点上可以获取到数据，说明成功。如果一旦把8002停止。那么8004节点就会瘫痪在此处。

  ```properties
  # 主节点8002
  > redis-cli -c -h 127.0.0.1 -p 8002
  > set name feige
  > get name 
  feige
  
  
  # 从节点8004
  >redis-cli -c -h 127.0.0.1 -p 8004
  >get name
  feige
  ```

- 如果你想关闭所有的集群节点可以使用：

  ```sh
  redis-cli -c -h 127.0.0.1 -p 8001 -a mkxiaoer shutdown
  redis-cli -c -h 127.0.0.1 -p 8002 -a mkxiaoer shutdown
  redis-cli -c -h 127.0.0.1 -p 8003 -a mkxiaoer shutdown
  redis-cli -c -h 127.0.0.1 -p 8004 -a mkxiaoer shutdown
  redis-cli -c -h 127.0.0.1 -p 8005 -a mkxiaoer shutdown
  redis-cli -c -h 127.0.0.1 -p 8006 -a mkxiaoer shutdown
  ```

  

### 集群节点的具体操作

- 新增Redis的主节点

  - 新增Redis新节点8007–master

    ```sh
    # 创建一个redis8007的主节点
    > cp redis.conf /www/redis-7.0.8/cluster/8007/redis.conf
    # 启动主节点8007
    > redis-server /www/redis-7.0.8/cluster/8007/redis.conf
    # 通过add-node命令增加集群节点，这里8001做个陪衬，你可以在集群中随便找个其他的也是可以的
    > redis-cli --cluster add-node 127.0.0.1:8007 127.0.0.1:8001 -a mkxiaoer
    # 查看集群节点
    > redis-cli -p 8001
    > auth mkxiaoer
    > cluster info
    # 开始分配8007节点的hash槽范围
    ```

  - 给新增的Redis主节点8007分配hash槽

    ```sh
    # 给新增的主节点分配hash槽
    > redis-cli --cluster reshard 127.0.0.1:8007 -a mkxiaoer
    # 给主节点8007分配多少个槽位，这里设定是1000
    > How many slots do you want to move (from 1 to 16384)? 1000
    # 给8007开始进行设定操作,这里的id是8007的master d0b678984c3c6f06b6c4510694d76b8381a45762
    > What is the receiving node ID? d0b678984c3c6f06b6c4510694d76b8381a45762
    > Please enter all the source node IDs.
      Type 'all' to use all the nodes as source nodes for the hash slots.
      Type 'done' once you entered all the source nodes IDs.
      # 输入all.代表将全部重新分配的hash槽位
    Source node #1: all
    # 输入yes开始进行重新分配hash槽
    > Do you want to proceed with the proposed reshard plan (yes/no)?  yes
    > 然后就会自动去调整和重新分配槽位
    ```

  - 查看是否分配成功

    ```properties
    > redis-cli -p 8007
    > auth mkxiaoer
    > cluster info
    > cluster nodes
    d88b17b0abb2a82dc4350e93abaebe0353228df2 127.0.0.1:8004@18004 slave 6192b1d7512ec3fd4bd880cc455a47da54f4feca 0 1675923474000 2 connected
    6d555d82e36280900e8de704896e4b3846465655 127.0.0.1:8001@18001 myself,master - 0 1675923474000 1 connected 666-5460
    41f8ccda22abebaa726191b765c88eae00cd3655 127.0.0.1:8006@18006 slave 6d555d82e36280900e8de704896e4b3846465655 0 1675923474000 1 connected
    6192b1d7512ec3fd4bd880cc455a47da54f4feca 127.0.0.1:8002@18002 master - 0 1675923474095 2 connected 6129-10922
    d45cce869590400ad7dbda32a825ab0741d0e41e 127.0.0.1:8005@18005 slave e1df9acf919b9234611883d093a7ff4b687a9dee 0 1675923473000 3 connected
    e1df9acf919b9234611883d093a7ff4b687a9dee 127.0.0.1:8003@18003 master - 0 1675923476100 3 connected 11589-16383
    aced14e6f490ca573bed0042f185ce22298d6a9d 127.0.0.1:8007@18007 master - 0 1675923475097 7 connected 0-665 5461-6128 10923-11588
    ```

    

- 新增Redis的从节点

  - 新增Redis新节点8008-slave

    ```sh
    # 先添加一个从节点8008
    > cp redis.conf /www/redis-7.0.8/cluster/8008/redis.conf
    # 启动从节点8008
    > redis-server /www/redis-7.0.8/cluster/8008/redis.conf
    # 把从节点8008加入到集群中
    > redis-cli --cluster add-node 127.0.0.1:8008 127.0.0.1:8001 -a mkxiaoer
    # 查看集群节点的信息
    > redis-cli -p 8008
    # 查看节点信息，可以得到现在8008和8007还没关系
    > cluster nodes
    # 开始绑定8008和8007关系，也就是把8008变成8007的从节点
    # 绑定的命令是  CLUSTER REPLICATE  id (主节点的id 8007)
    # 执行这个命令必须进入到8008的客户端中去执行
    > CLUSTER REPLICATE d0b678984c3c6f06b6c4510694d76b8381a45762
    # 查看集群节点信息即可。
    > cluster nodes
    d45cce869590400ad7dbda32a825ab0741d0e41e 127.0.0.1:8005@18005 slave e1df9acf919b9234611883d093a7ff4b687a9dee 0 1675923789000 3 connected
    aced14e6f490ca573bed0042f185ce22298d6a9d 127.0.0.1:8007@18007 master - 0 1675923789879 7 connected 0-665 5461-6128 10923-11588
    6192b1d7512ec3fd4bd880cc455a47da54f4feca 127.0.0.1:8002@18002 master - 0 1675923787876 2 connected 6129-10922
    6d555d82e36280900e8de704896e4b3846465655 127.0.0.1:8001@18001 master - 0 1675923790881 1 connected 666-5460
    d88b17b0abb2a82dc4350e93abaebe0353228df2 127.0.0.1:8004@18004 slave 6192b1d7512ec3fd4bd880cc455a47da54f4feca 0 1675923791883 2 connected
    64ab4eb42ae02de188270c114d41d83006122a91 127.0.0.1:8008@18008 myself,slave aced14e6f490ca573bed0042f185ce22298d6a9d 0 1675923791000 7 connected
    e1df9acf919b9234611883d093a7ff4b687a9dee 127.0.0.1:8003@18003 master - 0 1675923791000 3 connected 11589-16383
    41f8ccda22abebaa726191b765c88eae00cd3655 127.0.0.1:8006@18006 slave 6d555d82e36280900e8de704896e4b3846465655 0 1675923790000 1 connected
    ```

    把8008的slave节点和8007进行关联，形成master-slave 。上面可以清楚的看到8007和8008形成了主从关系。现在就是4主4从的关系。

- 删除Redis的集群节点

  - 删除从节点8008

    ```sh
    > redis-cli --cluster del-node 127.0.0.1:8008 bf396950d13769ba4fd4bc5bf4ce7185d24b27e5 -a mkxiaoer
    ```

  - 删除主节点

    ```sh
    # 重新把8007的占用hash槽进行释放或者说把数据进行迁移，然后在删除
    >  redis-cli --cluster reshard 127.0.0.1:8007 -a mkxiaoer --cluster-from d0b678984c3c6f06b6c4510694d76b8381a45762
    
    
    How many slots do you want to move (from 1 to 16384)? 1000
    # aced14e6f490ca573bed0042f185ce22298d6a9d这里的id是别的masterid
    What is the receiving node ID? aced14e6f490ca573bed0042f185ce22298d6a9d
    Please enter all the source node IDs.
      Type 'all' to use all the nodes as source nodes for the hash slots.
      Type 'done' once you entered all the source nodes IDs.
    Source node #1: all
    > Do you want to proceed with the proposed reshard plan (yes/no)?  yes
    > 然后就会自动去调整和重新分配槽位
    
    # 完整写法,可以取代上面的步骤
    #>redis-cli --cluster reshard 192.168.116.175:8007 --cluster-from d0b678984c3c6f06b6c4510694d76b8381a45762 --cluster-to 60e3755761c9cbdacb183f59e3d6205da5335e86 --cluster-slots 1000 --cluster-yes
    
    
    # 然后在执行删除即可
    >  redis-cli --cluster del-node 127.0.0.1:8007 d0b678984c3c6f06b6c4510694d76b8381a45762 -a mkxiaoer
    ```

  - 参考文档：https://blog.csdn.net/GUDUzhongliang/article/details/114586620

## 12、Redis的缓存穿透和雪崩

实际的业务场景中，Redis 一般和其他数据库搭配使用，用来减轻后端数据库的压力，比如和关系型数据库 MySQL 配合使用。

Redis 会把 MySQL 中经常被查询的数据缓存起来，比如热点数据，这样当用户来访问的时候，就不需要到 MySQL 中去查询了，而是直接获取 Redis 中的缓存数据，从而降低了后端数据库的读取压力。如果说用户查询的数据 Redis 没有，此时用户的查询请求就会转到 MySQL 数据库，当 MySQL 将数据返回给客户端时，同时会将数据缓存到 Redis 中，这样用户再次读取时，就可以直接从 Redis 中获取数据。流程图如下所示：



![Redis缓存使用流程图](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_appCache.png)
图1：缓存使用流程图


在使用 Redis 作为缓存数据库的过程中，有时也会遇到一些棘手问题，比如常见缓存穿透、缓存击穿和缓存雪崩等问题，本节将对这些问题做简单地说明，并且提供有效的解决方案。

### 缓存穿透

缓存穿透是指当用户查询某个数据时，Redis 中不存在该数据，也就是缓存没有命中，此时查询请求就会转向持久层数据库 MySQL，结果发现 MySQL 中也不存在该数据，MySQL 只能返回一个空对象，代表此次查询失败。如果这种类请求非常多，或者用户利用这种请求进行恶意攻击，==就会给 MySQL 数据库造成很大压力，甚至于崩溃，这种现象就叫缓存穿透。==

为了避免缓存穿透问题，下面介绍两种解决方案：

#### 1) 缓存空对象

当 MySQL 返回空对象时， Redis 将该对象缓存起来，同时为其设置一个过期时间。当用户再次发起相同请求时，就会从缓存中拿到一个空对象，用户的请求被阻断在了缓存层，从而保护了后端数据库，但是这种做法也存在一些问题，虽然请求进不了 MSQL，但是这种策略会占用 Redis 的缓存空间。

#### 2) 布隆过滤器

我们知道，布隆过滤器判定不存在的数据，那么该数据一定不存在，利用它的这一特点可以防止缓存穿透。

首先将用户可能会访问的热点数据存储在布隆过滤器中（也称缓存预热），当有一个用户请求到来时会先经过布隆过滤器，如果请求的数据，布隆过滤器中不存在，那么该请求将直接被拒绝，否则将继续执行查询。相较于第一种方法，用布隆过滤器方法更为高效、实用。其流程示意图如下：

![缓存穿透问题](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_appBlond.png)
图2：缓存穿透问题解决

#### **缓存预热：**

是指系统启动时，提前将相关的数据加载到 Redis 缓存系统中。这样避免了用户请求的时再去加载数据。

### 缓存击穿—order key

缓存击穿是指用户查询的数据缓存中不存在，但是后端数据库却存在，这种现象出现原因是一般是由缓存中 key 过期导致的。比如一个热点数据 key，它无时无刻都在接受大量的并发访问，如果某一时刻这个 key 突然失效了，就致使大量的并发请求进入后端数据库，导致其压力瞬间增大。这种现象被称为缓存击穿。

缓存击穿有两种解决方法：

#### 1) 改变过期时间

- 设置热点数据永不过期。
- 把时间全部错开

#### 2) 分布式锁

采用分布式锁的方法，重新设计缓存的使用方式，过程如下：

- 上锁：当我们通过 key 去查询数据时，首先查询缓存，如果没有，就通过分布式锁进行加锁，第一个获取锁的进程进入后端数据库查询，并将查询结果缓到Redis 中。
- 解锁：当其他进程发现锁被某个进程占用时，就进入等待状态，直至解锁后，其余进程再依次访问被缓存的 key。

### 缓存雪崩

缓存雪崩是指缓存中大批量的 key 同时过期，而此时数据访问量又非常大，从而导致后端数据库压力突然暴增，甚至会挂掉，这种现象被称为缓存雪崩。它和缓存击穿不同，缓存击穿是在并发量特别大时，某一个热点 key 突然过期，而缓存雪崩则是大量的 key 同时过期，因此它们根本不是一个量级。

- 高可用
- 集群

#### 解决方案

缓存雪崩和缓存击穿有相似之处，所以也可以采用热点数据永不过期的方法，来减少大批量的 key 同时过期。再者就是为 key 设置随机过期时间，避免 key 集中过期。





## 13、Redis布隆过滤器bloomfilter

### 概述

布隆过滤器（Bloom Filter）是 Redis 4.0 版本提供的新功能，它被作为插件加载到 Redis 服务器中，给 Redis 提供强大的去重功能。

相比于 Set 集合的去重功能而言，布隆过滤器在空间上能节省 90% 以上，但是它的不足之处是去重率大约在 99% 左右，也就是说有 1% 左右的误判率，这种误差是由布隆过滤器的自身结构决定的。俗话说“鱼与熊掌不可兼得”，如果想要节省空间，就需要牺牲 1% 的误判率，而且这种误判率，在处理海量数据时，几乎可以忽略。

### 应用场景

布隆过滤器是 Redis 的高级功能，虽然这种结构的去重率并不完全精确，但和其他结构一样都有特定的应用场景，比如当处理海量数据时，就可以使用布隆过滤器实现去重。

下面举两个简单的例子：

#### 1) 示例：

百度爬虫系统每天会面临海量的 URL 数据，我们希望它每次只爬取最新的页面，而对于没有更新过的页面则不爬取，因策爬虫系统必须对已经抓取过的 URL 去重，否则会严重影响执行效率。但是如果使用一个 set（集合）去装载这些 URL 地址，那么将造成资源空间的严重浪费。

#### 2) 示例：

垃圾邮件过滤功能也采用了布隆过滤器。虽然在过滤的过程中，布隆过滤器会存在一定的误判，但比较于牺牲宝贵的性能和空间来说，这一点误判是微不足道的。

### 工作原理

布隆过滤器（Bloom Filter）是一个高空间利用率的概率性数据结构，由二进制向量（即位数组）和一系列随机映射函数（即哈希函数）两部分组成。

布隆过滤器使用`exists()`来判断某个元素是否存在于自身结构中。当布隆过滤器判定某个值存在时，其实这个值只是有可能存在；当它说某个值不存在时，那这个值肯定不存在，这个误判概率大约在 1% 左右。

#### 1) 工作流程-添加元素

布隆过滤器主要由位数组和一系列 hash 函数构成，其中位数组的初始状态都为 0。

下面对布隆过滤器工作流程做简单描述，如下图所示：



![Redis布隆过滤器](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/redis_blond.png)
图1：布隆过滤器原理


当使用布隆过滤器添加 key 时，会使用不同的 hash 函数对 key 存储的元素值进行哈希计算，从而会得到多个哈希值。根据哈希值计算出一个整数索引值，将该索引值与位数组长度做取余运算，最终得到一个位数组位置，并将该位置的值变为 1。每个 hash 函数都会计算出一个不同的位置，然后把数组中与之对应的位置变为 1。通过上述过程就完成了元素添加(add)操作。

#### 2) 工作流程-判定元素是否存在

当我们需要判断一个元素是否存时，其流程如下：首先对给定元素再次执行哈希计算，得到与添加元素时相同的位数组位置，判断所得位置是否都为 1，如果其中有一个为 0，那么说明元素不存在，若都为 1，则说明元素有可能存在。

#### 3) 为什么是可能“存在”

您可能会问，为什么是有可能存在？其实原因很简单，那些被置为 1 的位置也可能是由于其他元素的操作而改变的。比如，元素1 和 元素2，这两个元素同时将一个位置变为了 1（图1所示）。在这种情况下，我们就不能判定“元素 1”一定存在，这是布隆过滤器存在误判的根本原因。

### 安装与使用

在 Redis 4.0 版本之后，布隆过滤器才作为插件被正式使用。布隆过滤器需要单独安装，下面介绍安装 RedisBloom 的几种方法：

#### 1) docker安装

docker 安装布隆过滤器是最简单、快捷的一种方式：

```sh
docker pull redislabs/rebloom:latest
docker run -p 6379:6379 --name redis-redisbloom redislabs/rebloom:latest
docker exec -it redis-redisbloom bash
redis-cli
#测试是否安装成功
127.0.0.1:6379> bf.add www.biancheng.net hello
```

#### 2) 直接编译安装

如果您对 docker 不熟悉，也可以采用直接编译的方式来安装。

```sh
下载地址：
https://github.com/RedisBloom/RedisBloom
解文件：
> wget https://github.com/RedisBloom/RedisBloom/archive/refs/tags/v2.2.18.tar.gz
进入目录：
> tar -zxvf v2.2.18.tar.gz
> cd RedisBloom-2.2.18
执行编译命令，生成redisbloom.so 文件：
> make
在redis配置文件里加入以下配置：
> loadmodule /www/redis-7.0.8/RedisBloom-2.2.18/redisbloom.so
配置完成后重启redis服务：
> redis-server /www/redis-7.0.8/redis.conf
#测试是否安装成功
> 127.0.0.1:6379> bf.add www.biancheng.net hello
```

### 常用命令汇总

,

| 命令       | 说明                                                         |
| ---------- | ------------------------------------------------------------ |
| bf.add     | 只能添加元素到布隆过滤器。                                   |
| bf.exists  | 判断某个元素是否在于布隆过滤器中。                           |
| bf.madd    | 同时添加多个元素到布隆过滤器。                               |
| bf.mexists | 同时判断多个元素是否存在于布隆过滤器中。                     |
| bf.reserve | 以自定义的方式设置布隆过滤器参数值，共有 3 个参数分别是 key、error_rate(错误率)、initial_size(初始大小)。 |

#### 1) 命令应用

```sh
127.0.0.1:6379> bf.add spider:url www.biancheng.net
(integer) 1
127.0.0.1:6379> bf.exists spider:url www.biancheng.net
(integer) 1
127.0.0.1:6379> bf.madd spider:url www.taobao.com www.123qq.com
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> bf.mexists spider:url www.jd.com www.taobao.com
1) (integer) 0
2) (integer) 1
```

