import { Modal } from 'ant-design-vue'
import { h } from 'vue'
import { LoadingOutlined } from '@ant-design/icons-vue'
import MindMap from 'simple-mind-map'
import TouchEvent from './plugins/TouchEvent.js'

// 使用自定义 TouchEvent 插件替代 simple-mind-map 官方插件。
// 原因：官方插件直接在 window 上绑定 touchstart/touchmove/touchend 事件，导致在移动端（或模拟移动端）
// 所有的触摸操作都被拦截，使得 Ant Design Vue 的 Select 下拉框等组件无法正常交互。
// 解决方案：自定义插件中增加了判断，只有当触摸目标在思维导图容器内时才处理事件，否则放行。
// import TouchEvent from 'simple-mind-map/src/plugins/TouchEvent.js'

import Drag from 'simple-mind-map/src/plugins/Drag.js'
import MindMapLayoutPro from 'simple-mind-map/src/plugins/MindMapLayoutPro.js'
import Themes from 'simple-mind-map-plugin-themes'
import cardTemplate from './templates/card.html?raw'
import themeList from 'simple-mind-map-plugin-themes/themeList'
import { messages } from './const.js'
import { SETTINGS_KEY } from './storage.js'

// 启动只注册交互所需插件；Export / PDF / XMind 在首次导出或 XMind 导入时再加载。
try {
    MindMap.usePlugin(TouchEvent)
    MindMap.usePlugin(Drag)
    MindMap.usePlugin(MindMapLayoutPro)
    Themes.init(MindMap)
} catch (e) {
    console.warn('SimpleMindMap 插件注册失败：', e)
}

const env = (import.meta && import.meta.env) ? import.meta.env : {}
export const IS_DEV = !!env.DEV

export function debugLog(...args) {
    if (IS_DEV) console.log(...args)
}

// 简易翻译函数，直接读取 sessionStorage
const t = (key) => {
    let lang = 'zh-CN'
    try {
        const raw = sessionStorage.getItem(SETTINGS_KEY)
        if (raw) {
            const s = JSON.parse(raw)
            if (s.language) lang = s.language
        }
    } catch (e) {}
    return messages[lang]?.[key] ?? key
}

export const ENV_API = (env.VITE_API ?? '').trim()
export const ENV_SECRET = (env.VITE_SECRET ?? '').trim()
export const ENV_MODEL = (env.VITE_MODEL ?? '').trim()

const CARD_DATA_RE = /\/\/ \{\{REPLACE:cardData BEGIN\}\}[\s\S]*?\/\/ \{\{REPLACE:cardData END\}\}/

export function buildCardHtml(root, template = cardTemplate) {
    const jsonStr = JSON.stringify(root || {})
    return template.replace(
        CARD_DATA_RE,
        `// {{REPLACE:cardData BEGIN}}\n${jsonStr};\n// {{REPLACE:cardData END}}`
    )
}

export function showLoading(title, content) {
    Modal.info({
        title: title || t('loading'),
        content: toModalContent(content || t('pleaseWait')),
        icon: h(LoadingOutlined),
        okButtonProps: { style: { display: 'none' } },
        maskClosable: false,
        closable: true,
        width: 480,
    })
}

export function hideLoading() {
    Modal.destroyAll()
}

export function showError(title, content = '') {
    Modal.error({
        title: title || t('error'),
        content: toModalContent(content),
        closable: true,
    })
}

export function showSuccess(title, content = '') {
    Modal.success({
        title: title || t('success'),
        content: toModalContent(content),
        closable: true,
    })
}

function toModalContent(content) {
    if (content == null) return ''
    if (typeof content !== 'string') return content
    if (content.includes('\n')) {
        return h('pre', { style: 'white-space: pre-wrap; word-break: break-word; margin: 0;' }, content)
    }
    return content
}

let exportPluginsPromise = null
const exportPluginsOnInstance = typeof WeakSet === 'function' ? new WeakSet() : null

export async function ensureExportPlugins(mindMap) {
    if (!exportPluginsPromise) {
        exportPluginsPromise = Promise.all([
            import('simple-mind-map/src/plugins/Export.js'),
            import('simple-mind-map/src/plugins/ExportPDF.js'),
            import('simple-mind-map/src/plugins/ExportXMind.js'),
        ]).then(([exportMod, pdfMod, xmindMod]) => ({
            Export: exportMod.default,
            ExportPDF: pdfMod.default,
            ExportXMind: xmindMod.default,
        }))
    }
    const plugins = await exportPluginsPromise
    const already = mindMap && exportPluginsOnInstance && exportPluginsOnInstance.has(mindMap)
    if (already) return plugins
    try {
        if (mindMap && typeof mindMap.addPlugin === 'function') {
            mindMap.addPlugin(plugins.Export)
            mindMap.addPlugin(plugins.ExportPDF)
            mindMap.addPlugin(plugins.ExportXMind)
        } else {
            MindMap.usePlugin(plugins.Export)
            MindMap.usePlugin(plugins.ExportPDF)
            MindMap.usePlugin(plugins.ExportXMind)
        }
        if (mindMap && exportPluginsOnInstance) exportPluginsOnInstance.add(mindMap)
    } catch (e) {
        console.warn('SimpleMindMap 导出插件注册失败：', e)
        throw e
    }
    return plugins
}

