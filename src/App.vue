<template>
    <div class="toolbar">
        <div class="toolbar-inner">
            <div class="zoom-control">
                <a-button class="mobile-hide" size="small" shape="circle" :icon="h(MinusOutlined)" @click="zoomOut" />
                <span class="zoom-percent mobile-hide">{{ Math.round(zoom * 100) }}%</span>
                <a-button class="mobile-hide" size="small" shape="circle" :icon="h(PlusOutlined)" @click="zoomIn" />
            </div>

            <a-button :icon="h(LeftOutlined)" @click="back" :title="t('back')"></a-button>
            <a-button :icon="h(RightOutlined)" @click="forward" :title="t('forward')"></a-button>
            <a-button :icon="h(FileAddOutlined)" @click="newMap" :title="t('new')"></a-button>
            <a-button :icon="h(PlusOutlined)" @click="addChildNode" :title="t('addChildNode')"></a-button>
            <a-button :icon="h(DeleteOutlined)" @click="removeCurrentNode" :title="t('removeCurrentNode')"></a-button>
            <a-button :icon="h(CloudDownloadOutlined)" @click="openExportPanel" :title="t('export')+t('import')"></a-button>
            <a-button :icon="h(SettingOutlined)" @click="toggleSettings" :title="t('settings')"></a-button>
            <a-button
                :icon="h(SisternodeOutlined)"
                @click="toggleMindMapMode"
                :title="t('toggleMode')"
                :type="isDetailMode ? 'primary' : 'default'"
            ></a-button>
            <a-button :icon="h(UnorderedListOutlined)" @click="showDrawer" :title="t('thinkingMethod')"></a-button>
            <a-button
                :icon="h(BulbOutlined)"
                type="primary"
                :style="{ padding: '4px 10px' }"
                @click="aiGenerate"
                :title="t('aiGenerate')"
                :disabled="isGenerating"
                :loading="isGenerating"
            >
                <span class="mobile-hide-text">{{ isGenerating ? t('generating') : t('aiGenerate') }}</span>
            </a-button>
        </div>
    </div>
    
    <div id="mindMapContainer"></div>

    <a-drawer
        :width="400"
        :title="t('thinkingMethod')"
        placement="right"
        v-model:open="drawerOpen"
        @close="onClose"
    >
        <div
            v-for="item in thinkingModels"
            :key="item.value"
            style="margin-bottom: 14px;"
        >
            <a-card :bordered="false">
                <a-radio
                    :value="item.value"
                    :checked="item.value === settings.thinkingModel"
                    @click="settings.thinkingModel = item.value"
                >
                    <span style="font-weight: 600">{{ item.label }}</span>
                </a-radio>
                <div v-if="item.example && item.example.length" style="margin-top: 8px;">
                    <span>{{ t('principleLabel') }}: {{ item.description }}</span>
                    <p
                        v-for="ex in item.example"
                        :key="ex.name"
                    >
                        <a-button size="small" type="primary" @click="newMap(ex.content)" style="margin-left: 8px;">
                            {{ t('open') }}: {{ ex.name }}
                        </a-button>
                    </p>
                </div>
            </a-card>
        </div>
    </a-drawer>

    <div
        v-if="show"
        class="context-menu"
        :style="{ left: `${left}px`, top: `${top}px` }"
    >
        <div class="menu-item" @click="addChildNode">{{ t('addChildNode') }}</div>
        <div class="menu-item" @click="removeCurrentNode">{{ t('removeCurrentNode') }}</div>
        <div class="menu-item" @click="removeNode">{{ t('removeNodeWithChildren') }}</div>
        <div class="menu-item" @click="copyNode">{{ t('copyNode') }}</div>
        <div class="menu-item" @click="cutNode">{{ t('cutNode') }}</div>
        <div
            class="menu-item"
            :class="{ disabled: !clipboardData }"
            @click="clipboardData ? pasteNode() : null"
        >
            {{ t('pasteNode') }}
        </div>
    </div>

    <a-modal
        v-model:open="settingsOpen"
        width="800px"
        :title="null"
        :footer="null"
        @cancel="saveSettings"
    >
        <a-tabs v-model:activeKey="activeKey" centered type="line">
            <a-tab-pane :key="'settings'" :tab="t('settings')">
                <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('language') }}：</span>
                    <a-select 
                        v-model:value="settings.language" 
                        :options="languageOptions" 
                        style="flex: 0 0 auto; min-width: 120px;" />
                </label>

                <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('api') }}：</span>
                    <a-input name="api" v-model:value="settings.api" :placeholder="t('apiPlaceholder')" />
                </label>

                <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('secret') }}：</span>
                    <a-input name="secret" v-model:value="settings.secret" :placeholder="t('secretPlaceholder')" style="flex: 1; min-width: 0;" />
                </label>

                <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('model') }}：</span>
                    <a-input name="model" v-model:value="settings.model" :placeholder="t('modelPlaceholder')" style="flex: 1; min-width: 0;" />
                </label>

                <label class="field">
                    <span>{{ t('layout') }}：</span>
                        <div class="chart-list">
                            <a-button v-for="l in layouts" :key="l.key" size="small" :type="settings?.layout === l.key ? 'primary' : 'default'"
                                @click="applyLayout(l.key)"
                                style="display: inline-flex; align-items: center;"
                            >
                                <span v-html="l.icon" style="display: inline-flex; margin-right: 4px;"></span>
                                {{ l.name }}
                            </a-button>
                        </div>
                </label>

                <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('childCountRange') }}：</span>
                    <a-input-number name="depth" v-model:value="settings.depth" :min="1" :max="20" :step="1" style="flex: 0 0 auto; width: 120px;" />
                </label>
            </a-tab-pane>

            <a-tab-pane :key="'prompt'" :tab="t('systemPrompt')">
                <label class="field">
                    <span>{{ t('systemPrompt') }}：{{ t('systemPromptUsage') }}</span>
                    <a-textarea
                        v-model:value="settings.systemPrompt"
                        :placeholder="t('systemPromptPlaceholder')"
                        :auto-size="{ minRows: 8, maxRows: 20 }"
                    />
                    <!-- 新增：解析文件并填充到系统提示词 -->
                    <div style="margin-top: 8px;">
                        <a-upload
                            :show-upload-list="false"
                            :before-upload="handleParsePromptUpload"
                            accept=".md,.txt,.csv,.pdf"
                            :max-count="1"
                        >
                            <a-button size="small" type="primary">上传文件，支持解析.md,.txt,.csv,.pdf</a-button>
                        </a-upload>
                    </div>
                </label>
            </a-tab-pane>

            <a-tab-pane :key="'export'" :tab="t('export')">
                <div class="field">
                    <span>{{ t('selectExportFormat') }}</span>
                </div>
                <div class="chart-list">
                    <a-button size="small" @click="exportMap('smm')">.smm</a-button>
                    <a-button size="small" @click="exportMap('json')">.json</a-button>
                    <a-button size="small" @click="exportMap('svg')">.svg</a-button>
                    <a-button size="small" @click="exportMap('png')">.png</a-button>
                    <a-button size="small" @click="exportMap('pdf')">.pdf</a-button>
                    <a-button size="small" @click="exportMap('md')">.md</a-button>
                    <a-button size="small" @click="exportMap('xmind')">.xmind</a-button>
                    <a-button size="small" @click="exportMap('txt')">.txt</a-button>
                </div>
            </a-tab-pane>

            <a-tab-pane :key="'import'" :tab="t('import')">
                <div class="field">
                    <span>{{ t('importSupportedFormats') }}</span>
                    <a-upload
                        :accept="'.smm,.json,.xmind,.xlsx,.md'"
                        :before-upload="handleBeforeUpload"
                        :show-upload-list="false"
                    >
                        <a-button type="primary">{{ t('chooseFile') }}</a-button>
                    </a-upload>
                </div>
            </a-tab-pane>

            <a-tab-pane :key="'moreSettings'" :tab="t('moreSettings')">
                <div class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('backgroundColor') }}：</span>
                    <input type="color" v-model="settings.backgroundColor" style="cursor: pointer; height: 24px; width: 40px; padding: 0; border: 1px solid #d9d9d9;" />
                    <a-button size="small" :icon="h(UndoOutlined)" @click="settings.backgroundColor = '#ffffff'" :title="t('reset')"></a-button>
                </div>
                <div class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('lineColor') }}：</span>
                    <input type="color" v-model="settings.lineColor" style="cursor: pointer; height: 24px; width: 40px; padding: 0; border: 1px solid #d9d9d9;" />
                    <a-button size="small" :icon="h(UndoOutlined)" @click="settings.lineColor = '#549688'" :title="t('reset')"></a-button>
                </div>
                <div class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('lineWidth') }}：</span>
                    <a-input-number v-model:value="settings.lineWidth" :min="1" :max="10" style="width: 80px;" />
                    <a-button size="small" :icon="h(UndoOutlined)" @click="settings.lineWidth = 2" :title="t('reset')"></a-button>
                </div>
                <div class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('lineStyle') }}：</span>
                    <a-select v-model:value="settings.lineStyle" style="width: 120px;">
                        <a-select-option value="curve">{{ t('curve') }}</a-select-option>
                        <a-select-option value="straight">{{ t('straight') }}</a-select-option>
                        <a-select-option value="direct">{{ t('direct') }}</a-select-option>
                    </a-select>
                </div>
                <div class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span style="white-space: nowrap;">{{ t('fontFamily') }}：</span>
                    <a-select v-model:value="settings.fontFamily" style="width: 150px;">
                        <a-select-option v-for="font in fontFamilyOptions" :key="font.value" :value="font.value">
                            {{ font.label }}
                        </a-select-option>
                    </a-select>
                     <a-button size="small" :icon="h(UndoOutlined)" @click="settings.fontFamily = '微软雅黑, Microsoft YaHei'" :title="t('reset')"></a-button>
                </div>
                <div class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                    <span>
                        关注开源项目：<a href="https://github.com/linkxzhou/SimpleMind" target="_blank">SimpleMind</a>
                    </span>
                </div>
            </a-tab-pane>
        </a-tabs>
    </a-modal>
