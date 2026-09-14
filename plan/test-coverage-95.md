# 将测试覆盖率提升到 95%

> **范围声明：先不写代码 / plan only。**  
> 本文只规划后续如何加测试、配覆盖率与拆模块；本 PR 不新增 `*.spec.js` / `*.test.js`、不改 `package.json` scripts、不改 `vite.config.js`、不改应用源码。

## 1. 调查结论（当前状态，已实测）

仓库是 Vue 3 + Vite 的单页思维导图应用（`simple-mind` / SimpleMind）。调查时间点：当前 `main`（`7bdb14f feat: 更新模型`）。

### 1.1 测试与覆盖率：实测为 0%

以下为**实测事实**，不是估算：

| 检查项 | 结果 |
| --- | --- |
| `package.json` scripts | 仅有 `dev` / `build` / `preview`，**没有** `test` / `coverage` |
| 测试依赖 | `package.json` 与 `yarn.lock` 中 **没有** `vitest`、`jest`、`@vue/test-utils`、`playwright`、`cypress`、`@vitest/coverage-v8` |
| 测试文件 | 全仓库（排除 `.git`）**没有** `*test*` / `*spec*` 文件 |
| CI | **没有** `.github/workflows` 或其他 CI 配置 |
| 覆盖率报告 | 不存在 `coverage/` 产物（`.gitignore` 已忽略 `coverage`） |

因此：

- **当前语句 / 行 / 函数 / 分支覆盖率 = 0%**（没有测试执行任何源码）。
- 无法用 `npx vitest --coverage` 读出分模块数字；下文模块缺口是按源码结构推断的覆盖目标，不是已跑出的百分比。

`.gitignore` 已预留 Vitest / Cypress / `coverage` 条目，说明作者预期会加测试，但尚未落地。

### 1.2 源码体量（用于规划覆盖率分母）

| 类别 | 数量 | 体量 | 是否计入 95% 分母 |
| --- | --- | --- | --- |
| 可执行 `src/*.js` + `src/*.vue` + `src/plugins/*.js` | 8 个文件 | **2094 行 / ~77 KB** | **是**（主目标） |
| `src/locales/*.json` | 2 | 各 77 行，纯文案 | 否（数据，用快照/键完整性检查即可） |
| `src/templates/*.json` | 32 | **~896 KB**，几乎都是单行 JSON | **否**（示例数据，不是逻辑） |
| `src/templates/card.html` | 1 | 215 行，内含内联 JS | 建议抽出后再计入；当前为模板字符串资产 |
| `public/*.html` | 14 | ~557 KB 静态示例页 | 否 |
| `public/app.css` | 1 | 152 行 | 否（样式不进 JS 覆盖率） |

可执行模块明细：

| 文件 | 行数 | 角色 | 逻辑密度 |
| --- | --- | --- | --- |
| `src/App.vue` | 885 | 几乎全部 UI / 生命周期 / 节点操作 / AI 入口 | 高（最大缺口） |
| `src/const.js` | 349 | `messages` / `layouts` / `thinkingModels` / 字体 / 图标 | 低（静态数据 + `import.meta.url`） |
| `src/utils.js` | 303 | 插件注册副作用、Modal、导入导出、简单/详细模式 | 高 |
| `src/plugins/TouchEvent.js` | 210 | 自定义触摸插件 | 中高 |
| `src/libai.js` | 206 | Prompt 构造、JSON 解析修复、API 请求 | 高 |
| `src/parser.js` | 71 | 上传文件转知识库（md/txt/csv/pdf） | 中 |
| `src/storage.js` | 64 | `sessionStorage` 设置与导图持久化 | 中（最容易先到 95%） |
| `src/main.js` | 6 | `createApp(App).mount('#app')` | 低（需组件挂载烟测） |

### 1.3 现有工具链（加测试时要接上，本阶段不改）

