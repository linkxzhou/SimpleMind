import { thinkingModels } from './const.js'
import { jsonrepair } from 'jsonrepair'

export function buildPrompt(topic, count, nextSystemPrompt, systemPrompt, settings = {}) {
    const thinkingModel = settings.thinkingModel || 'default'
    const model = thinkingModels.find(m => m.value === thinkingModel) || thinkingModels[0]
    const language = settings.language || '中文'

    if (!nextSystemPrompt || nextSystemPrompt.trim().length === 0) {
        nextSystemPrompt = "Most relevant key points"
    }
    if (systemPrompt && systemPrompt.trim().length > 0) {
        systemPrompt = "## Context & Data\n<context>\n" + systemPrompt + "\n</context>\n\n"
    }

    let thinkingPrompt = ""
    if (model.prompt && model.prompt.trim() !== '') {
        let label = model.label || 'Any'
        thinkingPrompt = `## Thinking Model 
<context>
Use ${label} thinking model, ${model.description || ''}
Reference principles: ${model.prompt}
</context>`
    }

    return `${systemPrompt}## Role Definition   
You are an expert in organizing mind maps, proficient in knowledge related to "${topic}".

${thinkingPrompt}

## Output Examples
<examples>
\`\`\`json
[
    {
        "data": {
            "text": "Relevant Key Point 1",
            "note": "Description of the key point",
            "nextSystemPrompt": "Prompt for child key points",
            "color": "Key point color in Hex code"
        },
        "children": [
            {   
                "data": {}, // Next level key point
                "children": [] // Next level child key points
            },
            // ... other child key points
        ]
    },
    // ... other key points
]
\`\`\`
</examples>
 
## Rules
Please strictly follow these rules:
<rules>
- Output in JSON array format
- Output Language: ${language}
- Generate a 2-layer mind map structure by default, including the first level array and \`children\` arrays.
- The first level JSON array must have at least ${count} elements and at most ${count * 2} elements.
- The \`children\` array of each array element must have at least ${count} elements and at most ${count * 2} elements.
- Thinking Direction: ${nextSystemPrompt}
- JSON field \`children\` is an array of child key points. Each element is a child key point, which is a JSON object containing \`data\` and \`children\` fields.
- JSON field \`text\` is a "Brief Description", limited to 20-50 words, and must not be empty.
- JSON field \`note\` is a "Detailed Description", limited to 40-200 words, and must not be empty.
- JSON field \`nextSystemPrompt\` is "Keywords summarizing the current level and AI prompt for the next level child key points", limited to 30-60 words. Example: Based on xxx key point, summarize xxx child key points.
- JSON field \`color\` marks the key point color based on "Color Psychology" principles, using Hex color code. Avoid light colors; each RGB value should be less than 200. Example: \`#8B0A50\`.
</rules>

## Task
Now, based on "${topic}", output the mind map following the structure in "Output Examples".    
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
        max_tokens: 32000,
        enable_thinking: false,
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

export async function expandPrompt({ currentPrompt, api, secret, model, language = '中文' }) {
    const prompt = `
## Role Definition   
You are an encyclopedic knowledge expert. Based on "${currentPrompt}", please optimize and expand the detailed content.

## Task
- Optimize and expand the detailed content, ensuring it is rich, structured, and meets the requirements for generating a mind map.
- Output Language: ${language} 
`

    const { data } = await requestCompletions({
        api,
        secret,
        model,
        prompt
    })

    let content = ''
    if (typeof data === 'string') {
        content = data
    } else {
        content = data?.choices?.[0]?.message?.content || data?.output_text || data?.text || ''
    }

    return content.trim()
}