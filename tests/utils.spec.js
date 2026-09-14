import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mindMapMocks = vi.hoisted(() => ({
  usePlugin: vi.fn(),
  transformToMarkdown: vi.fn(() => '# exported'),
  transformMarkdownTo: vi.fn(async () => ({ data: { text: 'from-md' }, children: [] })),
  parseXmindFile: vi.fn(async () => ({ data: { text: 'from-xmind' }, children: [] })),
  themeInit: vi.fn(),
}))

vi.mock('simple-mind-map', () => ({
  default: { usePlugin: mindMapMocks.usePlugin },
}))
vi.mock('simple-mind-map/src/plugins/Drag.js', () => ({ default: { name: 'Drag' } }))
vi.mock('simple-mind-map/src/plugins/Export.js', () => ({ default: { name: 'Export' } }))
vi.mock('simple-mind-map/src/plugins/ExportPDF.js', () => ({ default: { name: 'ExportPDF' } }))
vi.mock('simple-mind-map/src/plugins/ExportXMind.js', () => ({ default: { name: 'ExportXMind' } }))
vi.mock('simple-mind-map/src/plugins/MindMapLayoutPro.js', () => ({ default: { name: 'Layout' } }))
vi.mock('simple-mind-map/src/parse/markdown.js', () => ({
  default: {
    transformToMarkdown: mindMapMocks.transformToMarkdown,
    transformMarkdownTo: mindMapMocks.transformMarkdownTo,
  },
}))
vi.mock('simple-mind-map/src/parse/xmind.js', () => ({
  default: { parseXmindFile: mindMapMocks.parseXmindFile },
}))
vi.mock('simple-mind-map-plugin-themes', () => ({
  default: { init: mindMapMocks.themeInit },
}))
vi.mock('simple-mind-map-plugin-themes/themeList', () => ({
  default: [
    {
      name: 'mint',
      value: 'mint',
      theme: { backgroundColor: '#e0f2f1', lineColor: '#43a047', lineWidth: 2 },
    },
  ],
}))

const modalMocks = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  destroyAll: vi.fn(),
}))

vi.mock('ant-design-vue', () => ({
  Modal: modalMocks,
}))

import { SETTINGS_KEY } from '../src/storage.js'
import {
  exportMindMap,
  getThemeList,
  hideLoading,
  importFileToMindMap,
  showError,
  showLoading,
  showSuccess,
  switchTextNoteMode,
} from '../src/utils.js'

const makeMindMap = (overrides = {}) => ({
  export: vi.fn(),
  getData: vi.fn(() => ({
    root: {
      data: { text: 'root' },
      children: [{ data: { text: 'child' }, children: [] }],
    },
  })),
  setData: vi.fn(),
  setFullData: vi.fn(),
  view: { reset: vi.fn() },
  ...overrides,
})

beforeEach(() => {
  sessionStorage.clear()
  modalMocks.info.mockClear()
  modalMocks.error.mockClear()
  modalMocks.success.mockClear()
  modalMocks.destroyAll.mockClear()
  if (!URL.createObjectURL.mock) {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export')
  }
  if (!URL.revokeObjectURL.mock) {
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('module load', () => {
  it('registers plugins via usePlugin', () => {
    expect(mindMapMocks.usePlugin).toHaveBeenCalled()
    expect(mindMapMocks.themeInit).toHaveBeenCalled()
  })
})

describe('modals / t()', () => {
  it('uses zh-CN by default and falls back to the key', () => {
    showError()
    expect(modalMocks.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: '错误', content: '' }),
    )
    showError('missing-key-xyz', null)
    expect(modalMocks.error.mock.calls.at(-1)[0].title).toBe('missing-key-xyz')
    expect(modalMocks.error.mock.calls.at(-1)[0].content).toBe('')
  })

  it('reads language from sessionStorage and falls back on damaged JSON', () => {
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: 'en-US' }))
    showSuccess()
    expect(modalMocks.success.mock.calls.at(-1)[0].title).toBe('Success')

    sessionStorage.setItem(SETTINGS_KEY, '{bad')
    showLoading()
    expect(modalMocks.info.mock.calls.at(-1)[0].title).toBe('加载中')
  })

  it('converts newline content to a pre vnode and passes through non-strings', () => {
    showError('t', 'line1\nline2')
    const vnode = modalMocks.error.mock.calls.at(-1)[0].content
    expect(vnode.type).toBe('pre')
    expect(vnode.children).toBe('line1\nline2')

    const custom = { custom: true }
    showError('t', custom)
    expect(modalMocks.error.mock.calls.at(-1)[0].content).toBe(custom)

    showError('t', 'short')
    expect(modalMocks.error.mock.calls.at(-1)[0].content).toBe('short')
  })

  it('hideLoading destroys all modals', () => {
    hideLoading()
    expect(modalMocks.destroyAll).toHaveBeenCalled()
  })
})

