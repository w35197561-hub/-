export interface ComponentStyle {
  top: number
  left: number
  width: number
  height: number
  zIndex: number
  rotate: number
  fontSize?: number
  color?: string
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  borderRadius?: number
}

export interface ComponentProps {
  content?: string
  src?: string
  type?: string
  placeholder?: string
  [key: string]: unknown
}

export interface ComponentData {
  id: string
  type: ComponentType
  style: ComponentStyle
  props: ComponentProps
  events?: ComponentEvent[]
  children?: ComponentData[]
  slots?: Record<string, ComponentData[]>
  isContainer?: boolean
}

export type RuleType = 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern'

export interface ValidationRule {
  type: RuleType
  value?: string | number
  message?: string
}

export type ActionType = 'alert' | 'link' | 'toggleVisible'

export interface ActionConfig {
  type: ActionType
  params: {
    message?: string
    url?: string
    openInNew?: boolean
    componentId?: string
    operation?: 'show' | 'hide' | 'toggle'
  }
}

export interface ComponentEvent {
  type: string
  actions: ActionConfig[]
}

export interface PageData {
  id: string
  title: string
  components: ComponentData[]
  style: {
    width: number
    height: number
    backgroundColor: string
  }
}

export enum ComponentType {
  TEXT = 'Text',
  IMAGE = 'Image',
  BUTTON = 'Button',
  INPUT = 'Input',
  FORM = 'Form',
  CHART = 'Chart',
  TABS = 'Tabs',
  NUMBER_INPUT = 'NumberInput',
  SELECT = 'Select',
  TEXTAREA = 'Textarea',
  RADIO_GROUP = 'RadioGroup',
  CHECKBOX_GROUP = 'CheckboxGroup',
  DIVIDER = 'Divider',
  TIME_PICKER = 'TimePicker',
  TABLE = 'Table',
  COLLAPSE = 'Collapse',
}

export type SetterType =
  | 'InputSetter'
  | 'TextareaSetter'
  | 'NumberSetter'
  | 'ColorSetter'
  | 'SelectSetter'
  | 'StringListSetter'

export interface PropSetter {
  label: string
  setter: SetterType
  field: string
  setterProps?: Record<string, unknown> | ((props: ComponentProps) => Record<string, unknown>)
  optionsField?: string
}

export interface StyleSetter {
  label: string
  setter: SetterType
  field: keyof ComponentStyle
  setterProps?: Record<string, unknown>
}

export interface ComponentConfig {
  defaultProps: ComponentProps
  defaultStyle?: Partial<ComponentStyle>
  propSetters: PropSetter[]
  styleSetters?: StyleSetter[]
}

export interface Command {
  execute(): void
  undo(): void
}

export interface EditorState {
  currentPage: PageData | null
  currentComponent: ComponentData | null
  canvasScale: number
  snapToGrid: boolean
  showGuidelines: boolean
}

export interface HistoryState {
  undoStack: Command[]
  redoStack: Command[]
  maxHistorySize: number
}
