import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import * as service from '../src/services/health.ts'
let handle: (request: IncomingMessage, response: ServerResponse) => void
const server = createServer((request, response) => handle(request, response))
let baseURL = ''
before(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  baseURL = `http://127.0.0.1:${address.port}`
})
after(async () => {
  server.closeAllConnections()
  await new Promise<void>(resolve => server.close(() => resolve()))
})

function respond(response: ServerResponse, body: unknown, status = 200) {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

function checkHealth(options: { signal?: AbortSignal; timeoutMs?: number } = {}) {
  return service.checkHealth({ ...options, axiosOptions: { baseURL } })
}

test('checks both endpoints independently and recognizes healthy responses', async () => {
  const paths: string[] = []
  handle = (request, response) => {
    paths.push(request.url ?? '')
    respond(response, request.url === '/api/health' ? { api: 'ok' } : { api: 'ok', database: 'ok' })
  }
  const result = await checkHealth()
  assert.deepEqual(paths.sort(), ['/api/health', '/api/ready'])
  assert.equal(result.api.state, 'available')
  assert.equal(result.database.state, 'available')
  assert.equal(result.database.httpStatus, 200)
})

test('a valid readiness 503 means database unavailable, not API unavailable', async () => {
  handle = (request, response) => request.url === '/api/health'
    ? respond(response, { api: 'ok' })
    : respond(response, { api: 'ok', database: 'unavailable' }, 503)
  const result = await checkHealth()
  assert.equal(result.api.state, 'available')
  assert.equal(result.database.state, 'unavailable')
  assert.equal(result.database.httpStatus, 503)
})

test('network failure does not assert that the database is down', async () => {
  handle = request => request.socket.destroy()
  const result = await checkHealth()
  assert.equal(result.api.state, 'unknown')
  assert.equal(result.database.state, 'unknown')
  assert.equal(result.api.httpStatus, null)
  assert.equal(result.api.reason, 'network')
})

test('proxy errors and unrecognized 503 responses remain unknown', async () => {
  for (const status of [500, 502, 503]) {
    handle = (_request, response) => respond(response, { message: 'proxy error' }, status)
    const result = await checkHealth()
    assert.equal(result.api.state, 'unknown')
    assert.equal(result.database.state, 'unknown')
    assert.equal(result.database.httpStatus, status)
  }
})

test('HTTP 200 does not bypass runtime response validation', async () => {
  for (const body of [null, [], 'ok', { api: 'ok' },
    { api: 'error', database: 'ok' }, { api: 'ok', database: 'unavailable' }]) {
    handle = (_request, response) => respond(response, body)
    assert.equal((await checkHealth()).database.state, 'unknown')
  }
})

test('invalid JSON is handled without losing the HTTP status', async () => {
  for (const status of [200, 502, 503]) {
    handle = (_request, response) => { response.writeHead(status); response.end('<html>Error</html>') }
    const result = await checkHealth()
    assert.equal(result.api.state, 'unknown')
    assert.equal(result.database.httpStatus, status)
  }
})

test('one failed check does not discard the other check', async () => {
  handle = (request, response) => request.url === '/api/ready'
    ? request.socket.destroy()
    : respond(response, { api: 'ok' })
  const result = await checkHealth()
  assert.equal(result.api.state, 'available')
  assert.equal(result.database.state, 'unknown')
})

test('request timeout aborts both pending checks', async () => {
  handle = () => {}
  const result = await checkHealth({ timeoutMs: 20 })
  assert.equal(result.api.state, 'unknown')
  assert.equal(result.api.reason, 'timeout')
  assert.equal(result.database.reason, 'timeout')
})

test('external cancellation aborts pending requests', async () => {
  handle = () => {}
  const controller = new AbortController()
  const pending = checkHealth({ signal: controller.signal })
  controller.abort()
  const result = await pending
  assert.equal(result.api.reason, 'cancelled')
  assert.equal(result.database.reason, 'cancelled')
})

test('an already aborted signal starts no requests', async () => {
  const controller = new AbortController()
  controller.abort()
  let calls = 0
  handle = (_request, response) => { calls++; respond(response, { api: 'ok' }) }
  const result = await checkHealth({ signal: controller.signal })
  assert.equal(calls, 0)
  assert.equal(result.database.state, 'unknown')
  assert.equal(result.database.reason, 'cancelled')
})

test('a later check can recover after an earlier database failure', async () => {
  let available = false
  handle = (request, response) => {
    if (request.url === '/api/health') respond(response, { api: 'ok' })
    else respond(response, { api: 'ok', database: available ? 'ok' : 'unavailable' }, available ? 200 : 503)
  }
  assert.equal((await checkHealth()).database.state, 'unavailable')
  available = true
  assert.equal((await checkHealth()).database.state, 'available')
})
