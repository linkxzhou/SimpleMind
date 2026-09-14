# UI 美化与间距规划

> **范围声明：先不写代码 / plan only。**  
> 本文件只根据 **当前 `main` 源码与截图** 记录界面结构、间距/颜色问题与落地顺序。本 PR **不改** `src/`、`public/app.css`、Vue 模板、Ant Design 主题实现或任何功能代码。

配套文档：[performance-analysis.md](./performance-analysis.md)（画布已改为 `100vh`、抽屉按需渲染；美化时不要回退这些布局相关优化）。

调查依据：`src/App.vue` 模板、`public/app.css`、`src/main.js`、`src/utils.js`（`getThemeList` / `Modal`）、`src/const.js`（`layouts` / `thinkingModels`）、`src/templates/card.html`、README 截图 `ScreenShot1.png` / `ScreenShot2.png` / `ScreenShot3.png`。下文只讨论**已经存在**的界面块，不发明属性面板、小地图、新导航或新功能入口。

---

## 0. 硬约束：工具栏控件顺序冻结

后续任何实现 PR **必须**遵守。违反即视为做错，与间距美化无关。

**顺序必须保持与当前 `App.vue` `.toolbar-inner` 完全一致**（用户给定的产品序列）：

```
[- 100% +] [<] [>] [+] [🗑] [↓] [⇅] [☰] [▦] [⚙] [AI生成]
```

对应现有控件（不得对调、不得删除、不得把某一项挪到条内其它位置或条外）：

| 序列位 | 现状 | 绑定 |
| --- | --- | --- |
| `[- 100% +]` | `.zoom-control`（`MinusOutlined`、百分比、`PlusOutlined`） | `zoomOut` / `zoomIn` |
| `[<]` | `LeftOutlined` | `back` |
| `[>]` | `RightOutlined` | `forward` |
| `[+]` | `FileAddOutlined` 然后 `PlusOutlined`（新建、增子节点；二者相对顺序也不变） | `newMap` / `addChildNode` |
| `[🗑]` | `DeleteOutlined` | `removeCurrentNode` |
| `[↓]` | `CloudDownloadOutlined` | `openExportPanel` |
| `[⇅]` | `SisternodeOutlined` | `toggleMindMapMode` |
| `[☰]` | `UnorderedListOutlined` | `showDrawer` |
| `[▦]` | `AppstoreOutlined` | `showCardModal` |
| `[⚙]` | `SettingOutlined` | `toggleSettings` |
| `[AI生成]` | `BulbOutlined` + 文案 | `aiGenerate` |

允许：

- 调整这些控件**之间的** `gap` / padding / 视觉分隔（分隔线只能插在相邻两项之间，不改变阅读顺序）
- 统一 `size`、颜色、圆角、半透明背景
- 继续使用已有 `mobile-hide` / `mobile-hide-text`（只隐藏缩放簇与 AI 文案，不删节点、不改剩余项顺序）

禁止：

- 重排、删除、合并进 overflow / 汉堡菜单、把部分按钮搬到另一条栏
- 把整条工具栏从桌面「顶中」或移动端「左上竖排」改到其它锚点（例如底栏、右侧、顶通栏 `header`）
- 为「分组」而打乱 DOM 顺序；若加 `.toolbar-group` wrapper，各组拼接后必须仍是上表顺序

下文 ASCII 与 P0–P3 均按此约束书写。

---

## 1. 当前 UI 画像（调查所得）

SimpleMind 是单页 SPA，**没有**独立 `header` / `footer` / 常驻 `sidebar`。整页由四层叠在一起：

| 层 | 实现 | 作用 |
| --- | --- | --- |
| 画布 | `#mindMapContainer` + `simple-mind-map` | 全屏导图 |
| 工具栏 | `.toolbar` → `.toolbar-inner` | 悬浮操作条（覆盖在画布上） |
| 浮层 | `a-drawer` / `a-modal` / `.context-menu` | 思考模版、设置/导入导出、卡片视图、右键菜单 |
| 反馈 | `utils.js` 的 `Modal.info` / `Modal.error` | Loading、错误 |