</template>

<script setup>
import {
    Button as AButton,
    Input as AInput,
    InputNumber as AInputNumber,
    Textarea as ATextarea,
    Select as ASelect,
    SelectOption as ASelectOption,
    Modal as AModal,
    Tabs as ATabs,
    TabPane as ATabPane,
    Upload as AUpload,
    Drawer as ADrawer, 
    Radio as ARadio,
    Card as ACard,
} from 'ant-design-vue'
import {
    MinusOutlined,
    PlusOutlined,
    LeftOutlined,
    RightOutlined,
    SettingOutlined,
    BulbOutlined,
    FileAddOutlined,
    DeleteOutlined,
    CloudDownloadOutlined,
    UnorderedListOutlined,
    SisternodeOutlined,
    UndoOutlined
} from '@ant-design/icons-vue'
import { ref, shallowRef, onMounted, onUnmounted, h, watch } from 'vue' // Added watch here
import MindMap from "simple-mind-map"
import { showLoading, hideLoading, showError, exportMindMap, importFileToMindMap, ENV_API, ENV_SECRET, ENV_MODEL, switchTextNoteMode } from './utils.js'
import { buildPrompt as libBuildPrompt, extractIdeas as libExtractIdeas, requestCompletions } from './libai.js'
import { loadSettings as loadSettingsFromStorage, saveSettings as saveSettingsToStorage, loadMindMapData, saveMindMapData } from './storage.js'
import { thinkingModels, layouts as layoutOptions, languageOptions, messages, fontFamilyOptions } from './const.js'
import { parseFileAsPrompt } from './parser.js'

