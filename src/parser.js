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

function clampLength(str, max = 20000) {
    return (str && str.length > max) ? str.slice(0, max) : str
}

function parseCSVText(text) {
    // 轻量 CSV 解析：逐行输出，保留逗号分隔，移除 BOM
    const rows = String(text || '').replace(/^\ufeff/, '').split(/\r?\n/)
    const cleaned = rows
        .map(r => r.trim())
        .filter(r => r.length > 0)
    return cleaned.join('\n')
}

export async function extractTextFromPDF(file) {
    let pdfjsLib
    try {
        // 需要依赖 pdfjs-dist（建议安装）
        // npm/yarn: pdfjs-dist@^3
        pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js')
        // 使用 CDN worker，避免本地 worker 配置问题
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdn.jsdelivr.net/npm/pdfjs-dist/build/pdf.worker.min.js'
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
    }
    return normalizeText(fullText)
}