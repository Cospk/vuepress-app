---
# 这是文章的标题
title: git使用规范

# 这是页面的图标
icon: /assets/icon/github.png
# 设置作者
author: xiaoxie
# 设置写作时间
date: 2020-01-01
# 一个页面可以有多个分类
tag:
  - git

# 此页面会出现在星标文章中
star: true
---





## git commit消息规范



```bash
格式：
<type>(<scope>): <description>

[optional body]

[optional footer]
```

1. type（必须）- 提交类型：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档修改
- `style`: 代码格式修改（不影响代码运行的变动）
- `refactor`: 代码重构（既不是新增功能，也不是修改 bug 的代码变动）
- `perf`: 优化相关（提升性能、体验的改动）
- `test`: 测试相关
- `build`: 构建系统或外部依赖项的更改
- `ci`: CI/CD 相关的改动
- `chore`: 其他修改（不修改 src 或测试文件）
- `revert`: 回滚之前的 commit



2. scope（可选）- 影响范围：

```bash
feat(user): add user login function
fix(auth): fix authentication bug
```

3. description - 简短描述：

- 使用现在时态（"change" 而不是 "changed" 或 "changes"）
- 不要首字母大写
- 结尾不要加句号

```bash
# 新功能
git commit -m "feat: add login page"
git commit -m "feat(auth): implement OAuth login"

# Bug 修复
git commit -m "fix: resolve memory leak issue"
git commit -m "fix(db): fix database connection timeout"

# 文档更新
git commit -m "docs: update README.md"
git commit -m "docs(api): update API documentation"

# 代码重构
git commit -m "refactor: optimize user service structure"
git commit -m "refactor(cart): simplify shopping cart logic"

# 性能优化
git commit -m "perf: improve search performance"

# 测试相关
git commit -m "test: add unit tests for user service"
```

如果需要写更详细的描述，可以这样：

```bash
git commit -m "feat(auth): implement user authentication
    
This commit adds user authentication functionality including:
- Login with email/password
- OAuth integration with Google
- Password reset flow
    
BREAKING CHANGE: Auth API endpoints have been updated"
```





## 分支管理

1. 分支命名规范

   ：

   - 功能分支：`feature/user-authentication`
   - 修复分支：`bugfix/login-crash`
   - 发布分支：`release/v1.2.0`
   - 热修复分支：`hotfix/security-patch`

2. 分支策略

   ：

   - 遵循 Git Flow 或 GitHub Flow 等工作流程
   - 主分支（main/master）保持稳定，只接受合并请求
   - 开发在功能分支中进行，完成后通过 PR/MR 合并

## 代码审查

1. Pull Request/Merge Request

   ：

   - 提供清晰的描述和背景
   - 关联相关 issue 或任务
   - 在合并前解决所有评审意见

2. 代码审查流程

   ：

   - 至少一名其他开发者审查代码
   - 使用 GitHub/GitLab 的评论功能讨论问题
   - 避免直接推送到保护分支

## 日常工作习惯

1. 保持同步

   ：

   - 频繁拉取更新（`git pull --rebase`）
   - 在开始新工作前同步远程分支

2. 保持工作区干净

   ：

   - 使用 `.gitignore` 忽略不需要版本控制的文件
   - 定期清理不需要的分支
   - 使用 `git stash` 保存临时修改

3. 冲突处理

   ：

   - 及时解决冲突，避免积累
   - 理解冲突原因，谨慎选择保留的更改
   - 冲突较大时与相关开发者沟通

## 高级技巧

1. 使用合适的合并策略

   ：

   - 考虑 `--rebase` 还是 `--merge`
   - 对历史要求严格的项目使用 `squash` 合并
   - 了解何时使用 `git cherry-pick`

2. 保护敏感信息

   ：

   - 不要提交密码、密钥、令牌等敏感信息
   - 使用环境变量或专门的密钥管理工具
   - 了解如何使用 `git filter-branch` 或 BFG 工具清理历史中的敏感数据

3. 良好习惯

   ：

   - 提交前检查修改（`git diff --staged`）
   - 使用 `git add -p` 分阶段添加更改
   - 定期做单元测试和集成测试

## 团队协作

1. 文档化

   ：

   - 维护清晰的 README.md
   - 记录分支策略和工作流程
   - 提供贡献指南（CONTRIBUTING.md）

2. 自动化流程

   ：

   - 设置 CI/CD 管道
   - 使用预提交钩子（lint, format, test）
   - 自动化版本发布流程