- 运行时：Vue `^3.5.22`、Vite `^7.1.11`、`"type": "module"`、Node `^20.19.0 \|\| >=22.12.0`
- UI：`ant-design-vue`、`@ant-design/icons-vue`
- 画布：`simple-mind-map` + `simple-mind-map-plugin-themes`
- 其它：`jsonrepair`、`pdfjs-dist@^3`
- 路径别名：`jsconfig.json` 中 `@/*` → `./src/*`（Vitest 需同步 `resolve.alias`）
- `src/utils.js` **模块顶层**会 `MindMap.usePlugin(...)` 并 `import` 多个官方插件；单测 `utils` / `App.vue` 时必须 mock 这些副作用，否则 jsdom 会加载整棵导图库。

---

## 2. 95% 的度量定义（必须先写清楚）

目标：**V8 覆盖率（Istanbul 兼容报告）四项均 ≥ 95%**。

建议阈值（写入未来 `vitest.config.js` 的 `coverage.thresholds`，本阶段只规划）：

| 指标 | 阈值 | 说明 |
| --- | --- | --- |
| `lines` | 95 | 主 KPI，与「95% 覆盖率」对齐 |
| `statements` | 95 | 与 lines 接近 |
| `functions` | 95 | 防止只跑到文件却漏掉导出函数 |
| `branches` | 95 | 最难；`exportMindMap` / `extractIdeas` / `App.vue` 分支多 |

### 2.1 include / exclude（强烈建议）

**计入覆盖率：**

```
src/**/*.js
src/**/*.vue
```

**排除（否则 95% 会被静态 JSON 稀释或被无法执行的模板拖垮）：**

```
src/templates/**
src/locales/**
node_modules/**
```

`const.js` **计入**。它几乎无分支，import 一次即可接近满覆盖；不要用 exclude 刷高覆盖率。

`card.html` 内联脚本当前不在 Vite JS 图里，**默认不会进入覆盖率**。若要坚持「卡片渲染逻辑也 95%」，后续应把 `createCardElement` / `renderNodes` 抽到 `src/cardView.js` 再测。此项列为覆盖率第二阶段，不阻塞主 KPI。

### 2.2 不要用错误方法凑 95%

- 不要把 32 个模板 JSON 算进 coverage（它们不是可执行语句）。
- 不要为了覆盖率去测 `ant-design-vue` / `simple-mind-map` 内部。
- 不要用 `/* istanbul ignore next */` 大面积忽略 `App.vue`；若某段难测，优先抽出纯函数。
- 允许对「必须存在的 DOM 插件入口」做窄 ignore：例如 `TouchEvent.onTouchcancel` 空函数、`main.js` 的 `mount` 若由组件测试间接覆盖则可不再单测。

### 2.3 达标估算（估算，非实测）

以 2094 行可执行代码计，95% ≈ **最多允许 ~105 行未被执行**。

粗分预算（估算）：

| 模块 | 行数 | 建议目标 | 允许未覆盖（估算） |
| --- | --- | --- | --- |
| `storage.js` | 64 | ≥ 98% | 1–2 行（极端 QuotaExceeded） |
| `libai.js` | 206 | ≥ 97% | `Buffer` 分支（浏览器环境） |
| `parser.js` | 71 | ≥ 95% | pdf.js worker 真实网络 |
| `utils.js` | 303 | ≥ 95% | 真实 xmind/pdf 插件内部 |
| `TouchEvent.js` | 210 | ≥ 95% | 双指缩放与 `toPos` 需 mock mindMap |
| `const.js` | 349 | ~100% | 无 |
| `main.js` | 6 | 由 App 挂载覆盖 | 0 |
| `App.vue` | 885 | ≥ 93–95% | 最紧张：生命周期 + mindMap 事件 |

