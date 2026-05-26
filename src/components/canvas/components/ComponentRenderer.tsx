import type { ComponentData } from '@/types'
import { ComponentType } from '@/types'
import TextComponent from './TextComponent'
import ImageComponent from './ImageComponent'
import ButtonComponent from './ButtonComponent'
import InputComponent from './InputComponent'
import FormComponent from './FormComponent'
import TabsComponent from './TabsComponent'
import NumberInputComponent from './NumberInputComponent'
import SelectComponent from './SelectComponent'
import TextareaComponent from './TextareaComponent'
import RadioGroupComponent from './RadioGroupComponent'
import CheckboxGroupComponent from './CheckboxGroupComponent'
import DividerComponent from './DividerComponent'
import TimePickerComponent from './TimePickerComponent'
import CollapseComponent from './CollapseComponent'
import SwitchComponent from './SwitchComponent'
import CascaderComponent from './CascaderComponent'
import LinkComponent from './LinkComponent'
import TreeComponent from './TreeComponent'
import TableComponent from './TableComponent'

const componentMap: Record<ComponentType, React.ComponentType<{ component: ComponentData }>> = {
  [ComponentType.TEXT]: TextComponent,
  [ComponentType.IMAGE]: ImageComponent,
  [ComponentType.BUTTON]: ButtonComponent,
  [ComponentType.INPUT]: InputComponent,
  [ComponentType.FORM]: FormComponent,
  [ComponentType.CHART]: TextComponent,
  [ComponentType.TABS]: TabsComponent,
  [ComponentType.NUMBER_INPUT]: NumberInputComponent,
  [ComponentType.SELECT]: SelectComponent,
  [ComponentType.TEXTAREA]: TextareaComponent,
  [ComponentType.RADIO_GROUP]: RadioGroupComponent,
  [ComponentType.CHECKBOX_GROUP]: CheckboxGroupComponent,
  [ComponentType.DIVIDER]: DividerComponent,
  [ComponentType.TIME_PICKER]: TimePickerComponent,
  [ComponentType.COLLAPSE]: CollapseComponent,
  [ComponentType.SWITCH]: SwitchComponent,
  [ComponentType.CASCADER]: CascaderComponent,
  [ComponentType.LINK]: LinkComponent,
  [ComponentType.TREE]: TreeComponent,
  [ComponentType.TABLE]: TableComponent,
}

export default function ComponentRenderer({ component }: { component: ComponentData }) {
  const Comp = componentMap[component.type] ?? TextComponent
  return <Comp component={component} />
}