// 状态与设置
const mindMapRef = ref(null)
const activeNodes = ref([])
const settingsOpen = ref(false)
const drawerOpen = ref(false)

const showDrawer = () => { drawerOpen.value = true }
const onClose = () => { 
    drawerOpen.value = false 
    saveSettings()
}

const settings = ref({
    api: ENV_API || '',
    secret: ENV_SECRET || '',
    model: ENV_MODEL || '',
    temperature: 0.6,
    systemPrompt: '',
    depth: 5,
    thinkingModel: 'default',
    language: 'zh-CN',
    layout: 'mindMap',
    backgroundColor: '#ffffff',
    lineColor: '#43a047',
    lineWidth: 2,
    lineStyle: 'curve',
    fontFamily: '微软雅黑, Microsoft YaHei',
})

// 监听主题设置变化
watch(
    () => [
        settings.value.backgroundColor,
        settings.value.lineColor,
        settings.value.lineWidth,
        settings.value.lineStyle,
        settings.value.fontFamily
    ],
    ([bgColor, lineColor, lineWidth, lineStyle, fontFamily]) => {
        if (mindMapRef.value) {
            const themeConfig = {
                backgroundColor: bgColor,
                lineColor: lineColor,
                lineWidth: lineWidth,
                lineStyle: lineStyle,
                fontFamily: fontFamily
            }
            mindMapRef.value.setThemeConfig(themeConfig)
        }
    }
)