`src/main.js` 只 `createApp(App).mount('#app')`，**不**引入 Ant Design 全局 CSS 文件。Ant Design Vue 4 走 CSS-in-JS；唯一主题入口是根上的 `a-config-provider`，目前只传 `token.colorPrimary`。

没有 Vue `<style>` 块：自定义样式全部在 `public/app.css`（由 `index.html` 静态引用）。`App.vue` 里大量 **inline `style=`**，与 class 混用。

### 1.1 工具栏（已有控件，从左到右）

桌面端（`ScreenShot1.png`）：顶部水平居中的白底胶囊条。

| 控件 | 行为 | 尺寸/样式现状 |
| --- | --- | --- |
| `.zoom-control`：`MinusOutlined` / 百分比 / `PlusOutlined` | `zoomOut` / `zoomIn` | `size="small"` + `shape="circle"`；class `mobile-hide` |
| `LeftOutlined` / `RightOutlined` | `BACK` / `FORWARD` | 默认 `middle` 矩形图标按钮 |
| `FileAddOutlined` | `newMap` | 同上 |
| `PlusOutlined` / `DeleteOutlined` | 增/删当前节点 | 同上 |
| `CloudDownloadOutlined` | `openExportPanel`（打开设置 Modal 并切到 `export` tab） | 同上 |
| `SisternodeOutlined` | 详细/简单模式 | `type="primary"` 当 `isDetailMode` |
| `UnorderedListOutlined` | 打开思考模版 `a-drawer` | 默认 |
| `AppstoreOutlined` | 卡片视图 Modal | 默认 |
| `SettingOutlined` | 设置 Modal | 默认 |
| `BulbOutlined` + 文案 | `aiGenerate` | `type="primary"`，inline `padding: 4px 10px`；文案 class `mobile-hide-text` |

没有分组容器、没有分隔线。`.toolbar-inner` 的 `gap` 只有 **4px**，与默认 32px 高的 `a-button` 挤在一起（截图上按钮几乎贴边）。缩放簇内部 `gap: 2px`。美化只加大这些间隙，**不**改上表顺序。

### 1.2 画布

```css
#mindMapContainer { max-width: 100%; min-height: 100vh; height: 100vh; }
#mindMapContainer * { margin: 0; padding: 0; }
```

性能 PR 已把原来的 `min-height: 1000px` 改成视口高度，美化时应保留。`*` 重置可能误伤未来若把 Ant 控件放进容器的情况；当前容器内只有 mind-map DOM，可维持。

`body` 仅 `margin: 0`；`html lang=""`；没有 `overflow: hidden` / chrome 字体栈。

### 1.3 抽屉：思考模版（`a-drawer`）

- `placement="right"`，**固定 `width="400"`**
- `v-if="drawerOpen"` 包住列表（性能优化，美化时保留）
- 8 个 `thinkingModels`（任意、读书笔记、课程学习、第一性原理、费曼学习法、贝叶斯思维、批判性思维、代码生成）
- 每项：`a-card :bordered="false"` + `a-radio` + 规则文案 + 若干 `size="small"` 的「打开」按钮
- 间距全是 inline：`margin-bottom: 14px`、`margin-top: 8px`、`margin-left: 8px`、`font-weight: 600`

不是常驻侧栏，关掉即消失。不要规划成新的固定 Properties 面板。

### 1.4 设置 Modal（`a-modal` width=`800px`）

无标题、无 footer；`a-tabs` `centered` `type="line"`，五个已有 pane：

| `activeKey` | Tab | 内容（已有） |
| --- | --- | --- |
| `settings` | 设置 | 语言、API、秘钥、模型、生成最少节点数、主题、字体、连线风格、布局按钮网格 |
| `prompt` | 知识库 | `a-textarea` + 上传 + AI 扩写 |
| `export` | 导出 | 9 个格式按钮（`.chart-list`） |
| `import` | 导入 | 说明 + `a-upload` |
| `moreSettings` | 更多设置 | 原生 `<input type="color">` 画布/连线色、线宽、GitHub 链接 |

