import { fileURLToPath, URL } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.js'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'text-summary', 'html', 'json-summary'],
        reportsDirectory: './coverage',
        include: ['src/**/*.js', 'src/**/*.vue'],
        exclude: ['src/templates/**', 'src/locales/**', 'node_modules/**'],
        thresholds: {
          lines: 95,
          statements: 95,
          functions: 95,
          branches: 95,
        },
      },
    },
  }),
)
