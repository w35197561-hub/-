# Agent 使用指南

本项目配置了一套基于 Claude Code 的 AI 开发流程。本文档说明如何使用这套流程，项目技术细节见 `CLAUDE.md`。

## 多 Agent 流程

新增组件由两个 Agent 顺序承接：

```
coder ──────────────→ reviewer
按 6 步流程新增组件     代码审查 + 提交
```

直接告诉 AI「用 coder 新增 XXX 组件」或「用 reviewer 审查」即可。

## 可用技能

技能文件存放在 `.claude/skills/`，AI 根据任务场景自动读取。

### 实现技能

| 技能 | 触发场景 |
|------|----------|
| coding | 编写代码，了解质量要求 |

### 质量技能

| 技能 | 说明 |
|------|------|
| code-review | 审查当前 git diff，通过后自动提交 |
| auto-commit | 生成 Conventional Commits message 并推送 |
| unit-test | Vitest + Pinia 单元测试规范 |
| integration-test | supertest 接口集成测试规范 |

### Git 技能

| 技能 | 说明 |
|------|------|
| create-branch | 按命名规范创建功能分支 |

## 产出文件规范

功能开发的过程文件保存在 `.claude/specs/{功能名}/` 下：

```
.claude/specs/
└── {feature-name}/
    ├── userStory.md   # 需求文档
    ├── design.md      # 技术方案
    ├── task.md        # 任务清单
    └── changes.md     # 变更记录
```

## 脚本

```bash
# 自动提交并推送
./.claude/scripts/auto-commit.sh "feat(components): 新增 XxxComponent"

# 创建功能分支
./.claude/scripts/create-branch.sh feature/your-feature-name
```