**结论：** 纯模块单测可以把除 `App.vue` 外的文件先打到 95%+；**能否全局 95% 取决于 `App.vue`。** 若组件测试覆盖不足，应把 `cloneNodeData` / `applyZoom` / `aiGenerate` 校验逻辑抽到 `src/` 纯模块（抽取本身是后续编码工作，不在本 PR）。

---

## 3. 推荐测试栈（后续实现时）

与现有 Vite ESM 最省摩擦：

| 层级 | 工具 | 用途 |
| --- | --- | --- |
| 单测 / 组件测 | Vitest + jsdom | 默认 |
| Vue SFC | `@vue/test-utils` | `App.vue` |
| 覆盖率 | `@vitest/coverage-v8` | 阈值 95 |
| 网络 | `vi.stubGlobal('fetch', ...)` | `libai.js`、`newMap` 模板加载 |
| 存储 | mock `sessionStorage` | `storage.js`、`utils.js` 的 `t()` |
| E2E（可选，不计入 95% 分母也可） | Playwright 1–2 条烟测 | 打开页面、工具栏可见、设置弹窗 |

脚本规划（实现阶段再加，此处仅记录）：

- `yarn test` → `vitest run`
- `yarn test:watch` → `vitest`
- `yarn coverage` → `vitest run --coverage`

覆盖率配置要点：`environment: 'jsdom'`；`deps.inline` 视 `simple-mind-map` CJS/ESM 互操作而定；对 `simple-mind-map`、`ant-design-vue`、`pdfjs-dist` 做 `vi.mock`。

---

## 4. 分模块缺口与建议用例

下面按 **ROI（覆盖行数 / 编写难度）** 排序。每个模块列出：建议测试文件、用例类型、关键分支。

### P0 — `src/storage.js`（先打样板）

建议文件：`src/storage.spec.js`（或 `tests/storage.spec.js`，二选一后保持一致；推荐 `tests/` 以免与源码混放）。

| 函数 | 建议用例 | 类型 |
| --- | --- | --- |
| `toNumberOr`（经 `loadSettings`/`saveSettings` 间接覆盖） | 正常数字、`NaN`、`undefined`、字符串 `"3"` | 单元 |
| `loadSettings` | 无 key → 返回 defaults 拷贝；合法 JSON 合并；`temperature`/`depth` 非法时回落 0.7 / 3；JSON 损坏走 catch | 单元 |
| `saveSettings` | 写入 `SETTINGS_KEY`；数字规范化；`setItem` 抛错要 rethrow | 单元 |
| `isValidMindMap` / `loadMindMapData` | 无数据返回 defaults；缺 `data` 对象视为非法；损坏 JSON | 单元 |
| `saveMindMapData` | 成功序列化；QuotaExceeded 抛错 | 单元 |

成功标准：该文件 lines/branches ≥ 95%。注意 `loadSettings` 返回新对象，不要测到引用相等。

### P0 — `src/libai.js`

建议文件：`tests/libai.spec.js`

