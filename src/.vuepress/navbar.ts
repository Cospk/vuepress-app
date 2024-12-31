import { navbar } from "vuepress-theme-hope";

export default navbar([
  {
    text: "首页",
    icon: "home",
    link: "/",
    activeMatch: "^/$",
  },
  {
    text: "golang",
    icon: "laptop-code",
    prefix: "/golang/",
    activeMatch: "^/golang/",
    children: [
      {
        text: "Go基础",
        icon: "eraser",
        link: "基础/"
      },
      {
        text: "Go进阶",
        icon: "/assets/icon/up.png",
        link: "进阶/"
      },
      {
        text: "原理",
        icon: "gears",
        link: "原理/"
      },
      {
        text: "框架",
        icon: "sitemap",
        link: "web框架/"
      },
      {
        text: "面试",
        icon: "feather",
        link: "面试/"
      },
    ]
  },
  {
    text: "中间件",
    icon: "layer-group",
    prefix: "/middleware/",
    activeMatch: "^/middleware/",
    children: [
      {
        text: "MySql",
        icon: "/assets/icon/mysql.png",
        link: "数据库/MySQL"
      },
      {
        text: "Redis",
        icon: "/assets/icon/redis.png",
        link: "数据库/Redis"
      },
      {
        text: "MongoDB",
        icon: "/assets/icon/mongodb.png",
        link: "数据库/MongoDB"
      },
      {
        text: "kafka",
        icon: "/assets/icon/Kafka.png",
        link: "消息组件/kafka"
      },
      {
        text: "Nginx",
        icon: "/assets/icon/Nginx.png",
        link: "网关/Nginx"
      },
      {
        text: "Docker",
        icon: "/assets/icon/docker.png",
        link: "运维/Docker"
      },
      {
        text: "Kubernetes",
        icon: "/assets/icon/kubernetes.png",
        link: "运维/Kubernetes"
      },
    ]

  },
  {
    text: "架构",
    icon: "network-wired",
    prefix: "/framework/",
    activeMatch: "^/framework/",
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
    prefix: "/computer",
    activeMatch: "^/computer/",
    children: [
      {
        text: "计算机网络",
        icon: "globe",
        link: "网络/"
      },
      {
        text: "操作系统",
        icon: "/assets/icon/linux.png",
        link: "操作系统/"
      },

      {
        text: "常用算法",
        icon: "/assets/icon/arithmetic.png",
        link: "0.算法"
      },
      {
        text: "设计模式",
        icon: "pen-ruler",
        link: "1.设计模式"
      },

    ]
  },
  {
    text: "好物分享",
    icon: "share-nodes",
    prefix: "/share",
    activeMatch: "^/share/",
    children: [
      {
        text: "好物分享",
        icon: "share-nodes",
        link: "好物分享"
      },
      {
        text: "git",
        icon: "git-alt",
        link: "git"
      },
    ]
  },
  // {
  //   text: "关于作者",
  //   icon: "id-card",
  //   link: "/doc/id-card",
  //   activeMatch: "^/doc/id-card",
  // }
]);
