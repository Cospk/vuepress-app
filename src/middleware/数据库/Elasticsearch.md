---
# 这是文章的标题
title: ElasticSearch - Go


# 这是侧边栏的顺序
order: 11
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2025-01-01

# 一个页面可以有多个标签
tag:
- golang

# 此页面会出现在星标文章中
star: true
---

> 说在前面: **Elasticsearch中每个field都要精确对应一个数据类型.**
> 本文的所有演示, 都是基于Elasticsearch 6.6.0进行的, 不同的版本可能存在API发生修改、不支持的情况, 还请注意.

# 1 核心数据类型

## 1.1 字符串类型 - string(不再支持)

(1) 使用示例:

```json
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "title": {"type": "string"},    // 全文本
                "tags": {"type": "string", "index": "not_analyzed"} // 关键字, 不分词
            }
        }
    }
}
```

(2) ES 5.6.10中的响应信息:

```cobol
#! Deprecation: The [string] field is deprecated, please use [text] or [keyword] instead on [tags]
#! Deprecation: The [string] field is deprecated, please use [text] or [keyword] instead on [title]
{
  "acknowledged": true,
  "shards_acknowledged": true,
  "index": "website"
}
```

(3) ES 6.6.10中的响应信息:

```bash
{
  "error": {
    "root_cause": [
      {
        "type": "mapper_parsing_exception",
        "reason": "No handler for type [string] declared on field [title]"
      }
    ],
    "type": "mapper_parsing_exception",
    "reason": "Failed to parse mapping [blog]: No handler for type [string] declared on field [title]",
    "caused_by": {
      "type": "mapper_parsing_exception",
      "reason": "No handler for type [string] declared on field [title]"
    }
  },
  "status": 400
}
```

**可知string类型的field已经被移除了, 我们需要用text或keyword类型来代替string.**

### 1.1.1 文本类型 - text

在Elasticsearch 5.4 版本开始, text取代了需要分词的string.

—— **当一个字段需要用于全文搜索(会被分词), 比如产品名称、产品描述信息, 就应该使用text类型.**

> text的内容会被分词, 可以设置是否需要存储: `"index": "true|false"`.
> text类型的字段不能用于排序, 也很少用于聚合.

使用示例:

```css
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "summary": {"type": "text", "index": "true"}
            }
        }
    }
}
```

### 1.1.2 关键字类型 - keyword

在Elasticsearch 5.4 版本开始, keyword取代了不需要分词的string.

—— **当一个字段需要按照精确值进行过滤、排序、聚合等操作时, 就应该使用keyword类型.**

> keyword的内容不会被分词, 可以设置是否需要存储: `"index": "true|false"`.

使用示例:

```puppet
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "tags": {"type": "keyword", "index": "true"}
            }
        }
    }
}
```

## 1.2 数字类型 - 8种

数字类型有如下分类:

| 类型         | 说明                                                         |
| :----------- | :----------------------------------------------------------- |
| byte         | 有符号的8位整数, 范围: [-128 ~ 127]                          |
| short        | 有符号的16位整数, 范围: [-32768 ~ 32767]                     |
| integer      | 有符号的32位整数, 范围: [$-2^{31}$ ~ $2^{31}$-1]             |
| long         | 有符号的32位整数, 范围: [$-2^{63}$ ~ $2^{63}$-1]             |
| float        | 32位单精度浮点数                                             |
| double       | 64位双精度浮点数                                             |
| half_float   | 16位半精度IEEE 754浮点类型                                   |
| scaled_float | 缩放类型的的浮点数, 比如price字段只需精确到分, 57.34缩放因子为100, 存储结果为5734 |

使用注意事项:

> 尽可能选择范围小的数据类型, 字段的长度越短, 索引和搜索的效率越高;
> 优先考虑使用带缩放因子的浮点类型.

使用示例:

```cobol
PUT shop
{
    "mappings": {
        "book": {
            "properties": {
                "name": {"type": "text"},
                "quantity": {"type": "integer"},  // integer类型
                "price": {
                    "type": "scaled_float",       // scaled_float类型
                    "scaling_factor": 100
                }
            }
        }
    }
}
```

## 1.3 日期类型 - date

JSON没有日期数据类型, 所以在ES中, 日期可以是:

- 包含格式化日期的字符串, "2018-10-01", 或"2018/10/01 12:10:30".
- 代表时间毫秒数的长整型数字.
- 代表时间秒数的整数.

> 如果时区未指定, 日期将被转换为UTC格式, 但存储的却是长整型的毫秒值.
> 可以自定义日期格式, 若未指定, 则使用默认格式: `strict_date_optional_time||epoch_millis`

(1) 使用日期格式示例:

```cobol
// 添加映射
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "pub_date": {"type": "date"}   // 日期类型
            }
        }
    }
} 



// 添加数据
PUT website/blog/11
{ "pub_date": "2018-10-10" }


PUT website/blog/12
{ "pub_date": "2018-10-10T12:00:00Z" }  // Solr中默认使用的日期格式

PUT website/blog/13
{ "pub_date": "1589584930103" }         // 时间的毫秒值
```

(2) 多种日期格式:

> 多个格式使用双竖线`||`分隔, 每个格式都会被依次尝试, 直到找到匹配的.
> 第一个格式用于将时间毫秒值转换为对应格式的字符串.

使用示例:

```cobol
// 添加映射
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "date": {
                    "type": "date",  // 可以接受如下类型的格式
                    "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                }
            }
        }
    }
}
```

## 1.4 布尔类型 - boolean

可以接受表示真、假的字符串或数字:

- 真值: true, "true", "on", "yes", "1"...
- 假值: false, "false", "off", "no", "0", ""(空字符串), 0.0, 0

## 1.5 二进制型 - binary

二进制类型是Base64编码字符串的二进制值, 不以默认的方式存储, 且不能被搜索.