表单项几乎都是：

```html
<label/div class="field" style="flex-direction: row; align-items: center; gap: 8px;">
```

`.field` 在 CSS 里默认 **column + gap 8px + margin 4px 0**，又被 inline 改成 row。标签宽度不固定，控件宽度 120 / 150 / `flex:1` / 80px 混用。布局按钮与导出按钮共用 `.chart-list`（3 列、`gap: 4px`）。

### 1.5 其它浮层

| 浮层 | 尺寸 | 备注 |
| --- | --- | --- |
| 卡片视图 `a-modal` | `width="1000"`，iframe `height: 600px`，`body-style padding: 0` | 内容来自 `src/templates/card.html`（独立 stylesheet） |
| 右键 `.context-menu` | `min-width: 180px`，item `padding: 8px 12px` | 8 项已有操作；灰阶色写死 |
| Loading `Modal.info` | `width: 480` | 性能 PR 已从 1000 收窄 |
| Error `Modal.error` | 默认 | 无自定义 chrome |

### 1.6 Ant Design Vue 使用范围（不要扩大组件集）

`App.vue` 显式引入：`ConfigProvider`、`Button`、`Input`、`InputNumber`、`Textarea`、`Select`/`SelectOption`、`Modal`、`Tabs`/`TabPane`、`Upload`、`Drawer`、`Radio`、`Card`。  
`utils.js` 额外用 `Modal`。图标来自 `@ant-design/icons-vue`。

**未使用**：`Layout`、`Menu`、`Form`、`Space`、`Divider`、`ColorPicker`、`locale`、`algorithm`、`componentSize`。规划里若提到它们，只作为**可选实现手段**去整理已有控件，不是新功能。

---

## 2. 问题诊断（对照用户目标）

用户目标：**(1) 美化样式，尤其控件间距；(2) 整体颜色与布局。**

### 2.1 间距 / 密度：没有系统，只有散落数字

当前数字一览（全部写死）：

| 位置 | 值 | 观感 |
| --- | --- | --- |
| `.toolbar-inner` `gap` / `padding` | 4px / 6×8px | 桌面工具栏过密 |
| `.zoom-control` `gap` | 2px | 缩放与百分比挤在一起 |
| `.chart-list` `gap` | 4px | 布局/导出按钮过密 |
| `.field` `gap` / `margin` | 8px / 4px | 设置行之间偏紧，且与 inline `gap: 8px` 重复 |
| 抽屉卡片 `margin-bottom` | 14px | 与其它 8/4 不成倍数 |
| 右键 item padding | 8×12 | 尚可，但与工具栏密度不统一 |
| 卡片 Modal loading | padding 8px，文案 `margin-top: 10px` | 10px 落在 8 栅格外 |
| AI 按钮 | `padding: 4px 10px` | 10px 落在 8 栅格外；高度仍接近 `middle` |

控件密度不一致：缩放是 `small` 圆钮，工具栏其余是默认 `middle`，设置里又大量 `small`。同一条工具栏出现 24px 与 32px 混高。

### 2.2 颜色：chrome 与画布两套体系，且 chrome 无 token

| 体系 | 谁控制 | 现状 |
| --- | --- | --- |
| 画布主题 | `simple-mind-map-plugin-themes` + `settings.theme`（默认 `mint`） | 节点填充、连线、背景；主题项可带 `dark` |
| 画布覆盖 | `setThemeConfig`：`backgroundColor` / `lineColor` / `lineWidth` / `lineStyle` / `fontFamily` | 「更多设置」里可改 |
| 控件主色 | `a-config-provider` → `colorPrimary: themeRootFillColor \|\| '#00c0b8'` | 根节点 fill 为白时强制回退 `#00c0b8` |
| 工具栏 / 右键 | `public/app.css` 写死白底、`#eee`、`#e5e7eb`、`#374151`、`#f3f4f6` | **不随**画布主题或 `colorPrimary` 变 |
| 原生 color input | `border: 1px solid #d9d9d9` | Ant 默认边框色，未走 token |

