import { describe, it, expect } from 'vitest'
import { validateValue } from '../validateValue'

describe('required', () => {
  it('空字符串触发必填', () => {
    expect(validateValue('', [{ type: 'required' }])).toBe('此项必填')
  })

  it('null 触发必填', () => {
    expect(validateValue(null, [{ type: 'required' }])).toBe('此项必填')
  })

  it('undefined 触发必填', () => {
    expect(validateValue(undefined, [{ type: 'required' }])).toBe('此项必填')
  })

  it('有值通过', () => {
    expect(validateValue('hello', [{ type: 'required' }])).toBeNull()
  })

  it('自定义 message 优先', () => {
    expect(validateValue('', [{ type: 'required', message: '不能为空' }])).toBe('不能为空')
  })
})

describe('minLength', () => {
  it('长度不足触发', () => {
    expect(validateValue('ab', [{ type: 'minLength', value: 3 }])).toBe('最少 3 个字符')
  })

  it('恰好等于最小长度通过', () => {
    expect(validateValue('abc', [{ type: 'minLength', value: 3 }])).toBeNull()
  })

  it('超过最小长度通过', () => {
    expect(validateValue('abcd', [{ type: 'minLength', value: 3 }])).toBeNull()
  })
})

describe('maxLength', () => {
  it('超出最大长度触发', () => {
    expect(validateValue('abcd', [{ type: 'maxLength', value: 3 }])).toBe('最多 3 个字符')
  })

  it('恰好等于最大长度通过', () => {
    expect(validateValue('abc', [{ type: 'maxLength', value: 3 }])).toBeNull()
  })
})

describe('min / max（数字）', () => {
  it('小于 min 触发', () => {
    expect(validateValue(4, [{ type: 'min', value: 5 }])).toBe('最小值为 5')
  })

  it('等于 min 通过', () => {
    expect(validateValue(5, [{ type: 'min', value: 5 }])).toBeNull()
  })

  it('大于 max 触发', () => {
    expect(validateValue(11, [{ type: 'max', value: 10 }])).toBe('最大值为 10')
  })

  it('等于 max 通过', () => {
    expect(validateValue(10, [{ type: 'max', value: 10 }])).toBeNull()
  })
})

describe('pattern', () => {
  it('不匹配正则触发', () => {
    expect(validateValue('abc', [{ type: 'pattern', value: '^\\d+$' }])).toBe('格式不正确')
  })

  it('匹配正则通过', () => {
    expect(validateValue('123', [{ type: 'pattern', value: '^\\d+$' }])).toBeNull()
  })

  it('无效正则不崩溃，视为通过', () => {
    expect(() => validateValue('abc', [{ type: 'pattern', value: '[invalid' }])).not.toThrow()
    expect(validateValue('abc', [{ type: 'pattern', value: '[invalid' }])).toBeNull()
  })
})

describe('多规则', () => {
  it('第一个触发的规则优先返回', () => {
    const rules = [{ type: 'required' as const }, { type: 'minLength' as const, value: 5 }]
    expect(validateValue('', rules)).toBe('此项必填')
  })

  it('rules 为空返回 null', () => {
    expect(validateValue('anything', [])).toBeNull()
  })
})
