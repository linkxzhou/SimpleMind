# 规划文档索引

覆盖率计划已在此前 PR 落地。性能分析的**实现**见 [performance-analysis.md](./performance-analysis.md) 第 0 节（包体前后对比与 P0–P2 状态）。

UI 美化规划来源：[PR #22](https://github.com/linkxzhou/SimpleMind/pull/22) / `cursor/ui-polish-plan-b7c5`。本目录索引随实现更新状态。

| 文件 | 主题 | 状态 |
| --- | --- | --- |
| [test-coverage-95.md](./test-coverage-95.md) | 将测试覆盖率提升到 95% 的策略、缺口与落地顺序 | 已落地 |
| [performance-analysis.md](./performance-analysis.md) | 基于现有源码的性能问题分析、测量方法与优化优先级 | **P0–P2 实用项已落地**（见该文档 §0） |
| [ui-polish.md](./ui-polish.md) | 控件间距、chrome 颜色 token、抽屉/设置布局与响应式；**工具栏顺序冻结**（只允许改 gap） | **P0–P2 已落地**（P3 与暗色 algorithm 按计划推迟） |

建议阅读顺序：先覆盖率（度量），再性能（已落地结果），再 UI 美化（在现有 100vh 画布与按需抽屉之上做间距/颜色，不要回退性能布局改动）。实现 UI 时必须遵守 [ui-polish.md](./ui-polish.md) §0：工具栏顺序冻结，只允许改 gap。