**没有应用级 light/dark 开关。** `item.dark` 只影响主题下拉选项的文字颜色，以及 mind-map 画布；工具栏始终白底。选深色画布主题时（截图 2 的青绿底 + 白胶囊条）chrome 会「浮」在画布上，但不跟随变暗。

默认色还有一处不一致（美化时顺手对齐，仍属样式而非新功能）：

- `settings` 初始 `lineColor: '#43a047'`
- 「恢复默认」与 `getThemeList()` 默认项：`'#549688'`
- 画布背景恢复默认 `'#ffffff'`，而默认主题项背景是 `'#f5f5f5'`

### 2.3 布局：悬浮条位置与顺序冻结；可调的是疏密与浮层宽度

桌面：水平居中 overlay 符合「画布优先」，**保持顶中、保持 §0 顺序**。缺的是控件之间的呼吸感，以及与画布主色的轻微呼应（半透明/描边），不是再做一条占高度的顶栏，也不是重排按钮。

移动端（`max-width: 600px`，`ScreenShot3.png`）：工具栏在左上、**纵向堆叠（顺序与桌面相同）**。这是现有锚点，**不要搬到底部或其它边**。`zoom-*` 被 `mobile-hide` 掉（捏合缩放仍由 `TouchEvent` 负责）。按钮 `width: 100%`，但父级 shrink-wrap，实际是一列图标轨。可做的只是加大竖向 `gap`、收 padding；不能靠挪走工具栏来「让出」画布。

浮层问题仍在（与工具栏顺序无关）：设置 `800px` / 抽屉 `400px` / 卡片 `1000px` **没有**随断点改宽，手机上会溢出或几乎全屏却仍按桌面 padding。

---

## 3. 建议的间距系统（落地时用，本 PR 不写）

以 **4px 基准** 收拢现有 2/4/6/8/10/14 散值。只用于 chrome（工具栏、抽屉、Modal、右键、`.field`、`.chart-list`），**不要**改 mind-map 节点内部间距。

建议 token（名字仅规划，实现时可放 `:root` 或 `a-config-provider` 的 `token`）：

| Token | 值 | 用途 |
| --- | --- | --- |
| `--space-1` | 4px | 图标钮内边距微调、网格最小间隙下限 |
| `--space-2` | 8px | **控件默认 gap**（按钮与按钮、label 与 control） |
| `--space-3` | 12px | **分组 gap**、工具栏内部分隔、抽屉卡片之间 |
| `--space-4` | 16px | 工具栏相对视口的边距、Modal body 内边距 |
| `--space-5` | 24px | 仅大块分区（设置 tab 内「API 一组 / 画布一组」若做视觉分组） |

Ant Design Vue 4 可同步：

- `token.marginXS = 8`、`paddingContentHorizontal = 16` 等（实现时对照官方 token 表，不要盲改）
- 或根上 `componentSize: 'small'`，让工具栏与设置控件同一密度

**目标密度（桌面工具栏，顺序见 §0，不可改）：**

- 相邻控件 `gap: 8px`（可把部分相邻对做成 12px，形成「视觉分组」，但中间不得插入其它按钮）
- 可选：在**现有相邻对**之间加 1px 竖线，不改变 DOM 次序
- `.toolbar-inner` padding `8px 12px`
- 全部工具栏按钮统一 `size="small"`（缩放保持 `circle`）
- AI 主按钮与其它 small 同高，去掉 `padding: 4px 10px`，用 class

**目标密度（设置表单）：**

- 标签列固定宽度（中文约 7em / 或 `minmax(7em, 9em)`），控件 `flex: 1`
- 行间距 `12px`，不再 `margin: 4px` + 重复 inline gap
- `.chart-list` `gap: 8px`；窄屏 2 列已有，保留

---

## 4. 建议的颜色 token（chrome only）

画布颜色继续走 `simple-mind-map` 主题，**不要**用 CSS 去画节点。Chrome 从硬编码抽成变量，并与 `colorPrimary` 对齐。

