export async function parseFileAsPrompt(file) {
    const name = (file?.name || '').toLowerCase()
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.') + 1) : ''
    switch (ext) {
        case 'md':
        case 'txt': {
            const text = await file.text()
            return clampLength(normalizeText(text))
        }
        case 'csv': {
            const text = await file.text()
            const parsed = parseCSVText(text)
            return clampLength(parsed)
        }
        case 'pdf': {
            const parsed = await extractTextFromPDF(file)
            return clampLength(parsed)
        }
        default:
            throw new Error('不支持的文件类型：请使用 .md/.txt/.csv/.pdf')
    }
}

function normalizeText(str) {
    const s = String(str ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
    return s.trim()
}

export const PDF_TEXT_MAX = 20000

function clampLength(str, max = PDF_TEXT_MAX) {
    return (str && str.length > max) ? str.slice(0, max) : str
}

function parseCSVText(text) {
    const rows = String(text || '').replace(/^\ufeff/, '').split(/\r?\n/)
    const cleaned = rows
        .map(r => r.trim())
        .filter(r => r.length > 0)
    return cleaned.join('\n')
}

async function resolvePdfWorkerSrc() {
    try {
        const workerMod = await import('pdfjs-dist/legacy/build/pdf.worker.min.js?url')
        if (workerMod?.default) return workerMod.default
    } catch {
        // fall through to a same-origin worker asset
    }
    return new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js', import.meta.url).href
}

export async function extractTextFromPDF(file) {
    let pdfjsLib
    try {
        pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js')
        pdfjsLib.GlobalWorkerOptions.workerSrc = await resolvePdfWorkerSrc()
    } catch (e) {
        const err = new Error('PDF 解析库未安装或不可用，请安装 pdfjs-dist 后重试')
        err.cause = e
        throw err
    }

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(it => it.str).join(' ')
        fullText += pageText + '\n'
        if (fullText.length >= PDF_TEXT_MAX) break
    }
    return clampLength(normalizeText(fullText), PDF_TEXT_MAX)
}
