import { useMemo, useCallback } from 'react'
import type { ComponentData } from '@/types'
import { useComponentStyle } from '@/hooks/useComponentStyle'
import { useIsPreview } from '@/context/PreviewContext'
import { useActionExecutor } from '@/hooks/useActionExecutor'

export default function ButtonComponent({ component }: { component: ComponentData }) {
  const baseStyle = useComponentStyle(component.style)
  const isPreview = useIsPreview()
  const { execute } = useActionExecutor()

  const style = useMemo<React.CSSProperties>(
    () => ({
      ...baseStyle,
      color: component.style.color ?? '#ffffff',
      backgroundColor: component.style.backgroundColor ?? '#409eff',
      padding: '8px 16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      border: 'none',
      outline: 'none',
      transition: 'opacity 0.2s',
    }),
    [baseStyle, component.style.color, component.style.backgroundColor],
  )

  const handleClick = useCallback(() => {
    if (!isPreview) return
    const clickEvent = component.events?.find((e) => e.type === 'click')
    if (clickEvent?.actions?.length) execute(clickEvent.actions)
  }, [isPreview, component.events, execute])

  return (
    <button style={style} onClick={handleClick}>
      {(component.props.content as string) ?? ''}
    </button>
  )
}
