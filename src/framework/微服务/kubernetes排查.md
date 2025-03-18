---
# 这是文章的标题
title: kubernetes-op


# 这是侧边栏的顺序
order: 3
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



K8S工程师必备问题排查手册



## 1、Pod 相关问题及排查:

1.Pod 无法启动，如何查找原因?

- 使用 kubectl  describe pod [pod_name] -n  [namespace_name] 命令查看该Pod 的状态信息，检査容器的状态和事件信息，判断是否出现问题。
- 使用 kubectl  logs  [pod_name]  -n  [namespace_name]命令查看该 Pod 容器的日志信息，判断是否有错误或异常信息。
- 使用kubectl get events --field-selector involvedobject.name=[pod_name]-n [namespace_name]命令查看该 Pod相关的事件信息，判断是否有异常事件发生。

2.Pod 无法连接到其他服务，如何排查?

- 使用 kubectl exec -it [pod_name]-n [namespace_name]-- /bin/bash命令进入该Pod 所在的容器，尝试使用 ping 或 teinet 等命令测试与其他服务的网络连接情况。
- 使用 kubectl describe pod [pod_name]-n [namespace_name]命令检査 Pod的 Networkpolicy 配置，判断是否阳止了该 Pod 访问其他服务。
- 使用 kubectl describe service [service-name]-n[namespace_name]命令检查目标服务的配置和状态信息，判断是否存在故障。

3.Pod 运行缓慢或异常，如何排查?

- 使用 kubectl top pod [pod_name]  -n  [namespace_name]命令査看该 Pod 的 CPU 和内存使用情况，判断是否存在性能瓶领
- 使用 kubectl exec -it [pod_name]-n [namespace_name]-- /bin/bash 命令进入该Pod 所在的容器,使用 top 或 htp 命令查看容器内部进程的CPU 和内存使用情况，找出可能存在的瓶颈。
- 使用 kubectl  logs  [pod_name]  -n  [namespace_name]命令查看该 Pod 容器的日志信息，寻找可能的错误或异常信息。

4.Pod 无法被调度到节点上运行，如何排查?

- 使用 kubectl describe pod [pod_name]-n[namespace_name]命令査看Pod 的调度情况，判断是否存在资源不足、调度策略等问题。
- 使用 kubect1 get nodes 和 kubect1 describe node[node_name]命令查看所有节点的资源使用情况，判断是否存在节点资源不足或放障的情况.
- 使用 kubectl describe pod [pod_name]  -n  [namespace_name] 命令检查Pod 所器的标签和注释，以及节点的标签和注释，判断是否匹配。

5.Pod 状态一直是 Pending，怎么办?

- 查石该Pod的事件信息:kubectl  describe  pod < pod-name >
- 查看该节点资源利用率是否过高:kubectl  top node
- 如果是调度问题，可以通过以下方式解决:
  -  确保有足够的节点资源满足该 Pod 调度需求
  - 检查该节点的talnts和toleratlons 是否与Pod 的 selector 匹配。
  - 调整 Pod 的调度策略，如使用NodeSelector、Afflnlty等

6.Pod 无法访问外部服务，怎么办?

- 查看 Pod 中的 DNS 配置是否正确
- 检查 Pod 所在的命名空间中是否存在 Servlce 服务
- 确认该 Pod 是否具有网络访问权限
- 查看 Pod 所在的节点是否有对外的访问权限。
- 检查网络策略是否阻止了 Pod 对外的访问

7.Pod 启动后立即退出，怎么办?

- 查看该Pod的率件信息:kubectl  describe pod  < pod-name >
- 查看该Pod的日志:kubectl  logs  < pod-name >
- 检查容器是否正确，环境变量是否正常，入口脚本是否正确
- 尝试在本地使用相同的镜像运行该容器，查看是否有报错信息，如执行docker  run  < image-name >

8.Pod 启动后无法正确运行应用程序，怎么办?

