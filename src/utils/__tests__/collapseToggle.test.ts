import { describe, it, expect } from 'vitest'
import { toggleCollapse } from '../collapseToggle'

describe('toggleCollapse - 普通模式', () => {
  it('打开未展开的面板', () => {
    const result = toggleCollapse(new Set(['a']), 'b', false)
    expect(result.has('b')).toBe(true)
    expect(result.has('a')).toBe(true)
  })

  it('关闭已展开的面板', () => {
    const result = toggleCollapse(new Set(['a', 'b']), 'a', false)
    expect(result.has('a')).toBe(false)
    expect(result.has('b')).toBe(true)
  })
})

describe('toggleCollapse - 手风琴模式', () => {
  it('打开新面板时关闭其他所有面板', () => {
    const result = toggleCollapse(new Set(['a']), 'b', true)
    expect(result.has('b')).toBe(true)
    expect(result.has('a')).toBe(false)
    expect(result.size).toBe(1)
  })

  it('关闭当前唯一展开的面板', () => {
    const result = toggleCollapse(new Set(['a']), 'a', true)
    expect(result.size).toBe(0)
  })

  it('空状态打开一个面板', () => {
    const result = toggleCollapse(new Set(), 'a', true)
    expect(result.has('a')).toBe(true)
    expect(result.size).toBe(1)
  })
})
