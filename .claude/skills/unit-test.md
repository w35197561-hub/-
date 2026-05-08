# 单元测试规范

## 技术栈

| 工具           | 版本     | 用途           |
| -------------- | -------- | -------------- |
| Vitest         | 最新     | 测试运行器     |
| @pinia/testing | 随 pinia | store 测试隔离 |
| happy-dom      | 最新     | DOM 环境模拟   |

运行命令：

- `npm test` — 单次运行
- `npm run test:watch` — 监听模式

测试文件位置：`src/**/__tests__/*.test.ts`

**文件拆分约定：**

- `editor.test.ts` — 通用 store 行为（deleteComponent、updateStyle、selectComponent 等）
- `{componentName}.test.ts` — 每个组件自己的专项测试（默认 props/style、undo/redo）

> 新增组件的单测必须放在独立的 `{componentName}.test.ts` 文件中，不要追加到 `editor.test.ts`。

---

## 文件结构模板

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useXxxStore } from '../xxx'

describe('useXxxStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('方法名', () => {
    it('具体行为描述', () => {
      const store = useXxxStore()
      // arrange → act → assert
    })
  })
})
```

**固定约定：**

- `beforeEach` 必须调用 `setActivePinia(createPinia())`，确保每个测试 store 状态独立
- 测试描述用中文，格式：`'做了什么 / 期望什么结果'`
- 每个 `it` 块只测一件事

---

## Editor Store 测试初始化

```typescript
function setup() {
  setActivePinia(createPinia())
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()
  editorStore.createNewPage() // 必须先创建页面，否则 addComponent 不生效
  return { editorStore, historyStore }
}
```

---

## 必须覆盖的测试场景

### 1. 数据变更 + undo/redo（核心）

每个会写入 history 的操作都必须有：

- 正向操作验证
- `undo` 后状态回滚验证
- `redo` 后状态恢复验证（可选）

```typescript
it('addComponent 后可以 undo 恢复', () => {
  const { editorStore, historyStore } = setup()
  editorStore.addComponent(ComponentType.TEXT)
  expect(editorStore.currentPage?.components).toHaveLength(1)

  historyStore.undo()
  expect(editorStore.currentPage?.components).toHaveLength(0)
})
```

### 2. 边界情况

- 空状态下调用不应抛出异常
- 查询不存在的 id 返回 `undefined`

### 3. 新增组件必须验证的两项

每个新 `ComponentType` 加入后，必须有对应的单测覆盖：

**a. 默认 props 正确**

```typescript
it('携带正确的默认 props', () => {
  editorStore.addComponent(ComponentType.XXX)
  const props = editorStore.currentComponent?.props
  expect(props?.xxx).toBe(expectedValue)
})
```

**b. 默认 style 字段正确**（针对 `typeStyleMap` 中声明的字段）

```typescript
it('携带正确的默认样式', () => {
  editorStore.addComponent(ComponentType.XXX)
  const style = editorStore.currentComponent?.style
  expect(style?.fontSize).toBe(14)
  expect(style?.borderWidth).toBe(1)
  // ...
})
```

> 背景：`typeStyleMap` 里漏设字段，属性面板会出现空值（没有单测则无法提前发现）。

### 4. 组件业务逻辑（纯函数测试）

组件内有非平凡业务逻辑时，**必须将逻辑抽成纯函数**放到 `src/utils/` 中，再针对函数写边界 case 测试，不要用 Vue Test Utils 挂载组件。

**判断标准**：逻辑有明确边界情况、框架不保证行为、出错用户可感知。

**当前已有：**

- `src/utils/resolveHref.ts` — Link 组件 href 补协议（空字符串、无协议、ftp://、mailto: 等）
- `src/utils/collapseToggle.ts` — Collapse 手风琴互斥逻辑

**不需要抽函数的情况：**

- Element Plus 组件的 `disabled` / `readonly` 绑定（框架保证）
- 纯条件渲染（`v-if="isPreview"`）

### 5. 容器组件特殊验证

- `Form`/`Tabs` 组件 `isContainer === true`
- slots 初始化正确
- 嵌套子组件可通过 `getComponentById` 查找到

---

## 常用断言速查

```typescript
expect(array).toHaveLength(n)
expect(value).toBeDefined()
expect(value).toBe(expected) // 严格相等（原始值）
expect(value).toEqual(expected) // 深比较（对象/数组）
expect(() => fn()).not.toThrow()
```

---

## 注意事项

1. **不测实现细节**：只断言结果状态，不断言内部方法被调用几次
2. **测试文件不引入 Vue 组件**：store 测试只依赖 pinia 和 types
3. **一个 it 只验证一个行为**：不要在一个用例里塞多个不相关的断言
4. **用户指出测试问题后直接修正运行**，不要重新展示确认

## 写完后必须做

写完单元测试后，**先展示新增的测试内容给用户确认，等用户明确同意后再运行**。不要直接执行 `npm test`。
