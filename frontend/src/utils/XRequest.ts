import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import abortController from './abortController.ts'

export type RequestErrorKind = 'http' | 'network' | 'timeout' | 'cancelled' | 'invalid-response'

/** 不携带 Axios config/原始异常，避免凭证进入展示或日志。 */
export class RequestError extends Error {
  readonly kind: RequestErrorKind
  readonly httpStatus: number | null

  constructor(kind: RequestErrorKind, httpStatus: number | null = null) {
    super(`Request failed: ${kind}${httpStatus === null ? '' : ` (${httpStatus})`}`)
    this.name = 'RequestError'
    this.kind = kind
    this.httpStatus = httpStatus
  }
}

export interface IRequestProps {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: Record<string, unknown> | URLSearchParams
  data?: unknown
  headers?: AxiosRequestConfig<unknown>['headers']
  signal?: AbortSignal
  abortKey?: string
  timeoutMs?: number
  returnResponse?: boolean
  /** 额外传输配置；核心参数及 JSON 解析仍由统一入口管理。 */
  axiosOptions?: Omit<AxiosRequestConfig<unknown>,
    'url' | 'method' | 'params' | 'data' | 'headers' | 'signal' | 'timeout' |
    'responseType' | 'transformResponse'>
}

export interface RequestResponse<T> {
  data: T
  status: number
  headers: AxiosResponse<unknown>['headers']
}

const instance = axios.create({ timeout: 8_000 })

function normalizeError(error: unknown): RequestError {
  if (error instanceof RequestError) return error
  if (axios.isCancel(error)) return new RequestError('cancelled')
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new RequestError('timeout')
    }
    if (error.response) return new RequestError('http', error.response.status)
  }
  return new RequestError('network')
}

function XRequest<T = unknown>(props: IRequestProps & { returnResponse: true }): Promise<RequestResponse<T>>
function XRequest<T = unknown>(props: IRequestProps & { returnResponse?: false }): Promise<T>
function XRequest<T = unknown>(props: IRequestProps): Promise<T | RequestResponse<T>>
async function XRequest<T = unknown>(props: IRequestProps): Promise<T | RequestResponse<T>> {
  const managed = abortController.setFlag(props)
  try {
    const response = await instance.request<string, AxiosResponse<string>, unknown>({
      ...props.axiosOptions,
      url: props.url,
      method: props.method ?? 'GET',
      params: props.params,
      data: props.data,
      headers: props.headers,
      timeout: props.timeoutMs ?? 8_000,
      signal: managed.signal,
      // 显式解析，确保非法 JSON 不被 Axios 宽松解析吞掉，同时保留状态码。
      responseType: 'text',
      transformResponse: [(data: unknown) => data],
    })

    let body: unknown
    if (response.status !== 204 && response.status !== 205) {
      try {
        body = JSON.parse(response.data)
      } catch {
        throw new RequestError('invalid-response', response.status)
      }
    }
    // 泛型提供调用类型，不验证 DTO；领域 service 对 unknown 做运行时校验。
    const data = body as T
    return props.returnResponse
      ? { data, status: response.status, headers: response.headers }
      : data
  } catch (error) {
    throw normalizeError(error)
  } finally {
    abortController.clearController(managed)
  }
}

export default XRequest
