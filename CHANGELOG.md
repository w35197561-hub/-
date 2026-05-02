# Changelog

记录每次提交的变更内容与原因。格式：`日期 · commit type · 说明`

---

## 2026-05-02

### fix(canvas): 修复容器内输入框无法聚焦及预览模式可拖拽子组件的问题


### feat(preview): 用实时预览弹窗替换全屏预览路由


### feat(components): TimePicker 扩展支持年月日选择，格式改为 YYYY-MM-DD HH:mm:ss


### feat(components): 新增 TimePicker 时间选择组件，补写单元测试


### feat(preview): 新增全屏预览页，实现组件设计态/运行态双模式



### feat(components): 新增 Divider 分割线组件，扩展 SelectSetter 支持静态选项

## 2026-04-30

### feat(components): 新增 CheckboxGroup 多选复选框组件


### feat(components): 新增 RadioGroup 单选按钮组，重构组件面板布局
新增 RadioGroupComponent（原生 radio + label，disabled），属性面板支持 StringListSetter 编辑选项、InputSetter 设置默认选中。ComponentPanel 改为两列网格 + 基础/容器分类布局。SelectComponent 改为 div 模拟下拉外观（占位文本 + 箭头），解决 select multiple 渲染为列表框的问题。

### feat(components): 新增 Textarea 多行文本组件，规范 canvas 组件实现
新增 TextareaComponent（原生 textarea，readonly），用 useComponentStyle 保证样式响应式。Select/Textarea 均改用原生元素替代 el-*，解决样式无法穿透 el-* 包装层的问题。精简各组件 styleSetters 为精准暴露（仅保留视觉有效的属性）。coding.md 新增"canvas 禁用 el-*"规则及 styleSetters 精准暴露指南。

### feat(components): 新增 Select 下拉复选组件，新增 StringListSetter
新增 SelectComponent（el-select multiple disabled），选项以 string[] 存储，属性面板通过新增的 StringListSetter（每行 el-input + ➕/➖ 按钮）编辑。同步修复 router import 路径、LayerPanel 缺失 NUMBER_INPUT/SELECT 的 typeNames 和 icons、coding.md 新增编码前必须搜索的§0规则。

### refactor(components): 按物料/画布/属性三层重构组件目录结构
将 `src/components/` 下扁平的文件按职责拆分为四个子目录：`editor/`（编辑器外壳）、`material/`（左侧物料面板 + componentConfigs）、`canvas/`（画布 + 可渲染组件 + composables）、`property/`（右侧属性/图层面板）。同步更新所有 import 路径、CLAUDE.md 6 步流程及 coding.md 技能文档。

---

## 2026-04-29 (feature/add-number-input-component)

### feat(components): 新增 NumberInput 数字输入框组件
按 6 步流程完整注册：枚举、defaultProps（min/max/step/value）、组件文件、ComponentRenderer、ComponentPanel、PropertyPanel 属性配置。TypeScript 零报错，单元测试 38 个全绿，E2E 11/11 通过。

---

## 2026-04-29

### chore: 迁移 .codewiz-spec 至 Claude Code 规范结构
将原 `.codewiz-spec/` 目录迁移为 Claude Code 标准结构（`.claude/`），建立 coder → reviewer 多 Agent 工作流，集成 Playwright MCP 用于 E2E 浏览器验证。

### feat: 添加测试基础设施及依赖更新
新增前端 store 单元测试、后端集成测试及 app 工厂，添加 vitest 配置、GitHub Actions CI、server 环境变量示例。

### feat(e2e): 搭建 Playwright E2E 测试框架
安装 @playwright/test，配置 playwright.config.ts，给 ComponentPanel/EditorCanvas/Editor 关键元素加 data-testid，编写编辑器加载/拖拽/撤销重做/属性面板四组测试用例，封装 HTML5 DnD 模拟 helper。

**发现问题：** 编辑器未实现 Ctrl+Z 键盘快捷键，撤销只能点按钮，测试已改为点击按钮验证。

### feat(e2e): 添加测试自动记录和 CHANGELOG 机制
配置 Playwright JSON reporter，新增 `scripts/e2e-log.mjs` 脚本在测试失败时自动将详细错误（用例名、文件行号、完整错误信息）写入 `docs/test-log.md`；全部通过时不写入，避免噪音。更新 auto-commit 技能要求每次提交前维护 CHANGELOG。

---
