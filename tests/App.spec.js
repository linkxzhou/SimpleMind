import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mindMapState = vi.hoisted(() => ({
  instances: [],
  handlers: {},
  throwOnView: false,
  viewScale: 1,
}))

const utilsMocks = vi.hoisted(() => ({
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showError: vi.fn(),
  exportMindMap: vi.fn(),
  importFileToMindMap: vi.fn(async () => false),
  switchTextNoteMode: vi.fn(),
  getThemeList: vi.fn(() => [
    {
      name: '默认',
      value: '',
      theme: { backgroundColor: '#f5f5f5', lineColor: '#549688', lineWidth: 2 },
    },
    {
      name: 'mint',
      value: 'mint',
      theme: {
        backgroundColor: '#e0f2f1',
        lineColor: '#43a047',
        lineWidth: 2,
        root: { fillColor: '#fff' },
      },
    },
    {
      name: 'rgb-white',
      value: 'rgb-white',
      theme: {
        backgroundColor: '#111',
        lineColor: '#eee',
        lineWidth: 1,
        root: { fillColor: 'rgb(255, 255, 255)' },
      },
    },
    {
      name: 'dark',
      value: 'dark',
      theme: {
        backgroundColor: '#000',
        lineColor: '#fff',
        lineWidth: 4,
        root: { fillColor: '#123456' },
      },
    },
  ]),
}))

const storageMocks = vi.hoisted(() => ({
  loadSettingsFromStorage: vi.fn((defaults) => ({ ...defaults })),
  saveSettingsToStorage: vi.fn(),
  loadMindMapData: vi.fn((defaults) => defaults),
  saveMindMapData: vi.fn(),
  scheduleMindMapSave: vi.fn(),
  flushMindMapSave: vi.fn(),
}))

const libaiMocks = vi.hoisted(() => ({
  buildPrompt: vi.fn(() => 'PROMPT'),
  extractIdeas: vi.fn(() => [{ data: { text: 'idea' } }]),
  requestCompletions: vi.fn(async () => ({ data: { ok: true } })),
  expandPrompt: vi.fn(async () => 'expanded'),
}))

const parserMocks = vi.hoisted(() => ({
  parseFileAsPrompt: vi.fn(async () => 'parsed-kb'),
}))

vi.mock('simple-mind-map', () => {
  class MindMap {
    constructor(opts) {
      this.opts = opts
      this.el = opts.el
      this.execCommand = vi.fn()
      this.setData = vi.fn()
      this.setTheme = vi.fn()
      this.setThemeConfig = vi.fn()
      this.setLayout = vi.fn()
      this.getData = vi.fn(() => ({
        root: { data: { text: '主题' }, children: [] },
      }))
      this._view = {
        setScale: vi.fn(),
        scale: mindMapState.viewScale,
        reset: vi.fn(),
        x: 0,
        y: 0,
        transform: vi.fn(),
      }
      Object.defineProperty(this, 'view', {
        configurable: true,
        get: () => {
          if (mindMapState.throwOnView) {
            mindMapState.throwOnView = false
            throw new Error('view unavailable')
          }
          return this._view
        },
      })
      this.on = vi.fn((name, cb) => {
        mindMapState.handlers[name] = cb
      })
      mindMapState.instances.push(this)
    }
  }
  return { default: MindMap }
})

vi.mock('../src/utils.js', () => ({
  showLoading: utilsMocks.showLoading,
  hideLoading: utilsMocks.hideLoading,
  showError: utilsMocks.showError,
  exportMindMap: utilsMocks.exportMindMap,
  importFileToMindMap: utilsMocks.importFileToMindMap,
  ENV_API: '',
  ENV_SECRET: '',
  ENV_MODEL: '',
  switchTextNoteMode: utilsMocks.switchTextNoteMode,
  getThemeList: utilsMocks.getThemeList,
  buildCardHtml: (root) => `<html>${JSON.stringify(root || {})}</html>`,
  debugLog: vi.fn(),
}))

