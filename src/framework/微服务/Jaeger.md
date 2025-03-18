---
# 这是文章的标题
title: Jaeger


# 这是侧边栏的顺序
order: 8
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









- https://github.com/jaegertracing/jaeger-client-go
- 参考文档：https://github.com/jaegertracing/jaeger-client-go/blob/master/config/example_test.go

### 01、整合jaeger组件

```
go get github.com/uber/jaeger-client-go
```

### 02、快速上手jaeger—单span

```go
package main

import (
	"github.com/uber/jaeger-client-go"
	jaegercfg "github.com/uber/jaeger-client-go/config"
	"time"
)

func main() {
	cfg := jaegercfg.Configuration{
		Sampler: &jaegercfg.SamplerConfig{
			Type:  jaeger.SamplerTypeConst,
			Param: 1,
		},
		Reporter: &jaegercfg.ReporterConfig{
			LogSpans:           true,
			LocalAgentHostPort: "127.0.0.1:6831",
		},
		ServiceName: "kuangstudy-mall",
	}

	tracer, closer, err := cfg.NewTracer(jaegercfg.Logger(jaeger.StdLogger))
	if err != nil {
		panic(err)
	}

	defer closer.Close()
	span := tracer.StartSpan("go-cc-web")
	time.Sleep(time.Second)
	defer span.Finish()

}

```

### 03、快速上手jaeger—多span

```go
package main

import (
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	jaegercfg "github.com/uber/jaeger-client-go/config"
	"time"
)

func main() {
	cfg := jaegercfg.Configuration{
		Sampler: &jaegercfg.SamplerConfig{
			Type:  jaeger.SamplerTypeConst,
			Param: 1,
		},
		Reporter: &jaegercfg.ReporterConfig{
			LogSpans:           true,
			LocalAgentHostPort: "127.0.0.1:6831",
		},
		ServiceName: "kuangstudy-mall",
	}

	tracer, closer, err := cfg.NewTracer(jaegercfg.Logger(jaeger.StdLogger))
	if err != nil {
		panic(err)
	}
	defer closer.Close()

	rootSpan := tracer.StartSpan("order-span-main")
	span := tracer.StartSpan("funA", opentracing.ChildOf(rootSpan.Context()))
	time.Sleep(time.Second)
	span.Finish()

	span2 := tracer.StartSpan("funB", opentracing.ChildOf(rootSpan.Context()))
	time.Sleep(time.Second)
	span2.Finish()

	span3 := tracer.StartSpan("funC", opentracing.ChildOf(rootSpan.Context()))
	time.Sleep(time.Second)
	span3.Finish()

	rootSpan.Finish()

}

```



### 04 、设置全局tracer

```go
package main

import (
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	jaegercfg "github.com/uber/jaeger-client-go/config"
	"time"
)

func main() {
	cfg := jaegercfg.Configuration{
		Sampler: &jaegercfg.SamplerConfig{
			Type:  jaeger.SamplerTypeConst,
			Param: 1,
		},
		Reporter: &jaegercfg.ReporterConfig{
			LogSpans:           true,
			LocalAgentHostPort: "127.0.0.1:6831",
		},
		ServiceName: "order-service",
	}

	tracer, closer, err := cfg.NewTracer(jaegercfg.Logger(jaeger.StdLogger))
	if err != nil {
		panic(err)
	}
	defer closer.Close()

	opentracing.SetGlobalTracer(tracer)
	rootSpan := opentracing.StartSpan("order-span-grpc")
	span := opentracing.StartSpan("funA", opentracing.ChildOf(rootSpan.Context()))
	time.Sleep(time.Second)
	span.Finish()

	span2 := opentracing.StartSpan("funB", opentracing.ChildOf(rootSpan.Context()))
	time.Sleep(time.Second)
	span2.Finish()

	span3 := opentracing.StartSpan("funC", opentracing.ChildOf(rootSpan.Context()))
	time.Sleep(time.Second)
	span3.Finish()

	rootSpan.Finish()

}

```

## 02、订单实现链路追踪



