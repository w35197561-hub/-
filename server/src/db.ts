/**
 * 简单的基于 JSON 文件的本地存储模块
 * 生产环境可替换为真实数据库（MySQL / PostgreSQL / MongoDB 等）
 */

import fs from 'fs'
import path from 'path'
import type { PageRecord } from './types'

// 数据文件路径（在 server/data/ 目录下）
const DATA_DIR = path.resolve(__dirname, '../../data')
const PAGES_FILE = path.join(DATA_DIR, 'pages.json')

// 确保数据目录和文件存在
function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(PAGES_FILE)) {
    fs.writeFileSync(PAGES_FILE, JSON.stringify({}, null, 2), 'utf-8')
  }
}

// 读取所有页面（以 id 为 key 的 map）
function readPagesMap(): Record<string, PageRecord> {
  ensureDataFile()
  try {
    const raw = fs.readFileSync(PAGES_FILE, 'utf-8')
    return JSON.parse(raw) as Record<string, PageRecord>
  } catch {
    return {}
  }
}

// 写回所有页面
function writePagesMap(map: Record<string, PageRecord>): void {
  ensureDataFile()
  fs.writeFileSync(PAGES_FILE, JSON.stringify(map, null, 2), 'utf-8')
}

// =====================
// 对外暴露的 CRUD 方法
// =====================

/** 获取所有页面列表 */
export function getAllPages(): PageRecord[] {
  const map = readPagesMap()
  return Object.values(map).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

/** 按 ID 获取单个页面 */
export function getPageById(id: string): PageRecord | null {
  const map = readPagesMap()
  return map[id] ?? null
}

/** 创建或更新页面 */
export function savePage(page: PageRecord): PageRecord {
  const map = readPagesMap()
  map[page.id] = page
  writePagesMap(map)
  return page
}

/** 删除页面 */
export function deletePage(id: string): boolean {
  const map = readPagesMap()
  if (!map[id]) return false
  delete map[id]
  writePagesMap(map)
  return true
}