| 函数 | 建议用例 | 类型 |
| --- | --- | --- |
| `buildPrompt` | 默认 thinking model；指定 `note-taking` 等；空 `nextSystemPrompt` 回落 `"Most relevant key points"`；有/无 `systemPrompt`；`count` 进入 min/max 文案；语言字段 | 单元（断言子串，不要整段快照绑死） |
| `extractIdeas` | `choices[0].message.content`；`output_text` / `text`；纯字符串；```json 围栏；非法 JSON → `jsonrepair` 成功；repair 也失败抛错；根对象带 `children` 或 `data` | 单元 |
| `resolveEndpoint` | 空、带空格、正常 base | 单元 |
| `normalizeSecret`（经 `requestCompletions`） | 普通 secret；`my-` + standard Base64；URL-safe Base64；padding；`atob` 失败回退 | 单元 |
| `requestCompletions` | JSON 响应；非 JSON 文本；带/不带 Authorization；`fetch` reject | 单元（mock fetch） |
| `expandPrompt` | 从 `choices` / `output_text` / 字符串 `data` 取内容并 `trim` | 单元 |

注意：`extractIdeas` 会 `console.log` 全文，单测应 `vi.spyOn(console, 'log')` 以免刷屏。覆盖率不要依赖真实 LLM。

### P0 — `src/parser.js`

建议文件：`tests/parser.spec.js`

| 函数 | 建议用例 | 类型 |
| --- | --- | --- |
| `parseFileAsPrompt` | `.md` / `.txt` 读文本；`.csv` 去 BOM、去空行；不支持后缀抛中文错误；无扩展名 | 单元（构造 `File` 或 `{ name, text, arrayBuffer }` duck type） |
| `normalizeText` / `clampLength` | `\r\n`、超 20000 字符截断、空值 | 经 md/txt 间接或后续导出测试 |
| `extractTextFromPDF` | mock `pdfjs-dist/legacy/build/pdf.js`：`numPages=2`，拼接 `items[].str`；import 失败包装错误；确认设置了 `GlobalWorkerOptions.workerSrc` | 单元（**不要**打真实 CDN） |

PDF 是覆盖率陷阱：动态 `import('pdfjs-dist/...')` 必须 mock，否则 jsdom 会拉巨大依赖且 worker 无效。

### P1 — `src/utils.js`

建议文件：`tests/utils.spec.js`  
**前置：** mock `simple-mind-map` 及其 plugins、`simple-mind-map-plugin-themes`、`ant-design-vue` 的 `Modal`。

| 函数 | 建议用例 | 类型 |
| --- | --- | --- |
| 模块加载 | `usePlugin` 被调用；`usePlugin` 抛错走 `console.warn` | 单元 |
| `t()` | sessionStorage 语言 zh/en；损坏 JSON 回落 zh-CN；缺 key 返回 key | 经 Modal 文案间接 |
| `showLoading` / `showError` / `showSuccess` / `hideLoading` | 调用 `Modal.info/error/success/destroyAll`；`toModalContent`：`null`、无换行字符串、含 `\n` 走 `h('pre')`、非字符串原样返回 | 单元 |
| `exportMindMap` | `mindMap` 为空；`smm/json/png/pdf/xmind/svg` 调 `export` 参数；`md`/`txt`/`cardhtml` 走 Blob+`<a download>`；未知 type；`export` 抛错 | 单元（mock `URL.createObjectURL`、`document.createElement`） |
| `importFileToMindMap` | 无 mindMap；`.json` 带 `root` → `setFullData`，否则 `setData`；`.xmind` mock `parseXmindFile`；`.md` mock markdown；`.xlsx` 提示未集成；未知后缀；JSON 解析失败 | 异步单元 |
| `switchTextNoteMode` | `detail` 拼接 note；已拼接则不重复；`simple` 去掉后缀；无 note；`root` 树 / 无 root 对象 / 数组根 | 单元（mock `getData/setData/view.reset`） |
| `getThemeList` | 第一项为「默认」且 `value === ''`；后面展开 `themeList` | 单元 |

`txt` 导出的递归 `walk`、`cardhtml` 的正则替换与 `App.vue` `showCardModal` 重复，两处都要测，避免只覆盖一处。

`importFileToMindMap` **始终 `return false`**（Ant Upload 约定）。测试应断言该返回值，避免以后改行为时静默失败。

### P1 — `src/plugins/TouchEvent.js`

建议文件：`tests/TouchEvent.spec.js`

| 方法 | 建议用例 | 类型 |
| --- | --- | --- |
| `getTwoPointDistance` | 经单指二次 `touchstart` 间接覆盖 | 单元 |
| `bindEvent` / `unBindEvent` | 在 `window` 上注册/移除 4 个监听，且 `{ passive: false }` | 单元 |
| `onTouchstart/move/end` | **目标不在 `mindMap.el` 内 → 直接 return**（这是相对官方插件的核心修复） | 单元 |
| 单指 | `touches.length===1` 派发 `mousedown`/`mousemove`/`mouseup` | 单元 |
| 双指缩放 | mock `mindMap.toPos`、`opt`、`view.transform`、`emit('scale')`；距离变化 ≤10 保持 scale；min/max clamp；`disableTouchZoom` | 单元 |
| 双击模拟 | 300ms 内两次 touchend 且位移 ≤5 → `dblclick` | 假时间 `vi.useFakeTimers()` |
| `beforePluginRemove` / `Destroy` | 调用 `unBindEvent` | 单元 |

jsdom 的 `TouchEvent`/`touches` 需手动构造；`MouseEvent` 可用。

### P1 — `src/const.js` + locales

建议文件：`tests/const.spec.js`

- `messages` 同时含 `zh-CN`、`en-US`。
- **中英 key 集合相等**（避免漏翻导致覆盖率看起来很高但 i18n 残缺）。当前两边都是 76 个 key，应对齐检查。
- `thinkingModels` 每个 `value` 唯一；每个 `example[].content` 是 URL 字符串（`import.meta.url` 产物）。
- `layouts` 含 `mindMap` / `logicalStructure` / `organizationStructure` / `catalogOrganization` / `timeline` / `fishbone`。
- 发现重复文件 `src/templates/bayesian-thinking1..json`（双点），确认是否被引用：`const.js` 引用的是 `bayesian-thinking1.json`，双点文件是死资产，**不必为覆盖率去 import 它**。

### P2 — `src/App.vue`（全局 95% 的决定项）

建议文件：`tests/App.spec.js`  
策略：`vi.mock('./utils.js')`、`vi.mock('./libai.js')`、`vi.mock('./storage.js')`、`vi.mock('./parser.js')`、`vi.mock('simple-mind-map')`，再 `mount(App)`。

按模板/脚本块拆用例（组件测试 + 用户交互）：

**工具栏**

- 缩放：`zoomIn` / `zoomOut` 限制在 `[0.2, 2]`；无 `view.setScale` 时回退 `view.scale`；再无则改 `#mindMapContainer` 的 CSS transform。
- `back` / `forward` → `execCommand('BACK'|'FORWARD')`。
- `newMap()` 无模板 → 默认 `{ data: { text: '主题' }, children: [] }`。
- `newMap(jsonString)` / `newMap(url)`（mock fetch）/ `newMap(object)`；fetch 非 2xx；JSON 失败。
- `addChildNode` / `removeCurrentNode`：无选中节点报错；有 `currentNode` 或 `activeNodes[0]`。
- 导入导出按钮打开设置且 `activeKey === 'export'`。
- `toggleMindMapMode` 在 simple/detail 间切换并调用 `switchTextNoteMode`。
- 抽屉 / 设置 / 卡片 / AI 按钮的 open 与 disabled/loading。

