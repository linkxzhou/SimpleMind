import { describe, expect, it, vi } from 'vitest'

vi.mock('pdfjs-dist/legacy/build/pdf.js', () => {
  throw new Error('cannot import pdfjs')
})

describe('extractTextFromPDF import failure', () => {
  it('wraps a failed pdfjs import', async () => {
    const { parseFileAsPrompt } = await import('../src/parser.js')
    const file = {
      name: 'a.pdf',
      arrayBuffer: async () => new ArrayBuffer(8),
    }
    await expect(parseFileAsPrompt(file)).rejects.toMatchObject({
      message: expect.stringMatching(/PDF 解析库未安装或不可用/),
    })
  })
})
