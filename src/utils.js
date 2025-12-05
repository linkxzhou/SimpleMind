import { Modal } from 'ant-design-vue'
import { h } from 'vue'
import { LoadingOutlined } from '@ant-design/icons-vue'
import MindMap from 'simple-mind-map'
import TouchEvent from 'simple-mind-map/src/plugins/TouchEvent.js'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Export from 'simple-mind-map/src/plugins/Export.js'
import ExportPDF from 'simple-mind-map/src/plugins/ExportPDF.js'
import ExportXMind from 'simple-mind-map/src/plugins/ExportXMind.js'
import markdown from 'simple-mind-map/src/parse/markdown.js'
import xmind from 'simple-mind-map/src/parse/xmind.js'
import MindMapLayoutPro from 'simple-mind-map/src/plugins/MindMapLayoutPro.js'
import Themes from 'simple-mind-map-plugin-themes'
import themeList from 'simple-mind-map-plugin-themes/themeList'

// 注册 SimpleMindMap 官方导出插件
try {
    MindMap.usePlugin(Export)
    MindMap.usePlugin(ExportPDF)
    MindMap.usePlugin(ExportXMind)
    MindMap.usePlugin(TouchEvent)
    MindMap.usePlugin(Drag)
    MindMap.usePlugin(MindMapLayoutPro)
    Themes.init(MindMap)
} catch (e) {
    // 忽略插件重复注册等异常
}

// 从环境变量读取默认值（Vite 约定使用 VITE_ 前缀）
const env = (import.meta && import.meta.env) ? import.meta.env : {}
export const ENV_API = (env.VITE_API ?? '').trim()
export const ENV_SECRET = (env.VITE_SECRET ?? '').trim()
export const ENV_MODEL = (env.VITE_MODEL ?? '').trim()

// showLoading 修改片段
export function showLoading(title = '加载中', content = '请稍候...') {
    Modal.info({
        title,
        content: toModalContent(content),
        icon: h(LoadingOutlined),
        okButtonProps: { style: { display: 'none' } },
        maskClosable: false,
        closable: true,
        width: 1000,
    })
}

export function hideLoading() {
    Modal.destroyAll()
}

// showError 修改片段
export function showError(title = '错误', content = '') {
    Modal.error({
        title,
        content: toModalContent(content),
        closable: true,
    })
}

// showSuccess 修改片段
export function showSuccess(title = '成功', content = '') {
    Modal.success({
        title,
        content: toModalContent(content),
        closable: true,
    })
}

// 新增：字符串内容到 VNode 的转换，支持 <br> 和 \n 换行
function toModalContent(content) {
    if (content == null) return ''
    if (typeof content !== 'string') return content
    // 如果包含 \n，使用 pre 保留换行和空白
    if (content.includes('\n')) {
        return h('pre', { style: 'white-space: pre-wrap; word-break: break-word; margin: 0;' }, content)
    }
    // 普通短文本，直接返回字符串
    return content
}

export function exportMindMap(mindMap, type) {
    if (!mindMap) {
        showError('请先创建一个思维导图')
        return
    }
    
    const ts = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const filename = `mindmap-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
    try {
        if (type === 'smm') {
            mindMap.export('smm', true, filename, true)
        } else if (type === 'json') {
            mindMap.export('json', true, filename, false)
        } else {
            mindMap.export(type, true, filename)
        }
    } catch (e) {
        showError('导出失败', String(e?.message || e))
    }
}

export async function importFileToMindMap(file, mindMap) {
    if (!mindMap) {
        showError('请先创建一个思维导图')
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
                showError('导入 JSON/SMM 失败', String(e?.message || e))
            }
            break
        }
        case 'xmind': {
            try {
                const data = await xmind.parseXmindFile(file)
                mindMap.setData(data)
                mindMap.view?.reset?.()
            } catch (e) {
                showError('导入 XMind 失败', String(e?.message || e))
            }
            break
        }
        case 'md': {
            try {
                const text = await file.text()
                const data = await markdown.transformMarkdownTo(text)
                mindMap.setData(data)
                mindMap.view?.reset?.()
            } catch (e) {
                showError('导入 Markdown 失败', String(e?.message || e))
            }
            break
        }
        case 'xlsx': {
            showError('暂未集成 .xlsx 解析，请安装并接入 xlsx 库')
            break
        }
        default: {
            showError('不支持的文件类型', '请选择 .smm/.json/.xmind/.xlsx/.md')
        }
    }
    
    return false
}

export function switchTextNoteMode(mindMap, mode = 'detail', options = {}) {
    const input = mindMap.getData()
    const lineBreak = options.lineBreak ?? '\n详细描述：'
    const out = JSON.parse(JSON.stringify(input))

    const combineText = (d) => {
        const text = d?.text ?? ''
        const note = d?.note ?? ''
        if (mode === 'detail') {
            if (!note) return String(text)
            const base = String(text)
            const suffix = lineBreak + String(note)
            // 避免重复拼接
            if (base.endsWith(suffix)) return base
            return `${base}${suffix}`
        } else {
            // 简单模式：尽可能移除末尾的 note 拼接
            const base = String(text)
            const suffix = lineBreak + String(note)
            if (note && base.endsWith(suffix)) {
                return base.slice(0, -suffix.length)
            }
            return base
        }
    }

    const walk = (node) => {
        if (!node || typeof node !== 'object') return
        if (node.data) {
            node.data.text = combineText(node.data)
        }
        if (Array.isArray(node.children)) {
            node.children.forEach(walk)
        }
    }

    if (Array.isArray(out)) {
        out.forEach(walk)
    } else if (out && typeof out === 'object') {
        if (out.root) {
            walk(out.root)
        } else {
            walk(out)
        }
    }

    // 更新思维导图数据
    mindMap.setData(out)
    mindMap.view?.reset?.()
}

export function getThemeList() {
    console.log(themeList)
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