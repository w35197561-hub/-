/**
 * AI 对话 API 服务层
 */

export type ActionType =
  | 'add_component'
  | 'update_component_style'
  | 'update_component_props'
  | 'delete_component'
  | 'set_page_style'
  | 'none'

export interface CanvasAction {
  type: ActionType
  componentType?: string
  componentId?: string
  style?: Record<string, unknown>
  props?: Record<string, unknown>
  pageStyle?: Record<string, unknown>
}

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiChatResult {
  reply: string
  actions: CanvasAction[]
}

/**
 * 向后端发送 AI 对话请求
 */
export async function chatWithAI(
  messages: AiMessage[],
  canvasContext?: {
    pageTitle?: string
    componentCount?: number
    components?: Array<{ id: string; type: string; props: Record<string, unknown> }>
  }
): Promise<AiChatResult> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, canvasContext })
  })

  const json = (await res.json()) as {
    success: boolean
    data?: AiChatResult
    error?: string
  }

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'AI 服务请求失败')
  }

  return json.data
}
