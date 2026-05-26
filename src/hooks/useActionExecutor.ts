import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import type { ActionConfig } from '@/types'

export function useActionExecutor() {
  const previewHiddenIds = useEditorStore((s) => s.previewHiddenIds)
  const setPreviewHidden = useEditorStore((s) => s.setPreviewHidden)

  const execute = useCallback(
    (actions: ActionConfig[]) => {
      for (const action of actions) {
        switch (action.type) {
          case 'alert':
            window.alert(action.params.message ?? '')
            break
          case 'link': {
            const url = action.params.url ?? ''
            if (!url) break
            if (action.params.openInNew) window.open(url, '_blank')
            else window.location.href = url
            break
          }
          case 'toggleVisible': {
            const { componentId, operation = 'toggle' } = action.params
            if (!componentId) break
            const isHidden = previewHiddenIds.includes(componentId)
            if (operation === 'show') setPreviewHidden(componentId, false)
            else if (operation === 'hide') setPreviewHidden(componentId, true)
            else setPreviewHidden(componentId, !isHidden)
            break
          }
        }
      }
    },
    [previewHiddenIds, setPreviewHidden],
  )

  return { execute }
}
