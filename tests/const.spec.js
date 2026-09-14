import { describe, expect, it } from 'vitest'
import {
  messages,
  thinkingModels,
  layouts,
  languageOptions,
  modelOptions,
  fontFamilyOptions,
  iconList,
  DEFAULT_MODEL,
} from '../src/const.js'
import zhCN from '../src/locales/zh-CN.json'
import enUS from '../src/locales/en-US.json'

describe('const.js', () => {
  it('exposes both locale dictionaries', () => {
    expect(messages['zh-CN']).toEqual(zhCN)
    expect(messages['en-US']).toEqual(enUS)
  })

  it('keeps zh-CN and en-US key sets equal', () => {
    expect(Object.keys(zhCN).sort()).toEqual(Object.keys(enUS).sort())
    expect(Object.keys(zhCN).length).toBeGreaterThan(70)
  })

  it('has unique thinkingModel values and URL example contents', () => {
    const values = thinkingModels.map((m) => m.value)
    expect(new Set(values).size).toBe(values.length)
    for (const model of thinkingModels) {
      for (const example of model.example) {
        expect(typeof example.content).toBe('string')
        expect(example.content).toMatch(/\.json(\?.*)?$/)
        expect(example.content).not.toContain('bayesian-thinking1..json')
      }
    }
  })

  it('includes the expected layouts and default model', () => {
    expect(layouts.map((l) => l.key)).toEqual([
      'mindMap',
      'logicalStructure',
      'organizationStructure',
      'catalogOrganization',
      'timeline',
      'fishbone',
    ])
    expect(DEFAULT_MODEL).toBe('Qwen/Qwen3.8-27B')
    expect(languageOptions.map((o) => o.value)).toEqual(['zh-CN', 'en-US'])
    expect(modelOptions.length).toBeGreaterThan(0)
    expect(fontFamilyOptions.length).toBeGreaterThan(0)
    expect(iconList[0].list[0].name).toBe('mark')
  })
})