```go
package initialize

import (
	"fmt"
	"github.com/apache/rocketmq-client-go/v2"
	"github.com/apache/rocketmq-client-go/v2/consumer"
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	jaegercfg "github.com/uber/jaeger-client-go/config"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"kuangstudy-mall/srvs/order-srv/global"
	"kuangstudy-mall/srvs/order-srv/handler"
	"kuangstudy-mall/srvs/order-srv/proto"
	"kuangstudy-mall/srvs/order-srv/utils/otgrpc"
	"net"
	"os"
	"os/signal"
	"syscall"
)

func InitGrpcServer() {
	port := global.Args.Port
	ip := global.Args.IP

	zap.S().Infof("服务开始启动，端口是：%d，IP是：%s", *port, *ip)

	//初始化jaeger
	cfg := jaegercfg.Configuration{
		Sampler: &jaegercfg.SamplerConfig{
			Type:  jaeger.SamplerTypeConst,
			Param: 1,
		},
		Reporter: &jaegercfg.ReporterConfig{
			LogSpans:           true,
			LocalAgentHostPort: "127.0.0.1:6831",
		},
		ServiceName: "order-srv",
	}

	tracer, closer, err := cfg.NewTracer(jaegercfg.Logger(jaeger.StdLogger))
	if err != nil {
		panic(err)
	}
	opentracing.SetGlobalTracer(tracer)
	server := grpc.NewServer(grpc.UnaryInterceptor(otgrpc.OpenTracingServerInterceptor(tracer)))
	// 开始运行用户服务的注册
	proto.RegisterOrderServer(server, &handler.OrderServer{})
	listener, err := net.Listen("tcp", fmt.Sprintf("%s:%d", *ip, *port))
	if err != nil {
		panic("failed to listen : " + err.Error())
	}

	go func() {
		err = server.Serve(listener)
		if err != nil {
			panic("failed to start gprc : " + err.Error())
		}
	}()

	zap.S().Info("服务启动成功，端口是：%d ", *global.Args.Port)

	// 定义个订单超时归还的监听者
	c, _ := rocketmq.NewPushConsumer(
		consumer.WithNameServer([]string{"47.115.230.36:9876"}),
		consumer.WithGroupName("mxcc-delay-timeout"),
	)

	topic := "order_delay_timeout"
	if err := c.Subscribe(topic, consumer.MessageSelector{}, handler.OrderDelayTimeout); err != nil {
		fmt.Println("读取消息失败")
	}
	_ = c.Start()

	quit := make(chan os.Signal)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	_ = c.Shutdown()
	_ = closer.Close()
	zap.S().Info("注销成功")
}

```

### 3：下单定义链路

