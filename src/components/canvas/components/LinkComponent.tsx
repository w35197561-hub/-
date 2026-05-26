import { useMemo } from 'react'
import type { ComponentData } from '@/types'
import { useComponentStyle } from '@/hooks/useComponentStyle'
import { useIsPreview } from '@/context/PreviewContext'
import { resolveHref } from '@/utils/resolveHref'

export default function LinkComponent({ component }: { component: ComponentData }) {
  const baseStyle = useComponentStyle(component.style)
  const isPreview = useIsPreview()
  const href = useMemo(
    () => resolveHref((component.props.href as string) || ''),
    [component.props.href],
  )
  const style = useMemo<React.CSSProperties>(
    () => ({ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    [baseStyle],
  )
  const innerStyle: React.CSSProperties = {
    textDecoration: 'underline',
    cursor: 'pointer',
    color: 'inherit',
    fontSize: 'inherit',
  }
  const content = (component.props.content as string) ?? ''

  return (
    <div style={style}>
      {isPreview ? (
        <a href={href} target={(component.props.target as string) || '_blank'} style={innerStyle}>
          {content}
        </a>
      ) : (
        <span style={innerStyle} onClick={(e) => e.preventDefault()}>
          {content}
        </span>
      )}
    </div>
  )
}
