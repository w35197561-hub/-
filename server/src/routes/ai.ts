import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import OpenAI from 'openai'
import type { ApiResponse } from '../types'

const router = Router()

// =====================
// AI 可执行的画布动作类型
// =====================
export type ActionType =
  | 'add_component'
  | 'update_component_style'
  | 'update_component_props'
  | 'delete_component'
  | 'set_page_style'
  | 'none'

export interface CanvasAction {
  type: ActionType
  /** 组件类型 (add_component 时必填): Text | Image | Button | Input | Form | Tabs */
  componentType?: string
  /** 目标组件 id (update/delete 时使用) */
  componentId?: string
  /** 样式更新 */
  style?: Record<string, unknown>
  /** 属性更新 */
  props?: Record<string, unknown>
  /** 页面样式 (set_page_style) */
  pageStyle?: Record<string, unknown>
}

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiChatRequest {
  messages: AiMessage[]
  /** 当前画布简要快照，传给 AI 作为上下文 */
  canvasContext?: {
    pageTitle?: string
    componentCount?: number
    components?: Array<{ id: string; type: string; props: Record<string, unknown> }>
  }
}

export interface AiChatResponse {
  reply: string
  actions: CanvasAction[]
}

// =====================
// System Prompt（告知 AI 输出格式）
// =====================
function buildSystemPrompt(canvasContext: AiChatRequest['canvasContext']): string {
  const componentList = (canvasContext?.components ?? [])
    .map(c => `  - id: ${c.id}, type: ${c.type}, props: ${JSON.stringify(c.props)}`)
    .join('\n') || '  （暂无组件）'

  return `你是一个可视化页面编辑器的 AI 助手，帮助用户通过自然语言操控画布。

当前画布状态：
- 页面标题：${canvasContext?.pageTitle ?? '未命名页面'}
- 组件数量：${canvasContext?.componentCount ?? 0}
- 组件列表：
${componentList}

【你的任务】理解用户的意图，严格以如下 JSON 格式响应（只返回 JSON，不要 markdown 代码块，不要多余文字）：
{
  "reply": "用中文向用户解释你做了什么",
  "actions": [
    {
      "type": "<动作类型>",
      "componentType": "<组件类型（仅 add_component 时填写）>",
      "componentId": "<目标组件 id（仅 update/delete 时填写）>",
      "style": { "<样式属性>": "<值>" },
      "props": { "<属性名>": "<值>" },
      "pageStyle": { "<样式属性>": "<值>" }
    }
  ]
}

【动作类型说明】
- add_component：在画布新增组件，需同时填 componentType
- update_component_style：更新已有组件的样式，需填 componentId 和 style
- update_component_props：更新已有组件的属性，需填 componentId 和 props
- delete_component：删除组件，需填 componentId
- set_page_style：修改页面整体样式（如背景色），填 pageStyle
- none：不执行任何画布操作，仅回复文字

【可用组件类型】Text（文本）、Image（图片）、Button（按钮）、Input（输入框）、Form（表单容器）、Tabs（标签页）

【示例】
用户说「添加一个大标题」→
{
  "reply": "好的，已为您添加了一个标题文本组件。",
  "actions": [{ "type": "add_component", "componentType": "Text", "props": { "content": "大标题" }, "style": { "fontSize": 32, "fontWeight": "bold", "width": 400, "height": 70 } }]
}

用户说「把页面背景改成深色」→
{
  "reply": "好的，已将页面背景色改为深色。",
  "actions": [{ "type": "set_page_style", "pageStyle": { "backgroundColor": "#1a1a2e" } }]
}

如果用户的意图不涉及画布操作，则 actions 为空数组。`
}

