import type { IRequestProps, RequestErrorKind } from '../utils/XRequest.ts'

export interface ApiHealthResponse {
  api: 'ok'
}

export interface DatabaseReadinessResponse extends ApiHealthResponse {
  database: 'ok' | 'unavailable'
}

export type ServiceState = 'available' | 'unavailable' | 'unknown'
export type ServiceCheckReason = RequestErrorKind | 'invalid-contract' |
  'api-ok' | 'database-ok' | 'database-unavailable'

export interface ServiceCheck {
  state: ServiceState
  reason: ServiceCheckReason
  httpStatus: number | null
}

export interface HealthReport {
  api: ServiceCheck
  database: ServiceCheck
}

export interface HealthCheckOptions {
  signal?: AbortSignal
  abortKey?: string
  timeoutMs?: number
  /** 测试/运行环境可替换传输地址，不可改变此领域的状态码约定。 */
  axiosOptions?: Pick<NonNullable<IRequestProps['axiosOptions']>, 'baseURL' | 'adapter'>
}
