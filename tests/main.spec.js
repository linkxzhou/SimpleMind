import { describe, expect, it, vi } from 'vitest'

const mount = vi.fn()
const createApp = vi.fn(() => ({ mount }))

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createApp,
  }
})

vi.mock('../src/App.vue', () => ({
  default: { name: 'App' },
}))

describe('main.js', () => {
  it('creates the Vue app and mounts #app', async () => {
    await import('../src/main.js')
    expect(createApp).toHaveBeenCalled()
    expect(mount).toHaveBeenCalledWith('#app')
  })
})
