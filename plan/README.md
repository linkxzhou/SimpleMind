# 规划文档索引

覆盖率计划已在此前 PR 落地。性能分析的**实现**见 [performance-analysis.md](./performance-analysis.md) 第 0 节（包体前后对比与 P0–P2 状态）。

UI 美化文档是 **先不写代码 / plan only**：只加规划，不改 `src/`、`public/app.css` 或 Vue 模板。

| 文件 | 主题 | 状态 |
| --- | --- | --- |
| [test-coverage-95.md](./test-coverage-95.md) | 将测试覆盖率提升到 95% 的策略、缺口与落地顺序 | 已落地 |
| [performance-analysis.md](./performance-analysis.md) | 基于现有源码的性能问题分析、测量方法与优化优先级 | **P0–P2 实用项已落地**（见该文档 §0） |
| [ui-polish.md](./ui-polish.md) | 控件间距、chrome 颜色 token、工具栏/抽屉/设置布局与响应式 | **仅规划，未写代码** |

建议阅读顺序：先覆盖率（度量），再性能（已落地结果），再 UI 美化（在现有 100vh 画布与按需抽屉之上做间距/颜色，不要回退性能布局改动）。
