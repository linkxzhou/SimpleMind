## 项目简介
本项目用于尝试一个 AI 自动细化生成脑图的功能，通过输入主题或选中节点，AI 自动扩展并细化节点结构，生成层级化的脑图。

## 截图

### 1. PC端
![项目截图1](./ScreenShot1.png)
![项目截图2](./ScreenShot2.png)

### 2. 手机端
![项目截图3](./ScreenShot3.png)

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

## 功能详解

### 工具栏
- 缩放控制：`-`、`+` 按钮与百分比展示。支持平滑缩放与视图重置。
- 历史操作：`返回`（撤销）与`前进`（重做）。
- 新建导图：创建空白导图或从模板创建。
- 节点操作：`添加子节点`、`删除当前节点`。
- 导入/导出面板：一键打开，支持多种格式。
- 设置：打开设置面板（API、秘钥、模型、语言、布局、深度等）。
- 思维模式：打开“思维模式”抽屉，选择思考模型并查看示例模板。
- 模式切换：一键在“简单/详细”之间切换展示模式（详见下文）。
- AI 生成：当生成中按钮禁用并显示“生成中”，防并发与异常提示。

### 模式切换（Simple ↔ Detailed）
- 行为：对整棵树递归处理节点的 `data.text` 与 `data.note`。
  - 详细模式：将每个节点的 `text` 展示为 `text + '\n' + note`（存在 note 时）。
  - 简单模式：展示为 `text`，并尽可能移除末尾拼接的 `\n + note`。
- 切换方式：点击工具栏里的模式按钮（图标 `SisternodeOutlined`），默认是简单模式；进入详细模式后按钮高亮为 `primary`，再次点击恢复为简单模式。
- 适用范围：适用于所有导图数据（对象/数组/包含 `root` 的结构），递归处理子节点。

### 系统提示词：解析文件填充
- 入口：设置面板 → “系统提示词”页签 → “上传文件，支持解析.md,.txt,.csv,.pdf”按钮。
- 支持类型：`.md`、`.txt`、`.csv`、`.pdf`。
- 行为：选择文件后自动解析文本并填充到 `settings.systemPrompt`。
- 依赖说明：PDF 解析需安装 `pdfjs-dist`。
  - 安装：`yarn add pdfjs-dist`
  - 若未安装，解析 PDF 会给出友好错误提示。
- 使用建议：较长文本会自动截断至安全长度（避免提示词过长影响生成速度与稳定性）。

### 模板与示例（按需加载）
- 思维模式抽屉：每个模型卡片展示“原理：item.description”与示例列表。
- 打开示例：点击示例下的 “打开” 按钮会调用 `newMap(ex.content)`：
  - `ex.content` 可为对象、JSON 字符串或 URL 路径。
  - 当为 URL 字符串时，内部会通过 `fetch` 拉取并解析 JSON，便于懒加载减小主包体积。
- 静态资源 URL 推荐：
  - 在 `const.js` 中将模板改为 URL：`new URL('./templates/xxx.json', import.meta.url).href`
  - 或将模板放置至 `public/templates` 后使用 `/templates/xxx.json`。

### 导入 / 导出
- 导出格式：`.smm`、`.json`、`.svg`、`.png`、`.pdf`、`.md`、`.xmind`、`.txt`。
- 导入格式：`.smm`、`.json`、`.xmind`、`.md`（`.xlsx` 暂未集成，会提示需接入 `xlsx` 库）。
- 面板入口：工具栏点击“导出/导入”按钮打开面板。
- 视图重置：导入成功后会重置视图以适配新数据。

### 右键菜单（节点）
- 打开：节点右键触发。
- 功能：`添加子节点`、`删除当前节点`、`删除节点（含子）`、`复制`、`剪切`、`粘贴`。
- 粘贴行为：基于剪切板缓存数据，插入为目标节点的子节点。

### 缩放与布局
- 缩放：支持视图缩放，自动在库方法 `setScale/scale` 与 CSS 缩放之间优先选择合适方式。
- 布局：可在设置面板中点击切换，如：`思维导图` 等；切换后自动重置视图并保存选择。

### 国际化
- 语言：`zh-CN` 与 `en-US`。
- 文案：界面文本通过 `t(key)` 从 `src/const.js` 的 `messages` 中按当前语言读取；新增 `toggleMode` 文案为英文 “Toggle Detailed/Simple Mode”。
- 原理标签：抽屉中使用 `t('principleLabel')` 显示“原理：”。

### 设置与持久化
- 设置项：`API Base`、`秘钥`、`模型`（默认 `gpt-5`）、`语言`、`布局`、`深度`、`系统提示词`、`思考方式`。
- 环境变量：默认值按 `.env`（或构建环境）读取，前缀为 `VITE_`：
  - `VITE_API`、`VITE_SECRET`、`VITE_MODEL`。
- 存储：`sessionStorage` 持久化
  - 设置：`mindlessSettings`
  - 导图：`mindMapData`

### AI 生成
- 前置检查：已配置 `API Base`、存在导图与选中/输入主题。
- 流程：基于当前节点（主题）与 `系统提示词`（含节点级 `nextSystemPrompt`）构建 Prompt → 请求模型 → 解析子节点 → 插入脑图。
- 并发保护：生成期间按钮禁用并显示“生成中”，异常情况弹窗提示并自动复位。
- 模型参数：`model`（默认 `gpt-5`）、`temperature`、`depth`（生成子节点数量上限）等。

### 性能建议（可选）
- 模板懒加载：将示例模板改为 URL 并使用 `fetch` 加载，避免把大 JSON 内嵌到主包。
- 代码分割：可用 `import.meta.glob` 或动态导入（`import('./templates/xxx.json')`）按需拉取。
- 压缩构建：配合 `vite-plugin-compression` 输出 `.br/.gz`，减少传输体积（需服务器支持）。

## 使用说明（Quick Start）
1. 安装依赖：`yarn`
2. 开发环境：`yarn dev`，浏览器打开提示地址。
3. 生产构建：`yarn build`
4. 配置 API：打开设置面板填写 `API Base`、`秘钥`、`模型`。
5. 创建导图：点击“新建”或在“思维模式”抽屉选择示例模板。
6. 模式切换：点击“模式切换”按钮在简单/详细之间切换文本展示。
7. 系统提示词：在“系统提示词”页签上传 `.md/.txt/.csv/.pdf` 填充提示词。
8. AI 生成：选中节点后点击“AI 生成”，自动扩展子节点。
9. 导入/导出：点击“导出/导入”面板按钮操作对应格式。

## 参考
（1）https://wanglin2.github.io/mind-map-docs/api/constructor/constructor-methods.html#on-event-fn  
（2）https://ant.design/  
（3）https://medium.com/vincent-chen/%E8%AE%80%E6%9B%B8%E5%BF%83%E5%BE%97-%E6%80%9D%E8%80%83%E7%9A%84%E6%A1%86%E6%9E%B6-%E4%BA%8C-%E4%B9%9D%E5%A4%A7%E6%80%9D%E7%B6%AD%E6%A8%A1%E5%9E%8B-e6e6d5ad568  
（4）https://www.processon.com/template/mind_free  
（5）https://www.processon.com/knowledge/mindmaptemplate