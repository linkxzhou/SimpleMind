<template>
    <div class="toolbar">
        <div class="toolbar-inner">
            <!-- 缩放控件 -->
            <div class="zoom-control">
                <a-button size="small" shape="circle" :icon="h(MinusOutlined)" @click="zoomOut" />
                <span class="zoom-percent">{{ Math.round(zoom * 100) }}%</span>
                <a-button size="small" shape="circle" :icon="h(PlusOutlined)" @click="zoomIn" />
            </div>

            <a-button :icon="h(ArrowLeftOutlined)" @click="back"></a-button>
            <a-button :icon="h(ArrowRightOutlined)" @click="forward"></a-button>
            <a-button :icon="h(PlusOutlined)" :style="{ padding: '4px 10px' }" @click="newMap">{{ t('new') }}</a-button>
            <a-button type="primary" danger :icon="h(DeleteOutlined)" :style="{ padding: '4px 10px' }" @click="removeSelected">{{ t('delete') }}</a-button>
            <a-button :icon="h(SettingOutlined)" :style="{ padding: '4px 10px' }" @click="toggleSettings">{{ t('settings') }}</a-button>
            <a-button type="primary" :icon="h(BulbOutlined)" :style="{ padding: '4px 10px' }" @click="aiGenerate">{{ t('aiGenerate') }}</a-button>
        </div>
    </div>
    <div id="mindMapContainer"></div>
    <div v-if="settingsOpen" class="settings-panel">
        <div class="panel-body">
            <!-- 新增：语言选择 -->
            <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                <span style="white-space: nowrap;">{{ t('language') }}：</span>
                <a-select
                    v-model:value="settings.language"
                    :options="languageOptions"
                    style="flex: 1; min-width: 0;"
                />
            </label>

            <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                <span style="white-space: nowrap;">{{ t('api') }}：</span>
                <a-input v-model:value="settings.api" :placeholder="t('apiPlaceholder')" />
            </label>

            <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                <span style="white-space: nowrap;">{{ t('secret') }}：</span>
                <a-input 
                    v-model:value="settings.secret" 
                    placeholder="例如：sk-..."
                    style="flex: 1; min-width: 0;"    
                />
            </label>

            <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                <span style="white-space: nowrap;">{{ t('model') }}：</span>
                <a-input
                    v-model:value="settings.model"
                    :placeholder="t('modelPlaceholder')"
                    style="flex: 1; min-width: 0;"
                />
            </label>

            <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                <span style="white-space: nowrap;">{{ t('mode') }}：</span>
                <a-switch
                    v-model:checked="settings.focusMode"
                    :checked-children="t('focus')"
                    :un-checked-children="t('free')"
                    :style="{ width: '80px' }"
                />
            </label>

            <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                <span style="white-space: nowrap;">{{ t('childCountRange') }}：</span>
                <a-input-number
                    v-model:value="settings.depth"
                    :min="1"
                    :max="10"
                    :step="1"
                    style="flex: 0 0 auto; width: 120px;"
                />
            </label>

            <label class="field" style="flex-direction: row; align-items: center; gap: 8px;">
                <span style="white-space: nowrap;">{{ t('thinkingMethod') }}：</span>
                <a-select
                    v-model:value="settings.thinkingModel"
                    :options="thinkingModels"
                    style="flex: 0 0 auto; min-width: 200px;"
                    :placeholder="t('thinkingMethod')"
                />
            </label>

            <label class="field">
                <span>{{ t('systemPrompt') }}：</span>
                <a-textarea
                    v-model:value="settings.systemPrompt"
                    :placeholder="t('systemPromptPlaceholder')"
                    :auto-size="{ minRows: 2, maxRows: 5 }"
                />
            </label>

            <label class="field">
                <span>{{ t('layout') }}：</span>
            </label>
            <div class="chart-list">
                <a-button
                    v-for="l in layouts"
                    :key="l.key"
                    size="small"
                    @click="applyLayout(l.key)"
                >
                    {{ l.name }}
                </a-button>
            </div>

            <div class="field">
                <span>{{ t('info') }}
                    <br>- {{ t('helpFocus') }}
                    <br>- {{ t('helpFree') }}
                    <br>- {{ t('thinkingMethod') }}：{{ currentThinkingModel?.label || settings.thinkingModel }}。
                    <br><span style="white-space: pre-wrap;">{{ currentThinkingModel?.example || '' }}</span>
                </span>
            </div>
        </div>
        <div class="panel-actions">
            <a-button type="primary" @click="saveSettings">{{ t('save') }}</a-button>
            <a-button style="margin-left: 8px" type="primary" danger @click="settingsOpen = false">{{ t('close') }}</a-button>
        </div>
    </div>
</template>

<style>
/** @import "./simpleMindMap.esm.css"; **/
</style>

<script setup>
// script setup 导入区块
// 引入 Ant Design Vue 组件
import { Button as AButton, Input as AInput, InputNumber as AInputNumber, Textarea as ATextarea, Switch as ASwitch, Select as ASelect } from 'ant-design-vue'
// 引入图标（新增 MinusOutlined）
import { MinusOutlined, PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, DeleteOutlined, SettingOutlined, BulbOutlined } from '@ant-design/icons-vue'
import { ref, onMounted, watch, h, computed } from 'vue'
import MindMap from "simple-mind-map"
import { showLoading, hideLoading, showError } from './modal.js'
import { buildPrompt as libBuildPrompt, extractIdeas as libExtractIdeas, requestCompletions } from './libai.js'
import { loadSettings as loadSettingsFromStorage, saveSettings as saveSettingsToStorage, loadMindMapData, saveMindMapData } from './storage.js'
import { thinkingModels as thinkingModelOptions, layouts as layoutOptions } from './const.js'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

