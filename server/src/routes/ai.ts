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
  | 'clear_canvas'
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

export interface AiChatRequest {
  messages: AiMessage[]
  canvasContext?: {
    pageTitle?: string
    componentCount?: number
    components?: Array<{
      id: string
      type: string
      props: Record<string, unknown>
      style?: { width: number; height: number }
    }>
  }
  generateMode?: 'append' | 'replace'
}

export interface AiChatResponse {
  reply: string
  actions: CanvasAction[]
}

// =====================
// System Prompt
// =====================
function buildSystemPrompt(
  canvasContext: AiChatRequest['canvasContext'],
  generateMode: 'append' | 'replace' = 'append',
): string {
  const componentList =
    (canvasContext?.components ?? [])
      .map(
        (c) =>
          `  - id:${c.id} type:${c.type} size:(w:${c.style?.width ?? '?'},h:${c.style?.height ?? '?'}) props:${JSON.stringify(c.props)}`,
      )
      .join('\n') || '  （暂无组件）'

  const modeHint =
    generateMode === 'replace'
      ? '【生成模式：全量替换】用户希望生成全新页面。请在 actions 数组第一个元素返回 {"type":"clear_canvas"}，然后返回所有新组件的 add_component。'
      : '【生成模式：追加】在现有组件基础上追加新组件，不要修改或删除已有组件。'

  return `你是一个可视化页面编辑器的 AI 助手。画布为流式布局，组件从上到下依次排列，每个组件占一行居中显示。

${modeHint}

当前画布状态：
- 页面标题：${canvasContext?.pageTitle ?? '未命名页面'}
- 组件数量：${canvasContext?.componentCount ?? 0}
- 组件列表：
${componentList}

【布局规则】
1. 流式布局：组件按 actions 数组顺序从上到下排列，无需指定 top/left
2. 只需在 style 中指定 width 和 height（像素数字）
3. 不同组件类型使用不同的推荐尺寸

【推荐组件尺寸】
- Text 标题：width:400, height:50, props 中加 fontSize:28
- Text 正文：width:600, height:36
- Input 输入框：width:400, height:44
- Button 按钮：width:200, height:44
- Image 图片：width:300, height:200
- Form 表单容器：width:560, height:300
- Tabs 标签页：width:700, height:360

【输出格式】严格 JSON，无 markdown 代码块：
{
  "reply": "中文说明",
  "actions": [
    {
      "type": "add_component",
      "componentType": "Text|Image|Button|Input|Form|Tabs",
      "style": { "width": 数字, "height": 数字 },
      "props": { "content": "..." }
    }
  ]
}

【动作类型说明】
- add_component：新增组件，需填 componentType、style、props
- update_component_style：更新样式，需填 componentId 和 style
- update_component_props：更新属性，需填 componentId 和 props
- delete_component：删除组件，需填 componentId
- set_page_style：修改页面样式（如背景色），填 pageStyle
- clear_canvas：清空画布所有组件（仅在全量替换模式使用，放在 actions 第一个）
- none：不执行操作，仅回复文字

【可用组件类型】Text（文本）、Image（图片）、Button（按钮）、Input（输入框）、Form（表单容器）、Tabs（标签页）

【示例：生成登录页】
用户说「生成一个登录页」→
{
  "reply": "已为您生成登录页，包含标题、用户名输入框、密码输入框和登录按钮。",
  "actions": [
    { "type": "clear_canvas" },
    { "type": "add_component", "componentType": "Text", "style": { "width": 400, "height": 50 }, "props": { "content": "用户登录", "fontSize": 28 } },
    { "type": "add_component", "componentType": "Input", "style": { "width": 400, "height": 44 }, "props": { "placeholder": "请输入用户名" } },
    { "type": "add_component", "componentType": "Input", "style": { "width": 400, "height": 44 }, "props": { "placeholder": "请输入密码", "type": "password" } },
    { "type": "add_component", "componentType": "Button", "style": { "width": 400, "height": 44 }, "props": { "content": "登录" } }
  ]
}

如果用户的意图不涉及画布操作，则 actions 为空数组。`
}

