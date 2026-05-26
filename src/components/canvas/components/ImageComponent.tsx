import { useMemo } from 'react'
import type { ComponentData } from '@/types'

export default function ImageComponent({ component }: { component: ComponentData }) {
  const src = component.props.src as string | undefined
  const style = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      boxSizing: 'border-box',
      border: component.style.borderWidth
        ? `${component.style.borderWidth}px solid ${component.style.borderColor ?? '#ccc'}`
        : 'none',
      borderRadius: component.style.borderRadius ? `${component.style.borderRadius}px` : '0',
      backgroundColor: component.style.backgroundColor ?? '#f5f5f5',
    }),
    [
      component.style.borderWidth,
      component.style.borderColor,
      component.style.borderRadius,
      component.style.backgroundColor,
    ],
  )

  return (
    <div style={style}>
      {src ? (
        <img
          src={src}
          alt={(component.props.alt as string) ?? ''}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            color: '#999',
            fontSize: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>{'\ud83d\uddbc'}</span>
          <span>{'\u8bf7\u8bbe\u7f6e\u56fe\u7247\u5730\u5740'}</span>
        </div>
      )}
    </div>
  )
}
