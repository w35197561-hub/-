import type { ActionConfig } from '@/types'
import { useEditorStore } from '@/stores/editor'

export function useActionExecutor() {
  const editorStore = useEditorStore()

  const execute = (actions: ActionConfig[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'alert':
          window.alert(action.params.message ?? '')
          break

        case 'link': {
          const url = action.params.url ?? ''
          if (!url) break
          if (action.params.openInNew) {
            window.open(url, '_blank')
          } else {
            window.location.href = url
          }
          break
        }

        case 'toggleVisible': {
          const { componentId, operation = 'toggle' } = action.params
          if (!componentId) break
          const isHidden = editorStore.previewHiddenIds.includes(componentId)
          if (operation === 'show') editorStore.setPreviewHidden(componentId, false)
          else if (operation === 'hide') editorStore.setPreviewHidden(componentId, true)
          else editorStore.setPreviewHidden(componentId, !isHidden)
          break
        }

      }
    }
  }

  return { execute }
}
