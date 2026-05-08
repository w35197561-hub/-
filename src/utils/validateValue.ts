import type { ValidationRule } from '@/types'

export function validateValue(value: unknown, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') return rule.message || '此项必填'
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
        if (typeof value === 'string') {
          try {
            if (!new RegExp(rule.value as string).test(value)) return rule.message || '格式不正确'
          } catch {
            // 无效正则视为通过，不阻断提交
          }
        }
        break
    }
  }
  return null
}