使用示例:

```cobol
// 添加映射
PUT website
{
    "mappings": {
        "blog": {
            "properties": {
                "blob": {"type": "binary"}   // 二进制
            }
        }
    }
}

// 添加数据
PUT website/blog/1
{
    "title": "Some binary blog",
    "blob": "hED903KSrA084fRiD5JLgY=="
}
```

> 注意: Base64编码的二进制值不能嵌入换行符`\n`.

## 1.6 范围类型 - range

range类型支持以下几种:

| 类型          | 范围                                           |
| :------------ | :--------------------------------------------- |
| integer_range | $-2^{31}$ ~ $2^{31}-1$                         |
| long_range    | $-2^{63}$ ~ $2^{63}-1$                         |
| float_range   | 32位单精度浮点型                               |
| double_range  | 64位双精度浮点型                               |
| date_range    | 64位整数, 毫秒计时                             |
| ip_range      | IP值的范围, 支持IPV4和IPV6, 或者这两种同时存在 |

(1) 添加映射:

```cobol
PUT company
{
    "mappings": {
        "department": {
            "properties": {
                "expected_number": {  // 预期员工数
                    "type": "integer_range"
                },
                "time_frame": {       // 发展时间线
                    "type": "date_range", 
                    "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
                },
                "ip_whitelist": {     // ip白名单
                    "type": "ip_range"
                }
            }
        }
    }
}
```

(2) 添加数据:

```cobol
PUT company/department/1
{
    "expected_number" : {

        "gte" : 10,
        "lte" : 20
    },
    "time_frame" : { 
        "gte" : "2018-10-01 12:00:00",
        "lte" : "2018-11-01"
    }, 
    "ip_whitelist": "192.168.0.0/16"
}
```

(3) 查询数据:

```cobol
GET company/department/_search
{
    "query": {
        "term": {
            "expected_number": {
                "value": 12
            }
        }
    }
}
GET company/department/_search
{
    "query": {
        "range": {
            "time_frame": {
                "gte": "208-08-01",
                "lte": "2018-12-01",
                "relation": "within" 
            }
        }
    }
}
```

查询结果：

```cobol
{
  "took": 26,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },

  "hits": {
    "total": 1,
    "max_score": 1.0,
    "hits": [
      {
        "_index": "company",
        "_type": "department",
        "_id": "1",
        "_score": 1.0,
        "_source": {
          "expected_number": {
            "gte": 10,
            "lte": 20
          },
          "time_frame": {
            "gte": "2018-10-01 12:00:00",
            "lte": "2018-11-01"
          },
          "ip_whitelist" : "192.168.0.0/16"
        }
      }
    ]
  }
}
```

# 2 复杂数据类型

## 2.1 数组类型 - array

ES中没有专门的数组类型, 直接使用[]定义即可;

**数组中所有的值必须是同一种数据类型, 不支持混合数据类型的数组**:

> ① 字符串数组: ["one", "two"];
> ② 整数数组: [1, 2];
> ③ 由数组组成的数组: [1, [2, 3]], 等价于[1, 2, 3];
> ④ 对象数组: [{"name": "Tom", "age": 20}, {"name": "Jerry", "age": 18}].

注意:

> - 动态添加数据时, 数组中第一个值的类型决定整个数组的类型;
> - 不支持混合数组类型, 比如[1, "abc"];
> - 数组可以包含null值, 空数组[]会被当做missing field —— 没有值的字段.

## 2.2 对象类型 - object

JSON文档是分层的: 文档可以包含内部对象, 内部对象也可以包含内部对象.

(1) 添加示例:

```cobol
PUT employee/developer/1
{
    "name": "ma_shoufeng",
    "address": {
        "region": "China",
        "location": {"province": "GuangDong", "city": "GuangZhou"}
    }
}
```

(2) 存储方式:

```csharp
{
    "name":                       "ma_shoufeng",
    "address.region":             "China",
    "address.location.province":  "GuangDong", 
    "address.location.city":      "GuangZhou"
}
```

(3) 文档的映射结构类似为:

```css
PUT employee
{
    "mappings": {
        "developer": {
            "properties": {
                "name": { "type": "text", "index": "true" }, 
                "address": {
                    "properties": {
                        "region": { "type": "keyword", "index": "true" },
                        "location": {
                            "properties": {
                                "province": { "type": "keyword", "index": "true" },
                                "city": { "type": "keyword", "index": "true" }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

## 2.3 嵌套类型 - nested

嵌套类型是对象数据类型的一个特例, 可以让array类型的对象被独立索引和搜索.

### 2.3.1 对象数组是如何存储的

① 添加数据:

```cobol
PUT game_of_thrones/role/1
{
    "group": "stark",
    "performer": [
        {"first": "John", "last": "Snow"},
        {"first": "Sansa", "last": "Stark"}
    ]
}
```

② 内部存储结构:

```csharp
{
    "group":             "stark",
    "performer.first": [ "john", "sansa" ],
    "performer.last":  [ "snow", "stark" ]
}
```

③ 存储分析:

可以看出, user.first和user.last会被平铺为多值字段, 这样一来, John和Snow之间的关联性就丢失了.

在查询时, 可能出现John Stark的结果.

### 2.3.2 用nested类型解决object类型的不足

如果需要对以最对象进行索引, 且保留数组中每个对象的独立性, 就应该使用嵌套数据类型.

—— 嵌套对象实质是将每个对象分离出来, 作为隐藏文档进行索引.

① 创建映射:

```puppet
PUT game_of_thrones
{
    "mappings": {
        "role": {
            "properties": {
                "performer": {"type": "nested" }
            }
        }
    }
}
```

② 添加数据:

```cobol
PUT game_of_thrones/role/1
{
    "group" : "stark",
    "performer" : [
        {"first": "John", "last": "Snow"},
        {"first": "Sansa", "last": "Stark"}
    ]
}
```

③ 检索数据:

```cobol
GET game_of_thrones/_search
{
    "query": {
        "nested": {
            "path": "performer",
            "query": {
                "bool": {
                    "must": [
                        { "match": { "performer.first": "John" }},
                        { "match": { "performer.last":  "Snow" }} 
                    ]
                }
            }, 
            "inner_hits": {
                "highlight": {
                    "fields": {"performer.first": {}}
                }
            }
        }
    }
}
```

# 3 地理数据类型

## 3.1 地理点类型 - geo point

地理点类型用于存储地理位置的经纬度对, 可用于:

> - 查找一定范围内的地理点;
> - 通过地理位置或相对某个中心点的距离聚合文档;
> - 将距离整合到文档的相关性评分中;
> - 通过距离对文档进行排序.

(1) 添加映射:

```puppet
PUT employee
{
    "mappings": {
        "developer": {
            "properties": {
                "location": {"type": "geo_point"}
            }
        }
    }
}
```

(2) 存储地理位置:

```cobol
// 方式一: 纬度 + 经度键值对
PUT employee/developer/1
{
    "text": "小蛮腰-键值对地理点参数", 
    "location": {
        "lat": 23.11, "lon": 113.33     // 纬度: latitude, 经度: longitude
    }
}

