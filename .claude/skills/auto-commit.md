# 自动生成 Commit 并推送

触发此技能后，按以下步骤执行：

## 执行流程

### Step 1：获取变更内容
执行 `git diff --staged` 查看已暂存的变更；若暂存区为空，执行 `git diff HEAD` 查看所有未提交变更。

### Step 2：分析变更，生成 commit message
根据 diff 内容，按照下方规范生成一条 commit message，**不要询问用户，直接生成**。

### Step 3：CHANGELOG（git hook 自动处理）
`CHANGELOG.md` 由 `.git/hooks/commit-msg` 在每次提交时自动写入，无需手动操作。
若需补写说明（如原因、已知问题），可在 commit 后直接编辑对应条目。

### Step 3.5：检查 CLAUDE.md 是否需要更新

对照本次变更，检查以下内容是否与 CLAUDE.md 保持一致：

- **ComponentType 枚举列表**（"ComponentType 枚举（当前已有）"）：新增组件类型时必须同步
- **ComponentEvent / 核心类型说明**：类型接口有变更时必须同步
- **目录结构**：新增文件或目录时同步 `## 项目结构` 部分
- **新增设计规范**：新增了通用的架构约定（如设计态/运行态双模式、事件系统设计）时补充说明

如有不一致，先更新 CLAUDE.md，再继续提交流程。

### Step 4：展示并等待用户确认
将生成的 commit message 展示给用户，**必须等用户明确确认后才能执行提交**，不得自动提交。用户确认后再进入 Step 5。

### Step 5：执行提交
调用脚本完成 `git add → git commit → git push`：

```bash
./.claude/scripts/auto-commit.sh "<commit message>"

# 只提交暂存区变更（需提前 git add）
./.claude/scripts/auto-commit.sh "<commit message>" --staged-only
```

---

## Commit Message 规范（Conventional Commits）

格式：`<type>(<scope>): <subject>`

| type | 场景 |
|------|------|
| `feat` | 新功能、新组件 |
| `fix` | Bug 修复 |
| `refactor` | 重构（不影响功能） |
| `style` | 样式、格式调整（不影响逻辑） |
| `perf` | 性能优化 |
| `chore` | 构建、依赖、配置变更 |
| `docs` | 文档更新 |
| `test` | 测试相关 |

**scope（可选）：** 影响范围，如 `editor`、`canvas`、`store`、`types`、`components`

**subject 写作要求：**
- 用中文，简洁描述做了什么，不超过 50 字
- 动词开头：新增 / 修复 / 重构 / 提取 / 优化 / 更新
- 不写"修改了"、"调整了"等模糊表述

**示例：**
```
refactor(components): 提取 useComponentStyle 和 useContainerDrop composable
fix(tabs): 修复 TabsComponent 直接修改 props 导致撤销失效的问题
feat(editor): 新增组件多选拖拽功能
```
