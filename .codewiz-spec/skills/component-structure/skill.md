---
name: "component-structure"
description: "低代码编辑器组件结构定义规范，包含组件类型、数据结构、样式、属性、事件等完整定义"
type: "knowledge"
executable: false
priority: 95
stages: ["design", "coding", "plan"]
triggers: ["组件定义","新增组件","重构组件"]
---

# 组件结构定义规范

基于 Vue 3 + TypeScript 的低代码页面编辑器，所有新组件、属性扩展必须严格遵循本规范。

## 一、核心数据类型（`src/types/index.ts`）

**ComponentType 枚举（当前已有）：**
`Text` / `Image` / `Button` / `Input` / `Form`（容器）/ `Chart` / `Tabs`（容器）

**ComponentStyle：** `top, left, width, height, zIndex, rotate`（必填）+ `fontSize, color, backgroundColor, borderWidth, borderColor, borderRadius`（可选，数值均为 `number`，渲染时拼接 `px`）

默认尺寸：顶层组件 `200×50`，Form `520×260`，Tabs `560×320`，子组件 `180×40`

**ComponentProps：** `content?, src?, type?, placeholder?, [key: string]: unknown`（可自由扩展）

各类型默认 props：`Text→{content:'文本内容'}` / `Image→{src:''}` / `Button→{content:'按钮'}` / `Input→{placeholder:'请输入内容'}` / `Form→{title:'表单容器',columns:['col1','col2']}` / `Tabs→{tabs:[{key,label}×2], activeTab:'tab1'}`

**ComponentData（核心）：**
```typescript
interface ComponentData {
  id: string                               // comp_{Date.now()}_{random6}
  type: ComponentType
  style: ComponentStyle
  props: ComponentProps
  events?: ComponentEvent[]                // { type, handler }
  children?: ComponentData[]               // Form 用
  slots?: Record<string, ComponentData[]>  // Form: {col1,col2} / Tabs: {tab1,tab2}
  isContainer?: boolean                    // Form/Tabs 为 true
}
```

**PageData：** `{ id, title, components: ComponentData[], style: { width:1200, height:800, backgroundColor:'#fff' } }`

---

## 二、Vue 组件文件规范（`src/components/components/`）

- Props 固定为 `defineProps<{ component: ComponentData }>()`
- 样式通过 `computed` 对象绑定，使用 `useComponentStyle(component.style)` composable 获取基础样式
- 容器组件的拖放逻辑通过 `useContainerDrop(containerId, getSlotKey)` composable 复用
- 子组件 wrapper 样式抽为独立函数，避免模板内联对象导致额外重渲染
- CSS 固定 `width:100%; height:100%; box-sizing:border-box`

---

## 三、新增组件的完整流程（6 步）

1. **`src/types/index.ts`** → `ComponentType` 枚举加新值
2. **`src/stores/editor.ts`** → `defaultProps`、`typeStyleMap`（可选）各加一项
3. **`src/components/components/XxxComponent.vue`** → 新建组件文件，遵循第二节规范
4. **`src/components/components/ComponentRenderer.vue`** → `componentMap` 加新枚举 key（见约束 9）
5. **`src/components/ComponentPanel.vue`** → `componentTypes` 数组加 `{ type, name, icon }`
6. **`src/components/PropertyPanel.vue`** → （可选）加对应属性配置 UI

---

## 四、Store 操作规范（`src/stores/editor.ts`）

**所有数据变更必须通过 Command 模式**，确保撤销/重做正常：

```typescript
const command: Command = {
  execute: () => { /* 执行 */ },
  undo:    () => { /* 撤销 */ }
}
historyStore.executeCommand(command)
```

常用方法：`addComponent` / `addChildComponent` / `updateComponentStyle` / `updateComponentStyleSilent`（拖拽中）/ `batchUpdateComponentStyle`（拖拽结束）/ `updateComponentProps` / `deleteComponent` / `getComponentById` / `selectComponent(id, multi?)` / `moveComponentLayer` / `exportPageData` / `loadPageData`

---

## 五、注意事项与约束

1. **ID**：由 `createComponentId()` 自动生成，禁止手动硬编码
2. **历史**：用户操作的数据变更必须通过 Command 模式提交
3. **拖拽性能**：拖拽中用 `updateComponentStyleSilent`，结束时用 `batchUpdateComponentStyle`
4. **嵌套**：只有 `Form`/`Tabs` 有 `children`/`slots`，普通组件这两个字段为 `undefined`
5. **多选**：`selectedComponentIds`（数组）管理多选，`currentComponent` 指向最后选中项
6. **Props 扩展**：公共字段先在接口中定义，扩展字段用索引签名
7. **样式单位**：`style` 数值不带单位，渲染时拼接 `px`
8. **容器禁止直接改 props**：容器内部状态（如 `activeTab`）用本地 `ref` 维护，切换时调用 `updateComponentProps()` 写入 store。直接赋值 `props.component.props.xxx = value` 会绕过 Command 模式，导致撤销/重做失效，同时违反 Vue 单向数据流
9. **ComponentRenderer 禁止字符串 key**：`componentMap` 必须声明为 `Record<ComponentType, Component>`，key 用 `[ComponentType.XXX]` 写法。这样新增枚举值若遗漏注册，TypeScript 编译期直接报错，而非等运行时渲染空白

---

💡 引用方式：`{{SKILL:component-structure}}`
