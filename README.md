## 项目简介
本项目一款免费思维导图工具，AI自动按照总结，归纳，第一性原理等思维方式思考，生成思维导图。

## 截图

### 1. PC端
![项目截图1](./ScreenShot1.png)
![项目截图2](./ScreenShot2.png)

### 2. 手机端
![项目截图3](./ScreenShot3.png)

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

### 环境变量

```
VITE_API= # 您的 OpenAI API URL，例如：https://api.openai.com/v1/chat/completions
VITE_SECRET= # 您的 OpenAI API 密钥
VITE_MODEL= # 您的 OpenAI 模型，例如：gpt-5-turbo
```

## 功能详解

### 1. AI 智能生成
- **思维模型**：内置多种思考模版（如第一性原理、批判性思维等），支持查看原理与示例。
- **智能生成**：基于选中节点与系统提示词，自动生成子节点。支持自定义 API、模型（默认 gpt-5）及生成深度。
- **系统提示词**：支持上传 .md/.txt/.pdf 等文件自动填充知识库，辅助 AI 生成。
- **提示词扩写**：自动扩写系统提示词，优化 AI 生成效果。

### 2. 个性化设置
- **基础设置**：API Base、密钥、模型选择、语言切换（中/英）。
- **主题美化**（新）：
  - **画布**：自定义背景颜色。
  - **连线**：调整颜色、粗细（1-10px）、风格（曲线/直线/直连）。
  - **字体**：支持多种字体切换（如微软雅黑、宋体、Arial 等）。
  - **一键重置**：各样式支持独立恢复默认值。

### 3. 导图操作与管理
- **布局切换**：支持思维导图、逻辑结构图、鱼骨图等多种布局。
- **模式切换**：支持“简单模式”（仅文本）与“详细模式”（文本+备注）一键切换。
- **导入导出**：支持 .smm, .json, .xmind, .md, .png, .svg 等多种格式。
- **节点操作**：支持右键菜单进行增删改查、复制粘贴等操作。

### 4. 其他特性
- **持久化存储**：自动保存设置与导图数据至本地。
- **国际化**：完整支持简体中文与英文界面。
- **主题美化**：增加多个主题（如默认、暗黑、浅色等），支持自定义主题。
- **节点按钮标记**：为每个节点添加操作按钮（如删除、复制、粘贴等），方便用户进行节点管理。

### TODO
- 增加动画效果
- 美化界面

## 经验
（1）大模型输出的JSON可能包含无效字符，需要使用 `jsonrepair` 修复。
- 引入 `jsonrepair` 库：`yarn add jsonrepair`
- 使用示例：
  ```js
  import jsonrepair from 'jsonrepair'
  const repaired = jsonrepair(rawJsonString)
  ```

（2）`simple-mind-map` 的 `TouchEvent` 插件在移动端会拦截所有触摸事件，导致 UI 组件（如 Ant Design Vue 的 Select）不可用。
- 原因：官方 `TouchEvent` 插件在 `window` 上绑定了 `touchstart` 等事件，且未判断事件目标是否在画布内。
- 解决：复制官方插件代码到本地（如 `src/plugins/TouchEvent.js`），并在事件处理函数开头增加判断：
  ```js
  // 如果触摸目标不在思维导图容器内，则忽略，避免影响其他 UI 组件
  if (!this.mindMap.el.contains(e.target)) {
      return
  }
  ```
- 在注册插件时引入本地修改后的版本。

## 参考
（1）https://wanglin2.github.io/mind-map-docs/api/constructor/constructor-methods.html#on-event-fn    
（2）https://ant.design/    
（3）https://medium.com/vincent-chen/  %E8%AE%80%E6%9B%B8%E5%BF%83%E5%BE%97-%E6%80%9D%E8%80%83%E7%9A%84%E6%A1%86%E6%9E%B6-%E4%BA%8C-%E4%B9%9D%E5%A4%A7%E6%80%9D%E7%B6%AD%E6%A8%A1%E5%9E%8B-e6e6d5ad568    
（4）https://www.processon.com/template/mind_free    
（5）https://www.processon.com/knowledge/mindmaptemplate