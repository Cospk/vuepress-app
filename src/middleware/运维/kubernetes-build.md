---
# 这是文章的标题
title: kubernetes-搭建使用


# 这是侧边栏的顺序
order: 2
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2025-01-01

# 一个页面可以有多个标签
tag:
  - k8s

# 此页面会出现在星标文章中
star: true
---



---

学习docker最好是在多台linux系统，配置要求：4核4G以上（保证流畅使用），内外可通信

+ 购买阿里云：包月包年收费不划算，推荐按量付费
+ 使用虚拟机（推荐）：使用virtualBox安装centos，利用上电脑资源



## 下载

在阿里云官方下载进行，根据需求只要安装最小版本即可（8已经停止维护了，所有推荐使用7.9版本）

地址：[centos-vault-7.9.2009-isos-x86_64安装包下载_开源镜像站-阿里云](https://mirrors.aliyun.com/centos-vault/7.9.2009/isos/x86_64/)



1. 使用virtualBox创建一个虚拟机然后指定刚刚下载的为驱动，网络设置桥接模式
2. 执行安装系统（选择最小安装即可）
3. 进去很多东西都没有比如网络，比如软件源，docker镜像源





### 网络设置

```shell
# 编辑配置文件：vi /etc/sysconfig/network-scripts/ifcfg-enp0s3xxx
# ------------------------------------------------------------
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
# 将dhcp模式（自动分配ip地址）改为静态模式
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=enp0s3
# 唯一标识网络接口配置 可在系统下用uuidgen命令随机生成
UUID=0d6019d6-e4f6-44f7-b88d-d2d153ea8d0a
DEVICE=enp0s3
ONBOOT=yes

# 主要：固定ip地址43尽量使用电脑使用的，不然可能网络无法使用
IPADDR=192.168.43.110
NETMASK=255.255.255.0
GATEWAY=192.168.43.1
#-----------------------------------------------------------------------
# 查看ip addr
# 若是还是没有网络，设置一下NDS：vi /etc/resolv.conf
nameserver 8.8.8.8
nameserver 8.8.4.4

# 重启网络
systemctl restart network
```

### 配置软件源

```shell
# 备份原有的源
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup

# 下载阿里的源（初始下载只有curl没有wget工具）
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo

# 清除yum旧缓存生成新的
yum clean all
yum makecache

# 更新系统包
sudo yum update -y

#更新必要的包
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```





> 在这里进行拷贝，安装docker会有唯一的dockerID 



### 安装docker

> 配置镜像源为1panel的：https://docker.1panelproxy.com

```shell
# 设置Docker的yum仓库
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo yum makecache fast

# 安装docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 配置阿里云镜像加速（https://cr.console.aliyun.com/cn-shenzhen/instances/mirrors）
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://docker.1panelproxy.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker
```

### 安装K8S

> 根据官方要需要配置系统，如主机名、关闭防火墙、selinux、关闭swap分区等等
>
> 下载三大组件：kubelet、kubeadm、kubectl

```shell
#  ===================先看配置==================

# 设置不同的主机名
hostnamectl set-hostname   xxx

# 关闭防火墙
sudo systemctl stop firewalld 
sudo systemctl disable firewalld

# 将SElinux设置为permissive模式，禁用
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcin$/SELINUX=permissive/' /etc/selinux/config

# 关闭swap分区
sudo swapoff -a
sudo sed -ri 's/.*swap.*/#&/' /etc/fstab

# 允许 iptables 检查桥接流量(所有节点)
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

sudo sysctl --system

# 修改配置yum文件，因为国内无法直接访问google，这里需要将官网中的google的源改为国内源
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF

setenforce 0

# ======================安装=========================

# 安装集群三大件 kubelet、kubeadm、kubectl
yum install -y kubelet kubeadm kubectl
systemctl enable kubelet && systemctl start kubelet

# 查看版本信息
kubectl version
```

### 修改容器引擎

> 官方修改了容器引擎，而我们熟悉的是docker容器引擎，为此可以修改回来

```shell
# 下载
wget https://ghproxy.com/https://github.com/Mirantis/cri-dockerd/releases/download/v0.3.4/cri-dockerd-0.3.4.amd64.tgz

# 解压cri-docker
tar xvf cri-dockerd-*.amd64.tgz 
cp -r cri-dockerd/  /usr/bin/
chmod +x /usr/bin/cri-dockerd/cri-dockerd

# 写入启动cri-docker配置文件
cat >  /usr/lib/systemd/system/cri-docker.service <<EOF
[Unit]
Description=CRI Interface for Docker Application Container Engine
Documentation=https://docs.mirantis.com
After=network-online.target firewalld.service docker.service
Wants=network-online.target
Requires=cri-docker.socket

[Service]
Type=notify
ExecStart=/usr/bin/cri-dockerd/cri-dockerd --network-plugin=cni --pod-infra-container-image=registry.aliyuncs.com/google_containers/pause:3.7
ExecReload=/bin/kill -s HUP $MAINPID
TimeoutSec=0
RestartSec=2
Restart=always
StartLimitBurst=3
StartLimitInterval=60s
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
Delegate=yes
KillMode=process
 
[Install]
WantedBy=multi-user.target
EOF


# 写入cri-docker的socket配置文件
cat > /usr/lib/systemd/system/cri-docker.socket <<EOF
[Unit]
Description=CRI Docker Socket for the API
PartOf=cri-docker.service
 
[Socket]
ListenStream=%t/cri-dockerd.sock
SocketMode=0660
SocketUser=root
SocketGroup=docker
 
[Install]
WantedBy=sockets.target
EOF

# 当你新增或修改了某个单位文件（如.service文件、.socket文件等），需要运行该命令来刷新systemd对该文件的配置。
systemctl daemon-reload

# 确保docker是启动的

# 启用并立即启动cri-docker.service单元。
systemctl enable --now cri-docker.service
# 显示docker.service单元的当前状态，包括运行状态、是否启用等信息。
systemctl status cri-docker.service
```



1. 

   ```shell
   [root@master network-scripts]# 
   [用户角色 @主机名 当前文件名]提示符
   用户角色：当前登入用户，比如root用户，公司会给每一个人开通一个用户（linux是一个多用户系统）
    主机名 ：这个主机叫什么，这个写在系统配置文件的可以更改
       	echo "master" | sudo tee /etc/hostname（解释：echo命令生成字符串master  管道将master作为输入传递tee命令 tee命令将master写入hostname文件中 ）
       	
   当前文件名：显示整个路径最后一个文件夹名
      提升符：显示用户权限的，比如#是root用户的命令，$是普通用户的命令
   ```

   


---



## Kubenetes集群



### 初始化主节点

> 

```shell
# 所有机器添加master节点的域名映射，这里要改为自己当下master的ip
echo "192.168.31.111 cluster-master1" >> /etc/hosts

# node节点ping测试映射是否成功
ping cluster-master

# 如果init失败，可以kubeadm重置
kubeadm reset --cri-socket unix:///var/run/cri-dockerd.sock

####### 主节点初始化（只在master执行） #######
# 注意修改apiserver的地址为master节点的ip
## 注意service、pod的网络节点不能和master网络ip重叠
kubeadm init \
--apiserver-advertise-address=192.168.31.111 \
--control-plane-endpoint=cluster-master1 \
--image-repository registry.cn-hangzhou.aliyuncs.com/google_containers \
--kubernetes-version v1.28.2 \
--service-cidr=10.96.0.0/16 \
--pod-network-cidr=192.169.0.0/16 \
--cri-socket unix:///var/run/cri-dockerd.sock \

# 初始化成功后根据提升执行命令，如
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
export KUBECONFIG=/etc/kubernetes/admin.conf


#You can now join any number of control-plane nodes by copying certificate authoritiesand service account keys on each node and then running the following as root:加入主节点，但是需要配置域名

  kubeadm join cluster-master1:6443 --token hduijy.2tf9vfzrdiqe5pxe 
        --discovery-token-ca-cert-hash sha256:032f0096ed00746f2d8d1fbef90cf55343dde0c76aaf1331c9a012f23a2fa3bd 
        --control-plane 

#Then you can join any number of worker nodes by running the following on each as root:加入work节点

kubeadm join cluster-master1:6443 --token hduijy.2tf9vfzrdiqe5pxe \
        --discovery-token-ca-cert-hash sha256:032f0096ed00746f2d8d1fbef90cf55343dde0c76aaf1331c9a012f23a2fa3bd 


```



### 加入控制节点

```shell
# 加入前需要每一个节点假如域名，否则不认识这个主机，要确保所有节点的主机名都能被正确解析

# master节点查询加入的命令 （24小时有效期）
kubeadm token create --print-join-command

# 查看现有的令牌
kubeadm token list

# 删除令牌
kubeadm token delete tokenid


# 命令加入集群 注意若是docker引擎需要加上--cri-socket unix:///var/run/cri-dockerd.sock表明使用docker作为容器运行时
kubeadm join cluster-master1:6443 \
--token hduijy.2tf9vfzrdiqe5pxe \
--discovery-token-ca-cert-hash sha256:032f0096ed00746f2d8d1fbef90cf55343dde0c76aaf1331c9a012f23a2fa3bd \
--control-plane \
--cri-socket unix:///var/run/cri-dockerd.sock
```



### 加入work节点

```shell
# 查询加入集群命令或者创建命令
kubeadm join cluster-master1:6443 
--token hduijy.2tf9vfzrdiqe5pxe \
--discovery-token-ca-cert-hash sha256:032f0096ed00746f2d8d1fbef90cf55343dde0c76aaf1331c9a012f23a2fa3bd \
--cri-socket unix:///var/run/cri-dockerd.sock
```



---

### 安装pod网络calico

> 集群部署一个Pod网络。Pod网络是Kubernetes集群中各个**Pod之间进行通信**的网络。这里就以calico为例，使用yaml文件进行安装



1. 下载yaml文件

   ```shell
   wget https://docs.tigera.io/archive/v3.25/manifests/calico.yaml --no-check-certificate
   ```

2. 修改配置文件（清单的进行源是国外的，被限制了）

   ```shell
   # 查看镜像信息
   cat calico.yaml |grep 'image:'
   # 批量修改信息
   sed -i 's#docker.io/##g' calico.yaml
   # 再次查看
   cat calico.yaml |grep 'image:'
   ```

3. 编辑修改文件（修改两个位置）

   ```yaml
   # 网卡名（应该是没有需要补充上去）
    - name: IP_AUTODETECTION_METHOD
      value: "interface=enp0s3"    #eth0是本地网卡名称
   # network(在初始化那边对应)
   - name: CALICO_IPV4POOL_CIDR
     value: "192.169.0.0/16"
   ```

4. 应用文件

   ```shell
   kubectl apply -f calico.yaml
   ```

5. 若是有问题需要撤销

   ```shell
   kubectl delete -f calico.yaml
   ```

6. 查看是否生效

   ```shell
   # 查看节点的状态是否为read 
   [root@master1 kubenetes]# kubectl get nodes
   NAME      STATUS   ROLES           AGE   VERSION
   master1   Ready    control-plane   76m   v1.28.2
   node1     Ready    <none>          67m   v1.28.2
   node2     Ready    <none>          66m   v1.28.2
   ```



### 安装面板

> 可以选择使用命令行，也可以使用面板来操作

ymal文件地址：https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml



下载后直接输入：kubectl apply -f xxx.yaml



访问页面方式：









#### 最新面板安装



> 官方对于最新的面板安装使用helm来安装了。因为 Helm 能够提供更好的**依赖管理、版本控制、环境隔离和自定义配置**能力,从而简化 Kubernetes Dashboard 的部署和运维工作。这种方式比直接使用 YAML 配置文件更加高效和可靠。



#### 1、安装helm并升级安装dashboard

helm官网：https://helm.sh/zh/docs/intro/install/

```shell
# 这里脚本安装helm（可将脚本本地下载下来）
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

# 添加 kubernetes-dashboard 的 Helm 仓库
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
# 升级安装 kubernetes-dashboard:
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace

# 查看dashboard服务是否正常启动
kubectl -n kubernetes-dashboard get svc
```

#### 2、进入webUI

> 安装好后可以看到 `kubernetes-dashboard-kong-proxy` 的服务类型是 `ClusterIP`。这意味着该服务只能在集群内部访问，不能直接通过浏览器访问。如果要从外部访问，有三种方式



##### ①本地代理

**概述：kubectl proxy** 允许你通过**本地代理**访问 Kubernetes Dashboard，不用其他任何配置只要kubectl即可，但是仅限本地访问不能远程访问。适合临时访问或开发环境。

**工作原理：**

+ 启动本地代理后，Kubernetes API Server 会代理请求到 Dashboard。
+ 访问 URL 通常是 `http://127.0.0.1:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/`

**适用场景：**开发环境、临时访问、调试。





##### ②修改服务类型

**概述：**通过将 Dashboard 的服务类型更改为 **NodePort**，可以在集群的所有节点上暴露该服务，运行外部访问，通过节点的 IP 和端口进行访问。

**工作原理：**

+ 将服务类型从 `ClusterIP` 修改为 `NodePort`，Kubernetes 会分配一个端口（通常在 30000-32767 范围内）用于外部访问。

  访问 URL 通常是 `https://<node-ip>:<node-port>`，其中 `<node-ip>` 是任意一个 Kubernetes 节点的外部 IP，`<node-port>` 是分配的端口。

**适用场景：**开发环境、临时访问、调试。



##### ③Ingress 暴露服务

**概述：**使用 Kubernetes 的 Ingress Controller 来为 Dashboard 配置一个外部访问入口，需要额外的配置资源，但有https配置安全性高且可控制访问也可以高可用，一般应用生产环境中

**工作原理：**

+ 配置一个 **Ingress 资源**，将外部请求路由到 Dashboard 服务。
+ 可以使用**域名访问** Dashboard。
+ 配置 SSL 证书**支持 HTTPS** 访问，提升安全性。

**适用场景：**开发环境、临时访问、调试。



---

> 综上所述：生产用Ingress暴露服务，开发测试使用本地代理或者修改**nodePod类型**，下面使用修改type类型为例



```shell
# 1、编辑服务资源（使用kubectl edit命令）
kubectl -n kubernetes-dashboard edit svc kubernetes-dashboard-kong-proxy

# 2、进入编辑找到type字段，将ClusterIP改为NodePod（修改后直接:qw退出即可）
type: NodePort

# 3、修改后会自动分配一个端口，可以查看（正常都是30000-32767）
kubectl -n kubernetes-dashboard get svc kubernetes-dashboard-kong-proxy
# 输出：（443是内部访问端口，32454是外部访问端口）
NAME                          TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
kubernetes-dashboard-kong-proxy   NodePort   10.96.51.198   <none>        443:32454/TCP    26h

# 3、查询这个pod运行在哪个节点，浏览器通过https://节点IP:外部访问端口  （忽略不安全连接并且这个需要使用token登入）

# 4、生成token
# 4.1 未创建管理员权限的 ServiceAccount
kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard
kubectl create clusterrolebinding dashboard-admin-binding \
    --clusterrole=cluster-admin \
    --serviceaccount=kubernetes-dashboard:dashboard-admin
    
# 4.2 手动启用 Bound ServiceAccount Token
kubectl -n kubernetes-dashboard create token dashboard-admin

# 浏览器访问并输入token即可
```



```shell
1. 所有节点的共同准备工作
├── 系统配置
│   ├── 关闭防火墙、selinux、swap
│   ├── 配置内核参数
│   └── 配置主机名和hosts
│
├── 安装基础组件
│   ├── 配置docker源并安装docker
│   ├── 配置k8s源
│   ├── 安装kubelet、kubeadm、kubectl
│   └── 启动服务
│
2. 节点角色划分
├── 确定master节点
└── 确定worker节点

3. 集群初始化
├── 第一个master节点初始化
│   ├── 生成配置文件
│   ├── kubeadm init
│   └── 获取join命令
│
├── 其他节点加入
│   ├── 其他master节点使用master join命令
│   └── worker节点使用worker join命令
│
4. 网络配置
└── 部署网络插件（如Calico）
```



