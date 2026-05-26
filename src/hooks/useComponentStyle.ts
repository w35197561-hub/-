import { useMemo } from 'react'
import type { ComponentStyle } from '@/types'

export function buildComponentStyle(style: ComponentStyle): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    fontSize: `${style.fontSize ?? 14}px`,
    color: style.color ?? '#333333',
    backgroundColor: style.backgroundColor ?? 'transparent',
    border: style.borderWidth
      ? `${style.borderWidth}px solid ${style.borderColor ?? '#cccccc'}`
      : 'none',
    borderRadius: style.borderRadius ? `${style.borderRadius}px` : '0',
  }
}

export function useComponentStyle(style: ComponentStyle): React.CSSProperties {
  return useMemo(
    () => buildComponentStyle(style),
    [
      style.fontSize,
      style.color,
      style.backgroundColor,
      style.borderWidth,
      style.borderColor,
      style.borderRadius,
    ],
  )
}
