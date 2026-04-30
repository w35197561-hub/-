import { computed } from 'vue'
import type { ComponentStyle } from '@/types'

export function useComponentStyle(style: ComponentStyle) {
  const baseStyle = computed(() => ({
    width: '100%',
    height: '100%',
    boxSizing: 'border-box' as const,
    fontSize: `${style.fontSize ?? 14}px`,
    color: style.color ?? '#333333',
    backgroundColor: style.backgroundColor ?? 'transparent',
    border: style.borderWidth
      ? `${style.borderWidth}px solid ${style.borderColor ?? '#cccccc'}`
      : 'none',
    borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
  }))

  return { baseStyle }
}
