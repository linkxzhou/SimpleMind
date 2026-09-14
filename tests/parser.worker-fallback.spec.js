import { describe, expect, it, vi } from 'vitest'

const pdfMocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}))

vi.mock('pdfjs-dist/legacy/build/pdf.js', () => ({
  GlobalWorkerOptions: pdfMocks.GlobalWorkerOptions,
  getDocument: pdfMocks.getDocument,
}))

vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.js?url', () => {
  throw new Error('cannot import worker as url')
})

describe('extractTextFromPDF worker fallback', () => {
  it('falls back to a local worker asset when the ?url import fails', async () => {
    pdfMocks.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn(async () => ({
          getTextContent: async () => ({ items: [{ str: 'ok' }] }),
        })),
      }),
    })
    const { extractTextFromPDF } = await import('../src/parser.js')
    await expect(
      extractTextFromPDF({
        name: 'a.pdf',
        arrayBuffer: async () => new ArrayBuffer(8),
      }),
    ).resolves.toBe('ok')
    expect(pdfMocks.GlobalWorkerOptions.workerSrc).toContain('pdf.worker')
    expect(pdfMocks.GlobalWorkerOptions.workerSrc).not.toContain('cdn.jsdelivr.net')
  })
})
