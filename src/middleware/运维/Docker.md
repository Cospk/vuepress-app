---
# 这是文章的标题
title: Docker-理论


# 这是侧边栏的顺序
order: 1
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2020-01-01

# 一个页面可以有多个标签
tag:
  - 运维

# 此页面会出现在星标文章中
star: true
---

### 为什么要用docker？

使用docker可以大幅简化部署软件的流程，也解决很多因为环境导致的问题

我们开发好软件后，需要部署服务，传统的方式是对每一个服务器配置同样的环境（安装基础软件，配置环境啥的），每台服务器操作繁琐复杂，后续出现虚拟机，也是需要继续配置繁琐的环境。docker出现后，可以将基础环境、配置好的参数和项目一起打包到一个容器，直接在docker中运行这个容器就行。



### docker优势？

- **可移植性**：应用程序及其依赖被打包成一个容器，可以在任何平台上运行。
- **一致性**：通过容器，开发、测试、生产环境可以保持一致。
- **资源效率**：容器比虚拟机更轻量级，启动速度更快，占用资源更少。
- **隔离性**：容器提供了应用级别的隔离，减少了依赖冲突的风险。

:::tip

有点类似于app一样，开发后打包成app，可发布到应用市场，安卓手机下载就可使用

:::



## 01、Docker基础



1. 安装 Docker
2.  Docker 的核心概念
   - 容器（Container）
   - 镜像（Image）
   -  仓库（Repository）
   -  Dockerfile
   -  镜像与容器的生命周期
3. Docker 命令详解
   - `docker run`
   -  `docker ps`
   -  `docker build`
   -  `docker pull`
   -  `docker push`
   -  `docker exec`
   -  `docker stop` 和 `docker start`
4.  Docker 的常见操作流程



### Docker必要概念

**Docker的架构图**

![image-20200116185657945](E:\KuangStudy\直播\云原生\20231207：Docker基础-1\Docker基础.assets\image-20200116185657945.png)



- **镜像（image）：模版。 （基础环境+配置好的参数+项目）==> 镜像**

  ```sh
  镜像是容器的模板。镜像是静态的，不会改变，可以通过 Dockerfile 构建。它包含了操作系统、应用程序及其依赖
  ```

  

- **容器（container）：通过镜像来启动 运行是容器，就是我们自己自己封装部署的东西（项目、环境、日志...）**

  ```sh
  Doc容器是一个轻量级、可执行的独立软件包，它包含了运行应用所需的所有代码、库和配置文件。
  ```

- **仓库（repository）：Docker 仓库是存储 Docker 镜像的地方，可以是本地仓库或远程仓库（如 Docker Hub）。**

  ```sh
  仓库（Repository）是集中存放镜像文件的场所。
  
  仓库(Repository)和仓库注册服务器（Registry）是有区别的。仓库注册服务器上往往存放着多个仓库，每个仓库中又包含了多个镜像，每个镜像有不同的标签（tag）。
  
  仓库分为公开仓库（Public）和私有仓库（Private）两种形式。
  
  最大的公开仓库是 Docker Hub(https://hub.docker.com/)，存放了数量庞大的镜像供用户下载。
  国内的公开仓库包括阿里云 、网易云 等
  ```

- **Dockerfile：是一个文本文件，包含了构建 Docker 镜像的所有指令。通过 Dockerfile，可以从基础镜像构建自定义镜像**

**小结：**

需要正确的理解仓库/镜像/容器这几个概念 :

- image ：文件生成的容器实例，本身也是一个文件，称为镜像文件。
- 一个容器运行一种服务，当我们需要的时候，就可以通过docker客户端用镜像创建一个对应的运行实例，也就是我们的容器。
- 至于仓库，就是放了一堆镜像的地方，我们可以把镜像发布到仓库中，需要的时候从仓库中拉下来就可以了。

。那么我就不需要专门运送水果的船和专门运送化学品的船了。只要这些货物在集装箱里封装的好好的，那我就可以用一艘大船把他们都运走。

docker就是类似的理念。

### 安装Docker

1、官网安装参考手册：https://docs.docker.com/engine/install/centos/

2、保证环境是符合要求

3、卸载旧的docker

```shell
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
                  
# 安装 gcc 环境
yum -y install gcc
yum -y install gcc-c++
```

4、安装docker需要的仓库地址配置

