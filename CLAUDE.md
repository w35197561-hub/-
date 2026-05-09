# 项目上下文

## 项目概述

基于 Vue 3 + TypeScript 的低代码页面编辑器，支持可视化拖拽组件、AI 对话操作画布、属性配置、历史撤销/重做。

## 技术栈

| 层           | 技术                                  |
| ------------ | ------------------------------------- |
| 前端框架     | Vue 3 + TypeScript + Vite             |
| 状态管理     | Pinia（editor store + history store） |
| UI 组件库    | Element Plus                          |
| 路由         | Vue Router 5                          |
| 后端         | Express + TypeScript（ts-node-dev）   |
| AI 接口      | OpenAI API（通过 server 代理）        |
| 测试（前端） | Vitest + @pinia/testing + happy-dom   |
| 测试（后端） | Vitest v1.x + supertest               |

## 项目结构

```
vue-yuan-drag/
├── src/                              # 前端
│   ├── components/
│   │   ├── editor/                   # 编辑器外壳
│   │   │   ├── Editor.vue            # 主布局（左中右三栏）
│   │   │   └── AIPanel.vue           # AI 对话面板
│   │   ├── material/                 # 物料层（左侧组件面板）
│   │   │   ├── ComponentPanel.vue    # 拖出组件
│   │   │   └── componentConfigs.ts   # 各组件配置（defaultProps/defaultStyle/propSetters/styleSetters）
│   │   ├── canvas/                   # 画布层
│   │   │   ├── EditorCanvas.vue      # 画布（拖拽、缩放、对齐）
│   │   │   └── components/           # 可渲染组件
│   │   │       ├── ComponentRenderer.vue  # 组件分发器（componentMap）
│   │   │       ├── TextComponent.vue
│   │   │       ├── ImageComponent.vue
│   │   │       ├── ButtonComponent.vue
│   │   │       ├── InputComponent.vue
│   │   │       ├── NumberInputComponent.vue
│   │   │       ├── SelectComponent.vue
│   │   │       ├── TextareaComponent.vue
│   │   │       ├── RadioGroupComponent.vue
│   │   │       ├── CheckboxGroupComponent.vue
│   │   │       ├── DividerComponent.vue
│   │   │       ├── FormComponent.vue      # 容器组件（含 slots）
│   │   │       ├── TabsComponent.vue      # 容器组件（含 slots）
│   │   │       └── composables/
│   │   │           ├── useComponentStyle.ts   # 样式 computed 封装（返回 computed，非普通对象）
│   │   │           └── useContainerDrop.ts    # 容器拖放逻辑复用
│   │   └── property/                 # 属性层（右侧面板）
│   │       ├── PropertyPanel.vue     # 属性配置面板
│   │       └── LayerPanel.vue        # 图层管理面板
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
│       ├── HomeView.vue              # 编辑器入口页
│       └── PreviewView.vue           # 全屏预览页（/preview，可交互运行态）
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
npm run lint         # eslint（自动修复）
npm run format       # prettier 格式化

# 测试
npm test                      # 前端单元测试（单次，不写日志）
npm run test:log              # 前端单元测试 + 写入 docs/test-log.md
npm run test:watch            # 前端测试（监听）
npm run test:coverage         # 前端测试 + 覆盖率
npm run test:e2e              # E2E 测试 + 写入 docs/test-log.md（失败时截图保存至 docs/screenshots/）
cd server && npm test         # 后端集成测试
```

## API 接口

### 页面接口（`/api/pages`）

| 方法   | 路径             | 说明                                |
| ------ | ---------------- | ----------------------------------- |
| GET    | `/api/pages`     | 获取页面列表（摘要）                |
| GET    | `/api/pages/:id` | 获取单个页面完整数据                |
| POST   | `/api/pages`     | 新建页面                            |
| PUT    | `/api/pages/:id` | 保存页面（upsert，id 不存在时创建） |
| DELETE | `/api/pages/:id` | 删除页面                            |

响应格式：`{ success: boolean, data?: T, error?: string }`

### AI 接口（`/api/ai/chat`）