- 查看 Pod中的应用程序日志:kubectl  logs< pod-name >
- 查看该Pod的事件信息:kubectl  describe  pod< pod-name >
- 检查应用程序的配置文件是否正确
- 检查应用程序的依赖是否正常
- 尝试在本地使用相同的搅像运行该容器，查看是否有报错信息，如执行docker  run  < image-name >
- 确认该应用程序是否与 Pod 的资源限制相符

9.Kubernetes 集群中的 Service 不可访问，怎么办?

- 检査 Service 的定义是否正确
- 检查 endpoint 是否正确生成
- 检查网络播件配置是否正确
- 确保防火墙配置允许 Service 对外开放





## 2、Node相关问题及排查:

1.Node 状态异常，如何排查?

- 使用 kubectl get nodes 命令查看集群中所有节点的状态和信息，判断是否存在故障,
- 使用 kubectl describe node  [node-name]命令查看目标节点的详细信息，包括CPU、内存、磁盘等硬件资源的使用情况，判断是否存在性能瓶颈,。使用 kubectl get podso wide“-a11-namespaces 命令查看集群中所有Pod的状态信息，判断是否自 Pod 远行在目标节点上导致资源紧张,

2.Node 上运行的 Pod 无法访问网络，如何排査?

- 使用 kubect1 describe node[node_name]命令查看目标节点的信息，检査节点是否正常连接到网络.
- 使用 kubectl describe pod [pod_name]  -n  [namespace_name]命令查看 Pod 所远行的节点信息，判断是否因为节点状态异常导致网络访问失败。
- 使用 kubect11ogs[pod_name]-n[namespace_name]命令青看 Pod 容器的日志信息，寻找可能的错误或界常信息。

3.Node 上的 Pod 无法访问存储，如何排卉?

