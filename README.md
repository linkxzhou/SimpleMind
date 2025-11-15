## 项目简介
当前项目用于尝试一个 AI 自动细化生成脑图的功能。通过输入主题或选中节点，AI 自动扩展并细化节点结构，生成层级化的脑图。

## 功能清单
- 工具栏：新建、返回、前进、删除节点、AI生成、设置、导出JSON、导入JSON
- 新建：创建空白脑图或根节点
- 返回/前进：撤销与重做编辑历史
- 删除节点：删除选中节点（可包含其子节点）
- AI 生成：基于当前节点自动生成子节点、细化层级
- 设置：AI 相关参数与通用配置（如模型、温度、深度等）
- 设置持久化：使用 `sessionStorage` 保存并恢复 `mindlessSettings`
- 导图持久化：使用 `sessionStorage` 保存并恢复脑图数据 `mindMapData`
- 小屏适配：工具栏按钮在小屏幕纵向布局（图标上、文字下）
- 导出 JSON：一键导出当前脑图数据为 `JSON` 文件（工具栏下载图标）
- 导入 JSON：从 `JSON` 文件恢复脑图数据（工具栏上传图标）
- 导出图片：导出为 `PNG/SVG` 图片，适合插入文档与演示
- 其他支持导出xmind，md，smm，pdf，txt格式
- 其他支持导入xmind，md，smm，xlsx格式

## 项目设置

```sh
yarn
```

### 开发环境

```sh
yarn dev
```

### 生产环境构建

```sh
yarn build
```

## 使用说明
- 设置面板字段：`API Base`、`秘钥`、`模型`（默认 `gpt-5`）、`思考方式`
- AI 请求体采用 OpenAI Chat 格式：`{ model, messages: [{ role: 'user', content }], temperature }`
- 数据持久化键：`mindlessSettings`（设置），`mindMapData`（脑图）
- 导出 JSON：点击工具栏“下载”，自动保存为 `mindmap-YYYYMMDD-HHmmss.json`
- 导入 JSON：点击工具栏“上传”，选择有效的导图 JSON 文件后立即加载并重置视图

## 参考
（1）https://wanglin2.github.io/mind-map-docs/api/constructor/constructor-methods.html#on-event-fn  
（2）https://ant.design/  
（3）https://medium.com/vincent-chen/%E8%AE%80%E6%9B%B8%E5%BF%83%E5%BE%97-%E6%80%9D%E8%80%83%E7%9A%84%E6%A1%86%E6%9E%B6-%E4%BA%8C-%E4%B9%9D%E5%A4%A7%E6%80%9D%E7%B6%AD%E6%A8%A1%E5%9E%8B-e6e6d5ad568    
（4）https://www.processon.com/template/mind_free