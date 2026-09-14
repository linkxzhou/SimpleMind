# 规划文档索引

## 状态（对照 `main`，2026-09-14 审计）

对照仓库：https://github.com/linkxzhou/SimpleMind ，分支 **`main` @ `1e5cd4c`**。  
本目录仍是规划文档；**实现尚未合入 `main`**。

| 文件 | 相对 `main` 的落地情况 |
| --- | --- |
| [test-coverage-95.md](./test-coverage-95.md) | **未开始。** 无测试 runner、无测试文件；覆盖率 **0%**（无法跑 `vitest --coverage`）。 |
| [performance-analysis.md](./performance-analysis.md) | **几乎未开始。** P0 四项均未做；P1 仅 TouchEvent「画布外忽略」已存在（仍绑 `window`）；其余 P1/P2 未做。 |

| 文件 | 主题 |
| --- | --- |
| [test-coverage-95.md](./test-coverage-95.md) | 将测试覆盖率提升到 95% 的策略、缺口与落地顺序 |
| [performance-analysis.md](./performance-analysis.md) | 基于现有源码的性能问题分析、测量方法与优化优先级 |

建议阅读顺序：先覆盖率计划（建立可重复度量），再性能分析（用测试与基准验证瓶颈）。