// 保留 t 函数，直接使用 const.js 导出的 messages
const t = (key) => messages[settings.value.language]?.[key] ?? key

// 使用浏览器 sessionStorage 读取/保存设置
const loadSettings = () => {
    try {
        settings.value = loadSettingsFromStorage(settings.value)
    } catch (e) {
        console.warn('加载设置失败：', e)
    }
}

const saveSettings = () => {
    try {
        saveSettingsToStorage(settings.value)
        console.log('设置已保存到 sessionStorage')
    } catch (e) {
        console.error('保存设置失败：', e)
    }
    // 保存后隐藏设置面板
    settingsOpen.value = false
}

// 节点数据辅助
const getNodeText = (node) => node?.data?.text || (node?.getData?.()?.text) || ''
const getNodeSystemPrompt = (node) => node?.data?.nextSystemPrompt || (node?.getData?.()?.nextSystemPrompt) || ''

// 视图与布局
const zoom = ref(1)

const applyZoom = (next) => {
    const mm = mindMapRef.value
    const clamped = Math.min(2, Math.max(0.2, Number(next) || 1))
    zoom.value = clamped
    if (!mm) return
    const v = mm.view

    // 优先调用库方法（若存在）
    if (v && typeof v.setScale === 'function') {
        v.setScale(clamped)
        return
    }

    if (v && typeof v.scale === 'function') {
        // 有些库用 scale(value) 设定缩放
        v.scale(clamped)
        return
    }

    const el = document.getElementById('mindMapContainer')
    if (el) {
        el.style.transform = `scale(${clamped})`
        el.style.transformOrigin = 'top left'
    }
}

const zoomIn = () => applyZoom(zoom.value + 0.1)
const zoomOut = () => applyZoom(zoom.value - 0.1)

const layouts = layoutOptions

const applyLayout = (key) => {
    if (!mindMapRef.value) return
    mindMapRef.value.setLayout(key)
    mindMapRef.value.view.reset()
    settings.value.layout = key
}

// 右键菜单状态与工具
const type = ref('')                 // 当前右键类型：'node' 等
const currentNode = shallowRef(null) // 当前右键的节点
const left = ref(0)                  // 菜单X坐标（clientX）
const top = ref(0)                   // 菜单Y坐标（clientY）
const show = ref(false)              // 是否显示菜单
const clipboardData = ref(null)      // 复制/剪切的缓存数据

const hideContextMenu = () => { show.value = false }

