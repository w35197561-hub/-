# 创建功能分支

## 使用方式

```bash
./.claude/scripts/create-branch.sh feature/your-feature-name
```

## 分支命名规范

### 功能分支
- `feature/add-select-component` - 新增组件类型
- `feature/multi-select-drag` - 新增交互功能

### 修复分支
- `bugfix/fix-tabs-undo` - Bug 修复
- `hotfix/fix-canvas-crash` - 紧急修复

### 其他分支
- `refactor/extract-composables` - 重构
- `docs/update-component-spec` - 文档更新

## 创建流程

脚本会自动执行：
1. 检查工作区是否干净
2. 切换到主分支（main/master）并拉取最新代码
3. 创建并切换到新分支
4. 推送到远程仓库

## 注意事项

- 分支名使用小写字母和连字符
- 包含 JIRA 票号（如果有）
- 描述要简洁明了
- 避免使用特殊字符
