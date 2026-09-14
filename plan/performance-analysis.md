# 应用性能问题分析

> **落地状态（本实现 PR）：P0 已落地；P1 已落地（卡片 iframe 虚拟滚动除外）；P2 已落地实用项。**  
> 配套测试网见 [test-coverage-95.md](./test-coverage-95.md)。本文件保留原分析，并在第 0 节记录测量与实现结果。

## 0. 本 PR 落地结果

实现顺序与第 5 节一致：先基线，再 P0（debounce 写入 → 模式切换 → DEV 日志 / Loading → 导出插件代码分割），再 P1（卡片模板、PDF worker/提前 break、TouchEvent、主题 debounce），再 P2（模板 glob、死文件、`min-height`、抽屉按需渲染）。

回归：`yarn test` 128 条全绿；`yarn coverage` 语句/行/函数 **100%**，分支 **97.7%**（阈值 95）。未改覆盖率分母排除规则，未抽大段新架构。

### 0.1 包体（`yarn build`，Vite 报告）

| 资产 | 优化前 | 优化后 | 说明 |
| --- | --- | --- | --- |
| 入口 `index-*.js` | **1832.11 KB / gzip 604.05 KB** | **1130.45 KB / gzip 342.86 KB** | −38% raw / −43% gzip |
| `ExportPDF-*.js` | （打在入口） | 428.96 KB / gzip 177.82 KB | 首次导出 PDF 才加载 |
| `xmind-*.js` | （打在入口） | 174.60 KB / gzip 54.23 KB | 导入/导出 XMind 才加载 |
| `markdown-*.js` | （打在入口） | 57.35 KB / gzip 16.65 KB | md 导入导出才加载 |
| `Export-*.js` | （打在入口） | 7.53 KB / gzip 3.22 KB | 光栅/通用导出才加载 |
| `pdf-*.js`（pdfjs 知识库） | 371.78 KB / gzip 112.38 KB（已动态） | 371.85 KB / gzip 112.42 KB | 仍仅上传 PDF 时加载 |
| `pdf.worker.min-*.js` | jsDelivr CDN，版本未钉 | 本地 **1133.66 KB** 异步块 | 与 `pdfjs-dist@3.11.174` 同版本 |
| `src/templates/card.html` | 27.6 KB（内嵌整份示例 JSON） | **7.6 KB**（占位 `{}`） | P1-1 |
| `bayesian-thinking1..json` | 22 KB 未引用 | **已删除** | P2-1 |

入口 chunk 中 **不再出现** ExportPDF / XMind / markdown 解析器。模板改为 `import.meta.glob('./templates/*.json')` 按需 chunk，抽屉点「打开」才加载。

### 0.2 运行时（本环境 Node 测量 + 代码路径）

本 CI 机器上 `JSON.stringify` 单次很便宜（Heavy `default3.json` 中位约 **0.06 ms**，远低于计划 5–8 ms 判据）。P0-1 仍按计划落地 debounce：编辑路径每 400 ms 最多一次 `sessionStorage` 写入，并在 `visibilitychange=hidden` / `pagehide` / 卸载时 flush。Heavy 上 pretty-print 卡片 JSON 比 compact 大约 **1.48×**（54.8 KB vs 37.1 KB），已取消 `null, 2`。

| 项 | 证据 |
| --- | --- |
| P0-1 `data_change` debounce | `scheduleMindMapSave` 400 ms；相同 JSON 跳过 `setItem`；隐藏标签 flush |
| P0-2 模式切换 | 去掉额外 `JSON.parse(JSON.stringify)` 与 `view.reset`；优先 `updateData`（内部 `render`）；抽出 `combineText` |
| P0-3 代码分割 | 见上表；`ensureExportPlugins` + `mindMap.addPlugin` |
| P0-4 Loading / 日志 | Loading 只展示 `pleaseWait`，宽 480；`console.log` 走 `import.meta.env.DEV` / `debugLog` |
| P1-1 卡片 | `buildCardHtml` compact stringify；模板去内嵌数据 |
| P1-2 PDF | 累计 ≥ 20k 即 `break`；本地 worker；单测 5 页只解析 2 页 |
| P1-3 TouchEvent | 监听绑在 `mindMap.el`，`{ passive: true }`；容器外不再进入 window 回调 |
| P1-4 主题 / 复制 | 颜色等 `setThemeConfig` debounce 120 ms；`structuredClone` + JSON 回落 |
| P2-1 模板 | glob 按需；删除死文件 |
| P2-2 布局 / 抽屉 | `#mindMapContainer` `min-height: 100vh`；抽屉内容 `v-if="drawerOpen"` |