```go
func (orderListener *OrderListener) ExecuteLocalTransaction(msg *primitive.Message) primitive.LocalTransactionState {
	/**
	 下单：
		 1：查询购物车中用户选中的商品
		 2：把选中的商品进行价格汇总----访问商品服务---远程服务调用
		 3：库存服务扣减 ---访问库存服务---远程服务调用
		 4: 保存订单的基础信息表
		 5: 保存订单的明细表
		 6: 开启消息队列队形订单的定时归还和修改状态
		 本地事务--分布式事务

	*/
	parentSpan := opentracing.SpanFromContext(orderListener.Ctx)

	// 把消息的订单数据反序列化出来
	var orderInfo model.OrderInfo
	json.Unmarshal(msg.Body, &orderInfo)

	// 1：查询购物车中用户选中的商品
	var shoppingCarts []model.ShoppingCart
	var goodsIds []uint64
	shopCartSpan := opentracing.GlobalTracer().StartSpan("select_shopcart", opentracing.ChildOf(parentSpan.Context()))
	if result := global.DB.Where(&model.ShoppingCart{UserId: orderInfo.UserId, Checked: true}).Find(&shoppingCarts); result.RowsAffected == 0 {
		orderListener.Code = codes.InvalidArgument
		orderListener.Detail = "购物车中没有结算的商品！"
		return primitive.RollbackMessageState
	}
	shopCartSpan.Finish()

	// 这个map是用于后续的计算，解决双重for循环问题
	shoppingCartsMap := map[uint64]int32{}
	var shoppingCartsIds []uint64
	for _, cart := range shoppingCarts {
		goodsIds = append(goodsIds, cart.GoodsId)
		shoppingCartsIds = append(shoppingCartsIds, cart.ID)
		shoppingCartsMap[cart.GoodsId] = cart.Nums
	}

	// 2：把选中的商品进行价格汇总----访问商品服务---远程服务调用
	batchGoodsInfo := proto.BatchGoodsInfo{Ids: goodsIds}
	queryGoodsSpan := opentracing.GlobalTracer().StartSpan("query_goods", opentracing.ChildOf(parentSpan.Context()))
	goodsListResponse, err := GetNacosGoodsClient().BatchGetGoodsList(context.Background(), &batchGoodsInfo)
	if err != nil {
		orderListener.Code = codes.Internal
		orderListener.Detail = "批量查询商品失败"
		return primitive.RollbackMessageState
	}
	queryGoodsSpan.Finish()

	// 获取结算的商品价格
	var totalPrice float32
	var goodsStocksInfos []*proto.GoodsStocksInfo
	var orderGoodsInfos []*model.OrderGoodsInfo
	for _, goods := range goodsListResponse.Data {
		// 计算支付总价
		totalPrice += goods.SalePrice * float32(shoppingCartsMap[goods.Id])
		// 扣减库存使用
		goodsStocksInfos = append(goodsStocksInfos, &proto.GoodsStocksInfo{
			GoodsId: goods.Id,
			Num:     shoppingCartsMap[goods.Id],
		})
		// 准备订单明细和商品的数据
		orderGoodsInfos = append(orderGoodsInfos, &model.OrderGoodsInfo{
			OrderId:    0,
			BaseModel:  model.BaseModel{Status: 1, IsDeleted: 0},
			GoodsId:    goods.Id,
			GoodsName:  goods.Name,
			GoodsPrice: goods.SalePrice,
			GoodsImage: goods.Images,
			GoodsDesc:  goods.Desc,
			Nums:       shoppingCartsMap[goods.Id],
		})
	}

	// 3：库存服务扣减 ---访问库存服务---远程服务调用
	var response proto.GoodsSellListRequest
	response.GoodsList = goodsStocksInfos
	response.OrderNo = orderInfo.OrderNo
	queryInvSpan := opentracing.GlobalTracer().StartSpan("query_inv", opentracing.ChildOf(parentSpan.Context()))
	if _, err := GetNacosGoodsStockClient().GoodsStocksSell(context.Background(), &response); err != nil {
		orderListener.Code = codes.ResourceExhausted
		orderListener.Detail = "扣减库存失败"
		return primitive.RollbackMessageState
	}
	queryInvSpan.Finish()

	// 本地事务解决订单失败问题
	tx := global.DB.Begin()
	// 4: 保存订单
	saveOrderSpan := opentracing.GlobalTracer().StartSpan("save_order", opentracing.ChildOf(parentSpan.Context()))
	if result := tx.Save(&orderInfo); result.RowsAffected == 0 {
		tx.Rollback()
		orderListener.Code = codes.Internal
		orderListener.Detail = "创建订单失败"
		return primitive.CommitMessageState
	}
	saveOrderSpan.Finish()

	// 注意这里要把数据补齐
	orderListener.ID = orderInfo.ID
	orderListener.OrderPrice = totalPrice
	// 订单和订单明细产生管理，就是绑定orderId
	for _, orderGoods := range orderGoodsInfos {
		orderGoods.OrderId = orderInfo.ID
	}

	// 5: 保存订单明细
	saveOrderGoodsSpan := opentracing.GlobalTracer().StartSpan("save_order_goods", opentracing.ChildOf(parentSpan.Context()))
	if result := tx.CreateInBatches(orderGoodsInfos, 100); result.RowsAffected == 0 {
		tx.Rollback()
		orderListener.Code = codes.Internal
		orderListener.Detail = "批量插入订单明细失败"
		return primitive.CommitMessageState
	}
	saveOrderGoodsSpan.Finish()

	deleteShopCartSpan := opentracing.GlobalTracer().StartSpan("delete_shopcart", opentracing.ChildOf(parentSpan.Context()))
	// 6: 删除购物车订单信息--选中的商品
	if result := tx.Unscoped().Delete(&model.ShoppingCart{}, shoppingCartsIds); result.RowsAffected == 0 {
		tx.Rollback()
		orderListener.Code = codes.Internal
		orderListener.Detail = "删除购物车记录失败"
		return primitive.CommitMessageState
	}
	deleteShopCartSpan.Finish()
	// 7: 发送超时订单
	// 1: 创建一个生产者
	p, err := rocketmq.NewProducer(
		producer.WithInstanceName(strconv.FormatInt(time.Now().UnixNano(), 10)),
		producer.WithNsResolver(primitive.NewPassthroughResolver([]string{"47.115.230.36:9876"})),
		producer.WithRetry(2),
	)

	if err != nil {
		zap.S().Errorf("生成Producer失败，%s", err.Error())
		panic("生成Producer失败")
	}

	if err := p.Start(); err != nil {
		fmt.Println("启动生产者失败,%s", err.Error())
		panic("启动生产者失败")
	}

	topic := "order_delay_timeout"
	message := primitive.NewMessage(topic, msg.Body)
	message.WithDelayTimeLevel(16)
	_, err = p.SendSync(context.Background(), message)
	if err != nil {
		zap.S().Errorf("发送延时消息失败，%v \n", err)
		tx.Rollback()
		orderListener.Code = codes.Internal
		orderListener.Detail = "发送延时消息失败"
		return primitive.CommitMessageState
	}

	tx.Commit() // commit意味所有的业务执行是正常的，就直接执行超时订单归还的业务。
	orderListener.Code = codes.OK
	return primitive.RollbackMessageState // 这里为什么是rollback
}

func (orderListener *OrderListener) CheckLocalTransaction(msg *primitive.MessageExt) primitive.LocalTransactionState {
	var orderInfo model.OrderInfo
	json.Unmarshal(msg.Body, &orderInfo)
	// 根据订单编号查询订单是否存在, 如果不存在也要进行
	if result := global.DB.Where(model.OrderInfo{OrderNo: orderInfo.OrderNo}).First(&orderInfo); result.RowsAffected == 0 {
		// 根据订单编号去查询，如果查询不到，就意味着你需要进行库存归还。
		return primitive.CommitMessageState
	}
	return primitive.RollbackMessageState // 这里为什么是rollback
}

// 创建订单
func (handler *OrderServer) CreateGoodsOrder(ctx context.Context, req *proto.OrderRequest) (*proto.OrderInfoResponse, error) {
	orderListener := OrderListener{Ctx: ctx}
	// 1: 创建一个订单归还的生产者
	p, err := rocketmq.NewTransactionProducer(
		&orderListener,
		producer.WithInstanceName(strconv.FormatInt(time.Now().UnixNano(), 10)),
		producer.WithNsResolver(primitive.NewPassthroughResolver([]string{"47.115.230.36:9876"})),
		producer.WithRetry(2),
	)

	if err != nil {
		zap.S().Errorf("生成Producer失败，%s", err.Error())
		return nil, err
	}

	if err := p.Start(); err != nil {
		fmt.Println("启动生产者失败,%s", err.Error())
		return nil, err
	}

	// 确定消息结构和主题
	topic := "order_transcation_reback"
	// 消息元数据
	orderInfoMessage := model.OrderInfo{
		OrderNo:     CreateOrderSn(req.UserId),
		UserId:      req.UserId,
		Address:     req.Address,
		Post:        req.Post,
		SingerName:  req.Username,
		SingerPhone: req.Mobile,
	}
	// 这里就是订单是否触发归还的业务消息处理
	orderMessage, _ := json.Marshal(orderInfoMessage)
	_, err = p.SendMessageInTransaction(context.Background(), primitive.NewMessage(topic, orderMessage))
	if err != nil {
		fmt.Printf("发送消息失败了: %s\n", err)
		return nil, status.Error(codes.Internal, "发送订单消息失败!")
	}

	// 捕捉orderListener的事务方法ExecuteLocalTransaction的返回，
	if orderListener.Code != codes.OK {
		return nil, status.Error(orderListener.Code, orderListener.Detail)
	}

	// 7: 返回
	return &proto.OrderInfoResponse{
		Id:          orderListener.ID,
		PayPrice:    orderListener.OrderPrice,
		UserId:      req.UserId,
		OrderNo:     orderInfoMessage.OrderNo,
		PayType:     orderInfoMessage.PayType,
		OrderStatus: orderInfoMessage.OrderStatus,
		Username:    req.Username,
		Address:     req.Address,
		Mobile:      req.Mobile,
		Post:        req.Post,
		AddTime:     orderInfoMessage.PayTime.Format("2006-01-02 15:04:05"),
	}, nil
}

```

改变代码：

```go
orderListener := OrderListener{Ctx: ctx}
// 1: 创建一个订单归还的生产者
p, err := rocketmq.NewTransactionProducer(
    &orderListener,
    producer.WithInstanceName(strconv.FormatInt(time.Now().UnixNano(), 10)),
    producer.WithNsResolver(primitive.NewPassthroughResolver([]string{"47.115.230.36:9876"})),
    producer.WithRetry(2),
)
```

新增了几个span。

### 4：测试下单

```go
package main

import (
	"context"
	"fmt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"kuangstudy-mall/srvs/order-srv/proto"
)

var orderClient proto.OrderClient

func InitClient() {
	conn, err := grpc.Dial("127.0.0.1:9500", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		panic(err)
	}
	orderClient = proto.NewOrderClient(conn)
}

func CreateOrder() {
	request := proto.OrderRequest{UserId: 1, Username: "feige", Address: "广州", Mobile: "155887878", Post: "412511"}
	order, err := orderClient.CreateGoodsOrder(context.Background(), &request)
	if err != nil {
		panic(err)
	}
	fmt.Println(order)
}

func main() {
	InitClient()
	CreateOrder()
}

```

### 5：结果