### 4.1 默认（浅色 chrome，对应当前白工具栏）

| Token | 建议初值 | 对应现状 |
| --- | --- | --- |
| `--color-primary` | `#00c0b8`（被 `themeRootFillColor` 覆盖） | ConfigProvider |
| `--chrome-bg` | `#ffffff` / `rgba(255,255,255,0.92)` | `.toolbar-inner` |
| `--chrome-border` | `#eee` → 可改为 `colorBorder` 或 `rgba(0,0,0,0.06)` | 工具栏边框 |
| `--chrome-shadow` | 现有 `0 8px 24px rgba(0,0,0,0.06)` | 保留，略加强分隔即可 |
| `--chrome-text` | `#374151`（右键已用） | 菜单与百分比文字 |
| `--chrome-hover` | `#f3f4f6` | `.menu-item:hover` |
| `--chrome-divider` | `#f0f0f0` | 工具栏分组线（新，仅样式） |

可选：`backdrop-filter: blur(8px)` 让白条在彩色画布上不那么「一块瓷砖」。注意：这是现有 `.toolbar-inner` 的视觉，不是新组件。

### 4.2 Dark chrome：**当前不存在，P2 可选，不要当 P0**

仅当选中主题 `item.dark === true` 时，才考虑：

- `ConfigProvider` 增加 `algorithm: theme.darkAlgorithm`
- `--chrome-bg` / 边框 / 文字改深色

风险：Ant 浮层、原生 `<input type="color">`、卡片 iframe（自身 `#f5f7fa`）不会自动一致。P0/P1 **不**做应用级暗色开关，以免范围膨胀。

### 4.3 不纳入本主题系统

- `card.html` 内部哈希配色数组（科技/教育/儿童/可爱）——独立文档流，见 §9
- 节点 `fillColor` / 连线色算法
- 新增一套与 `mint` 无关的品牌色

---

## 5. 布局结构与线框

原则：**继续画布全屏 + chrome 悬浮**；工具栏**锚点与控件顺序冻结**（§0）。只加大间隙、可选视觉分隔；不增加新面板，不把工具栏搬到其它边。

### 5.1 桌面 — 当前

```
┌──────────────────────────────────────────────────────────────────────────┐
|                                                                          |
|          ┌─ .toolbar (fixed, top:16px, center, z-index:100) ─┐           |
|          │ [- 100% +][<][>][+][🗑][↓][⇅][☰][▦][⚙][AI生成] │           |
|          │   gap:4px, mixed small-circle + middle buttons     │           |
|          └────────────────────────────────────────────────────┘           |
|                                                                          |
|                    #mindMapContainer  (100vh × 100%)                     |
|                         simple-mind-map 画布                              |
|                                                                          |
└──────────────────────────────────────────────────────────────────────────┘

浮层（互斥或叠加，均已存在）：
  a-drawer  右 400px   思考模版
  a-modal   800px      设置 / 导入导出 / 知识库 / 更多设置
  a-modal   1000px     卡片视图 iframe
  .context-menu        节点右键
```

### 5.2 桌面 — 建议（同一顺序，只加 gap）

顺序与当前完全相同；竖线仅为可选 CSS 分隔，可省略。禁止把 `[AI生成]` 提前、禁止抽走 `[⚙]` 等。

```
┌──────────────────────────────────────────────────────────────────────────┐
|                                                                          |
|     ┌──────────── .toolbar-inner  仍 top-center overlay ────────────┐    |
|     │ [- 100% +]  [<] [>]  [+] [🗑]  [↓]  [⇅] [☰] [▦]  [⚙]  [AI生成] │    |
|     │  ^ 顺序冻结；仅 gap 4px→8px（部分相邻可用 12px 做视觉分组）      │    |
|     └───────────────────────────────────────────────────────────────┘    |
|                                                                          |
|                    #mindMapContainer  仍 100vh，不被顶栏挤压              |
|                                                                          |
└──────────────────────────────────────────────────────────────────────────┘
```

