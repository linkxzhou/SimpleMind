import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_MODEL } from '../src/const.js'
import {
  buildPrompt,
  extractIdeas,
  resolveEndpoint,
  requestCompletions,
  expandPrompt,
} from '../src/libai.js'

const jsonResponse = (body, contentType = 'application/json') =>
  Promise.resolve({
    headers: { get: () => contentType },
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  })

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('buildPrompt', () => {
  it('uses the default thinking model and language', () => {
    const prompt = buildPrompt('主题', 3, '', '', {})
    expect(prompt).toContain('expert in organizing mind maps')
    expect(prompt).toContain('主题')
    expect(prompt).toContain('Use 任意 thinking model')
    expect(prompt).toContain('Output Language: 中文')
    expect(prompt).toContain('at least 3 elements and at most 6 elements')
    expect(prompt).toContain('Most relevant key points')
  })

  it('applies a named thinking model, language, and nextSystemPrompt', () => {
    const prompt = buildPrompt('笔记', 2, '下一层方向', '', {
      thinkingModel: 'note-taking',
      language: 'English',
    })
    expect(prompt).toContain('Use 读书笔记 thinking model')
    expect(prompt).toContain('Output Language: English')
    expect(prompt).toContain('Thinking Direction: 下一层方向')
    expect(prompt).toContain('at least 2 elements and at most 4 elements')
  })

  it('wraps a non-empty systemPrompt and treats whitespace-only next prompt as empty', () => {
    const prompt = buildPrompt('T', 1, '   ', '知识库内容', { thinkingModel: 'unknown-model' })
    expect(prompt).toContain('## Context & Data')
    expect(prompt).toContain('知识库内容')
    expect(prompt).toContain('Most relevant key points')
    expect(prompt).toContain('Use 任意 thinking model')
  })

  it('omits the context block when systemPrompt is empty', () => {
    const prompt = buildPrompt('T', 1, 'keep', '', {})
    expect(prompt).not.toContain('## Context & Data')
    expect(prompt).toContain('Thinking Direction: keep')
  })
})

describe('extractIdeas', () => {
  it('parses choices[0].message.content', () => {
    const ideas = extractIdeas({
      choices: [{ message: { content: '[{"data":{"text":"a"}}]' } }],
    })
    expect(ideas).toEqual([{ data: { text: 'a' } }])
  })

  it('parses output_text and text, and a raw string', () => {
    expect(extractIdeas({ output_text: '[1]' })).toEqual([1])
    expect(extractIdeas({ text: '[2]' })).toEqual([2])
    expect(extractIdeas('[{"ok":true}]')).toEqual([{ ok: true }])
  })

  it('strips a ```json fence', () => {
    const raw = '```json\n[{"data":{"text":"fenced"}}]\n```'
    expect(extractIdeas(raw)).toEqual([{ data: { text: 'fenced' } }])
  })

  it('repairs invalid JSON via jsonrepair', () => {
    const ideas = extractIdeas('{data:{text:"fixed"}}')
    expect(ideas).toEqual({ text: 'fixed' })
    expect(console.warn).toHaveBeenCalled()
  })

  it('throws when JSON cannot be parsed or repaired', () => {
    expect(() => extractIdeas('```json\n\n```')).toThrow(/不是有效 JSON/)
  })

  it('returns children when the root object has children', () => {
    const children = [{ data: { text: 'c' } }]
    expect(extractIdeas(JSON.stringify({ children, extra: 1 }))).toEqual(children)
  })

  it('returns data when the root object has data but no children', () => {
    expect(extractIdeas('{"data":[{"text":"d"}]}')).toEqual([{ text: 'd' }])
  })

  it('uses an empty string when content fields are missing on a non-string payload', () => {
    expect(() => extractIdeas({ nope: true })).toThrow(/不是有效 JSON/)
  })
})

describe('resolveEndpoint', () => {
  it('trims the base and appends /chat/completions', () => {
    expect(resolveEndpoint('')).toBe('/chat/completions')
    expect(resolveEndpoint('  https://api.test  ')).toBe('https://api.test/chat/completions')
    expect(resolveEndpoint('https://api.test')).toBe('https://api.test/chat/completions')
  })
})