// 方式二: "纬度, 经度"的字符串参数
PUT employee/developer/2
{
  "text": "小蛮腰-字符串地理点参数",
  "location": "23.11, 113.33"           // 纬度, 经度
}

// 方式三: ["经度, 纬度"] 数组地理点参数
PUT employee/developer/3
{
  "text": "小蛮腰-数组参数",
  "location": [ 113.33, 23.11 ]         // 经度, 纬度
}
```

(3) 查询示例:

```cobol
GET employee/_search
{
    "query": { 
        "geo_bounding_box": { 
            "location": {
                "top_left": { "lat": 24, "lon": 113 },      // 地理盒子模型的上-左边
                "bottom_right": { "lat": 22, "lon": 114 }   // 地理盒子模型的下-右边
            }
        }
    }
}
```

## 3.2 地理形状类型 - geo_shape

是多边形的复杂形状. 使用较少, 这里省略.

可以参考这篇文章: [Elasticsearch地理位置总结](https://blog.csdn.net/u012332735/article/details/54971638)



# 4 专门数据类型

## 4.1 IP类型

IP类型的字段用于存储IPv4或IPv6的地址, 本质上是一个长整型字段.

(1) 添加映射:

```puppet
PUT employee
{
    "mappings": {
        "customer": {
            "properties": {
                "ip_addr": { "type": "ip" }
            }
        }
    }
}
```

(2) 添加数据:

```cobol
PUT employee/customer/1
{ "ip_addr": "192.168.1.1" }
```

(3) 查询数据:

```cobol
GET employee/customer/_search
{
    "query": {
        "term": { "ip_addr": "192.168.0.0/16" }
   }
}
```

## 4.2 计数数据类型 - token_count

token_count类型用于统计字符串中的单词数量.

本质上是一个整数型字段, 接受并分析字符串值, 然后索引字符串中单词的个数.

(1) 添加映射:

```puppet
PUT employee
{
    "mappings": {
        "customer": {
            "properties": {
                "name": { 
                    "type": "text",
                    "fields": {
                        "length": {
                            "type": "token_count", 
                            "analyzer": "standard"
                        }
                    }
                }
            }
        }
    }
}
```

(2) 添加数据:

```cobol
PUT employee/customer/1
{ "name": "John Snow" }
      