// =====================
// 内置规则引擎（fallback 模式）
// =====================
function parseIntentToActions(
  userMsg: string,
  generateMode: 'append' | 'replace' = 'append',
): CanvasAction[] {
  const msg = userMsg.toLowerCase()

  // Batch generation patterns
  const isGenerate =
    msg.includes('生成') || msg.includes('创建') || msg.includes('做一个') || msg.includes('帮我做')

  if (isGenerate && (msg.includes('登录') || msg.includes('login'))) {
    const prefix: CanvasAction[] = generateMode === 'replace' ? [{ type: 'clear_canvas' }] : []
    return [
      ...prefix,
      {
        type: 'add_component',
        componentType: 'Text',
        style: { width: 400, height: 50 },
        props: { content: '用户登录', fontSize: 28 },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '请输入用户名' },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '请输入密码', type: 'password' },
      },
      {
        type: 'add_component',
        componentType: 'Button',
        style: { width: 400, height: 44 },
        props: { content: '登录' },
      },
    ]
  }

  if (isGenerate && (msg.includes('注册') || msg.includes('register'))) {
    const prefix: CanvasAction[] = generateMode === 'replace' ? [{ type: 'clear_canvas' }] : []
    return [
      ...prefix,
      {
        type: 'add_component',
        componentType: 'Text',
        style: { width: 400, height: 50 },
        props: { content: '用户注册', fontSize: 28 },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '请输入用户名' },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '请输入邮箱' },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '请输入密码', type: 'password' },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '确认密码', type: 'password' },
      },
      {
        type: 'add_component',
        componentType: 'Button',
        style: { width: 400, height: 44 },
        props: { content: '注册' },
      },
    ]
  }

  if (isGenerate && (msg.includes('表单') || msg.includes('form'))) {
    const prefix: CanvasAction[] = generateMode === 'replace' ? [{ type: 'clear_canvas' }] : []
    return [
      ...prefix,
      {
        type: 'add_component',
        componentType: 'Text',
        style: { width: 400, height: 50 },
        props: { content: '基本信息', fontSize: 28 },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '请输入姓名' },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '请输入手机号' },
      },
      {
        type: 'add_component',
        componentType: 'Input',
        style: { width: 400, height: 44 },
        props: { placeholder: '请输入邮箱' },
      },
      {
        type: 'add_component',
        componentType: 'Button',
        style: { width: 200, height: 44 },
        props: { content: '提交' },
      },
    ]
  }

  if (isGenerate && (msg.includes('仪表') || msg.includes('dashboard'))) {
    const prefix: CanvasAction[] = generateMode === 'replace' ? [{ type: 'clear_canvas' }] : []
    return [
      ...prefix,
      {
        type: 'add_component',
        componentType: 'Text',
        style: { width: 600, height: 50 },
        props: { content: '数据概览', fontSize: 28 },
      },
      {
        type: 'add_component',
        componentType: 'Text',
        style: { width: 600, height: 36 },
        props: { content: '总用户数: 12,345 | 今日访问: 892 | 转化率: 5.6%' },
      },
      { type: 'add_component', componentType: 'Tabs', style: { width: 700, height: 360 } },
    ]
  }

  if (isGenerate && (msg.includes('落地') || msg.includes('landing'))) {
    const prefix: CanvasAction[] = generateMode === 'replace' ? [{ type: 'clear_canvas' }] : []
    return [
      ...prefix,
      {
        type: 'add_component',
        componentType: 'Text',
        style: { width: 600, height: 60 },
        props: { content: '欢迎使用我们的产品', fontSize: 32 },
      },
      {
        type: 'add_component',
        componentType: 'Text',
        style: { width: 600, height: 36 },
        props: { content: '简洁高效的可视化页面编辑器，让创意触手可及' },
      },
      {
        type: 'add_component',
        componentType: 'Image',
        style: { width: 500, height: 250 },
        props: { src: '', alt: 'Banner' },
      },
      {
        type: 'add_component',
        componentType: 'Button',
        style: { width: 200, height: 48 },
        props: { content: '立即体验' },
      },
    ]
  }

  // Single component patterns (existing)
  if (
    (msg.includes('添加') || msg.includes('加') || msg.includes('新增') || msg.includes('插入')) &&
    (msg.includes('文本') || msg.includes('标题') || msg.includes('文字'))
  ) {
    const isTitle = msg.includes('标题')
    return [
      {
        type: 'add_component',
        componentType: 'Text',
        props: { content: isTitle ? '标题文字' : '文本内容' },
        style: isTitle ? { fontSize: 28, width: 300, height: 60 } : {},
      },
    ]
  }
  if (
    (msg.includes('添加') || msg.includes('加') || msg.includes('新增')) &&
    msg.includes('按钮')
  ) {
    return [{ type: 'add_component', componentType: 'Button', props: { content: '按钮' } }]
  }
  if (
    (msg.includes('添加') || msg.includes('加') || msg.includes('新增')) &&
    msg.includes('图片')
  ) {
    return [
      {
        type: 'add_component',
        componentType: 'Image',
        props: { src: '' },
        style: { width: 200, height: 150 },
      },
    ]
  }
  if (
    (msg.includes('添加') || msg.includes('加') || msg.includes('新增')) &&
    (msg.includes('输入框') || msg.includes('输入'))
  ) {
    return [{ type: 'add_component', componentType: 'Input', props: { placeholder: '请输入内容' } }]
  }
  if (
    (msg.includes('添加') || msg.includes('加') || msg.includes('新增')) &&
    msg.includes('表单')
  ) {
    return [
      {
        type: 'add_component',
        componentType: 'Form',
        props: { title: '表单容器' },
        style: { width: 520, height: 260 },
      },
    ]
  }
  if (
    (msg.includes('添加') || msg.includes('加') || msg.includes('新增')) &&
    (msg.includes('标签') || msg.includes('tab'))
  ) {
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
  if (actions.length === 0)
    return `抱歉，我暂时无法理解"${userMsg}"。请配置 DEEPSEEK_API_KEY 后即可获得更智能的理解能力。`

  const addCount = actions.filter((a) => a.type === 'add_component').length
  if (addCount > 1) {
    const hasClear = actions.some((a) => a.type === 'clear_canvas')
    return `好的，已${hasClear ? '生成' : '追加'}了 ${addCount} 个组件。可按 Ctrl+Z 一次性撤销。`
  }

  const action = actions[0]!
  const typeLabel: Record<string, string> = {
    Text: '文本',
    Image: '图片',
    Button: '按钮',
    Input: '输入框',
    Form: '表单',
    Tabs: '标签页',
  }
  if (action.type === 'add_component')
    return `好的，已添加一个${typeLabel[action.componentType ?? ''] ?? action.componentType}组件。`
  if (action.type === 'set_page_style')
    return `好的，已将页面背景色更新为 ${action.pageStyle?.backgroundColor}。`
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
      apiKey: process.env.DEEPSEEK_API_KEY!,
    })
  }
  return openaiClient
}

