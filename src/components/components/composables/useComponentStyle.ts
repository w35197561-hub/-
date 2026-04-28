import type { ComponentStyle } from '@/types'

/**
 * 将 ComponentStyle 映射为 CSS 内联样式对象
 * 统一处理单位拼接，供所有叶子组件复用
 */
export function useComponentStyle(style: ComponentStyle) {
  const baseStyle = {
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
  }

  return { baseStyle }
}