// =====================
// 内置规则引擎（fallback 模式，无需 API Key）
// =====================
function parseIntentToActions(userMsg: string): CanvasAction[] {
  const msg = userMsg.toLowerCase()

  if ((msg.includes('添加') || msg.includes('加') || msg.includes('新增') || msg.includes('插入')) &&
      (msg.includes('文本') || msg.includes('标题') || msg.includes('文字'))) {
    const isTitle = msg.includes('标题')
    return [{
      type: 'add_component',
      componentType: 'Text',
      props: { content: isTitle ? '标题文字' : '文本内容' },
      style: isTitle ? { fontSize: 28, fontWeight: 'bold', width: 300, height: 60 } : {}
    }]
  }
  if ((msg.includes('添加') || msg.includes('加') || msg.includes('新增')) && msg.includes('按钮')) {
    return [{ type: 'add_component', componentType: 'Button', props: { content: '按钮' } }]
  }
  if ((msg.includes('添加') || msg.includes('加') || msg.includes('新增')) && msg.includes('图片')) {
    return [{ type: 'add_component', componentType: 'Image', props: { src: '' }, style: { width: 200, height: 150 } }]
  }
  if ((msg.includes('添加') || msg.includes('加') || msg.includes('新增')) &&
      (msg.includes('输入框') || msg.includes('输入'))) {
    return [{ type: 'add_component', componentType: 'Input', props: { placeholder: '请输入内容' } }]
  }
  if ((msg.includes('添加') || msg.includes('加') || msg.includes('新增')) && msg.includes('表单')) {
    return [{ type: 'add_component', componentType: 'Form', props: { title: '表单容器' }, style: { width: 520, height: 260 } }]
  }
  if ((msg.includes('添加') || msg.includes('加') || msg.includes('新增')) &&
      (msg.includes('标签') || msg.includes('tab'))) {
    return [{ type: 'add_component', componentType: 'Tabs', style: { width: 560, height: 320 } }]
  }

  // 背景色
  if (msg.includes('背景')) {
    let color = '#f0f2f5'
    if (msg.includes('白')) color = '#ffffff'
    else if (msg.includes('黑') || msg.includes('深色')) color = '#1a1a2e'
    else if (msg.includes('灰')) color = '#f5f5f5'
    else if (msg.includes('蓝')) color = '#e6f4ff'
    else if (msg.includes('绿')) color = '#f0fff4'
    else if (msg.includes('红')) color = '#fff1f0'
    return [{ type: 'set_page_style', pageStyle: { backgroundColor: color } }]
  }

  return []
}

function mockReply(actions: CanvasAction[], userMsg: string): string {
  if (actions.length === 0) return `抱歉，我暂时无法理解"${userMsg}"。请配置 DEEPSEEK_API_KEY 后即可获得更智能的理解能力。`
  const action = actions[0]
  const typeLabel: Record<string, string> = { Text: '文本', Image: '图片', Button: '按钮', Input: '输入框', Form: '表单', Tabs: '标签页' }
  if (action.type === 'add_component') return `好的，已添加一个${typeLabel[action.componentType ?? ''] ?? action.componentType}组件。`
  if (action.type === 'set_page_style') return `好的，已将页面背景色更新为 ${action.pageStyle?.backgroundColor}。`
  return '操作已完成。'
}

// =====================
// DeepSeek AI 调用
// =====================
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY!
    })
  }
  return openaiClient
}

async function callDeepSeek(
  messages: AiMessage[],
  canvasContext: AiChatRequest['canvasContext']
): Promise<AiChatResponse> {
  const client = getOpenAIClient()
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(canvasContext) },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ],
    // deepseek-chat 支持 json_object 格式
    response_format: { type: 'json_object' },
    temperature: 0.3,
    stream: false
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'

  try {
    const parsed = JSON.parse(raw) as AiChatResponse
    // 保证 actions 是数组
    if (!Array.isArray(parsed.actions)) parsed.actions = []
    return parsed
  } catch {
    // 解析失败时作为纯文字回复
    return { reply: raw, actions: [] }
  }
}

// =====================
// POST /api/ai/chat
// =====================
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as AiChatRequest
    if (!body.messages || body.messages.length === 0) {
      res.status(400).json({ success: false, error: '消息不能为空' } as ApiResponse)
      return
    }

    const lastUserMsg = body.messages.filter(m => m.role === 'user').at(-1)?.content ?? ''
    let chatResponse: AiChatResponse

    if (process.env.DEEPSEEK_API_KEY) {
      // 已配置 API Key → 调用 DeepSeek
      chatResponse = await callDeepSeek(body.messages, body.canvasContext)
    } else {
      // 未配置 API Key → 规则引擎兜底
      console.warn('[AI] DEEPSEEK_API_KEY 未配置，使用规则引擎模式')
      const actions = parseIntentToActions(lastUserMsg)
      chatResponse = { reply: mockReply(actions, lastUserMsg), actions }
    }

    res.json({ success: true, data: chatResponse } as ApiResponse<AiChatResponse>)
  } catch (err) {
    next(err)
  }
})

// GET /api/ai/status - 查询 AI 配置状态
router.get('/status', (_req: Request, res: Response) => {
  const hasKey = !!process.env.DEEPSEEK_API_KEY
  res.json({
    success: true,
    data: {
      mode: hasKey ? 'deepseek' : 'mock',
      model: hasKey ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat') : null,
      baseURL: hasKey ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com') : null
    }
  })
})

export default router
