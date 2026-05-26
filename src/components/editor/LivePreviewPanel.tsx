import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { PreviewProvider } from '@/context/PreviewContext'
import { ComponentType } from '@/types'
import type { ValidationRule } from '@/types'
import ComponentRenderer from '@/components/canvas/components/ComponentRenderer'
import { validateValue } from '@/utils/validateValue'
import { useToast } from '@/components/ui/Toast'
import styles from './LivePreviewPanel.module.css'

const INPUT_TYPES = [ComponentType.INPUT, ComponentType.TEXTAREA, ComponentType.NUMBER_INPUT]

export default function LivePreviewPanel() {
  const page = useEditorStore((s) => s.currentPage)
  const previewHiddenIds = useEditorStore((s) => s.previewHiddenIds)
  const previewValues = useEditorStore((s) => s.previewValues)
  const clearValidationErrors = useEditorStore((s) => s.clearValidationErrors)
  const setValidationError = useEditorStore((s) => s.setValidationError)
  const toast = useToast()

  const handleSubmit = useCallback(() => {
    if (!page) return
    clearValidationErrors()

    let hasError = false
    for (const comp of page.components) {
      if (!INPUT_TYPES.includes(comp.type)) continue
      const rules = comp.props.rules as ValidationRule[] | undefined
      if (!rules?.length) continue

      const value = previewValues[comp.id] ?? comp.props.value ?? ''
      const error = validateValue(value, rules)
      if (error) {
        setValidationError(comp.id, error)
        hasError = true
      }
    }

    if (!hasError) toast.success('\u63d0\u4ea4\u6210\u529f')
  }, [page, previewValues, clearValidationErrors, setValidationError, toast])

  return (
    <PreviewProvider isPreview={true}>
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div
            className={styles.canvas}
            style={{ backgroundColor: page?.style.backgroundColor || '#ffffff' }}
          >
            {page?.components.map((component) => (
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
        <div className={styles.footer}>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            {'\u63d0\u4ea4'}
          </button>
        </div>
      </div>
    </PreviewProvider>
  )
}
