## 思维导图

语法：

````markmap
---
markmap:
  colorFreezeLevel: 2
---

# markmap

## 链接

- <https://markmap.js.org/>
- [GitHub](https://github.com/markmap/markmap)

## 功能

- 链接
- **强调** ~~删除线~~ *斜体* ==高亮==
- 多行
  文字
- `行内代码`
-
    ```js
    console.log('code block');
    ```
- Katex
  - $x = {-b \pm \sqrt{b^2-4ac} \over 2a}$
- 现在我们可以通过 `maxWidth` 选项自动换行非常非常非常非常非常非常非常非常非常非常长的内容
````



## GFM警告

```markdown
> [!important]
> 重要文字

> [!info]
> 信息文字

> [!tip]
> 提示文字

> [!warning]
> 注意文字

> [!caution]
> 警告文字

> [!note]
> 注释文字
```



## 提示容器

默认标题

```markdown
::: important
重要容器。
:::

::: info
信息容器。
:::

::: note
注释容器。
:::

::: tip
提示容器
:::

::: warning
警告容器
:::

::: caution
危险容器
:::

::: details
详情容器
:::
```

自定义

```markdown
::: important 自定义标题
重要容器。
:::
```





## 跳转



### 1）文章内跳转（内链）

1. **为标题添加锚点**：

   - 在Markdown文件中，为你希望作为跳转目标的标题添加一个自定义的id。VuePress会自动为标题生成锚点，但你也可以手动指定一个：

     markdown

     ```markdown
     #### 这个是我的标题 {#custom-anchor}
     ```

   - 随后，你可以使用这个自定义的id来创建指向该标题的链接：

     markdown

     ```markdown
     [跳到我的标题](#custom-anchor)
     ```

   - 如果你没有手动指定id，VuePress会为每个标题生成一个默认的锚点，通常是标题文本转换为小写，并用连字符代替空格。例如：

     markdown

     ```markdown
     #### 我的标题
     ```

     可以链接到：

     markdown

     ```markdown
     [跳到我的标题](#我的标题)
     ```

### 2）跳转到其他文章（内部链接）：

1. **相对路径链接**：

   - 使用相对路径来链接到同一项目内的其他Markdown文件。假设你的文件结构如下：

     ```text
     docs/
     ├── guide/
     │   ├── intro.md
     │   └── advanced.md
     └── about.md
     ```

     - 你可以在intro.md中链接到advanced.md：

       markdown

       ```markdown
       [高级指南](./advanced.md)
       ```

     - 如果是从about.md跳转到guide/advanced.md:

       markdown

       ```markdown
       [高级指南](./guide/advanced.md)
       ```

2. **绝对路径链接**：

   - 如果你的项目设置了base路径（比如发布到GitHub Pages的子目录），你需要使用绝对路径。假设你的base路径是/docs/:

     markdown

     ```markdown
     [高级指南](/docs/guide/advanced.md)
     ```

3. **自动处理**：

   - VuePress会自动将.md后缀转换为.html，所以你可以直接使用.md链接。VuePress也会处理不存在的.html文件，转而尝试查找相同名称的目录或.md文件。