describe('exportMindMap', () => {
  it('errors when mindMap is missing', () => {
    exportMindMap(null, 'json')
    expect(modalMocks.error).toHaveBeenCalled()
  })

  it.each([
    ['smm', ['smm', true, expect.any(String), true]],
    ['json', ['json', true, expect.any(String), false]],
    ['png', ['png', true, expect.any(String)]],
    ['pdf', ['pdf', true, expect.any(String)]],
    ['xmind', ['xmind', true, expect.any(String)]],
    ['svg', ['svg', true, expect.any(String)]],
  ])('exports %s via mindMap.export', (type, args) => {
    const mm = makeMindMap()
    exportMindMap(mm, type)
    expect(mm.export).toHaveBeenCalledWith(...args)
  })

  it('exports md/txt/cardhtml via Blob download', () => {
    const click = vi.fn()
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag)
      if (tag === 'a') el.click = click
      return el
    })
    const mm = makeMindMap()
    exportMindMap(mm, 'md')
    expect(mindMapMocks.transformToMarkdown).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()

    exportMindMap(mm, 'txt')
    exportMindMap(mm, 'cardhtml')
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalledTimes(3)
  })

  it('walks nested txt nodes and errors on unknown types', () => {
    const mm = makeMindMap({
      getData: vi.fn(() => ({
        root: {
          data: { text: 'A' },
          children: [
            { data: { text: 'B' }, children: [{ data: { text: 'C' }, children: [] }] },
            { data: {}, children: [] },
          ],
        },
      })),
    })
    exportMindMap(mm, 'txt')
    exportMindMap(mm, 'unknown')
    expect(modalMocks.error).toHaveBeenCalled()
  })

  it('shows exportFailed when export throws', () => {
    const mm = makeMindMap({
      export: vi.fn(() => {
        throw new Error('boom')
      }),
    })
    exportMindMap(mm, 'json')
    expect(modalMocks.error.mock.calls.at(-1)[0].title).toMatch(/导出失败|exportFailed/)
  })
})

describe('importFileToMindMap', () => {
  it('errors without a mindMap and still returns false', async () => {
    await expect(importFileToMindMap({ name: 'a.json' }, null)).resolves.toBe(false)
    expect(modalMocks.error).toHaveBeenCalled()
  })

  it('imports json/smm with root via setFullData, otherwise setData', async () => {
    const mm = makeMindMap()
    await expect(
      importFileToMindMap({ name: 'a.json', text: async () => '{"root":{"data":{}}}' }, mm),
    ).resolves.toBe(false)
    expect(mm.setFullData).toHaveBeenCalled()

    await importFileToMindMap(
      { name: 'b.smm', text: async () => '{"data":{"text":"n"},"children":[]}' },
      mm,
    )
    expect(mm.setData).toHaveBeenCalled()
    expect(mm.view.reset).toHaveBeenCalled()
  })

  it('reports JSON parse failures', async () => {
    const mm = makeMindMap()
    await importFileToMindMap({ name: 'bad.json', text: async () => '{bad' }, mm)
    expect(modalMocks.error).toHaveBeenCalled()
  })

  it('imports xmind and markdown, and reports their failures', async () => {
    const mm = makeMindMap()
    await importFileToMindMap({ name: 'a.xmind' }, mm)
    expect(mindMapMocks.parseXmindFile).toHaveBeenCalled()

    await importFileToMindMap({ name: 'a.md', text: async () => '# t' }, mm)
    expect(mindMapMocks.transformMarkdownTo).toHaveBeenCalled()

    mindMapMocks.parseXmindFile.mockRejectedValueOnce(new Error('x'))
    await importFileToMindMap({ name: 'b.xmind' }, mm)
    mindMapMocks.transformMarkdownTo.mockRejectedValueOnce(new Error('m'))
    await importFileToMindMap({ name: 'b.md', text: async () => 'x' }, mm)
    expect(modalMocks.error).toHaveBeenCalled()
  })

  it('prompts for xlsx and unknown extensions', async () => {
    const mm = makeMindMap()
    await importFileToMindMap({ name: 'a.xlsx' }, mm)
    await importFileToMindMap({ name: 'a.png' }, mm)
    await importFileToMindMap({ name: 'noext' }, mm)
    expect(modalMocks.error).toHaveBeenCalled()
  })
})

