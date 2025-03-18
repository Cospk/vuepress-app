

## 组件的选择



- sarama：时间最久，start数10K+
- **kafka-go**：排名第一，start数6.2K+，但是近期飙升很快





## 使用

> 获取组件：go  get  github.com/segmentio/kafka-go



```go


var (
	reader *kafka.Reader
    topic = "user_click"
)

// 生产消息  (1、创建writer对象。2、调用wirte对象的写消息的方法)
func writeKafka(ctx context.Context){
    writer := kafka.Writer{
        Addr: kafka.TCP("localhost:9092"),  // broke的ip和端口号，不定长参数意味着可以有多个broke
        Topic: topic,						// 指定对应的topic
        Balancer: &kafka.Hash(),            // 选择往哪个partition分区写数据，这里根据key用hash算法计算
        WriteTimeout: 1*time.Second,		// 给一个超时时间，防止长时间等待影响主业务，消息一般作为分析，出现问题也允许
        RequireAcks: kafka.RequireNone,     // 是否需要返回ack，
        AllowAutoTopicCreation:true,        // 若是没有对应的topic，是否自动创键，实际上为false，由运维添加
    }
    defer writer.Close
    
    for i := 0;i<3;i++{
        if err := witer.WriteMessage(
    		ctx,
        	kafka.Message{Key:[]byte{"1"},Value:[]byte{"hello"}},
        	kafka.Message{Key:[]byte{"2"},Value:[]byte{"world"}},
        	kafka.Message{Key:[]byte{"1"},Value:[]byte{"!"}},
    	);err!=nil{
        	if err == kafka.LeaderNotAvailable{
            	// 若是leader不可用，可以暂停几秒重试，可能会重新选举
            	time.Sleep(500*time.Millisecond)
            	continue
            }else{
                fmt.Printf("写入数据失败哦:%v\n",err)
            }
        }else{
            // 没有失败就跳出
            break
        }
    }
}
                           
// 消费消息
func readKafka(ctx context.Context){
    reader = kafka.NewReader(kafka.ReaderConfig{
        Broker: []string{"localhost:9092"}, // 多个broker，为此定义一个字符串切片
        Topic: topic,						// 消费的topic
        CommitInterval: 1*time.Second		// 一边消费一边将读到的位置上报集群，这里指定间隔上报的时间
        GroupID: "rec_team"					// 指定是哪个组ID 
        StartOffset: kafka.FirstOffset      // 这个是让新加入的消费方生效，从哪里开始消费
    })
    
    for {
        if message, err := reader.ReadMessage(ctx); err != nil{
            fmt.Printf("读取kafka失败：%v\n",err)
        }else{
            fmt.Printf(""topic=%s,partition=%d, offset=%d, key=%s, value=%s\n",message.Topic, message.Partition,message.offset,string(message.Key),string(message.Value)
        }
    }
}
//注意为什么上面这个reader不直接defer reader.close（）？,程序运行我们关闭或重启这个defer不会执行                   
                       
//需要监听信息2和15，当收到信号时关闭 reader，收到2(SIGINT,也就是Ctrl+C操作)或者15的信号进程会进行收尾工作
func listensignal(){
    c := make(chan os.Signal,1)
    signal.Notify(c,syscall.SIGINT,syscall.SIGTERM)
    sig := <-c
    fmt.Printf("收到系统信号%s",sig.String())
    if reader != nil{
        reader.Close()
    }
    os.Exit(0)
}
                       
func main(){
    ctx := context.Background()
    //writeKafka(ctx)
    
    go listensignal()
    readKafka(ctx)
}
```



:::tip

golang程序在收到Kill命令（如 kill -9）是强制退出，程序需要强制终止，不让清理任何资源，还有调用os.Exit也是立即终止程序属于正常的退出。

为了解决这个问题，一般微服务在main函数会监听系统信号2或者15，来管理一些资源

:::