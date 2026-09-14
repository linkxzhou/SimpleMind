export const SETTINGS_KEY = 'mindlessSettings'
export const MINDMAP_KEY = 'mindMapData'
export const MINDMAP_SAVE_DEBOUNCE_MS = 400

const toNumberOr = (val, fallback) => {
    const n = Number(val)
    return Number.isFinite(n) ? n : fallback
}

export function loadSettings(defaults = {}) {
    try {
        const raw = sessionStorage.getItem(SETTINGS_KEY)
        if (!raw) return { ...defaults }
        const saved = JSON.parse(raw)
        return {
            ...defaults,
            ...saved,
            temperature: toNumberOr(saved?.temperature, toNumberOr(defaults?.temperature, 0.7)),
            depth: toNumberOr(saved?.depth, toNumberOr(defaults?.depth, 3)),
        }
    } catch (e) {
        console.warn('加载设置失败：', e)
        return { ...defaults }
    }
}

export function saveSettings(settings) {
    const payload = {
        ...settings,
        temperature: toNumberOr(settings?.temperature, 0.7),
        depth: toNumberOr(settings?.depth, 3),
    }
    
    try {
        sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(payload))
    } catch (e) {
        console.error('保存设置失败：', e)
        throw e
    }
}

const isValidMindMap = (d) => d && typeof d === 'object' && d.data && typeof d.data === 'object'

export function loadMindMapData(defaults = null) {
    try {
        const raw = sessionStorage.getItem(MINDMAP_KEY)
        if (!raw) return defaults
        const saved = JSON.parse(raw)
        return isValidMindMap(saved) ? saved : (defaults ?? null)
    } catch (e) {
        console.warn('加载导图数据失败：', e)
        return defaults ?? null
    }
}

let saveTimer = null
let pendingMapData = undefined
let lastSavedJson = ''

const clearSaveTimer = () => {
    if (saveTimer != null) {
        clearTimeout(saveTimer)
        saveTimer = null
    }
}

export function resetMindMapSaveState() {
    clearSaveTimer()
    pendingMapData = undefined
    lastSavedJson = ''
}

export function saveMindMapData(mapData) {
    try {
        const json = JSON.stringify(mapData)
        if (json === lastSavedJson) return
        sessionStorage.setItem(MINDMAP_KEY, json)
        lastSavedJson = json
    } catch (e) {
        console.error('保存导图数据失败：', e)
        throw e
    }
}

export function flushMindMapSave() {
    clearSaveTimer()
    if (pendingMapData === undefined) return
    const data = pendingMapData
    pendingMapData = undefined
    saveMindMapData(data)
}

export function scheduleMindMapSave(mapData, delay = MINDMAP_SAVE_DEBOUNCE_MS) {
    pendingMapData = mapData
    clearSaveTimer()
    saveTimer = setTimeout(() => {
        saveTimer = null
        flushMindMapSave()
    }, delay)
}
