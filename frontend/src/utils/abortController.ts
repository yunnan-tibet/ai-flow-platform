export interface AbortRequestOptions {
  url?: string
  signal?: AbortSignal
  /** 默认按 URL 管理；不同页面实例可使用独立分组。 */
  abortKey?: string
}

export type ManagedAbortOptions<T extends AbortRequestOptions> = Omit<
  T,
  'signal'
> & {
  signal?: AbortSignal
  _abortController?: AbortController
}

/** 默认导出共享管理器；需要完全隔离的消费者可创建自己的实例。 */
export function createAbortControllerManager() {
  const controllerMap = new Map<string, Set<AbortController>>()
  const registrations = new WeakMap<
    AbortController,
    { key: string; detach: () => void }
  >()

  function release(controller: AbortController) {
    const registration = registrations.get(controller)
    if (!registration) return
    registration.detach()
    registrations.delete(controller)
    const controllers = controllerMap.get(registration.key)
    controllers?.delete(controller)
    if (controllers?.size === 0) controllerMap.delete(registration.key)
  }

  function setFlag<T extends AbortRequestOptions>(
    options: T,
  ): ManagedAbortOptions<T> {
    if (!options.url || typeof AbortController === 'undefined') return options

    const key = options.abortKey || options.url
    const controller = new AbortController()
    const parentSignal = options.signal
    const forwardAbort = () => controller.abort(parentSignal?.reason)
    const releaseOnAbort = () => release(controller)

    const controllers = controllerMap.get(key) ?? new Set<AbortController>()
    controllers.add(controller)
    controllerMap.set(key, controllers)
    registrations.set(controller, {
      key,
      detach: () => {
        parentSignal?.removeEventListener('abort', forwardAbort)
        controller.signal.removeEventListener('abort', releaseOnAbort)
      },
    })
    controller.signal.addEventListener('abort', releaseOnAbort, { once: true })

    // 不能覆盖已有 signal 的取消能力；将它转发到本次管理的 controller。
    if (parentSignal?.aborted) {
      forwardAbort()
    } else {
      parentSignal?.addEventListener('abort', forwardAbort, { once: true })
    }

    return { ...options, signal: controller.signal, _abortController: controller }
  }

  /** 传 key 只取消该分组；不传则取消此管理器中全部请求。 */
  function abort(urlKey = '', onlyLatest = false) {
    // 固定本次取消集合，避免 abort 回调中新建的请求也被取消。
    const controllers = urlKey
      ? [...(controllerMap.get(urlKey) ?? [])]
      : [...controllerMap.values()].flatMap((set) => [...set])
    const targets = urlKey && onlyLatest ? controllers.slice(-1) : controllers
    targets.forEach((controller) => controller.abort())
  }

  /** 在请求 finally 中调用；按 controller 身份清理，不依赖改写后的 URL。 */
  function clearController(options?: { _abortController?: AbortController }) {
    if (options?._abortController) release(options._abortController)
  }

  return {
    controllerMap: controllerMap as ReadonlyMap<
      string,
      ReadonlySet<AbortController>
    >,
    setFlag,
    abort,
    clearController,
  }
}

const abortController = createAbortControllerManager()
export default abortController
