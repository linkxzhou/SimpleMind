import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

// 多语言消息源
export const messages = {
    'zh-CN': zhCN,
    'en-US': enUS,
}

// 语言选择项（用于设置面板）
export const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' },
]

export const layouts = [
    { 
        key: 'mindMap', 
        name: '思维导图',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="2"/><path d="M12 9V5" stroke="currentColor" stroke-width="2"/><path d="M12 15V19" stroke="currentColor" stroke-width="2"/><path d="M9 12H5" stroke="currentColor" stroke-width="2"/><path d="M15 12H19" stroke="currentColor" stroke-width="2"/></svg>'
    },
    { 
        key: 'logicalStructure', 
        name: '逻辑结构图',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="4" height="4" rx="1" stroke="currentColor" stroke-width="2"/><path d="M8 12H12" stroke="currentColor" stroke-width="2"/><path d="M12 6V18" stroke="currentColor" stroke-width="2"/><path d="M12 6H16" stroke="currentColor" stroke-width="2"/><path d="M12 12H16" stroke="currentColor" stroke-width="2"/><path d="M12 18H16" stroke="currentColor" stroke-width="2"/></svg>'
    },
    { 
        key: 'organizationStructure', 
        name: '组织结构图',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="4" width="4" height="4" rx="1" stroke="currentColor" stroke-width="2"/><path d="M12 8V12" stroke="currentColor" stroke-width="2"/><path d="M6 12H18" stroke="currentColor" stroke-width="2"/><path d="M6 12V16" stroke="currentColor" stroke-width="2"/><path d="M12 12V16" stroke="currentColor" stroke-width="2"/><path d="M18 12V16" stroke="currentColor" stroke-width="2"/></svg>'
    },
    { 
        key: 'catalogOrganization', 
        name: '目录组织图',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="4" rx="1" stroke="currentColor" stroke-width="2"/><path d="M6 8V18" stroke="currentColor" stroke-width="2"/><path d="M6 12H10" stroke="currentColor" stroke-width="2"/><rect x="10" y="10" width="10" height="4" rx="1" stroke="currentColor" stroke-width="2"/><path d="M6 18H10" stroke="currentColor" stroke-width="2"/><rect x="10" y="16" width="10" height="4" rx="1" stroke="currentColor" stroke-width="2"/></svg>'
    },
    { 
        key: 'timeline', 
        name: '时间轴',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12H21" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="12" r="2" fill="currentColor"/></svg>'
    },
    { 
        key: 'fishbone', 
        name: '鱼骨图',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12H21" stroke="currentColor" stroke-width="2"/><path d="M18 12L14 6" stroke="currentColor" stroke-width="2"/><path d="M14 12L10 18" stroke="currentColor" stroke-width="2"/><path d="M10 12L6 6" stroke="currentColor" stroke-width="2"/></svg>'
    }
]