### 0.3 未做 / 明确推迟

| 项 | 原因 |
| --- | --- |
| `jsonrepair` / AI 解析进 Worker | 计划后续方向；改动面大，且无 1 MB fixture 基线超时证据 |
| 降低 `max_tokens: 32000` | 影响生成质量，属产品决策 |
| 卡片 iframe 内虚拟滚动 | 计划「后续方向」；模板已去内嵌数据 + compact JSON，虚拟列表要改 iframe 运行时 |
| 超配额改 IndexedDB | 计划可选；现有 catch + warn 保留 |
| 移出 `public/math*.html` + `amc801.html` | 无源码引用，但可能是有意静态副本；未证实无外链 |
| 主题包 / Ant Design 换库、重写 mind-map | 计划明确不要先做 |
| Lighthouse TBT / 真机 Performance | 本环境无浏览器 Lighthouse 基线；包体与单测路径已记录 |

---

配套文档：[test-coverage-95.md](./test-coverage-95.md)（先有测试再改热路径，避免无回归网）。

## 1. 应用画像（调查所得）

SimpleMind 是浏览器端 SPA：工具栏 + `simple-mind-map` 画布 + Ant Design Vue 设置/抽屉 + 调用兼容 OpenAI 的 `/chat/completions`。

没有现成性能基线：无 Lighthouse 记录、无 bundle 分析脚本、无 `performance.mark`、无 CI 体积门槛。下文瓶颈全部来自**读代码**，标注为「假设」，需用第 4 节方法验证后再改。

关键体量（当前仓库实测）：

| 资产 | 实测大小 | 何时进入路径 |
| --- | --- | --- |
| 可执行源码 8 个 JS/Vue | ~77 KB / 2094 行 | 始终 |
| `src/templates/*.json` × 32 | **~896 KB** | `const.js` 用 `new URL(..., import.meta.url)` 引用；打开示例时 `fetch` |
| `src/templates/card.html` | 38 KB（含一份内嵌示例 JSON） | `?raw` 打进 JS 包；卡片视图与 `cardhtml` 导出 |
| `public/*.html` 示例页 | ~557 KB | 静态服务，不进 JS 主包，但影响仓库/部署体积 |
| 依赖 | `ant-design-vue`、`simple-mind-map`、themes、`pdfjs-dist@^3`、`jsonrepair` | 见 §3.1 |

`vite.config.js` 仅 `plugins: [vue()]`，无 `build.rollupOptions.manualChunks`、无压缩定制、无 `pdfjs` worker 本地化。

---

## 2. 用户可感知的热路径

按产品功能排序（不是按文件名）：

```
启动 → 创建 MindMap → 主题/布局/缩放
     → 节点编辑（data_change 持久化）
     → AI 生成（buildPrompt → fetch → extractIdeas → INSERT_MULTI_CHILD_NODE）
     → 简单/详细模式（整树深拷贝 + setData）
     → 导入导出（md/txt/png/pdf/cardhtml）
     → 卡片视图（Blob HTML + iframe 递归 DOM）
     → 上传知识库（pdfjs 逐页抽文本）
     → 移动端触摸（window 级 touch 监听）
```

AI 接口时延（数秒到 README 所说约 3 分钟）**不在前端可控范围**；前端只应避免：主线程卡死、重复请求、把巨大 prompt 同步塞进 Modal、无节流地写 `sessionStorage`。

---

## 3. 瓶颈假设（按优先级）

优先级：P0 = 很可能已影响真实用户；P1 = 中等图或移动端会痛；P2 = 启动体积/卫生问题。  
「如何验证」必须在改代码前跑一次，避免优化未测量点。

### P0-1 每次 `data_change` 同步整图写入 sessionStorage

**代码：** `src/App.vue` `onMounted` 内 `mindMap.on('data_change', ...)` → `saveMindMapData(data)` → `sessionStorage.setItem(MINDMAP_KEY, JSON.stringify(mapData))`（`src/storage.js`）。

**假设：** `simple-mind-map` 在拖拽、输入、插节点时会高频触发 `data_change`。模板图已达 **13–66 KB 源文件**，运行时对象含 uid/样式后更大。每次事件：

1. 主线程 `JSON.stringify` 整棵树
2. 同步写入 sessionStorage（有配额，约 5 MB/源）
3. 大图编辑时可能掉帧；配额满会 throw（已 catch 为 warn）

