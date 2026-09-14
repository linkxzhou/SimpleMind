import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TouchEvent from '../src/plugins/TouchEvent.js'

const touch = (target, clientX, clientY) => ({
  target,
  clientX,
  clientY,
  screenX: clientX,
  screenY: clientY,
})

const makeEvent = (target, touches) => ({
  target,
  touches,
  preventDefault: vi.fn(),
})

describe('TouchEvent', () => {
  let el
  let outside
  let mindMap
  let plugin
  let OriginalMouseEvent

  beforeEach(() => {
    OriginalMouseEvent = globalThis.MouseEvent
    globalThis.MouseEvent = class MouseEvent extends Event {
      constructor(type, init = {}) {
        super(type, { bubbles: !!init.bubbles, cancelable: !!init.cancelable })
        this.screenX = init.screenX
        this.screenY = init.screenY
        this.clientX = init.clientX
        this.clientY = init.clientY
        this.which = init.which
        this.view = init.view
      }
    }
    el = document.createElement('div')
    outside = document.createElement('div')
    document.body.append(el, outside)
    mindMap = {
      el,
      opt: {
        disableTouchZoom: false,
        minTouchZoomScale: -1,
        maxTouchZoomScale: -1,
      },
      view: { scale: 1, x: 0, y: 0, transform: vi.fn() },
      toPos: vi.fn((x, y) => ({ x, y })),
      emit: vi.fn(),
    }
    plugin = new TouchEvent({ mindMap })
  })

  afterEach(() => {
    plugin.unBindEvent()
    document.body.innerHTML = ''
    vi.useRealTimers()
    globalThis.MouseEvent = OriginalMouseEvent
  })

  it('binds and unbinds listeners on mindMap.el with passive: true', () => {
    const add = vi.spyOn(el, 'addEventListener')
    const remove = vi.spyOn(el, 'removeEventListener')
    const p = new TouchEvent({ mindMap })
    expect(add).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true })
    expect(add).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true })
    expect(add).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: true })
    expect(add).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true })
    p.beforePluginRemove()
    p.beforePluginDestroy()
    expect(remove).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('touchend', expect.any(Function))
    p.unBindEvent()
  })

  it('skips bind/unbind when el is missing', () => {
    const p = new TouchEvent({ mindMap: { el: null } })
    expect(() => p.unBindEvent()).not.toThrow()
    p.unBindEvent()
  })

  it('ignores touches whose target is outside mindMap.el', () => {
    const dispatch = vi.spyOn(plugin, 'dispatchMouseEvent')
    plugin.onTouchstart(makeEvent(outside, [touch(outside, 1, 1)]))
    plugin.onTouchmove(makeEvent(outside, [touch(outside, 2, 2)]))
    plugin.onTouchend(makeEvent(outside, []))
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('dispatches mouse events for single-finger gestures and measures a second start', () => {
    const target = el
    vi.spyOn(target, 'dispatchEvent')
    plugin.onTouchstart(makeEvent(target, [touch(target, 10, 10)]))
    plugin.onTouchmove(makeEvent(target, [touch(target, 12, 12)]))
    plugin.onTouchend(makeEvent(target, []))
    expect(target.dispatchEvent).toHaveBeenCalled()
    const types = target.dispatchEvent.mock.calls.map(([ev]) => ev.type)
    expect(types).toContain('mousedown')
    expect(types).toContain('mousemove')
    expect(types).toContain('mouseup')

    plugin.onTouchstart(makeEvent(target, [touch(target, 11, 11)]))
    expect(plugin.lastTouchStartDistance).toBeGreaterThan(0)
  })

  it('simulates dblclick when two touchends happen within 300ms and distance <= 5', () => {
    vi.useFakeTimers()
    const target = el
    vi.spyOn(target, 'dispatchEvent')
    plugin.onTouchstart(makeEvent(target, [touch(target, 10, 10)]))
    plugin.onTouchend(makeEvent(target, []))
    plugin.onTouchstart(makeEvent(target, [touch(target, 11, 10)]))
    plugin.onTouchend(makeEvent(target, []))
    const types = target.dispatchEvent.mock.calls.map(([ev]) => ev.type)
    expect(types).toContain('dblclick')
    vi.advanceTimersByTime(300)
    expect(plugin.clickNum).toBe(0)
  })

  it('clears clickNum after 300ms when there is no second tap', () => {
    vi.useFakeTimers()
    plugin.onTouchstart(makeEvent(el, [touch(el, 0, 0)]))
    plugin.onTouchend(makeEvent(el, []))
    vi.advanceTimersByTime(300)
    expect(plugin.clickNum).toBe(0)
    expect(plugin.lastTouchStartPosition).toBeNull()
  })

  it('pinch-zooms around the two-finger center and clamps scale', () => {
    const t1 = touch(el, 0, 0)
    const t2 = touch(el, 0, 40)
    plugin.onTouchmove(makeEvent(el, [t1, t2]))
    expect(plugin.touchStartScaleView).toMatchObject({ scale: 1, distance: 40 })

    plugin.onTouchmove(makeEvent(el, [touch(el, 0, 0), touch(el, 0, 80)]))
    expect(mindMap.view.transform).toHaveBeenCalled()
    expect(mindMap.emit).toHaveBeenCalledWith('scale', 2)

    plugin.touchStartScaleView = { distance: 40, scale: 1, x: 0, y: 0, cx: 0, cy: 20 }
    plugin.onTouchmove(makeEvent(el, [touch(el, 0, 0), touch(el, 0, 45)]))
    expect(mindMap.view.scale).toBe(1)
  })

  it('respects disableTouchZoom and min/max clamps', () => {
    mindMap.opt.disableTouchZoom = true
    plugin.onTouchmove(makeEvent(el, [touch(el, 0, 0), touch(el, 10, 0)]))
    expect(plugin.touchStartScaleView).toBeNull()

    mindMap.opt.disableTouchZoom = false
    mindMap.opt.minTouchZoomScale = 50
    mindMap.opt.maxTouchZoomScale = 150
    plugin.onTouchmove(makeEvent(el, [touch(el, 0, 0), touch(el, 40, 0)]))
    plugin.onTouchmove(makeEvent(el, [touch(el, 0, 0), touch(el, 400, 0)]))
    expect(mindMap.view.scale).toBe(1.5)
    plugin.touchStartScaleView = { distance: 40, scale: 1, x: 0, y: 0, cx: 20, cy: 0 }
    plugin.onTouchmove(makeEvent(el, [touch(el, 0, 0), touch(el, 1, 0)]))
    expect(mindMap.view.scale).toBe(0.5)
  })

  it('covers the empty onTouchcancel hook', () => {
    expect(() => plugin.onTouchcancel({})).not.toThrow()
  })
})
