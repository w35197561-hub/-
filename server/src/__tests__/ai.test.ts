import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

const app = createApp()

// AI 接口测试：全部使用规则引擎模式（不需要 DEEPSEEK_API_KEY）
// 验证：后端路由格式正确 + 规则引擎能正确解析意图

describe('POST /api/ai/chat', () => {
  it('messages 为空时返回 400', async () => {
    const res = await request(app).post('/api/ai/chat').send({ messages: [] })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('缺少 messages 字段返回 400', async () => {
    const res = await request(app).post('/api/ai/chat').send({})
    expect(res.status).toBe(400)
  })

  it('返回结构包含 reply 和 actions 数组', async () => {
    const res = await request(app).post('/api/ai/chat').send({
      messages: [{ role: 'user', content: '你好' }]
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('reply')
    expect(Array.isArray(res.body.data.actions)).toBe(true)
  })
})

// ── 规则引擎意图解析 ──────────────────────────────────────────────
describe('AI 规则引擎 - 添加组件意图', () => {
  async function chat(content: string) {
    const res = await request(app).post('/api/ai/chat').send({
      messages: [{ role: 'user', content }]
    })
    return res.body.data as { reply: string; actions: Array<{ type: string; componentType?: string }> }
  }

  it('识别"添加文本"意图 → add_component Text', async () => {
    const result = await chat('帮我添加一个文本')
    expect(result.actions[0]?.type).toBe('add_component')
    expect(result.actions[0]?.componentType).toBe('Text')
  })

  it('识别"添加标题"意图 → add_component Text', async () => {
    const result = await chat('添加一个大标题')
    expect(result.actions[0]?.type).toBe('add_component')
    expect(result.actions[0]?.componentType).toBe('Text')
  })

  it('识别"添加按钮"意图 → add_component Button', async () => {
    const result = await chat('新增一个按钮')
    expect(result.actions[0]?.type).toBe('add_component')
    expect(result.actions[0]?.componentType).toBe('Button')
  })

  it('识别"添加图片"意图 → add_component Image', async () => {
    const result = await chat('加一张图片')
    expect(result.actions[0]?.type).toBe('add_component')
    expect(result.actions[0]?.componentType).toBe('Image')
  })

  it('识别"添加输入框"意图 → add_component Input', async () => {
    const result = await chat('添加输入框')
    expect(result.actions[0]?.type).toBe('add_component')
    expect(result.actions[0]?.componentType).toBe('Input')
  })

  it('识别"添加表单"意图 → add_component Form', async () => {
    const result = await chat('新增一个表单')
    expect(result.actions[0]?.type).toBe('add_component')
    expect(result.actions[0]?.componentType).toBe('Form')
  })

  it('识别"添加Tab"意图 → add_component Tabs', async () => {
    const result = await chat('添加标签页')
    expect(result.actions[0]?.type).toBe('add_component')
    expect(result.actions[0]?.componentType).toBe('Tabs')
  })
})

describe('AI 规则引擎 - 背景色意图', () => {
  async function chat(content: string) {
    const res = await request(app).post('/api/ai/chat').send({
      messages: [{ role: 'user', content }]
    })
    return res.body.data as { actions: Array<{ type: string; pageStyle?: Record<string, unknown> }> }
  }

  it('识别"深色背景"意图 → set_page_style', async () => {
    const result = await chat('把背景改成深色')
    expect(result.actions[0]?.type).toBe('set_page_style')
    expect(result.actions[0]?.pageStyle?.backgroundColor).toBe('#1a1a2e')
  })

  it('识别"白色背景"意图 → set_page_style', async () => {
    const result = await chat('背景改成白色')
    expect(result.actions[0]?.type).toBe('set_page_style')
    expect(result.actions[0]?.pageStyle?.backgroundColor).toBe('#ffffff')
  })

  it('识别"蓝色背景"意图 → set_page_style', async () => {
    const result = await chat('把背景改成蓝色')
    expect(result.actions[0]?.type).toBe('set_page_style')
    expect(result.actions[0]?.pageStyle?.backgroundColor).toBe('#e6f4ff')
  })
})

describe('AI 规则引擎 - 无法识别的意图', () => {
  it('无法识别的意图 actions 返回空数组', async () => {
    const res = await request(app).post('/api/ai/chat').send({
      messages: [{ role: 'user', content: '今天天气怎么样' }]
    })
    expect(res.body.data.actions).toHaveLength(0)
    expect(typeof res.body.data.reply).toBe('string')
  })
})

// ── GET /api/ai/status ────────────────────────────────────────────
describe('GET /api/ai/status', () => {
  it('未配置 API Key 时返回 mock 模式', async () => {
    const res = await request(app).get('/api/ai/status')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    // 测试环境未配置 DEEPSEEK_API_KEY，应为 mock 模式
    expect(res.body.data.mode).toBe('mock')
  })
})