**如何测量：**

- Chrome Performance：编辑一个节点，看 `data_change` 次数与 `JSON.stringify` 自耗时。
- 在监听器临时打 `performance.now()` 差值（验证用，不要留在生产）。
- 用 `default3.json`（66 KB）与「仅根节点」对比。
- `sessionStorage` 长度：`sessionStorage.getItem('mindMapData').length`。

**验证通过的判据：** 单次按键/拖拽若 stringify > 5–8 ms，或 1 秒内 > 10 次写入，则确认。

**后续优化方向（本 PR 已落地 debounce 400 ms + 写前 JSON 相等则跳过 + `visibilitychange`/`pagehide` flush）。** `requestIdleCallback` 未叠加以避免与 debounce 竞态；超配额仍 catch，未切 IndexedDB。测试网见覆盖率文档 §7。

---

### P0-2 简单/详细模式：整树 `JSON.parse(JSON.stringify)` + `setData` + `view.reset`

**代码：** `src/utils.js` `switchTextNoteMode`；由 `App.vue` `toggleMindMapMode` 调用。

**假设：** 对每个节点拼接或剥离 `note`。实现先深拷贝整棵 `getData()`，再 DFS，再 `setData(out)` 并 `view.reset()`。这会：

- 复制所有 note 文本（课程模板 note 很长）
- 让 mind-map **整图重排+重绘**（`view.reset` 还会复位相机）

**如何测量：**

- 对 `course-learning5.json`（49 KB）与 `default3.json` 切换模式，Performance 里看 `setData` / layout 长任务（> 50 ms）。
- `performance.memory.usedJSHeapSize`（Chrome）看拷贝前后堆差。

**判据：** 切换引起 > 50 ms 长任务即成立。

**后续方向（本 PR 已落地）：** 抽出纯函数 `combineText`；不再二次深拷贝；优先 `updateData`（库内 `render`），否则 `setData`；**不再** `view.reset`。

---

### P0-3 启动包：顶层注册全部导出插件 + 全量 Ant Design + 主题包

**代码：**

- `src/utils.js` 顶部：`Export`、`ExportPDF`、`ExportXMind`、`TouchEvent`、`Drag`、`MindMapLayoutPro`、`Themes.init`，以及 `markdown` / `xmind` parse。
- `src/App.vue` 从 `ant-design-vue` 具名引入 Button/Input/Modal/Tabs/Upload/Drawer/…（仍可能带较大 runtime）。
- `src/main.js` 无异步分包。

**假设：** 用户即使从不导出 PDF/XMind，这些插件也在首屏解析。`pdfjs-dist` 虽在 `parser.js` 动态 import，但仍是依赖，可能被预构建。`simple-mind-map-plugin-themes` 的 `themeList` 在 `getThemeList()` 展开。

**如何测量：**

```bash
yarn build
npx vite-bundle-visualizer   # 或 rollup-plugin-visualizer，实现阶段再加
```

看 `dist/assets/*.js` gzip 体积；Lighthouse / DevTools Coverage 看首屏未执行字节。  
Network：冷加载（disable cache）DOMContentLoaded、主 JS 耗时。

**判据：** 主 chunk gzip > 300–400 KB，或 PDF/XMind 出现在入口 chunk。

**后续方向（本 PR 已落地动态 `import()`）：** 导出/导入插件在 `exportMindMap` / XMind·Markdown 导入时再加载；入口 gzip 从 604 KB 降到 343 KB，PDF/XMind 不在入口。Ant Design 未换库。`pdfjs-dist` 仍仅知识库路径动态 import，worker 改为本地打包。

---

### P0-4 AI 生成：主线程处理超大 JSON + 同步 Modal 展示完整 Prompt

**代码：** `src/libai.js` `buildPrompt`、`requestCompletions`（`max_tokens: 32000`）、`extractIdeas`（`JSON.parse` + `jsonrepair` + **`console.log('AI返回:', cleaned)`**）；`App.vue` `showLoading(..., Prompt全文)`，成功后再 `JSON.stringify(ideas)` 打日志。

**假设：**

1. Prompt 含 systemPrompt（上传文件最长 **20000** 字符，`parser.js` `clampLength`）+ thinking 模板，Modal `width: 1000` 同步渲染大文本，低端机掉帧。
2. 模型返回多层 JSON 数组，`jsonrepair` 在主线程跑。
3. `console.log` 大字符串会拖慢 DevTools，甚至卡死控制台。
4. `max_tokens: 32000` 放大响应体；解析后 `INSERT_MULTI_CHILD_NODE` 一次插入多节点，触发 P0-1 的 `data_change`。

