---
# 这是文章的标题
title: Nginx


# 这是侧边栏的顺序
order: 1
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2020-01-01

# 一个页面可以有多个标签
tag:
  - web

# 此页面会出现在星标文章中
star: true
---



<br>

<br>

## 01：Nginx的概述

<br>

### 什么是Nginx

<br>

- *Nginx* (engine x) 是一个高性能的[HTTP](https://baike.baidu.com/item/HTTP)和[反向代理](https://baike.baidu.com/item/反向代理/7793488)web服务器，同时也提供了IMAP/POP3/SMTP服务。Nginx是由伊戈尔·赛索耶夫为[俄罗斯](https://baike.baidu.com/item/俄罗斯/125568)访问量第二的Rambler.ru站点（俄文：Рамблер）开发的，第一个公开版本0.1.0发布于2004年10月4日。其将[源代码](https://baike.baidu.com/item/源代码/3814213)以类[BSD许可证](https://baike.baidu.com/item/BSD许可证/10642412)的形式发布，因它的稳定性、丰富的功能集、简单的配置文件和低系统资源的消耗而[闻名](https://baike.baidu.com/item/闻名/2303308)。2011年6月1日，nginx 1.0.4发布。底层是用C语言开发。

- Nginx是一款[轻量级](https://baike.baidu.com/item/轻量级/10002835)的[Web](https://baike.baidu.com/item/Web/150564) 服务器/[反向代理](https://baike.baidu.com/item/反向代理/7793488)服务器及[电子邮件](https://baike.baidu.com/item/电子邮件/111106)（IMAP/POP3）代理服务器，在BSD-like 协议下发行。其特点是占有内存少，[并发](https://baike.baidu.com/item/并发/11024806)能力强，事实上nginx的并发能力在同类型的网页服务器中表现较好，中国大陆使用nginx网站用户有：百度、[京东](https://baike.baidu.com/item/京东/210931)、[新浪](https://baike.baidu.com/item/新浪/125692)、[网易](https://baike.baidu.com/item/网易/185754)、[腾讯](https://baike.baidu.com/item/腾讯/112204)、[淘宝](https://baike.baidu.com/item/淘宝/145661)等。

- 主要功能反向代理

- 通过配置文件可以实现集群和负载均衡

- 静态资源虚拟化

- 限流等

  <br>

### 常见的服务器

<br>

- 微软的IIS   asp.net
- Weblogs、Jboss 传统行业。ERP/电信/金融/物流
- Tomcat、Jetty    
- Apache http、Nginx  静态服务、反向代理
- Netty 高性能服务器编程。比如：webscoket,webserver,语音聊天室等

对比：[2019 年 12 月 Web 服务器调查 | Netcraft --- December 2019 Web Server Survey | Netcraft](https://www.netcraft.com/blog/december-2019-web-server-survey/)

<br><br>

## 02：Nginx的安装

<br>

nginx下载：http://nginx.org/en/download.html

- centos 7.8
- 服务器：阿里云



### 01、创建nginx服务器目录

```sh
mkdir -p /www/kuangstudy/nignx
cd /www/kuangstudy/nignx
```

### 02、下载安装

```sh
wget http://nginx.org/download/nginx-1.20.1.tar.gz
```

### 03、安装编译工具及库文件

```sh
yum -y install make zlib zlib-devel gcc-c++ libtool  openssl openssl-devel
```

### 04、解压nginx

```sh
tar -zxvf nginx-1.20.1.tar.gz
```

### 05、创建nginx的临时目录

```sh
mkdir -p /var/temp/nginx
```

###  06、进入安装包目录

```sh
cd nginx-1.20.1
```

### 07、配置nginx的安装路径

默认配置

```sh
./configure
```

安装以后的目录信息

```sh
  nginx path prefix: "/usr/local/nginx/nginx"
  nginx binary file: "/usr/local/nginx/nginx/sbin/nginx"
  nginx modules path: "/usr/local/nginx/nginx/modules"
  nginx configuration prefix: "/usr/local/nginx/nginx/conf"
  nginx configuration file: "/usr/local/nginx/nginx/conf/nginx.conf"
  nginx pid file: "/var/run/nginx/nginx.pid"
  nginx error log file: "/var/log/nginx/error.log"
  nginx http access log file: "/var/log/nginx/access.log"
  nginx http client request body temporary files: "/var/temp/nginx/client"
  nginx http proxy temporary files: "/var/temp/nginx/proxy"
  nginx http fastcgi temporary files: "/var/temp/nginx/fastgi"
  nginx http uwsgi temporary files: "/var/temp/nginx/uwsgi"
  nginx http scgi temporary files: "/var/temp/nginx/scgi"
```

指定配置

```sh
./configure \
--prefix=/usr/local/nginx \
--pid-path=/var/run/nginx/nginx.pid \
--lock-path=/var/lock/nginx.lock \
--error-log-path=/var/log/nginx/error.log \
--http-log-path=/var/log/nginx/access.log \
--with-http_gzip_static_module \
--http-client-body-temp-path=/var/temp/nginx/client \
--http-proxy-temp-path=/var/temp/nginx/proxy \
--http-fastcgi-temp-path=/var/temp/nginx/fastgi \
--http-uwsgi-temp-path=/var/temp/nginx/uwsgi \
--http-scgi-temp-path=/var/temp/nginx/scgi \
--with-http_stub_status_module \
--with-http_ssl_module
```

安装的信息如下：

```sh
nginx path prefix: "/usr/local/nginx"
nginx binary file: "/usr/local/nginx/sbin/nginx"
nginx modules path: "/usr/local/nginx/modules"
nginx configuration prefix: "/usr/local/nginx/conf"
nginx configuration file: "/usr/local/nginx/conf/nginx.conf"
nginx pid file: "/var/run/nginx.pid"
nginx error log file: "/var/log/nginx/error.log"
nginx http access log file: "/var/log/nginx/access.log"
nginx http client request body temporary files: "/var/temp/nginx/client"
nginx http proxy temporary files: "/var/temp/nginx/proxy"
nginx http fastcgi temporary files: "/var/temp/nginx/fastgi"
nginx http uwsgi temporary files: "/var/temp/nginx/uwsgi"
nginx http scgi temporary files: "/var/temp/nginx/scgi"

```



![image-20210821111709845](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_cmdConfig.png)

### 08、 make编译

```sh
make
```

### 09、 安装

```nginx
make install
```

### 10、 进入sbin目录启动nginx

```
./nginx
```

```sh
#停止：
./nginx -s stop
#重新加载：
./nginx -s reload 
```

### 11、打开浏览器，访问虚拟机所处内网ip即可打开nginx默认页面，显示如下便表示安装成功：

```sh
http://ip
```

![image-20210821141421135](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_webShow.png)

### 12、注意事项

1. 如果在云服务器安装，需要开启默认的nginx端口：80

2. 如果在虚拟机安装，需要关闭防火墙

3. 本地win或mac需要关闭防火墙
4. nginx的安装目录是：/usr/local/nginx

### 13、配置nginx的环境变量

配置的好处：就是可以任意目录下执行nginx的启动，关闭，推出，重启加载。

```sh
vim /etc/profile
```

在文件的尾部追加如下：

```sh
export NGINX_HOME=/usr/local/nginx
export PATH=$NGINX_HOME/sbin:$PATH
```

重启配置文件

```sh
source /etc/profile
```



### 14、加载默认页面

1、访问：http://139.224.164.101:80/ ---->Nginx--监听80端口-->找到对应server---->映射路由/----> html中的index.html

![image-20210821220258886](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_reqWork.png)

2、打开`/usr/local/nginx/conf/nginx.conf`如下

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    gzip  on;
    server {
        # 监听端口80 
        listen       80;
        # 请求时候的ip,也可以是具体的ip，也可以是域名
        server_name  localhost;
     	# 找到请求时候的服务器路由资源
        location / {
    		# root是根，html是一个相对路径，前面没有斜线哦，当然你也可以写绝对路径
            root   html;
    		# 首页指定的页面名称
            index  index.html index.htm;
        }

		# 出错的时候进行访问的页面
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}

```

**切记：注意修改配置文件一定要：重启nginx服务，访问生效**

```sh
nginx -s reload
```

http://139.224.164.101/





<br>

<br>

## 03：Nginx的进程结构

<br>

### Nginx的进程模型

#### 概述

- master进程：主进程，相当于一个领导者
- worker进程：工作进程，相当于一个工作人，它是为master进程去服务的。

```sh
ps -ef | grep nginx 
```

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_process.png)

master进程有且只有一个

worker进程，默认情况下：也只有一个，但是可以在配置文件中去配置worker的进程数量。

```sh
#user  nobody;
worker_processes  2;
```

重启nginx服务

```sh
#重启
nginx -s reload 
#检查配置文件是否有误
nginx -t
```

再次查看如下：

```sh
ps -ef | grep nginx
```

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_process.png)

#### 总结

- master会把所有的请求信号，分配给worker进程去进行处理。相当于老板在外面接了很多的任务，然后分派给小伙伴去完成。
- master会监控worker，是否正常还是发生了异常退出了 ，这个时候master会重启启动一个新的worker去重启执行任务。就相当于员工辞职了，老板需要重新在招聘一个员工一样的道理。这些信号有那些如下：

```
nginx -s quit
nginx -s reload
nginx -s stop
nginx -t
```

这些信号都是worker去执行和处理。

![image-20210821200948492](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workHandle1.png)

- master和worker是一个进程模型，这样的好处可以起到隔离的作用。



### Nginx的worker抢占机制

![image-20210821201134971](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workerHandle2.png)

1、通过配置文件，修改worker 进程的数量，假设是3个。

2、其原理是：master通过主进程fork了三个工作worker进程。这个时候如果有客户端有请求进入nginx服务器。

3、3个worker进程会通过争抢accept_mutex锁，来处理某个客户端的请求。那个worker进程抢到，就那个worker进程去处理这个客户端请求。





## 04、Nginx.conf配置文件分析



### Nginx.conf配置文件分析

![image-20210821150531906](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_configAnalyse.png)

```nginx
# 设置worker进程的用户，指的linux中的用户，会涉及到nginx操作目录或文件的一些权限，默认为 nobody。
# 默认情况是：nobody，你注释的情况下也是nobody。当然你也可以修改成 user root，修改以后记得重启翻方可生效，然后通过ps -ef | grep nginx 可以查看效果。
#user  nobody;
#worker进程工作数设置，一般来说CPU有几个，就设置几个，或者设置为N-1也行
worker_processes  2;

#  nginx 日志级别 debug | info | notice | warn | error | crit | alert | emerg ，错误级别从左到右越来越大
# 默认是：emerg级别，存储的路在 /var/log/nginx/error.log
#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

# 设置nginx进程 pid
#pid        logs/nginx.pid;

# 配置系统的线程模型和工作线程的线程数量
events {
    # linux系统默认使用epoll
    use epoll;
    # 每个工作进程的最大允许连接的客户端最大连接数 ab/jmeter
    # 点 cpu neicun 硬盘 sso jmter 100000 404 500
    worker_connections  10240;
}

# http 是指令块，针对http网络传输的一些指令配置
http {
    # 包含和导入外部的文件，进行模块化的划分。  
    include       mime.types;
    default_type  application/octet-stream;

    # 配置日志格式
    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    # 给于access_log的格式是main格式，然后把每次请求的信息写入到logs/access.log中。
    #access_log  logs/access.log  main;
	
    # 启用文件的高效传输，打开有利于文件传输的性能
    sendfile        on;
    #tcp_nopush它必须和sendfile使用，并且sendfile打开了才生效，它的含义是：当请求的数据包累积了到一定的大小的时候，在进行发送。
    #tcp_nopush     on;

    # 客户端连接服务器的超时时间，默认是65秒，0代表不保持连接----

    #keepalive_timeout  0;
    keepalive_timeout  65;

    # 开启gzip,利于文件和请求数据的传输。
    gzip  on;
    
    
    http://47.115.230.36:80/
        
        
    # 服务虚拟主机配置
    server {
        # 监听端口
        listen       80;
        # 监听nginx所在服务得ip，域名或者localhost
        server_name  localhost;
        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
      
    }

    # 服务虚拟主机配置
    server {
        # 监听端口
        listen       8087;
        # 监听服务器ip，域名，或者localhost
        server_name  localhost;
        location / {
            root   html;
            index  newindex.html;
        }
    }

}

```

记得重启nginx服务器

```nginx
nginx -s reload
```

nginx的配置文件中的server

- 要么端口隔离
  - 如果都要占用端口都是80，那么你必须使用server_name进行隔离
- 要么域名隔离
- 但是不允许同时出现相同端口和相同域名

### Nginx外部配置文件include 包含

 include 引入外部配置，提高可读性，避免单个配置文件过大

新建一个yykk.conf,如下：

```nginx
# 服务虚拟主机配置
    server {
        # 监听端口
        listen       80;
        # 监听服务器ip，域名，或者localhost
        server_name  localhost;
        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
       
    }

    # 服务虚拟主机配置
    server {
        # 监听端口
        listen       8087;
        # 监听服务器ip，域名，或者localhost
        server_name  localhost;
        location / {
            root   html;
            index  newindex.html;
        }
    }

```

然后在nginx.conf文件中包含这个文件即可，如下：

```nginx
# 当worker进程在执行的时候，它是由操作系统的每一个用户去进行执行的，master是root用户执行的。
# 默认情况是：nobody，你注释的情况下也是nobody。当然你也可以修改成 user root，修改以后记得重启翻方可生效，然后通过ps -ef | grep nginx 可以查看效果。
#user  nobody;
# worker进程的数量，一般cpu设置：cpu核数-1
worker_processes  2;

# 配置错误日志的目录。日志的级别是：debug(最全面) info notice warn error crit(最严重)
# 默认是：error级别，存储的路在 /var/log/nginx/error.log
#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

# 
#pid        logs/nginx.pid;

# 配置系统的线程模型和工作线程的线程数量
events {
    # linux系统默认使用epoll
    use epoll;
    # 每个工作进程的最大允许连接的客户端最大连接数
    worker_connections  10240;
}

# 配置网络传输的模块
http {
    # 包含和导入外部的文件，进行模块化的划分。  
    include       mime.types;
    default_type  application/octet-stream;

    # 配置日志格式
    #log_format  logmain  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    # 给于access_log的格式是main格式，然后把每次请求的信息写入到logs/access.log中。
    #access_log  /var/log/nginx/access_server1.log  logmain;
	
    # 启用文件的高效传输，打开有利于文件传输的性能
    sendfile        on;
    #tcp_nopush它必须和sendfile使用，并且sendfile打开了才生效，它的含义是：当请求的数据包累积了到一定的大小的时候，在进行发送。
    tcp_nopush     on;

    # 客户端连接服务器的超时时间，默认是65秒，0代表不保持连接。
    #keepalive_timeout  0;
    keepalive_timeout  65;

    # 建议开启gzip,利于文件和请求数据的传输。同时消耗cpu时间
    gzip  on;
  
    
    # 这里进行包含
    include yykk.conf;
}


```

两个文件的所处的文件目录关系：

![image-20210821155648853](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_confLocation.png)

然后在重启即可：

```sh
nginx -t
nginx -s reload 
```

在浏览器访问依然可以正常的执行。

### 查看Nginx的配置 

查看nginx安装目录和日志的目录，就使用nginx -V 

但是前提是：你必须是使用`./configuration`的指定目录安全。

```sh
nginx -V
```

```sh
[root@iZuf62zev3la2ivndnxra5Z nginx]# nginx -V
nginx version: nginx/1.20.1
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-44) (GCC) 
built with OpenSSL 1.0.2k-fips  26 Jan 2017
TLS SNI support enabled
configure arguments: --prefix=/usr/local/nginx/nginx --pid-path=/var/run/nginx/nginx.pid --lock-path=/var/lock/nginx.lock --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --with-http_gzip_static_module --http-client-body-temp-path=/var/temp/nginx/client --http-proxy-temp-path=/var/temp/nginx/proxy --http-fastcgi-temp-path=/var/temp/nginx/fastgi --http-uwsgi-temp-path=/var/temp/nginx/uwsgi --http-scgi-temp-path=/var/temp/nginx/scgi --with-http_stub_status_module --with-http_ssl_module
```



#### nginx常量表

```properties
$args                    #请求中的参数值
$query_string            #同 $args
$arg_NAME                #GET请求中NAME的值
$is_args                 #如果请求中有参数，值为"?"，否则为空字符串
$uri                     #请求中的当前URI(不带请求参数，参数位于$args)，可以不同于浏览器传递的$request_uri的值，它可以通过内部重定向，或者使用index指令进行修改，$uri不包含主机名，如"/foo/bar.html"。
$document_uri            #同 $uri
$document_root           #当前请求的文档根目录或别名
$host                    #优先级：HTTP请求行的主机名>"HOST"请求头字段>符合请求的服务器名.请求中的主机头字段，如果请求中的主机头不可用，则为服务器处理请求的服务器名称
$hostname                #主机名
$https                   #如果开启了SSL安全模式，值为"on"，否则为空字符串。
$binary_remote_addr      #客户端地址的二进制形式，固定长度为4个字节
$body_bytes_sent         #传输给客户端的字节数，响应头不计算在内；这个变量和Apache的mod_log_config模块中的"%B"参数保持兼容
$bytes_sent              #传输给客户端的字节数
$connection              #TCP连接的序列号
$connection_requests     #TCP连接当前的请求数量
$content_length          #"Content-Length" 请求头字段
$content_type            #"Content-Type" 请求头字段
$cookie_name             #cookie名称
$limit_rate              #用于设置响应的速度限制
$msec                    #当前的Unix时间戳
$nginx_version           #nginx版本
$pid                     #工作进程的PID
$pipe                    #如果请求来自管道通信，值为"p"，否则为"."
$proxy_protocol_addr     #获取代理访问服务器的客户端地址，如果是直接访问，该值为空字符串
$realpath_root           #当前请求的文档根目录或别名的真实路径，会将所有符号连接转换为真实路径
$remote_addr             #客户端地址
$remote_port             #客户端端口
$remote_user             #用于HTTP基础认证服务的用户名
$request                 #代表客户端的请求地址
$request_body            #客户端的请求主体：此变量可在location中使用，将请求主体通过proxy_pass，fastcgi_pass，uwsgi_pass和scgi_pass传递给下一级的代理服务器
$request_body_file       #将客户端请求主体保存在临时文件中。文件处理结束后，此文件需删除。如果需要之一开启此功能，需要设置client_body_in_file_only。如果将次文件传 递给后端的代理服务器，需要禁用request body，即设置proxy_pass_request_body off，fastcgi_pass_request_body off，uwsgi_pass_request_body off，or scgi_pass_request_body off
$request_completion      #如果请求成功，值为"OK"，如果请求未完成或者请求不是一个范围请求的最后一部分，则为空
$request_filename        #当前连接请求的文件路径，由root或alias指令与URI请求生成
$request_length          #请求的长度 (包括请求的地址，http请求头和请求主体)
$request_method          #HTTP请求方法，通常为"GET"或"POST"
$request_time            #处理客户端请求使用的时间,单位为秒，精度毫秒； 从读入客户端的第一个字节开始，直到把最后一个字符发送给客户端后进行日志写入为止。
$request_uri             #这个变量等于包含一些客户端请求参数的原始URI，它无法修改，请查看$uri更改或重写URI，不包含主机名，例如："/cnphp/test.php?arg=freemouse"
$scheme                  #请求使用的Web协议，"http" 或 "https"
$server_addr             #服务器端地址，需要注意的是：为了避免访问linux系统内核，应将ip地址提前设置在配置文件中
$server_name             #服务器名
$server_port             #服务器端口
$server_protocol         #服务器的HTTP版本，通常为 "HTTP/1.0" 或 "HTTP/1.1"
$status                  #HTTP响应代码
$time_iso8601            #服务器时间的ISO 8610格式
$time_local              #服务器时间（LOG Format 格式）
$cookie_NAME             #客户端请求Header头中的cookie变量，前缀"$cookie_"加上cookie名称的变量，该变量的值即为cookie名称的值
$http_NAME               #匹配任意请求头字段；变量名中的后半部分NAME可以替换成任意请求头字段，如在配置文件中需要获取http请求头："Accept-Language"，$http_accept_language即可
$http_cookie
$http_host               #请求地址，即浏览器中你输入的地址（IP或域名）
$http_referer            #url跳转来源,用来记录从那个页面链接访问过来的
$http_user_agent         #用户终端浏览器等信息
$http_x_forwarded_for
$sent_http_NAME          #可以设置任意http响应头字段；变量名中的后半部分NAME可以替换成任意响应头字段，如需要设置响应头Content-length，$sent_http_content_length即可
$sent_http_cache_control
$sent_http_connection
$sent_http_content_type
$sent_http_keep_alive
$sent_http_last_modified
$sent_http_location
$sent_http_transfer_encoding
```







## 05：Nginx关于root和alias



### 01、上传静态资源到服务器

```
root = localtion /asserts ===/www/kuangstudy/resource

- /asserts/1.jpg
- /asserts/2.html

http://47.115.230.36:8088 /asserts/1.jpg



alias  location /asserts === =/www/kuangstudy/resource

- /1.jpg
- /2.html

http://47.115.230.36:8088/asserts /1.jpg —- http://47.115.230.36:8088/www/kuangstudy/resource/1.jpg
```

将静态资源目录上传到服务器`/www/kuangstudy/resources`目录下，如果你没有创建请创建：

```sh
mkdir -p /www/kuangstudy/resources
```

### 02、打开yykk.conf文件

增加静态资源服务器如下:

```nginx
# 静态资源服务器
server {
    # 监听端口
    listen       80;
    # 监听服务器ip，域名，或者localhost
    server_name  localhost;
    location / {
        root   /www/kuangstudy/resources;
        index  index.html;
    }
    
    # http://139.224.164.101:8088/res/css/login.css
    location /res {
        alias  /www/kuangstudy/resources/asserts/;
    }
    
	
    # http://139.224.164.101:8088/asserts/css/login.css
    location /asserts {
        root   /www/kuangstudy/resources;
    }
}

server {
    listen  80;
    server_name  ip/域名;
    
    location /xxx{
        root/alias  /www/yyy/
    }
}

```

### 03、验证和重启nginx

```sh
nginx -t
nginx -s reload
```

### 04、然后访问nginx的静态资源服务器

```sh
http://139.224.164.101:8088/ksdadmin/
```



### 05、alias与root的区别

- **alias与root指定的url意义不同**

root和alias都可以定义在location模块中，都是用来指定请求资源的真实路径，比如：

```nginx
location /abc/ {
    root /data/www;
}
```

请求http://IP:port/abc/123.png时，那么在服务器里面对应的真正的资源是：/data/www/abc/123.png

**注意：root真实路径是root指定的值加上location指定的值**。

```nginx
location /abc/ {
   alias /data/www;
}
```

请求http://IP:port/abc/123.png时，那么在服务器里面对应的真正的资源是：/data/www/123.png

**注意：alias真实路径是alias指定的值，不包含location指定的值了**。



- **在一个location中，alias可以存在多个，但是root只能有一个**
- **alias只能存在与location中，但是root可以用在server、http和location中**
- root和alias如果目录没有指定盘符/ 代表就是直接从nginx安装目录开始查询：/user/local/nginx/html



## 06：Nginx关于Location



### 01、默认匹配规则

location其实就和springmvc的路由规则是类似的。它是配置在server中，如下

```nginx
# 服务虚拟主机配置
server {
   # 监听端口
   listen       80;
   # 监听服务器ip，域名，或者localhost
   server_name  localhost;
   #access_log  logs/host.access.log  main;

   location / {
       root   html;
       index  index.html index.htm;
   }

   error_page   500 502 503 504  /50x.html;
   location = /50x.html {
       root   html;
   }
  
}
```

 上面的含义是：在root指定的html目录中找到index.html或者index.htm文件。

### 02、精准匹配规则

```nginx
# 服务虚拟主机配置
server {
   # 监听端口
   listen       8087;
   # 监听服务器ip，域名，或者localhost
   server_name  localhost;
#   location / {
#       root   html;
#       index  newindex.html;
#   }

   # 精准匹配
   location = / {
       root   html;
       index  newindex.html;
   }

   
   # 精准匹配
   location = /asserts/css/login.css {
       root   /www/kuangstudy/resources;
   }

}
```

注意root的路径是：你访问的是：https://ip:port/asserts/css/login.css 实际上在服务器上的目录是：

```properties
/www/kuangstudy/resources/asserts/css/login.css
```



### 03、正则匹配规则

```nginx
# 服务虚拟主机配置
server {
   # 监听端口
   listen       8085;
   # 监听服务器ip，域名，或者localhost
   server_name  localhost;


   # 正则表达式匹配 *代表的是不区分大小写
   location ^~ /asserts/ {
        root /www/kuangstudy/resources;
   }


    location ~* /asserts/\.(GIF|png|bmp|jpg|jpeg) {
        root   /www/kuangstudy/resources/;
    }
    
    location ~ /Abc/ {
      .....
    }
    #http://abc.com/Abc/ [匹配成功]
    #http://abc.com/abc/ [匹配失败]
    
    location ~* /Abc/ {
      .....
    }
    # 则会忽略 uri 部分的大小写
    #http://abc.com/Abc/ [匹配成功]
    #http://abc.com/abc/ [匹配成功]
} 
```

*代表的是不区分大小写。

访问路径：http://139.224.164.101:8085/asserts/img/bg.jpg

它会在/www/kuangstudy/resources目录下，进行层层的匹配和查找，找到就返回。





### 04、以某种字符串开头的匹配规则

```nginx
# 服务虚拟主机配置
server {
   # 监听端口
   listen       8083;
   # 监听服务器ip，域名，或者localhost
   server_name  localhost;


   # ^~ 以某种字符路径开头请求
   location ^~ /asserts/img {
       root   /www/kuangstudy/resources;
   }

} 
```

http://139.224.164.101:8083/asserts/img/indexlogo.png

 



05、注意事项

```nginx
location ^~ /asserts/img {
    # 注意正则匹配中不能使用alias别名
    #alias   /www/kuangstudy/resources/1.jpg;
    root   /www/kuangstudy/resources;
}
```







## 07：Nginx的限流

Nginx 提供两种限流方式，一是控制速率，二是控制并发连接数。

### 1、漏桶算法（限制请求次数）

漏桶算法思路很简单，请求先进入到漏桶里，漏桶以固定的速度出水，也就是处理请求，当水加的过快，则会直接溢出，也就是拒绝请求，可以看出**漏桶算法能强行限制数据的传输速率**。

![限流算法](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workLeakyBycket.png)

### 2、令牌桶算法（限制请求速度）

对于很多应用场景来说，除了要求能够限制数据的平均传输速率外，还要求允许某种程度的突发传输。这时候漏桶算法可能就不合适了，令牌桶算法更为适合。

令牌桶算法的原理是系统以恒定的速率产生令牌，然后把令牌放到令牌桶中，令牌桶有一个容量，当令牌桶满了的时候，再向其中放令牌，那么多余的令牌会被丢弃；当想要处理一个请求的时候，需要从令牌桶中取出一个令牌，如果此时令牌桶中没有令牌，那么则拒绝该请求。

![令牌桶](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workTokenBucket.png)

### 3、计数器（限制连接数）

计数器比较简单粗暴，比如我们限制的是1s能够通过的请求数，实现的思路就是从第一个请求进来开始计时，在接下来的1s内，每个请求进来请求数就+1，超过最大请求数的请求会被拒绝，等到1s结束后计数清零，重新开始计数。

这种方式有个很大的弊端：比如前10ms已经通过了最大的请求数，那么后面的990ms的请求只能拒绝，这种现象叫做“突刺现象”。

### 4、两种算法的区别

漏桶算法输入的时候请求不固定，但都会在漏桶里边先保存起来（小于漏桶的容量），然后输出的时候采用的是恒定的速率执行请求，有点像队列的先进先出，只是队列中的元素出队的时间间隔一致。

令牌桶算法跟漏桶算法刚好相反，令牌桶的大小就是接口所能承载的最大访问量，令牌的发放是恒速的，而最终能在某一时间处理的请求数不是恒定的，这取决于单位时间内令牌桶中的令牌数量。

从作用上来说，漏桶和令牌桶算法最明显的区别就是是否允许突发流量(burst)的处理，漏桶算法能够强行限制数据的实时传输（处理）速率，对突发流量不做额外处理；而令牌桶算法能够在限制数据的平均传输速率的同时允许某种程度的突发传输。

### 5、Nginx官方版本限制IP的连接和并发分别有两个模块

- limit_req_zone 用来限制单位时间内的请求数，即速率限制,采用的漏桶算法 “leaky bucket”。
- limit_req_conn 用来限制同一时间连接数，即并发限制。

#### 01、limit_req_zone 参数配置

```properties
Syntax: limit_req zone=name [burst=number] [nodelay];
Default:    —
Context:    http, server, location

limit_req_zone $binary_remote_addr zone=one:10m rate=2r/s;
```

- 第一个参数：$binary_remote_addr 表示通过remote_addr这个标识来做限制，“binary_”的目的是缩写内存占用量，是限制同一客户端ip地址。
- 第二个参数：zone=one:10m表示生成一个大小为10M，名字为one的内存区域，用来存储访问的频次信息。
- 第三个参数：rate=1r/s表示允许相同标识的客户端的访问频次，这里限制的是每秒1次，还可以有比如30r/m的。

```properties
limit_req zone=one burst=5 nodelay;
```

- 第一个参数：zone=one 设置使用哪个配置区域来做限制，与上面limit_req_zone 里的name对应。
- 第二个参数：burst=5，重点说明一下这个配置，burst爆发的意思，这个配置的意思是设置一个大小为5的缓冲区当有大量请求（爆发）过来时，超过了访问频次限制的请求可以先放到这个缓冲区内。
- 第三个参数：nodelay，如果设置，超过访问频次而且缓冲区也满了的时候就会直接返回503，如果没有设置，则所有请求会等待排队

**limit_req_zone示例**

```properties
http {
   limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
    server {
        location /search/ {
         	limit_req zone=one burst=5 nodelay;
         }
}
```

下面配置可以限制特定UA（比如搜索引擎）的访问：

```properties
limit_req_zone $anti_spider zone=one:10m   rate=10r/s;
limit_req zone=one burst=100 nodelay;
if ($http_user_agent ~* "googlebot|bingbot|Feedfetcher-Google") {
 set $anti_spider $http_user_agent;
}
```

其他参数

```properties
Syntax: limit_req_log_level info | notice | warn | error;
Default:    
limit_req_log_level error;
Context:    http, server, location
```

当服务器由于limit被限速或缓存时，配置写入日志。延迟的记录比拒绝的记录低一个级别。例子：limit_req_log_level notice延迟的的基本是info。

```properties
Syntax: limit_req_status code;
Default:    
limit_req_status 503;
Context:    http, server, location
```

设置拒绝请求的返回值。值只能设置 400 到 599 之间。



#### 02、ngx_http_limit_conn_module 参数配置

这个模块用来限制单个IP的请求数。并非所有的连接都被计数。只有在服务器处理了请求并且已经读取了整个请求头时，连接才被计数。

```properties
Syntax: limit_conn zone number;
Default:    —
Context:    http, server, location
limit_conn_zone $binary_remote_addr zone=addr:10m;
server {
    location /download/ {
 	limit_conn addr 1;
 }
```

一次只允许每个IP地址一个连接。

```properties
limit_conn_zone $binary_remote_addr zone=perip:10m;
limit_conn_zone $server_name zone=perserver:10m;
server {
 ...
 limit_conn perip 10;
 limit_conn perserver 100;
}
```

可以配置多个limit_conn指令。例如，以上配置将限制每个客户端IP连接到服务器的数量，同时限制连接到虚拟服务器的总数。

```properties
Syntax: limit_conn_zone key zone=name:size;
Default:    —
Context:    http
limit_conn_zone $binary_remote_addr zone=addr:10m;
```

在这里，客户端IP地址作为关键。请注意，不是$ remote_addr，而是使用$ binary_remote_addr变量。 $ remote_addr变量的大小可以从7到15个字节不等。存储的状态在32位平台上占用32或64字节的内存，在64位平台上总是占用64字节。对于IPv4地址，$ binary_remote_addr变量的大小始终为4个字节，对于IPv6地址则为16个字节。存储状态在32位平台上始终占用32或64个字节，在64位平台上占用64个字节。一个兆字节的区域可以保持大约32000个32字节的状态或大约16000个64字节的状态。如果区域存储耗尽，服务器会将错误返回给所有其他请求。

```properties
Syntax: limit_conn_log_level info | notice | warn | error;
Default:    
limit_conn_log_level error;
Context:    http, server, location
```

当服务器限制连接数时，设置所需的日志记录级别。

```properties
Syntax: limit_conn_status code;
Default:    
limit_conn_status 503;
Context:    http, server, location
```

设置拒绝请求的返回值。



### 6、Nginx限流实战

#### a.控制速率 - 基于ip限流配置

- 第一步在http中添加 `limit_req_zone $binary_remote_addr zone=one:10m rate=2r/s;`：

  - limit_req_zone：用来限制单位时间内的请求数

  - $binary_remote_addr：定义限流对象，binary_remote_addr是一种key，表示基于 remote_addr(客户端IP) 来做限流，binary_ 的目的是压缩内存占用量。

  - zone=one:10m：定义共享内存区来存储访问信息， one:10m 表示一个大小为10M，名字为one的内存区域。1M能存储16000 IP地址的访问信息，10M可以存储16W IP地址访问信息。

  - rate=1r/s：用于设置最大访问速率，rate=10r/s 表示每秒最多处理10个请求。Nginx 实际上以毫秒为粒度来跟踪请求信息，因此 10r/s 实际上是限制：每100毫秒处理一个请求。这意味着，自上一个请求处理完后，若后续100毫秒内又有请求到达，将拒绝处理该请求。

- 第二步：然后在server，中使用limit_req指令应用进行配置限流

```properties
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=2r/s;
server { 
    location / { 
     limit_req zone=mylimit;
     }
}
```

上述规则限制了每个IP访问的速度为2r/s，并将该规则作用于根目录。如果单个IP在非常短的时间内并发发送多个请求，结果会怎样呢？

我们使用单个IP在10ms内发并发送了6个请求，只有1个成功，剩下的5个都被拒绝。我们设置的速度是2r/s，为什么只有1个成功呢，是不是Nginx限制错了？当然不是，是因为Nginx的限流统计是基于毫秒的，我们设置的速度是2r/s，转换一下就是500ms内单个IP只允许通过1个请求，从501ms开始才允许通过第二个请求。

#### b.burst缓存处理

- 处理突发流量 （brust） 在超过1个请求就丢弃，没有“桶”的概念，所以我们需要添加一个“桶”

我们看到，我们短时间内发送了大量请求，Nginx按照==毫秒级精度统计==，超出限制的请求直接拒绝。这在实际场景中未免过于苛刻，真实网络环境中请求到来不是匀速的，很可能有请求“突发”的情况，也就是“一股子一股子”的。Nginx考虑到了这种情况，可以通过burst关键字开启对突发请求的缓存处理，而不是直接拒绝。

```properties
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=2r/s;
server { 
    location / { 
 	limit_req zone=mylimit burst=4;
 }
}
```

我们加入了burst=4，意思是每个key(此处是每个IP)最多允许4个突发请求的到来。如果单个IP在10ms内发送6个请求，结果会怎样呢？

![img](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_burstTest1.png)相比实例一成功数增加了4个，这个我们设置的burst数目是一致的。具体处理流程是：1个请求被立即处理，4个请求被放到burst队列里，另外一个请求被拒绝。通过burst参数，我们使得Nginx限流具备了缓存处理突发流量的能力。

但是请注意：burst的作用是让多余的请求可以先放到队列里，慢慢处理。如果不加nodelay参数，队列里的请求不会立即处理，而是按照rate设置的速度，以毫秒级精确的速度慢慢处理。

#### c.nodelay降低排队时间

在使用burst缓存处理中，我们看到，通过设置burst参数，我们可以允许Nginx缓存处理一定程度的突发，多余的请求可以先放到队列里，慢慢处理，这起到了平滑流量的作用。但是如果队列设置的比较大，请求排队的时间就会比较长，用户角度看来就是RT变长了，这对用户很不友好。有什么解决办法呢？nodelay参数允许请求在排队的时候就立即被处理，也就是说只要请求能够进入burst队列，就会立即被后台worker处理，请注意，这意味着burst设置了nodelay时，系统瞬间的QPS可能会超过rate设置的阈值。nodelay参数要跟burst一起使用才有作用。

延续burst缓存处理的配置，我们加入nodelay选项：

```text
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=2r/s;
server { 
    location / { 
 		limit_req zone=mylimit burst=4 nodelay;
	 }
}
```

单个IP 10ms内并发发送6个请求，结果如下：

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_burstTest2.png)

跟burst缓存处理相比，请求成功率没变化，但是总体耗时变短了。这怎么解释呢？在burst缓存处理中，有4个请求被放到burst队列当中，工作进程每隔500ms(rate=2r/s)取一个请求进行处理，最后一个请求要排队2s才会被处理；这里，请求放入队列跟burst缓存处理是一样的，但不同的是，队列中的请求同时具有了被处理的资格，所以这里的5个请求可以说是同时开始被处理的，花费时间自然变短了。

但是请注意，虽然设置burst和nodelay能够降低突发请求的处理时间，但是长期来看并不会提高吞吐量的上限，长期吞吐量的上限是由rate决定的，因为nodelay只能保证burst的请求被立即处理，但Nginx会限制队列元素释放的速度，就像是限制了令牌桶中令牌产生的速度。

看到这里你可能会问，加入了nodelay参数之后的限速算法，到底算是哪一个“桶”，是漏桶算法还是令牌桶算法？当然还算是漏桶算法。考虑一种情况，令牌桶算法的token为耗尽时会怎么做呢？由于它有一个请求队列，所以会把接下来的请求缓存下来，缓存多少受限于队列大小。但此时缓存这些请求还有意义吗？如果server已经过载，缓存队列越来越长，RT越来越高，即使过了很久请求被处理了，对用户来说也没什么价值了。所以当token不够用时，最明智的做法就是直接拒绝用户的请求，这就成了漏桶算法。

#### d.自定义返回值

```properties
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=2r/s;
server { 
    location / { 
       limit_req zone=mylimit burst=4 nodelay;
       limit_req_status 598;
    }
}
```

默认情况下 没有配置 status 返回值的状态：

![v2-112645b48dc2a53020cd20daee904ab9_720w](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_burstTest4.png)

![img](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_burstTest3.png)



#### f.基于链接限流

```properties
#user  nobody;
worker_processes  1;
#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;
#pid        logs/nginx.pid;
events {
    worker_connections  1024;
}
http {
    include       mime.types;
    default_type  application/octet-stream;
    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';
    #access_log  logs/access.log  main;
    sendfile        on;
    #tcp_nopush     on;
    #keepalive_timeout  0;
    keepalive_timeout  65;
    #gzip  on;
    #01、根据ip地址限制速度
    # $binary_remote_addr 是内存占用通过用户的访问ip地址来限流
    # zone=iplimit:20m 也就是说我申请一块20m内存大小的内存区域命名为：iplimit,这块区域专门用来记录你的访问频率信息。
    # rate=1r/s 每秒放行一个请求  100r/m 每分钟放100个请求进入nginx,用来标识访问的限流频率
    limit_req_zone $binary_remote_addr zone=iplimit:20m rate=10r/s;
    #02、根据服务器级别限流，对所有的请求都进行限流处理
    limit_req_zone $server_name zone=serverlimit:10m rate=100r/s;
    # 如果上面两者规则都进行了配置。只要请求踩到红线都会生效，这里的每一个规则就好比木桶原理一样，这里的每个规则都是木桶的木板
    # 你往里面倒水，取决于你木桶中最短的木板。
    # 03、基于连接数的限流规则，注意基于链接没有速率的概念。它是指当前现在的保持的active链接的数量限制。
    limit_conn_zone $binary_remote_addr zone=perip:20m;
    limit_conn_zone $server_name zone=perserver:20m;
    server {
        listen       80;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
        location /limit/ {
            proxy_pass http://127.0.0.1:8080/;
            # 基于ip地址的限制，
            # zone=iplimit 引入你要限流的规则
            # burst=2,设置一个大小为2的缓冲区域。当大量的请求到来的时候，请求数量超过限流频率时，将其放入缓存区域
            # nodelay: 如果缓存区满了以后直接返回503异常。
            limit_req zone=iplimit burst=2 nodelay;
            # 基于服务器级别的限制
            # 是实际生产中，server服务器级别的限流的每秒的速率肯定是比较大的，这里只是为了测试查看效果所以调小。
            limit_req zone=serverlimit burst=100 nodelay;
            
            
            # 基于conn的限流引用
            # 每个server最多保持100个连接
            limit_conn perserver 100;
            # 每个ip最多保持1个链接
            #limit_conn perip 1;
            limit_conn perip 10;
            # 异常情况，返回504，默认情况是返回：503
            limit_req_status 504;
            limit_conn_status 504;
        }
    }
}
```





## 08：Nginx的负载均衡&upstream

在服务器集群中，Nginx起到一个代理服务器的角色（即反向代理），为了避免单独一个服务器压力过大，将来自用户的请求转发给不同的服务器。



### 目标

jemter压力软件进行单台tomcat压力的线程测试

jemter压力软件进行nginx + 3tomcat压力的线程测试

```nginx
upstream tomcatservers {
  server 127.0.0.1:8080;
  server 127.0.0.1:8081;
  server 127.0.0.1:8082;
}

# 服务虚拟主机配置
server {
   # 监听端口
   listen       80;
   # 监听服务器ip，域名，或者localhost
   server_name  localhost;
   #access_log  logs/host.access.log  main;

   location / {
       proxy_pass http://tomcatservers;
   }

   error_page   500 502 503 504  /50x.html;
   location = /50x.html {
       root   html;
   }
  
}

upstream xxx {
  server 127.0.0.1:8080 策略;
  server 127.0.0.1:8081 策略;
  server 127.0.0.1:8082 策略;
}
server {
   listen       80;
   server_name  x'x'x;
   location / {
       proxy_pass http://xxx;
   }
}
```

这就是最基本的负载均衡实例，但这不足以满足实际需求；目前Nginx服务器的upstream模块支持6种方式的分配：

| 轮询               | 默认方式                   |
| ------------------ | -------------------------- |
| weight             | 权重方式                   |
| ip_hash            | 依据ip分配方式（存在隐患） |
| least_conn         | 最少连接方式               |
| fair（第三方）     | 响应时间方式               |
| url_hash（第三方） | 依据URL分配方式            |

在这里，只详细说明Nginx自带的负载均衡策略，第三方不多描述。



### 01、:star2:轮询

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workPoll.png)

最基本的配置方法，上面的例子就是轮询的方式，==它是upstream模块默认的负载均衡默认策略==。每个请求会按时间顺序逐一分配到不同的后端服务器。

有如下参数：

fail_timeout与max_fails结合使用。max_fails设置fail_timeout参数设置的时间内最大失败次数，如果在这个时间内，所有针对该服务器的请求都失败了，那么认为该服务器会被认为是停机了，fail_time服务器会被认为停机的时间长度,默认为10s。backup标记该服务器为备用服务器。当主服务器停止时，请求会被发送到它这里。down标记服务器永久停机了。

注意：

- 在轮询中，如果服务器down掉了，会自动剔除该服务器。
- 缺省配置就是轮询策略。
- 此策略适合服务器配置相当，无状态且短平快的服务使用。



### 02、:star2:weight(重量，权重，加权轮询)

加权重方式，在轮询策略的基础上指定轮询的几率。例子如下：

![image-20210823165956196](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workWeight.png)

权重方式，在轮询策略的基础上指定轮询的几率。例子如下：

在该例子中，weight参数用于指定轮询几率，weight的默认值为1,；weight的数值与访问比率成正比，比如Tomcat 7.0被访问的几率为其他服务器的两倍。

官网地址：http://nginx.org/en/docs/stream/ngx_stream_upstream_module.html

weight默认值是：1

注意：

- 权重越高分配到需要处理的请求越多。
- 此策略可以与least_conn和ip_hash结合使用。
- 此策略比较适合服务器的硬件配置差别比较大的情况。

```nginx
upstream tomcatservers {
  server 127.0.0.1:8080 weight=1; 
  server 127.0.0.1:8081 weight=2;
  server 127.0.0.1:8082 weight=3;
}
```



### 03、upStream

官网参考：http://nginx.org/en/docs/stream/ngx_stream_upstream_module.html

server相关参数：

upstream指令存在一些参数：

- max_conns：（保护服务资源）

  - 可以限制一台服务器的最大访问连接数。默认值是：0。代表不限制。

  - 其实也就是限流的含义。

  - 什么样子的情况下会使用max_conns: 比如临时增加一台服务器，但是这个服务器还运行着别人服务，你有不想过多消耗服务器的资源，而是临时顶替请求，这个可以考虑使用max_conn进行配置，

    

  ```nginx
  upstream tomcatservers {
    server 127.0.0.1:8080  max_conns=100;
    server 127.0.0.1:8081  max_conns=2;
    server 127.0.0.1:8082  max_conns=2;
  }
  ```

   

- slow_start(商业版使用)

  ```properties
  sets the time during which the server will recover its weight from zero to a nominal value, when unhealthy server becomes healthy, or when the server becomes available after a period of time it was considered unavailable. Default value is zero, i.e. slow start is disabled.
  翻译：当你设置这个值以后，你的权重weight会从0慢慢升级到一个正常的value，可以把一个不健康的服务器编程健康的服务器，它是在一段时间以后在去启动。默认是：0，默认情况下是：关闭的
  ```

  - 可以让一个服务器慢慢的加入到集群中
  - 这个参数不能使用到：hash和random的负载均衡策略中
  - 如果在 upstream 中只有一台 server，则该参数失效

  ```nginx
  upstream tomcatservers {
    server 127.0.0.1:8080  weight=10 slow_start=60s;
    server 127.0.0.1:8081  weight=2;
    server 127.0.0.1:8082  weight=2;
  }
  ```

  校验出现错误

  ``` nginx
  [root@iZuf62zev3la2ivndnxra5Z web1]# nginx -t
  nginx: [emerg] invalid parameter "slow_start=60s" in /usr/local/nginx/nginx/conf/yykk.conf:2
  nginx: configuration file /usr/local/nginx/nginx/conf/nginx.conf test failed
  
  ```

  原因是告诉你：slow_start 只能使用是商业版本nginx中。

- down

  - 作用：用于标识服务器当前的状态。
  - 如果用down进行服务器标记就告诉当前服务器不可用的状态。

  ```nginx
  upstream tomcatservers {
    server 127.0.0.1:8080  weight=10 down;
    server 127.0.0.1:8081  weight=2;
    server 127.0.0.1:8082  weight=2;
  }
  ```

  通过上述的配置以后，8080的服务器就被停止使用了。只能访问到8081和8082。

  

  

- backup(重要)

  - 作用：备机
  - backup 表示当前服务器节点是备用机，==只有在其他的服务器都宕机以后==，自己才会加入到集群中，被用户访问到
  - 用处：可以用于灰度部署时候的一种更替效果。

  

  **问题：什么样子的情况下载会出现全部宕机呢？**

  - 在发布项目的时候，可能会把网站关停
  - 高并发把网站冲垮了。

  

  ```nginx
  upstream tomcatservers {
    server 127.0.0.1:8080  weight=10 backup;
    server 127.0.0.1:8081  weight=2;
    server 127.0.0.1:8082  weight=2;
  }
  ```

  - 这个时候正常访问只能访问到8081和8082服务器，8080服务器作为备机
  - 可以尝试吧8081和8082服务挂掉，这个8080服务器生效
  - 在把8081和8082服务启动，这个时候8080又被挂起当做备用机

  

- max_fails 和 fail_timeout

  - 两个参数需要配合一起使用才有意义。max_fails ：表示失败几次，则标记server已宕机，剔出上游服务。fail_timeout ：表示失败的重试时间。
  - max_fails ：最大的失败次数，如果服务器访问的次数超过这个次数就会剔除服务，nginx就会认为这个服务器是挂掉的服务。
  - fail_timeout：失败的时间片段，如果配置fail_timeout=10s,max_fails=5次，代表的含义是：在10s之内如果出现的错误次数大于等于5次的时候，就会认为这个服务器是一个挂掉的服务，nginx会剔除该服务。 
  - max_fails：默认值是：1
  - fail_timeout的默认值是：10s

```nginx
upstream tomcatservers {
  server 127.0.0.1:8080  max_fails=3 fail_timeout=5s; // 这些配置一定要和你程序息息相关
  server 127.0.0.1:8081  weight=1;
  server 127.0.0.1:8082  weight=1;
}
```

则代表在1秒内请求某一server失败达到2次后，则认为该server已经挂了或者宕机了，随后再过1秒，这1秒内不会有新的请求到达刚刚挂掉的节点上，而是会 运作的server，1秒后会再有新请求尝试连接挂掉的server，如果还是失败，重复上一过程，直到恢复。





### 04、ip_hash

 指定负载均衡器按照基于客户端IP的分配方式，这个方法确保了相同的客户端的请求一直发送到相同的服务器，以保证session会话。这样每个访客都固定访问一个后端服务器，==可以解决session不能跨服务器的问题。==

- 在nginx版本1.3.1之前，不能在ip_hash中使用权重（weight）。

- ip_hash不能与backup同时使用。
- 此策略适合有状态服务，比如session。
- 当有服务器需要剔除，必须手动down掉。

文档：https://nginx.org/en/docs/http/ngx_http_upstream_module.html#ip_hash

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workIp_hash.png)

配置如下：

```nginx
upstream backend {
    ip_hash;

    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com down;
    server backend4.example.com;
}
```

源码分析

```c
/*
 * Copyright (C) Igor Sysoev
 * Copyright (C) Nginx, Inc.
 */


#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_http.h>


typedef struct {
    /* the round robin data must be first */
    ngx_http_upstream_rr_peer_data_t   rrp;

    ngx_uint_t                         hash;

    u_char                             addrlen;
    u_char                            *addr;

    u_char                             tries;

    ngx_event_get_peer_pt              get_rr_peer;
} ngx_http_upstream_ip_hash_peer_data_t;


static ngx_int_t ngx_http_upstream_init_ip_hash_peer(ngx_http_request_t *r,
    ngx_http_upstream_srv_conf_t *us);
static ngx_int_t ngx_http_upstream_get_ip_hash_peer(ngx_peer_connection_t *pc,
    void *data);
static char *ngx_http_upstream_ip_hash(ngx_conf_t *cf, ngx_command_t *cmd,
    void *conf);


static ngx_command_t  ngx_http_upstream_ip_hash_commands[] = {

    { ngx_string("ip_hash"),
      NGX_HTTP_UPS_CONF|NGX_CONF_NOARGS,
      ngx_http_upstream_ip_hash,
      0,
      0,
      NULL },

      ngx_null_command
};


static ngx_http_module_t  ngx_http_upstream_ip_hash_module_ctx = {
    NULL,                                  /* preconfiguration */
    NULL,                                  /* postconfiguration */

    NULL,                                  /* create main configuration */
    NULL,                                  /* init main configuration */

    NULL,                                  /* create server configuration */
    NULL,                                  /* merge server configuration */

    NULL,                                  /* create location configuration */
    NULL                                   /* merge location configuration */
};


ngx_module_t  ngx_http_upstream_ip_hash_module = {
    NGX_MODULE_V1,
    &ngx_http_upstream_ip_hash_module_ctx, /* module context */
    ngx_http_upstream_ip_hash_commands,    /* module directives */
    NGX_HTTP_MODULE,                       /* module type */
    NULL,                                  /* init master */
    NULL,                                  /* init module */
    NULL,                                  /* init process */
    NULL,                                  /* init thread */
    NULL,                                  /* exit thread */
    NULL,                                  /* exit process */
    NULL,                                  /* exit master */
    NGX_MODULE_V1_PADDING
};


static u_char ngx_http_upstream_ip_hash_pseudo_addr[3];


static ngx_int_t
ngx_http_upstream_init_ip_hash(ngx_conf_t *cf, ngx_http_upstream_srv_conf_t *us)
{
    if (ngx_http_upstream_init_round_robin(cf, us) != NGX_OK) {
        return NGX_ERROR;
    }

    us->peer.init = ngx_http_upstream_init_ip_hash_peer;

    return NGX_OK;
}


static ngx_int_t
ngx_http_upstream_init_ip_hash_peer(ngx_http_request_t *r,
    ngx_http_upstream_srv_conf_t *us)
{
    struct sockaddr_in                     *sin;
#if (NGX_HAVE_INET6)
    struct sockaddr_in6                    *sin6;
#endif
    ngx_http_upstream_ip_hash_peer_data_t  *iphp;

    iphp = ngx_palloc(r->pool, sizeof(ngx_http_upstream_ip_hash_peer_data_t));
    if (iphp == NULL) {
        return NGX_ERROR;
    }

    r->upstream->peer.data = &iphp->rrp;

    if (ngx_http_upstream_init_round_robin_peer(r, us) != NGX_OK) {
        return NGX_ERROR;
    }

    r->upstream->peer.get = ngx_http_upstream_get_ip_hash_peer;

    switch (r->connection->sockaddr->sa_family) {

    case AF_INET:
        sin = (struct sockaddr_in *) r->connection->sockaddr;
        iphp->addr = (u_char *) &sin->sin_addr.s_addr;
        iphp->addrlen = 3;
        break;

#if (NGX_HAVE_INET6)
    case AF_INET6:
        sin6 = (struct sockaddr_in6 *) r->connection->sockaddr;
        iphp->addr = (u_char *) &sin6->sin6_addr.s6_addr;
        iphp->addrlen = 16;
        break;
#endif

    default:
        iphp->addr = ngx_http_upstream_ip_hash_pseudo_addr;
        iphp->addrlen = 3;
    }

    iphp->hash = 89;
    iphp->tries = 0;
    iphp->get_rr_peer = ngx_http_upstream_get_round_robin_peer;

    return NGX_OK;
}


static ngx_int_t
ngx_http_upstream_get_ip_hash_peer(ngx_peer_connection_t *pc, void *data)
{
    ngx_http_upstream_ip_hash_peer_data_t  *iphp = data;

    time_t                        now;
    ngx_int_t                     w;
    uintptr_t                     m;
    ngx_uint_t                    i, n, p, hash;
    ngx_http_upstream_rr_peer_t  *peer;

    ngx_log_debug1(NGX_LOG_DEBUG_HTTP, pc->log, 0,
                   "get ip hash peer, try: %ui", pc->tries);

    /* TODO: cached */

    ngx_http_upstream_rr_peers_rlock(iphp->rrp.peers);

    if (iphp->tries > 20 || iphp->rrp.peers->single) {
        ngx_http_upstream_rr_peers_unlock(iphp->rrp.peers);
        return iphp->get_rr_peer(pc, &iphp->rrp);
    }

    now = ngx_time();

    pc->cached = 0;
    pc->connection = NULL;

    hash = iphp->hash;

    for ( ;; ) {

        for (i = 0; i < (ngx_uint_t) iphp->addrlen; i++) {
            hash = (hash * 113 + iphp->addr[i]) % 6271;
        }

        w = hash % iphp->rrp.peers->total_weight;
        peer = iphp->rrp.peers->peer;
        p = 0;

        while (w >= peer->weight) {
            w -= peer->weight;
            peer = peer->next;
            p++;
        }

        n = p / (8 * sizeof(uintptr_t));
        m = (uintptr_t) 1 << p % (8 * sizeof(uintptr_t));

        if (iphp->rrp.tried[n] & m) {
            goto next;
        }

        ngx_log_debug2(NGX_LOG_DEBUG_HTTP, pc->log, 0,
                       "get ip hash peer, hash: %ui %04XL", p, (uint64_t) m);

        ngx_http_upstream_rr_peer_lock(iphp->rrp.peers, peer);

        if (peer->down) {
            ngx_http_upstream_rr_peer_unlock(iphp->rrp.peers, peer);
            goto next;
        }

        if (peer->max_fails
            && peer->fails >= peer->max_fails
            && now - peer->checked <= peer->fail_timeout)
        {
            ngx_http_upstream_rr_peer_unlock(iphp->rrp.peers, peer);
            goto next;
        }

        if (peer->max_conns && peer->conns >= peer->max_conns) {
            ngx_http_upstream_rr_peer_unlock(iphp->rrp.peers, peer);
            goto next;
        }

        break;

    next:

        if (++iphp->tries > 20) {
            ngx_http_upstream_rr_peers_unlock(iphp->rrp.peers);
            return iphp->get_rr_peer(pc, &iphp->rrp);
        }
    }

    iphp->rrp.current = peer;

    pc->sockaddr = peer->sockaddr;
    pc->socklen = peer->socklen;
    pc->name = &peer->name;

    peer->conns++;

    if (now - peer->checked > peer->fail_timeout) {
        peer->checked = now;
    }

    ngx_http_upstream_rr_peer_unlock(iphp->rrp.peers, peer);
    ngx_http_upstream_rr_peers_unlock(iphp->rrp.peers);

    iphp->rrp.tried[n] |= m;
    iphp->hash = hash;

    return NGX_OK;
}


static char *
ngx_http_upstream_ip_hash(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)
{
    ngx_http_upstream_srv_conf_t  *uscf;

    uscf = ngx_http_conf_get_module_srv_conf(cf, ngx_http_upstream_module);

    if (uscf->peer.init_upstream) {
        ngx_conf_log_error(NGX_LOG_WARN, cf, 0,
                           "load balancing method redefined");
    }

    uscf->peer.init_upstream = ngx_http_upstream_init_ip_hash;

    uscf->flags = NGX_HTTP_UPSTREAM_CREATE
                  |NGX_HTTP_UPSTREAM_WEIGHT
                  |NGX_HTTP_UPSTREAM_MAX_CONNS
                  |NGX_HTTP_UPSTREAM_MAX_FAILS
                  |NGX_HTTP_UPSTREAM_FAIL_TIMEOUT
                  |NGX_HTTP_UPSTREAM_DOWN;

    return NGX_CONF_OK;
}

```

图解说明：

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workOnlyhash.png)

如果是在同一局域网内，算出的hash是一致的，这样他们就会出现相同的hash。





 





### 05、一致性hash

ip_hash存在的问题如下：

- 上面的hash负载均衡存在一个问题，就是如果一个服务器挂掉了，hash的计算就需要全部重新计算，如果是在并发非常大的情况下，用这种算法来实现的话，可能会造成大量的请求在某一个时刻失败。
- 或者节点增加也会发生这种问题的出现
- hash算法还会造成数据的服务的倾斜

解决上面的问题可以使用：一致性hash算法。

一直性Hash算法在很多场景下都有应用，尤其是在分布式缓存系统中，经常用其来进行缓存的访问的负载均衡，比如：redis等<k,v>非关系数据库作为缓存系统。我们首先来看一下采用取模方式进行缓存的问题。

**一致性Hash算法的使用场景**

  假设我们的将10台redis部署为我们的缓存系统，存储<k,v>数据，存储方式是：hash(k)%10，用来将数据分散到各个redis存储系统中。这样做，最大的问题就在于：如果此缓存系统扩展（比如：增加或减少redis服务器的数量），节点故障宕机等将会带来很高的代价。比如：我们业务量增大了，需要扩展我们的缓存系统，再增加一台redis作为缓存服务器，那么后来的数据<k,v>的散列方式变为了：hash(k)%11。我们可以看到，如果我们要查找扩展之前的数据，利用hash(k)%11，则会找不到对应的存储服务器。所以这个时候大量的数据失效了（访问不到了）。
这时候，我们就要进行数据的重现散列，如果是将redis作为存储系统，则需要进行数据迁移，然后进行恢复，但是这个时候就意味着每次增减服务器的时候，集群就需要大量的通信，进行数据迁移，这个开销是非常大的。如果只是缓存，那么缓存就都失效了。这会形成缓存击穿，导致数据库压力巨大，可能会导致应用的崩溃。



 因为对于hash(k)的范围在int范围，所以我们将0~2^32作为一个环。其步骤为：
1，求出每个服务器的hash（服务器ip）值，将其配置到一个 0~2^n 的圆环上（n通常取32）。
2，用同样的方法求出待存储对象的主键 hash值，也将其配置到这个圆环上，然后从数据映射到的位置开始顺时针查找，将数据分布到找到的第一个服务器节点上。
其分布如图：

![1501874-20190328153045991-59319015](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workHash.png)

这是一致性hash算法的基本原理，接下来我们看一下，此算法是如何解决 我们上边 说的 缓存系统的扩展或者节点宕机导致的缓存失效的问题。比如:再加入一个redis节点：



![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workHashAddRedis2.png)



**雪崩效应**

接下来我们来看一下，当有节点宕机时会有什么问题。如下图：

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workHashAddRedis.png)

 

如上图，当B节点宕机后，原本存储在B节点的k1，k2将会迁移到节点C上，这可能会导致很大的问题。如果B上存储的是热点数据，将数据迁移到C节点上，然后C需要承受B+C的数据，也承受不住，也挂了。。。。然后继续CD都挂了。这就造成了雪崩效应。
上面会造成雪崩效应的原因分析：
如果不存在热点数据的时候，每台机器的承受的压力是M/2(假设每台机器的最高负载能力为M)，原本是不会有问题的，但是，这个时候A服务器由于有热点数据挂了，然后A的数据迁移至B，导致B所需要承受的压力变为M（还不考虑热点数据访问的压力），所以这个失败B是必挂的，然后C至少需要承受1.5M的压力。。。。然后大家一起挂。。。
所以我们通过上面可以看到，之所以会大家一起挂，原因在于如果一台机器挂了，那么它的压力全部被分配到一台机器上，导致雪崩。

怎么解决雪崩问题呢，这时候需要引入虚拟节点来进行解决。
虚拟节点

虚拟节点，我们可以针对每个实际的节点，虚拟出多个虚拟节点，用来映射到圈上的位置，进行存储对应的数据。如下图：

![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workHashMoreNode.png)

 

如上图：A节点对应A1，A2，BCD节点同理。这时候，如果A节点挂了，A节点的数据迁移情况是:A1数据会迁移到C2，A2数据迁移到D1。这就相当于A的数据被C和D分担了，这就避免了雪崩效应的发送，而且虚拟节点我们可以自定义设置，使其适用于我们的应用。

存在的问题
⼀致性哈希算法在服务节点太少时，容易因为节点分部不均匀⽽造成数据倾斜问题。例如系统中只有两台服务器，其环分布如下，节点2只能负责⾮常⼩的⼀段，⼤量的客户端请求落在了节点1上，这就是数据（请求）倾斜问题。

为了解决这种数据倾斜问题，⼀致性哈希算法引⼊了虚拟节点机制，即对每⼀个服务节点计算多个哈希，每个计算结果位置都放置⼀个此服务节点，称为虚拟节点。

具体做法可以在服务器ip或主机名的后⾯增加其他字符来实现。⽐如，可以为每台服务器计算三个虚拟节点，于是可以分别计算 “节点1的ip#1”、“节点1的ip#2”、“节点1的ip#3”、“节点2的ip#1”、“节点2的ip#2”、“节点2的ip#3”的哈希值，于是形成六个虚拟节点，当客户端被路由到虚拟节点的时候其实是被路由到该虚拟节点所对应的真实节点。
![image](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_workHash11.png)

自定义一致性hash算法：

```java
import java.util.SortedMap;
import java.util.TreeMap;
 
public class Main {
 
    public static void main(String[] args) {
 
        // 定义服务器ip
        String[] tomcatServers = {"192.222.1.30","19.16.1.2","192.168.1.13"};
        SortedMap<Integer,String> serverMap = new TreeMap<>();
 
        // 定义针对每个真实服务器虚拟出来⼏个节点
        int virtaulCount = 3;
 
        for (String tomcatServer : tomcatServers) {
            int hash = Math.abs(tomcatServer.hashCode());
            serverMap.put(hash,tomcatServer);
 
            //创建虚拟节点
            for (int i = 0; i < virtaulCount; i++) {
                int virtaulHash = Math.abs((tomcatServer+"a").hashCode());
                serverMap.put(virtaulHash,"由"+tomcatServer+"的虚拟节点处理");
            }
        }
        
        
        
        //定义客户端
        String[] userServers = {"19.11.12.1","10.113.120.79","107.180.13.5"};
        for (String userServer : userServers){
            int userhash = Math.abs(userServer.hashCode());
            //获取到所有key大于用户hash值的map集合
            SortedMap<Integer,String> sortedMap = serverMap.tailMap(userhash);
 
            if(sortedMap.isEmpty()){
                //如果为空，则表示当前用户节点后没有服务器节点，则使用圆环中的第一个节点
                Integer firstKey = serverMap.firstKey();
                System.out.println("客户端"+userServer+"使用服务器"+serverMap.get(firstKey));
            }else{
                //不为空则寻找第一个大于用户hash的key
                Integer firstKey = sortedMap.firstKey();
                System.out.println("客户端"+userServer+"使用服务器"+serverMap.get(firstKey));
            }
 
        }
    }
}
```

配置一致性hash策略

nginx的负载均衡策略中不包含一致性hash，所以我们需要安装ngx_http_upstream_consistent_hash模块到我们的nginx中

可以到nginx的src/http/modules下查看已经安装的模块，比如ip_hash策略



ngx_http_upstream_consistent_hash 模块是⼀个负载均衡器，使⽤⼀个内部⼀致性hash算法来选择合适的后端节点。该模块可以根据配置参数采取不同的⽅式将请求均匀映射到后端机器，
consistent_hash $remote_addr：可以根据客户端ip映射
consistent_hash $request_uri：根据客户端请求的uri映射
consistent_hash $args：根据客户端携带的参数进⾏映

安装步骤：

1）github下载nginx⼀致性hash负载均衡模块 https://github.com/replay/ngx_http_consistent_hash



2）将下载的压缩包上传到nginx服务器，并解压
3）我们已经编译安装过nginx，此时进⼊当时nginx的安装目录⽬录，执⾏如下命令，等号后边为下载的插件的解压目录

```sh
./configure --add-module=/www/kuangstudy/nignx/ngx_http_consistent_hash-master
```

4）编译和安装

```sh
make && make install
```

5）在nginx.conf⽂件中配置

```
upstream somestream {
  consistent_hash $request_uri;
  server 10.50.1.3:11211;
  server 10.50.1.4:11211;
  server 10.50.1.5:11211;
}
```





### 06、url_hash(细粒度的负载均衡)

- 第三方的负载均衡策略的实现需要安装第三方插件。
- 按访问url的hash结果来分配请求，使每个url定向到同一个后端服务器，要配合缓存命中来使用。同一个资源多次请求，可能会到达不同的服务器上，导致不必要的多次下载，缓存命中率不高，以及一些资源时间的浪费。而使用url_hash，可以使得同一个url（也就是同一个资源请求）会到达同一台服务器，一旦缓存住了资源，再此收到请求，就可以从缓存中读取。　

```nginx
upstream dynamic_zuoyu {
    hash $request_uri;    #实现每个url定向到同一个后端服务器
    server localhost:8080;  
    server localhost:8081;  
    server localhost:8082;  
    server localhost:8083;  
}
```

java代码如下：

```java
package com.kuang.contorller;

import com.kuang.utils.ip.IpUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * @author 飞哥
 * @Title: 学相伴出品
 * @Description: 我们有一个学习网站：https://www.kuangstudy.com
 * @date 2021/8/23 12:31
 */
@RestController
public class TestController {


    @Value("${server.port}")
    private String port;


    @GetMapping("/nginx/test")
    public Map<String, String> test(HttpServletRequest request) {
        Map<String, String> map = new HashMap<>();
        String ipAddr = IpUtils.getIpAddr(request);
        map.put("port1", request.getLocalPort() + "");
        map.put("port2", request.getServerPort() + "");
        map.put("port3", request.getRemotePort() + "");
        map.put("url", request.getRequestURL().toString());
        map.put("port4", port);
        map.put("ipAddr", ipAddr);
        return map;
    }


    @GetMapping("/c/list")//8081
    public Map<String, String> courselist(HttpServletRequest request) {
        Map<String, String> map = new HashMap<>();
        String ipAddr = IpUtils.getIpAddr(request);
        map.put("port1", request.getLocalPort() + "");
        map.put("port2", request.getServerPort() + "");
        map.put("port3", request.getRemotePort() + "");
        map.put("url", request.getRequestURL().toString());
        map.put("port4", port);
        map.put("ipAddr", ipAddr);
        return map;
    }

    @GetMapping("/u/info")//8080
    public Map<String, String> userlist(HttpServletRequest request) {
        Map<String, String> map = new HashMap<>();
        String ipAddr = IpUtils.getIpAddr(request);
        map.put("port1", request.getLocalPort() + "");
        map.put("port2", request.getServerPort() + "");
        map.put("port3", request.getRemotePort() + "");
        map.put("url", request.getRequestURL().toString());
        map.put("port4", port);
        map.put("ipAddr", ipAddr);
        return map;
    }

}

```

访问地址：

http://139.224.164.101/c/list

http://139.224.164.101/u/info

http://139.224.164.101/nginx/test





### 07、least_conn

把请求转发给连接数较少的后端服务器。轮询算法是把请求平均的转发给各个后端，使它们的负载大致相同；但是，有些请求占用的时间很长，会导致其所在的后端负载较高。这种情况下，least_conn这种方式就可以达到更好的负载均衡效果。

配置如下：

```nginx
upstream tomcatservers {
  #把请求转发给连接数较少的后端服务器
  least_conn;
  server 127.0.0.1:8080;
  server 127.0.0.1:8081;
  server 127.0.0.1:8082;
}
```



　注意：

- 此负载均衡策略适合请求处理时间长短不一造成服务器过载的情况。



### 08、fair (收费)

按照服务器端的响应时间来分配请求，响应时间短的优先分配。

```nginx
upstream dynamic_zuoyu {
    server 127.0.0.1:8080 fair;
 	server 127.0.0.1:8081; 
  	server 127.0.0.1:8082;
}
```





### 09、总结

以上便是6种负载均衡策略的实现方式，其中除了轮询和轮询权重外，都是Nginx根据不同的算法实现的。在实际运用中，需要根据不同的场景选择性运用，大都是多种策略结合使用以达到实际需求。



## 09、杂项



### 1、Nginx启动失败找不到 pid文件如何处理

1、在启动的过程中，如果出现了"/var/run/nginx/nginx.pid failed "错误信息的时候。

- 一般是文件目录不存在

  ```sh
  cd /var/run/nginx
  ```

- 或者文件被误删

2、解决方案：

- 重新创建此目录即可

  ```sh
  mkdir -p /var/run/nginx/
  ```

- 如果重启过程中报错如下异常：

  ```nginx
  nginx -s reload
  ```

- 就用指定的nginx.conf文件进行启动

  ```sh
  nginx -c /usr/local/nginx/conf/nginx.conf
  ```

- 然后在重启启动nginx服务

  ```sh
  nginx -s reload
  ```

  



### 2、优雅的关闭nginx服务 

```sh
# 强制关闭
nginx -s stop
# 如果用户请求还正在与nginx 服务正在打交道，这个时候是不会退出nginx服务。直到用户的连接响应完毕才关闭
nginx -s quit
```



### 3、查看Nginx的配置 

查看nginx安装目录和日志的目录，就使用nginx -V 

但是前提是：你必须是使用`./configuration`的指定目录安全。

```sh
nginx -V
```

```sh
[root@iZuf62zev3la2ivndnxra5Z nginx]# nginx -V
nginx version: nginx/1.20.1
built by gcc 4.8.5 20150623 (Red Hat 4.8.5-44) (GCC) 
built with OpenSSL 1.0.2k-fips  26 Jan 2017
TLS SNI support enabled
configure arguments: --prefix=/usr/local/nginx/nginx --pid-path=/var/run/nginx/nginx.pid --lock-path=/var/lock/nginx.lock --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --with-http_gzip_static_module --http-client-body-temp-path=/var/temp/nginx/client --http-proxy-temp-path=/var/temp/nginx/proxy --http-fastcgi-temp-path=/var/temp/nginx/fastgi --http-uwsgi-temp-path=/var/temp/nginx/uwsgi --http-scgi-temp-path=/var/temp/nginx/scgi --with-http_stub_status_module --with-http_ssl_module
```





### 4、Nginx日志文件分割

现有的日志都会存在 access.log 文件中，但是随着时间的推移，这个文件的内容会越来越多，体积会越来越大，不便于运维人员查看，所以我们可以通过把

文件切割为多份不同的小文件作为日志，切割规则可以以 天 为单位，如果每天有几百G或者几个T的日志的话，则可以按需以 每半天 

或者 每小时 对日志切割一

**具体步骤如下：**

1. 创建一个shell可执行文件： cutlogs.sh ，内容为：

   ```sh
   #!/bin/bash 
   LOG_PATH="/var/log/nginx" 
   RECORD_TIME=$(date -d "yesterday" +%Y-%m-%d+%H:%M) 
   PID=/usr/local/nginx/logs/nginx.pid 
   mv ${LOG_PATH}/access.log ${LOG_PATH}/access.${RECORD_TIME}.log 
   mv ${LOG_PATH}/error.log ${LOG_PATH}/error.${RECORD_TIME}.log 
   kill -USR1 `cat $PID`
   ```

2. 为 cutlogs.sh 添加可执行的权限

   ```sh
   chmod +x cutlogs.sh 
   ```

3. 测试日志切割后的结果: 

   ```sh
   ./cutlogs.sh
   ```

   ![log](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_log1.png)



### 5、Nginx的日志文件自动切割

**Nginx** **日志切割****-****定时**

**使用定时任务** 

1. 安装定时任务：

```sh
yum install crontabs 
```

2. crontab -e 编辑并且添加一行新的任务：

```sh
crontab -e
```

```sh
*/1 * * * * /usr/local/nginx/cutlogs.sh
```

3. 重启定时任务：

```sh
service crond restart
```

- 附：常用定时任务命令：

```sh
service crond start //启动服务 
service crond stop //关闭服务 
service crond restart //重启服务 
service crond reload //重新载入配置 
crontab -e // 编辑任务 
crontab -l // 查看任务列表 
```

**定时任务表达式：**

Cron表达式是，分为5或6个域，每个域代表一个含义，如下所示：

![time](https://gavvy-cloud.oss-cn-shenzhen.aliyuncs.com/web/nginx_cronTime.png)

**常用表达式：**

每分钟执行：

```sh
*/1 * * * *
```

每日凌晨（每天晚上23:59）执行：

```sh
59 23 * * *
```

每日凌晨1点执行：

```sh
0 1 * * *
```



> 每天定时为数据库备份：https://www.cnblogs.com/leechenxiang/p/7110382.html