describe('switchTextNoteMode', () => {
  const lineBreak = '\n详细描述：'

  it('concatenates note in detail mode and does not duplicate', () => {
    const tree = {
      root: {
        data: { text: 'T', note: 'N' },
        children: [{ data: { text: `T${lineBreak}N`, note: 'N' }, children: [] }],
      },
    }
    const mm = makeMindMap({ getData: vi.fn(() => tree) })
    switchTextNoteMode(mm, 'detail')
    const out = mm.setData.mock.calls[0][0]
    expect(out.root.data.text).toBe(`T${lineBreak}N`)
    expect(out.root.children[0].data.text).toBe(`T${lineBreak}N`)
  })

  it('removes the suffix in simple mode and leaves nodes without notes', () => {
    const tree = {
      data: { text: `T${lineBreak}N`, note: 'N' },
      children: [{ data: { text: 'plain' }, children: [] }],
    }
    const mm = makeMindMap({ getData: vi.fn(() => tree) })
    switchTextNoteMode(mm, 'simple')
    const out = mm.setData.mock.calls[0][0]
    expect(out.data.text).toBe('T')
    expect(out.children[0].data.text).toBe('plain')
  })

  it('walks an array root and ignores non-objects', () => {
    const mm = makeMindMap({
      getData: vi.fn(() => [{ data: { text: 'A', note: 'n' } }, null, 'x']),
    })
    switchTextNoteMode(mm, 'detail')
    expect(mm.setData.mock.calls[0][0][0].data.text).toContain('A')
  })

  it('detail-mode leaves nodes without notes unchanged', () => {
    const mm = makeMindMap({
      getData: vi.fn(() => ({ data: {}, children: [{ data: { text: 'only' }, children: [] }] })),
    })
    switchTextNoteMode(mm, 'detail')
    const out = mm.setData.mock.calls[0][0]
    expect(out.data.text).toBe('')
    expect(out.children[0].data.text).toBe('only')
  })
})

describe('export/import fallbacks', () => {
  it('covers export/import fallbacks without root, name, or Error.message', async () => {
    const click = vi.fn()
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag)
      if (tag === 'a') el.click = click
      return el
    })
    const mm = makeMindMap({
      getData: vi.fn(() => ({})),
      export: vi.fn(() => {
        throw 'export-string'
      }),
    })
    exportMindMap(mm, 'cardhtml')
    exportMindMap(mm, 'json')
    await importFileToMindMap({ text: async () => { throw 'no-msg' } }, mm)
    await importFileToMindMap({ name: 'a.json', text: async () => { throw 'json-string' } }, mm)

    mindMapMocks.parseXmindFile.mockRejectedValueOnce('xmind-string')
    await importFileToMindMap({ name: 'a.xmind' }, mm)
    mindMapMocks.transformMarkdownTo.mockRejectedValueOnce('md-string')
    await importFileToMindMap({ name: 'a.md', text: async () => 'x' }, mm)
    expect(modalMocks.error).toHaveBeenCalled()
  })
})

describe('getThemeList', () => {
  it('prefixes a default theme with empty value', () => {
    const list = getThemeList()
    expect(list[0]).toMatchObject({ name: '默认', value: '' })
    expect(list[1].value).toBe('mint')
  })
})
