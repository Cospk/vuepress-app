---
# 这是文章的标题
title: Kong


# 这是侧边栏的顺序
order: 2
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2025-01-01

# 一个页面可以有多个标签
tag:
  - web

# 此页面会出现在星标文章中
star: true

---

<br><br>

## 01、概述

<br>

[API 网关](https://cloud.tencent.com/product/apigw?from_column=20065&from=20065)（API Gateway）是一种服务器，充当应用程序编程接口（API）的入口点，执行多种任务以简化、安全和优化 API 通信。API 网关的主要功能包括：

1. **请求**路由：将传入的 API 请求路由到相应的后端服务，基于请求的路径、参数等进行分发。
2. **协议转换：** 处理不同协议中的请求和响应，允许客户端和后端服务使用不同的通信协议。
3. **请求和响应转换：** 修改传入请求或传出响应的结构，以匹配所需的格式或标准。
4. **安全性：** 强制执行[身份验证](https://cloud.tencent.com/product/mfas?from_column=20065&from=20065)和授权机制，确保 API 通信的安全性。
5. **速率限制：** 控制客户端在特定时间段内发出的请求数量，以防滥用。
6. **日志记录和监控：** 记录 API 请求和响应，提供监控和分析功能，以跟踪 API 的使用情况和性能。
7. **缓存：** 缓存后端服务的响应，提高性能并减轻后端服务器的负载。
8. **错误处理：** 处理请求期间的错误，提供标准化的错误响应，并可能屏蔽后端错误以防止直接传递给客户端。
9. **服务发现： 在微服务架构中，协助客户端动态定位适当的后端服务。**
10. **API 文档：** 生成并公开 API 的文档，以帮助开发人员理解和使用可用的端点。
11. **请求验证：** 验证传入请求的结构和内容，确保其符合预期的格式和标准。

总的来说，API 网关充当集中的、管理的入口，通过执行这些功能来增强整个 API 生态系统的管理和效率



<br><br>

## 02、网关选择

<br>

云原生领域APISIX更加优于Kong和Nginx，Apisix 是对标云原生网关的，严格来说和 Spring Cloud Gateway 这种业务形网关没什么可比性。

如果是小公司，架构简单，业务单一，则使用Gateway作为业务网关完全够用，而且还便于定制化扩展。若架构复杂，业务流量大，k8s容器化部署，对标云原生的则可以使用Apisix。也可以Apisix和gateway搭配使用，流量网关使用Apisix，业务网关使用gateway，使用流量网关对公网入口流量进行转发到业务网关，再由业务网关将请求转发至各个系统



![image-20240703161531109](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/getewayForFlow_service.png)

<br>

常见的网关横向对比



|    API网关     | Kong                | APISIX        | Trk        | APIgee                         |
| :------------: | ------------------- | ------------- | ---------- | ------------------------------ |
|    部署方式    | 单机和集群          | 单机和集群    | 单机和集群 | 不支持单机                     |
|    数据存储    | Postgres和Cassandra | etcd          | Redis      | Postgres、Cassandra和zookeeper |
|    是否开源    | apache2.0协议       | apache2.0协议 | MPL协议    | 否                             |
|    核心技术    | Nginx+Lua           | Nginx+Lua     | Golang     | 未知                           |
| 支持私有化部署 | 是                  | 是            | 是         | 否                             |
|   自定义插件   | 是                  | 是            | 是         | 否                             |
|   社区活跃度   | 高                  | 高            | 高         | 中                             |
|    支持yaml    | 是                  | 是            | 否         | 否                             |

<br>

选型依据:

+ 部署和运维成本：单机是否可以完成部署？还是需要多个节点配合？是否依赖外部的数据库？是否有web控制台可操控整个集群
+ 开源还是闭源：开源许可证是否友好？可否自己写插件扩展网关功能？使用后迁移其他网关成本怎么样？是否会锁定特定平台
+ 能否私有化部署：是否支持部署在用户自己的服务器？是否支持多云、混合云的部署模式？
+ 功能：是否支持动态上游、动态SSL证书、主被动健康检查等基本功能？是否对接常用的统计或监控组件？能否通过Restful API或yaml配置文件方式控制网关配置？
+ 社区：能否通过github、stack Overflow等联系方式联系开发者？背后是否有商业公司支持
+ 商业支持和价格：开源版本和商业版本价格是否差异很大？商业版本按照API调用次数还是订阅方式收费？



<br><br>

## 03、Kong的安装

<br>

Kong是一个`开源`的API网关，它是一个针对API的一个管理工具。你可以在那些上游服务之前额外地实现一些功能。

Kong是基于NGINX和Apache Cassandra或PostgreSQL构建的，能提供易于使用的`RESTfuI API`来操作和配置API管理系统，所以它可以水平扩展多个Kong服务器，通过前置的负载均衡配置把请求均匀地分发到各个Server，来应对大批量的网络请求。

8001:kong的管理的端口 :  http:8001//+请求+参数

8000:用户访问：统一路由端口

1337: konga 地址

- 参考文档：https://github.com/qianyugang/kong-docs-cn

- github文档：https://github.com/Kong/kong



<br>

### :cloud:使用Docker安装

#### 1、启动数据库

```sh
docker run -d --name kong-database \
           -p 5432:5432 \
           -e "POSTGRES_USER=kong" \
           -e "POSTGRES_DB=kong" \
           -e "POSTGRES_PASSWORD=kong" \
           postgres:12
```

如果是云服务器记得开放：5432 端口。然后在本地连接即可。

#### 2、初始化数据

```sh
 docker run --rm \
    -e "KONG_LOG_LEVEL=debug" \
    -e "KONG_DATABASE=postgres" \
    -e "KONG_PG_HOST=121.199.66.66" \
    -e "KONG_PG_USER=kong" \
    -e "KONG_PG_PASSWORD=kong" \
    -e "KONG_CASSANDRA_CONTACT_POINTS=kong-database" \
    kong:latest kong migrations bootstrap
```

#### 3：安装方式一：Docker安装Kong

```sh
docker run -d --name kong \
 -e "KONG_DATABASE=postgres" \
 -e "KONG_PG_HOST=121.199.66.66" \
 -e "KONG_PG_PASSWORD=kong" \
 -e "KONG_CASSANDRA_CONTACT_POINTS=kong-database" \
 -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
 -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
 -e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
 -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
 -e "KONG_ADMIN_LISTEN=0.0.0.0:8001, 0.0.0.0:8444 ssl" \
 -p 8000:8000 \
 -p 8443:8443 \
 -p 8001:8001 \
 -p 8444:8444 \
 kong:latest
```

#### 4、安装方式二：手动安装Kong

可以到这里找下载链接： https://docs.konghq.com/install/centos/

可以到这里找下载链接： https://docs.konghq.com/install/centos/

```sh
curl -1sLf "https://packages.konghq.com/public/gateway-37/config.rpm.txt?distro=el&codename=$(rpm --eval '%{rhel}')" | sudo tee /etc/yum.repos.d/kong-gateway-37.repo
sudo yum -q makecache -y --disablerepo='*' --enablerepo='kong-gateway-37'
 
sudo yum install -y kong-3.7.0
```

编辑Kong配置

```sh
cp /etc/kong/kong.conf.default /etc/kong/kong.conf
vim /etc/kong/kong.conf
#修改如下内容
database = postgres 
pg_host = 192.168.1.102 # 这⾥得配置对外ip地址 不能是127.0.0.1
pg_port = 5432 # Port of the Postgres server.
pg_timeout = 5000 # Defines the timeout (in ms), for connecting,
 # reading and writing.
pg_user = kong # Postgres user.
pg_password = kong # Postgres user's password.
pg_database = kong # The database name to connect to.
dns_resolver = 127.0.0.1:8600 #这个配置很重要，配置的是consul的dns端⼝，默认是8600 可以⾃
admin_listen = 0.0.0.0:8001 reuseport backlog=16384, 127.0.0.1:8444 http2 ssl reuseport backlog=16384
proxy_listen = 0.0.0.0:8000 reuseport backlog=16384, 0.0.0.0:8443 http2 ssl reuseport backlog=16384
```

初始化kong的数据库

```sh
kong migrations bootstrap up -c /etc/kong/kong.conf #这⾥是初始化⽣成数据库
kong start -c /etc/kong/kong.conf
#添加防⽕墙规则
firewall-cmd --zone=public --add-port=8001/tcp --permanent
firewall-cmd --zone=public --add-port=8000/tcp --permanent
# 如果是云服务器
直接在安全组中，开放8000、8001即可。
```

如果出错 `Error: /usr/local/share/lua/5.1/kong/cmd/utils/migrations.lua:20: New migrations available; run 'kong migrations up' to proceed` 执行如下：

```
kong migrations up --v
```

然后在启动：

```sh
[root@iZf8z8fcvqy10f6a60f8ayZ ~]# kong start -c /etc/kong/kong.conf
Database has pending migrations:
                 core: 016_280_to_300
                 acme: 003_350_to_360
             ai-proxy: 001_360_to_370
             http-log: 001_280_to_300
        opentelemetry: 001_331_to_332
        post-function: 001_280_to_300
         pre-function: 001_280_to_300
        rate-limiting: 006_350_to_360
response-ratelimiting: 001_350_to_360
Kong started
```

说明kong安装成功了。

访问查看kong的节点信息：http://121.199.66.66:8001/



#### 5、 安装konga



```shell
docker run -d -p 1337:1337 --name konga pantsel/konga
```

安装成功以后访问如下：http://121.199.66.66:1337/

1. 注册账号

2. 登录账号

3. 配置kongadmin的链接

   ![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_dockerInstall1.png)

   创建链接如下：

   ![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_dockerInstall2.png)

   配置信息如下：

   ![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_dockerInstall3.png)



<br><br>

## 04、开始配置Kong服务和路由

<br>

### 1.准备工作

- 部署Nacos

  ```
  ls -lrt /etc/alternatives/java
  ```

- 安装MySQL

  ```
  docker run -di --name=tensquare_mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=mkxiaoer centos/mysql-57-centos7 
  ```

- 安装Redis

  ```sh
  docker run --name myredis -d redis redis-server --requirepass mkxiaoer
  ```

- 把goods-api/goods-srv都部署道服务器上即可

- 开启链路追踪服务jaeger



```
 
curl -i -X POST  http://localhost:8001/services/goods_list/routes \
  --data 'hosts[]=121.199.66.66' \
  --data 'name=商品明' \
  --data 'strip_path=false' \
  --data 'paths[]=/'\
  --data 'methods[]=GET&methods[]=POST'
```



### 2.测试

http://121.199.66.66:9200/api/v1/goods/detail/1

```json
{
"code": 20000,
"data": {
"id": 1,
"createTime": "2024-05-07 13:07:28 +0800 CST",
"updateTime": "2024-05-07 13:07:28 +0800 CST",
"name": "商品名称商品名称商品名称商品名称商品名称",
"sn": "商品名称商品名称商品名称商品名称商品名称",
"categoryId": 2,
"onSale": true,
"isFree": true,
"desc": "商品名称商品名称商品名称商品名称商品名称",
"viewCount": 1,
"isComment": true,
"salePrice": 1,
"price": 1,
"img": "/static/img/goods/p1.jpg",
"images": "/static/img/goods/p1.jpg",
"contentImgs": "/static/img/goods/p1.jpg"
},
"msg": "success"
}
```

说明接口通畅，nacos服务正常，jeager出现链路日志，说明一切正常。



### 3.配置Kong网关代理



#### a.配置服务Services

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_setServices.png)

url 如果输入是：http://ip:9200/那么下面的protocol/host/port就不用输入了。也就是说url=protocol+host+port



#### b.添加路由

![image_6](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_setRout1.png)

![image-20240704001646729](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_setRout2.png)

**记得path的位置输入完毕/以后，要敲回车。**



#### c.访问测试

原来访问的地址是：

- http://121.199.66.66:9200/api/v1/goods/detail/1

被kong代理以后的地址是：

- http://121.199.66.66:8000/api/v1/goods/detail/1

其它的都是如此。

从这里可以得出结论：上面配置的path=/ 其实就是：http://121.199.66.66:8000 == http://121.199.66.66:9200

#### d.配置商品服务的路径

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_setPath.png)

