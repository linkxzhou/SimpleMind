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

// 注册 SimpleMindMap 官方导出插件
try {
    MindMap.usePlugin(Export)
    MindMap.usePlugin(ExportPDF)
    MindMap.usePlugin(ExportXMind)
    MindMap.usePlugin(TouchEvent)
    MindMap.usePlugin(Drag)
} catch (e) {
    // 忽略插件重复注册等异常
}

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
    // 关闭所有已打开的模态框（包含加载提示）
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
    // 如果包含 HTML 标签（如 <br>），按 HTML 渲染
    if (/<[a-z][\s\S]*>/i.test(content)) {
        return h('div', { innerHTML: content })
    }
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
    if (name.endsWith('.smm') || name.endsWith('.json')) {
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
    } else if (name.endsWith('.xmind')) {
        try {
            const data = await xmind.parseXmindFile(file)
            mindMap.setData(data)
            mindMap.view?.reset?.()
        } catch (e) {
            showError('导入 XMind 失败', String(e?.message || e))
        }
    } else if (name.endsWith('.md')) {
        try {
            const text = await file.text()
            const data = await markdown.transformMarkdownTo(text)
            mindMap.setData(data)
            mindMap.view?.reset?.()
        } catch (e) {
            showError('导入 Markdown 失败', String(e?.message || e))
        }
    } else if (name.endsWith('.xlsx')) {
        showError('暂未集成 .xlsx 解析，请安装并接入 xlsx 库')
    } else {
        showError('不支持的文件类型', '请选择 .smm/.json/.xmind/.xlsx/.md')
    }
    return false
}