```shell
sudo yum install -y yum-utils

# download.docker.com 很卡
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 在这里就要使用国内的镜像。
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

5、安装docker

```shell
#更新yum索引
yum makecache fast

#安装docker
yum install -y docker-ce docker-ce-cli containerd.io
```

6、启动docker

```shell
systemctl start docker

# 安装成功可以使用
docker version
```



7、测试是否安装成功

```shell
docker run hello-world
```



8、docker的卸载

```shell
syetemctl stop docker
yum remove docker-ce docker-ce-cli containerd.io 
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```



### Hello-world 干了什么

（仓库-->镜像-->容器）

> Docker run hello-world

1、寻找镜像（如果存在，则通过通过镜像启动容器，不存在，去仓库dockerhub下载镜像）

2、下载镜像（存在，拉取到本地，然后执行，不存在，就直接报错）



![image-20231207211042009](E:\KuangStudy\直播\云原生\20231207：Docker基础-1\Docker基础.assets\image-20231207211042009.png)



## Docker常用命令



学会在linux使用帮助文档--help



### 镜像命令

> 展示、寻找、拉取、删除镜像



```shell
[root@xiaoxie ~]$ docker images    #展示所有的镜像（可加参数：-a显示所有  -q只显示id）
REPOSITORY    TAG   IMAGE ID     CREATED      SIZE
仓库          标签    镜像id        创建时间      大小

[root@xiaoxie ~]$ docker search  镜像名   #查找想要的镜像（可选参数：--filter=STARS=50  避免垃圾镜像）

[root@xiaoxie ~]$ docker pull 镜像名   #下载镜像，默认latest 可指定版本镜像名:版本号

[root@xiaoxie ~]$ docker rmi -f 镜像或部分id  #删除本地的镜像
#批量删除：docker rmi -f $(docker images -aq)
```



### 容器命令

> **运行**、停止、强行停止、重启、启动关闭的容器、删除



```shell
#启动容器（没有镜像自己会去下），关键还是参数的添加
[root@xiaoxie ~]$ docker run  参数  镜像名 参数
--name=“”   给容器取名
-d          容器后台运行   ==即使有信息输出也不会输出当前窗口，完全后台运行
-i          容器交互的方式启动  ==向容器输入命令
-t          给容器分配一个终端登入使用   /bin/bash  ==伪终端，只是看运行情况，结合i才可输入
-p          指定端口映射 （宿主机端口：容器内的端口）

#其他命令：docker 命令 容器的id/容器名
#命令：start、restart、stop、kill、rm
[root@xiaoxie ~]$ docker rm hello-world
```



### 其他命令



> 查看日志  docker  logs



> 查看容器的元数据  docker  inspect  容器     ===查看容器内的各种信息，比如网络、创建时间、等等



> 进入正在运行的容器   
>
> docker  exec  -it   容器  /bin/bash    === 容器内开启一个新进程，新终端
>
> docker  attach  容器                         ===容器内不会开启进程，直接进入命令终端
>
> 退出
> ctl  + d  退出并停止容器
> ctl  + P  +Q  不退出仅退出



> 将容器内文件拷贝出来   docker   cp  容器  容器内的文件   主机的位置



> 看容器进程   docker  top  容器





## 原理



> 分析：什么是镜像，怎么样的结构，加载原理，最后生成并提交镜像



### 镜像是什么



解释：一种轻量级、可执行的独立软件包。镜像内除了软件本身，还包含软件运行时所需要的代码、运行时、库、环境之类的信息





### 加载原理



简单理解：容易构建镜像是基于镜像加载机制===搭积木方式构建

所有的镜像都是在最基础的镜像层上，添加内容创建新的镜像层，比如最基础的linux环境镜像上，配置配置信息，安装其他软件构成新的镜像



> 联合文件系统--unionFS



Union文件系统（UnionFS）是一种**分层、轻量级并且高性能的文件系统**，它支持对文件系统的修改作为一次提交来一层层的叠加，同时可以将不同目录挂载到同一个虚拟文件系统下(unite several directories into a single virtual filesystem)。Union 文件系统是 Docker 镜像的基础。镜像可以通过分层来进行继承，基于基础镜像（没有父镜像），可以制作各种具体的应用镜像。



> Docker镜像加载原理

docker的镜像实际上由一层一层的文件系统组成，这种层级的文件系统UnionFS。

平时我们安装进虚拟机的CentOS都是好几个G，为什么Docker这里才200M？

对于一个精简的OS，rootfs 可以很小，只需要包含最基本的命令，工具和程序库就可以了，因为底层直接用Host的kernel，自己只需要提供rootfs就可以了。由此可见对于不同的linux发行版, bootfs基本是一致的, rootfs会有差别, 因此不同的发行版可以公用bootfs。



### 生成一个镜像并提交



> 在了解镜像的组成以及原理，就可以自己写一个构建文件--dockerFile文件，用docker命令合成一个自己的镜像并提交到远程仓库了
> 镜像==一般是软件的交付品



什么是dockerFile文件？

dockerFile是由一堆命令和参数构成的脚本，然后docker是执行（由上至下执行）就可本地生成一个镜像了



步骤：

1、编写dockerFile文件

```shell
[root@xiaoxie ~]$ vim docker-web
#简易例子：将前端静态资源打包生成一个前端镜像
# 使用官方 Nginx 镜像作为基础镜像
#
FROM nginx:alpine

