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

## 新增组件自查清单

完成 6 步流程后，必须逐项确认：

### 1. 画布交互行为
- 输入类组件（input、number input、textarea 等）必须加 `readonly` 属性
- 原因：画布是"展示态"，组件无权访问 store，用户交互无法持久化，会产生虚假反馈
- 正确方式：通过属性面板修改 props，canvas 组件只负责渲染

### 2. 样式默认值
- `typeStyleMap` 中为新组件设置所有**会在属性面板中展示**的样式默认值
- 必填：`width`、`height`
- 按需填：`fontSize`、`borderWidth`、`borderRadius`（不填则属性面板显示空）
- 类型：`Partial<Record<ComponentType, Partial<ComponentData['style']>>>`

### 3. 属性面板验证
- 拖入组件后打开属性面板，确认样式设置区各字段有合理初始值，无空白项

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
