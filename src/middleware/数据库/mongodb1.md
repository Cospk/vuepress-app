# Mongodb的学习和探索

## 01、Mongodb是什么

官网：https://www.mongodb.com/zh-cn

MongoDB是一个基于分布式文件存储 [1] 的数据库。由[C++](https://baike.baidu.com/item/C%2B%2B/99272?fromModule=lemma_inlink)语言编写。旨在为WEB应用提供可扩展的高性能数据[存储解决方案](https://baike.baidu.com/item/存储解决方案/10864850?fromModule=lemma_inlink)。

MongoDB是一个基于==文档==的数据库，其中文档是指一组键值（JSON）对（类似于关系型数据库中的一行记录），其中值可以是字符串、整数、数组、嵌套文档等各种数据类型。MongoDB中的文档可以是动态的，即不需要提前定义文档的结构。MongoDB将文档组织为==集合==（类似于关系型数据库中的表），==集合==中的文档可以根据需要进行添加、删除、更新和查询等操作。

### 01、**特点**

**1.高度可扩展：**MongoDB是一种分布式数据库，可以轻松地将数据分布到多个节点上，从而实现数据的高可用和负载均衡。MongoDB还支持水平扩展，即在需要时可以添加更多的节点来扩展数据存储和处理能力。

**2.灵活的数据模型：**MongoDB的文档是基于BSON（二进制JSON）格式存储的，因此可以支持各种数据类型和数据结构。MongoDB还支持嵌套文档和数组，从而实现更复杂的数据结构和查询。

**3.高性能：**MongoDB使用内存映射文件（MMAP）来管理数据存储和读写，从而实现高效的数据访问和查询。MongoDB还支持索引和聚合操作，可以更快速地处理大量数据。

**4.多样化的查询：**MongoDB支持各种类型的查询，包括范围查询、文本搜索、地理位置查询等，从而满足不同应用场景下的数据需求。

**5.容易学习和使用：**MongoDB的语法简单、直观，可以通过命令行工具、图形界面或各种语言的驱动程序进行操作。



### 02、**应用场景**

MongoDB的高度可扩展性、灵活的数据模型和高性能优势，使其成为一种广泛应用于各种领域的数据库。以下是一些MongoDB的应用场景：

**1.社交网络和内容管理：**MongoDB可以存储和管理用户信息、帖子、评论、图片和视频等多媒体数据。其灵活的数据模型和高性能优势，可以满足高并发、高吞吐量的需求。

**2.物联网和实时数据分析：**MongoDB可以存储和管理传感器数据、设备信息、物流数据等实时数据，其高性能查询和聚合操作可以实时分析和处理数据。

**3.电子商务和金融服务：**MongoDB可以存储和管理用户订单、产品信息、支付记录等数据，其多样化的查询和索引机制可以满足各种复杂的查询需求。

**4.游戏开发和在线教育：**MongoDB可以存储和管理游戏数据、学生信息、课程内容等数据，其高度可扩展性和灵活的数据模型，可以应对各种复杂的数据存储需求。

**5.数据集成和分析平台：**MongoDB可以作为数据集成和分析平台的数据存储引擎，与各种数据源和分析工具进行集成，支持实时数据流和批处理数据分析。





## 02、Mongodb的核心概念

### 1.1 库

   `mongodb中的库就类似于传统关系型数据库中库的概念，用来通过不同库隔离不同应用数据`。[mongodb](https://cloud.tencent.com/product/mongodb?from_column=20065&from=20065)中可以建立多个[数据库](https://cloud.tencent.com/solution/database?from_column=20065&from=20065)。每一个库都有自己的集合和权限，不同的数据库也放置在不同的文件中。默认的数据库为"test"，数据库存储在启动指定的data目录中。

### 1.2 集合

   `集合就是 MongoDB 文档组，类似于 RDBMS （关系数据库管理系统：Relational Database Management System)中的表的概念`。

  集合存在于数据库中，一个库中可以创建多个集合。==每个集合没有固定的结构==，这意味着你在对集合可以插入不同格式和类型的数据，但通常情况下我们插入集合的数据都会有一定的关联性。

### 1.3 文档

  文档集合中一条条记录，是一组键值(key-value)对(即 BSON)。MongoDB 的文档不需要设置相同的字段，并且相同的字段不需要相同的数据类型，这与[关系型数据库](https://cloud.tencent.com/product/cdb-overview?from_column=20065&from=20065)有很大的区别，也是 MongoDB 非常突出的特点。

一个简单的文档例子如下：

```javascript
{"site":"www.kuangstudy.com", "name":"学相伴"}
{"site":1, "name":"学相伴",age:10}
```

### 1.4 关系总结

| RDBMS            | MongoDB          |
| :--------------- | :--------------- |
| 数据库(DataBase) | 数据库(DataBase) |
| 表(Table)        | 集合(Collection) |
| 行(Row)          | 文档(Document)   |
| 列(Column)       | 字段(Filed)      |



## 03、下载和安装

下载地址：https://www.mongodb.com/try/download/community



2.打开下载的文件，找到 msi 后缀双击，进入安装





3.Custom 可以指定想安装在D盘或其他盘中





3.默认 'Run service as Network Service user’



4.取消勾选左下角图形化工具**（Install MongoDB Compass）**，要不然安装时间会很长很长...



5.点击next ，finish就结束安装了



6.安装完的文件夹目录，config文件是后期加上去的，稍后会介绍





###  **02、现在开始配置MongoDB的数据库环境**

1.右击桌面图标 “我的电脑” ，找到 环境变量 在 系统变量 里面找到 path，点击 编辑





2.添加MongoDB的bin地址（ps：注意自己电脑存放mongodb的文件夹路径）



###  最后一步运行MongoDB服务

 1.创建数据库文件的存放位置

在data文件夹下创建  db 文件夹（启动 MongoDB 服务之前需要必须创建数据库文件的存放文件夹，否则命令不会自动创建，而且不能启动成功）





 2.启动 MongoDB 服务（Win+R键），输入cmd



 3.进入命令编辑模式，找到db文件，按如下方式输入



 4.输入命令，来启动MongoDB 服务

```sh
mongod  --dbpath D:\MyApp\Mongodb\Server\data\db --logpath 
```



5.按Enter键之后显示，一般端口是27017



 6.浏览器中输入地址和端口号为：

[http://localhost:27017](http://localhost:27017/)

7.显示结果如下，就说明安装成功并结束



 8.按两次的 ‘Ctrl + C’，结束该次进程



### 再配置本地 Windows MongoGB 服务

这样可设置为开机自启动，可直接手动启动关闭，可通过命令行net start MongoDB 启动，不需要再进入bin的目录下启动了；

1.在 data 文件下创建新文件夹log（用来存放日志文件）





 2.在 MongoGB 中新建配置文件 mongo.config，用记事本打开编辑即可

```
#数据库数据存放目录
dbpath=D:\MyApp\Mongodb\Server\data\db
#数据库日志存放目录
logpath=D:\MyApp\Mongodb\Server\data\log\mongo.log
#以追加的方式记录日志
logappend = true
#端口号 默认为 27017
port=27017

#开启用户认证
auth=false
#mongodb所绑定的ip地址，绑定后只能通过127访问
bind_ip = 0.0.0.0

#启用日志，默认启用
journal=true
#过滤掉一些无用的日志信息，若需要调试使用请设置为false
quiet=true
#不允许全表扫描
notablescan=false
```





 3.用管理员身份打开 cmd，然后找到 bin 文件地址为："D:\MyApp\Mongodb\Server\bin ‘’，并输入代码为：mongod -dbpath "D:\MyApp\Mongodb\Server\data\db" -logpath "D:\MyApp\Mongodb\Server\data\log\mongo.log" -install -serviceName "MongoDB"；

‘MongoDB’ 就是之后启动 MongoDB 服务的名字



 4.**在cmd 管理员中启动和关闭 MongoDB 服务**

**（1）启动 MongoDB 命令**为：`net start MongoDB`



（2）在浏览器中**输入地址和端口号**为：http://localhost:27017，显示如下，说明 MongoDB 服务已启动



 5.MongoDB启动是 Win+R 键输入 services.msc 也可以判断是否启动



 6.**关闭 MongoDB 命令**为：`net stop MongoDB 查看启动的网页没有显示英文了就表示已经关闭了。`



## 04、MongoDb的命令行工具和客户端工具

命令行工具的下载：https://www.mongodb.com/try/download/shell



下载以后，把bin目录的内容复制到mongodb的安装目录下的bin目录。然后启动

```
> mongodsh

```

## 05、Mongodb命令使用方法

### 一 show和help命令

```
#显示数据库列表
show dbs
show databases
#显示库中的集合
show tables
show collections
#显示当前用户
show users
#显示帮助信息
db.help()      显示数据库操作命令
db.foo.help()  显示集合操作命令,foo代指某个集合
#查找数据
db.foo.find()       查找foo集合中所有数据,默认一次新手20条
db.foo.find({a:1})  查找集合中a=1的数据
db.foo.find().pretty()  格式化输出的数据
db.log.findOne()    查看第1条记录
db.log.count()      查询总的记录数

DBQuery.shellBatchSize=50  修改为每页显示50条记录
#查看集合存储信息
db.log.stats()
db.log.totalSize()    集合中索引+数据压缩存储之后的大小
db.log.storageSize()  集合中数据压缩存储的大小
```

### **A 库相关操作**

```
#切换数据库和创建数据库
use dbname
#查看当前数据库
dbs
db.getName()
#查看数据库状态
db.stats()
#删除当前数据库
db.dropDatabase()
#查看当前数据库版本
db.version()
#从其他主机上克隆数据库
db.cloneDatabase("10.0.0.11")
db.cloneDatabase("mydb", "temp", "127.0.0.1")
#修复数据库
db.repairDatabase()
```

### **B 集合相关操作**

```
#查看当前库下的所有集合
show collections    
db.getCollectionNames()
#创建集合(非必须)
db.createCollection('a')
#向集合插入数据(集合不存在则创建)
db.stu.insert({id:102,name:"lisi"})
#查询集合中的数据
db.stu.find({}).pretty()
db.stu.find({id:101}).pretty()
#集合重命名
db.stu.renameCollection("abc")
#集合删除
db.abc.drop()      删除集合
db.log.remove({})  删除集合中所有记录
```

### **插入数据**

语法: `db.集合名称.insert(document)`

- 插⼊⽂档时， 如果不指定`_id`参数， MongoDB会为⽂档分配⼀个唯⼀的ObjectId类型的`_id`
- 插入单条数据使用字典, 插入多条数据使用列表

```
> db.abc.insert({name:'luogang',age:22})
> db.abc.find().pretty()
{
	"_id" : ObjectId("5def4d765feff0d32634b2a7"),
	"name" : "luogang",
	"age" : 22
}
#批量插入数据
for(i=0;i<10000;i++){db.log.insert({"uid":i,"name":"mongodb","age":6,"date":newDate()})}
```

### **修改数据**

语法: `db.集合名称.update(<query> ,<update>,{multi: <boolean>})`

- 参数query:查询条件
- 参数update:更新一条数据,加`$set`表示未更新数据保留,否则未更新数据丢弃
- 参数multi:可选， 默认false只更新找到的第⼀条记录,true表示把满⾜条件的⽂档全部更新

```
> db.abc.update({name:'luogang'},{$set:{passwd:'123456'}})
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
> db.abc.find().pretty()
{
	"_id" : ObjectId("5def4d765feff0d32634b2a7"),
	"name" : "luogang",
	"age" : 22,
	"passwd" : "123456"
}
```

### **删除数据**

语法: `db.集合名称.remove(<query>,{justOne: <boolean>})`

- 参数query:可选，删除的⽂档的条件,不加条件删除所有记录
- 参数justOne:可选，默认false表示删除多条, true或1则只删除⼀条，

```
> db.abc.remove({name:'luogang'})
WriteResult({ "nRemoved" : 1 })
```

### 四 数据查询

语法：`db.表名.find({'key':'value'})`

```
1、查询所有记录
db.userInfo.find();
相当于：select* from userInfo;
默认每页显示20条记录，当显示不下的情况下，可以用it迭代命令查询下一页数据。注意：键入it命令不能带“；”
但是你可以设置每页显示数据的大小，用DBQuery.shellBatchSize= 50;这样每页就显示50条记录了。
 
2、查询去掉后的当前聚集集合中的某列的重复数据
db.userInfo.distinct("name");
会过滤掉name中的相同数据
相当于：select distict name from userInfo;
 
3、查询age = 22的记录
db.userInfo.find({"age": 22});
相当于： select * from userInfo where age = 22;
 
4、查询age > 22的记录
db.userInfo.find({age: {$gt: 22}});
相当于：select * from userInfo where age >22;
 
5、查询age < 22的记录
db.userInfo.find({age: {$lt: 22}});
相当于：select * from userInfo where age <22;
 
6、查询age >= 25的记录
db.userInfo.find({age: {$gte: 25}});
相当于：select * from userInfo where age >= 25;
 
7、查询age <= 25的记录
db.userInfo.find({age: {$lte: 25}});
 
8、查询age >= 23 并且 age <= 26
db.userInfo.find({age: {$gte: 23, $lte: 26}});
 
9、查询name中包含 mongo的数据
db.userInfo.find({name: /mongo/});
//相当于%%
select * from userInfo where name like ‘%mongo%’;
 
10、查询name中以mongo开头的
db.userInfo.find({name: /^mongo/});
select * from userInfo where name like ‘mongo%’;
 
11、查询指定列name、age数据
db.userInfo.find({}, {name: 1, age: 1});
相当于：select name, age from userInfo;
当然name也可以用true或false,当用ture的情况下河name:1效果一样，如果用false就是排除name，显示name以外的列信息。
 
12、查询指定列name、age数据, age > 25
db.userInfo.find({age: {$gt: 25}}, {name: 1, age: 1});
相当于：select name, age from userInfo where age >25;
 
13、按照年龄排序
升序：db.userInfo.find().sort({age: 1});
降序：db.userInfo.find().sort({age: -1});
 
14、查询name = zhangsan, age = 22的数据
db.userInfo.find({name: 'zhangsan', age: 22});
相当于：select * from userInfo where name = ‘zhangsan’ and age = ‘22’;
 
15、查询前5条数据
db.userInfo.find().limit(5);
相当于：selecttop 5 * from userInfo;
 
16、查询10条以后的数据
db.userInfo.find().skip(10);
相当于：select * from userInfo where id not in (
selecttop 10 * from userInfo
);
 
17、查询在5-10之间的数据
db.userInfo.find().limit(10).skip(5);
可用于分页，limit是pageSize，skip是第几页*pageSize
 
18、or与 查询
db.userInfo.find({$or: [{age: 22}, {age: 25}]});
相当于：select * from userInfo where age = 22 or age = 25;
 
19、查询第一条数据
db.userInfo.findOne();
相当于：selecttop 1 * from userInfo;
db.userInfo.find().limit(1);
 
20、查询某个结果集的记录条数
db.userInfo.find({age: {$gte: 25}}).count();
相当于：select count(*) from userInfo where age >= 20;
 
21、按照某列进行排序
db.userInfo.find({sex: {$exists: true}}).count();
相当于：select count(sex) from userInfo;
```

### 五 索引相关命令

```
1、创建索引
db.userInfo.ensureIndex({name: 1});
db.userInfo.ensureIndex({name: 1, ts: -1});
 
2、查询当前聚集集合所有索引
db.userInfo.getIndexes();
 
3、查看总索引记录大小
db.userInfo.totalIndexSize();
 
4、读取当前集合的所有index信息
db.users.reIndex();
 
5、删除指定索引
db.users.dropIndex("name_1");
 
6、删除所有索引索引
db.users.dropIndexes();
```

### 附 语句块操作命令

```
1、简单Hello World
print("Hello World!");
这种写法调用了print函数，和直接写入"Hello World!"的效果是一样的；
 
2、将一个对象转换成json
tojson(new Object());
tojson(new Object('a'));
 
3、循环添加数据
> for (var i = 0; i < 30; i++) {
... db.users.save({name: "u_" + i, age: 22 + i, sex: i % 2});
... };
这样就循环添加了30条数据，同样也可以省略括号的写法
> for (var i = 0; i < 30; i++) db.users.save({name: "u_" + i, age: 22 + i, sex: i % 2});
也是可以的，当你用db.users.find()查询的时候，显示多条数据而无法一页显示的情况下，可以用it查看下一页的信息；
 
4、find 游标查询
>var cursor = db.users.find();
> while (cursor.hasNext()) { 
    printjson(cursor.next()); 
}
这样就查询所有的users信息，同样可以这样写
var cursor = db.users.find();
while (cursor.hasNext()) { printjson(cursor.next); }
同样可以省略{}号
 
5、forEach迭代循环
db.users.find().forEach(printjson);
forEach中必须传递一个函数来处理每条迭代的数据信息
 
6、将find游标当数组处理
var cursor = db.users.find();
cursor[4];
取得下标索引为4的那条数据
既然可以当做数组处理，那么就可以获得它的长度：cursor.length();或者cursor.count();
那样我们也可以用循环显示数据
for (var i = 0, len = c.length(); i < len; i++) printjson(c[i]);
 
7、将find游标转换成数组
> var arr = db.users.find().toArray();
> printjson(arr[2]);
用toArray方法将其转换为数组
 
8、定制我们自己的查询结果
只显示age <= 28的并且只显示age这列数据
db.users.find({age: {$lte: 28}}, {age: 1}).forEach(printjson);
db.users.find({age: {$lte: 28}}, {age: true}).forEach(printjson);
排除age的列
db.users.find({age: {$lte: 28}}, {age: false}).forEach(printjson);
 
9、forEach传递函数显示信息
db.things.find({x:4}).forEach(function(x) {print(tojson(x));});
```

## 06、添加管理员账号

### 一、创建管理员账号

#### 1.以系统管理员的身份运行powershell (在cmd也可以操作)



#### 2.连接数据库

```
mongosh --host 127.0.0.1 --port 27017
```

#### 3.查看数据库

```
show dbs
```

#### 4.切换到admin数据库

```
use admin
```

#### 5.创建超级管理员账户

如果已经分配过了，想删除

```sh
db.dropUser("usename")
```

新创一个管理员账号：

```
db.createUser({user:"root",pwd:"mkxiaoer",roles:[{role:"userAdminAnyDatabase",db:"admin"}]})
```

#### 06\修改配置文件C:\MongoDB\bin\mongod.cfg(可以不操作)

```go
#增加开启权限配置
security:
    authorization: enabled
```

#### 07、重启mongodb服务



通过mongodb shell连接mongodb



切换到admin数据库，则可用管理员账号登录



注意：必须要先切换到对应的数据库，才能登录对应的账号



### 二、创建普通账号

通过管理员账号登录后
切换到自己对应的业务数据库，比如exa

```sh
use exa 
```

创建普通账号

```sh
db.createUser({user:"exa",pwd:"123456",roles:[{role:"readWrite",db:"exa"}]})

```

可通过以下命令查看所有用户

```sh
db.getUsers()
```


在mongodb shell用普通账号登录也要先切换到对应数据库

```
use exa
db.auth('exa','123456')
```





## 06、客户端工具

MongoDB数据库默认的管理工具是（CLI）Shell命令行，对于专业的DBA来说比较容易上手，但是对于普通人员GUI可视化工具更方便使用。我们就来介绍13个好用的MongoDB可视化工具。

### **1、Robo 3T管理工具**

Robo 3T前身是Robomongo。支持Windows，MacOS和Linux系统。Robo 3T 1.3为您提供了对MongoDB 4.0和SCRAM-SHA-256（升级的mongo shell）的支持，支持从MongoDB SRV连接字符串导入，以及许多其他修复和改进。大家也可以找到之前的Robomongo，完全免费的版本使用。





### **2、Navicat for MongoDB**

Navicat是一种收费数据库管理工具，大家应该使用过Navicat For MySQL版本，比较好用。



Navicat 支持连接所有流行的数据库系统（如MySQL，MariaDB，MongoDB，SQL Server，SQLite，Oracle和PostgreSQL）的功能。关注公众号互联网架构师，回复2T，获取最新架构师视频。

下载地址：https://www.navicat.com/en/products/navicat-for-mongodb 它提供14天的免费试用版，长期使用建议购买序列号。



### **3、MongoDB Compass 社区版**

MongoDB Compass也有社区版， 可以编写查询命令，也可以监视服务器的负载，它提供了数据库操作的实时统计信息。适用于Linux，Mac或Windows。中国大陆安装MongoDB数据库，可以选择安装Compass，但是容易卡死，原因是从美国服务器在线安装。可以手动下载在离线安装。







## 07、Go整合mongodb

1: 创建一个项目工程

2：下载mongodb的组件

https://www.mongodb.com/docs/drivers/go/current/usage-examples/insertOne/

```go
go get go.mongodb.org/mongo-driver/mongo
```

依赖安装

```go
go get github.com/joho/godotenv
```



## 08、mongodb-保存

### 01、单数据保存

1: 定义一个结构体

```go
type Restaurant struct {
    Name         string
    RestaurantId string        `bson:"restaurant_id,omitempty"`
    Cuisine      string        `bson:"cuisine,omitempty"`
    Address      interface{}   `bson:"address,omitempty"`
    Borough      string        `bson:"borough,omitempty"`
    Grades       []interface{} `bson:"grades,omitempty"`
}
```

### 02、批量保存

2:  添加数据

```go
// 保存方法
func (resp *RestaurantResponsitory) SaveData() string {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	// 2: 准备结构体的数据
	newRestaurant := model.Restaurant{Name: "8282", Cuisine: "Korean"}
	// 3： 调用mongodb组件库中InsertOne方法来完成数据保存
	one, err := collection.InsertOne(context.TODO(), newRestaurant)
	if err != nil {
		fmt.Println("保存数据失败", err.Error())
		return ""
	}
	// 返回一个数据的唯一标识objectId
	return one.InsertedID.(primitive.ObjectID).Hex()
}
```

3:  批量添加

```go

// 保存方法
func (resp *RestaurantResponsitory) SaveDataMany() []string {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	// 2: 准备结构体的数据
	newRestaurant := []interface{}{
		model.Restaurant{Cuisine: "feige"},
		model.Restaurant{Name: "8281", Cuisine: "kuangshen"},
		model.Restaurant{Name: "8282", Cuisine: "xiaoming"},
		model.Restaurant{Name: "8283", Cuisine: "Korean"},
	}
	// 3： 调用mongodb组件库中InsertOne方法来完成数据保存
	many, err := collection.InsertMany(context.TODO(), newRestaurant)
	if err != nil {
		fmt.Println("保存数据失败", err.Error())
		return nil
	}
	// 返回一个数据的唯一标识objectId
	ObjectIds := []string{}
	for _, data := range many.InsertedIDs {
		ObjectIds = append(ObjectIds, data.(primitive.ObjectID).Hex())
	}

	return ObjectIds
}
```



## 09、mongodb-修改

1: 单个更新

```go

// 根据id修改数据
func (resp *RestaurantResponsitory) UpdateByID(id string, field string, val string) int64 {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	// 2: 把字符串的id转换成objectId
	_id, _ := primitive.ObjectIDFromHex(id)
	// 3: 修改
	filter := bson.D{{"_id", _id}}
	// 4: 更新内容
	update := bson.D{{"$set", bson.D{{field, val}}}}
	// 5: 执行更新UpdateOne
	one, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		fmt.Println("保存数据失败", err.Error())
		return -1
	}
	// 返回一个数据的唯一标识objectId
	return one.MatchedCount
}
```

2: 条件更新

```go
// 条件修改
func (resp *RestaurantResponsitory) UpdateMany(field string, val string) int64 {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	// 2: 修改
	where := bson.D{{"cuisine", "Korean"}}
	// 3: 更新内容
	update := bson.D{{"$set", bson.D{{field, val}}}}
	// 4: 执行更新UpdateMany
	one, err := collection.UpdateMany(context.TODO(), where, update)
	if err != nil {
		fmt.Println("保存数据失败", err.Error())
		return -1
	}
	// 返回一个数据的唯一标识objectId
	return one.MatchedCount
}

```





## 10、mongodb-删除

1: 单个删除

```go

// 根据id删除数据
func (resp *RestaurantResponsitory) DeleteById(id string) int64 {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	// 2: 把字符串的id转换成objectId
	_id, _ := primitive.ObjectIDFromHex(id)
	// 3: 修改
	filter := bson.D{{"_id", _id}}
	// 4: 执行更新UpdateOne
	one, err := collection.DeleteOne(context.TODO(), filter)
	if err != nil {
		fmt.Println("保存数据失败", err.Error())
		return -1
	}
	// 返回一个数据的唯一标识objectId
	return one.DeletedCount
}
```

2: 条件删除

```go

// 根据id删除数据
func (resp *RestaurantResponsitory) DeleteMany(val string) int64 {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	// 3: 修改
	filter := bson.D{{"cuisine", val}}
	// 4: 执行更新UpdateOne
	one, err := collection.DeleteMany(context.TODO(), filter)
	if err != nil {
		fmt.Println("保存数据失败", err.Error())
		return -1
	}
	// 返回一个数据的唯一标识objectId
	return one.DeletedCount
}
```



## 11、mongodb-查询

1：查看单个

```go
func (resp *RestaurantResponsitory) GetByID(id string) *model.Restaurant {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	// 2: 把字符串的id转换成objectId
	_id, _ := primitive.ObjectIDFromHex(id)
	filter := bson.D{{"_id", _id}}
	var result model.Restaurant
	// 查询
	err := collection.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		fmt.Println("查询出错了")
		return nil
	}
	// 返回数据结构体
	return &result
}
```



2：查看多个

```go
// 条件查询
func (resp *RestaurantResponsitory) FindMany(val string) *[]model.Restaurant {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	// 2: 把字符串的id转换成objectId
	filter := bson.D{{"cuisine", val}}
	var result []model.Restaurant
	// 查询
	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		fmt.Println("查询出错了")
		return nil
	}
	// 把所有查询出来的数据注入到结构体中
	cursor.All(context.TODO(), &result)
	// 返回数据结构体
	return &result
}

```



3：求count

```go

// 统计count
func (resp *RestaurantResponsitory) CountData(val string) int64 {
	// 1: 获取集合操作对象
	collection := global.MongoDb.Collection("restaurant")
	filter := bson.D{{"cuisine", val}}
	// 查询
	count, err := collection.CountDocuments(context.TODO(), filter)
	if err != nil {
		fmt.Println("查询出错了")
		return 0
	}
	// 把所有查询出来的数据注入到结构体中
	// 返回数据结构体
	return count
}

```

整体的测试

```go
package main

import (
	"fmt"
	"gomongodbpro/initilzation"
	"gomongodbpro/respository"
)

func main() {
	// 初始化mongodb
	initilzation.InitMongodb()

	responsitory := respository.RestaurantResponsitory{}

	// 开始测试保存
	//objectId := responsitory.SaveData()
	//fmt.Println(objectId)

	// 批量保存
	//objectIds := responsitory.SaveDataMany()
	//fmt.Println(objectIds)

	// 根据id更新
	//objectIds1 := responsitory.UpdateByID("6505bb90bc443128143945c5", "address", "chagnsah")
	//objectIds2 := responsitory.UpdateByID("6505bb90bc443128143945c5", "restaurant_id", "100")
	//objectIds3 := responsitory.UpdateByID("6505bb90bc443128143945c5", "borough", "haochi")
	//objectIds4 := responsitory.UpdateByID("6505bb90bc443128143945c5", "grades", "98")
	//fmt.Println(objectIds1)
	//fmt.Println(objectIds2)
	//fmt.Println(objectIds3)
	//fmt.Println(objectIds4)

	// 批量更新
	//many := responsitory.UpdateMany("grades", "1000")
	//many2 := responsitory.UpdateMany("address", "长沙")
	//fmt.Println(many)
	//fmt.Println(many2)

	//根据id删除
	//count1 := responsitory.DeleteById("6505bfc20adf16425ff4d762")
	//count2 := responsitory.DeleteById("6505bfc20adf16425ff4d763")
	//fmt.Println(count1)
	//fmt.Println(count2)

	//根据条件删除
	//count1 := responsitory.DeleteMany("Korean")
	//fmt.Println(count1)

	// 根据id查询数据
	//restaurantResponsitory := responsitory.GetByID("6505bfc20adf16425ff4d764")
	//fmt.Println(restaurantResponsitory.ID.Hex())

	// 查询多个
	//restaurants := responsitory.FindMany("Korean")
	//fmt.Println(restaurants)

	// 求总数
	countData := responsitory.CountData("Korean")
	fmt.Println(countData)
}

```



## 12、关于高级查询中会使用的操作符

https://www.mongodb.com/docs/manual/reference/operator/query/



## 13、聚合查询

https://www.mongodb.com/docs/drivers/go/current/fundamentals/aggregation/



## 14、小结

MongoDB是一个基于分布式文件存储 [1] 的数据库。由[C++](https://baike.baidu.com/item/C%2B%2B/99272?fromModule=lemma_inlink)语言编写。旨在为WEB应用提供可扩展的高性能数据[存储解决方案](https://baike.baidu.com/item/存储解决方案/10864850?fromModule=lemma_inlink)。

MongoDB是一个基于==文档==的数据库，其中文档是指一组键值（JSON）对（类似于关系型数据库中的一行记录），其中值可以是字符串、整数、数组、嵌套文档等各种数据类型。MongoDB中的文档可以是动态的，即不需要提前定义文档的结构。MongoDB将文档组织为==集合==（类似于关系型数据库中的表），==集合==中的文档可以根据需要进行添加、删除、更新和查询等操作。