# 复制前端文件
#
COPY web /usr/share/nginx/html

# 复制自定义的 Nginx 配置文件
# 
COPY default.conf /etc/nginx/conf.d/default.conf

# 暴露端口
#
EXPOSE 80

# nginx官方已经设置默认的命令启动，就不用额外的补充
===================================命令========================================
FROM         # 基础镜像，当前新镜像是基于哪个镜像的
MAINTAINER   # 镜像维护者的姓名混合邮箱地址
RUN          # 容器构建时需要运行的命令
EXPOSE       # 当前容器对外保留出的端口
WORKDIR      # 指定在创建容器后，终端默认登录的进来工作目录，一个落脚点
ENV          # 用来在构建镜像过程中设置环境变量
ADD          # 将宿主机目录下的文件拷贝进镜像且ADD命令会自动处理URL和解压tar压缩包
COPY         # 类似ADD，拷贝文件和目录到镜像中！
VOLUME       # 容器数据卷，用于数据保存和持久化工作
CMD          # 指定一个容器启动时要运行的命令，dockerFile中可以有多个CMD指令，但只有最后一个生效！
ENTRYPOINT   # 指定一个容器启动时要运行的命令！和CMD一样
ONBUILD      # 当构建一个被继承的DockerFile时运行命令，父镜像在被子镜像继承后，父镜像的ONBUILD被触发
======================================写文件思路===============================

1、基于一个空的镜像
2、下载需要的环境ADD
3、执行环境变量的配置ENV
4、执行一些Linux命令 RUN
5、日志输出   CMD
6、暴露端口  EXPOSE
7、挂载数据卷 volume
```

2、执行命令

```shell
[root@xiaoxie ~]$docker build -f docker-web myweb:1.0 .

```

3、上传镜像到仓库

+ 注册一个镜像仓库账号（可以用dockerhub账户，默认的就不用加仓库了，但是现在要自己搭建镜像加速）

  ```shell
  [root@xiaoxie ~]$docker login --username=[你的用户名] registry.cn-地点.aliyuncs.com
  输入你的密码即可
  ```

+ 推送

  ```shell
  docker push registry.cn-地点.aliyuncs.com/仓库命名空间/镜像:版本
  ```

+ 仓库拉取镜像

  ```shell
  docker pull registry.cn-地点.aliyuncs.com/仓库命名空间/镜像:版本
  ```




## docker网络


正常一个干净的网络：

```sh
[root@xiaoxielinux ~]# ip addr

# 本地回环网络
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
       
# 网卡地址 wifi
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:e0:aa:73 brd ff:ff:ff:ff:ff:ff
    inet 192.168.0.111/24 brd 192.168.0.255 scope global noprefixroute enp0s3
       valid_lft forever preferred_lft forever
    inet6 fe80::3202:526:12cb:70ec/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
       
# docker 0 ，docker创建的网络
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default 
    link/ether 02:42:f8:9d:a8:42 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
