import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/vuepress-app/",

  lang: "zh-CN",
  title: "Golang全栈指南",


  
  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
