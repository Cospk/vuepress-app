---
# 这是文章的标题
title: Casbin-权限管理


# 这是侧边栏的顺序
order: 3
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2020-01-01

# 一个页面可以有多个标签
tag:
  - 权限

# 此页面会出现在星标文章中
star: true
---



## 01、Casbin简介



> casbin官网:[Casbin · An authorization library that supports access control models like ACL, RBAC, ABAC for Golang, Java, C/C++, Node.js, Javascript, PHP, Laravel, Python, .NET (C#), Delphi, Rust, Ruby, Swift (Objective-C), Lua (OpenResty), Dart (Flutter) and Elixir | Casbin](https://casbin.org/)



Casbin 是一个强大的`开源访问控制框架`，专注于为不同场景下的权限管理提供灵活的解决方案。它支持多种访问控制模型，例如 **ACL（访问控制列表）、RBAC（基于角色的访问控制）、ABAC（基于属性的访问控制）**等，非常适合在复杂系统中实现精细化的**权限管理**。



### 特点

1. 支持多种访问**控制模型**：ACL（访问控制列表）、RBAC（基于角色的访问控制）、ABAC（基于属性的访问控制）以及其他模型（如多租户、多层级角色模型）
2. 可扩展的**策略存储**：默认支持内存存储，同时也支持多种持久化方案（如：文件、数据库、redis等等）
3. 灵活的**策略表达式**：Casbin 使用 Policy 格式 配置模型和规则来满足大部分的权限控制需求，另外提供基于 `Effector` 的决策机制
4. **高性能**：设计轻量，可高效处理大规模访问请求
5. **多语言**支持：原生支持Go语言，也提供其他开发语言



### 为什么要用这个casbin

后台开发都会有角色和权限，不同的角色可以展示不同的页面，而权限意味着是否可以访问对应的api接口

在没有casbin的情况下：传统的权限管理方案可能是通过硬编码或数据库直接管理权限，这会导致下面一些问题：

修改权限规则需要开发接入，手动匹配用户角色、资源和操作，容易出错、高质量增加、效率低，代码复制还难维护甚至有安全隐患



### 常见的应用场景：



1. 企业权限管理：
   - 定义角色（如管理员、普通用户）并关联资源权限
2. 微服务架构中的权限控制：
   - 通过动态加载策略，为分布式服务提供统一的权限校验
3. RESTful API 权限：
   - 使用路径匹配实现基于 URL 的权限控制
4. 多租户场景：
   - 支持租户隔离，确保权限的多层级控制



<br><br>

## 02、快速开始

<br>

### ①、初始化项目

```shell
mkdir demo && cd demo && go mod init
go get github.com/casbin/casbin/v2
```



### ②、Casbin使用两个配置文件来设置控制访问

+ model.conf ：存储访问模型

  ```ini
  [request_definition]
  r = sub, obj, act
  [policy_definition]
  p = sub, obj, act
  [matchers]
  m =  r.sub == p.sub && r.obj == p.obj && r.act == p.act || r.sub == "root" #只要访问主体是root一律放行。
  [policy_effect]
  e = some(where (p.eft == allow))
  ```

+ policy.csv：存储了特定的用户权限配置

  ```sh
  p, demo , /user, write        #demo用户对/user有write权限
  p, demo , /order, read        #demo用户对/order有read权限
  p, demo1 , /user/userlist,read   #demo1用户对/user/userlist有read权限
  p, demo2 , /order/orderlist,read #demo2用户对/order/orderlist有read权限
  ```

  

### ③、检查权限

```go
import (
	"fmt"
	"github.com/casbin/casbin/v2"
	"log"
	"testing"
)
func CheckPermi(e *casbin.Enforcer ,sub,obj,act string)  {
	ok, err := e.Enforce(sub, obj, act)
	if err != nil {
		return
	}
	if ok == true {
		fmt.Printf("%s CAN %s %s\n", sub, act, obj)

	} else {
		fmt.Printf("%s CANNOT %s %s\n", sub, act, obj)
	}
}
func TestCasBin( t *testing.T)  {
	e, err := casbin.NewEnforcer("./model.conf", "./policy.csv")
	if err !=nil{
		log.Fatalf("NewEnforecer failed:%v\n", err)
	}

	//基本权限设置
	CheckPermi(e, "demo", "/user", "read")
	CheckPermi(e, "demo", "/order", "write")
	CheckPermi(e, "demo1", "/user/userlist", "read")
	CheckPermi(e, "demo1", "/order/orderlist", "write")
}
```



## 存储

### 模型存储



### 策略存储

### 





---



## 03、工作原理



在Casbin中，访问控制模型被抽象为基于**PERM元模型**（**策略，效果，请求，匹配器**）的CONF文件。 为项目切换或升级授权机制就像修改配置一样简单。 您可以通过组合可用模型来定制自己的访问控制模型。

PERM模型由四个基础部分组成：策略，效果，请求和匹配器。 这些基础部分描述了资源和用户之间的关系。

### 基本概念

#### Request

> 待鉴权的对象（谁对什么资源进行什么操作）

定义请求参数。 基本请求是一个元组对象，至少需要一个主体（被访问实体），对象（被访问资源）和动作（访问方法）。

例如，请求定义可能看起来像这样：`r={sub,obj,act}`

此定义指定了访问控制匹配函数所需的参数名称和顺序。

#### Policy

> 策略也是我们定义的各自权限（指定了谁可以对哪些资源执行什么操作）

定义访问策略的模型。 它指定了策略规则文档中字段的名称和顺序。

例如：`p={sub, obj, act}` 或 `p={sub, obj, act, eft}`

注意：如果未定义eft（策略结果），则不会读取策略文件中的结果字段，匹配策略结果将默认允许。

#### Matcher

> 定义上面两者执行怎么样的匹配

定义请求和策略的匹配规则。

例如：`m = r.sub == p.sub && r.act == p.act && r.obj == p.obj` 这个简单而常见的匹配规则意味着，如果请求的参数（实体，资源和方法）等于策略中找到的那些，那么返回策略结果（`p.eft`）。 策略的结果将保存在`p.eft`中。

#### Effect

> 代表着匹配结果

对匹配器的匹配结果进行逻辑组合判断。

例如：`e = some(where(p.eft == allow))`

这个语句意味着，如果匹配策略结果`p.eft`有（一些）允许的结果，那么最终结果为真。

让我们看另一个例子：

```
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))
```

这个例子组合的逻辑意义是：如果有一个策略匹配到允许的结果，并且没有策略匹配到拒绝的结果，结果为真。 换句话说，当匹配策略都是允许时，结果为真。 如果有任何拒绝，两者都为假（更简单地说，当允许和拒绝同时存在时，拒绝优先）。



---



### :star:什么是ACL？



ACL代表访问控制列表。 这是一种将用户映射到操作和操作映射到资源的方法。

#### 模型定义

让我们考虑一个简单的ACL模型示例。

```toml
[request_definition]
r = sub, act, obj

[policy_definition]
p = sub, act, obj

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```



1. **request_definition**是系统的查询模板。 例如，一个请求`alice, write, data1`可以被解释为"主体Alice能否对对象'data1'执行'write'操作？"。
2. `policy_definition`是系统的分配模板。 例如，通过创建一个策略`alice, write, data1`，你就赋予了主体Alice在对象'data1'上执行'write'操作的权限。
3. `policy_effect`定义了策略的效果。
4. 在`matchers`部分，请求使用条件`r.sub == p.sub && r.obj == p.obj && r.act == p.act`与策略进行匹配。

#### 现在让我们在Casbin编辑器上测试模型

打开[编辑器](https://casbin.org/editor)并将上述模型粘贴到模型编辑器中。

在策略编辑器中粘贴以下内容：

```csv
p, alice, read, data1
p, bob, write, data2
```



在请求编辑器中粘贴以下内容：

```csv
alice, read, data1
```



结果将是：

```text
true
```



#### ACL模型、策略和请求匹配的视觉表示

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/Casbin_WorkACL.png" alt="acl" style="zoom:75%;" />

### 什么是RBAC？

RBAC代表基于角色的访问控制。 在RBAC中，用户被分配一个资源的角色，一个角色可以包含任意的操作。 然后请求检查用户是否有权限在资源上执行操作。

#### 模型定义

让我们考虑一个简单的RBAC模型：

```toml
[request_definition]
r = sub, act, obj

[policy_definition]
p = sub, act, obj

[role_definition]
g = _, _
g2 = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && g(p.act, r.act) && r.obj == p.obj
```



1. `role_definition`是一个图关系构建器，它使用图来比较请求对象和策略对象。

#### 现在让我们在Casbin编辑器上测试模型

打开[编辑器](https://casbin.org/editor)并将上述模型粘贴到模型编辑器中。

在策略编辑器中粘贴以下内容：

```csv
p, alice, reader, data1
p, bob, owner, data2

g, reader, read
g, owner, read
g, owner, write
```



在请求编辑器中粘贴以下内容：

```csv
alice, read, data1
alice, write, data1
bob, write, data2
bob, read, data2
bob, write, data1
```



结果将是：

```text
true
false
true
true
false
```



#### RBAC模型、策略和请求匹配的视觉表示

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/Casbin_WorkRBAC1.png" alt="rbac" style="zoom:75%;" />

`g - Role to action mapping`表有一个图映射角色到操作。 这个图可以被编码为一系列的边，如在策略中所示，这是表示图的一种常见方式：

```csv
g, reader, read
g, owner, read
g, owner, write
```



:::tip

`p`表示一个可以使用`==`操作符进行比较的普通策略。 `g`是一个基于图的比较函数。 你可以通过添加数字后缀如`g, g2, g3, ...`等来定义多个图比较器。

:::

---



### 什么是分层RBAC？

在分层RBAC中，有多种类型的资源，并且资源类型之间存在继承关系。 例如，“订阅”是一种类型，“资源组”是另一种类型。 类型为**订阅**的sub1可以包含多个类型为**资源组**的资源组（rg1，rg2）。

与资源层次结构类似，将有两种类型的角色和操作：订阅角色和操作，以及资源组角色和操作。 订阅角色和资源组角色之间存在任意关系。 例如，考虑一个订阅角色**sub-owner**。 这个角色被一个资源组角色**rg-owner**继承，这意味着如果我在订阅**sub1**上被分配了**sub-owner**角色，那么我自动也获得了**rg1和rg2**上的**rg-owner**角色。

#### 模型定义

让我们以**分层RBAC**模型的一个简单例子来说明：

```toml
[request_definition]
r = sub, act, obj

[policy_definition]
p = sub, act, obj

[role_definition]
g = _, _
g2 = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && g(p.act, r.act) && g2(p.obj, r.obj)
```



1. **role_definition**是一个图关系构建器，它使用图来比较请求对象和策略对象。

#### 现在让我们在Casbin编辑器上测试这个模型

打开[编辑器](https://casbin.org/editor)并将上述模型粘贴到模型编辑器中。

在策略编辑器中粘贴以下内容：

```csv
p, alice, sub-reader, sub1
p, bob, rg-owner, rg2

// subscription role to subscription action mapping
g, sub-reader, sub-read
g, sub-owner, sub-read
g, sub-owner, sub-write

// resourceGroup role to resourceGroup action mapping
g, rg-reader, rg-read
g, rg-owner, rg-read
g, rg-owner, rg-write

// subscription role to resourceGroup role mapping
g, sub-reader, rg-reader
g, sub-owner, rg-owner

// subscription resource to resourceGroup resource mapping
g2, sub1, rg1
g2, sub2, rg2
```



并在请求编辑器中粘贴以下内容：

```csv
alice, rg-read, rg1
```



结果将是：

```text
true
```



#### RBAC模型、策略和请求匹配的视觉表示

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/Casbin_WorkRBAC.png" alt="hrbac-1350d755e04234a34394996344d2b259" style="zoom:70%;" />

**g - 角色到（操作，角色）映射**表有一个图映射角色到操作，角色映射。 这个图可以被编码为一系列的边，如策略中所示，这是表示图的常见方式：

```csv
// subscription role to subscription action mapping
g, sub-reader, sub-read
g, sub-owner, sub-read
g, sub-owner, sub-write

// resourceGroup role to resourceGroup action mapping
g, rg-reader, rg-read
g, rg-owner, rg-read
g, rg-owner, rg-write

// subscription role to resourceGroup role mapping
g, sub-reader, rg-reader
g, sub-owner, rg-owner
```



**g2 - 订阅到资源组映射**表有一个图映射订阅到资源组：

```csv
// subscription resource to resourceGroup resource mapping
g2, sub1, rg1
g2, sub2, rg2
```



##### 主题匹配视觉表示

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/Casbin_WorkRBACsub.png" alt="hrbac-sub-match" style="zoom:67%;" />

##### 操作匹配视觉表示

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/Casbin_WorkRBACact.png" alt="hrbac-act-match" style="zoom:67%;" />

##### 对象匹配视觉表示

<img src="https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/Casbin_WorkRBACobj.png" alt="hrbac-obj-match" style="zoom:67%;" />

:::tip

当一个请求提交给Casbin时，所有的策略都会进行这种匹配。 如果至少有一个策略匹配，那么请求的结果为真。 如果没有策略匹配请求，那么结果为假。

:::





