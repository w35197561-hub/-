# 集成测试规范

## 与单元测试的区别

| | 单元测试 | 集成测试 |
|--|---------|---------|
| 测试对象 | 单个函数/store 方法 | 多个模块协作（路由 + db + 业务逻辑） |
| 依赖 | 全部 mock | 只 mock 外部服务（如 AI API） |
| 验证 | 返回值正确 | HTTP 状态码 + 响应格式 + 数据持久化 |
| 速度 | 极快 | 较快（无真实网络） |

## 技术栈

- **supertest**：直接调用 Express app，不启动真实端口
- **vitest**：测试运行器（server 侧用 v1.x）
- 测试文件位置：`server/src/__tests__/*.test.ts`

---

## 关键约定

### 1. 数据隔离（最重要）

不能读写真实的 `server/data/pages.json`，必须用 `vi.mock` 将 db 模块重定向到测试专用目录：

```typescript
vi.mock('../db', async () => {
  const DATA_DIR = path.resolve(__dirname, '../../data/__test__')
  // ... 实现与真实 db 相同的接口
})
```

用 `beforeEach` 清空 + `afterEach` 删除测试目录，确保每个测试独立。

### 2. app 工厂模式

`index.ts` 负责启动服务器，`app.ts` 只创建和配置 app（不监听端口），测试只导入 `app.ts`：

```typescript
// 测试中
import { createApp } from '../app'
const app = createApp()
```

### 3. supertest 用法

```typescript
import request from 'supertest'

const res = await request(app).get('/api/pages')
const res = await request(app).post('/api/pages').send({ title: '新页面' })
await request(app).put(`/api/pages/${id}`).send({ title: '新标题' })
await request(app).delete(`/api/pages/${id}`)
```

---

## 必须覆盖的测试场景

### 路由接口测试
- 正常请求：状态码、响应结构（`success`、`data`）
- 参数缺失/错误：对应的 4xx 状态码
- 资源不存在：404 返回

### 业务链路测试（最有价值）

```
创建页面 → 保存组件数据 → 读取验证 → 删除确认
```

验证整条链路数据一致性，不只是单个接口是否 200。

---

## 注意事项

1. **vitest 版本**：server 侧固定用 v1.x，与前端的 v4.x 不同，不要升级
2. **upsert 语义**：`PUT /api/pages/:id` 对不存在的 id 也会创建（upsert），测试中需验证此行为
3. **不测实现细节**：只断言 HTTP 响应，不 mock 路由内部的私有函数

## 运行命令

```bash
cd server && npm test          # 单次运行
cd server && npm run test:watch # 监听模式
```
