// =====================
// 与前端共享的数据类型
// =====================

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
  type: string
  style: ComponentStyle
  props: ComponentProps
  events?: ComponentEvent[]
  children?: ComponentData[]
  slots?: Record<string, ComponentData[]>
  isContainer?: boolean
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

// =====================
// 接口响应类型
// =====================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 页面列表项（不含组件详情，用于列表展示）
export interface PageListItem {
  id: string
  title: string
  updatedAt: string
  createdAt: string
  componentCount: number
  style: PageData['style']
}

// 存储在磁盘上的页面记录（包含时间戳）
export interface PageRecord extends PageData {
  createdAt: string
  updatedAt: string
}