async function loadMarkdownParser() {
    const mod = await import('simple-mind-map/src/parse/markdown.js')
    return mod.default
}

async function loadXmindParser() {
    const mod = await import('simple-mind-map/src/parse/xmind.js')
    return mod.default
}

const EXPORT_PLUGIN_TYPES = new Set(['smm', 'json', 'png', 'pdf', 'xmind', 'svg'])

export async function exportMindMap(mindMap, type) {
    if (!mindMap) {
        showError(t('createMapFirst'))
        return
    }
    
    const ts = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const filename = `mindmap-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`
    try {
        if (EXPORT_PLUGIN_TYPES.has(type)) {
            await ensureExportPlugins(mindMap)
            if (type === 'smm') {
                mindMap.export('smm', true, filename, true)
            } else if (type === 'json') {
                mindMap.export('json', true, filename, false)
            } else if (type === 'png') {
                mindMap.export('png', true, filename)
            } else if (type === 'pdf') {
                mindMap.export('pdf', true, filename)
            } else if (type === 'xmind') {
                mindMap.export('xmind', true, filename)
            } else if (type === 'svg') {
                mindMap.export('svg', true, filename)
            }
        } else if (type === 'md') {
            const markdown = await loadMarkdownParser()
            const data = mindMap.getData(true)
            const content = markdown.transformToMarkdown(data)
            downloadTextBlob(content, `${filename}.md`, 'text/markdown')
        } else if (type === 'txt') {
            const data = mindMap.getData(true)
            const walk = (node, depth = 0) => {
                const text = node.data.text || ''
                const indent = '\t'.repeat(depth)
                let str = `${indent}${text}\n`
                if (node.children && node.children.length > 0) {
                    node.children.forEach(child => {
                        str += walk(child, depth + 1)
                    })
                }
                return str
            }
            const content = walk(data.root)
            downloadTextBlob(content, `${filename}.txt`, 'text/plain')
        } else if (type === 'cardhtml') {
            const data = mindMap.getData(true)
            const content = buildCardHtml(data?.root || {})
            downloadTextBlob(content, `${filename}.html`, 'text/html')
        } else {
            showError(t('unsupportedExportType'), t('selectSupportedExportType'))
        }
    } catch (e) {
        showError(t('exportFailed'), String(e?.message || e))
    }
}

function downloadTextBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export async function importFileToMindMap(file, mindMap) {
    if (!mindMap) {
        showError(t('createMapFirst'))
        return false
    }
    
    const name = (file?.name || '').toLowerCase()
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.') + 1) : ''

    switch (ext) {
        case 'smm':
        case 'json': {
            try {
                const text = await file.text()
                const data = JSON.parse(text)
                if (data.root) {
                    mindMap.setFullData(data)
                } else {
                    mindMap.setData(data)
                }
                mindMap.view?.reset?.()
            } catch (e) {
                showError(t('importFailedJson'), String(e?.message || e))
            }
            break
        }
        case 'xmind': {
            try {
                const xmind = await loadXmindParser()
                const data = await xmind.parseXmindFile(file)
                mindMap.setData(data)
                mindMap.view?.reset?.()
            } catch (e) {
                showError(t('importFailedXmind'), String(e?.message || e))
            }
            break
        }
        case 'md': {
            try {
                const markdown = await loadMarkdownParser()
                const text = await file.text()
                const data = await markdown.transformMarkdownTo(text)
                mindMap.setData(data)
                mindMap.view?.reset?.()
            } catch (e) {
                showError(t('importFailedMarkdown'), String(e?.message || e))
            }
            break
        }
        case 'xlsx': {
            showError(t('xlsxNotIntegrated'))
            break
        }
        default: {
            showError(t('unsupportedFileType'), t('selectSupportedFile'))
        }
    }
    
    return false
}

export function combineText(d, mode = 'detail', lineBreak = '\n') {
    const text = d?.text ?? ''
    const note = d?.note ?? ''
    if (mode === 'detail') {
        if (!note) return String(text)
        const base = String(text)
        const suffix = lineBreak + String(note)
        if (base.endsWith(suffix)) return base
        return `${base}${suffix}`
    }
    const base = String(text)
    const suffix = lineBreak + String(note)
    if (note && base.endsWith(suffix)) {
        return base.slice(0, -suffix.length)
    }
    return base
}

export function switchTextNoteMode(mindMap, mode = 'detail', options = {}) {
    const input = mindMap.getData()
    const lineBreak = options.lineBreak ?? ('\n' + t('detailDescription'))

    const walk = (node) => {
        if (!node || typeof node !== 'object') return
        if (node.data) {
            node.data.text = combineText(node.data, mode, lineBreak)
        }
        if (Array.isArray(node.children)) {
            node.children.forEach(walk)
        }
    }

    if (Array.isArray(input)) {
        input.forEach(walk)
    } else if (input && typeof input === 'object') {
        if (input.root) {
            walk(input.root)
        } else {
            walk(input)
        }
    }

    if (typeof mindMap.updateData === 'function') {
        mindMap.updateData(input)
    } else {
        mindMap.setData(input)
    }
}

export function getThemeList() {
    return [
        {
            name: '默认',
            value: '',
            theme: {
                backgroundColor: '#f5f5f5',
                lineColor: '#549688',
                lineWidth: 2,
            }
        }, 
        ...themeList
    ];
}