**如何测量：**

- 用 fixture（合法 JSON、残缺 JSON、1 MB 伪响应）跑 `extractIdeas`，记 `performance.now()`。
- Performance：点「AI生成」到 Modal 出现的输入延迟。
- Network：请求/响应字节；是否 gzip。
- 生产环境确认 `console.log` 是否仍启用。

**判据：** `jsonrepair` > 50 ms，或 Loading Modal 打开 > 16 ms 输入延迟。

**后续方向（本 PR 已落地 Loading 去全文 + DEV 门控 `console.log`）。** `jsonrepair` Worker、降低 `max_tokens`、插入分批未做（见 §0.3）。

---

### P1-1 卡片视图：正则替换大模板 + 递归创建 DOM，无虚拟化

**代码：** `App.vue` `showCardModal`；`utils.js` `exportMindMap` 的 `cardhtml`；`src/templates/card.html` 内 `renderNodes` 递归 `createElement`。

流程：`getData(true)` → `JSON.stringify(..., null, 2)`（pretty-print 放大体积）→ 对 38 KB 的 `card.html` 做 `[\s\S]*?` 正则替换（模板里还嵌着一份完整示例 JSON）→ Blob URL → iframe。iframe 内对每个节点建 多层 DOM。

**假设：** 课程/代码生成类多节点图会导致：主线程 stringify+replace 卡顿；iframe 一次插入成百上千卡片；pretty-print 无必要。

**如何测量：** 打开卡片前后 Performance；iframe 内 `document.querySelectorAll('.card').length`；Blob 字节数。对比 `JSON.stringify(obj)` vs `null, 2`。

**判据：** 打开卡片 > 100 ms 或卡片数 > 200 时滚动掉帧。

**后续方向（本 PR 已落地模板去内嵌 + 非 pretty + `buildCardHtml`）。** iframe 内虚拟滚动未做。

---

### P1-2 PDF 知识库：逐页 await + CDN worker + 抽完全文再截断

**代码：** `src/parser.js` `extractTextFromPDF`。

```
动态 import pdfjs-dist/legacy/build/pdf.js
workerSrc = jsDelivr CDN 上的 pdf.worker.min.js   // 未钉版本
for i in 1..numPages: await getPage; await getTextContent
normalize + clampLength(20000)
```

**假设：**

1. 大 PDF 仍会解析所有页，即使只要前 20k 字符。
2. CDN worker 与 `pdfjs-dist@^3` **版本可能不一致**，且多一次 RTT；离线失败。
3. 循环是串行的，不能在达到 20k 时提前停。

**如何测量：** 10 页 / 50 页 PDF，Performance + Network（worker 脚本）。对比本地 worker。打点每页 `getTextContent`。

**判据：** 50 页中「超过 20k 之后的页」仍被解析；或 worker 下载 > 200 ms。

**后续方向（本 PR 已落地）：** 本地打包 worker；累计长度 ≥ 20k 时 break。未做页级并发。

---

### P1-3 触摸插件：window 级非 passive 监听

**代码：** `src/plugins/TouchEvent.js`。`window.addEventListener('touchstart|move|cancel|end', ..., { passive: false })`。虽有 `mindMap.el.contains(e.target)` early-return（修复官方插件拦截 Ant Design 的问题），**回调仍在每次触摸时运行**。`touchmove` 默认会 `preventDefault` 倾向（非 passive），可能阻塞页面滚动。`onTouchcancel` 为空但仍监听。双击用每次 `touchend` 的 300 ms `setTimeout`。

**如何测量：**

- 移动端或 DevTools 模拟：在 Select/Drawer 上滚动，看是否卡、是否 `preventDefault`。
- Event Listener 断点：容器外 touch 的回调耗时。
- 对比把监听绑在 `mindMap.el` 而非 `window`。

**判据：** 容器外 `touchmove` 仍进入 JS，或滚动出现明显 jank。

**后续方向（本 PR 已落地）：** 监听绑到 `el`；全部 `{ passive: true }`（本插件不 `preventDefault`）。容器外触摸单测保留。

---

### P1-4 复制/主题切换等路径上的深拷贝与整图 setTheme

**代码：**