**抽屉**

- 点击 thinking model 更新 `settings.thinkingModel`。
- 「打开: 示例」调用 `newMap(ex.content)`。

**右键菜单**

- `node_contextmenu` 设置坐标并显示；`document` click 关闭。
- 复制/剪切/粘贴/标记：`cloneNodeData` 去掉 uid；无剪贴板时粘贴项 `disabled`。

**设置 Modal**

- 语言、API、secret、model、depth、theme、font、lineStyle、layout。
- `applyLayout` → `setLayout` + `view.reset`。
- 上传知识库成功/失败；`expandSystemPrompt` 成功写入、失败 `showError`、进行中防重入。
- 导出 9 种格式都转到 `exportMindMap`。
- 导入 `before-upload` 返回 `false`。
- 更多设置里颜色/线宽重置。

**卡片 Modal**

- 无 mindMap 报错；成功创建 blob URL；关闭时 `revokeObjectURL`。

**主题 watch**

- `theme` 变化 → `setTheme` 并回写 background/line 等。
- 非 theme 字段变化 → `setThemeConfig`。
- `fillColor == '#fff'` 或 `rgb(255, 255, 255)` 时 `themeRootFillColor` 回落 `#00c0b8`。
- `themeList.find` 未命中时不要假定 `targetTheme.theme` 存在（当前代码有 `console.log('targetTheme', targetTheme.theme)`，未命中会抛错——测试应锁住该行为，修复是后续编码）。

