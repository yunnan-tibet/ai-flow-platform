import type { ServiceCheck, ServiceCheckReason } from '@/typings/health'
import styles from './index.module.css'

interface StatusRowProps {
  name: 'api' | 'database'
  title: string
  path: string
  check: ServiceCheck | undefined
  checking: boolean
}

const details: Record<ServiceCheckReason, string> = {
  'api-ok': '服务正常响应',
  'database-ok': '连接及只读查询成功',
  'database-unavailable': 'API 已响应，数据库暂时不可用',
  'invalid-contract': '未收到符合约定的检查响应',
  'invalid-response': '响应无法解析，无法确认服务状态',
  http: '未收到符合约定的检查响应',
  network: '请求失败，请确认后端服务和开发代理',
  timeout: '请求超时，请确认开发服务已启动后重试',
  cancelled: '检查已取消',
}

export default function StatusRow({ name, title, path, check, checking }: StatusRowProps) {
  const state = checking ? 'checking' : (check?.state ?? 'unknown')
  const label = checking ? '检查中'
    : state === 'available' ? '可用'
      : state === 'unavailable' ? '不可用'
        : name === 'api' ? '请求失败' : '未知'

  return (
    <li className={styles.statusRow}>
      <div className={styles.serviceName}>
        <span className={styles.serviceNumber} aria-hidden="true">{name === 'api' ? '01' : '02'}</span>
        <div><h2>{title}</h2><code>{path}</code></div>
      </div>
      <div className={styles.serviceResult}>
        <span className={`${styles.statusLabel} ${styles[state]}`}>
          <span className={styles.statusDot} aria-hidden="true" />{label}
        </span>
        <p>{checking ? '正在获取最新状态…' : check && details[check.reason]}</p>
        {!checking && check?.httpStatus != null && (
          <span className={styles.httpStatus}>HTTP {check.httpStatus}</span>
        )}
      </div>
    </li>
  )
}
