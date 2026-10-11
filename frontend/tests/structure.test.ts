import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')

test('App composes the layout and page without owning requests or page state', () => {
  const app = source('App.tsx')
  assert.match(app, /BasicLayout/)
  assert.match(app, /SystemStatus/)
  assert.doesNotMatch(app, /useState|useEffect|checkHealth|fetch\(/)
})

test('page data flows through a domain service and local CSS Modules', () => {
  const page = source('pages/SystemStatus/index.tsx')
  assert.match(page, /healthService\.checkHealth/)
  assert.doesNotMatch(page, /fetch\(|XRequest|from ['"]axios/)
  assert.match(page, /@\/typings\/health/)
  assert.match(page, /index\.module\.css/)
  assert.match(source('services/health.ts'), /\.\.\/typings\/health\.ts/)
  assert.match(source('typings/health.ts'), /export interface HealthReport/)
  assert.equal(existsSync(new URL('../src/services/health.types.ts', import.meta.url)), false)
  assert.equal(existsSync(new URL('../src/pages/SystemStatus/hooks/useHealthStatus.ts', import.meta.url)), false)
  assert.match(source('layouts/BasicLayout/index.tsx'), /children/)
})