```

1. 微服务这么多，访问怎么解决？ （容器名）

2. docker每启动一个容器，就会给他分配一个ip。docker0是docker默认给的。我们不指定网络的情况下，创建容器都在docker0中，未来开发，我们要自定义网络。

   ```sh
   [root@xiaoxielinux ~]# docker run -itd --name web01 centos
   Unable to find image 'centos:latest' locally
   latest: Pulling from library/centos
   a1d0c7532777: Already exists 
   Digest: sha256:a27fd8080b517143cbbbab9dfb7c8571c40d67d534bbdee55bd6c473f432b177
   Status: Downloaded newer image for centos:latest
   53231c3adf0423ed2d0577ead987507c12978416349a51445d663c9536c9b4ff
   
   # docker每启动一个容器，就会给他分配一个ip。这个ip就是归docker0 管理
   [root@xiaoxielinux ~]# docker exec -it web01 ip addr
   1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
       link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
       inet 127.0.0.1/8 scope host lo
          valid_lft forever preferred_lft forever
   4: eth0@if5: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
       link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff link-netnsid 0
       inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
          valid_lft forever preferred_lft forever
   
   # 容器外本地可以ping到容器里面
   [root@xiaoxielinux ~]# ping 172.17.0.2
   PING 172.17.0.2 (172.17.0.2) 56(84) bytes of data.
   64 bytes from 172.17.0.2: icmp_seq=1 ttl=64 time=0.058 ms
   ```

   



### 原理

1、本来有三个网络，启动容器后，多了一个，这个网络和容器内部的网络是配对的。

```shell
# 再次启动一个容器查看
[root@xiaoxielinux ~]# docker exec -it web02 ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
6: eth0@if7: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether 02:42:ac:11:00:03 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.17.0.3/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
[root@xiaoxielinux ~]# ip addr
....
3: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether 02:42:f8:9d:a8:42 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:f8ff:fe9d:a842/64 scope link 
       valid_lft forever preferred_lft forever
5: veth3b4847e@if4: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker0 state UP group default 
    link/ether 0e:58:71:93:42:18 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet6 fe80::c58:71ff:fe93:4218/64 scope link 
       valid_lft forever preferred_lft forever
7: veth13568df@if6: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker0 state UP group default 
    link/ether 9a:3c:71:70:e2:a0 brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet6 fe80::983c:71ff:fe70:e2a0/64 scope link 
       valid_lft forever preferred_lft forever


# 总结观察：
1、web1 -- linux 主机     5: veth3b4847e@if4:    4: eth0@if5
2、web2 -- linux 主机     7: veth13568df@if6:    6: eth0@if7

# 只要启动一个容器，默认就会分配一对网卡。
# 虚拟接口 # veth-pair 就是一对的虚拟设备接口，它都是成对出现的。一端连着协议栈，一端彼此相连着。
# 就好比一个桥梁，可以连通容器内外。
```

```shell
# 测试容器之间的访问，ip访问没有问题
[root@xiaoxielinux ~]# docker exec -it web02 ping 172.17.0.2
PING 172.17.0.2 (172.17.0.2) 56(84) bytes of data.
64 bytes from 172.17.0.2: icmp_seq=1 ttl=64 time=0.058 ms
64 bytes from 172.17.0.2: icmp_seq=2 ttl=64 time=0.064 ms
^C
--- 172.17.0.2 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 0.058/0.061/0.064/0.003 ms
[root@xiaoxielinux ~]# docker exec -it web01 ping 172.17.0.3
PING 172.17.0.3 (172.17.0.3) 56(84) bytes of data.
64 bytes from 172.17.0.3: icmp_seq=1 ttl=64 time=0.043 ms
64 bytes from 172.17.0.3: icmp_seq=2 ttl=64 time=0.071 ms
64 bytes from 172.17.0.3: icmp_seq=3 ttl=64 time=0.092 ms
^C
--- 172.17.0.3 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2005ms
rtt min/avg/max/mdev = 0.043/0.068/0.092/0.022 ms

