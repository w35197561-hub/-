import { describe, it, expect } from 'vitest'
import { resolveHref } from '../resolveHref'

describe('resolveHref', () => {
  it('空字符串返回 #', () => {
    expect(resolveHref('')).toBe('#')
  })

  it('无协议的域名补全 https://', () => {
    expect(resolveHref('baidu.com')).toBe('https://baidu.com')
  })

  it('已有 https:// 不重复添加', () => {
    expect(resolveHref('https://baidu.com')).toBe('https://baidu.com')
  })

  it('已有 http:// 不修改', () => {
    expect(resolveHref('http://baidu.com')).toBe('http://baidu.com')
  })

  it('ftp:// 等非 http 协议保持不变', () => {
    expect(resolveHref('ftp://files.example.com')).toBe('ftp://files.example.com')
  })

  it('mailto: 保持不变', () => {
    expect(resolveHref('mailto:user@example.com')).toBe('mailto:user@example.com')
  })
})