PUT employee/customer/2
{ "name": "Tyrion Lannister" }
```

(3) 查询数据:

```cobol
GET employee/customer/_search
{
    "query": {
        "term": { "name.length": 2 }

    }
```





# Go 操作 ElasticSearch 



## 01、 什么是ElasticSearch 

Elasticsearch是一个分布式文档存储。Elasticsearch存储的是序列化为JSON文档的复杂数据结构，而不是以列行数据的形式存储信息。当集群中有多个Elasticsearch节点时，存储的文档分布在整个集群中，可以立即从任何节点访问。

当存储文档时，它几乎是实时的——在1秒内就可以被索引和完全搜索。Elasticsearch使用了一种名为反向索引的数据结构，它支持非常快速的全文搜索。反向索引列出任何文档中出现的每个惟一单词，并标识每个单词出现的所有文档。

可以将索引看作是文档的优化集合，每个文档是字段的集合，这些字段是包含数据的键值对。默认情况下，==Elasticsearch对每个字段中的所有数据进行索引==，每个索引字段都有一个专用的、优化的数据结构。例如，文本字段存储在倒排索引中，数字和地理字段存储在BKD树中。使用每个字段的数据结构来组装和返回搜索结果的能力是Elasticsearch如此快速的原因

Elasticsearch还具有无模式的能力，这意味着可以对文档进行索引，而不必显式地指定如何处理文档中可能出现的每个不同字段。当动态映射被启用时，Elasticsearch会自动检测并向索引添加新的字段。这种默认行为使得创建索引和浏览数据变得很容易——只要开始创建索引文档，Elasticsearch就会检测布尔值、浮点值和整数值、日期和字符串，并将它们映射到合适的Elasticsearch数据类型。





## 02、MySQL与ElasticSearch对比

Elasticsearch是一个基于Apache Lucene(TM)的开源搜索引擎，无论在开源还是专有领域，Lucene可以被认为是迄今为止最先进、性能最好的、功能最全的搜索引擎库。
Elasticsearch不仅仅是Lucene和全文搜索引擎，它还提供：
●分布式的实时文件存储，每个字段都被索引并可被搜索
●实时分析的分布式搜索引擎
●可以扩展到上百台服务器，处理PB级结构化或非结构化数据



**ES和MySQL使用场景的比较**

1、MySQL更擅长的是事务类型的操作，可以确保数据的安全和一致性；如果是有事务要求，如商品的下单支付等业务操作，无疑使用MySQL。

2、ES更擅长的是海量数据的搜索，分析和计算；如果是复杂搜索，无疑可以使用Elasticsearch。

3、两者是一个互补而不是替代的关系。





## 03、 下载和安装

下载：https://www.elastic.co/cn/downloads/past-releases/elasticsearch-7-17-7
官网：https://www.elastic.co/cn/elasticsearch/



如果出现需要java_home话，必须在你电脑中安装一个jdk1.8。并且配置环境变量。否则会造成es启动失败。

原因是：ElasticSearch是java开发的。如何去配置java_home百度即可。

如何证明安装成功es呢？

访问：http://localhost:9200/





## 03 、下载可视化工具Kibana

下载地址：https://www.elastic.co/cn/downloads/past-releases#kibana

### 启动 Kibana

运行  `bin/kibana` (or `bin\kibana.bat` on Windows)

### 打开Kibana

在浏览器访问 [http://localhost:5601](http://localhost:5601/) 然后在 [enrollment instructions](https://www.elastic.co/guide/en/elasticsearch/reference/current/configuring-stack-security.html)去关联Elasticsearch

## 04、集成和整合IK

下载地址：https://github.com/medcl/elasticsearch-analysis-ik

- 可选方式1：下载与之对应的版本: https://github.com/medcl/elasticsearch-analysis-ik/releases

  然后在es的目录下载创建一个ik努力

  `cd your-es-root/plugins/ && mkdir ik`

  解压插件到当前目录中`your-es-root/plugins/ik`

- 可选方式2： 使用插件的方式安装，如下：

  ```
  ./bin/elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v6.3.0/elasticsearch-analysis-ik-6.3.0.zip
  ```

- 然后重启es即可



## 05、如何证明IK集成成功？

1.create a index

```
PUT /index
```

2.create a mapping

```
POST http://localhost:9200/index/_mapping
{
        "properties": {
            "content": {
                "type": "text",
                "analyzer": "ik_max_word",
                "search_analyzer": "ik_smart"
            }
        }

}
```

3.index some docs

```
POST /index/_create/1
{"content":"美国留给伊拉克的是个烂摊子吗"}

POST /index/_create/2
{"content":"公安部：各地校车将享最高路权"}

POST /index/_create/3 
{"content":"中韩渔警冲突调查：韩警平均每天扣1艘中国渔船"}

POST /index/_create/4 
{"content":"中国驻洛杉矶领事馆遭亚裔男子枪击 嫌犯已自首"}

```

4.query with highlighting

```
POST /index/_search
{
    "query" : { "match" : { "content" : "中国" }},
    "highlight" : {
        "pre_tags" : ["<tag1>", "<tag2>"],
        "post_tags" : ["</tag1>", "</tag2>"],
        "fields" : {
            "content" : {}
        }
    }
}
'
```

Result

```
{
    "took": 14,
    "timed_out": false,
    "_shards": {
        "total": 5,
        "successful": 5,
        "failed": 0
    },
    "hits": {
        "total": 2,
        "max_score": 2,
        "hits": [
            {
                "_index": "index",
                "_type": "fulltext",
                "_id": "4",
                "_score": 2,
                "_source": {
                    "content": "中国驻洛杉矶领事馆遭亚裔男子枪击 嫌犯已自首"
                },
                "highlight": {
                    "content": [
                        "<tag1>中国</tag1>驻洛杉矶领事馆遭亚裔男子枪击 嫌犯已自首 "
                    ]
                }
            },
            {
                "_index": "index",
                "_type": "fulltext",
                "_id": "3",
                "_score": 2,
                "_source": {
                    "content": "中韩渔警冲突调查：韩警平均每天扣1艘中国渔船"
                },
                "highlight": {
                    "content": [
                        "均每天扣1艘<tag1>中国</tag1>渔船 "
                    ]
                }
            }
        ]
    }
}
```

### Dictionary Configuration

```
IKAnalyzer.cfg.xml` can be located at `{conf}/analysis-ik/config/IKAnalyzer.cfg.xml` or `{plugins}/elasticsearch-analysis-ik-*/config/IKAnalyzer.cfg.xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
	<comment>IK Analyzer 扩展配置</comment>
	<!--用户可以在这里配置自己的扩展字典 -->
	<entry key="ext_dict">custom/mydict.dic;custom/single_word_low_freq.dic</entry>
	 <!--用户可以在这里配置自己的扩展停止词字典-->
	<entry key="ext_stopwords">custom/ext_stopword.dic</entry>
 	<!--用户可以在这里配置远程扩展字典 -->
	<entry key="remote_ext_dict">location</entry>
 	<!--用户可以在这里配置远程扩展停止词字典-->
	<entry key="remote_ext_stopwords">http://xxx.com/xxx.dic</entry>
</properties>
```

### 热更新 IK 分词使用方法

目前该插件支持热更新 IK 分词，通过上文在 IK 配置文件中提到的如下配置

```
 	<!--用户可以在这里配置远程扩展字典 -->
	<entry key="remote_ext_dict">location</entry>
 	<!--用户可以在这里配置远程扩展停止词字典-->
	<entry key="remote_ext_stopwords">location</entry>
```

其中 `location` 是指一个 url，比如 `http://yoursite.com/getCustomDict`，该请求只需满足以下两点即可完成分词热更新。

1. 该 http 请求需要返回两个头部(header)，一个是 `Last-Modified`，一个是 `ETag`，这两者都是字符串类型，只要有一个发生变化，该插件就会去抓取新的分词进而更新词库。
2. 该 http 请求返回的内容格式是一行一个分词，换行符用 `\n` 即可。

满足上面两点要求就可以实现热更新分词了，不需要重启 ES 实例。

可以将需自动更新的热词放在一个 UTF-8 编码的 .txt 文件里，放在 nginx 或其他简易 http server 下，当 .txt 文件修改时，http server 会在客户端请求该文件时自动返回相应的 Last-Modified 和 ETag。可以另外做一个工具来从业务系统提取相关词汇，并更新这个 .txt 文件。



## 06、go如何操作ES

官网网址：https://pkg.go.dev/github.com/olivere/elastic#section-readme

1： 下载组件

```go
go get github.com/olivere/elastic/v7
```

2：快速入门

```go
package main

import "fmt"
import "github.com/olivere/elastic/v7"

func main() {
        // 创建ES client用于后续操作ES
	client, err := elastic.NewClient(
                // 设置ES服务地址，支持多个地址
		elastic.SetURL("http://127.0.0.1:9200", "http://127.0.0.1:9201"),
                // 设置基于http base auth验证的账号和密码
		elastic.SetBasicAuth("user", "secret"))
	if err != nil {
		// Handle error
		fmt.Printf("连接失败: %v\n", err)
	} else {
		fmt.Println("连接成功")
	}
}
```

## 07、创建索引映射Mapping

```go
package es

import (
	"context"
	"errors"
)

// 索引mapping定义，这里仿微博消息结构定义
const mapping = `
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
		"analyzer": "ik_max_word"
      },
      "message": {
        "type": "text"
      },
	  "categoryId": {
        "type": "integer"
      },	
	  "categoryName": {
        "type": "keyword"
      },
 	  "status": {
        "type": "integer"
      },
 	  "retweets": {
        "type": "integer"
      },
      "image": {
        "type": "keyword"
      },
      "created": {
        "type": "date"
      },
      "tags": {
        "type": "keyword"
      },
      "location": {
        "type": "geo_point"
      },
      "suggest_field": {
        "type": "completion"
      }
    }
  }
}`

/*创建索引*/
func (esService *EsService) CreateIndex() (bool, error) {
	client, _ := esService.NewClient()
	// 执行ES请求需要提供一个上下文对象
	ctx := context.Background()
	// 首先检测下weibo索引是否存在
	exists, err := client.IndexExists("article").Do(ctx)
	if err != nil {
		return false, err
	}

	if !exists {
		// weibo索引不存在，则创建一个
		do, err := client.CreateIndex("article").BodyString(mapping).Do(ctx)
		if err != nil {
			return false, err
		}
		return do.Acknowledged, nil
	}

	return false, errors.New("索引已经存在了")
}

```

