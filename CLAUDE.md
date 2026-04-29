# 项目上下文

## 项目概述

基于 Vue 3 + TypeScript 的低代码页面编辑器，支持可视化拖拽组件、AI 对话操作画布、属性配置、历史撤销/重做。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Vue 3 + TypeScript + Vite |
| 状态管理 | Pinia（editor store + history store） |
| UI 组件库 | Element Plus |
| 路由 | Vue Router 5 |
| 后端 | Express + TypeScript（ts-node-dev） |
| AI 接口 | OpenAI API（通过 server 代理） |
| 测试（前端） | Vitest + @pinia/testing + happy-dom |
| 测试（后端） | Vitest v1.x + supertest |

## 项目结构

```
vue-yuan-drag/
├── src/                              # 前端
│   ├── components/
│   │   ├── Editor.vue                # 编辑器主布局（左中右三栏）
│   │   ├── EditorCanvas.vue          # 画布（拖拽、缩放、对齐）
│   │   ├── ComponentPanel.vue        # 左侧组件面板（拖出组件）
│   │   ├── PropertyPanel.vue         # 右侧属性面板（编辑 props/style）
│   │   ├── LayerPanel.vue            # 图层管理面板
│   │   ├── AIPanel.vue               # AI 对话面板
│   │   └── components/               # 可渲染组件
│   │       ├── ComponentRenderer.vue # 组件分发器（componentMap）
│   │       ├── TextComponent.vue
│   │       ├── ImageComponent.vue
│   │       ├── ButtonComponent.vue
│   │       ├── InputComponent.vue
│   │       ├── FormComponent.vue     # 容器组件（含 slots）
│   │       ├── TabsComponent.vue     # 容器组件（含 slots）
│   │       └── composables/
│   │           ├── useComponentStyle.ts   # 样式 computed 封装
│   │           └── useContainerDrop.ts    # 容器拖放逻辑复用
│   ├── stores/
│   │   ├── editor.ts                 # 编辑器状态（页面、组件、画布）
│   │   ├── history.ts                # 撤销/重做（Command 模式）
│   │   └── __tests__/               # store 单元测试
│   ├── services/
│   │   ├── api.ts                    # 页面 CRUD
│   │   └── aiApi.ts                  # AI 对话
│   ├── types/index.ts                # 所有核心类型
│   ├── router/index.ts
│   └── views/
│       └── HomeView.vue              # 编辑器入口页
│
└── server/                           # 后端（Express + TypeScript）
    └── src/
        ├── app.ts                    # Express app 工厂（不监听端口，测试用）
        ├── index.ts                  # 启动入口
        ├── db.ts                     # JSON 文件持久化（server/data/pages.json）
        ├── types.ts
        ├── routes/
        │   ├── pages.ts              # 页面 CRUD 路由
        │   └── ai.ts                 # AI 对话路由
        ├── middleware/
        │   └── errorHandler.ts
        └── __tests__/
            ├── pages.test.ts
            └── ai.test.ts
```

## 常用命令

```bash
# 启动开发环境
npm run dev          # 仅前端（Vite，默认 5173）
npm run dev:server   # 仅后端（Express，默认 3000）
npm run dev:all      # 前后端同时启动

# 代码检查
npm run lint         # oxlint + eslint（自动修复）
npm run format       # prettier 格式化

# 测试
npm test                      # 前端单元测试（单次）
npm run test:watch            # 前端测试（监听）
npm run test:coverage         # 前端测试 + 覆盖率
cd server && npm test         # 后端集成测试
```

## API 接口

### 页面接口（`/api/pages`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/pages` | 获取页面列表（摘要） |
| GET | `/api/pages/:id` | 获取单个页面完整数据 |
| POST | `/api/pages` | 新建页面 |
| PUT | `/api/pages/:id` | 保存页面（upsert，id 不存在时创建） |
| DELETE | `/api/pages/:id` | 删除页面 |

响应格式：`{ success: boolean, data?: T, error?: string }`

### AI 接口（`/api/ai/chat`）

输入：`{ messages: AiMessage[], canvasContext? }` → 输出：`{ reply: string, actions: CanvasAction[] }`

`ActionType`：`add_component` / `update_component_style` / `update_component_props` / `delete_component` / `set_page_style` / `none`

---

## 编码规范

### 命名规范

