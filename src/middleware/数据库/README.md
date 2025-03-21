---
index: false
title: 数据库
icon: database
---

:::tip

数据库模块：每个数据库将概念和go实际使用两个模块，另外有高级使用再另写一个文件

:::





## 关系型数据库

**关系数据库（RDBMS）特点：**

- **结构化数据**: 数据以表格形式存储，每个表有固定的列和行，数据之间通过外键关联。
- **ACID属性**: 支持原子性（Atomicity）、一致性（Consistency）、隔离性（Isolation）和持久性（Durability），确保事务的完整性和数据的准确性。
- **SQL支持**: 使用结构化查询语言（SQL）进行数据操作和查询，学习曲线相对平缓。
- **Schema固定**: 表的结构一旦确定，修改比较困难。
- **适合复杂查询**: 对于复杂的多表联接、子查询等操作表现优秀。
- **数据一致性强**: 适合需要严格数据完整性和事务处理的应用场景。
- **扩展性**: 传统上扩展性不如NoSQL，但在现代通过分片（sharding）等技术也可以实现水平扩展。



### 目录

- [`MySQL`  ：开源，广泛用于Web应用](./MySQL.md)

---

- **SQLite**: 轻量级的嵌入式数据库，适合移动和小型应用
- **PostgreSQL**: 开源，功能丰富，支持复杂查询



## 非关系型数据库

**非关系数据库（NoSQL）特点：**

- **灵活的数据模型**: 支持多种数据类型（键值对、文档、宽列、图等），允许更灵活的数据存储。
- **高扩展性**: 设计上更适合分布式系统，容易水平扩展（添加更多节点来处理更多数据）。
- **BASE原则**: 强调基本可用性（Basically Available）、软状态（Soft state）和最终一致性（Eventual consistency），这意味着在某些情况下可以牺牲一些数据一致性以换取更高的可用性和性能。
- **没有固定的Schema**: 允许数据结构的变化和扩展，适用于处理动态或半结构化数据。
- **高性能读写**: 特别是在处理大量数据时，NoSQL数据库在读写性能上可能优于RDBMS。
- **多种查询语言**: 虽然有些NoSQL数据库支持SQL，但更多的是使用特定的查询语言或API。
- **适合大数据应用**: 像日志分析、内容管理、实时大数据处理等场景。



### 目录



- [`Redis`: 内存中的数据结构存储系统，常用于缓存和实时分析](./Redis.md)

- [`MongoDB`: 文档型NoSQL数据库，灵活的数据模型，适合处理大量非结构化数据](./MongoDB.md)

- [`Elasticsearch`: 搜索和分析引擎，基于Lucene，擅长全文搜索、日志分析。](./Elasticsearch.md)

---

- **Neo4j**: 图数据库，擅长处理复杂关系数据