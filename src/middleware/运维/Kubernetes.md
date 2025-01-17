---
# 这是文章的标题
title: kubernetes


# 这是侧边栏的顺序
order: 2
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



简单理一下Kubernetes快速理解一下，实际使用还是要知道怎么样，具体很细在有时间慢慢补充



kubernetes与docker的关系？K8S集群的pod和node是什么？怎么启动一个pod运行我们要的容器？怎么动态调整容器数量？高级点的deploymen怎么不中断更新容器？pod的怎么访问通信？



部署服务从实体部署到虚拟机再到容器化部署，已经很简化部署了，但是docker运行的容器多了，管理也不方便。为此需要一个

容器化部署可用很容易解决上面的问题，即使用docker进行容器化部署



## kubenetes架构



## 原理



## 使用



手动创建pod效率太低了，使用yaml文件做一些配置化方便一些

基本的yaml格式：

```yaml
apiVersion: xxx
kind: 资源类型
matedata: 原信息
spec: 具体信息

```



- 创建一个普通pod的yaml

  ```yaml
  apiVersion: v1
  kind: Pod
  metadata: 
    name: pod_nginx
    labels:
      app：nginx
  spec: 
    containers:
      - name: nginx-container
        image: nginx
  ```

- 需要维护几个容器运行（replicaset来做容灾机制，挂了自己启动）

  ```yaml
  apiVersion: apps/v1
  kind: ReplicaSet
  metadata:
    name: nginx-ReplicaSet
    labels:
      name: nginx-replica
  spec:
    replicas: 3
    selector: 
      matchLabels:
        app: nginx
    template: //-------定义上面pod一样的最为模版
      metadata: 
        name: pod_nginx
        labels:
          app: nginx
      spec: 
        containers:
          - name: nginx-container
            image: nginx
      
  ```
  
- 用deployment来优化升级（上面的副本升级需要关闭现有的，然后启动新的版本）

  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: nginx-deployment
    labels:
      name: nginx-deploy
  spec:
    replicas: 3
    selector: 
      matchLabels:
        app: nginx
    template: 
      metadata: 
        name: pod_nginx
        labels:
          app: nginx
      spec: 
        containers:
          - name: nginx-container
            image: nginx
  ```

  

- 部署的每一个pod都会有自己的ip，每次启动ip都不一样为此需要service资源使用域名访问

  ```yaml
  apiVersion: apps/v1
  kind: service
  metadata:
    name: 
  ```

  

