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
}

export interface ComponentEvent {
  type: string
  handler: string
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
  CHART = 'Chart'
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