- 使用 kubectl describe pod  [pod_name]  -n  [namespace_name〕命令检查Pod的 volumes 配置信息，判断是否存在存储挂载失败的情况。
- 使用 kubect1 exec -it [pod_name] -n [namespace_name]  -- /bin/bash 命令进入Pod 所在的容器，尝试使用 1s 和 cat 等命令访问挂载的文件系统，判断是否存在读写错误。
- 使用 kubectl describe persistentvolumeclaim [pvc_name] -n [namespace_name]命令查看相关PVC配置和状态信息，判断是否存在故障。

4.存储卷挂载失败，如何处理?

- 使用 kubectl describe pod   [pod_name]  -n  [namespace_name]命令检查 Pod的 volumes 配置信息，判断是否存在存储卷定义错误,
- 使用 kubectl describe persistentvolumeclaim [pvc_name]-n [namespace_name]命令检音 PVC的状态和信思，判断是否存在存储配颜不足或存储资源故障等原因。
- 如果是 NFS 或Ceph 等网络存储，需要确认网络连接是否正常，以及存储服务器的服务是否正常。

5.Node 节点加入 Kubernetes 朱群后无法被调度，怎么办?

- 检查该节点的 taints 和 tolerations 是否与 Pod 的 selector 匹配
- 检查该节点的资源使用信况是否满足 Pod 的调度要求
- 确保该节点与 Kubernetes APl server 的连接正常

6.Kubernetes 集群中的 PersistentVolume 挂载失败，怎么办?

- 检查 PerslstentVolume和 Pod 之间的匹配关系是否正确
- 检查 PersistentVolumeClaim 中的 storageClassName 是否与PersistentVolume 的 storageClassName 匹配
- 检查节点存储配置和 PersistentVolume 的定义是否正确
- 自动供给厂面的权限是否已经给到位



## 3、集群层面问题及排查:

1.集群中很多 Pod 运行缓慢，如何排查?

- 使用 kubectl  top  pod -n[namespace_name]命令査看所有 Pod 的 CPU 和内存使用情况，判断是否存在资源瓶颈,
- 使用 kubectl  get  nodes 和 kubectl describe node[node_name] 命令查看所有节点的资源使用情况，判断是否存在单个节点资源紧张的情况,
- 使用 kubectl  logs [pod_name]-n [namespace_name]命令査看 Pod 容器的日志信息，寻找可能的错误或界常信息。

2.集群中某个服务不可用，如何排查?

- 使用 kubectl get pods-n[namespace_name〕命令查看相关服务的所有Pod 的状态信息，判断是否存在故障
- 使用 kubectl describe pod [pod_name]-n [namespace_name]命令检査 Pod 的网络连接和存储访问等问题，寻找故障原因
- 使用 kubectl describe service [service_name]-n [namespace_name]命令查看服务的配置和状态信息，判断是否存在故障,
  

3.集群中的 Node 和 Pod 不平衡，如何排查?

- 便用 kubectl get nodes 和 kubectl get pods-o wide --a11-namespaces 命令査看所有Node 和 Pod的状态信息，判断是否存在分布不均的情况。
- 使用 kubect1 top pod -n [namespace_name]命令査看所有 Pod 的 CPU和内存使用情况，判断是否存在资源瓶颈导致 Pod 分布不均。
- 使用 kubectl describe pod [pod_name]-n [namespace_name〕命令查看 Pod 所云行的节点信息，并使用 kubectl describe node [node_name] 命令查看相关节点的状态信息，判断是否存在节点不平衡的情况。
- 使用 kubectl describe pod/ node[node_name]查看当削Pod/Node上是否有相关的亲和或反亲和策略导致固定调度

4.集群中某个节点宕机，如何处理?

- 使用 kubectl get nodes 命令检查节点状态，找到异常节点，
- 使用 kubectl drain [node_name]-ignore-daemonsets 命令将节点上的Pod驱逐出去，并将其部署到其他节点上，添加 --ignore-daemonsets 参数可以忽略 Daemonset 资源。
- 如果需要对节点进行维护或替换硬件，则使用kubectldelete node  [node_name]命令期除该节点。此时该节点上远行的 Pod 会自动调度到其他节点上。

5.Kubernetes APlServer 不可用，如何排查?

- 使用 kubectl  cluster-info 命令査看集群状态，判断是否存在 APl Server 不可用的情况。
- 使用 kubectl version 命今查看集群版本，确认 Kubernetes APl Server和kubelet 版本是否匹配
- 使用 systemctl status kube-apiserver 命令检查 AP| Server 运行状态，确认是否存在故障或错误。
- 结合apiServer所在的节点查看系统层面的日志，进一步定位问题点。

6.Kubernetes 命令执行失败，怎么办?

- 检查 Kubernetes APlserver是否可用:kubectl cluster-info
- 检查当前用户对集群的权限是否足够:kubect1authcan-i<verb><resource>
- 检查 kubeconfig 文件中的登录信息是否正确:kubectl  config  view

7.Kubernetes master节点不可用，怎么办?

- 检查 kube·apiserver、kube-scheduler、kube-controller-manager 是否都在运行状态
- 检查 etcd 存储系统是否可用
- 尝试王新启动 master 节点上的 kubelet 和容器运行时

8.Kubernetes 集群统过了LoadBalancer，直接访问 Pod，怎名办?

- 检查 Service 和 Pod 的通信是否使用了 ClusterlP 类型的 Service
- 确认该 Service 的 selector 是否匹配到了正确的 Pod

9.Kubernetes 集群中的 Deployment 自动更新失败，怎么办?

- 检查更新策略是否设置正确，如ro1lingupdate或recreate
- 检査 Kubernetes APl server 和 kubelet 之间的连接是否正常
- 检查 Pod 的定义是否正确

10.Kubernetes 集群中的状态检查错误，怎么办?

- 检查节点日志和事件信息，并确认错误类型
- 确认该状态检音是否与 kubelet的版本兼容
- 尝试升级 kubelet 和容器运行时等组件

11.Kubernetes 集群中的授权配置有误，怎么办?

- 检查 RoleBlnding和 ClusterRoleBIndlng 定义是否正确
- 检查用户或服务账号所绑定的角色是否正确
- 检查 kubeconfig 文件中的用户和访问权限是否正确

12.Kubernetes 集群无法连接 etcd 存储系统，怎么办?

- 检查 etcd 存储系统是否正常运行
- 检查 kube·apiserver 配置文件中 etcd 的连接信息是否正确
- 尝试手动连接 etcd集群，如执行 etcdctl  cluster-health