import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '@/stores/editorStore'
import { PreviewProvider } from '@/context/PreviewContext'
import ComponentRenderer from '@/components/canvas/components/ComponentRenderer'
import styles from './PreviewView.module.css'

export default function PreviewView() {
  const navigate = useNavigate()
  const currentPage = useEditorStore((s) => s.currentPage)
  const previewHiddenIds = useEditorStore((s) => s.previewHiddenIds)

  if (!currentPage) {
    return (
      <div className={styles.previewPage}>
        <div className={styles.toolbar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            &larr; {'\u8fd4\u56de\u7f16\u8f91\u5668'}
          </button>
        </div>
        <div className={styles.emptyState}>{'\u6682\u65e0\u9875\u9762\u6570\u636e'}</div>
      </div>
    )
  }

  return (
    <PreviewProvider isPreview={true}>
      <div className={styles.previewPage}>
        <div className={styles.toolbar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            &larr; {'\u8fd4\u56de\u7f16\u8f91\u5668'}
          </button>
          <span className={styles.pageTitle}>
            {currentPage.title || '\u9875\u9762\u9884\u89c8'}
          </span>
        </div>
        <div className={styles.canvasWrapper}>
          <div
            className={styles.canvas}
            style={{ backgroundColor: currentPage.style.backgroundColor }}
          >
            {currentPage.components.map((component) => (
              <div
                key={component.id}
                className={styles.component}
                style={{
                  width: `${component.style.width}px`,
                  height: `${component.style.height}px`,
                  display: previewHiddenIds.includes(component.id) ? 'none' : undefined,
                }}
              >
                <ComponentRenderer component={component} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PreviewProvider>
  )
}