从这里可以得出结论：上面配置的path=/api 其实就是：

公式：http://121.199.66.66:8000/api== http://121.199.66.66:9200

原来访问的地址是：

- http://121.199.66.66:9200/api/v1/goods/detail/1

被kong代理以后的地址是：

- http://121.199.66.66:8000/api/api/v1/goods/detail/1

解读：

http://121.199.66.66:8000/api (kong代理的路由地址)  +   /api/v1/goods/detail/1(商品服务的地址)

如果想去掉一级/api，自然就是修改程序的router.go的地址，把/api这级别去掉就行，用kong的/api地址即可。否则会就重复出现。让开发者产生怪异的理解。如下：

```go
package initialize

import (
	"github.com/gin-gonic/gin"
	middlewares "kuangstudy-mall/apis/goods-web/middleawares"
	"kuangstudy-mall/apis/goods-web/router"
	"net/http"
)

func InitWebRouter() *gin.Engine {
	// 开始整合ginweb框架
	Router := gin.Default()

	Router.GET("/ping", func(context *gin.Context) {
		context.JSON(http.StatusOK, "pong")
	})

	// 配置跨域，身份鉴权
	Router.Use(middlewares.Cors())
	// 进行路由组的定义
	// routerGroup := Router.Group("/api/v1") 修改前
	routerGroup := Router.Group("/v1")//修改后
	// 用户路由接口初始化
	router.InitGoodsRouter(routerGroup)
	return Router
}

```





