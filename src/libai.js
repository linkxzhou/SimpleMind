import { thinkingModels } from './const.js'
import { jsonrepair } from 'jsonrepair'

export function buildPrompt(topic, count, nextSystemPrompt, systemPrompt, settings = {}) {
    const thinkingModel = settings.thinkingModel || 'default'
    const model = thinkingModels.find(m => m.value === thinkingModel) || thinkingModels[0]
    const language = settings.language || '中文'

    if (!nextSystemPrompt || nextSystemPrompt.trim().length === 0) {
        nextSystemPrompt = "最相关的知识点"
    }
    if (systemPrompt && systemPrompt.trim().length > 0) {
        systemPrompt = "## Context & Data (背景与数据)\n<context>\n" + systemPrompt + "\n</context>\n\n"
    }

    let thinkingPrompt = ""
    if (model.prompt && model.prompt.trim() !== '') {
        let label = ''
        if (model.label && model.label.trim() !== '') {
            label = model.label
        } else if (model.value === 'default' || model.value === '无') {
            label = '默认'
        } else {
            label = model.value
        }

        thinkingPrompt = `## Thinking (思考方式) 
<context>
使用 ${label} 思考方式，${model.description || ''}。
原则：${model.prompt}
</context>
`
    }

    return `${systemPrompt}## Role (角色设定)   
现在你是一个善于整理思维导图的专家，精通 “${topic}” 的相关知识。

${thinkingPrompt}

## Output Examples (输出样例)
<examples>
\`\`\`json
[
    {
        "data": {
            "text": "相关知识点1",
            "note": "相关知识点描述",
            "nextSystemPrompt": "子知识点的提示词",
            "color": "知识点颜色，使用16进制颜色码"
        },
        "children": [
            {   
                "data": {}, // 下一级知识点
                "children": [] // 下下一级的知识点
            },
            // ... 其他子知识点
        ]
    },
    // ... 其他知识点
]
\`\`\`
</examples>
 
## Rules (具体规则)
请严格遵守以下规则：
<rules>
- 输出JSON数组格式，默认生成2层思维导图结构，包括JSON第一层数组和\`children\`数组
- 输出语言：${language}
- 思考方向：${nextSystemPrompt}
- 思维导图的每一层最少 ${count} 个节点
- JSON字段\`children\`是子知识点数组，每个子知识点也是一个JSON对象，包含\`data\`和\`children\`字段
- JSON字段\`text\`是 ”简要描述“，限制 20-50 个字
- JSON字段\`note\`是 ”详细描述“，限制在 100-400 个字
- JSON字段\`nextSystemPrompt\`是 ”当前层总结关键词和下一级子知识点的AI提示词“，限制在 50-100 个字，样例：基于xxx知识点，总结出xxx子知识点
- JSON字段\`color\`是根据 ”色彩心理学“ 原则标注知识点颜色，使用16进制颜色码，避免浅色，RGB每个值小于200，样例：\`#8B0A50\`
</rules>

## Task (任务)
现在基于 “${topic}” ，按照 ”输出样例“ 中的JSON数组结构输出思维导图。    
`
}

export function extractIdeas(raw) {
    // 1) 提取可能存在的内容字段或直接使用字符串
    const content = raw?.choices?.[0]?.message?.content
        ?? raw?.output_text
        ?? raw?.text
        ?? (typeof raw === 'string' ? raw : '')

    // 2) 去掉 ```json 开头与尾部 ```（仅按要求处理首尾围栏）
    const cleaned = String(content)
        .replace(/^\s*```json(?:\s*|\r?\n)/i, '') // 仅替换开头的 ```json（允许后接空白或换行）
        .replace(/```[\s\n]*$/i, '')              // 仅替换结尾的 ```（允许末尾空白/换行）
        .trim()

    // 3) 校验并解析 JSON，不是 JSON 就抛错
    let parsed = null;
    console.log('AI返回:', cleaned)
    try {
        parsed = JSON.parse(cleaned)
    } catch (err) {
       console.error('JSON解析错误:', err)
        try {
            const repaired = jsonrepair(cleaned)
            parsed = JSON.parse(repaired)
            console.warn('已自动修复无效 JSON 并解析成功')
        } catch (repairErr) {
            console.error('JSON修复失败:', repairErr)
            throw new Error('返回内容不是有效 JSON，且无法自动修复')
        }
    }

    // 判断是否为Object
    if (parsed && typeof parsed === 'object' && (parsed.children || parsed.data)) {
        console.warn("返回数据是Object，返回children数组或data数组")
        return parsed.children || parsed.data
    }

    return parsed;
}

export function resolveEndpoint(api) {
    return (api || '').trim() + '/chat/completions'
}

// 当 secret 以 my- 开头时，去除该标记并进行 Base64 解码
function normalizeSecret(secret) {
    if (!secret) return ''
    const s = String(secret).trim()
    if (s.startsWith('my-')) {
        const encoded = s.slice(3).replace(/\s+/g, '')
        // 兼容 URL-safe Base64
        const urlsafe = encoded.replace(/-/g, '+').replace(/_/g, '/')
        const padded = urlsafe + '='.repeat((4 - (urlsafe.length % 4)) % 4)
        try {
            if (typeof atob === 'function') {
                return atob(padded)
            }
            if (typeof Buffer !== 'undefined') {
                return Buffer.from(padded, 'base64').toString('utf-8')
            }
        } catch (e) {
            console.warn('秘钥Base64解码失败，回退原值：', e)
            return s
        }
    }
    
    return s
}

export async function requestCompletions({
    api,
    secret,
    model = 'gpt-5',
    temperature = 0.7,
    prompt,
}) {
    const endpoint = resolveEndpoint(api)
    console.log('AI请求', endpoint)

    const headers = { 'Content-Type': 'application/json' }
    const authSecret = normalizeSecret(secret)
    if (authSecret) headers.Authorization = `Bearer ${authSecret}`

    const body = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: 65000,
    }

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        })
        const isJson = (res.headers.get('content-type') || '').includes('application/json')
        const data = isJson ? await res.json() : await res.text()
        return { data, isJson, endpoint }
    } catch (err) {
        console.error('AI请求失败', err)
        throw err
    }
}