describe('requestCompletions / normalizeSecret', () => {
  it('sends JSON and Authorization for a plain secret', async () => {
    fetch.mockResolvedValue(jsonResponse({ ok: true }))
    const result = await requestCompletions({
      api: 'https://api.test',
      secret: 'sk-plain',
      prompt: 'hello',
    })
    expect(result.isJson).toBe(true)
    expect(result.data).toEqual({ ok: true })
    expect(result.endpoint).toBe('https://api.test/chat/completions')
    const [, init] = fetch.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer sk-plain')
    expect(JSON.parse(init.body).model).toBe(DEFAULT_MODEL)
  })

  it('decodes a my- Base64 secret, including URL-safe padding', async () => {
    fetch.mockResolvedValue(jsonResponse({ ok: true }))
    const encoded = btoa('decoded-secret').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    await requestCompletions({
      api: 'https://api.test',
      secret: ` my-${encoded} `,
      prompt: 'p',
    })
    const [, init] = fetch.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer decoded-secret')
  })

  it('omits Authorization when the secret is empty', async () => {
    fetch.mockResolvedValue({
      headers: { get: () => 'text/plain' },
      text: async () => 'plain-text',
      json: async () => ({}),
    })
    const result = await requestCompletions({
      api: 'https://api.test',
      secret: '',
      prompt: 'p',
    })
    expect(result.isJson).toBe(false)
    expect(result.data).toBe('plain-text')
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('falls back to the original secret when atob throws', async () => {
    fetch.mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('atob', () => {
      throw new Error('bad b64')
    })
    await requestCompletions({
      api: 'https://api.test',
      secret: 'my-$$$',
      prompt: 'p',
    })
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-$$$')
  })

  it('uses Buffer when atob is unavailable', async () => {
    fetch.mockResolvedValue(jsonResponse({ ok: true }))
    const originalAtob = globalThis.atob
    // eslint-disable-next-line no-global-assign
    globalThis.atob = undefined
    try {
      await requestCompletions({
        api: 'https://api.test',
        secret: `my-${Buffer.from('from-buffer').toString('base64')}`,
        prompt: 'p',
      })
      expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer from-buffer')
    } finally {
      globalThis.atob = originalAtob
    }
  })

  it('returns the original my- secret when neither atob nor Buffer can decode', async () => {
    fetch.mockResolvedValue(jsonResponse({ ok: true }))
    const originalAtob = globalThis.atob
    const originalBuffer = globalThis.Buffer
    globalThis.atob = undefined
    globalThis.Buffer = undefined
    try {
      await requestCompletions({
        api: 'https://api.test',
        secret: 'my-abc',
        prompt: 'p',
      })
      expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-abc')
    } finally {
      globalThis.atob = originalAtob
      globalThis.Buffer = originalBuffer
    }
  })

  it('treats a missing content-type as non-JSON', async () => {
    fetch.mockResolvedValue({
      headers: { get: () => null },
      text: async () => 'no-type',
      json: async () => ({}),
    })
    const result = await requestCompletions({ api: 'https://api.test', secret: '', prompt: 'p' })
    expect(result.isJson).toBe(false)
    expect(result.data).toBe('no-type')
  })

  it('rethrows when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('network down'))
    await expect(
      requestCompletions({ api: 'https://api.test', secret: '', prompt: 'p' }),
    ).rejects.toThrow('network down')
  })
})

describe('expandPrompt', () => {
  it('trims content from choices', async () => {
    fetch.mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: '  expanded  ' } }] }),
    )
    await expect(
      expandPrompt({ currentPrompt: 'base', api: 'https://api.test', secret: '' }),
    ).resolves.toBe('expanded')
  })

  it('reads output_text, text, and string payloads', async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ output_text: ' from-output ' }))
    await expect(
      expandPrompt({ currentPrompt: 'x', api: 'https://a', secret: '' }),
    ).resolves.toBe('from-output')

    fetch.mockResolvedValueOnce(jsonResponse({ text: ' from-text ' }))
    await expect(
      expandPrompt({ currentPrompt: 'x', api: 'https://a', secret: '' }),
    ).resolves.toBe('from-text')

    fetch.mockResolvedValueOnce({
      headers: { get: () => 'text/plain' },
      text: async () => '  string-data  ',
      json: async () => ({}),
    })
    await expect(expandPrompt({ currentPrompt: 'x', api: 'https://a', secret: '' })).resolves.toBe(
      'string-data',
    )

    fetch.mockResolvedValueOnce(jsonResponse({ choices: [{ message: {} }] }))
    await expect(expandPrompt({ currentPrompt: 'x', api: 'https://a', secret: '' })).resolves.toBe('')
  })
})