// 推理模型选择项（用于设置面板）
export const thinkingModels = [
    {
        label: '任意',
        value: 'default',
        description: '通用总结方法',
        prompt: `
- 先问：我到底要解决什么？（中心）
- 再问：从哪几个大维度看这个问题最合理？（第一层）
- 然后：对每个分支用 5W1H/5 个为什么不断细化（深度）
- 最后：检查有没有漏维度、有没有太虚、有没有变成细枝末节（校正）`,
        example: [
            {
                name: "高效学习方法",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/default1.json', import.meta.url).href,
            },
            {
                name: "深度学习总结",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/default2.json', import.meta.url).href,
            },
            {
                name: "如何使用p5.js实现游戏",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/default3.json', import.meta.url).href,
            },
            {
                name: "机器学习经典算法",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/default4.json', import.meta.url).href,
            },
            {
                name: "实现游戏引擎需要哪些知识储备？",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/default5.json', import.meta.url).href,
            }
        ]
    },
    {
        label: '读书笔记',
        value: 'note-taking',
        description: '输出这本书的重点内容，按照章节提取关键信息，生成摘要、每个章节、总结等',
        prompt: `
- 深入理解阅读内容，抓住核心观点。
- 善于总结归纳，用简洁的语言表达观点。
- 具备批判性思维，能对观点进行分析评估。`,
        example: [
            {
                name: "《麦肯锡高效工作法》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/note-taking1.json', import.meta.url).href,
            },
            {
                name: "《终身成长》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/note-taking2.json', import.meta.url).href,
            },
            {
                name: "《关键跨越》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/note-taking3.json', import.meta.url).href,
            },
            {
                name: "《冰鉴》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/note-taking4.json', import.meta.url).href,
            }
        ]
    },
    {
        label: '课程学习',
        value: 'course-learning',
        description: '根据系统知识内容，提取关键知识点，生成课程摘要、每个章节、总结，每个知识点给出有代表性的题目等，生成3层思维导图结构',
        prompt: `
- 深入理解课程内容，抓住核心知识点。
- 善于总结归纳，像教育专家一样，用简洁的语言表达知识点。
- 精通每个知识点，能给出代表性，有挑战的题目。`,
        example: [
            {
                name: "《小学数学一年级上册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning1.json', import.meta.url).href,
            },
            {
                name: "《小学数学一年级下册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning2.json', import.meta.url).href,
            },
            {
                name: "《小学数学二年级上册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning3.json', import.meta.url).href,
            },
            {
                name: "《小学数学二年级下册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning4.json', import.meta.url).href,
            },
            {
                name: "《小学数学三年级上册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning5.json', import.meta.url).href,
            },
            {
                name: "《小学数学三年级下册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning6.json', import.meta.url).href,
            },
            {
                name: "《小学数学四年级上册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning7.json', import.meta.url).href,
            },
            {
                name: "《小学数学四年级下册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning8.json', import.meta.url).href,
            },
            {
                name: "《小学数学五年级上册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning9.json', import.meta.url).href,
            },
            {
                name: "《小学数学五年级下册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning10.json', import.meta.url).href,
            },
            {
                name: "《小学数学六年级上册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning11.json', import.meta.url).href,
            },
            {
                name: "《小学数学六年级下册》",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/course-learning12.json', import.meta.url).href,
            },
        ]
    },
    {
        label: '第一性原理',
        value: 'first-principles',
        description: '从头开始计算，只采用最基本的事实，然后根据事实推论，创造出新价值',
        prompt: `- 参考Elon Musk使用 ”第一性原理“ 实现 SpaceX 和 Tesla 计划`,
        example: [
            {
                name: "制造火箭的关键步骤",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/first-principles1.json', import.meta.url).href,
            },
            {
                name: "如何建造太空战舰？",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/first-principles2.json', import.meta.url).href,
            }
        ]
    },
    {
        label: '费曼学习法',
        value: 'fermats-law',
        description: '费曼学习法是一种学习方法，通过将知识分解为基本组件，然后用简单的语言解释这些组件，来帮助记忆和理解复杂的概念',
        prompt: `
- 参考费曼学习法，将复杂的概念分解为基本组件。
- 用简单的语言解释这些组件，使它们对学习者易于理解。
- 重复这个过程，直到学习者能够完全理解概念。`,
        example: [
            {
                name: "向八岁的小朋友介绍什么是量子？",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/fermats-law1.json', import.meta.url).href,
            },
            {
                name: "量子计算机的工作原理",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/fermats-law2.json', import.meta.url).href,
            }
        ]
    },
    {
        label: '贝叶斯思维',
        value: 'bayesian-thinking',
        description: '贝叶斯思维是一种基于概率统计的推理方法，通过更新先验概率，得到后验概率，从而更准确地判断事件的发生概率',
        prompt: `
- 参考贝叶斯思维，根据先验概率和新的证据，更新后验概率。
- 贝叶斯思维不是固守己见，也不是全盘接受新信息，而是动态调整。
- 贝叶斯思维不是简单地记住信息，而是通过推理和逻辑，从已知信息中得出结论。`,
        example: [
            {
                name: "分析世界历史的人口变化",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/bayesian-thinking1.json', import.meta.url).href,
            },
            {
                name: "加密货币的价值",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/bayesian-thinking2.json', import.meta.url).href,
            },
        ]
    },
    {
        label: '批判性思维',
        value: 'critical-thinking',
        description: '批判性思维是一种主动、系统、客观地分析信息，以便形成合理判断或结论的能力。它不是为了“批判”（指责或否定）而批判，而是为了**“明辨是非”**、做出明智决策而进行的深度思考',
        prompt: `
- 参考批判性思维，分析和评估信息，识别错误、错误的假设和错误的结论。
- 批判性思维涉及一系列认知技能和态度：客观分析、证据检验、逻辑推理、多维视角、自我反思。
- 批判性思维一般是针对论据进行否定分析。`,
        example: [
            {
                name: "资本主义的终局",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/critical-thinking1.json', import.meta.url).href,
            },
            {
                name: "分析凯恩斯主义对社会影响",
                description: "",
                layout: 'mindMap',
                content: new URL('./templates/critical-thinking2.json', import.meta.url).href,
            },
        ]
    },
]

