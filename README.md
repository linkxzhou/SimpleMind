## 项目简介
当前项目用于尝试一个 AI 自动细化生成脑图的功能。通过输入主题或选中节点，AI 自动扩展并细化节点结构，生成层级化的脑图。

## 功能清单
- 工具栏：新建、返回、前进、删除节点、AI生成、设置
- 新建：创建空白脑图或根节点
- 返回/前进：撤销与重做编辑历史
- 删除节点：删除选中节点（可包含其子节点）
- AI 生成：基于当前节点自动生成子节点、细化层级
- 设置：AI 相关参数与通用配置（如模型、温度、深度等）
- 设置持久化：使用 `sessionStorage` 保存并恢复 `mindlessSettings`
- 导图持久化：使用 `sessionStorage` 保存并恢复脑图数据 `mindMapData`
- 模态提示：集成 SweetAlert2，支持加载中、错误与成功提示
- 小屏适配：工具栏按钮在小屏幕纵向布局（图标上、文字下）

## 扩展规划
以下为后续将加入的扩展功能，欢迎提出需求与建议：
- 导出 JSON：一键导出当前脑图数据为 `JSON` 文件，便于备份与分享
- 导出图片：导出为 `PNG/SVG` 图片，适合插入文档与演示
- 分享功能：生成可分享链接或分享码，支持只读/可编辑权限
- 样式自定义：支持主题切换、节点配色、字体大小、间距等样式修改
- 导入能力：从 `JSON` 文件恢复脑图，支持与导出格式互通
- 快捷键增强：为常用操作提供可配置的快捷键映射

## Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Compile and Minify for Production

```sh
yarn build
```

## 使用说明
- 设置面板字段：`API Base`、`秘钥`、`模型`（默认 `gpt-5-nano`）、`温度`（默认 `0.7`）、`知识点方向`（默认 `子知识点`）、`生成子节点数`（默认 `3`）
- AI 请求体采用 OpenAI Chat 格式：`{ model, messages: [{ role: 'user', content }], temperature }`
- 数据持久化键：`mindlessSettings`（设置），`mindMapData`（脑图）

## 依赖
（1）https://wanglin2.github.io/mind-map-docs/api/constructor/constructor-methods.html#on-event-fn  
（2）https://ant.design/  
（3）https://medium.com/vincent-chen/%E8%AE%80%E6%9B%B8%E5%BF%83%E5%BE%97-%E6%80%9D%E8%80%83%E7%9A%84%E6%A1%86%E6%9E%B6-%E4%BA%8C-%E4%B9%9D%E5%A4%A7%E6%80%9D%E7%B6%AD%E6%A8%A1%E5%9E%8B-e6e6d5ad568
（4）参考项目：https://www.processon.com/template/mind_free