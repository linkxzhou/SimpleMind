import { beforeEach, describe, expect, it, vi } from 'vitest'

const pdfMocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}))

vi.mock('pdfjs-dist/legacy/build/pdf.js', () => ({
  GlobalWorkerOptions: pdfMocks.GlobalWorkerOptions,
  getDocument: pdfMocks.getDocument,
}))

import { extractTextFromPDF, parseFileAsPrompt } from '../src/parser.js'

const duckFile = (name, text, extra = {}) => ({
  name,
  text: extra.text ?? (async () => text),
  arrayBuffer: extra.arrayBuffer ?? (async () => new Uint8Array([1, 2, 3]).buffer),
})

beforeEach(() => {
  pdfMocks.GlobalWorkerOptions.workerSrc = ''
  pdfMocks.getDocument.mockReset()
})

describe('parseFileAsPrompt', () => {
  it('reads .md and .txt, normalizes newlines, and clamps length', async () => {
    await expect(parseFileAsPrompt(duckFile('note.MD', '  hello\r\nworld\r  '))).resolves.toBe(
      'hello\nworld',
    )
    await expect(parseFileAsPrompt(duckFile('a.txt', 'plain'))).resolves.toBe('plain')

    const long = 'x'.repeat(20001)
    const clamped = await parseFileAsPrompt(duckFile('big.txt', long))
    expect(clamped).toHaveLength(20000)
  })

  it('parses csv: strips BOM and blank lines', async () => {
    const csv = await parseFileAsPrompt(duckFile('data.csv', '\ufeffa,b\n\n c \n\n'))
    expect(csv).toBe('a,b\nc')
  })

  it('covers remaining csv/text fallbacks', async () => {
    await expect(parseFileAsPrompt(duckFile('empty.csv', ''))).resolves.toBe('')
    await expect(
      parseFileAsPrompt({
        name: 'null.md',
        text: async () => null,
      }),
    ).resolves.toBe('')
  })

  it('throws for unsupported extensions and missing extensions', async () => {
    await expect(parseFileAsPrompt(duckFile('photo.png', 'x'))).rejects.toThrow(
      /不支持的文件类型/,
    )
    await expect(parseFileAsPrompt(duckFile('README', 'x'))).rejects.toThrow(/不支持的文件类型/)
    await expect(parseFileAsPrompt({})).rejects.toThrow(/不支持的文件类型/)
  })

  it('extracts PDF text via mocked pdfjs and sets the worker src', async () => {
    pdfMocks.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: vi.fn(async (i) => ({
          getTextContent: async () => ({
            items: [{ str: `p${i}-a` }, { str: `p${i}-b` }],
          }),
        })),
      }),
    })
    const text = await parseFileAsPrompt(
      duckFile('doc.pdf', '', { arrayBuffer: async () => new ArrayBuffer(8) }),
    )
    expect(text).toBe('p1-a p1-b\np2-a p2-b')
    expect(pdfMocks.GlobalWorkerOptions.workerSrc).toContain('pdf.worker.min.js')
    expect(pdfMocks.GlobalWorkerOptions.workerSrc).toContain('cdn.jsdelivr.net')
  })

  it('exposes extractTextFromPDF for the same mocked document flow', async () => {
    pdfMocks.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn(async () => ({
          getTextContent: async () => ({ items: [{ str: 'only' }] }),
        })),
      }),
    })
    await expect(extractTextFromPDF(duckFile('a.pdf', ''))).resolves.toBe('only')
  })
})