测试代码

```go
package main

import (
	"fmt"
	"goes/es"
)

func main() {
	es := new(es.EsService)
	// 创建索引文件
	ack1, _ := es.CreateIndex()
	fmt.Println(ack1)
}

```





## 08、创建文档

先定义文章的的struct, 跟前面创建的article索引结构一一对应。

```go
package model

import (
	"github.com/olivere/elastic/v7"
	"time"
)

type Article struct {
	Title        string                `json:"title"`              // 标题
	Content      string                `json:"content"`            // 内容
	CategoryId   int                   `json:"categoryId"`         // 分类ID
	CategoryName string                `json:"categoryName"`       // 分类名称
	Status       int                   `json:"status"`             // 发布状态
	Retweets     int                   `json:"retweets"`           // 转发数
	Image        string                `json:"image,omitempty"`    // 封面
	Created      time.Time             `json:"created,omitempty"`  // 创建时间
	Tags         []string              `json:"tags,omitempty"`     // 标签
	Location     string                `json:"location,omitempty"` //位置
	Suggest      *elastic.SuggestField `json:"suggest_field,omitempty"`
}

```

上面struct定义的时候，都定义了json结构，因为ES请求使用的是json格式，在发送ES请求的时候，会自动转换成json格式。

使用struct结构插入一条ES文档数据，

```go
// 插入文章数据到article索引库中
func (esService *EsService) SaveAtricle() (bool, error) {
	// 创建创建一条微博
	msg1 := model.Article{
		Title:        "Go是一门非常优秀的语音",
		Content:      "打酱油的一天",
		CategoryId:   1,
		CategoryName: "java",
		Status:       1,
		Image:        "aaa.jpg",
		Created:      time.Now(),
		Tags:         []string{"go", "计算机", "语言"},
		Location:     "",
		Retweets:     0,
	}
	client, _ := esService.NewClient()
	// 执行ES请求需要提供一个上下文对象
	ctx := context.Background()
	// 使用client创建一个新的文档
	put1, err := client.Index().
		Index("article"). // 设置索引名称
		Id("1").          // 设置文档id
		BodyJson(msg1).   // 指定前面声明的微博内容
		Do(ctx)           // 执行请求，需要传入一个上下文对象
	if err != nil {
		// Handle error
		panic(err)
	}

	fmt.Printf("文档Id %s, 索引名 %s\n", put1.Id, put1.Index)
	return true, nil
}

```

测试代码

```go
package main

import (
	"fmt"
	"goes/es"
)

func main() {
	es := new(es.EsService)
	// 添加数据
	ack1, _ := es.SaveAtricle()
	fmt.Println(ack1)
}

```



如下：



## 09、更新文档

### 根据文档id更新内容

```go
// 根根据文档id更新内容
func (esService *EsService) UpdateAtricleById(id string) (bool, error) {
	client, _ := esService.NewClient()
	// 执行ES请求需要提供一个上下文对象
	ctx := context.Background()
	// 根据文档id更新内容
	put1, err := client.Update().
		Index("article").                             // 设置索引名称
		Id(id).                                       // 设置文档id
		Doc(map[string]interface{}{"retweets": 100}). // 更新retweets=0，支持传入键值结构
		Do(ctx)                                       // 执行请求，需要传入一个上下文对象
	if err != nil {
		panic(err)
	}

	fmt.Printf("文档Id %s, 索引名 %s\n", put1.Id, put1.Index)
	return true, nil
}
```

