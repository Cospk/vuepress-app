# Zap

Zap是一个用Go构建的，快速的 ，结构化，级别化的日志组件。



官方仓库：[uber-go/zap: Blazing fast, structured, leveled logging in Go. (github.com)](https://github.com/uber-go/zap)

官方文档：[zap package - go.uber.org/zap - Go Packages](https://pkg.go.dev/go.uber.org/zap)



## 安装

```
go get -u go.uber.org/zap
```



## 快速开始

官方给出了两个快速开始的示例，两个都是产品级别的日志，第一个是一个支持`printf`风格但是性能相对较低的`Sugar`。

```go
logger, _ := zap.NewProduction()
defer logger.Sync() // 在程序结束时将缓存同步到文件中
sugar := logger.Sugar()
sugar.Infow("failed to fetch URL",
  "url", url,
  "attempt", 3,
  "backoff", time.Second,
)
sugar.Infof("Failed to fetch URL: %s", url)
```

第二个是性能比较好，但是仅支持强类型输出的日志·`logger`

```go
logger, _ := zap.NewProduction()
defer logger.Sync()
logger.Info("failed to fetch URL",
  // Structured context as strongly typed Field values.
  zap.String("url", url),
  zap.Int("attempt", 3),
  zap.Duration("backoff", time.Second),
)
```



::: tip

Zap的使用非常简单，麻烦的点在于配置出一个适合自己项目的日志，官方例子很少，要多读源代码注释。

:::

## 配置

一般来说日志的配置都是写在配置文件里的，Zap的配置也支持通过配置文件反序列化，但是仅支持基础的配置，即便是高级配置官方给出的例子也是十分简洁，并不足以投入使用，所以要详细讲一下细节的配置。

首先看一下总体的配置结构体，需要先搞明白里面的每一个字段的含义

```go
type Config struct {
    // 最小日志级别
   Level AtomicLevel `json:"level" yaml:"level"` 
    // 开发模式，主要影响堆栈跟踪
   Development bool `json:"development" yaml:"development"` 
    // 调用者追踪
   DisableCaller bool `json:"disableCaller" yaml:"disableCaller"`
    // 堆栈跟踪
   DisableStacktrace bool `json:"disableStacktrace" yaml:"disableStacktrace"`
    // 采样，在限制日志对性能占用的情况下仅记录部分比较有代表性的日志，等于日志选择性记录
   Sampling *SamplingConfig `json:"sampling" yaml:"sampling"`
    // 编码，分为json和console两种模式
   Encoding string `json:"encoding" yaml:"encoding"`
    // 编码配置，主要是一些输出格式化的配置
   EncoderConfig zapcore.EncoderConfig `json:"encoderConfig" yaml:"encoderConfig"`
    // 日志文件输出路径
   OutputPaths []string `json:"outputPaths" yaml:"outputPaths"`
    // 错误文件输出路径
   ErrorOutputPaths []string `json:"errorOutputPaths" yaml:"errorOutputPaths"`
    // 给日志添加一些默认输出的内容
   InitialFields map[string]interface{} `json:"initialFields" yaml:"initialFields"`
}
```

如下是关于编码配置的细节

```go
type EncoderConfig struct {
   // 键值，如果key为空，那么对于的属性将不会输出
   MessageKey     string `json:"messageKey" yaml:"messageKey"`
   LevelKey       string `json:"levelKey" yaml:"levelKey"`
   TimeKey        string `json:"timeKey" yaml:"timeKey"`
   NameKey        string `json:"nameKey" yaml:"nameKey"`
   CallerKey      string `json:"callerKey" yaml:"callerKey"`
   FunctionKey    string `json:"functionKey" yaml:"functionKey"`
   StacktraceKey  string `json:"stacktraceKey" yaml:"stacktraceKey"`
   SkipLineEnding bool   `json:"skipLineEnding" yaml:"skipLineEnding"`
   LineEnding     string `json:"lineEnding" yaml:"lineEnding"`
   // 一些自定义的编码器
   EncodeLevel    LevelEncoder    `json:"levelEncoder" yaml:"levelEncoder"`
   EncodeTime     TimeEncoder     `json:"timeEncoder" yaml:"timeEncoder"`
   EncodeDuration DurationEncoder `json:"durationEncoder" yaml:"durationEncoder"`
   EncodeCaller   CallerEncoder   `json:"callerEncoder" yaml:"callerEncoder"`
   // 日志器名称编码器
   EncodeName NameEncoder `json:"nameEncoder" yaml:"nameEncoder"`
   // 反射编码器，主要是对于interface{}类型，如果没有默认jsonencoder
   NewReflectedEncoder func(io.Writer) ReflectedEncoder `json:"-" yaml:"-"`
   // 控制台输出间隔字符串
   ConsoleSeparator string `json:"consoleSeparator" yaml:"consoleSeparator"`
}
```

`Option`是关于一些配置的开关及应用，有很多实现。

```go
type Option interface {
   apply(*Logger)
}

// Option的实现
type optionFunc func(*Logger)

func (f optionFunc) apply(log *Logger) {
	f(log)
}

// 应用
func Development() Option {
	return optionFunc(func(log *Logger) {
		log.development = true
	})
}
```

这是最常用的日志核心，其内部的字段基本上就代表了我们配置的步骤，也可以参考官方在反序列化配置时的步骤，大致都是一样的。

```go
type ioCore struct {
   // 日志级别
   LevelEnabler
   // 日志编码
   enc Encoder
   // 日志书写
   out WriteSyncer
}
```

`zap.Encoder` 负责日志的格式化，编码

`zap.WriteSyncer` 负责日志的输出，主要是输出到文件和控制台

`zap.LevelEnabler` 最小日志级别，该级别以下的日志不会再通过`syncer`输出。

### 日志编码

日志编码主要涉及到对于日志的一些细节的格式化，首先看一下直接使用最原始的日志的输出。

```go
func TestQuickStart(t *testing.T) {
   rawJSON := []byte(`{
     "level": "debug",
     "encoding": "json",
     "outputPaths": ["stdout"],
     "errorOutputPaths": ["stderr"],
     "initialFields": {"foo": "bar"},
     "encoderConfig": {
       "messageKey": "message",
       "levelKey": "level",
       "levelEncoder": "lowercase"
     }
   }`)

   var cfg zap.Config
   if err := json.Unmarshal(rawJSON, &cfg); err != nil {
      panic(err)
   }
   logger := zap.Must(cfg.Build())
   defer logger.Sync()

   logger.Info("logger construction succeeded")
}
```

```
{"level":"info","message":"logger construction succeeded","foo":"bar"}
```

会发现这行日志有几个问题：

- 没有时间
- 没有调用者的情况，不知道这行日志是哪里输出的，不然到时候发生错误的话都没法排查
- 没有堆栈情况

接下来就一步一步的来解决问题，主要是对`zapcore.EncoderConfig`来进行改造，首先我们要自己书写配置文件，不采用官方的直接反序列化。首先自己创建一个配置文件`config.yml`

```yml
# Zap日志配置
zap:
  prefix: ZapLogTest
  timeFormat: 2006/01/02 - 15:04:05.00000
  level: debug
  caller: true
  stackTrace: false
  encode: console
  # 日志输出到哪里 file | console | both
  writer: both
  logFile:
    maxSize: 20
    backups: 5
    compress: true
    output:
      - "./log/output.log"
```

映射到的结构体

```go
// ZapConfig
// @Date: 2023-01-09 16:37:05
// @Description: zap日志配置结构体
type ZapConfig struct {
	Prefix     string         `yaml:"prefix" mapstructure:""prefix`
	TimeFormat string         `yaml:"timeFormat" mapstructure:"timeFormat"`
	Level      string         `yaml:"level" mapstructure:"level"`
	Caller     bool           `yaml:"caller" mapstructure:"caller"`
	StackTrace bool           `yaml:"stackTrace" mapstructure:"stackTrace"`
	Writer     string         `yaml:"writer" mapstructure:"writer"`
	Encode     string         `yaml:"encode" mapstructure:"encode"`
	LogFile    *LogFileConfig `yaml:"logFile" mapstructure:"logFile"`
}

// LogFileConfig
// @Date: 2023-01-09 16:38:45
// @Description: 日志文件配置结构体
type LogFileConfig struct {
	MaxSize  int      `yaml:"maxSize" mapstructure:"maxSize"`
	BackUps  int      `yaml:"backups" mapstructure:"backups"`
	Compress bool     `yaml:"compress" mapstructure:"compress"`
	Output   []string `yaml:"output" mapstructure:"output"`
	Errput   []string `yaml:"errput" mapstructure:"errput"`
}
```

::: tip

读取配置使用`Viper`，具体代码省略。

:::

```go
type TimeEncoder func(time.Time, PrimitiveArrayEncoder)
```

`TimerEncoder`本质上其实是一个函数，我们可以采用官方提供的其他时间编码器，也可以自行编写。

```go
func CustomTimeFormatEncoder(t time.Time, encoder zapcore.PrimitiveArrayEncoder) {
   encoder.AppendString(global.Config.ZapConfig.Prefix + "\t" + t.Format(global.Config.ZapConfig.TimeFormat))
}
```

整体部分如下

```go
func zapEncoder(config *ZapConfig) zapcore.Encoder {
   // 新建一个配置
   encoderConfig := zapcore.EncoderConfig{
      TimeKey:       "Time",
      LevelKey:      "Level",
      NameKey:       "Logger",
      CallerKey:     "Caller",
      MessageKey:    "Message",
      StacktraceKey: "StackTrace",
      LineEnding:    zapcore.DefaultLineEnding,
      FunctionKey:   zapcore.OmitKey,
   }
   // 自定义时间格式
   encoderConfig.EncodeTime = CustomTimeFormatEncoder
   // 日志级别大写
   encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
   // 秒级时间间隔
   encoderConfig.EncodeDuration = zapcore.SecondsDurationEncoder
   // 简短的调用者输出
   encoderConfig.EncodeCaller = zapcore.ShortCallerEncoder
   // 完整的序列化logger名称
   encoderConfig.EncodeName = zapcore.FullNameEncoder
   // 最终的日志编码 json或者console
   switch config.Encode {
   case "json":
      {
         return zapcore.NewJSONEncoder(encoderConfig)
      }
   case "console":
      {
         return zapcore.NewConsoleEncoder(encoderConfig)
      }
   }
   // 默认console
   return zapcore.NewConsoleEncoder(encoderConfig)
}
```

### 日式输出

日志输出分为控制台输出和文件输出，我们可以根据配置文件来进行动态配置，并且如果想要进行日志文件切割的话还需要使用另一个第三方的依赖。

```
go get -u github.com/natefinch/lumberjack
```

最后代码如下

```go
 func zapWriteSyncer(cfg *ZapConfig) zapcore.WriteSyncer {
   syncers := make([]zapcore.WriteSyncer, 0, 2)
   // 如果开启了日志控制台输出，就加入控制台书写器
   if cfg.Writer == config.WriteBoth || cfg.Writer == config.WriteConsole {
      syncers = append(syncers, zapcore.AddSync(os.Stdout))
   }

   // 如果开启了日志文件存储，就根据文件路径切片加入书写器
   if cfg.Writer == config.WriteBoth || cfg.Writer == config.WriteFile {
      // 添加日志输出器
      for _, path := range cfg.LogFile.Output {
         logger := &lumberjack.Logger{
            Filename:   path, //文件路径
            MaxSize:    cfg.LogFile.MaxSize, //分割文件的大小
            MaxBackups: cfg.LogFile.BackUps, //备份次数
            Compress:   cfg.LogFile.Compress, // 是否压缩
            LocalTime:  true, //使用本地时间
         }
         syncers = append(syncers, zapcore.Lock(zapcore.AddSync(logger)))
      }
   }
   return zap.CombineWriteSyncers(syncers...)
}
```



### 日志级别

官方有关于日志级别的枚举项，直接使用即可。

```go
func zapLevelEnabler(cfg *ZapConfig) zapcore.LevelEnabler {
   switch cfg.Level {
   case config.DebugLevel:
      return zap.DebugLevel
   case config.InfoLevel:
      return zap.InfoLevel
   case config.ErrorLevel:
      return zap.ErrorLevel
   case config.PanicLevel:
      return zap.PanicLevel
   case config.FatalLevel:
      return zap.FatalLevel
   }
   // 默认Debug级别
   return zap.DebugLevel
}
```



### 最后构建

```go
func InitZap(config *ZapConfig) *zap.Logger {
   // 构建编码器
   encoder := zapEncoder(config)
   // 构建日志级别
   levelEnabler := zapLevelEnabler(config)
   // 最后获得Core和Options
   subCore, options := tee(config, encoder, levelEnabler)
    // 创建Logger
   return zap.New(subCore, options...)
}

// 将所有合并
func tee(cfg *ZapConfig, encoder zapcore.Encoder, levelEnabler zapcore.LevelEnabler) (core zapcore.Core, options []zap.Option) {
   sink := zapWriteSyncer(cfg)
   return zapcore.NewCore(encoder, sink, levelEnabler), buildOptions(cfg, levelEnabler)
}

// 构建Option
func buildOptions(cfg *ZapConfig, levelEnabler zapcore.LevelEnabler) (options []zap.Option) {
   if cfg.Caller {
      options = append(options, zap.AddCaller())
   }

   if cfg.StackTrace {
      options = append(options, zap.AddStacktrace(levelEnabler))
   }
   return
}
```

最后效果

```
ZapLogTest      2023/01/09 - 19:44:00.91076     INFO    demo/zap.go:49     日志初始化完成
```





## lumberjack 日志切割组件

 Golang 语言标准库的 log 包和 zap 日志库 不支持日志切割，然而如果我们业务每天产生海量日志，日志文件就会越来越大，甚至会触发磁盘空间不足的报警，此时如果我们移动或者删除日志文件，需要先将业务停止写日志，很不方便。

 而且大日志文件也不方便查询，多少有点失去日志的意义。所以实际业务开发中，我们通常会按照日志文件大小或者日期进行日志切割。

Golang 语言第三方库 `lumberjack` 的作用就是进行日志切割；

`lumberjack `提供了一个滚动记录器 logger，它是一个控制写入日志的文件的日志组件，目前最新版本是 v2.0，需要使用 `gopkg.in` 导入。



1. 安装：

   ```go
   go get -u github.com/natefinch/lumberjack
   ```

2. 导入方式：

   ```go
   import "gopkg.in/natefinch/lumberjack.v2"
   ```

3. 使用：

   - 与标准库的 log 包一起使用，只需在应用程序启动时将它传递到 SetOutput 函数即可：

     ```go
     log.SetOutput(&lumberjack.Logger{
         Filename:   "./log/test.log",
         MaxSize:    1, // 单位: MB
         MaxBackups: 3,
         MaxAge:     28, //单位: 天
         Compress:   true, // 默认情况下禁用
     })
     ```

   - 与Go第三方库zap 一起使用：

     ```go
     func getLogWriter(filename string, maxsize, maxBackup, maxAge int) zapcore.WriteSyncer {
         lumberJackLogger := &lumberjack.Logger{
             Filename:   filename,  // 文件位置
             MaxSize:    maxsize,   // 进行切割之前,日志文件的最大大小(MB为单位)
             MaxAge:     maxAge,    // 保留旧文件的最大天数
             MaxBackups: maxBackup, // 保留旧文件的最大个数
             Compress:   false,     // 是否压缩/归档旧文件
         }
         // AddSync 将 io.Writer 转换为 WriteSyncer。
         // 它试图变得智能：如果 io.Writer 的具体类型实现了 WriteSyncer，我们将使用现有的 Sync 方法。
         // 如果没有，我们将添加一个无操作同步。
         return zapcore.AddSync(lumberJackLogger)
     }
     ```

   可以看出，重点在`lumberjack.Logger`上，查看源码我们可以知道：

   1. Logger 是一个写入指定文件名的 io.WriteCloser。

   2. Logger 在第一次写入时打开或创建日志文件。如果文件存在并且小于 MaxSize 兆字节，lumberjack 将打开并附加到该文件。如果文件存在并且其大小 >= MaxSize 兆字节，则通过将当前时间放在文件扩展名之前的名称中的时间戳中来重命名文件（如果没有扩展名，则放在文件名的末尾）。然后使用原始文件名创建一个新的日志文件。

      每当写入会导致当前日志文件超过 MaxSize 兆字节时，当前文件将被关闭、重命名，并使用原始名称创建新的日志文件。因此，你给 Logger 的文件名始终是“当前”日志文件。

      

      可以看到，原文件写到MaxSize大小之后，会被重命名，格式为：原文件名+当前时间（时间格式为time.Time 格式），而创建一个新的文件，命名为原文件名。

   3. 备份

      备份使用提供给 Logger 的日志文件名，格式为 `name-timestamp.ext` 其中 `name `是不带扩展名的文件名，`timestamp `是使用 time.Time 格式格式化的日志轮换时间`2006-01-02T15-04-05.000`，扩展名`ext`是原始扩展名。

      例如，如果您的 Logger.Filename 是`/var/log/foo/server.log`，则在 2016 年 11 月 11 日下午 6:30 创建的备份将使用文件名 `/var/log/foo/server-2016- 11-04T18-30-00.000.log`

   4. 清理旧的日志文件
      每当创建新的日志文件时，可能会删除旧的日志文件。根据编码时间戳的最新文件将被保留，最多等于 MaxBackups 的数量（如果 MaxBackups 为 0，则保留所有文件）。无论 MaxBackups 是什么，任何编码时间戳早于 MaxAge 天的文件都会被删除。请注意，时间戳中编码的时间是轮换时间，可能与上次写入该文件的时间不同。

   5. 如果 MaxBackups 和 MaxAge 都为 0，则不会删除旧的日志文件。

   ```go
   type Logger struct {
   	// Filename 写入日志的文件。备份的日志文件将保留在同一目录下。
   	// 如果为空，则在os.TempDir()中使用-lumberjack.log。
   	Filename string `json:"filename" yaml:"filename"`
   
   	// MaxSize 是日志文件在轮换之前的最大大小（以 MB 为单位）。默认为 100 兆字节。
   	MaxSize int `json:"maxsize" yaml:"maxsize"`
   
   	// MaxAge 是根据文件名中编码的时间戳保留旧日志文件的最大天数。
   	// 请注意，一天被定义为 24 小时，由于夏令时、闰秒等原因，可能与日历日不完全对应。
   	// 默认情况下不会根据年龄删除旧日志文件。
   	MaxAge int `json:"maxage" yaml:"maxage"`
   
   	// MaxBackups 是要保留的旧日志文件的最大数量。
   	// 默认是保留所有旧的日志文件（尽管 MaxAge 可能仍会导致它们被删除。）
   	MaxBackups int `json:"maxbackups" yaml:"maxbackups"`
   
   	// LocalTime 确定用于格式化备份文件中时间戳的时间是否是计算机的本地时间。默认是使用 UTC 时间。
   	LocalTime bool `json:"localtime" yaml:"localtime"`
   
   	// Compress 确定是否应使用 gzip 压缩旋转的日志文件。默认是不执行压缩。
   	Compress bool `json:"compress" yaml:"compress"`
   	...
   ```
