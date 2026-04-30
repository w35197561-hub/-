# 编码质量标准

本文件定义低代码编辑器的编码规范，coder agent 在实现过程中遵循。

## Vue 组件规范

- Props 固定为 `defineProps<{ component: ComponentData }>()`，不得随意扩展
- 样式通过 `useComponentStyle(component.style)` composable 获取，禁止在模板中写大段内联样式对象
- CSS 固定 `width:100%; height:100%; box-sizing:border-box`
- 容器组件（Form/Tabs）的拖放逻辑通过 `useContainerDrop(containerId, getSlotKey)` 复用，不得重复实现
- 子组件 wrapper 样式抽为独立的 `computed`，避免模板内联对象导致不必要的重渲染

## TypeScript 规范

- 无 `as any`，无隐式 any
- 函数参数和返回值有明确类型
- 新增组件 props 类型优先复用 `ComponentProps` 的索引签名 `[key: string]: unknown`，公共字段先在接口中定义

## Store 操作规范

- **所有数据变更必须通过 Command 模式**，确保撤销/重做正常：
  ```typescript
  historyStore.executeCommand({
    execute: () => { /* 变更 */ },
    undo:    () => { /* 回滚 */ }
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

## 禁止事项

- 禁止手动硬编码组件 ID，必须用 `createComponentId()`
- 禁止直接修改 `currentPage.value` 或 `currentComponent.value` 绕过 Command
- 禁止遗留 `console.log` / `console.error` / `debugger`
- 禁止硬编码魔法字符串，使用常量或枚举

## 新增组件自查清单

完成 6 步流程后，必须逐项确认：

### 0. 编码前必做：搜索 + props/setters 分析（强制）

**在写任何代码之前**，先用 `WebSearch` 搜索该组件在 Element Plus 中的常用属性，搜索词格式：

```
Element Plus <组件名> props 常用属性 <当前年份>
```

搜索完成后，必须完成以下分析，**不得跳过**：

**① 整理常用 props 清单**（来自文档或搜索结果）：列出该组件最常用的 5~10 个属性及其类型和含义。

**② 区分 defaultProps vs setter**：

| 判断维度 | 放 `defaultProps`（仅初始值） | 放 `propSetters`（面板可编辑） |
|---|---|---|
| 用户是否需要在属性面板修改？ | 否 | **是** |
| 是结构性/程序性数据？（如 `type="submit"`） | 是 | 否 |
| 是复杂嵌套数组对象？（如 `tabs:[{key,label}]`） | 是，选合适 setter 或跳过 | 视 setter 支持情况 |
| 用户清空后画布是否应该跟着空？ | — | 是则用 `??`，不是则用 `\|\|` |

**③ 确认每个 prop 对应的 setter 类型**（参考下方 setter 表）。

**④ 确认 `defaultStyle` 中所有被 styleSetter 引用的字段都有初始值**（如 `borderRadius: 0`），否则属性面板显示空白。

---

### 1. 画布交互行为
- 输入类组件（input、number input、textarea 等）必须加 `readonly` 属性
- 原因：画布是"展示态"，组件无权访问 store，用户交互无法持久化，会产生虚假反馈
- 正确方式：通过属性面板修改 props，canvas 组件只负责渲染

### 2. 在 componentConfigs.ts 中声明组件配置（必须）

新增组件必须在 `src/components/material/componentConfigs.ts` 中添加一条记录，替代原来分散在 `editor.ts` 中的 `defaultProps` / `typeStyleMap` 硬编码：

```typescript
[ComponentType.XXX]: {
  defaultProps: { /* 所有 props 初始值 */ },
  defaultStyle: { width: 200, height: 50, /* 其余按需 */ },  // 可选
  propSetters: [
    { label: '显示名', setter: 'NumberSetter', field: 'propKey', setterProps: { min: 0 } },
    { label: '文本',   setter: 'TextareaSetter', field: 'content' },
    { label: '颜色',   setter: 'ColorSetter',    field: 'color' },
  ],
  styleSetters: [
    { label: '字体大小', setter: 'NumberSetter', field: 'fontSize', setterProps: { min: 8, max: 72 } },
    { label: '边框颜色', setter: 'ColorSetter',  field: 'borderColor' },
  ],
}
```

**setter 选取规则：**
- `defaultProps` 中的所有字段默认都给 setter，除非满足以下条件才排除：
  - 框架内部用、用户感知不到（如 `isContainer`）
  - 结构性数据、面板无法简单编辑（如 `tabs: [{key,label}]`）
  - 由其他机制控制（如容器内部状态）

**可用 setter 类型：**

| SetterType | 对应控件 | 适用场景 |
|---|---|---|
| `NumberSetter` | `el-input-number` | 数值（宽度、大小、步长…） |
| `InputSetter` | `el-input` | 单行文本 |
| `TextareaSetter` | `el-input` type="textarea" | 多行文本 |
| `ColorSetter` | `el-color-picker` | 颜色值 |
| `SelectSetter` | `el-select` | 枚举选择，需配合 `optionsField` |
| `StringListSetter` | 多行 `el-input` + ➕/➖ 按钮 | 字符串数组（如下拉选项列表），存 `string[]` |

声明后，`editor.ts` 会自动读取 `defaultProps` 和 `defaultStyle`，`PropertyPanel.vue` 会自动渲染对应控件，**无需改动这两个文件**。

### 3. 属性面板验证
- 拖入组件后打开属性面板，确认 propSetters / styleSetters 各字段有合理初始值，无空白项

## 变更记录

每步完成后更新 `.claude/specs/{功能名}/changes.md`：

```markdown
## [组件名]：新增 XxxComponent

### 变更文件
- src/types/index.ts — 枚举新增 XXX
- src/components/material/componentConfigs.ts — 新增组件配置
- src/components/canvas/components/XxxComponent.vue — 新建组件
- src/components/canvas/components/ComponentRenderer.vue — componentMap 注册
- src/components/material/ComponentPanel.vue — componentTypes 注册

### 验证清单
- [ ] TypeScript 编译无报错
- [ ] 组件可在画布中拖入并渲染
- [ ] 属性面板可修改 props
- [ ] 撤销/重做正常
```
