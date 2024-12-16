import { navbar } from "vuepress-theme-hope";

export default navbar([
  {
    text: "首页",
    icon: "home",
    link: "/doc/page/",
    activeMatch: "/doc/page/$",
  },
  {
    text: "golang",
    icon: "fa-golang",
    prefix: "/doc/golang/",
    activeMatch: "/doc/golang",
    children: [
      {
        text: "Go基础",
        icon: "/assets/icon/abc.png",
        link: "基础/"
      },
      {
        text: "Go进阶",
        icon: "/assets/icon/up.png",
        link: "原理/"
      },
      {
        text: "面试",
        icon: "/assets/icon/meet.png",
        link: "面试/"
      },
    ]
  },
  {
    text: "中间件",
    icon: "layer-group",
    prefix: "/doc/middleware/",
    children: [
      {
        text: "MySql",
        icon: "/assets/icon/mysql.png",
        link: "数据库/mysql"
      },
      {
        text: "Redis",
        icon: "/assets/icon/redis.png",
        link: "数据库/redis"
      },
      {
        text: "MongoDB",
        icon: "/assets/icon/mongodb.png",
        link: "数据库/mongodb"
      },
      {
        text: "kafka",
        icon: "/assets/icon/Kafka.png",
        link: "消息组件/kafka"
      },
      {
        text: "Nginx",
        icon: "/assets/icon/Nginx.png",
        link: "网关/nginx"
      },
      {
        text: "Docker",
        icon: "/assets/icon/docker.png",
        link: "运维/docker"
      },
      {
        text: "Kubernetes",
        icon: "/assets/icon/kubernetes.png",
        link: "运维/k8s"
      },
    ]

  },
  {
    text: "架构",
    icon: "network-wired",
    prefix: "/doc/framework/",
    activeMatch: "^/doc/framework/$",
    children: [
      {
        text: "微服务",
        icon: "/assets/icon/micro.png",
        link: "微服务/"
      },
      {
        text: "分布式",
        icon: "/assets/icon/kubernetes.png",
        link: "分布式/"
      },
      {
        text: "高可用",
        icon: "/assets/icon/available.png",
        link: "高可用/"
      },
      {
        text: "领域驱动",
        icon: "/assets/icon/DDD.png",
        link: "领域驱动/"
      },
    ]
  },
  {
    text: "计算机",
    icon: "fa-solid fa-computer",
    prefix: "computer",
    activeMatch: "^/doc/computer/$",
    children: [
      {
        text: "计算机网络",
        icon: "globe",
        link: "network/"
      },
      {
        text: "常用算法",
        icon: "/assets/icon/arithmetic.png",
        link: "算法/"
      },
      {
        text: "设计模式",
        icon: "pen-ruler",
        link: "设计模式/"
      },

    ]
  },
  {
    text: "好物分享",
    icon: "share-nodes",
    link: "/doc/share/",
    activeMatch: "^/doc/share/",
  },
  // {
  //   text: "关于作者",
  //   icon: "id-card",
  //   link: "/doc/id-card",
  //   activeMatch: "^/doc/id-card",
  // }
]);
