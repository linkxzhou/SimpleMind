import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SETTINGS_KEY,
  MINDMAP_KEY,
  loadSettings,
  saveSettings,
  loadMindMapData,
  saveMindMapData,
} from '../src/storage.js'

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('loadSettings', () => {
  it('returns a copy of defaults when the key is missing', () => {
    const defaults = { api: 'x', temperature: 0.5, depth: 4 }
    const loaded = loadSettings(defaults)
    expect(loaded).toEqual(defaults)
    expect(loaded).not.toBe(defaults)
  })

  it('merges saved JSON and coerces temperature/depth', () => {
    sessionStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ api: 'https://api.example', temperature: '3', extra: true }),
    )
    const loaded = loadSettings({ model: 'm', temperature: 0.1, depth: 9 })
    expect(loaded.api).toBe('https://api.example')
    expect(loaded.model).toBe('m')
    expect(loaded.temperature).toBe(3)
    expect(loaded.depth).toBe(9)
    expect(loaded.extra).toBe(true)
  })

  it('falls back to 0.7 / 3 when temperature and depth are invalid', () => {
    sessionStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ temperature: 'nope', depth: undefined }),
    )
    const loaded = loadSettings({})
    expect(loaded.temperature).toBe(0.7)
    expect(loaded.depth).toBe(3)
  })

  it('uses default temperature/depth as fallback when saved values are NaN', () => {
    sessionStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ temperature: 'NaN', depth: {} }),
    )
    const loaded = loadSettings({ temperature: 0.2, depth: 8 })
    expect(loaded.temperature).toBe(0.2)
    expect(loaded.depth).toBe(8)
  })

  it('returns a copy of defaults when JSON is damaged', () => {
    sessionStorage.setItem(SETTINGS_KEY, '{not-json')
    const defaults = { api: 'fallback' }
    const loaded = loadSettings(defaults)
    expect(loaded).toEqual(defaults)
    expect(loaded).not.toBe(defaults)
    expect(console.warn).toHaveBeenCalled()
  })
})

describe('saveSettings', () => {
  it('writes SETTINGS_KEY with normalized numbers', () => {
    saveSettings({ api: 'a', temperature: '1.5', depth: '4' })
    const saved = JSON.parse(sessionStorage.getItem(SETTINGS_KEY))
    expect(saved.api).toBe('a')
    expect(saved.temperature).toBe(1.5)
    expect(saved.depth).toBe(4)
  })

  it('uses 0.7 / 3 when numbers are missing', () => {
    saveSettings({})
    const saved = JSON.parse(sessionStorage.getItem(SETTINGS_KEY))
    expect(saved.temperature).toBe(0.7)
    expect(saved.depth).toBe(3)
  })

  it('rethrows when setItem throws', () => {
    const boom = new Error('quota')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw boom
    })
    expect(() => saveSettings({ api: 'x' })).toThrow(boom)
    expect(console.error).toHaveBeenCalled()
  })
})

describe('loadMindMapData / saveMindMapData', () => {
  it('returns defaults when there is no stored map', () => {
    const defaults = { data: { text: '主题' }, children: [] }
    expect(loadMindMapData(defaults)).toBe(defaults)
  })

  it('returns null when missing and no defaults are given', () => {
    expect(loadMindMapData()).toBeNull()
  })

  it('rejects payloads that are missing a data object', () => {
    sessionStorage.setItem(MINDMAP_KEY, JSON.stringify({ children: [] }))
    const defaults = { data: { text: 'd' }, children: [] }
    expect(loadMindMapData(defaults)).toBe(defaults)
  })

  it('rejects payloads whose data field is not an object', () => {
    sessionStorage.setItem(MINDMAP_KEY, JSON.stringify({ data: 'nope' }))
    expect(loadMindMapData(null)).toBeNull()
  })

  it('returns saved data when the map is valid', () => {
    const map = { data: { text: 'root' }, children: [] }
    sessionStorage.setItem(MINDMAP_KEY, JSON.stringify(map))
    expect(loadMindMapData()).toEqual(map)
  })

  it('returns defaults when JSON is damaged', () => {
    sessionStorage.setItem(MINDMAP_KEY, '[[[')
    const defaults = { data: { text: 'd' }, children: [] }
    expect(loadMindMapData(defaults)).toBe(defaults)
    expect(console.warn).toHaveBeenCalled()
  })

  it('returns null when JSON is damaged and no defaults are given', () => {
    sessionStorage.setItem(MINDMAP_KEY, '[[[')
    expect(loadMindMapData()).toBeNull()
  })

  it('serializes mind map data', () => {
    const map = { data: { text: 'root' }, children: [{ data: { text: 'c' } }] }
    saveMindMapData(map)
    expect(JSON.parse(sessionStorage.getItem(MINDMAP_KEY))).toEqual(map)
  })

  it('rethrows QuotaExceeded from saveMindMapData', () => {
    const quota = new Error('full')
    quota.name = 'QuotaExceededError'
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota
    })
    expect(() => saveMindMapData({ data: { text: 'x' } })).toThrow(quota)
    expect(console.error).toHaveBeenCalled()
  })
})