# 容器删除后再次启动，ip发生了变化怎么办？
```



Docker使用Linux桥接，在宿主机虚拟一个Docker容器网桥(docker0)，Docker启动一个容器时会根据Docker网桥的网段分配给容器一个IP地址，称为Container-IP，同时Docker网桥是每个容器的默认网关。因为在同一宿主机内的容器都接入同一个网桥，这样容器之间就能够通过容器的Container-IP直接通信。

![docker——net](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/docker_networkVeth.png)

Docker容器网络就很好的利用了**Linux虚拟网络技术**，在本地主机和容器内分别创建一个虚拟接口，并让他们彼此联通（这样一对接口叫**veth pair**）；

Docker中的网络接口默认都是虚拟的接口。虚拟接口的优势就是转发效率极高（因为Linux是在内核中进行数据的复制来实现虚拟接口之间的数据转发，无需通过外部的网络设备交换），对于本地系统和容器系统来说，虚拟接口跟一个正常的以太网卡相比并没有区别，只是他的速度快很多。



### 使用

```sh
[root@xiaoxielinux ~]# docker exec -it web02 ping web01
ping: web01: Name or service not known

# 但是可以通过 --link在启动容器的时候连接到另一个容器网络中，可以通过域名ping了
[root@xiaoxielinux ~]# docker run -itd --name web03 --link web02  centos
6f67f9f7407edb8c48ce2d3ca413aef414a2a8628080fd69605e4ce2c3bea6ab
[root@xiaoxielinux ~]# docker exec -it web03 ping web02
PING web02 (172.17.0.3) 56(84) bytes of data.
64 bytes from web02 (172.17.0.3): icmp_seq=1 ttl=64 time=0.062 ms
64 bytes from web02 (172.17.0.3): icmp_seq=2 ttl=64 time=0.064 ms
64 bytes from web02 (172.17.0.3): icmp_seq=3 ttl=64 time=0.064 ms
^C
--- web02 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2005ms
rtt min/avg/max/mdev = 0.062/0.063/0.064/0.006 ms

# 但是反向也ping不通。
[root@xiaoxielinux ~]# docker exec -it web02 ping web03
ping: web03: Name or service not known


# 底层原理
域名： 
--link hosts 添加了一条记录
172.17.0.3   web02
[root@xiaoxielinux ~]# docker exec -it web03 cat /etc/hosts
127.0.0.1	localhost
::1	localhost ip6-localhost ip6-loopback
fe00::0	ip6-localnet
ff00::0	ip6-mcastprefix
ff02::1	ip6-allnodes
ff02::2	ip6-allrouters
172.17.0.3	web02 325795bd6df8
172.17.0.4	6f67f9f7407e
[root@xiaoxielinux ~]# 
```



### 自定义网络



```sh
[root@xiaoxielinux ~]# docker network --help

Usage:  docker network COMMAND

Manage networks

Commands:
  connect     Connect a container to a network
  create      Create a network
  disconnect  Disconnect a container from a network
  inspect     Display detailed information on one or more networks
  ls          List networks
  prune       Remove all unused networks
  rm          Remove one or more networks

Run 'docker network COMMAND --help' for more information on a command.

