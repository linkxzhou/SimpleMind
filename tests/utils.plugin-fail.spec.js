import { describe, expect, it, vi } from 'vitest'

vi.mock('simple-mind-map', () => ({
  default: {
    usePlugin: () => {
      throw new Error('plugin boom')
    },
  },
}))
vi.mock('simple-mind-map/src/plugins/Drag.js', () => ({ default: {} }))
vi.mock('simple-mind-map/src/plugins/Export.js', () => ({ default: {} }))
vi.mock('simple-mind-map/src/plugins/ExportPDF.js', () => ({ default: {} }))
vi.mock('simple-mind-map/src/plugins/ExportXMind.js', () => ({ default: {} }))
vi.mock('simple-mind-map/src/plugins/MindMapLayoutPro.js', () => ({ default: {} }))
vi.mock('simple-mind-map/src/parse/markdown.js', () => ({ default: {} }))
vi.mock('simple-mind-map/src/parse/xmind.js', () => ({ default: {} }))
vi.mock('simple-mind-map-plugin-themes', () => ({ default: { init: vi.fn() } }))
vi.mock('simple-mind-map-plugin-themes/themeList', () => ({ default: [] }))
vi.mock('ant-design-vue', () => ({
  Modal: { info: vi.fn(), error: vi.fn(), success: vi.fn(), destroyAll: vi.fn() },
}))

describe('utils plugin registration failure', () => {
  it('warns when usePlugin throws', async () => {
    await import('../src/utils.js')
    expect(console.warn).toHaveBeenCalledWith(
      'SimpleMindMap 插件注册失败：',
      expect.any(Error),
    )
  })
})