- 文件命名：（待补充）
- 变量命名：（待补充）
- 函数命名：（待补充）
- 类命名：（待补充）

### 代码风格

- 缩进：（待补充）
- 换行：（待补充）
- 注释：（待补充）

---

## 组件结构定义规范

所有新组件、属性扩展必须严格遵循本规范。

### 核心数据类型（`src/types/index.ts`）

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

### Vue 组件文件规范（`src/components/components/`）

- Props 固定为 `defineProps<{ component: ComponentData }>()`
- 样式通过 `computed` 对象绑定，使用 `useComponentStyle(component.style)` composable 获取基础样式
- 容器组件的拖放逻辑通过 `useContainerDrop(containerId, getSlotKey)` composable 复用
- 子组件 wrapper 样式抽为独立函数，避免模板内联对象导致额外重渲染
- CSS 固定 `width:100%; height:100%; box-sizing:border-box`

### 新增组件的完整流程（6 步）

1. **`src/types/index.ts`** → `ComponentType` 枚举加新值
2. **`src/components/componentConfigs.ts`** → 新增一条配置（`defaultProps`、`defaultStyle`、`propSetters`、`styleSetters`），详见 `.claude/skills/coding.md` 的"新增组件自查清单 §2"
3. **`src/components/components/XxxComponent.vue`** → 新建组件文件，遵循上方规范
4. **`src/components/components/ComponentRenderer.vue`** → `componentMap` 加新枚举 key
5. **`src/components/ComponentPanel.vue`** → `componentTypes` 数组加 `{ type, name, icon }`
6. **`src/components/PropertyPanel.vue`** → （可选）加对应属性配置 UI

### Store 操作规范（`src/stores/editor.ts`）

所有数据变更必须通过 Command 模式，确保撤销/重做正常：

```typescript
const command: Command = {
  execute: () => { /* 执行 */ },
  undo:    () => { /* 撤销 */ }
}
historyStore.executeCommand(command)
```

### 关键约束

1. **ID**：由 `createComponentId()` 自动生成，禁止手动硬编码
2. **历史**：用户操作的数据变更必须通过 Command 模式提交
3. **拖拽性能**：拖拽中用 `updateComponentStyleSilent`，结束时用 `batchUpdateComponentStyle`
4. **嵌套**：只有 `Form`/`Tabs` 有 `children`/`slots`，普通组件这两个字段为 `undefined`
5. **多选**：`selectedComponentIds`（数组）管理多选，`currentComponent` 指向最后选中项
6. **样式单位**：`style` 数值不带单位，渲染时拼接 `px`
7. **容器禁止直接改 props**：容器内部状态用本地 `ref` 维护，切换时调用 `updateComponentProps()` 写入 store
8. **ComponentRenderer 禁止字符串 key**：`componentMap` 必须声明为 `Record<ComponentType, Component>`，key 用 `[ComponentType.XXX]` 写法

---

## 多 Agent 流程

新增组件由两个子 Agent 顺序承接：

```
coder → reviewer
```

| Agent | 文件 | 职责 | 触发时机 |
|-------|------|------|----------|
| coder | `.claude/agents/coder.md` | 按 6 步流程新增组件 | 用户要求新增某个组件类型 |
| reviewer | `.claude/agents/reviewer.md` | 代码审查 → 提交推送 | 编码完成后 |

---

## 技能索引

以下技能文件按需读取，遇到匹配的触发场景时主动加载对应文件。

| 技能 | 文件 | 触发场景 |
|------|------|----------|
| 代码实现规范 | `.claude/skills/coding.md` | 编写代码时，了解质量要求和实现规范 |
| 代码审查 | `.claude/skills/code-review.md` | 用户要求 review、CR、审查代码 |
| 自动提交 | `.claude/skills/auto-commit.md` | 用户要求提交代码、commit、推送 |
| 创建分支 | `.claude/skills/create-branch.md` | coder 启动时，编码前建分支 |
| 单元测试 | `.claude/skills/unit-test.md` | reviewer 审查时，检查并补写 store 测试 |
| E2E 浏览器测试 | `.claude/skills/e2e-test.md` | reviewer 审查时，通过 Playwright MCP 验证组件在编辑器中的交互 |
| 集成测试 | `.claude/skills/integration-test.md` | 用户要求写后端接口测试时 |
