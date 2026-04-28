import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getAllPages, getPageById, savePage, deletePage } from '../db'
import type { ApiResponse, PageData, PageListItem, PageRecord } from '../types'

const router = Router()

// =====================
// GET /api/pages
// 获取所有页面列表（仅返回摘要，不含组件详情）
// =====================
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = getAllPages()
    const list: PageListItem[] = pages.map((p) => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      componentCount: p.components.length,
      style: p.style
    }))

    const response: ApiResponse<PageListItem[]> = { success: true, data: list }
    res.json(response)
  } catch (err) {
    next(err)
  }
})

// =====================
// GET /api/pages/:id
// 获取单个页面完整数据
// =====================
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = getPageById(String(req.params.id))
    if (!page) {
      res.status(404).json({ success: false, error: '页面不存在' } as ApiResponse)
      return
    }
    res.json({ success: true, data: page } as ApiResponse<PageRecord>)
  } catch (err) {
    next(err)
  }
})

// =====================
// POST /api/pages
// 新建页面
// =====================
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Partial<PageData>

    if (!body.title) {
      res.status(400).json({ success: false, error: '页面标题不能为空' } as ApiResponse)
      return
    }

    const now = new Date().toISOString()
    const record: PageRecord = {
      id: body.id || uuidv4(),
      title: body.title,
      components: body.components ?? [],
      style: body.style ?? { width: 1200, height: 800, backgroundColor: '#ffffff' },
      createdAt: now,
      updatedAt: now
    }

    const saved = savePage(record)
    res.status(201).json({ success: true, data: saved, message: '页面创建成功' } as ApiResponse<PageRecord>)
  } catch (err) {
    next(err)
  }
})

// =====================
// PUT /api/pages/:id
// 更新页面（保存页面数据）
// =====================
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id)
    const body = req.body as Partial<PageData>

    const existing = getPageById(id)
    const now = new Date().toISOString()

    const record: PageRecord = {
      id,
      title: body.title ?? existing?.title ?? '未命名页面',
      components: body.components ?? existing?.components ?? [],
      style: body.style ?? existing?.style ?? { width: 1200, height: 800, backgroundColor: '#ffffff' },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    }

    const saved = savePage(record)
    res.json({ success: true, data: saved, message: '页面保存成功' } as ApiResponse<PageRecord>)
  } catch (err) {
    next(err)
  }
})

// =====================
// DELETE /api/pages/:id
// 删除页面
// =====================
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = deletePage(String(req.params.id))
    if (!deleted) {
      res.status(404).json({ success: false, error: '页面不存在' } as ApiResponse)
      return
    }
    res.json({ success: true, message: '页面删除成功' } as ApiResponse)
  } catch (err) {
    next(err)
  }
})

export default router
