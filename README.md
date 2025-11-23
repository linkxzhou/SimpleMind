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

## 经验
（1）大模型输出的JSON可能包含无效字符，需要使用 `jsonrepair` 修复。
- 引入 `jsonrepair` 库：`yarn add jsonrepair`
- 使用示例：
  ```js
  import jsonrepair from 'jsonrepair'
  const repaired = jsonrepair(rawJsonString)
  ```

## 参考
（1）https://wanglin2.github.io/mind-map-docs/api/constructor/constructor-methods.html#on-event-fn  
（2）https://ant.design/  
（3）https://medium.com/vincent-chen/%E8%AE%80%E6%9B%B8%E5%BF%83%E5%BE%97-%E6%80%9D%E8%80%83%E7%9A%84%E6%A1%86%E6%9E%B6-%E4%BA%8C-%E4%B9%9D%E5%A4%A7%E6%80%9D%E7%B6%AD%E6%A8%A1%E5%9E%8B-e6e6d5ad568  
（4）https://www.processon.com/template/mind_free  
（5）https://www.processon.com/knowledge/mindmaptemplate