const mindMapRef = ref(null)
const activeNodes = ref([])
const settingsOpen = ref(false)

// 从环境变量读取默认值（Vite 约定使用 VITE_ 前缀）
const env = (import.meta && import.meta.env) ? import.meta.env : {}
const ENV_API = (env.VITE_API ?? '').trim()
const ENV_SECRET = (env.VITE_SECRET ?? '').trim()
const ENV_MODEL = (env.VITE_MODEL ?? '').trim()

const settings = ref({
    api: ENV_API || '',
    secret: ENV_SECRET || '',
    model: ENV_MODEL || '',
    temperature: 0.7,
    systemPrompt: '',
    depth: 3,
    focusMode: true,
    thinkingModel: 'default',
    language: 'zh-CN' // 新增：默认语言
})

const messages = {
    'zh-CN': zhCN,
    'en-US': enUS
}

// 语言选项（动态标签）
const languageOptions = computed(() => {
    return [
        {
            label: '简体中文',
            value: 'zh-CN'
        },
        {
            label: 'English',
            value: 'en-US'
        }
    ]
})

const t = (key) => messages[settings.value.language]?.[key] ?? key

// 思考模型选项列表
const thinkingModels = thinkingModelOptions

const currentThinkingModel = computed(() => {
    const v = settings.value.thinkingModel
    return thinkingModels.find(m => m.value === v) || { label: v, value: v, example: '' }
})

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

const getNodeText = (node) => node?.data?.text || (node?.getData?.()?.text) || ''
const getNodeSystemPrompt = (node) => node?.data?.nextSystemPrompt || (node?.getData?.()?.nextSystemPrompt) || ''

const newMap = () => {
    if (!mindMapRef.value) return
    mindMapRef.value.setData({ data: { text: '主题' }, children: [] })
    mindMapRef.value.view.reset()
}

const back = () => {
    if (!mindMapRef.value) return
    mindMapRef.value.execCommand('BACK')
}

const forward = () => {
    if (!mindMapRef.value) return
    mindMapRef.value.execCommand('FORWARD')
}

const removeSelected = () => {
    if (!mindMapRef.value) return
    mindMapRef.value.execCommand('REMOVE_NODE')
}

const aiGenerate = async () => {
    // 判断API Base是否配置
    if (!settings.value.api || settings.value.api.trim().length === 0) {
        showError('请打开设置，配置API Base')
        return
    }

    if (!mindMapRef.value) {
        showError('请先创建一个思维导图')
        return
    }

    const baseNode = activeNodes.value?.[0]
    const baseText = getNodeText(baseNode)
    if (!baseText || baseText.trim().length === 0) {
        showError('请先选择一个节点或者输入一个主题')
        return
    }

    // 新增：按模式选择系统提示词
    let nodeSystemPrompt
    if (settings.value.focusMode) {
        nodeSystemPrompt = getNodeSystemPrompt(baseNode)
        if (!nodeSystemPrompt || nodeSystemPrompt.trim().length === 0) {
            nodeSystemPrompt = settings.value.systemPrompt
        }
    } else {
        nodeSystemPrompt = settings.value.systemPrompt
    }

    const count = Math.max(1, Math.min(10, Number(settings.value.depth) || 3))
    const prompt = libBuildPrompt(
        baseText,
        count,
        nodeSystemPrompt,
        settings.value
    )

    showLoading('AI生成中...', `🧭 当前模式：${settings.value.focusMode ? '专注模式' : '普通模式'}
📚 知识点方向：${nodeSystemPrompt}
🧠 Prompt: ${prompt}`)
    try {
        const { data } = await requestCompletions({
            api: settings.value.api,
            secret: settings.value.secret,
            model: settings.value.model || 'gpt-5',
            temperature: settings.value.temperature,
            prompt,
        })

        const ideas = libExtractIdeas(data, count)
        console.log('解析到子节点：', JSON.stringify(ideas))
        if (ideas.length) {
            mindMapRef.value.execCommand('INSERT_MULTI_CHILD_NODE', [], ideas)
            hideLoading()
        } else {
            hideLoading()
            showError('AI返回内容为空或未解析到子节点')
        }
    } catch (err) {
        hideLoading()
        const msg = err?.message || String(err)
        showError(`AI生成失败：${msg}`)
        console.error('AI生成失败：', err)
    }
}

const toggleSettings = () => {
    settingsOpen.value = !settingsOpen.value
}

const layouts = layoutOptions

const applyLayout = (key) => {
    if (!mindMapRef.value) return
    mindMapRef.value.setLayout(key)
    mindMapRef.value.view.reset()
}

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

onMounted(() => {
    loadSettings()
    // 使用已保存的导图数据作为初始数据；若无则回落到示例数据
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

    // 数据变更时持久化到 sessionStorage
    mindMap.on('data_change', (data) => {
        try {
            saveMindMapData(data)
        } catch (e) {
            console.warn('写入 sessionStorage 失败：', e)
        }
    })
})
</script>