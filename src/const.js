export const thinkingModels = [
    {
        label: '无',
        value: 'default',
        example: ``
    },
    {
        label: '第一性原理',
        value: 'first-principles',
        example: `A：定义目标
B：列出基本真理/不可再分的事实
C：明确约束与资源边界
D：基于A-B-C重构解法
E：推导关键模块与度量
流程：A -> B -> C -> D -> E`
    },
    {
        label: '数学归纳法',
        value: 'mathematical-induction',
        example: `A：基础步（n=1）证明成立
B：归纳假设（n=k）假设命题成立
C：归纳步（由n=k推到n=k+1）
D：得出对所有n成立的结论
E：提炼结构/指标用于推广
流程：A -> B -> C -> D -> E`
    },
    {
        label: '演绎法',
        value: 'deductive-reasoning',
        example: `A：列出前提（可验证且适用）
B：选择有效的逻辑规则
C：推导结论
D：一致性与事实检验
E：落地为措施/工件
流程：A -> B -> C -> D -> E`
    },
    {
        label: '归纳法',
        value: 'inductive-reasoning',
        example: `A：定义总体与目标规律
B：采样与数据收集
C：识别模式与异常
D：形成归纳命题
E：设计验证与迭代
流程：A -> B -> C -> D -> E`
    },
    {
        label: '溯因法',
        value: 'abductive-reasoning',
        example: `A：明确现象
B：枚举可能解释
C：基于先验/成本/影响排序
D：设计验证测试（排除/支持）
E：暂定最佳解释并更新
流程：A -> B -> C -> D -> E`
    },
    {
        label: '类比推理',
        value: 'analogical-reasoning',
        example: `A：选择源域与目标域
B：建立结构映射
C：识别差异与约束
D：迁移方案并校正
E：验证与迭代
流程：A -> B -> C -> D -> E`
    },
    {
        label: '因果推理',
        value: 'causal-reasoning',
        example: `A：构建因果图（DAG）
B：设计识别策略（随机化/工具变量/断点）
C：收集数据并执行实验
D：估计因果效应（ATE/CATE）
E：稳健性与反事实检验
流程：A -> B -> C -> D -> E`
    },
    {
        label: '反事实思维',
        value: 'counterfactual-thinking',
        example: `A：定义反事实问题
B：构造对照（匹配/合成控制）
C：估计反事实结果
D：检验（平行趋势/安慰剂/断点）
E：解释与政策含义
流程：A -> B -> C -> D -> E`
    },
    {
        label: '系统思维',
        value: 'systems-thinking',
        example: `A：界定系统边界与要素
B：识别反馈环与滞后
C：定位杠杆点
D：设计干预与原型
E：监测指标并调整
流程：A -> B -> C -> D -> E`
    },
    {
        label: 'MECE与金字塔原理',
        value: 'mece-pyramid-principle',
        example: `A：结论先行
B：MECE拆解论据
C：收集并组织证据
D：金字塔结构表达
E：复盘与迭代
流程：A -> B -> C -> D -> E`
    },
    {
        label: '贝叶斯思维',
        value: 'bayesian-thinking',
        example: `A：设定先验
B：定义似然并观测证据
C：计算后验
D：在代价函数下做决策/设阈值
E：在线更新与复盘
流程：A -> B -> C -> D -> E`
    },
    {
        label: '期望效用与成本-收益分析',
        value: 'expected-utility',
        example: `A：明确备选方案
B：评估收益/成本/风险
C：计算期望效用与风险度量
D：做敏感性分析
E：选择占优方案并记录
流程：A -> B -> C -> D -> E`
    },
    {
        label: '风险与敏感性分析',
        value: 'risk-sensitivity-analysis',
        example: `A：列关键不确定性
B：构造情景（悲观/基准/乐观）
C：仿真与区间估计（如蒙特卡洛）
D：识别敏感变量与驱动因素
E：制定应对预案与触发条件
流程：A -> B -> C -> D -> E`
    },
    {
        label: '博弈论思维',
        value: 'game-theory-thinking',
        example: `A：定义参与者与信息结构
B：列策略空间与支付矩阵
C：求解均衡/最优回应
D：设计承诺与机制（激励/约束）
E：动态更新与复盘
流程：A -> B -> C -> D -> E`
    },
    {
        label: '反向思维',
        value: 'inversion-thinking',
        example: `A：定义失败的充要条件
B：列出导致失败的路径
C：设计防线与检查点
D：建立预警指标与演练
E：持续监控与改进
流程：A -> B -> C -> D -> E`
    },
    {
        label: '设计思维',
        value: 'design-thinking',
        example: `A：同理用户
B：定义问题
C：发散创意
D：制作原型
E：测试与迭代
流程：A -> B -> C -> D -> E`
    },
    {
        label: '科学方法与实验思维',
        value: 'scientific-method',
        example: `A：提出可检验假设
B：设计控制实验
C：执行并收集样本
D：分析与统计检验
E：复现与推广
流程：A -> B -> C -> D -> E`
    },
    {
        label: '批判性思维',
        value: 'critical-thinking',
        example: `A：明确主张与论证结构
B：收集并核验证据
C：识别假设与常见谬误
D：提出替代解释与反例
E：形成审慎结论与建议
流程：A -> B -> C -> D -> E`
    }
]

export const layouts = [
    { key: 'mindMap', name: '思维导图' },
    { key: 'logicalStructure', name: '逻辑结构图' },
    { key: 'organizationStructure', name: '组织结构图' },
    { key: 'catalogOrganization', name: '目录组织图' },
    { key: 'timeline', name: '时间轴' },
    { key: 'fishbone', name: '鱼骨图' }
]