// 深拷贝节点数据并清理 uid，避免插入时冲突
const cloneNodeData = (node) => {
    const raw = node?.getData ? node.getData() : { data: node?.data || {}, children: node?.children || [] }
    const copy = JSON.parse(JSON.stringify(raw))
    const stripUid = (n) => {
        if (n?.data) delete n.data.uid
        if (Array.isArray(n?.children)) n.children.forEach(stripUid)
    }
    stripUid(copy)
    return copy
}

const validateTargetNode = () => {
    if (!mindMapRef.value) {
        showError('请先创建一个思维导图')
        return false
    }

    const target = currentNode.value || activeNodes.value?.[0]
    if (!target) {
        showError('未选择节点')
        return false
    }

    return true
}

// 节点操作（右键菜单）
const addChildNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    mindMapRef.value.execCommand('INSERT_CHILD_NODE', false, [target])
    hideContextMenu()
}

const removeCurrentNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    mindMapRef.value.execCommand('REMOVE_CURRENT_NODE', false, [target])
    hideContextMenu()
}

const removeNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    mindMapRef.value.execCommand('REMOVE_NODE', false, [target])
    hideContextMenu()
}

const copyNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    clipboardData.value = cloneNodeData(target)
    hideContextMenu()
}

const cutNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    clipboardData.value = cloneNodeData(target)
    mindMapRef.value.execCommand('REMOVE_NODE', false, [target])
    hideContextMenu()
}

const pasteNode = () => {
    if (!validateTargetNode() || !clipboardData.value) return
    const { data, children = [] } = clipboardData.value
    const target = currentNode.value || activeNodes.value?.[0]
    mindMapRef.value.execCommand('INSERT_CHILD_NODE', false, [target], data, children)
    hideContextMenu()
}

const back = () => {
    if (!mindMapRef.value) return
    mindMapRef.value.execCommand('BACK')
}

const forward = () => {
    if (!mindMapRef.value) return
    mindMapRef.value.execCommand('FORWARD')
}

// 基础导图操作
const newMap = async (tpl) => {
    if (!mindMapRef.value) {
        showError('请先创建一个思维导图')
        return
    }

    try {
        let data = { data: { text: '主题' }, children: [] }
        if (typeof tpl === 'string') {
            const s = tpl.trim()
            if (s.startsWith('{') || s.startsWith('[')) {
                data = JSON.parse(s)
            } else {
                // 新增：字符串视为 URL/路径，使用 fetch 加载 JSON
                const res = await fetch(s)
                if (!res.ok) {
                    throw new Error(`模板加载失败，HTTP ${res.status}`)
                }
                const text = await res.text()
                data = JSON.parse(text)
            }
        } else if (tpl && typeof tpl === 'object') {
            data = (tpl && tpl.data) || { data: { text: '主题' }, children: [] }
        }

        mindMapRef.value.setData(data)
        mindMapRef.value.view.reset()

        onClose() // 关闭模态窗口
    } catch (e) {
        showError('导入模板失败', String(e?.message || e))
    }

    // 默认简单模式
    isDetailMode.value = false
}

