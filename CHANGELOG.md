# Changelog

记录每次提交的变更内容与原因。格式：`日期 · commit type · 说明`

---

## 2026-05-02

### feat(components): 新增 Table 表格组件

新增 TableComponent，支持 columns/dataSource/bordered/striped 配置，实现设计态静态展示和运行态可交互双模式。同步更新 ComponentType 枚举、editor.ts defaultProps、ComponentRenderer、ComponentPanel、LayerPanel 六处注册点，并补写 4 个 TABLE addComponent undo/redo 单元测试。

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