**AI 生成 `aiGenerate`**

- 进行中直接 return。
- 空 API / 无 mindMap / 无节点文本。
- 成功：`buildPrompt` → `requestCompletions` → `extractIdeas` → `INSERT_MULTI_CHILD_NODE`。
- 空 ideas；请求抛错；`depth` clamp 到 1–20。
- `showLoading` / `hideLoading` 成对调用。

**生命周期**

- `onMounted`：`loadSettings`、`loadMindMapData`、构造 `MindMap`、绑定 `node_active` / `node_contextmenu` / `data_change`。
- `data_change` 调用 `saveMindMapData`；抛错只 warn。
- `onUnmounted` 移除 click 监听。

若 `App.vue` 组件测试成本过高：先抽出下列纯函数（后续重构 PR，非本 PR）：

1. `cloneNodeData` / `stripUid`
2. `getNodeText` / `getNodeSystemPrompt` / `validateTargetNode`
3. `applyZoom` 的 clamp 与策略选择
4. `aiGenerate` 的参数校验（与请求分离）
5. 卡片 HTML 的 `replace` 逻辑（与 `exportMindMap('cardhtml')` 合并）

抽出后单测很容易到 95%，组件测试只负责接线。

### P2 — `src/main.js`

`tests/main.spec.js` 或在 `App.spec.js` 中间接：mock `createApp`，断言 `mount('#app')`。6 行，不要为此引入复杂 E2E。

### P3 — 模板与卡片 HTML（不计入主 95%，但要有质量网）

- `tests/templates.spec.js`：每个 `thinkingModels.example.content` 对应文件可 `JSON.parse`，且有 `data.text`。
- 抽检 1–2 个大模板（如 `default3.json` 66 KB）结构：`children` 为数组。
- `card.html`：若暂不抽取 JS，可用正则断言占位符 `{{REPLACE:cardData BEGIN}}` / `END` 存在（`exportMindMap` 依赖它们）。

### P3 — E2E（可选，覆盖率通常不计）

Playwright 针对 `yarn dev`：

1. 画布 `#mindMapContainer` 与工具栏渲染。
2. 打开设置，切换语言，文案变化。
3. 右键菜单出现（需 mock 或真实 mind-map，较脆）。

E2E **不要**当作 95% 的主力；jsdom 组件测试更稳。

---

## 5. 建议的测试目录结构（实现阶段）

```
tests/
  setup.js                 # sessionStorage polyfill、console mock、URL.createObjectURL
  storage.spec.js
  libai.spec.js
  parser.spec.js
  utils.spec.js
  TouchEvent.spec.js
  const.spec.js
  App.spec.js
  templates.spec.js        # 可选，JSON 可解析性
fixtures/
  tiny-map.json
  broken.json
  sample.md
  sample.csv
  sample.pdf.bin           # 仅当不 mock pdfjs 时；默认仍 mock
```

命名约定：`*.spec.js` + ESM。不引入 TypeScript（仓库是 JS）。

---

## 6. 达到 95% 的工作顺序

严格按此顺序，避免一上来测 `App.vue` 却没有 mock 基础设施。

1. **基线（实现阶段第一件事）**  
   加 Vitest + coverage，跑一次空测试，确认报告为 0%。把 HTML 报告截图/数字记入后续 PR 描述。  
   *本 plan PR 不做这一步。*