若用 `.toolbar-group` / `a-space` / `Divider type="vertical"`，只允许包住**连续的现有按钮**，拼接后仍是：

`[- 100% +] [<] [>] [+] [🗑] [↓] [⇅] [☰] [▦] [⚙] [AI生成]`

不要改成占满宽度的 `a-layout-header`：会吃掉画布，且等于把工具栏搬离当前 overlay 锚点。

### 5.3 移动端 — 当前（`max-width: 600px`）

左上竖排，自上而下顺序与桌面相同（缩放因 `mobile-hide` 不显示，剩余项相对顺序不变）：

```
┌─────────────────────────────┐
| ┌──┐                        |
| │< │                        |
| │> │                        |
| │+ │   #mindMapContainer    |
| │🗑│   左上竖轨（现锚点）    |
| │↓ │                        |
| │⇅ │                        |
| │☰ │                        |
| │▦ │                        |
| │⚙ │                        |
| │AI│  （无文字，mobile-hide-text）
| └──┘  [- 100% +] 已 mobile-hide
|                             |
└─────────────────────────────┘
```

抽屉 400px、设置 800px 在窄屏不适应（改浮层宽度，不改工具栏位置）。

### 5.4 移动端 — 建议（锚点与顺序不变）

**不要**改成底栏或其它边。仍是左上 `.toolbar`，同一 DOM 顺序；只把竖向 `gap` 从 4px 提到 8px，并略增 padding。

```
┌─────────────────────────────┐
| ┌──┐                        |
| │< │  gap 8px               |
| │> │                        |
| │+ │   #mindMapContainer    |
| │🗑│   仍左上竖排            |
| │↓ │   顺序与 §0 相同        |
| │⇅ │                        |
| │☰ │                        |
| │▦ │                        |
| │⚙ │                        |
| │AI│                        |
| └──┘                        |
|                             |
└─────────────────────────────┘
```

浮层宽度建议（CSS / 现有组件 props，不是新页面，也不是工具栏搬家）：

| 组件 | 建议 |
| --- | --- |
| `a-drawer` | `width` 在 ≤600px 用 `100%` 或 `min(400, 100vw)` |
| 设置 `a-modal` | `width: min(800px, calc(100vw - 32px))`；tab 过多时允许横向滚 tab（已有五个 tab，不要删） |
| 卡片 `a-modal` | 同左；iframe 高度 `min(600px, 70vh)` |
| `.chart-list` | 保持已有 2 列 |

### 5.5 设置 Modal 内部 — 当前 vs 建议

当前（标签长短不一，控件参差）：

```
语言：          [简体中文 ▾]
API Base：      [............................]
秘钥：          [............................]
模型：          [............................]
生成最少节点数：[  5  ]
主题：          [ mint ▾ ]
字体：          [ .... ▾ ]
连线风格：      [ 曲线 ▾ ]
布局：
[思维导图][逻辑结构图][组织结构图]
[目录组织图][时间轴][鱼骨图]     ← gap 4px
```

建议（同一字段，标签列对齐，分组用间距而不是新 tab）：

```
── 接口 ─────────────────────────────
语言               [简体中文 ▾]
API Base           [                    ]
秘钥               [                    ]
模型               [                    ]
生成最少节点数     [ 5 ]

── 画布（仍是 settings tab 内已有项）──
主题               [ mint ▾ ]
字体               [ .... ▾ ]
连线风格           [ 曲线 ▾ ]
布局               网格 gap 8px，选中 primary（已有逻辑）
```

「更多设置」里的原生 color input 可换成 Ant Design Vue 4 已有的 `ColorPicker`（可选，P2）：只替换同一绑定 `settings.backgroundColor` / `lineColor`，不要新设置项。P0 用 class 统一高度/边框即可。

抽屉列表：去掉 inline margin，改 `.thinking-item { margin-bottom: 12px; }`；「打开」按钮与说明之间用 `gap: 8px` 的 flex wrap，避免每条 `p` + `margin-left`。

---