async function callDeepSeek(
  messages: AiMessage[],
  canvasContext: AiChatRequest['canvasContext'],
  generateMode: 'append' | 'replace' = 'append',
): Promise<AiChatResponse> {
  const client = getOpenAIClient()
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(canvasContext, generateMode) },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    stream: false,
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'

  try {
    const parsed = JSON.parse(raw) as AiChatResponse
    if (!Array.isArray(parsed.actions)) parsed.actions = []
    return parsed
  } catch {
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

    const lastUserMsg = body.messages.filter((m) => m.role === 'user').at(-1)?.content ?? ''
    const generateMode = body.generateMode ?? 'append'
    let chatResponse: AiChatResponse

    if (process.env.DEEPSEEK_API_KEY) {
      chatResponse = await callDeepSeek(body.messages, body.canvasContext, generateMode)
    } else {
      console.warn('[AI] DEEPSEEK_API_KEY 未配置，使用规则引擎模式')
      const actions = parseIntentToActions(lastUserMsg, generateMode)
      chatResponse = { reply: mockReply(actions, lastUserMsg), actions }
    }

    res.json({ success: true, data: chatResponse } as ApiResponse<AiChatResponse>)
  } catch (err) {
    next(err)
  }
})

// GET /api/ai/status
router.get('/status', (_req: Request, res: Response) => {
  const hasKey = !!process.env.DEEPSEEK_API_KEY
  res.json({
    success: true,
    data: {
      mode: hasKey ? 'deepseek' : 'mock',
      model: hasKey ? process.env.DEEPSEEK_MODEL || 'deepseek-chat' : null,
      baseURL: hasKey ? process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com' : null,
    },
  })
})

export default router
