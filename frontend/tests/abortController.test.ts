import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAbortControllerManager } from '../src/utils/abortController.ts'

test('setFlag preserves options without mutating the caller', () => {
  const manager = createAbortControllerManager()
  const options = { url: '/api/ready', method: 'GET' }
  const managed = manager.setFlag(options)
  assert.equal(managed.method, 'GET')
  assert.equal(managed.signal?.aborted, false)
  assert.equal('signal' in options, false)
  assert.notEqual(managed, options)
  assert.equal(manager.controllerMap.get('/api/ready')?.size, 1)
  manager.clearController(managed)
})

test('options without a URL create no managed controller', () => {
  const manager = createAbortControllerManager()
  const input: { url?: string; method: string } = { method: 'GET' }
  const options = manager.setFlag(input)
  assert.equal(options._abortController, undefined)
  assert.equal(manager.controllerMap.size, 0)
})

test('abort(url) cancels all requests for that URL, not other URLs', () => {
  const manager = createAbortControllerManager()
  const first = manager.setFlag({ url: '/api/ready' })
  const second = manager.setFlag({ url: '/api/ready' })
  const other = manager.setFlag({ url: '/api/health' })
  manager.abort('/api/ready')
  assert.equal(first.signal?.aborted, true)
  assert.equal(second.signal?.aborted, true)
  assert.equal(other.signal?.aborted, false)
  assert.equal(manager.controllerMap.size, 1)
  manager.clearController(other)
})

test('onlyLatest cancels the newest active request', () => {
  const manager = createAbortControllerManager()
  const first = manager.setFlag({ url: '/api/ready' })
  const second = manager.setFlag({ url: '/api/ready' })
  manager.abort('/api/ready', true)
  assert.equal(first.signal?.aborted, false)
  assert.equal(second.signal?.aborted, true)
  assert.equal(manager.controllerMap.get('/api/ready')?.size, 1)
  manager.abort('/api/ready', true)
  assert.equal(first.signal?.aborted, true)
  assert.equal(manager.controllerMap.size, 0)
})

test('abort() cancels all managed requests and repeated cleanup is harmless', () => {
  const manager = createAbortControllerManager()
  const first = manager.setFlag({ url: '/api/health' })
  const second = manager.setFlag({ url: '/api/ready' })
  manager.abort()
  assert.equal(first.signal?.aborted, true)
  assert.equal(second.signal?.aborted, true)
  assert.equal(manager.controllerMap.size, 0)
  manager.clearController(first)
  manager.clearController(second)
  manager.clearController()
  manager.abort('/missing')
})

test('cleanup uses controller identity even after URL rewriting', () => {
  const manager = createAbortControllerManager()
  const first = manager.setFlag({ url: '/api/ready' })
  const second = manager.setFlag({ url: '/api/ready' })
  first.url = 'http://127.0.0.1:8000/api/ready'
  manager.clearController(first)
  assert.equal(first.signal?.aborted, false)
  assert.equal(manager.controllerMap.get('/api/ready')?.size, 1)
  manager.abort('/api/ready')
  assert.equal(second.signal?.aborted, true)
  assert.equal(first.signal?.aborted, false)
})

test('external signal still cancels the managed request and releases it', () => {
  const manager = createAbortControllerManager()
  const parent = new AbortController()
  const reason = new Error('page unmounted')
  const managed = manager.setFlag({ url: '/api/ready', signal: parent.signal })
  parent.abort(reason)
  assert.equal(managed.signal?.aborted, true)
  assert.equal(managed.signal?.reason, reason)
  assert.equal(manager.controllerMap.size, 0)
})

test('an already cancelled external signal stays cancelled', () => {
  const manager = createAbortControllerManager()
  const parent = new AbortController()
  parent.abort()
  const managed = manager.setFlag({ url: '/api/ready', signal: parent.signal })
  assert.equal(managed.signal?.aborted, true)
  assert.equal(manager.controllerMap.size, 0)
})

test('completion detaches the external signal and does not remove newer requests', () => {
  const manager = createAbortControllerManager()
  const parent = new AbortController()
  const finished = manager.setFlag({ url: '/api/ready', signal: parent.signal })
  manager.clearController(finished)
  const current = manager.setFlag({ url: '/api/ready' })
  manager.clearController(finished)
  parent.abort()
  assert.equal(finished.signal?.aborted, false)
  assert.equal(current.signal?.aborted, false)
  assert.equal(manager.controllerMap.get('/api/ready')?.size, 1)
  manager.clearController(current)
})

test('abortKey isolates consumers sharing the same URL', () => {
  const manager = createAbortControllerManager()
  const first = manager.setFlag({ url: '/api/ready', abortKey: 'page-A:ready' })
  const second = manager.setFlag({ url: '/api/ready', abortKey: 'page-B:ready' })
  manager.abort('page-A:ready')
  assert.equal(first.signal?.aborted, true)
  assert.equal(second.signal?.aborted, false)
  manager.clearController(second)
})

test('a request created during cancellation is not accidentally cancelled', () => {
  const manager = createAbortControllerManager()
  const first = manager.setFlag({ url: '/api/ready' })
  let next: ReturnType<typeof manager.setFlag> | undefined
  first.signal?.addEventListener('abort', () => {
    next = manager.setFlag({ url: '/api/ready' })
  })
  manager.abort('/api/ready')
  assert.equal(first.signal?.aborted, true)
  assert.equal(next?.signal?.aborted, false)
  assert.equal(manager.controllerMap.get('/api/ready')?.size, 1)
  manager.clearController(next)
})
