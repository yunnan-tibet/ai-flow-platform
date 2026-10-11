import XRequest, { RequestError } from '../utils/XRequest.ts'
import type {
  ApiHealthResponse, DatabaseReadinessResponse, HealthCheckOptions,
  HealthReport, ServiceCheck,
} from '../typings/health.ts'

function isApiHealth(value: unknown): value is ApiHealthResponse {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    'api' in value && value.api === 'ok'
}

function isDatabaseReadiness(value: unknown): value is DatabaseReadinessResponse {
  return isApiHealth(value) && 'database' in value &&
    (value.database === 'ok' || value.database === 'unavailable')
}

async function checkService(
  service: 'api' | 'database',
  options: HealthCheckOptions,
): Promise<ServiceCheck> {
  try {
    const response = await XRequest<unknown>({
      url: service === 'api' ? '/api/health' : '/api/ready',
      method: 'GET',
      signal: options.signal,
      abortKey: options.abortKey,
      timeoutMs: options.timeoutMs,
      headers: { 'Cache-Control': 'no-cache' },
      returnResponse: true,
      axiosOptions: {
        ...options.axiosOptions,
        validateStatus: status => status === 200 || (service === 'database' && status === 503),
      },
    })
    const { status: httpStatus, data } = response
    if (service === 'api' && httpStatus === 200 && isApiHealth(data)) {
      return { state: 'available', reason: 'api-ok', httpStatus }
    }
    if (service === 'database' && isDatabaseReadiness(data)) {
      if (httpStatus === 200 && data.database === 'ok') {
        return { state: 'available', reason: 'database-ok', httpStatus }
      }
      if (httpStatus === 503 && data.database === 'unavailable') {
        return { state: 'unavailable', reason: 'database-unavailable', httpStatus }
      }
    }
    return { state: 'unknown', reason: 'invalid-contract', httpStatus }
  } catch (error) {
    return {
      state: 'unknown',
      reason: error instanceof RequestError ? error.kind : 'network',
      httpStatus: error instanceof RequestError ? error.httpStatus : null,
    }
  }
}

export function getApiHealth(options: HealthCheckOptions = {}): Promise<ServiceCheck> {
  return checkService('api', options)
}

export function getDatabaseReadiness(options: HealthCheckOptions = {}): Promise<ServiceCheck> {
  return checkService('database', options)
}

export async function checkHealth(options: HealthCheckOptions = {}): Promise<HealthReport> {
  const [api, database] = await Promise.all([
    getApiHealth(options), getDatabaseReadiness(options),
  ])
  return { api, database }
}