输入：`{ messages: AiMessage[], canvasContext? }` → 输出：`{ reply: string, actions: CanvasAction[] }`

`ActionType`：`add_component` / `update_component_style` / `update_component_props` / `delete_component` / `set_page_style` / `none`

---

## 组件 Schema（`src/types/index.ts`）

**ComponentType 枚举（当前已有）：**
`Text` / `Image` / `Button` / `Input` / `NumberInput` / `Select` / `Textarea` / `RadioGroup` / `CheckboxGroup` / `Divider` / `Form`（容器）/ `Chart` / `Tabs`（容器）/ `TimePicker` / `Table` / `Collapse` / `Switch` / `Cascader` / `Link` / `Tree`

**ComponentStyle：** `top, left, width, height, zIndex, rotate`（必填）+ `fontSize, color, backgroundColor, borderWidth, borderColor, borderRadius`（可选，数值均为 `number`，渲染时拼接 `px`）

默认尺寸：顶层组件 `200×50`，子组件 `180×40`（组件特定尺寸在 `componentConfigs.ts` 的 `defaultStyle` 中声明）

**ComponentProps：** `content?, src?, type?, placeholder?, [key: string]: unknown`（可自由扩展）

各类型默认 props 和默认 style 统一在 `src/components/componentConfigs.ts` 中声明，不再硬编码于 `editor.ts`。

**ComponentData（核心）：**

```typescript
interface ComponentData {
  id: string // comp_{Date.now()}_{random6}
  type: ComponentType
  style: ComponentStyle
  props: ComponentProps
  events?: ComponentEvent[] // { type: string, actions: ActionConfig[] }
  children?: ComponentData[] // Form 用
  slots?: Record<string, ComponentData[]> // Form: {col1,col2} / Tabs: {tab1,tab2}
  isContainer?: boolean // Form/Tabs 为 true
}
```

**PageData：** `{ id, title, components: ComponentData[], style: { width:1200, height:800, backgroundColor:'#fff' } }`

**事件 Schema：**

```typescript
// ComponentEvent：一种触发方式 + 该触发方式下的动作列表
{ type: 'click', actions: ActionConfig[] }

// ActionConfig：一个动作的类型 + 参数
type ActionType = 'alert' | 'link' | 'toggleVisible'
interface ActionConfig {
  type: ActionType
  params: { message?, url?, openInNew?, componentId?, operation? }
}
```

运行时 `previewHiddenIds: string[]` 不写入 PageData，关闭预览自动清空。

新增组件流程见 `.claude/agents/coder.md`，编码规范见 `.claude/skills/coding.md`。

---

## 多 Agent 流程

新增组件由主 Agent 确认设计后，由两个子 Agent 顺序承接：

```
主 Agent 设计确认 → coder → reviewer
```

| Agent    | 文件                         | 职责                | 触发时机                 |
| -------- | ---------------------------- | ------------------- | ------------------------ |
| coder    | `.claude/agents/coder.md`    | 按 6 步流程新增组件 | 用户要求新增某个组件类型 |
| reviewer | `.claude/agents/reviewer.md` | 代码审查 → 提交推送 | 编码完成后               |

---

## 技能索引

以下技能文件按需读取，遇到匹配的触发场景时主动加载对应文件。

| 技能           | 文件                                 | 触发场景                                                      |
| -------------- | ------------------------------------ | ------------------------------------------------------------- |
| 代码审查       | `.claude/skills/code-review.md`      | 用户要求 review、CR、审查代码                                 |
| 自动提交       | `.claude/skills/auto-commit.md`      | 用户要求提交代码、commit、推送                                |
| 创建分支       | `.claude/skills/create-branch.md`    | coder 启动时，编码前建分支                                    |
| 单元测试       | `.claude/skills/unit-test.md`        | reviewer 审查时，检查并补写 store 测试                        |
| E2E 浏览器测试 | `.claude/skills/e2e-test.md`         | reviewer 审查时，通过 Playwright MCP 验证组件在编辑器中的交互 |
| 集成测试       | `.claude/skills/integration-test.md` | 用户要求写后端接口测试时                                      |