- `cloneNodeData`：`JSON.parse(JSON.stringify(raw))` 再剥 uid（`App.vue`）。
- 主题 `watch` 六个字段，调用 `setTheme` / `setThemeConfig`（通常整图重绘）。
- `newMap`：`setData` + `view.reset`。
- 导出 `png`/`pdf`/`svg`：走库的光栅化，大图会卡（库内，但我们同步调用）。

**如何测量：** 切换主题、复制大子树、导出 PNG，看长任务。注意 watch：改 `theme` 时会写回 `backgroundColor` 等，可能二次触发（代码在 theme 分支 `return`，但仍要确认无抖动）。

**后续方向（本 PR 已落地主题 debounce 120 ms + `structuredClone`）。** 导出放 Worker 未做（库 API 同步）。

---

### P2-1 示例模板全部进入模块图

**代码：** `src/const.js` 中约 32 次 `new URL('./templates/xxx.json', import.meta.url).href`。

Vite 会把这些 JSON 当静态资产发出。抽屉里「打开: 示例」才 `fetch`，但 **URL 已打进包，构建要处理 ~896 KB**。存在疑似死文件 `bayesian-thinking1..json`（双点，24 KB），`const.js` 未引用。

**如何测量：** `yarn build` 后 `dist/assets` 是否出现全部模板；抽屉点开 Network 是否按需加载（预期按需，好的）以及构建时间。

**后续方向（本 PR 已落地）：** `import.meta.glob` 按需；删除未引用 `bayesian-thinking1..json`。未做「去 note 空白」产品决策。

---

### P2-2 其它体积与主线程噪音

| 点 | 位置 | 假设 | 测量 |
| --- | --- | --- | --- |
| `public/math*.html` + `amc801.html` | `public/` | ~557 KB 永远可下载，可能是卡片/课程静态副本 | 是否仍被链接；无引用则可移出发布物 |
| `#mindMapContainer { min-height: 1000px }` | `public/app.css` | 移动端多余滚动高度 | **已改为 `min-height/height: 100vh`** |
| 抽屉一次渲染全部 thinking model + 全部示例按钮 | `App.vue` 模板 | 8 个 model × 最多 12 个示例，初次打开 Drawer 的 VNode 成本 | **内容包在 `v-if="drawerOpen"` 内** |
| `iconList` 内联巨大 base64 SVG | `src/const.js` | 进主包 | bundle 分析 |
| `card.html` 内 `colors` 大数组 + 哈希循环 | 每张卡片 | 可忽略，除非节点极多 | 与 P1-1 一起测 |
| `importFileToMindMap` 对 json 一次 `file.text()` + `JSON.parse` | `utils.js` | 数 MB 的 .smm 会卡 | 用 2 MB fixture |

---

## 4. 测量方案（改代码前的基线）

建议固定 3 个数据集：

| 数据集 | 来源 | 用途 |
| --- | --- | --- |
| Tiny | `{ data: { text: '主题' }, children: [] }` | 下限 |
| Medium | `src/templates/note-taking2.json`（16 KB） | 日常 |
| Heavy | `src/templates/default3.json`（66 KB）或 `course-learning5.json`（49 KB） | 压力 |

**启动 / 包体**

1. `yarn build && ls -lh dist/assets`
2. `npx vite preview` + Lighthouse（Desktop + Mobile），记录 FCP、TBT、LCP
3. 加（未来）`rollup-plugin-visualizer` 产出 `stats.html`（不要放进本 plan PR 的应用配置）

**运行时**

1. Performance 面板：交互 2s，看 >50 ms 长任务，Bottom-Up 按 Self Time 排
2. 对 `saveMindMapData`、`switchTextNoteMode`、`extractIdeas`、`showCardModal`、`extractTextFromPDF` 打 `performance.mark/measure`（临时）
3. Rendering：Paint flashing、Layer borders（主题切换、模式切换时）
4. Memory 堆快照：模式切换前后、AI 插入前后

**网络**

- 冷加载瀑布图
- PDF worker 的 jsDelivr 请求
- AI `fetch` 的 payload 大小（可在 mock 服务上测）

**移动端**

- DevTools 中低端机 CPU 4× slowdown + 弱网
- 专门测 TouchEvent 与 Ant Select（历史 bug）

把数字记在后续性能 PR 描述里。没有数字的优化视为未完成。

---

## 5. 建议优化顺序（实现阶段）

与覆盖率工作交错。本 PR 按此表 1–9 落地（第 0 步基线见 §0.1）。

