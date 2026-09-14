import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../public/app.css'),
  'utf8',
)

function declarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`))
  expect(match, `missing CSS rule for ${selector}`).toBeTruthy()
  return match[1].replace(/\s+/g, ' ').trim()
}

describe('modal header backgrounds', () => {
  it('card modal header uses the card page token instead of Ant Design white', () => {
    const body = declarations(
      '.card-modal-wrap .ant-modal .ant-modal-content .ant-modal-header',
    )
    expect(body).toMatch(/background:\s*var\(--card-page-bg\)/)
    expect(body).not.toMatch(/background:\s*#fff/i)
  })

  it('card modal content and body share the same page token as the header', () => {
    expect(declarations('.card-modal-wrap .ant-modal .ant-modal-content')).toMatch(
      /background:\s*var\(--card-page-bg\)/,
    )
    expect(
      declarations('.card-modal-wrap .ant-modal .ant-modal-content .ant-modal-body'),
    ).toMatch(/background:\s*var\(--card-page-bg\)/)
  })

  it('AI prompt modal header is transparent so it blends with content', () => {
    const body = declarations(
      '.ai-prompt-modal-wrap .ant-modal .ant-modal-content .ant-modal-header',
    )
    expect(body).toMatch(/background:\s*transparent/)
  })

  it('settings modal header stays hidden', () => {
    expect(declarations('.settings-modal-wrap .ant-modal-header')).toMatch(
      /display:\s*none/,
    )
  })
})