测试

```go
package main

import (
	"fmt"
	"goes/es"
)

func main() {
	es := new(es.EsService)
	// 修改数据
	ack1, _ := es.UpdateAtricleById("1")
	fmt.Println(ack1)
}

```

### 根据条件更新文档

```go
// 根据条件更新文档
func (esService *EsService) UpdateQueryAtricle() (bool, error) {
   client, _ := esService.NewClient()
   // 执行ES请求需要提供一个上下文对象
   ctx := context.Background()
   // 根据文档id更新内容
   put1, err := client.UpdateByQuery("article").
      // 设置查询条件，这里设置categoryId=1
      Query(elastic.NewTermQuery("categoryId", 1)).
      // 通过脚本更新内容，将retweets字段改为101
      Script(elastic.NewScript("ctx._source['retweets']=101")).
      // 如果文档版本冲突继续执行
      ProceedOnVersionConflict().
      Do(ctx) // 执行请求，需要传入一个上下文对象
   if err != nil {
      panic(err)
   }

   fmt.Printf("影响行数 %s, 执行是 %s\n", put1.Total, put1.Updated)
   return true, nil
}
```

## 10、删除文档

### 根据id删除一条数据

```go
// 根据ID删除数据
func (esService *EsService) DelAtricleById(id string) (bool, error) {
	client, _ := esService.NewClient()
	// 执行ES请求需要提供一个上下文对象
	ctx := context.Background()
	// 根据id删除一条数据
	put1, err := client.Delete().
		Index("article"). // 设置索引名称
		Id(id).           // 设置文档id
		Do(ctx)           // 执行请求，需要传入一个上下文对象
	if err != nil {
		panic(err)
	}

	fmt.Printf("文档Id %s, 索引名 %s\n", put1.Id, put1.Index)
	return true, nil
}

```

测试

```go
package main

import (
	"fmt"
	"goes/es"
)

func main() {
	es := new(es.EsService)
	// 根据ID删除数据
	ack1, _ := es.DelAtricleById("1")
	fmt.Println(ack1)
}

```

### 根据指定条件删除

```go
_, _ = client.DeleteByQuery("blogs"). // 设置索引名
	    // 设置查询条件为: Author = tizi
		Query(elastic.NewTermQuery("Author", "tizi")).
		// 文档冲突也继续删除
		ProceedOnVersionConflict().
		Do(ctx)
```

## 11、查询文档

### 根据id查询文档

```go
// 根据id查询文档
func (esService EsService) getArticleById(docId string) (article model.Article) {
	client, _ := esService.NewClient()
	// 执行ES请求需要提供一个上下文对象
	ctx := context.Background()
	// 根据id查询文档
	get1, err := client.Get().
		Index("article"). // 指定索引名
		Id(docId).        // 设置文档id
		Do(ctx)           // 执行请求
	if err != nil {
		// Handle error
		panic(err)
	}
	if get1.Found {
		fmt.Printf("文档id=%s 版本号=%d 索引名=%s\n", get1.Id, get1.Version, get1.Index)
	}

	// 提取文档内容，原始类型是json数据
	data, _ := get1.Source.MarshalJSON()
	// 将json转成struct结果
	json.Unmarshal(data, &article)
	// 打印结果
	return article
}

```

测试代码

```go
package main

import (
	"fmt"
	"goes/es"
)

func main() {

	es := new(es.EsService)
	// 根据id查询文档
	article := es.GetArticleById("1")
	fmt.Println(article)
}

```



## 12、高级查询

lasticsearch的查询语法比较丰富，下面分别介绍golang 的各种查询用法。