export const fontFamilyOptions = [
    { label: '微软雅黑', value: '微软雅黑, Microsoft YaHei' },
    { label: '宋体', value: '宋体, SimSun, Songti SC' },
    { label: '楷体', value: '楷体, 楷体_GB2312, SimKai, STKaiti' },
    { label: '黑体', value: '黑体, SimHei, Heiti SC' },
    { label: '隶书', value: '隶书, SimLi' },
    { label: 'Arial', value: 'arial, helvetica, sans-serif' },
    { label: 'Arial Black', value: 'arial black, avant garde' },
    { label: 'Times New Roman', value: 'times new roman' },
    { label: 'Verdana', value: 'Verdana' },
]

export const iconList = [
    {
        label: '图标',
        type: 'icon',
        list: [
            {
                name: 'mark',
                icon: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCI+CiAgPHBhdGggZD0iTTUxMiA1MTJtLTUxMiAwYTUxMiA1MTIgMCAxIDAgMTAyNCAwIDUxMiA1MTIgMCAxIDAtMTAyNCAwWiIgZmlsbD0ibm9uZSI+PC9wYXRoPgogIDxwYXRoIGQ9Ik02NDQuNTY1MzMzIDMwNi45MDEzMzNjMzIuMTI4IDAgNjUuODM0NjY3LTUuNzYgMTAxLjA3NzMzNC0xNy4yMzczMzNhMTcuMDY2NjY3IDE3LjA2NjY2NyAwIDAgMSAyMi4zNTczMzMgMTYuMjEzMzMzdjMyOC4zMmMtMS4xMDkzMzMgMC43NjggMTAuMzI1MzMzIDI3LjA5MzMzMy05OS4zNzA2NjcgMTkuODQtMTA5LjY1MzMzMy03LjIxMDY2Ny0xODEuNzYtNDUuMDk4NjY3LTI0Ni44NjkzMzMtNDUuMDk4NjY2LTY1LjE1MiAwLTQ5LjMyMjY2NyAyLjY4OC03NC4xNTQ2NjcgOC40MDUzMzN2MTY4LjA2NGEyNC43NDY2NjcgMjQuNzQ2NjY3IDAgMCAxLTI0LjQ5MDY2NiAyNS4yNTg2NjcgMjIuNTI4IDIyLjUyOCAwIDAgMS0xNy4yOC03LjI1MzMzNCAyNC4xNDkzMzMgMjQuMTQ5MzMzIDAgMCAxLTcuMTY4LTE4LjAwNTMzM1YyODEuMjU4NjY3QzI5OS43NzYgMjgwLjQ5MDY2NyAzMjguMTA2NjY3IDI1NiA0MjEuNzYgMjU2czE2NC40MzczMzMgNTAuOTAxMzMzIDIyMi44MDUzMzMgNTAuOTAxMzMzeiIgZmlsbD0iIzAwQUEwMCI+PC9wYXRoPgo8L3N2Zz4=`
            },
        ],
    }
] 