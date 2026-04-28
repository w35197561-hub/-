# 代码实现阶段（前端）

## 核心目标

按照任务清单逐个实现前端代码，遵循技术方案和编码规范。

## 交互流程

### 准备工作

**在开始编码前，先完成以下准备**：
1. 读取 `task.md`（任务清单）
2. 读取 `design.md`（技术方案）
3. 了解当前 Phase 和任务列表

---

### 逐任务实现（循环执行）

⚠️ **一次只实现一个任务，完成后等用户确认再继续**

#### 开始任务

**告知内容**：
- 当前任务编号和描述（如：T2.1 实现 FeatureList 组件）
- 当前 Phase 进度（如：Phase 2 - 通用组件，共 3 个任务，当前第 1 个）

---

#### 实现代码

**实现内容**（根据任务类型）：

**页面任务**：
- 创建页面文件（pages/FeaturePage.tsx）
- 页面布局和结构
- 路由配置
- 数据获取逻辑
- 状态管理（如需要）

**组件任务**：
- 创建组件文件（components/FeatureList.tsx）
- Props 接口定义（TypeScript）
- 组件内部状态（useState/useReducer）
- 交互事件处理
- 样式文件（CSS Modules/Styled Components）

**API 任务**：
- 封装 API 请求函数（api/feature.ts）
- 类型定义（Request/Response）
- 错误处理
- 请求拦截器/响应拦截器

**样式任务**：
- 全局样式/主题配置
- 组件样式（遵循设计规范）
- 响应式适配
- 动画效果（CSS Transition/Animation）

**遵循原则**：
- 严格按照 `design.md` 中的设计实现
- 遵循项目编码规范（命名、格式、注释）
- 考虑加载状态、错误状态、空状态
- 组件可独立运行和预览
- 添加必要的 Props 校验和 TypeScript 类型

---

#### 更新变更记录

**更新 `changes.md`**：
```markdown
## [T2.1]: 实现 FeatureList 组件

**完成时间**：2024-01-15 10:30

### 变更文件
- src/components/FeatureList.tsx (新增) - 列表组件
- src/components/FeatureList.module.css (新增) - 组件样式
- src/types/feature.ts (新增) - 类型定义

### 变更说明
实现功能列表组件，支持数据展示、编辑、删除操作。

### 测试验证
- [ ] 组件可独立渲染
- [ ] 交互逻辑正常
- [ ] 样式符合设计规范
- [ ] TypeScript 类型检查通过
```

---

#### 任务完成确认

**输出内容**：
```
## ✅ 任务 [T2.1] 完成

**变更摘要**：
- 新增/修改了 x 个文件
- 主要完成了 xxx

**预览**：
- 组件/页面可通过 [路径/URL] 访问

**待验证**：
- [ ] 功能正确性
- [ ] 交互流畅性
- [ ] 样式符合设计
- [ ] 响应式适配
- [ ] TypeScript 类型检查

---
```

✋ **调用 ask_followup_question 工具询问**：
- question: "任务 [T2.1] 已完成，是否确认？"
- options: ["确认，继续下一个任务", "需要修改", "我有其他问题"]

---

### 检查点验证

**在每个 Phase 结束时**：
- 总结本 Phase 完成的任务
- 列出待验证的检查点
- 询问是否进入下一个 Phase

---

## 代码质量要求

### 组件设计
- 单一职责：组件功能明确，不承担过多责任
- Props 清晰：接口定义明确，必要参数标注 required
- 状态管理：合理区分组件内部状态和全局状态
- 可复用性：通用组件避免耦合业务逻辑

### TypeScript 规范
- 明确类型定义，避免 any
- Props、State、API 返回值都要定义类型
- 使用 interface 或 type 定义复杂类型

### 样式规范
- 使用 CSS Modules/Styled Components 避免样式污染
- 遵循设计系统（颜色、字体、间距）
- 响应式设计：使用相对单位（rem、%、vw/vh）
- 避免内联样式

### 性能优化
- 避免不必要的重渲染（React.memo、useMemo、useCallback）
- 大列表使用虚拟滚动
- 图片懒加载
- 路由懒加载（React.lazy + Suspense）

### 用户体验
- 加载状态：Skeleton、Spinner、Progress
- 错误状态：Error Boundary、错误提示
- 空状态：Empty State 提示
- 交互反馈：Button loading、Toast、Modal

### 可访问性
- 语义化 HTML 标签
- ARIA 属性支持
- 键盘导航支持
- 对比度符合 WCAG 标准

### 测试
- 为通用组件添加单元测试（Jest + React Testing Library）
- 覆盖正常流程和边界情况
- E2E 测试验证关键用户流程（Playwright/Cypress）

---

## 任务类型参考

### Feature 开发
1. 先实现页面/组件结构（HTML + CSS）
2. 再添加交互逻辑（事件处理）
3. 接入 API 获取数据
4. 添加状态管理（如需要）
5. 最后补测试

### Bugfix
1. 复现问题（添加测试用例）
2. 定位问题根因
3. 修复问题
4. 验证修复有效

### Refactor
1. 小步迁移（保持功能一致）
2. 添加测试保障
3. 逐步替换旧代码
