/**
 * 前端 API 服务层
 * 所有与后端的通信都封装在这里
 */

import type { PageData } from '@/types'

// 基础请求封装
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const json = (await res.json()) as { success: boolean; data?: T; message?: string; error?: string }

  if (!json.success) {
    throw new Error(json.error ?? json.message ?? '请求失败')
  }

  return json.data as T
}

// =====================
// 页面列表项类型（后端返回）
// =====================
export interface PageListItem {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  componentCount: number
  style: PageData['style']
}

// =====================
// 页面记录类型（含时间戳）
// =====================
export interface PageRecord extends PageData {
  createdAt: string
  updatedAt: string
}

// =====================
// API 方法
// =====================

/** 获取所有页面列表（仅摘要） */
export function fetchPageList(): Promise<PageListItem[]> {
  return request<PageListItem[]>('/api/pages')
}

/** 获取单个页面完整数据 */
export function fetchPage(id: string): Promise<PageRecord> {
  return request<PageRecord>(`/api/pages/${id}`)
}

/** 新建页面 */
export function createPage(page: Partial<PageData>): Promise<PageRecord> {
  return request<PageRecord>('/api/pages', {
    method: 'POST',
    body: JSON.stringify(page)
  })
}

/** 保存（更新）页面 */
export function savePage(id: string, page: PageData): Promise<PageRecord> {
  return request<PageRecord>(`/api/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(page)
  })
}

/** 删除页面 */
export function deletePage(id: string): Promise<void> {
  return request<void>(`/api/pages/${id}`, { method: 'DELETE' })
}
