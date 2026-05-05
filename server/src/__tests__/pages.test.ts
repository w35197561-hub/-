import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import fs from 'fs'
import path from 'path'
import { createApp } from '../app'

// ── 测试用临时数据文件，隔离真实数据 ─────────────────────────────
const TEST_DATA_DIR = path.resolve(__dirname, '../../data/__test__')
const TEST_PAGES_FILE = path.join(TEST_DATA_DIR, 'pages.json')

// mock db 模块的数据文件路径，指向测试专用目录
vi.mock('../db', async () => {
  const fs = await import('fs')
  const path = await import('path')

  const DATA_DIR = path.resolve(__dirname, '../../data/__test__')
  const PAGES_FILE = path.join(DATA_DIR, 'pages.json')

  function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(PAGES_FILE)) fs.writeFileSync(PAGES_FILE, JSON.stringify({}), 'utf-8')
  }

  function readMap(): Record<string, unknown> {
    ensureDataFile()
    try {
      return JSON.parse(fs.readFileSync(PAGES_FILE, 'utf-8'))
    } catch {
      return {}
    }
  }

  function writeMap(map: Record<string, unknown>) {
    ensureDataFile()
    fs.writeFileSync(PAGES_FILE, JSON.stringify(map, null, 2), 'utf-8')
  }

  return {
    getAllPages: () =>
      Object.values(readMap()).sort(
        (a, b) =>
          new Date((b as Record<string, string>).updatedAt).getTime() -
          new Date((a as Record<string, string>).updatedAt).getTime(),
      ),
    getPageById: (id: string) => readMap()[id] ?? null,
    savePage: (page: Record<string, unknown>) => {
      const m = readMap()
      m[page.id as string] = page
      writeMap(m)
      return page
    },
    deletePage: (id: string) => {
      const m = readMap()
      if (!m[id]) return false
      delete m[id]
      writeMap(m)
      return true
    },
  }
})

const app = createApp()

// ── 每个测试前清空测试数据 ────────────────────────────────────────
beforeEach(() => {
  if (!fs.existsSync(TEST_DATA_DIR)) fs.mkdirSync(TEST_DATA_DIR, { recursive: true })
  fs.writeFileSync(TEST_PAGES_FILE, JSON.stringify({}), 'utf-8')
})

afterEach(() => {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  }
})

// ── 工具函数：创建一个测试页面 ─────────────────────────────────────
async function createTestPage(title = '测试页面') {
  const res = await request(app).post('/api/pages').send({ title })
  return res.body.data
}

// ══════════════════════════════════════════════════════════════════
// GET /api/pages
// ══════════════════════════════════════════════════════════════════
describe('GET /api/pages', () => {
  it('初始状态返回空列表', async () => {
    const res = await request(app).get('/api/pages')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual([])
  })

  it('创建页面后列表返回对应数量', async () => {
    await createTestPage('页面 A')
    await createTestPage('页面 B')

    const res = await request(app).get('/api/pages')
    expect(res.body.data).toHaveLength(2)
  })

  it('列表项包含 id、title、componentCount、style，不含 components 详情', async () => {
    await createTestPage()
    const res = await request(app).get('/api/pages')
    const item = res.body.data[0]

    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('title')
    expect(item).toHaveProperty('componentCount')
    expect(item).toHaveProperty('style')
    expect(item).not.toHaveProperty('components') // 列表不暴露详情
  })
})