vi.mock('../src/storage.js', () => ({
  loadSettings: storageMocks.loadSettingsFromStorage,
  saveSettings: storageMocks.saveSettingsToStorage,
  loadMindMapData: storageMocks.loadMindMapData,
  saveMindMapData: storageMocks.saveMindMapData,
  scheduleMindMapSave: storageMocks.scheduleMindMapSave,
  flushMindMapSave: storageMocks.flushMindMapSave,
  SETTINGS_KEY: 'mindlessSettings',
  MINDMAP_KEY: 'mindMapData',
}))

vi.mock('../src/libai.js', () => ({
  buildPrompt: libaiMocks.buildPrompt,
  extractIdeas: libaiMocks.extractIdeas,
  requestCompletions: libaiMocks.requestCompletions,
  expandPrompt: libaiMocks.expandPrompt,
}))

vi.mock('../src/parser.js', () => ({
  parseFileAsPrompt: parserMocks.parseFileAsPrompt,
}))

import App from '../src/App.vue'

const mountApp = async () => {
  const wrapper = mount(App, { attachTo: document.body })
  await flushPromises()
  return {
    wrapper,
    state: wrapper.vm.$.setupState,
    mm: mindMapState.instances.at(-1),
  }
}

beforeEach(() => {
  mindMapState.instances.length = 0
  mindMapState.handlers = {}
  mindMapState.throwOnView = false
  mindMapState.viewScale = 1
  storageMocks.loadSettingsFromStorage.mockImplementation((defaults) => ({ ...defaults }))
  storageMocks.saveSettingsToStorage.mockReset()
  storageMocks.loadMindMapData.mockImplementation((defaults) => defaults)
  storageMocks.saveMindMapData.mockReset()
  storageMocks.scheduleMindMapSave.mockReset()
  storageMocks.flushMindMapSave.mockReset()
  utilsMocks.showError.mockReset()
  utilsMocks.showLoading.mockReset()
  utilsMocks.hideLoading.mockReset()
  utilsMocks.exportMindMap.mockReset()
  utilsMocks.importFileToMindMap.mockReset()
  utilsMocks.importFileToMindMap.mockResolvedValue(false)
  utilsMocks.switchTextNoteMode.mockReset()
  libaiMocks.buildPrompt.mockClear()
  libaiMocks.extractIdeas.mockReset()
  libaiMocks.extractIdeas.mockReturnValue([{ data: { text: 'idea' } }])
  libaiMocks.requestCompletions.mockReset()
  libaiMocks.requestCompletions.mockResolvedValue({ data: { ok: true } })
  libaiMocks.expandPrompt.mockReset()
  libaiMocks.expandPrompt.mockResolvedValue('expanded')
  parserMocks.parseFileAsPrompt.mockReset()
  parserMocks.parseFileAsPrompt.mockResolvedValue('parsed-kb')
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => '{"data":{"text":"from-url"},"children":[]}',
    })),
  )
  if (!URL.createObjectURL.mock) {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:card')
  } else {
    URL.createObjectURL.mockReturnValue('blob:card')
  }
  if (!URL.revokeObjectURL.mock) {
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('App.vue lifecycle', () => {
  it('loads settings/data, constructs MindMap, and binds events', async () => {
    const { wrapper, mm } = await mountApp()
    expect(storageMocks.loadSettingsFromStorage).toHaveBeenCalled()
    expect(storageMocks.loadMindMapData).toHaveBeenCalled()
    expect(mm).toBeTruthy()
    expect(mm.on).toHaveBeenCalledWith('node_active', expect.any(Function))
    expect(mm.on).toHaveBeenCalledWith('node_contextmenu', expect.any(Function))
    expect(mm.on).toHaveBeenCalledWith('data_change', expect.any(Function))
    expect(mm.setThemeConfig).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('resets the model when stored model is not allowed', async () => {
    storageMocks.loadSettingsFromStorage.mockImplementation((defaults) => ({
      ...defaults,
      model: 'not-allowed',
    }))
    const { wrapper, state } = await mountApp()
    expect(state.settings.model).toBe('Qwen/Qwen3.8-27B')
    wrapper.unmount()
  })

  it('warns when loadSettings throws', async () => {
    storageMocks.loadSettingsFromStorage.mockImplementation(() => {
      throw new Error('bad settings')
    })
    const { wrapper } = await mountApp()
    expect(console.warn).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('persists data_change via debounce and warns when schedule throws', async () => {
    const { wrapper } = await mountApp()
    mindMapState.handlers.data_change({ data: { text: 'x' } })
    expect(storageMocks.scheduleMindMapSave).toHaveBeenCalledWith({ data: { text: 'x' } })
    storageMocks.scheduleMindMapSave.mockImplementation(() => {
      throw new Error('quota')
    })
    mindMapState.handlers.data_change({ data: { text: 'y' } })
    expect(console.warn).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('flushes pending saves when the tab is hidden and on unmount', async () => {
    const { wrapper } = await mountApp()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(storageMocks.flushMindMapSave).toHaveBeenCalled()
    storageMocks.flushMindMapSave.mockImplementationOnce(() => {
      throw new Error('quota')
    })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(console.warn).toHaveBeenCalled()
    window.dispatchEvent(new Event('pagehide'))
    wrapper.unmount()
    expect(storageMocks.flushMindMapSave).toHaveBeenCalled()
  })

  it('uses applyZoom fallback when reading view throws', async () => {
    mindMapState.throwOnView = true
    const { wrapper, state } = await mountApp()
    expect(state.zoom).toBe(1)
    wrapper.unmount()
  })

  it('removes the document click listener on unmount', async () => {
    const spy = vi.spyOn(document, 'removeEventListener')
    const { wrapper } = await mountApp()
    wrapper.unmount()
    expect(spy).toHaveBeenCalledWith('click', expect.any(Function))
  })
})

describe('toolbar', () => {
  it('clamps zoom and uses setScale / scale() / CSS fallbacks', async () => {
    const { wrapper, state, mm } = await mountApp()
    state.zoomIn()
    expect(state.zoom).toBeCloseTo(1.1)
    expect(mm._view.setScale).toHaveBeenCalled()

    state.applyZoom(10)
    expect(state.zoom).toBe(2)
    state.applyZoom(-3)
    expect(state.zoom).toBe(0.2)
    state.applyZoom('nope')
    expect(state.zoom).toBe(1)

    mm._view.setScale = undefined
    mm._view.scale = vi.fn()
    state.applyZoom(1.3)
    expect(mm._view.scale).toHaveBeenCalledWith(1.3)

    mm._view.scale = 1
    state.applyZoom(1.4)
    const el = document.getElementById('mindMapContainer')
    expect(el.style.transform).toBe('scale(1.4)')

    state.mindMapRef = null
    state.applyZoom(0.5)
    expect(state.zoom).toBe(0.5)
    wrapper.unmount()
  })

  it('back/forward/newMap/add/remove/export/mode/drawer/settings', async () => {
    const { wrapper, state, mm } = await mountApp()
    state.back()
    state.forward()
    expect(mm.execCommand).toHaveBeenCalledWith('BACK')
    expect(mm.execCommand).toHaveBeenCalledWith('FORWARD')

    await state.newMap()
    expect(mm.setData).toHaveBeenCalledWith({ data: { text: '主题' }, children: [] })

    state.activeNodes = [{ data: { text: 'n' } }]
    state.addChildNode()
    state.removeCurrentNode()
    expect(mm.execCommand).toHaveBeenCalledWith('INSERT_CHILD_NODE', false, expect.any(Array))
    expect(mm.execCommand).toHaveBeenCalledWith('REMOVE_CURRENT_NODE', false, expect.any(Array))

    utilsMocks.showError.mockClear()
    state.activeNodes = []
    state.currentNode = null
    state.addChildNode()
    expect(utilsMocks.showError).toHaveBeenCalledWith('未选择节点')

    state.openExportPanel()
    expect(state.settingsOpen).toBe(true)
    expect(state.activeKey).toBe('export')

    state.toggleMindMapMode()
    expect(utilsMocks.switchTextNoteMode).toHaveBeenCalledWith(mm, 'detail')
    expect(state.isDetailMode).toBe(true)
    state.toggleMindMapMode()
    expect(utilsMocks.switchTextNoteMode).toHaveBeenCalledWith(mm, 'simple')

    state.mindMapRef = null
    state.toggleMindMapMode()
    expect(utilsMocks.showError).toHaveBeenCalledWith('请先创建一个思维导图')
    state.back()
    state.forward()
    expect(mm.execCommand.mock.calls.filter((c) => c[0] === 'BACK')).toHaveLength(1)

    state.showDrawer()
    expect(state.drawerOpen).toBe(true)
    state.onClose()
    expect(state.drawerOpen).toBe(false)
    expect(storageMocks.saveSettingsToStorage).toHaveBeenCalled()

    state.toggleSettings()
    expect(state.settingsOpen).toBe(true)
    wrapper.unmount()
  })

  it('newMap accepts JSON strings, URLs, objects, and reports errors', async () => {
    const { wrapper, state, mm } = await mountApp()
    await state.newMap('{"data":{"text":"json"},"children":[]}')
    expect(mm.setData).toHaveBeenCalledWith({ data: { text: 'json' }, children: [] })

    await state.newMap('https://example.test/t.json')
    expect(fetch).toHaveBeenCalled()
    expect(mm.setData).toHaveBeenCalledWith({ data: { text: 'from-url' }, children: [] })

    await state.newMap({ data: { text: 'obj' }, children: [] })
    expect(mm.setData).toHaveBeenCalledWith({ text: 'obj' })

    await state.newMap('default1.json')
    expect(mm.setData).toHaveBeenCalled()

    await state.newMap({ foo: 1 })
    expect(mm.setData).toHaveBeenCalledWith({ data: { text: '主题' }, children: [] })

    fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' })
    await state.newMap('https://x/fail.json')
    expect(utilsMocks.showError).toHaveBeenCalled()

    fetch.mockResolvedValueOnce({ ok: true, text: async () => 'not-json' })
    await state.newMap('https://x/bad.json')
    expect(utilsMocks.showError).toHaveBeenCalled()

    utilsMocks.showError.mockClear()
    state.mindMapRef = null
    await state.newMap()
    expect(utilsMocks.showError).toHaveBeenCalledWith('请先创建一个思维导图')
    wrapper.unmount()
  })
})

describe('context menu', () => {
  it('opens from node_contextmenu and closes on document click', async () => {
    const { wrapper, state } = await mountApp()
    const node = { getData: () => ({ data: { text: 'n', uid: 'u1' }, children: [] }) }
    mindMapState.handlers.node_contextmenu(
      { clientX: 20, clientY: 30, preventDefault: vi.fn(), stopPropagation: vi.fn() },
      node,
    )
    expect(state.show).toBe(true)
    expect(state.left).toBe(30)
    expect(state.top).toBe(40)
    document.dispatchEvent(new MouseEvent('click'))
    expect(state.show).toBe(false)
    wrapper.unmount()
  })

  it('copy/cut/paste/mark and node_active', async () => {
    const { wrapper, state, mm } = await mountApp()
    const child = { data: { text: 'c', uid: 'u2' }, children: [] }
    const node = {
      getData: () => ({ data: { text: 'n', uid: 'u1' }, children: [child] }),
    }
    state.currentNode = node
    state.copyNode()
    expect(state.clipboardData.data.uid).toBeUndefined()
    expect(state.clipboardData.children[0].data.uid).toBeUndefined()

    state.cutNode()
    expect(mm.execCommand).toHaveBeenCalledWith('REMOVE_NODE', false, [node])

    state.pasteNode()
    expect(mm.execCommand).toHaveBeenCalledWith(
      'INSERT_CHILD_NODE',
      false,
      [node],
      expect.any(Object),
      expect.any(Array),
    )

    state.markNode(true)
    expect(mm.execCommand).toHaveBeenCalledWith('SET_NODE_ICON', node, ['icon_mark'])
    state.markNode(false)
    expect(mm.execCommand).toHaveBeenCalledWith('SET_NODE_ICON', node, [])

    state.removeNode()
    expect(mm.execCommand).toHaveBeenCalledWith('REMOVE_NODE', false, [node])

    const noGetData = { data: { text: 'raw', uid: 'z' }, children: [] }
    state.currentNode = noGetData
    state.copyNode()
    expect(state.clipboardData.data.uid).toBeUndefined()

    mindMapState.handlers.node_active(null, null)
    expect(state.activeNodes).toEqual([])
    mindMapState.handlers.node_active({ data: { text: 'a' } })
    expect(state.activeNodes[0].data.text).toBe('a')

    state.clipboardData = null
    state.pasteNode()
    wrapper.unmount()
  })

  it('falls back to JSON when structuredClone is missing or throws', async () => {
    const { wrapper, state } = await mountApp()
    const original = globalThis.structuredClone
    const node = {
      getData: () => ({ data: { text: 'n', uid: 'u1' }, children: [] }),
    }
    state.currentNode = node
    globalThis.structuredClone = () => {
      throw new Error('clone fail')
    }
    state.copyNode()
    expect(state.clipboardData.data.uid).toBeUndefined()
    expect(state.clipboardData.data.text).toBe('n')

    globalThis.structuredClone = undefined
    state.copyNode()
    expect(state.clipboardData.data.text).toBe('n')
    globalThis.structuredClone = original
    wrapper.unmount()
  })
})

describe('settings / prompt / export / import', () => {
  it('applyLayout, saveSettings, expandSystemPrompt, uploads, exports', async () => {
    const { wrapper, state, mm } = await mountApp()
    state.applyLayout('timeline')
    expect(mm.setLayout).toHaveBeenCalledWith('timeline')
    expect(state.settings.layout).toBe('timeline')

    state.mindMapRef = null
    state.applyLayout('mindMap')

    state.mindMapRef = mm
    storageMocks.saveSettingsToStorage.mockImplementationOnce(() => {
      throw new Error('save fail')
    })
    state.saveSettings()
    expect(console.error).toHaveBeenCalled()
    expect(state.settingsOpen).toBe(false)

    await state.expandSystemPrompt()
    expect(libaiMocks.expandPrompt).toHaveBeenCalled()
    expect(state.settings.systemPrompt).toBe('expanded')

    libaiMocks.expandPrompt.mockResolvedValueOnce('')
    await state.expandSystemPrompt()

    libaiMocks.expandPrompt.mockRejectedValueOnce(new Error('nope'))
    await state.expandSystemPrompt()
    expect(utilsMocks.showError).toHaveBeenCalled()

    let resolvePending
    const pending = new Promise((resolve) => {
      resolvePending = resolve
    })
    libaiMocks.expandPrompt.mockReturnValueOnce(pending)
    const inFlight = state.expandSystemPrompt()
    await state.expandSystemPrompt()
    expect(libaiMocks.expandPrompt).toHaveBeenCalledTimes(4)
    resolvePending('later')
    await inFlight

    await expect(state.handleParsePromptUpload({ name: 'a.md' })).resolves.toBe(false)
    expect(state.settings.systemPrompt).toBe('parsed-kb')
    parserMocks.parseFileAsPrompt.mockRejectedValueOnce(new Error('bad file'))
    await state.handleParsePromptUpload({ name: 'b.pdf' })
    expect(utilsMocks.showError).toHaveBeenCalled()

    await expect(state.handleBeforeUpload({ name: 'a.json' })).resolves.toBe(false)
    expect(utilsMocks.importFileToMindMap).toHaveBeenCalled()

    for (const type of ['smm', 'json', 'svg', 'png', 'pdf', 'md', 'xmind', 'txt', 'cardhtml']) {
      state.exportMap(type)
    }
    expect(utilsMocks.exportMindMap).toHaveBeenCalledTimes(9)
    wrapper.unmount()
  })

  it('renders more-settings reset controls', async () => {
    const { wrapper, state } = await mountApp()
    state.settingsOpen = true
    state.activeKey = 'moreSettings'
    await flushPromises()
    await nextTick()
    state.settings.backgroundColor = '#000000'
    state.settings.lineColor = '#111111'
    state.settings.lineWidth = 9
    const undos = [...document.body.querySelectorAll('button')].filter(
      (b) => b.getAttribute('title') === '恢复默认',
    )
    expect(undos.length).toBeGreaterThanOrEqual(3)
    undos[0].click()
    undos[1].click()
    undos[2].click()
    await nextTick()
    expect(state.settings.backgroundColor).toBe('#ffffff')
    expect(state.settings.lineColor).toBe('#549688')
    expect(state.settings.lineWidth).toBe(2)
    wrapper.unmount()
  })
})

describe('theme watch', () => {
  it('applies theme colors including white fill fallbacks', async () => {
    const { wrapper, state, mm } = await mountApp()
    state.settings.theme = 'dark'
    await nextTick()
    expect(mm.setTheme).toHaveBeenCalledWith('dark')
    expect(state.settings.themeRootFillColor).toBe('#123456')

    state.settings.theme = 'mint'
    await nextTick()
    expect(state.settings.themeRootFillColor).toBe('#00c0b8')

    state.settings.theme = 'rgb-white'
    await nextTick()
    expect(state.settings.themeRootFillColor).toBe('#00c0b8')

    vi.useFakeTimers()
    state.settings.lineWidth = 8
    await nextTick()
    vi.advanceTimersByTime(120)
    await nextTick()
    expect(mm.setThemeConfig).toHaveBeenCalled()
    vi.useRealTimers()

    state.settings.theme = 'missing-theme'
    await nextTick()
    expect(mm.setTheme).toHaveBeenCalledWith('missing-theme')

    state.mindMapRef = null
    state.settings.lineColor = '#abcabc'
    await nextTick()
    wrapper.unmount()
  })
})

describe('card modal', () => {
  it('creates a blob URL and revokes it on close', async () => {
    const { wrapper, state } = await mountApp()
    await state.showCardModal()
    expect(state.cardModalOpen).toBe(true)
    expect(state.cardHtmlUrl).toBe('blob:card')
    state.cardModalOpen = false
    await nextTick()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:card')
    expect(state.cardHtmlUrl).toBe('')
    wrapper.unmount()
  })

  it('errors without a mind map and when getData throws', async () => {
    const { wrapper, state, mm } = await mountApp()
    state.mindMapRef = null
    await state.showCardModal()
    expect(utilsMocks.showError).toHaveBeenCalledWith('请先创建一个思维导图')

    state.mindMapRef = mm
    mm.getData.mockImplementation(() => {
      throw new Error('card boom')
    })
    await state.showCardModal()
    expect(utilsMocks.showError).toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('aiGenerate', () => {
  it('returns immediately while generating and validates inputs', async () => {
    const { wrapper, state } = await mountApp()
    state.isGenerating = true
    await state.aiGenerate()
    expect(libaiMocks.requestCompletions).not.toHaveBeenCalled()

    state.isGenerating = false
    state.settings.api = '  '
    await state.aiGenerate()
    expect(utilsMocks.showError).toHaveBeenCalledWith('请打开设置，配置API Base')

    state.settings.api = 'https://api.test'
    state.mindMapRef = null
    await state.aiGenerate()
    expect(utilsMocks.showError).toHaveBeenCalledWith('请先创建一个思维导图')
    wrapper.unmount()
  })

  it('requires node text, inserts ideas, and handles empty/error paths', async () => {
    const { wrapper, state, mm } = await mountApp()
    state.settings.api = 'https://api.test'
    state.settings.depth = 99
    state.activeNodes = [{ data: { text: '   ' } }]
    await state.aiGenerate()
    expect(utilsMocks.showError).toHaveBeenCalledWith('请先选择一个节点或者输入一个主题')

    state.activeNodes = [
      {
        data: { text: '主题', nextSystemPrompt: 'next' },
      },
    ]
    await state.aiGenerate()
    expect(libaiMocks.buildPrompt).toHaveBeenCalledWith(
      '主题',
      20,
      'next',
      expect.anything(),
      expect.anything(),
    )
    expect(mm.execCommand).toHaveBeenCalledWith('INSERT_MULTI_CHILD_NODE', [], expect.any(Array))
    expect(utilsMocks.showLoading).toHaveBeenCalled()
    expect(String(utilsMocks.showLoading.mock.calls.at(-1)?.[1] || '')).not.toContain('PROMPT')
    expect(utilsMocks.hideLoading).toHaveBeenCalled()

    libaiMocks.extractIdeas.mockReturnValueOnce([])
    await state.aiGenerate()
    expect(utilsMocks.showError).toHaveBeenCalledWith(
      'AI返回内容为空或未解析到子节点，请重新生成',
    )

    libaiMocks.requestCompletions.mockRejectedValueOnce(new Error('llm down'))
    await state.aiGenerate()
    expect(utilsMocks.showError.mock.calls.at(-1)[0]).toContain('llm down')

    state.activeNodes = [
      {
        getData: () => ({ text: 'via-get', nextSystemPrompt: 'g' }),
      },
    ]
    state.settings.depth = -2
    await state.aiGenerate()
    expect(libaiMocks.buildPrompt.mock.calls.at(-1)[1]).toBe(1)
    wrapper.unmount()
  })
})

describe('template rendering', () => {
  it('shows generating label, disabled paste, drawer examples, and card iframe', async () => {
    const { wrapper, state } = await mountApp()
    state.isGenerating = true
    await nextTick()
    expect(wrapper.text()).toContain('生成中')

    state.show = true
    state.clipboardData = null
    await nextTick()
    expect(wrapper.find('.menu-item.disabled').exists()).toBe(true)

    state.drawerOpen = true
    await flushPromises()
    await nextTick()
    const openBtns = [...document.body.querySelectorAll('button')].filter((b) =>
      (b.textContent || '').includes('打开:'),
    )
    expect(openBtns.length).toBeGreaterThan(0)
    openBtns[0].click()
    await nextTick()

    state.thinkingModels[0] && (state.settings.thinkingModel = state.thinkingModels[0].value)
    await wrapper.findComponent({ name: 'ARadio' }).trigger('click')

    state.cardModalOpen = true
    state.isCardLoading = true
    await nextTick()
    expect(document.body.textContent).toContain('加载中')
    state.isCardLoading = false
    state.cardHtmlUrl = 'blob:x'
    await nextTick()
    expect(document.body.querySelector('iframe[title="card-view"]')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('coverage edge branches', () => {
  it('covers validateTargetNode without a map, fallbacks, and v-model handlers', async () => {
    const { wrapper, state, mm } = await mountApp()
    state.zoomOut()
    expect(state.zoom).toBeCloseTo(0.9)

    state.isDetailMode = true
    await nextTick()

    state.settings.language = 'fr-FR'
    await nextTick()

    state.mindMapRef = null
    utilsMocks.showError.mockClear()
    state.addChildNode()
    state.removeCurrentNode()
    state.removeNode()
    state.copyNode()
    state.cutNode()
    state.pasteNode()
    state.markNode(true)
    expect(utilsMocks.showError).toHaveBeenCalledWith('createMapFirst')

    state.mindMapRef = mm
    const viaActive = {
      getData: () => ({ data: { text: 'active', uid: 'a1' }, children: [] }),
    }
    state.currentNode = null
    state.activeNodes = [viaActive]
    state.copyNode()
    state.removeNode()
    state.cutNode()
    state.markNode(true)
    state.pasteNode()

    state.currentNode = {}
    state.copyNode()

    mm.getData.mockReturnValueOnce({})
    await state.showCardModal()

    mm.getData.mockImplementationOnce(() => {
      throw 'card-string-error'
    })
    await state.showCardModal()

    libaiMocks.expandPrompt.mockRejectedValueOnce('expand-string')
    await state.expandSystemPrompt()

    parserMocks.parseFileAsPrompt.mockRejectedValueOnce('parse-string')
    await state.handleParsePromptUpload({ name: 'x.md' })

    fetch.mockResolvedValueOnce({ ok: true, text: async () => 'not-json' })
    await state.newMap('https://x/bad.json')

    state.activeNodes = [{ data: {} }]
    state.settings.api = 'https://api.test'
    state.settings.depth = 'nope'
    state.settings.model = ''
    await state.aiGenerate()

    state.activeNodes = [{ data: { text: 'ok' } }]
    libaiMocks.requestCompletions.mockRejectedValueOnce('bare-string')
    await state.aiGenerate()

    state.settings.language = 'zh-CN'
    state.show = true
    state.clipboardData = { data: { text: 'clip' }, children: [] }
    await nextTick()
    const items = [...document.body.querySelectorAll('.menu-item')]
    expect(items.length).toBeGreaterThanOrEqual(8)
    items[5].click()
    items[6].click()
    items[7].click()
    await nextTick()

    state.settingsOpen = true
    state.activeKey = 'settings'
    await flushPromises()
    await nextTick()

    const emitValue = async (name, value = 'x') => {
      const comps = wrapper.findAllComponents({ name })
      for (const comp of comps) {
        await comp.vm.$emit('update:value', value)
      }
    }
    await emitValue('AInput')
    await emitValue('AInputNumber', 3)
    await emitValue('ATextarea')
    await emitValue('Input')
    await emitValue('InputNumber', 3)
    await emitValue('Textarea')
    await emitValue('ASelect', 'dark')
    await emitValue('Select', 'dark')
    await nextTick()

    document.body.querySelector('input[name="api"]')?.dispatchEvent(
      new Event('input', { bubbles: true }),
    )
    document.body.querySelector('input[name="secret"]')?.dispatchEvent(
      new Event('input', { bubbles: true }),
    )

    const layoutBtns = [...document.body.querySelectorAll('.chart-list button')]
    expect(layoutBtns.length).toBeGreaterThan(0)
    layoutBtns[0].click()
    await nextTick()

    const drawer = wrapper.findComponent({ name: 'ADrawer' })
    if (drawer.exists()) {
      await drawer.vm.$emit('update:open', true)
      await drawer.vm.$emit('update:open', false)
    }
    const modals = wrapper.findAllComponents({ name: 'AModal' })
    for (const modal of modals) {
      await modal.vm.$emit('update:open', true)
      await modal.vm.$emit('update:open', false)
    }
    const tabs = wrapper.findComponent({ name: 'ATabs' })
    if (tabs.exists()) {
      await tabs.vm.$emit('update:activeKey', 'moreSettings')
    }

    state.activeKey = 'moreSettings'
    await flushPromises()
    await nextTick()
    document.body.querySelectorAll('input[type="color"]').forEach((input) => {
      input.value = '#abcdef'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await emitValue('AInputNumber', 4)
    wrapper.unmount()
  })

  it('uses layout/theme fallbacks and a zero initial scale', async () => {
    mindMapState.viewScale = 0
    storageMocks.loadSettingsFromStorage.mockImplementation((defaults) => ({
      ...defaults,
      layout: '',
      theme: '',
    }))
    const { wrapper, mm } = await mountApp()
    expect(mm.opts.layout).toBe('mindMap')
    wrapper.unmount()
  })

  it('falls back to scale 1 when view.scale is not a number', async () => {
    mindMapState.viewScale = vi.fn()
    const { wrapper, state } = await mountApp()
    expect(state.zoom).toBe(1)
    wrapper.unmount()
  })
})