| 顺序 | 项 | 依赖测试 | 预期收益 | 本 PR |
| --- | --- | --- | --- | --- |
| 0 | 建立 §4 基线数字 | 无 | 决策依据 | `yarn build` 入口 gzip 604 KB |
| 1 | `data_change` debounce / idle 写入 | storage + App `data_change` 用例 | 编辑流畅 | **已做**（400 ms + flush；未叠 idle） |
| 2 | `switchTextNoteMode` 避免整树 reset | utils 单测锁行为 | 大图模式切换 | **已做** |
| 3 | 去掉生产路径大 `console.log`；Loading 不再塞满 prompt | libai / App AI 用例 | AI 完成瞬间不卡 DevTools | **已做** |
| 4 | 导出插件与 pdfjs 确认代码分割 | 导入导出单测仍 mock 动态模块 | 首屏 JS 下降 | **已做**（入口 gzip 343 KB） |
| 5 | 卡片模板去内嵌数据 + 非 pretty stringify | 卡片/导出单测 | 打开卡片更快 | **已做**（虚拟滚动未做） |
| 6 | PDF 提前 break + 本地 worker | parser mock + 一次手工大 PDF | 上传知识库 | **已做**（单测 5 页→2 页） |
| 7 | TouchEvent 缩小监听范围 | TouchEvent 容器内外用例 | 移动端滚动 | **已做** |
| 8 | 模板 URL 按需、删死文件 `bayesian-thinking1..json` | const/templates 解析测试 | 构建与仓库卫生 | **已做** |
| 9 | 主题 watch debounce | App 主题用例 | 拖动颜色选择器不抖 | **已做**（120 ms） |

**不要先做：** 重写 mind-map 引擎、上 WebGL、为 Ant Design 换库。库内部布局/绘制若仍是 Heavy 数据集上的主导成本，应向 `simple-mind-map` 查 `enableFreeDrag`、节点数量、折叠策略，而不是先改业务代码。

---

## 6. 指标建议（优化 PR 的验收）

无历史数字，故用相对值 + 上限：

| 指标 | 建议门槛（需基线后微调） |
| --- | --- |
| 主 JS gzip | **已记录：** 604 → **343 KB**；PDF/XMind 不在入口 |
| 编辑时 `saveMindMapData` | debounce 400 ms ⇒ ≤ ~2.5 次/秒；相同 payload 跳过写入 |
| 简单/详细切换 | 无二次深拷贝、无 `view.reset` |
| 卡片打开 | compact JSON + 模板 27.6→7.6 KB；未测 iframe 内绘制 |
| PDF 20k 截断 | **单测确认**超过 20k 后的页不再 `getPage` |
| Lighthouse TBT（预览、模拟 Moto G） | 本环境未跑；未作为回归门槛 |
| 回归 | `yarn test` 128 全绿；容器外触摸仍忽略 |

---

## 7. 风险与非目标

- 性能优化已按第 5 节顺序落地；未测量的 Lighthouse TBT / 真机长任务见 §0.3。
- 性能优化与 95% 覆盖率争抢同一批文件。本 PR **在覆盖率网之上改热路径**，并保持阈值。
- `sessionStorage` 在部分 WebView 配额更小，大图失败是功能+性能双重问题。
- PDF worker 已改为本地打包，不再默认请求 jsDelivr。
- 不把「AI 模型慢」算前端 bug；前端只保证请求期间 UI 可取消、不重复点击（已有 `isGenerating`）。

---

## 8. 源码对照速查

| 症状（假设） | 文件 | 符号 |
| --- | --- | --- |
| 编辑卡顿 / 存储配额 | `App.vue`, `storage.js` | `data_change`, `scheduleMindMapSave` |
| 模式切换整图闪烁 | `utils.js`, `App.vue` | `switchTextNoteMode`, `combineText`, `toggleMindMapMode` |
| 首屏 JS 大 | `utils.js`, `App.vue`, `main.js` | `ensureExportPlugins`, 具名 antd 导入 |
| AI 完成瞬间卡 | `libai.js`, `App.vue` | `extractIdeas`, `showLoading`, `debugLog` |
| 卡片打开慢 | `App.vue`, `card.html`, `utils.js` | `showCardModal`, `buildCardHtml` |
| PDF 上传慢 | `parser.js` | `extractTextFromPDF`, `clampLength` |
| 移动端滚动/下拉异常 | `TouchEvent.js` | `bindEvent`（`mindMap.el`） |
| 构建含全部示例 | `const.js` | `loadExampleTemplate`, `import.meta.glob` |