如果对ES的查询语法和概念不了解，请阅读：[ES教程](https://www.tizi365.com/archives/590.html)

### 1.精确匹配单个字段

elasticsearch的term查询，下面给出完整的代码

```
package main

import (
	"context"
	"fmt"
	"github.com/olivere/elastic/v7"
	"log"
	"os"
	"reflect"
	"time"
)

type Article struct {
	Title   string    // 文章标题
	Content string    // 文章内容
	Author  string    // 作者
	Created time.Time // 发布时间
}


func main() {
        // 创建Client, 连接ES
	client, err := elastic.NewClient(
		// elasticsearch 服务地址，多个服务地址使用逗号分隔
		elastic.SetURL("http://127.0.0.1:9200", "http://127.0.0.1:9201"),
		// 基于http base auth验证机制的账号和密码
		elastic.SetBasicAuth("user", "secret"),
		// 启用gzip压缩
		elastic.SetGzip(true),
		// 设置监控检查时间间隔
		elastic.SetHealthcheckInterval(10*time.Second),
		// 设置请求失败最大重试次数
		elastic.SetMaxRetries(5),
		// 设置错误日志输出
		elastic.SetErrorLog(log.New(os.Stderr, "ELASTIC ", log.LstdFlags)),
		// 设置info日志输出
		elastic.SetInfoLog(log.New(os.Stdout, "", log.LstdFlags)))

	if err != nil {
		// Handle error
		fmt.Printf("连接失败: %v\n", err)
	} else {
		fmt.Println("连接成功")
	}

	// 执行ES请求需要提供一个上下文对象
	ctx := context.Background()

	// 创建term查询条件，用于精确查询
	termQuery := elastic.NewTermQuery("Author", "tizi")
	
	searchResult, err := client.Search().
		Index("blogs").   // 设置索引名
		Query(termQuery).   // 设置查询条件
		Sort("Created", true). // 设置排序字段，根据Created字段升序排序，第二个参数false表示逆序
		From(0). // 设置分页参数 - 起始偏移量，从第0行记录开始
		Size(10).   // 设置分页参数 - 每页大小
		Pretty(true).       // 查询结果返回可读性较好的JSON格式
		Do(ctx)             // 执行请求

	if err != nil {
		// Handle error
		panic(err)
	}

	fmt.Printf("查询消耗时间 %d ms, 结果总数: %d\n", searchResult.TookInMillis, searchResult.TotalHits())


	if searchResult.TotalHits() > 0 {
		// 查询结果不为空，则遍历结果
		var b1 Article
		// 通过Each方法，将es结果的json结构转换成struct对象
		for _, item := range searchResult.Each(reflect.TypeOf(b1)) {
			// 转换成Article对象
			if t, ok := item.(Article); ok {
				fmt.Println(t.Title)
			}
		}
	}
}
```

> 提示：后续章节，仅给出关键代码片段，其他代码结构参考本节即可

### 2.通过terms实现SQL的in查询

通过terms查询语法实现，多值查询效果

例子：

```
// 创建terms查询条件
termsQuery := elastic.NewTermsQuery("Author", "tizi", "tizi365")

searchResult, err := client.Search().
		Index("blogs").   // 设置索引名
		Query(termsQuery).   // 设置查询条件
		Sort("Created", true). // 设置排序字段，根据Created字段升序排序，第二个参数false表示逆序
		From(0). // 设置分页参数 - 起始偏移量，从第0行记录开始
		Size(10).   // 设置分页参数 - 每页大小
		Do(ctx)             // 执行请求
```

### 3.匹配单个字段

某个字段使用全文搜索，也就是ES的match语法

例子：

```
// 创建match查询条件
matchQuery := elastic.NewMatchQuery("Title", "golang es教程")

searchResult, err := client.Search().
		Index("blogs").   // 设置索引名
		Query(matchQuery).   // 设置查询条件
		Sort("Created", true). // 设置排序字段，根据Created字段升序排序，第二个参数false表示逆序
		From(0). // 设置分页参数 - 起始偏移量，从第0行记录开始
		Size(10).   // 设置分页参数 - 每页大小
		Do(ctx) 
```

### 4.范围查询

实现类似Created > '2020-07-20' and Created < '2020-07-22'的范围查询条件

创建查询表达式例子：

```
// 例1 等价表达式： Created > "2020-07-20" and Created < "2020-07-29"
rangeQuery := elastic.NewRangeQuery("Created").
		Gt("2020-07-20").
		Lt("2020-07-29")

// 例2 等价表达式： id >= 1 and id < 10
rangeQuery := elastic.NewRangeQuery("id").
		Gte(1).
		Lte(10)
```

### 5、单关键词搜索



### 6、多属性关键词搜索



### 7、bool组合查询

bool组合查询，实际上就是组合了前面的查询条件，然后通过类似SQL语句的and和or将查询条件组合起来，不熟悉ES查询语法，请参考[ES教程](https://www.tizi365.com/archives/590.html)

#### 5.1. must条件

类似SQL的and，代表必须匹配的条件。

```
// 创建bool查询
boolQuery := elastic.NewBoolQuery().Must()

// 创建term查询
termQuery := elastic.NewTermQuery("Author", "tizi")
matchQuery := elastic.NewMatchQuery("Title", "golang es教程")

// 设置bool查询的must条件, 组合了两个子查询
// 表示搜索匹配Author=tizi且Title匹配"golang es教程"的文档
boolQuery.Must(termQuery, matchQuery)

searchResult, err := client.Search().
		Index("blogs").   // 设置索引名
		Query(boolQuery).   // 设置查询条件
		Sort("Created", true). // 设置排序字段，根据Created字段升序排序，第二个参数false表示逆序
		From(0). // 设置分页参数 - 起始偏移量，从第0行记录开始
		Size(10).   // 设置分页参数 - 每页大小
		Do(ctx)             // 执行请求
```

#### 5.2. must_not条件

跟must的作用相反，用法和must类似

```
// 创建bool查询
boolQuery := elastic.NewBoolQuery().Must()

// 创建term查询
termQuery := elastic.NewTermQuery("Author", "tizi")

// 设置bool查询的must not条件
boolQuery.MustNot(termQuery)
```

#### 5.2. should条件

类似SQL中的 or， 只要匹配其中一个条件即可

```
// 创建bool查询
boolQuery := elastic.NewBoolQuery().Must()

// 创建term查询
termQuery := elastic.NewTermQuery("Author", "tizi")
matchQuery := elastic.NewMatchQuery("Title", "golang es教程")

// 设置bool查询的should条件, 组合了两个子查询
// 表示搜索Author=tizi或者Title匹配"golang es教程"的文档
boolQuery.Should(termQuery, matchQuery)
```



## 13、搜索词条高亮处理



```go
func TestHighlightWithTermQuery(t *testing.T) {
	client := setupTestClientAndCreateIndex(t) //, SetTraceLog(log.New(os.Stdout, "", 0)))

	tweet1 := tweet{User: "olivere", Message: "Welcome to Golang and Elasticsearch."}
	tweet2 := tweet{User: "olivere", Message: "Another unrelated topic."}
	tweet3 := tweet{User: "sandrae", Message: "Cycling is fun to do."}

	// Add all documents
	_, err := client.Index().Index(testIndexName).Id("1").BodyJson(&tweet1).Do(context.TODO())
	if err != nil {
		t.Fatal(err)
	}

	_, err = client.Index().Index(testIndexName).Id("2").BodyJson(&tweet2).Do(context.TODO())
	if err != nil {
		t.Fatal(err)
	}

	_, err = client.Index().Index(testIndexName).Id("3").BodyJson(&tweet3).Do(context.TODO())
	if err != nil {
		t.Fatal(err)
	}

	_, err = client.Refresh().Index(testIndexName).Do(context.TODO())
	if err != nil {
		t.Fatal(err)
	}

	// Specify highlighter
	hl := NewHighlight()
	hl = hl.Fields(NewHighlighterField("message"))
	hl = hl.PreTags("<em>").PostTags("</em>")

	// Match all should return all documents
	query := NewPrefixQuery("message", "golang")
	searchResult, err := client.Search().
		Index(testIndexName).
		Highlight(hl).
		Query(query).
		Pretty(true).
		Do(context.TODO())
	if err != nil {
		t.Fatal(err)
	}
	if searchResult.Hits == nil {
		t.Fatalf("expected SearchResult.Hits != nil; got nil")
	}
	if searchResult.TotalHits() != 1 {
		t.Fatalf("expected SearchResult.TotalHits() = %d; got %d", 1, searchResult.TotalHits())
	}
	if len(searchResult.Hits.Hits) != 1 {
		t.Fatalf("expected len(SearchResult.Hits.Hits) = %d; got %d", 1, len(searchResult.Hits.Hits))
	}

	hit := searchResult.Hits.Hits[0]
	var tw tweet
	if err := json.Unmarshal(hit.Source, &tw); err != nil {
		t.Fatal(err)
	}
	if hit.Highlight == nil || len(hit.Highlight) == 0 {
		t.Fatal("expected hit to have a highlight; got nil")
	}
	if hl, found := hit.Highlight["message"]; found {
		if len(hl) != 1 {
			t.Fatalf("expected to have one highlight for field \"message\"; got %d", len(hl))
		}
		expected := "Welcome to <em>Golang</em> and Elasticsearch."
		if hl[0] != expected {
			t.Errorf("expected to have highlight \"%s\"; got \"%s\"", expected, hl[0])
		}
	} else {
		t.Fatal("expected to have a highlight on field \"message\"; got none")
	}
}
```





## 14、elasticsearch集群配置

集群包的准备
新建一个elasticsearch-cluster文件夹

把elasticsearch-7.17.7-windows-x86_64.zip文件解压三份, 分别命名为
node1
node2
node3
如下

### 启动第一个节点

对node1的config目录下的elasticsearch.yml进行修改

```properties
#集群名称，节点之间要保持一致
cluster.name: my-elasticsearch

# 当前节点名称 是否能 成为master 
node.name: node-1001
node.master: true
node.data: true

network.host: localhost

http.port: 1001
# tcp通信端口
transport.tcp.port: 9301

#跨域配置
#action.destructive_requires_name: true
http.cors.enabled: true
http.cors.allow-origin: "*"

```

修改完成上面的配置后, 即可启动第一个节点.
从启动日志中, 可以看到集群的名称



使用get请求, 可以查看集群的状态
`http://localhost:1001/_cluster/health`
响应结果如下

```json
{
    "cluster_name": "my-elasticsearch",
    "status": "yellow",
    "timed_out": false,
    "number_of_nodes": 1,
    "number_of_data_nodes": 1,
    "active_primary_shards": 6,
    "active_shards": 6,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 3,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 66.66666666666666
}

```

### 启动第二个节点

修改第二个节点的配置, 与第一个节点要增加配置.
增加了主节点的配置信息
并且修改相关端口. 集群名称不变.

```properties
#集群名称，节点之间要保持一致
cluster.name: my-elasticsearch

# 当前节点名称 是否能 成为master 
node.name: node-1002
node.master: true
node.data: true

network.host: localhost

http.port: 1002
# tcp通信端口
transport.tcp.port: 9302

# 主节点的信息
discovery.seed_hosts: ["localhost:9301"]
discovery.zen.fd.ping_timeout: 1m
discovery.zen.fd.ping_retries: 5

#跨域配置
#action.destructive_requires_name: true
http.cors.enabled: true
http.cors.allow-origin: "*"

```

修改完上面配置后, 进行启动, 从如下启动日志可以看出 , 集群名称为my-elasticsearch, 并且master节点为node1.



再次查询集群状态, 可以看到有两个节点了.







### 启动第三个节点

修改第三个解压包的配置文件如下.
在`discovery.seed_hosts`中, 修改为可以查找9301 和9302 即可以去查找node1 node2 两个节点信息.

```properties
#集群名称，节点之间要保持一致
cluster.name: my-elasticsearch

# 当前节点名称 是否能 成为master 
node.name: node-1003
node.master: true
node.data: true

network.host: localhost

http.port: 1003
# tcp通信端口
transport.tcp.port: 9303

# 主节点的信息
discovery.seed_hosts: ["localhost:9301","localhost:9302"]
discovery.zen.fd.ping_timeout: 1m
discovery.zen.fd.ping_retries: 5

#跨域配置
#action.destructive_requires_name: true
http.cors.enabled: true
http.cors.allow-origin: "*"

```

修改完成后, 即可启动.

启动完成后, 查看集群信息.
执行请求
`http://localhost:1001/_cluster/health`
可以看到节点数为三个了.



==切记记得每个节点都要安装：ik的插件，否则会造成失效==



## 15、golang elasticsearch连接配置

```go
client, err := elastic.NewClient(
		// elasticsearch 服务地址，多个服务地址使用逗号分隔
		elastic.SetURL("http://10.0.1.1:9200", "http://10.0.1.2:9200"),
		// 基于http base auth验证机制的账号和密码
		elastic.SetBasicAuth("user", "secret"),
		// 启用gzip压缩
		elastic.SetGzip(true),
		// 设置监控检查时间间隔
		elastic.SetHealthcheckInterval(10*time.Second),
		// 设置请求失败最大重试次数
		elastic.SetMaxRetries(5),
		// 设置错误日志输出
		elastic.SetErrorLog(log.New(os.Stderr, "ELASTIC ", log.LstdFlags)),
		// 设置info日志输出
		elastic.SetInfoLog(log.New(os.Stdout, "", log.LstdFlags)))
if err != nil {
    // Handle error
    panic(err)
}
_ = client
```



# 14、更多丰富的查询和参考

https://github.com/olivere/elastic

https://www.elastic.co/guide/cn/elasticsearch/guide/current/index-settings.html
