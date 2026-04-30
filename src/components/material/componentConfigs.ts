import { ComponentType } from '@/types'
import type { ComponentConfig } from '@/types'

export const componentConfigs: Record<ComponentType, ComponentConfig> = {
  [ComponentType.TEXT]: {
    defaultProps: { content: '文本内容' },
    defaultStyle: { fontSize: 14, color: '#333333', backgroundColor: 'transparent' },
    propSetters: [
      { label: '文本内容', setter: 'TextareaSetter', field: 'content' },
    ],
    styleSetters: [
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize',         setterProps: { min: 8, max: 72, step: 1 } },
      { label: '字体颜色', setter: 'ColorSetter',  field: 'color' },
      { label: '背景颜色', setter: 'ColorSetter',  field: 'backgroundColor' },
    ],
  },

  [ComponentType.BUTTON]: {
    defaultProps: { content: '按钮' },
    defaultStyle: { fontSize: 14, color: '#ffffff', backgroundColor: '#409eff', borderRadius: 4 },
    propSetters: [
      { label: '按钮文本', setter: 'InputSetter', field: 'content' },
    ],
    styleSetters: [
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize',         setterProps: { min: 8, max: 72, step: 1 } },
      { label: '字体颜色', setter: 'ColorSetter',  field: 'color' },
      { label: '背景颜色', setter: 'ColorSetter',  field: 'backgroundColor' },
      { label: '圆角',     setter: 'NumberSetter', field: 'borderRadius',     setterProps: { min: 0, max: 50, step: 1 } },
    ],
  },

  [ComponentType.IMAGE]: {
    defaultProps: { src: '', alt: '' },
    defaultStyle: { backgroundColor: '#f5f5f5', borderWidth: 0, borderRadius: 0 },
    propSetters: [
      { label: '图片地址', setter: 'InputSetter', field: 'src' },
      { label: '替代文本', setter: 'InputSetter', field: 'alt' },
    ],
    styleSetters: [
      { label: '背景颜色', setter: 'ColorSetter',  field: 'backgroundColor' },
      { label: '边框宽度', setter: 'NumberSetter', field: 'borderWidth',      setterProps: { min: 0, max: 10, step: 1 } },
      { label: '边框颜色', setter: 'ColorSetter',  field: 'borderColor' },
      { label: '圆角',     setter: 'NumberSetter', field: 'borderRadius',     setterProps: { min: 0, max: 50, step: 1 } },
    ],
  },

  [ComponentType.INPUT]: {
    defaultProps: { placeholder: '请输入内容', type: 'text' },
    defaultStyle: { width: 200, height: 40, fontSize: 14, borderWidth: 1, borderRadius: 4 },
    propSetters: [
      { label: '占位文本', setter: 'InputSetter', field: 'placeholder' },
    ],
    styleSetters: [
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize',         setterProps: { min: 8, max: 72, step: 1 } },
      { label: '字体颜色', setter: 'ColorSetter',  field: 'color' },
      { label: '背景颜色', setter: 'ColorSetter',  field: 'backgroundColor' },
      { label: '边框宽度', setter: 'NumberSetter', field: 'borderWidth',      setterProps: { min: 0, max: 10, step: 1 } },
      { label: '边框颜色', setter: 'ColorSetter',  field: 'borderColor' },
      { label: '圆角',     setter: 'NumberSetter', field: 'borderRadius',     setterProps: { min: 0, max: 50, step: 1 } },
    ],
  },

  [ComponentType.FORM]: {
    defaultProps: { title: '表单容器', columns: ['col1', 'col2'] },
    defaultStyle: { width: 520, height: 260 },
    propSetters: [
      { label: '容器标题', setter: 'InputSetter', field: 'title' },
    ],
    styleSetters: [
      { label: '背景颜色', setter: 'ColorSetter', field: 'backgroundColor' },
    ],
  },

  [ComponentType.TABS]: {
    defaultProps: {
      tabs: [
        { key: 'tab1', label: 'Tab 1' },
        { key: 'tab2', label: 'Tab 2' },
      ],
      activeTab: 'tab1',
    },
    defaultStyle: { width: 560, height: 320 },
    propSetters: [
      { label: '当前 Tab', setter: 'SelectSetter', field: 'activeTab', optionsField: 'tabs' },
    ],
    styleSetters: [
      { label: '背景颜色', setter: 'ColorSetter', field: 'backgroundColor' },
    ],
  },

  [ComponentType.CHART]: {
    defaultProps: { type: 'bar' },
    propSetters: [],
    styleSetters: [
      { label: '背景颜色', setter: 'ColorSetter', field: 'backgroundColor' },
    ],
  },

  [ComponentType.TEXTAREA]: {
    defaultProps: { placeholder: '请输入内容', rows: 4, maxlength: 500 },
    defaultStyle: { width: 200, height: 100, fontSize: 14, borderRadius: 4 },
    propSetters: [
      { label: '占位文本', setter: 'InputSetter',  field: 'placeholder' },
      { label: '行数',     setter: 'NumberSetter', field: 'rows',      setterProps: { min: 1, max: 20, step: 1 } },
      { label: '最大字数', setter: 'NumberSetter', field: 'maxlength', setterProps: { min: 0, step: 1 } },
    ],
    styleSetters: [
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize',     setterProps: { min: 8, max: 72, step: 1 } },
      { label: '字体颜色', setter: 'ColorSetter',  field: 'color' },
      { label: '背景颜色', setter: 'ColorSetter',  field: 'backgroundColor' },
      { label: '圆角',     setter: 'NumberSetter', field: 'borderRadius', setterProps: { min: 0, max: 50, step: 1 } },
    ],
  },

  [ComponentType.SELECT]: {
    defaultProps: {
      placeholder: '请选择',
      options: ['选项一', '选项二', '选项三'],
    },
    defaultStyle: { width: 200, height: 40, borderRadius: 4 },
    propSetters: [
      { label: '占位文本', setter: 'InputSetter',      field: 'placeholder' },
      { label: '选项列表', setter: 'StringListSetter', field: 'options' },
    ],
    styleSetters: [
      { label: '背景颜色', setter: 'ColorSetter',  field: 'backgroundColor' },
      { label: '圆角',     setter: 'NumberSetter', field: 'borderRadius', setterProps: { min: 0, max: 50, step: 1 } },
    ],
  },

  [ComponentType.RADIO_GROUP]: {
    defaultProps: {
      options: ['选项一', '选项二', '选项三'],
      defaultValue: '选项一',
    },
    defaultStyle: { width: 200, height: 100, fontSize: 14, color: '#333333' },
    propSetters: [
      { label: '选项列表', setter: 'StringListSetter', field: 'options' },
      { label: '默认选中', setter: 'InputSetter',      field: 'defaultValue' },
    ],
    styleSetters: [
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize', setterProps: { min: 8, max: 72, step: 1 } },
      { label: '文字颜色', setter: 'ColorSetter',  field: 'color' },
      { label: '背景颜色', setter: 'ColorSetter',  field: 'backgroundColor' },
    ],
  },

  [ComponentType.CHECKBOX_GROUP]: {
    defaultProps: {
      options: ['选项一', '选项二', '选项三'],
      defaultValues: ['选项一'],
    },
    defaultStyle: { width: 200, height: 100, fontSize: 14, color: '#333333' },
    propSetters: [
      { label: '选项列表', setter: 'StringListSetter', field: 'options' },
      { label: '默认选中', setter: 'StringListSetter', field: 'defaultValues' },
    ],
    styleSetters: [
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize', setterProps: { min: 8, max: 72, step: 1 } },
      { label: '文字颜色', setter: 'ColorSetter',  field: 'color' },
      { label: '背景颜色', setter: 'ColorSetter',  field: 'backgroundColor' },
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
      { label: '字体大小', setter: 'NumberSetter', field: 'fontSize',         setterProps: { min: 8, max: 72, step: 1 } },
      { label: '边框宽度', setter: 'NumberSetter', field: 'borderWidth',      setterProps: { min: 0, max: 10, step: 1 } },
      { label: '边框颜色', setter: 'ColorSetter',  field: 'borderColor' },
      { label: '圆角',     setter: 'NumberSetter', field: 'borderRadius',     setterProps: { min: 0, max: 50, step: 1 } },
    ],
  },
}
