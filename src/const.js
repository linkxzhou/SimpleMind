import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import noteTaking1 from './templates/note-taking1.json' // 《麦肯锡高效工作法》
import noteTaking2 from './templates/note-taking2.json' // 《终身成长》
import noteTaking3 from './templates/note-taking3.json' // 《关键跨越》
import default1 from './templates/default1.json' // 深度学习总结
import default2 from './templates/default2.json' // 如何使用p5.js实现游戏
import firstPrinciples1 from './templates/first-principles1.json' // 第一性原理

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

// 推理模型选择项（用于设置面板）
export const thinkingModels = [
    {
        label: '无',
        value: 'default',
        description: '任意，生成2层思维导图结构',
        prompt: `- 深入拆解最关键的知识点`,
        example: [
            {
                name: "深度学习总结",
                description: "",
                layout: 'mindMap',
                json: JSON.stringify(default1),
            },
            {
                name: "如何使用p5.js实现游戏",
                description: "",
                layout: 'mindMap',
                json: JSON.stringify(default2),
            }
        ]
    },
    {
        label: '读书笔记',
        value: 'note-taking',
        description: '输出这本书的重点内容，按照章节提取关键信息，生成摘要、每个章节、总结等，生成2层思维导图结构',
        prompt: `- 深入理解阅读内容，抓住核心观点。
- 善于总结归纳，用简洁的语言表达观点。
- 具备批判性思维，能对观点进行分析评估。`,
        example: [
            {
                name: "《麦肯锡高效工作法》",
                description: "",
                layout: 'mindMap',
                json: JSON.stringify(noteTaking1),
            },
            {
                name: "《终身成长》",
                description: "",
                layout: 'mindMap',
                json: JSON.stringify(noteTaking2),
            },
            {
                name: "《关键跨越》",
                description: "",
                layout: 'mindMap',
                json: JSON.stringify(noteTaking3),
            },
        ]
    },
    {
        label: '第一性原理',
        value: 'first-principles',
        description: '从头开始计算，只采用最基本的事实，然后根据事实推论，创造出新价值，生成2层思维导图结构',
        prompt: `- 参考Elon Musk使用 ”第一性原理“ 实现 SpaceX 和 Tesla 计划`,
        example: [
            {
                name: "《制造火箭的关键步骤》",
                description: "",
                layout: 'mindMap',
                json: JSON.stringify(firstPrinciples1),
            }
        ]
    },
]

export const layouts = [
    { key: 'mindMap', name: '思维导图' },
    { key: 'logicalStructure', name: '逻辑结构图' },
    { key: 'organizationStructure', name: '组织结构图' },
    { key: 'catalogOrganization', name: '目录组织图' },
    { key: 'timeline', name: '时间轴' },
    { key: 'fishbone', name: '鱼骨图' }
]