<br><br>

## 05、Kong整合JWT

<br>

### 1：新建一个consumer

### 2：给consumer添加一个认证jwt

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addJWT.png)

```go
customClaims := jtoken.CustomClaims{
    ID:          userInfoResponse.Id,
    NickName:    userInfoResponse.NickName,
    AuthorityId: userInfoResponse.Role,
    StandardClaims: jwt.StandardClaims{
        NotBefore: time.Now().Unix(),
        ExpiresAt: time.Now().Unix() + 60*60*24*300,
        Issuer:    "cc",  // 上面的key和这里一致
    },
}
```

screat必须和配置文件一致：

```yaml
jwt:
  key: 0*%fMk^#4zT2iNc4Xg81
```

### 3：配置全局的jwt

![image-20240704023637382](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_setGlobalJWT.png)



![image-20240704023655097](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_setPluginsJWT.png)

添加头部信息:

![image-20240704025833132](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addJWTInfo.png)

这里名字必须和代码中的一致。

### 4：修改代码

因为kong的token会携带一个前缀：Bearer所以代码中必须截断这个前缀才可以去验证。

```go
package middlewares

import (
	"github.com/gin-gonic/gin"
	"kuangstudy-mall/apis/goods-web/jtoken"
	"net/http"
	"strings"
)

/*
*
jwt的拦截器验证
*/
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 我们这里jwt鉴权取头部信息 x-token 登录时回返回token信息 这里前端需要把token存储到cookie或者本地localSstorage中 不过需要跟后端协商过期时间 可以约定刷新令牌或者重新登录
		token := c.Request.Header.Get("x-token")
		if token == "" {
			c.JSON(http.StatusUnauthorized, map[string]any{
				"code": 601,
				"data": "",
				"msg":  "请登录",
			})
			// 挂起
			c.Abort()
			return
		}
		token = strings.Split(token, " ")[1]
		j := jtoken.NewJWT()
		// parseToken 解析token包含的信息
		claims, err := j.ParseToken(token)
		if err != nil {
			if err == jtoken.TokenExpired {
				if err == jtoken.TokenExpired {
					// 可以考虑续期或者刷新token
					c.JSON(http.StatusUnauthorized, map[string]any{
						"code": 601,
						"data": "",
						"msg":  "授权已过期",
					})
					c.Abort()
					return
				}
			}

			c.JSON(http.StatusUnauthorized, "未登陆")
			c.Abort()
			return
		}
		c.Set("claims", claims)
		c.Set("userId", claims.ID)
		c.Set("userName", claims.NickName)
		c.Set("role", claims.AuthorityId)
		c.Next()
	}
}

```

