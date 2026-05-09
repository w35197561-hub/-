---
paths:
  - 'src/**'
---

# 编码规范

## Vue 组件规范

- Props 固定为 `defineProps<{ component: ComponentData }>()`，不得随意扩展
- 样式通过 `useComponentStyle(component.style)` composable 获取，禁止在模板中写大段内联样式对象
- CSS 固定 `width:100%; height:100%; box-sizing:border-box`
- 子组件 wrapper 样式抽为独立的 `computed`，避免模板内联对象导致不必要的重渲染
- **canvas 组件禁止使用 `el-*` 组件**，必须用原生 HTML 元素（`<input>`、`<textarea>`、`<select>`、`<button>` 等）。原因：`el-*` 是多层 div 包裹的 Vue 组件，`:style` 只作用于最外层，无法将 backgroundColor、fontSize 等样式传入实际的交互元素，导致属性面板修改无效果。

### 设计态 / 运行态双模式

所有可交互组件通过 `provide/inject` 区分设计态（编辑器）和运行态（预览页）：

```
PreviewView.vue    → provide('isPreview', true)
XxxComponent.vue   → const isPreview = inject('isPreview', false)
```

- **设计态**（`isPreview = false`）：禁止交互（`disabled` / `readonly`），配合画布拖拽不冲突
- **运行态**（`isPreview = true`）：开启原生交互，用本地 `ref` 维护临时状态

新增有交互需求的组件时，必须同时实现两套行为：

- 纯展示型（Input/Textarea/NumberInput/Radio/Checkbox）：绑定 `:disabled="!isPreview"` 或 `:readonly="!isPreview"`，预览时用本地 `ref` + 事件处理
- 视觉占位型（Select 等）：`v-if="!isPreview"` 渲染静态占位，`v-else` 渲染真实可交互实现

### 事件系统实现规则

执行入口：`src/components/canvas/composables/useActionExecutor.ts`，组件在预览模式下触发时调用 `execute(actions)`，switch 按 `action.type` 分发。

新增动作类型步骤：

1. `src/types/index.ts` → `ActionType` 加新值，`ActionConfig.params` 加对应字段
2. `useActionExecutor.ts` → switch 加新 case
3. `PropertyPanel.vue` → Button 事件区域加对应参数表单

当前只有 Button 支持事件绑定，其他组件如需支持，在组件内 inject `isPreview` 并调用 `useActionExecutor`。

## TypeScript 规范

- 无 `as any`，无隐式 any
- 函数参数和返回值有明确类型
- 新增组件 props 类型优先复用 `ComponentProps` 的索引签名 `[key: string]: unknown`，公共字段先在接口中定义

### 常见 TS 类型错误及修法

**① 正则匹配组：用 `!` 断言**

`String.match()` 返回 `string | undefined`，已在 `if (match)` 守卫内可以安全加 `!`：

```typescript
// ❌ TS2322: Type 'string | undefined' is not assignable to type 'string'
selectedYear.value = dtMatch[1]

// ✅ 已有 if (dtMatch) 守卫，直接断言
selectedYear.value = dtMatch[1]!
```

**② `Record<ComponentType, T>` 穷举：枚举新增值后同步补全所有字面量对象**

凡是声明为 `Record<ComponentType, string>` 的字面量，TypeScript 会要求穷举所有枚举 key。枚举新增一个值后，`LayerPanel.vue` 的 `typeNames` 和 `icons` 两处都要同步补上，否则编译报错：

```typescript
// TS2741: Property '[ComponentType.TABLE]' is missing in type ...
const typeNames: Record<ComponentType, string> = {
  [ComponentType.TABLE]: '表格', // ← 漏掉就报错
}
```

**③ Vue 模板事件回调：显式标注参数类型**

模板内 `@update:model-value` 的箭头函数参数 TypeScript 无法自动推断，必须手动标注：

```vue
<!-- ❌ TS7006: Parameter 'val' implicitly has an 'any' type -->
@update:model-value="(val) => setStyleVal(s.field, val)"

<!-- ✅ 按控件类型标注 -->
@update:model-value="(val: number) => setStyleVal(s.field, val)" @update:model-value="(val: string)
=> setPropVal(s.field, val)" @update:model-value="(val: string | null) => setPropVal(s.field, val)"
```

**④ 数组下标访问：用 `!` 而非类型强转**

```typescript
// ❌ TS2532: Object is possibly 'undefined'
cols[idx][key] = val

// ✅ 下标来自 v-for，合法范围内直接断言
cols[idx]![key] = val
```

## Store 操作规范

- **所有数据变更必须通过 Command 模式**，确保撤销/重做正常：
  ```typescript
  historyStore.executeCommand({
    execute: () => {
      /* 变更 */
    },
    undo: () => {
      /* 回滚 */
    },
  })
  ```
- 拖拽过程中用 `updateComponentStyleSilent`（不写历史），拖拽结束用 `batchUpdateComponentStyle`
- 容器组件内部状态（如 `activeTab`）用本地 `ref` 维护，切换时调用 `updateComponentProps()` 写入 store，**禁止直接赋值 `props.component.props.xxx`**

## ComponentRenderer 规范

- `componentMap` 必须声明为 `Record<ComponentType, Component>`
- key 用 `[ComponentType.XXX]` 枚举写法，**禁止字符串 key**
- 新增枚举值后若未补全 componentMap，TypeScript 编译期报错

## Props 渲染规范

画布组件模板里渲染用户可编辑的 prop 时，**必须用 `??` 而不是 `||`**：

```vue
<!-- ❌ 错误：用户清空内容后画布仍显示默认文字 -->
{{ component.props.content || '文本内容' }}

<!-- ✅ 正确：清空后画布也跟着空 -->
{{ component.props.content ?? '' }}
```

`||` 把空字符串 `''` 视为 falsy 会触发回退；`??` 只在 `null`/`undefined` 时回退。

**例外**：结构性属性不受此限制，仍可用 `||`：

- `input` 的 `:type="props.type || 'text'"` — 浏览器需要有效 type 值，空值行为异常

## 关键约束

- **ID**：组件 ID 由 `createComponentId()` 自动生成，禁止手动硬编码
- **历史**：用户操作的数据变更必须通过 Command 模式提交，禁止直接修改 `currentPage.value` 或 `currentComponent.value`
- **拖拽性能**：拖拽中用 `updateComponentStyleSilent`，结束时用 `batchUpdateComponentStyle`
- **嵌套**：只有 `Form`/`Tabs` 有 `children`/`slots`，普通组件这两个字段为 `undefined`
- **多选**：`selectedComponentIds`（数组）管理多选，`currentComponent` 指向最后选中项
- **样式单位**：`style` 数值不带单位，渲染时拼接 `px`
- **容器禁止直接改 props**：容器内部状态用本地 `ref` 维护，切换时调用 `updateComponentProps()` 写入 store
- 禁止遗留 `console.log` / `console.error` / `debugger`
- 禁止硬编码魔法字符串，使用常量或枚举
