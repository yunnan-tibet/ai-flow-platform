import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { healthService } from '@/services'
import type { HealthReport } from '@/typings/health'
import StatusRow from './components/StatusRow'
import styles from './index.module.css'

export default function SystemStatus() {
  const [report, setReport] = useState<HealthReport | null>(null)
  const [checking, setChecking] = useState(true)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const scope = useId()

  const load = useCallback(async () => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const nextReport = await healthService.checkHealth({
      signal: controller.signal,
      abortKey: `system-status:${scope}`,
    })
    // 取消之外再核对身份，旧请求不能覆盖刷新结果或卸载后的状态。
    if (controller.signal.aborted || activeRequest.current !== controller) return
    setReport(nextReport)
    setCheckedAt(new Date())
    setChecking(false)
  }, [scope])

  const refresh = () => {
    setChecking(true)
    void load()
  }

  useEffect(() => {
    void load()
    return () => {
      activeRequest.current?.abort()
      activeRequest.current = null
    }
  }, [load])

  return (
    <main className={styles.statusPage}>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>连接检查</p>
          <h1>系统状态</h1>
          <p className={styles.pageDescription}>检查 API 与 PostgreSQL 的连接状态。</p>
        </div>
        <button className={styles.refreshButton} type="button" disabled={checking} onClick={refresh}>
          <svg className={`${styles.refreshIcon} ${checking ? styles.spinning : ''}`}
            viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-1L20 9M4 15l2.3 3A7 7 0 0 0 17.9 17"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {checking ? '正在检查' : '重新检查'}
        </button>
      </div>

      <section aria-label="服务连接状态" aria-busy={checking}>
        <div className={styles.listHeading}><span>服务</span><span>检查结果</span></div>
        <ul className={styles.statusList} aria-live="polite" aria-atomic="true">
          <StatusRow name="api" title="API 服务" path="/api/health" check={report?.api} checking={checking} />
          <StatusRow name="database" title="PostgreSQL 数据库" path="/api/ready" check={report?.database} checking={checking} />
        </ul>
      </section>

      <div className={styles.checkMeta} role="status">
        <span>{checking ? '正在检查连接' : '检查完成'}</span>
        <span>
          最近检查：{checkedAt ? (
            <time dateTime={checkedAt.toISOString()}>{checkedAt.toLocaleTimeString('zh-CN', { hour12: false })}</time>
          ) : '尚未完成'}
        </span>
      </div>
      <p className={styles.scopeNote}>
        检查当前连通性，不代表业务功能或数据库迁移已就绪。服务恢复后，请重新检查。
      </p>
    </main>
  )
}
