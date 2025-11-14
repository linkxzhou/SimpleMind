import { thinkingModels } from './const.js'

export function buildPrompt(topic, count, systemPrompt, settings = {}) {
    if (!systemPrompt || systemPrompt.trim() === '') systemPrompt = '任意'

    const thinkingModel = settings.thinkingModel || 'default'
    const model = thinkingModels.find(m => m.value === thinkingModel) || thinkingModels[0]
    const language = settings.language || '中文'

    let examplePrompt = ""
    if (model.example && model.example.trim() !== '') {
        examplePrompt = `\n
## 思考方式
如果当前知识点符合 "${model.label}" 思考方式，请采用，如果不符合请考虑总结或者归纳的思考方式。

### "${model.label}" 思考样例\n${model.example || ''}\n`
    }

    return `
## 角色    
现在你是一个善于将知识点整理为脑图的专家，精通 “${topic}” 的百科知识，现在基于 “${topic}” 整理最相关的子知识。${examplePrompt}

## 输出样例
\`\`\`json
[
  {
    "data": {
      "text": "相关知识点1",
      "note": "相关知识点描述",
      "nextSystemPrompt": "子知识点的提示词",
      "color": "知识点颜色，使用16进制颜色码"
    },
    "children": []
  },
  // ...其他
]
\`\`\`
 
## 要求
- 输出JSON格式。
- 输出语言：${language}。
- 知识点：${systemPrompt}。
- 知识点的数量要求：${count} 个左右，如果重要知识点比较多，可以大于 ${count} 个。
- JSON字段\`text\`是知识点，限制在 20-50 个字。
- JSON字段\`note\`是知识点的关键词描述，限制在 100-500 个字。
- JSON字段\`nextSystemPrompt\`是下一个子知识点的AI提示词和当前知识点总结性数据，限制在 50-300 个字，样例：基于xxx知识点，总结出xxx子知识点。
- JSON字段\`color\`是代表知识点颜色，使用16进制颜色码，样例：\`#FF0000\`，颜色参考规则：暖色调（如红、黄、橙）通常能引起更高的情绪唤起和注意力水平，冷色调（如蓝、绿）通常能营造平静、放松的氛围，有助于减轻视觉疲劳，被认为能增强创造力任务的表现。
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
    let parsed
    console.log('AI返回:', cleaned)
    try {
        parsed = JSON.parse(cleaned)
    } catch (err) {
        console.error('JSON解析错误:', err)
        throw new Error('返回内容不是有效 JSON')
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
    model = 'gpt-5-nano',
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
        temperature
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