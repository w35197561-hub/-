# Code Review 规范

## AI 执行流程

触发此技能后，按以下步骤执行：

### Step 1：获取变更

执行 `git diff HEAD`（或 `git diff --staged`）获取本次改动内容。

### Step 2：逐项检查

对照下方检查清单逐项核对，记录发现的问题。

### Step 3：输出审查报告

```
## Code Review 报告

### 通过项
- ...

### 问题（必须修复）
- 文件:行号 — 问题描述

### 建议（可选优化）
- 文件:行号 — 建议描述

### 结论
通过 / 需修复后重新审查
```

### Step 4：结论判断

- **通过** → 输出"审查通过"，由 reviewer 继续执行后续步骤
- **需修复** → 生成"代码审查修复请求"Issue 块，移交 coder 修复，reviewer 不修改任何代码

---

## 检查清单

### 通用规范

- [ ] 没有遗留 `console.log` / `console.error` / `debugger`
- [ ] 没有硬编码的魔法字符串（应使用常量或枚举）
- [ ] 变量/函数命名清晰，符合驼峰命名规范
- [ ] 没有未使用的变量、import、函数

### Vue 组件规范

- [ ] Props 固定为 `defineProps<{ component: ComponentData }>()`，不得随意扩展
- [ ] 样式映射通过 `computed` 对象或 `useComponentStyle` composable，禁止在模板中写大段内联对象
- [ ] 容器组件内部状态（如 activeTab）用本地 `ref` 维护，通过 `updateComponentProps()` 写入 store，禁止直接赋值 `props.component.props.xxx`
- [ ] 新增组件类型已同步到 6 处（枚举、defaultProps、Vue 文件、ComponentRenderer、ComponentPanel、PropertyPanel）

### Store / 数据变更规范

- [ ] 所有用户操作产生的数据变更通过 `Command` 模式提交（`execute + undo`）
- [ ] 拖拽过程使用 `updateComponentStyleSilent`，拖拽结束使用 `batchUpdateComponentStyle`
- [ ] 没有直接修改 `currentPage.value` 或 `currentComponent.value` 跳过 command

### ComponentRenderer 规范

- [ ] `componentMap` 类型为 `Record<ComponentType, Component>`，key 用 `[ComponentType.XXX]` 枚举写法
- [ ] 新增枚举值后 componentMap 已补全对应项

### TypeScript 规范

- [ ] 没有 `as any` 或不必要的 `as` 类型断言
- [ ] 函数参数和返回值有明确类型，无隐式 `any`