2. **P0 纯模块**  
   `storage` → `libai` → `parser`。预期整体覆盖率从 0% 升到大约 **15–25%**（估算：64+206+71 ≈ 341 / 2094 ≈ 16%，含 `const` 可到 ~33%）。

3. **顺手 import `const.js`**  
   几乎 +349 行，整体大约 **30–35%**（估算）。

4. **P1 `utils.js` + `TouchEvent.js`**  
   约 +513 行。累计估算 **55–65%**。此时分支覆盖率会落后于行覆盖率。

5. **P2 `App.vue` 交互**  
   按工具栏 → 设置 → 导入导出 → 节点菜单 → AI → 生命周期推进。每完成一块看 coverage 热图，专补红色分支。  
   目标：全局 **≥ 95%**。若卡住在 85–90%，执行「抽出纯函数」再补单测。

6. **门槛与回归**  
   `coverage.thresholds` 设 95；本地 `yarn coverage`；若后续加 CI，把 coverage 当作 required check。  
   禁止下降：新功能必须带测试。

7. **（可选）卡片 JS 抽取**  
   仅当产品要求卡片渲染也计入 95%。

---

## 7. 与性能计划的交界

测试不要变成性能优化。但下列用例能**锁住**性能相关行为，便于以后改实现：

- `data_change` 会调用 `saveMindMapData`（日后加 debounce 时改期望）。
- `switchTextNoteMode` 使用深拷贝 + `setData`（日后原地更新时改断言）。
- `extractTextFromPDF` 按页循环（日后并发时仍断言全文拼接顺序）。
- TouchEvent 对容器外触摸 early-return（性能与正确性双重回归）。

细节见 [performance-analysis.md](./performance-analysis.md)。

---

## 8. 风险

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| `App.vue` 885 行单文件，逻辑与 UI 耦合 | 达不到 95% | 先测可抽逻辑；不够再重构抽出（单独 PR） |
| `utils.js` 顶层注册 simple-mind-map 插件 | 单测启动慢/失败 | 文件级 `vi.mock('simple-mind-map')` |
| `pdfjs-dist` 动态 import + CDN worker | 单测连网或不稳定 | 永远 mock 该模块 |
| jsdom 缺少真实 SVG/Canvas | 无法测真实渲染帧 | 覆盖率只保证**我们的** JS；渲染交给库 |
| 分支覆盖比行覆盖难 | 四项里 `branches` 可能最后才到 95% | 用覆盖率报告点名 `if/else`；为每个 export type 写表驱动测试 |
| `showLoading` 把完整 prompt 塞进 Modal | 断言脆弱 | 只 spy 调用次数，不匹配全文 |
| 模板 JSON 被误加入 coverage | 分母虚高或工具报解析问题 | exclude `src/templates/**` |
| 中文错误字符串作为断言 | 文案一改测试全挂 | 可断言 `toThrow(/不支持的文件类型/)` 或日后改为 error code |

---

## 9. 验收清单（后续编码 PR 用）

- [ ] `yarn test` 在无浏览器环境下稳定绿
- [ ] `yarn coverage` 四项 ≥ 95%，include 仅 `src/**/*.{js,vue}`，exclude 模板与 locales
- [ ] 报告中 `storage.js` / `libai.js` / `parser.js` / `utils.js` / `TouchEvent.js` 各自 ≥ 95%
- [ ] `App.vue` 未覆盖行有清单：要么补测，要么抽出，要么给出**逐行**忽略理由
- [ ] 无真实网络、无真实 OpenAI、无真实 PDF CDN
- [ ] 不提交 `coverage/` 目录

---

## 10. 非目标（再次强调）

- **先不写代码 / plan only**：本文件落地不等于开始写测试。
- 不在本阶段改 README、Vite 配置、依赖或应用行为。
- 不为 `public/math*.html`、`public/amc801.html` 追求 JS 覆盖率。
- 不把 `simple-mind-map` 官方源码纳入 95%。