// ══════════════════════════════════════════════════════════════════
// POST /api/pages
// ══════════════════════════════════════════════════════════════════
describe('POST /api/pages', () => {
  it('创建页面成功，返回 201 和完整页面数据', async () => {
    const res = await request(app).post('/api/pages').send({ title: '新页面' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('新页面')
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.components).toEqual([])
    expect(res.body.data.createdAt).toBeDefined()
  })

  it('title 缺失时返回 400', async () => {
    const res = await request(app).post('/api/pages').send({})
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toMatch(/标题/)
  })

  it('默认页面样式正确', async () => {
    const res = await request(app).post('/api/pages').send({ title: '测试' })
    const style = res.body.data.style
    expect(style.width).toBe(1200)
    expect(style.height).toBe(800)
    expect(style.backgroundColor).toBe('#ffffff')
  })

  it('可以传入自定义 id', async () => {
    const customId = 'my-custom-id'
    const res = await request(app).post('/api/pages').send({ title: '测试', id: customId })
    expect(res.body.data.id).toBe(customId)
  })

  it('可以保存带有组件的页面', async () => {
    const components = [
      {
        id: 'comp_1',
        type: 'Text',
        style: { top: 100, left: 100, width: 200, height: 50, zIndex: 1, rotate: 0 },
        props: { content: '文本内容' },
      },
    ]
    const res = await request(app).post('/api/pages').send({ title: '含组件页面', components })
    expect(res.body.data.components).toHaveLength(1)
    expect(res.body.data.components[0].type).toBe('Text')
  })
})

// ══════════════════════════════════════════════════════════════════
// GET /api/pages/:id
// ══════════════════════════════════════════════════════════════════
describe('GET /api/pages/:id', () => {
  it('获取已存在页面返回完整数据', async () => {
    const created = await createTestPage('详情页面')
    const res = await request(app).get(`/api/pages/${created.id}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(created.id)
    expect(res.body.data.title).toBe('详情页面')
    expect(Array.isArray(res.body.data.components)).toBe(true)
  })

  it('获取不存在的页面返回 404', async () => {
    const res = await request(app).get('/api/pages/not-exist-id')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// PUT /api/pages/:id
// ══════════════════════════════════════════════════════════════════
describe('PUT /api/pages/:id', () => {
  it('更新标题后可获取到新标题', async () => {
    const created = await createTestPage('旧标题')

    await request(app).put(`/api/pages/${created.id}`).send({ title: '新标题' })
    const res = await request(app).get(`/api/pages/${created.id}`)

    expect(res.body.data.title).toBe('新标题')
  })

  it('保存页面数据后组件列表正确持久化', async () => {
    const created = await createTestPage('持久化测试')
    const components = [
      {
        id: 'comp_abc',
        type: 'Button',
        style: { top: 50, left: 50, width: 120, height: 40, zIndex: 1, rotate: 0 },
        props: { content: '提交' },
      },
    ]

    await request(app).put(`/api/pages/${created.id}`).send({
      title: created.title,
      components,
      style: created.style,
    })

    const res = await request(app).get(`/api/pages/${created.id}`)
    expect(res.body.data.components).toHaveLength(1)
    expect(res.body.data.components[0].id).toBe('comp_abc')
    expect(res.body.data.components[0].props.content).toBe('提交')
  })

  it('updatedAt 在更新后发生变化', async () => {
    const created = await createTestPage()
    await new Promise((r) => setTimeout(r, 10)) // 确保时间戳不同

    const updateRes = await request(app).put(`/api/pages/${created.id}`).send({ title: '新标题' })
    expect(updateRes.body.data.updatedAt).not.toBe(created.updatedAt)
  })

  it('更新不存在的页面也会创建（upsert 语义）', async () => {
    const res = await request(app).put('/api/pages/new-id-123').send({ title: '新建页面' })
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe('new-id-123')
  })
})

// ══════════════════════════════════════════════════════════════════
// DELETE /api/pages/:id
// ══════════════════════════════════════════════════════════════════
describe('DELETE /api/pages/:id', () => {
  it('删除已存在的页面返回成功', async () => {
    const created = await createTestPage()
    const res = await request(app).delete(`/api/pages/${created.id}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('删除后无法再获取该页面', async () => {
    const created = await createTestPage()
    await request(app).delete(`/api/pages/${created.id}`)

    const res = await request(app).get(`/api/pages/${created.id}`)
    expect(res.status).toBe(404)
  })

  it('删除不存在的页面返回 404', async () => {
    const res = await request(app).delete('/api/pages/not-exist')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 完整业务链路：创建 → 保存组件 → 读取 → 删除
// ══════════════════════════════════════════════════════════════════
describe('完整页面生命周期', () => {
  it('创建 → 添加组件 → 保存 → 读取 → 删除，数据全程一致', async () => {
    // 1. 创建页面
    const createRes = await request(app).post('/api/pages').send({ title: '完整链路测试' })
    const pageId = createRes.body.data.id
    expect(createRes.status).toBe(201)

    // 2. 保存带组件的页面数据
    const components = [
      {
        id: 'c1',
        type: 'Text',
        style: { top: 100, left: 100, width: 200, height: 50, zIndex: 1, rotate: 0 },
        props: { content: '标题' },
      },
      {
        id: 'c2',
        type: 'Button',
        style: { top: 200, left: 100, width: 120, height: 40, zIndex: 2, rotate: 0 },
        props: { content: '提交' },
      },
    ]
    await request(app)
      .put(`/api/pages/${pageId}`)
      .send({
        title: '完整链路测试',
        components,
        style: { width: 1200, height: 800, backgroundColor: '#ffffff' },
      })

    // 3. 读取并验证
    const getRes = await request(app).get(`/api/pages/${pageId}`)
    expect(getRes.body.data.components).toHaveLength(2)
    expect(getRes.body.data.components[0].props.content).toBe('标题')
    expect(getRes.body.data.components[1].props.content).toBe('提交')

    // 4. 列表中 componentCount 正确
    const listRes = await request(app).get('/api/pages')
    expect(listRes.body.data[0].componentCount).toBe(2)

    // 5. 删除
    await request(app).delete(`/api/pages/${pageId}`)
    const afterDelete = await request(app).get('/api/pages')
    expect(afterDelete.body.data).toHaveLength(0)
  })
})