# 查看所有的网络
[root@xiaoxielinux ~]# docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
defce6912c4a   bridge    bridge    local
e6e26ff63dfe   host      host      local
8a592709b443   none      null      local
```



所有网络模式

| 网络模式      | 配置                    | 说明                                                         |
| ------------- | ----------------------- | ------------------------------------------------------------ |
| bridge模式    | --net=bridge            | 默认值，在Docker网桥docker0上为容器创建新的网络栈            |
| none模式      | --net=none              | 不配置网络，用户可以稍后进入容器，自行配置                   |
| container模式 | --net=container:name/id | 容器和另外一个容器共享Network namespace。 kubernetes中的pod就是多个容器共享一个Network namespace。 |
| host模式      | --net=host              | 容器和宿主机共享Network namespace                            |
| 用户自定义    | --net=自定义网络        | 用户自己使用network相关命令定义网络，创建容器的时候可以指定为自己定义的网络 |



```shell
[root@xiaoxielinux ~]# docker network inspect bridge
[
    {
        "Name": "bridge",
        "Id": "defce6912c4ae8b16d6f02a6eee0650c79c7d39cba26597de32648f936c0cd43",
        "Created": "2023-12-12T19:57:25.572880728+08:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                	// 网络配置： config配置，子网网段 255*255. 65534 个地址
                    "Subnet": "172.17.0.0/16",
                    // docker0 网关地址
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        // 在这个网络下的容器地址。Name就是容器的名字
        "Containers": {
            "325795bd6df82e6ef18ff027f43a189c4ef886a25b95fdc9c5793bc9d7827179": {
                "Name": "web02",
                "EndpointID": "9ab43d4cd786b8c79d78fd3bf3f05c6dfbd6f1665ca5bc9e74646f1d6f758508",
                "MacAddress": "02:42:ac:11:00:03",
                "IPv4Address": "172.17.0.3/16",
                "IPv6Address": ""
            },
            "53231c3adf0423ed2d0577ead987507c12978416349a51445d663c9536c9b4ff": {
                "Name": "web01",
                "EndpointID": "b891d5b8213b8241b5438c60afc08054c0c4c48490a3715f21fe5591b28b65fc",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            },
            "6f67f9f7407edb8c48ce2d3ca413aef414a2a8628080fd69605e4ce2c3bea6ab": {
                "Name": "web03",
                "EndpointID": "651e2d1b9dcd72fc7339c687904cf763aaa524bd79cc5945888dfec8829a62b6",
                "MacAddress": "02:42:ac:11:00:04",
                "IPv4Address": "172.17.0.4/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]

```





> 自定义一个网络

```shell
[root@xiaoxielinux ~]# docker run -itd --name web01 --net bridge centos
552223f74f163f94238bf536040aa0c683b1ab0fbfbcabdd1ed28644e40f1b9f
# docker0网络的特点
	1.它是默认的
	2.域名访问不通
	3.--link 域名通了，但是删了又不行
```

create命令创建一个新的网络 



```shell
[root@xiaoxielinux ~]# docker network create \
--driver bridge \
--subnet 192.169.0.0/16 \
--gateway 192.169.0.1 \ 
mynet

d37ec2853507c3e6159db06e4c8a33e39a45edff4ac69949c96f981d7aca9a79
[root@kuangshenlinux ~]# docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
defce6912c4a   bridge    bridge    local
e6e26ff63dfe   host      host      local
d37ec2853507   mynet     bridge    local
8a592709b443   none      null      local

```



使用的逻辑

```shell
# 未来可以通过网络来隔离项目
docker network create \
--driver bridge \
--subnet 192.169.0.0/16 \
--gateway 192.169.0.1 \ 
kuangstudynet

mysql
redis
web
admin
mq

# 部署集群挽环境，也可以这样定义网络
mysql  3-5个容器
docker network create \
--driver bridge \
--subnet 192.169.0.0/16 \
--gateway 192.169.0.1 \ 
mysqlnet

--net mysqlnet
```



```shell
# 启动两个服务在自己的网络下。  --net mynet
[root@xiaoxielinux ~]# docker run -itd --name wen01-net --net mynet centos
e16726178e4ee3b61b0dc47f16d112ba0426bcf040b84949811ebc8607d94555
[root@xiaoxielinux ~]# docker run -itd --name wen02-net --net mynet centos
17fae7a2c0bb66c2834ad7d3dc338c0a5707aea5caf4337138f15c6f2079713e


# 测试互相ping，可以使用域名ping通了
[root@xiaoxielinux ~]# docker exec -it wen01-net ping 192.169.0.3
PING 192.169.0.3 (192.169.0.3) 56(84) bytes of data.
64 bytes from 192.169.0.3: icmp_seq=1 ttl=64 time=0.063 ms
64 bytes from 192.169.0.3: icmp_seq=2 ttl=64 time=0.091 ms
64 bytes from 192.169.0.3: icmp_seq=3 ttl=64 time=0.066 ms
^C
--- 192.169.0.3 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2001ms
rtt min/avg/max/mdev = 0.063/0.073/0.091/0.014 ms
[root@kuangshenlinux ~]# docker exec -it wen01-net ping wen02-net
PING wen02-net (192.169.0.3) 56(84) bytes of data.
64 bytes from wen02-net.mynet (192.169.0.3): icmp_seq=1 ttl=64 time=0.041 ms
64 bytes from wen02-net.mynet (192.169.0.3): icmp_seq=2 ttl=64 time=0.064 ms
64 bytes from wen02-net.mynet (192.169.0.3): icmp_seq=3 ttl=64 time=0.106 ms
64 bytes from wen02-net.mynet (192.169.0.3): icmp_seq=4 ttl=64 time=0.088 ms
^C
--- wen02-net ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3007ms
rtt min/avg/max/mdev = 0.041/0.074/0.106/0.026 ms
[root@kuangshenlinux ~]# docker exec -it wen02-net ping wen01-net
PING wen01-net (192.169.0.2) 56(84) bytes of data.
64 bytes from wen01-net.mynet (192.169.0.2): icmp_seq=1 ttl=64 time=0.052 ms
64 bytes from wen01-net.mynet (192.169.0.2): icmp_seq=2 ttl=64 time=0.092 ms
^C
--- wen01-net ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1002ms
rtt min/avg/max/mdev = 0.052/0.072/0.092/0.020 ms


# 未来在项目中，直接使用容器名来连接服务，ip无论怎么变，都不会发生变化
docker run -itd --name mysql --net mynet mysql

mysql:3306/rbms
```



### 网络连通

由于我们现在是跨网络的，容器之间无法访问

```sh
[root@xiaoxielinux ~]# docker exec -it web01 ping wen01-net
ping: wen01-net: Name or service not known
[root@xiaoxielinux ~]# docker exec -it web01 ping 192.169.0.2
```

docker0和自定义网络肯定不通，我们使用自定义网络的好处就是网络隔离：

大家公司项目部署的业务都非常多，假设我们有一个商城，我们会有订单业务（操作不同数据），会有订单业务购物车业务（操作不同缓存）。如果在一个网络下，有的程序猿的恶意代码就不能防止了，所以我们就在部署的时候网络隔离，创建两个桥接网卡，比如订单业务（里面的数据库，redis，mq，全部业务    都在order-net网络下）其他业务在其他网络。

那关键的问题来了，如何让 web-net-01 访问 web01？







结论：如果要跨网络操作别人，就需要使用 `docker network connect [OPTIONS] NETWORK CONTAINER` 连接。





## 容器数据卷



> 思考：一些镜像中，会有MySQL数据库。然后容器都会有被误删的可能，误删就是删库跑路了嘛？很扯是吧，而且那这样数据持久化就失去意义了。为此容器数据就是干了这个事==做数据持久化，即将容器的数据挂载到宿主机上，与容器独立开



## 02、Docker镜像管理

1. Docker 镜像的构建
   1.  编写 Dockerfile
   2.  使用 `docker build` 创建镜像
2. Docker 镜像的优化
   1. 多阶段构建
   2.  镜像瘦身技巧
3. Docker 镜像存储与传输
   1. 镜像的版本管理
   2.  镜像的推送与拉取 
4.  自定义镜像的创建与管理



## 03、Docker容器管理

1. 启动与停止容器
2. 容器的资源限制
   - CPU 和内存限制
   -  存储卷（Volumes）与挂载
   -  网络配置
3. 容器间的通信与链接
4.  容器的日志管理
5. 容器的调试与问题排查
6. 容器的生命周期管理







## 04、Docker网络

1. Docker 网络概述
2. Docker 网络模式
   -  Bridge 网络
   -  Host 网络
   -  None 网络
   -  Overlay 网络
3. Docker 网络的创建与管理
4. 容器间网络通信与 DNS
5. Docker 网络安全







## 05、Docker Compose

1. Docker Compose 简介
2.  安装与配置 Docker Compose
3.  使用 Compose 启动多容器应用
   - 编写 `docker-compose.yml` 文件
   -  `docker-compose` 常用命令
4.  Docker Compose 的高级特性
   - 服务扩展与伸缩
   -  环境变量和多环境配置







## 06、Docker 与 DevOps

1. Docker 在 CI/CD 流水线中的应用
2.  Docker 与 Jenkins 集成
3.  Docker 与 Kubernetes 集成
4.  容器化部署与自动化运维



## 07、Docker Swarm集群

1. Docker Swarm 简介
2.  创建和管理 Docker Swarm 集群
3.  服务发现与负载均衡
4.  Docker Swarm 与高可用性
5.  Docker Swarm 与持续部署（CD）
6.  Docker Compose 与 Swarm 集成





## 08、高级特性

1. Docker 多阶段构建
2.  Docker 构建缓存
3.  使用 Docker 进行分布式应用管理
4.  Docker 镜像签名与验证
5.  Docker 容器的调度与自动化





## 09、优化

1. 容器资源利用与监控
2.  容器的性能优化
3.  Docker 与 Kubernetes 性能调优
4.  性能分析与问题定位工具

## 10、常见的问题

1. Docker 容器无法启动
2.  容器无法联网
3.  Docker 镜像构建失败
4.  Docker 容器资源占用过高
5.  Docker 网络配置问题
