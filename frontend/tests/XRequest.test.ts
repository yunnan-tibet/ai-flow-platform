import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'node:http'
import abortController from '../src/utils/abortController.ts'
import * as module from '../src/utils/XRequest.ts'
const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('X-Request-Test', 'present')
  if (url.pathname === '/pending') return
  if (url.pathname === '/invalid') return response.end('<html>Error</html>')
  if (url.pathname === '/empty') {
    response.statusCode = 204
    return response.end()
  }
  if (url.pathname === '/unavailable') response.statusCode = 503
  let body = ''
  for await (const chunk of request) body += chunk
  response.end(JSON.stringify({
    method: request.method,
    query: Object.fromEntries(url.searchParams),
    body: body ? JSON.parse(body) : null,
    header: request.headers['x-custom'],
  }))
})
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

function requestClient() {
  return module.default
}

function errorKind(kind: string, status: number | null = null) {
  return (error: unknown) => {
    assert.ok(error instanceof module.RequestError)
    assert.equal(error.kind, kind)
    assert.equal(error.httpStatus, status)
    return true
  }
}

test('GET serializes params and returns the complete body', async () => {
  const result = await requestClient()({ url: `${baseURL}/echo`, params: { search: '中文 a&b' } })
  assert.deepEqual(result, { method: 'GET', query: { search: '中文 a&b' }, body: null })
})

test('POST sends data and caller headers', async () => {
  const result = await requestClient()({
    url: `${baseURL}/echo`, method: 'POST', data: { enabled: false, count: 0 },
    headers: { 'X-Custom': 'value' },
  })
  assert.deepEqual(result, { method: 'POST', query: {}, body: { enabled: false, count: 0 }, header: 'value' })
})

test('returnResponse includes body, HTTP status and headers', async () => {
  const result = await requestClient()<{ method: string }>({ url: `${baseURL}/echo`, returnResponse: true })
  assert.equal(result.status, 200)
  assert.equal(result.headers['x-request-test'], 'present')
  assert.equal(result.data.method, 'GET')
})

test('non-2xx rejects unless the caller explicitly accepts that status', async () => {
  const request = requestClient()
  await assert.rejects(request({ url: `${baseURL}/unavailable` }), errorKind('http', 503))
  const result = await request({
    url: `${baseURL}/unavailable`, returnResponse: true,
    axiosOptions: { validateStatus: status => status === 200 || status === 503 },
  })
  assert.equal(result.status, 503)
})

test('invalid JSON rejects with the response status', async () => {
  await assert.rejects(requestClient()({ url: `${baseURL}/invalid` }), errorKind('invalid-response', 200))
})

test('204 has no JSON body and remains a successful request', async () => {
  assert.equal(await requestClient()({ url: `${baseURL}/empty` }), undefined)
})

test('timeout ends the request and releases managed controllers', async () => {
  await assert.rejects(requestClient()({ url: `${baseURL}/pending`, timeoutMs: 20 }), errorKind('timeout'))
  assert.equal(abortController.controllerMap.size, 0)
})

test('external signal cancels real Axios transport', async () => {
  const controller = new AbortController()
  const pending = requestClient()({ url: `${baseURL}/pending`, signal: controller.signal })
  const assertion = assert.rejects(pending, errorKind('cancelled'))
  controller.abort()
  await assertion
  assert.equal(abortController.controllerMap.size, 0)
})

test('pre-aborted signals reject without starting transport', async () => {
  const controller = new AbortController()
  controller.abort()
  let calls = 0
  await assert.rejects(requestClient()({
    url: '/never', signal: controller.signal,
    axiosOptions: { adapter: async () => { calls++; throw new Error('must not run') } },
  }), errorKind('cancelled'))
  assert.equal(calls, 0)
})

test('abortKey cancellation isolates concurrent consumers of the same URL', async () => {
  const request = requestClient()
  const first = request({ url: `${baseURL}/pending`, abortKey: 'consumer-a' })
  const second = request({ url: `${baseURL}/pending`, abortKey: 'consumer-b', timeoutMs: 30 })
  const firstAssertion = assert.rejects(first, errorKind('cancelled'))
  const secondAssertion = assert.rejects(second, errorKind('timeout'))
  abortController.abort('consumer-a')
  assert.ok(abortController.controllerMap.has('consumer-b'))
  await Promise.all([firstAssertion, secondAssertion])
  assert.equal(abortController.controllerMap.size, 0)
})

test('network failures become safe Error objects without request credentials', async () => {
  const request = requestClient()
  await assert.rejects(request({
    url: `${baseURL}/echo`, headers: { Authorization: 'secret-test-value' },
    axiosOptions: { adapter: async () => { throw new Error('secret-test-value') } },
  }), error => {
    errorKind('network')(error)
    assert.ok(error instanceof Error)
    assert.doesNotMatch(error.message, /secret-test-value/)
    return true
  })
  assert.equal(abortController.controllerMap.size, 0)
})

test('successful and HTTP failure paths release all controllers', async () => {
  const request = requestClient()
  await request({ url: `${baseURL}/echo` })
  await assert.rejects(request({ url: `${baseURL}/unavailable` }))
  assert.equal(abortController.controllerMap.size, 0)
})