// AI 生成
const isGenerating = ref(false)
const aiGenerate = async () => {
    if (isGenerating.value) return
    isGenerating.value = true

    // 判断API Base是否配置
    if (!settings.value.api || settings.value.api.trim().length === 0) {
        showError('请打开设置，配置API Base')
        isGenerating.value = false
        return
    }

    if (!mindMapRef.value) {
        showError('请先创建一个思维导图')
        isGenerating.value = false
        return
    }

    const baseNode = activeNodes.value?.[0]
    const baseText = getNodeText(baseNode)
    if (!baseText || baseText.trim().length === 0) {
        showError('请先选择一个节点或者输入一个主题')
        isGenerating.value = false
        return
    }

    // 新增：按模式选择系统提示词
    const nodeSystemPrompt = getNodeSystemPrompt(baseNode)
    const systemPrompt = settings.value.systemPrompt

    const count = Math.max(1, Math.min(20, Number(settings.value.depth) || 5))
    const prompt = libBuildPrompt(
        baseText,
        count,
        nodeSystemPrompt,
        systemPrompt,
        settings.value
    )

    showLoading('AI生成中...（预计生成时间为3分钟，时间：' + new Date().toLocaleString() + '）', `🧠 Prompt: \n${prompt}`)
    try {
        const { data } = await requestCompletions({
            api: settings.value.api,
            secret: settings.value.secret,
            model: settings.value.model || 'gpt-5',
            temperature: settings.value.temperature,
            prompt,
        })

        const ideas = libExtractIdeas(data, count)
        console.log('解析到子节点：', JSON.stringify(ideas), `共${ideas.length}个`)
        hideLoading()
        if (ideas.length) {
            mindMapRef.value.execCommand('INSERT_MULTI_CHILD_NODE', [], ideas)
        } else {
            showError('AI返回内容为空或未解析到子节点，请重新生成')
        }
    } catch (err) {
        hideLoading()
        const msg = err?.message || String(err)
        showError(`AI生成失败：${msg}，请重新生成`)
        console.error('AI生成失败：', err)
    } finally {
        isGenerating.value = false
    }
}

// 设置与导入导出面板
const activeKey = ref('settings')

const toggleSettings = () => {
    settingsOpen.value = !settingsOpen.value
}

const isDetailMode = ref(false)

const toggleMindMapMode = () => {
    const mm = mindMapRef.value
    if (!mm) {
        showError('请先创建一个思维导图')
        return
    }

    const nextMode = isDetailMode.value ? 'simple' : 'detail'
    switchTextNoteMode(mindMapRef.value, nextMode)
    isDetailMode.value = !isDetailMode.value
}

const openExportPanel = () => {
    settingsOpen.value = true
    activeKey.value = 'export'
}

const exportMap = (type) => {
    return exportMindMap(mindMapRef.value, type)
}

const handleBeforeUpload = async (file) => {
    await importFileToMindMap(file, mindMapRef.value)
    return false
}

const handleParsePromptUpload = async (file) => {
    try {
        const content = await parseFileAsPrompt(file)
        settings.value.systemPrompt = content
    } catch (e) {
        showError('解析失败', String(e?.message || e))
    }
    return false // 阻止默认上传行为
}

// 初始化与事件绑定
onMounted(() => {
    loadSettings()
    const initialData = loadMindMapData({
        data: { text: '主题' },
        children: []
    })

    const mindMap = new MindMap({
        el: document.getElementById('mindMapContainer'),
        enableFreeDrag: true,
        mousewheelAction: 'zoom',
        mousewheelZoomActionReverse: true,
        layout: settings.value.layout || 'mindMap',
        data: initialData
    });
    mindMapRef.value = mindMap

    // 初始化主题设置
    mindMap.setThemeConfig({
        backgroundColor: settings.value.backgroundColor,
        lineColor: settings.value.lineColor,
        lineWidth: settings.value.lineWidth,
        lineStyle: settings.value.lineStyle,
        fontFamily: settings.value.fontFamily
    })

    // 初始化缩放
    try {
        const v = mindMapRef.value?.view
        const initialScale = (v && typeof v.scale === 'number') ? v.scale : 1
        applyZoom(initialScale || 1)
    } catch {
        applyZoom(1)
    }

    mindMap.on('node_active', (node, activeNodeList) => {
        activeNodes.value = activeNodeList || (node ? [node] : [])
    })

    // 节点右键菜单
    mindMap.on('node_contextmenu', (e, node) => {
        e.preventDefault?.()
        e.stopPropagation?.()
        type.value = 'node'
        left.value = e.clientX + 10
        top.value = e.clientY + 10
        show.value = true
        currentNode.value = node
    })

    // 数据变更时持久化到 sessionStorage
    mindMap.on('data_change', (data) => {
        try {
            saveMindMapData(data)
        } catch (e) {
            console.warn('写入 sessionStorage 失败：', e)
        }
    })

    // 点击其他位置关闭右键菜单
    document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
    document.removeEventListener('click', hideContextMenu)
})
</script>