import { useState } from 'react'
import type { ComponentData } from '@/types'
import { useIsPreview } from '@/context/PreviewContext'
import { Toggle } from '@/components/ui/Toggle'

export default function SwitchComponent({ component }: { component: ComponentData }) {
  const isPreview = useIsPreview()
  const [localValue, setLocalValue] = useState((component.props.value as boolean) ?? false)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Toggle
        checked={isPreview ? localValue : ((component.props.value as boolean) ?? false)}
        onChange={isPreview ? setLocalValue : () => {}}
        disabled={!isPreview || (component.props.disabled as boolean)}
        activeText={(component.props.activeText as string) ?? ''}
        inactiveText={(component.props.inactiveText as string) ?? ''}
      />
    </div>
  )
}
