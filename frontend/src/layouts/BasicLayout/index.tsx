import type { ReactNode } from 'react'
import styles from './index.module.css'

export default function BasicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.appShell}>
      <header className={styles.appHeader}>
        <a className={styles.wordmark} href="/" aria-label="FlowInsight AI 首页">
          FlowInsight <span>AI</span>
        </a>
        <span className={styles.environmentLabel}>本地开发环境</span>
      </header>
      {children}
      <footer className={styles.appFooter}>
        <span>FlowInsight AI</span>
        <span>M0 · 工程基线</span>
      </footer>
    </div>
  )
}