### 5：开始测试

在登录的时候生成token，然后添加成为全局的即可

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_testApifoxSetToken.png)

如果没有增加前缀：Bearer

![image-20240704030334842](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_testApifoxAddBearer.png)

增加了

![image-20240704030351447](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_testApifoxSetInfos.png)

说明配置成功了

**这里要注意几个点**

1：创建consumer时候的key必须和issuser一致

2：screatkey必须和程序代码的保持一致

3：添加全局的jwt的时候头部的token必须是：x-token

4：程序代码必须截断 Bearer

5：开始测试

<br><br>

## 06、Kong限制限流器访问

<br>

### 1：添加插件

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addPlugins.png)

### 2：配置Bot Detection

![image-20240704031951936](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addPluginsSetBot.png)

3：开始测试

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_testBot.png)

如果你要指派给conumer就填写，如果不填写就是全局的，前面的jwt也一样，不写consumer就是全局，写了就是针对某个consumer进行生效。

<br><br>

## 07、Kong请求大小参数限制

<br>

### 1: 添加插件

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addLimiting.png)



![image-20240704032839921](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addLimitingSet.png)

### 2：开始测试



![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_pluginsShow.png)

测试

![image-20240704032851910](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addLimitingTest.png)



<br>

<br>

## 08、利用kongA进行限流

<br>

### 1：添加限流插件

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_pluginsShow.png)



![image-20240704033828317](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addKongA.png)

### 2：基于ip地址的每分钟2次请求

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_addKongASet1.png)

### 3：开始测试

连续访问3次，前面2次正常，后面就出现限流的状态429和错误提示信息

![image-20240704033850225](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/kong_kongATest.png)