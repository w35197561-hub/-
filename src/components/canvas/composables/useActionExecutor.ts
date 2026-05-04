import type { ActionConfig, ValidationRule } from '@/types'
import { ComponentType } from '@/types'
import { useEditorStore } from '@/stores/editor'

const INPUT_TYPES = [ComponentType.INPUT, ComponentType.TEXTAREA, ComponentType.NUMBER_INPUT]

const validateValue = (value: unknown, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '')
          return rule.message || '此项必填'
        break
      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number))
          return rule.message || `最少 ${rule.value} 个字符`
        break
      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number))
          return rule.message || `最多 ${rule.value} 个字符`
        break
      case 'min':
        if (typeof value === 'number' && value < (rule.value as number))
          return rule.message || `最小值为 ${rule.value}`
        break
      case 'max':
        if (typeof value === 'number' && value > (rule.value as number))
          return rule.message || `最大值为 ${rule.value}`
        break
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value as string).test(value))
          return rule.message || '格式不正确'
        break
    }
  }
  return null
}

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

        case 'submitForm': {
          const page = editorStore.currentPage
          if (!page) break
          editorStore.clearValidationErrors()

          let hasError = false
          for (const comp of page.components) {
            if (!INPUT_TYPES.includes(comp.type)) continue
            const rules = comp.props.rules as ValidationRule[] | undefined
            if (!rules?.length) continue

            const value = editorStore.previewValues[comp.id] ?? comp.props.value ?? ''
            const error = validateValue(value, rules)
            if (error) {
              editorStore.setValidationError(comp.id, error)
              hasError = true
            }
          }

          if (hasError) return  // 阻止后续动作执行
          break
        }
      }
    }
  }

  return { execute }
}