## 6. 响应式要点

现有断点只有 **一处**：`@media (max-width: 600px)`。保持单一断点，避免再引入一套 768/1024 除非工具栏在平板中间宽度换行溢出。

建议补的行为（仍属现有 chrome）：

| 宽度 | 工具栏（顺序冻结，见 §0） | 浮层 |
| --- | --- | --- |
| \> 600px | 仍顶中、水平；只加大 gap | 抽屉 400；设置 800；卡片 1000 |
| ≤ 600px | 仍左上竖排；继续 `mobile-hide` 缩放与 AI 文案；只加大竖向 gap | 抽屉/Modal 不超过 `100vw - 32px` |

中间宽度（601–900px）：顶栏按钮多，可能溢出视口。P1 检查：若 `toolbar-inner` 宽于 `100vw - 32px`，允许 `max-width: 100vw` + `overflow-x: auto`（**仍是同一条、同一顺序**），不要改成两行、不要拆到两侧。

`TouchEvent` 已绑在 `mindMap.el` 且容器外放行：工具栏必须留在 `#mindMapContainer` **外面**（现状：兄弟节点）。不要把按钮搬进画布容器。

---

## 7. 优先落地步骤（后续实现 PR，本仓库本 PR 不执行）

只动 `public/app.css` + `App.vue` 模板 class / 少量 `a-config-provider` token；能 CSS 解决的不改 JS 逻辑。  
**每一步都不得改工具栏控件顺序或锚点**（§0）：

```
[- 100% +] [<] [>] [+] [🗑] [↓] [⇅] [☰] [▦] [⚙] [AI生成]
```

### P0 — 间距与工具栏密度（对用户目标 1 最直接）

1. 在 `public/app.css` 建 `:root` 间距变量；`.toolbar-inner` 的 `gap` 从 4px 调到 8px（部分相邻间隙可用 12px）；padding 改为 `8px 12px`。**只改数字，不改 flex 子项顺序。**
2. 可选：用 class 包**连续**已有按钮为 `.toolbar-group`，或在相邻项之间加竖线。拼接顺序必须仍是 §0；**不增删按钮、不改 `@click`、不重排。**
3. 工具栏 `a-button` 统一 `size="small"`；删除 AI 按钮 inline padding。按钮仍停在原序列位。
4. `.chart-list` gap 4→8；`.field` 抽 `.field-row`，消灭重复 inline flex。（设置面板，与工具栏顺序无关。）
5. 抽屉卡片间距 14→12，inline 改 class。

验收：对照 `ScreenShot1.png`，从左到右仍是 `[- 100% +] [<] [>] [+] [🗑] [↓] [⇅] [☰] [▦] [⚙] [AI生成]`，仅间距更大；桌面操作路径不变。

### P1 — 浮层宽度与窄屏密度（用户目标 2 的布局部分）

1. ≤600px：**保持左上竖排与同一顺序**；只加大竖向 gap。禁止改成底栏、右侧轨或顶通栏。继续 `mobile-hide` 缩放与 AI 文案。
2. 抽屉 / 两个 Modal 的宽度与卡片 iframe 高度随视口限制（改浮层，不改工具栏）。
3. 设置表单标签列对齐；tab 内容 `padding` 用 `--space-4`。
4. 工具栏半透明 + 可选 blur，让彩色画布透出来一点（仍 overlay 在原位置）。

验收：对照 `ScreenShot3.png`，左轨控件顺序不变；设置/抽屉在窄屏可完整操作。

### P2 — 颜色 token 与轻量主题对齐（用户目标 2 的颜色部分）

1. chrome 颜色进 CSS 变量；`colorPrimary` 继续跟 `themeRootFillColor`。
2. 右键菜单改用同一套 `--chrome-*`，去掉另一套灰阶。
3. 对齐 `lineColor` / 背景「默认值」与 `getThemeList()`（`#549688` / `#f5f5f5` 或统一文档化）。
4. **可选**：`theme.dark` 时给 ConfigProvider `darkAlgorithm` + chrome 深色变量。独立小 PR，需目视过设置/抽屉/右键。

