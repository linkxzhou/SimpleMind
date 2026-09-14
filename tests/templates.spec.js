import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { thinkingModels } from '../src/const.js'

const templatesDir = join(dirname(fileURLToPath(import.meta.url)), '../src/templates')

describe('template JSON quality net', () => {
  it('parses every thinkingModels example and has data.text', async () => {
    for (const model of thinkingModels) {
      for (const example of model.example) {
        const fileName = example.content.split('/').pop().split('?')[0]
        const raw = readFileSync(join(templatesDir, fileName), 'utf8')
        const parsed = JSON.parse(raw)
        expect(parsed.data?.text || parsed.root?.data?.text).toBeTruthy()
        expect(Array.isArray(parsed.children || parsed.root?.children)).toBe(true)
      }
    }
  })

  it('spot-checks a large template structure', () => {
    const parsed = JSON.parse(readFileSync(join(templatesDir, 'default3.json'), 'utf8'))
    expect(parsed.data.text).toBeTruthy()
    expect(Array.isArray(parsed.children)).toBe(true)
    expect(parsed.children.length).toBeGreaterThan(0)
  })

  it('requires card.html replace placeholders', () => {
    const html = readFileSync(join(templatesDir, 'card.html'), 'utf8')
    expect(html).toContain('{{REPLACE:cardData BEGIN}}')
    expect(html).toContain('{{REPLACE:cardData END}}')
  })

  it('uses a light CSS-variable palette instead of neon card fills', () => {
    const html = readFileSync(join(templatesDir, 'card.html'), 'utf8')
    expect(html).toContain('--page-bg:')
    expect(html).toContain('--card-bg:')
    expect(html).toContain('--card-text:')
    expect(html).toContain('--accent-mint:')
    expect(html).toMatch(/color:\s*var\(--card-text\)/)
    expect(html).toMatch(/const tints = \['mint', 'sky', 'sand', 'lilac', 'sage', 'rose', 'slate', 'cream'\]/)
    expect(html).not.toMatch(/color:\s*#fff/)
    expect(html).not.toContain('#ff5252')
    expect(html).not.toContain('#ffff00')
    expect(html).not.toContain('#00e676')
    expect(html).not.toContain('#448aff')
  })
})
