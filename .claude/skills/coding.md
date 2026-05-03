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

## 禁止事项

- 禁止手动硬编码组件 ID，必须用 `createComponentId()`
- 禁止直接修改 `currentPage.value` 或 `currentComponent.value` 绕过 Command
- 禁止遗留 `console.log` / `console.error` / `debugger`
- 禁止硬编码魔法字符串，使用常量或枚举

## 新增组件自查清单 §2 — 配置项设计原则

在填写 `componentConfigs.ts` 中的 `propSetters` / `styleSetters` 时，严格遵循以下原则：

### 精简原则：只加有意义的配置项

每一项 setter 必须对该组件有**实际使用场景**，不得套用通用模板。判断标准：

- **加**：用户在设计时有理由调整这个属性（如 Select 的 placeholder、Table 的 bordered）
- **不加**：该属性对该组件无意义或外观上不可见（如 Table 的 borderRadius、Divider 的 fontSize）

常见误加项（按组件类型判断是否需要）：
- `borderRadius`：仅适用于有圆角需求的组件（Button、Input、Select 等），Table / Divider / RadioGroup 不需要
- `borderWidth` / `borderColor`：仅适用于允许用户自定义边框的组件，容器类组件通常不需要
- `fontSize`：仅适用于有文字内容的组件，纯布局/数据组件不需要

### 方案确认原则（主 Agent 职责）

coder agent 被调用前，主 Agent 必须先向用户描述组件设计方案（props、propSetters、styleSetters 的具体内容），
等用户确认或给出修改意见后，再 spawn coder agent 执行。

## 变更记录

每步完成后更新 `.claude/specs/{功能名}/changes.md`：

```markdown
## [组件名]：新增 XxxComponent

### 变更文件
- src/types/index.ts — 枚举新增 XXX
- src/stores/editor.ts — defaultProps 新增 XXX
- src/components/components/XxxComponent.vue — 新建组件
- src/components/components/ComponentRenderer.vue — componentMap 注册
- src/components/ComponentPanel.vue — componentTypes 注册
- src/components/PropertyPanel.vue — 属性配置 UI（如有）

### 验证清单
- [ ] TypeScript 编译无报错
- [ ] 组件可在画布中拖入并渲染
- [ ] 属性面板可修改 props
- [ ] 撤销/重做正常
```
