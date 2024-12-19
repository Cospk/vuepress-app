这是一个GitHub Actions工作流配置文件,用于自动部署VuePress文档到GitHub Pages

工作流程说明:

1. 触发条件:当代码推送到main分支时触发

2. 权限配置:

- contents: write  # 允许工作流写入仓库内容

3. 具体任务步骤:

a. 检出代码

- 使用actions/checkout@v4

- fetch-depth: 0 获取完整git历史

- 可选:启用git子模块

b. 环境准备

- 设置pnpm包管理器

- 设置Node.js环境(v22)并配置pnpm缓存

c. 构建过程

- 启用corepack

- 使用pnpm安装项目依赖

- 执行文档构建命令

- 创建.nojekyll文件阻止GitHub Pages使用Jekyll处理

d. 部署

- 使用JamesIves/github-pages-deploy-action

- 将构建产物部署到gh-pages分支

- 部署目录为src/.vuepress/dist