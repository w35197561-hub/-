import { ComponentType } from '@/types'
import type { ComponentConfig } from '@/types'

export const componentConfigs: Partial<Record<ComponentType, ComponentConfig>> = {
  [ComponentType.TEXT]: {
    defaultProps: { content: '文本内容' },
    defaultStyle: { fontSize: 14, color: '#333333', backgroundColor: 'transparent' },
    propSetters: [
      { label: '文本内容', setter: 'TextareaSetter', field: 'content' },
    ],
    styleSetters: [
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize', setterProps: { min: 8, max: 72, step: 1 } },
      { label: '字体颜色', setter: 'ColorSetter', field: 'color' },
      { label: '背景颜色', setter: 'ColorSetter', field: 'backgroundColor' },
    ],
  },

  [ComponentType.NUMBER_INPUT]: {
    defaultProps: { min: 0, max: 100, step: 1, value: 0, placeholder: '' },
    defaultStyle: { width: 200, height: 40, fontSize: 14, borderWidth: 1, borderRadius: 4 },
    propSetters: [
      { label: '最小值', setter: 'NumberSetter', field: 'min' },
      { label: '最大值', setter: 'NumberSetter', field: 'max' },
      { label: '步长',   setter: 'NumberSetter', field: 'step', setterProps: { min: 0.01 } },
      {
        label: '默认值', setter: 'NumberSetter', field: 'value',
        setterProps: (props) => ({
          min:  props.min  as number,
          max:  props.max  as number,
          step: (props.step as number) || 1,
        }),
      },
    ],
    styleSetters: [
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize',    setterProps: { min: 8, max: 72, step: 1 } },
      { label: '边框宽度', setter: 'NumberSetter', field: 'borderWidth',  setterProps: { min: 0, max: 10, step: 1 } },
      { label: '边框颜色', setter: 'ColorSetter',  field: 'borderColor' },
      { label: '圆角',     setter: 'NumberSetter', field: 'borderRadius', setterProps: { min: 0, max: 50, step: 1 } },
    ],
  },
}