### P3 — 收尾（不阻塞 P0/P1）

1. `index.html` `lang` 随 `settings.language`（偏 i18n，严格说不是美化；可另开）。
2. `card.html` 间距/页边：独立，见 §9。
3. 若采用 `componentSize: 'small'`，回归所有 Modal 内按钮。

每步落地后跑现有 `yarn test`（`tests/App.spec.js` 会点 `.chart-list button`、测工具栏命令；**不要改 class 名到测不到**，或同步测试选择器）。无视觉回归套件，需用桌面 + 600px 人工对照 README 三张截图场景。

---

## 8. 风险

| 风险 | 说明 | 缓解 |
| --- | --- | --- |
| 误重排工具栏 | 加 `.toolbar-group` / `a-space` 时把 DOM 子项挪了 | 实现前对照 §0 序列；code review 禁止改 `.toolbar-inner` 子项次序；验收用从左到右（移动端从上到下）读一遍 |
| 误搬家工具栏 | 把条改到底部/顶通栏/右侧 | P1 明确禁止；只改 `gap`/`padding`/颜色 |
| 工具栏变宽溢出 | gap 加大后桌面条更长 | `max-width: calc(100vw - 32px)` + **同一条**横向 scroll；不要拆成两行或两列 |
| 统一 `small` 点热区变小 | 移动端左轨尤其敏感 | 左轨按钮保持 ≥32px 点击高（padding 补），不必用 Ant `middle` |
| `backdrop-filter` | 旧 WebView 无效果或掉帧 | 纯增强；无 blur 时仍有实心 `--chrome-bg` |
| 暗色 algorithm | 与始终白的工具栏、卡片 iframe、原生 color input 分裂 | P2 可选；默认不做 |
| `#mindMapContainer *` 重置 | 以后若把 Ant 放进画布会错 | 美化阶段不要往容器里塞 chrome |
| TouchEvent | 若把按钮放进画布会吞手势 | 保持 toolbar 为 `#app` 下、容器外的兄弟节点（现状） |
| 测试选择器 | `.chart-list`、toolbar 行为单测 | 保留这些 class；分组只加 wrapper，不改顺序 |
| 性能文档已改 `100vh` / 抽屉 `v-if` | 美化误改回 `min-height: 1000px` 或去掉懒渲染 | 明确禁止回退 |
| inline → class | 模板 diff 大，但逻辑不变 | 一次抽 `.field-row`，避免改绑定 |

---

## 9. 明确不在范围

本规划与后续美化 PR **都不做**：

- **重排、删除或挪动工具栏控件**（§0 序列冻结）；包括改成底栏、汉堡折叠、把 AI/设置拆到别处
- 新功能：快捷键面板（locale 有 `shortcuts` 但模板未用）、展开/收起全部子节点、属性检查器、小地图、新侧栏
- 改 `thinkingModels` / `layouts` / 模型列表 / AI prompt
- 重画 `simple-mind-map` 节点、连线算法、主题包内容
- 替换 Ant Design Vue 或 mind-map 库（性能计划已排除）
- 为 chrome 做独立「浅色/深色」用户开关（仅可选跟随 `item.dark`）
- 大改 `src/templates/card.html` 配色引擎（卡片视图是独立 HTML；最多 P3 调 padding，且单独 PR）
- 改 `public/math*.html` 等静态页
- 本 PR 写任何 CSS/Vue/功能代码

---

## 10. 建议的后续 PR 切分

1. **polish-spacing**：P0（css 变量 + 工具栏 **仅 gap** + field/chart-list/drawer 间距；顺序不变）
2. **polish-responsive**：P1（浮层宽度 + 窄屏竖轨 gap；**不搬家工具栏**）
3. **polish-tokens**（可选）：P2 颜色变量与默认色对齐；暗色 chrome 再视情况拆第 4 个 PR

切分理由：间距可单独目视验收；浮层宽度与工具栏顺序解耦；颜色/暗色独立回滚。
