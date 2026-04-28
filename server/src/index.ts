import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import pagesRouter from './routes/pages'
import aiRouter from './routes/ai'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

// =====================
// 中间件
// =====================

// 跨域（开发阶段允许前端 dev server 访问）
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

// JSON 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 请求日志（简版）
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`)
  next()
})

// =====================
// 路由
// =====================
app.use('/api/pages', pagesRouter)
app.use('/api/ai', aiRouter)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
})

// =====================
// 错误处理
// =====================
app.use(notFoundHandler)
app.use(errorHandler)

// =====================
// 启动服务
// =====================
app.listen(PORT, () => {
  console.log('')
  console.log('  ✅  后端服务已启动')
  console.log(`  📡  http://localhost:${PORT}`)
  console.log(`  📂  数据目录: ${path.resolve(__dirname, '../../data')}`)
  console.log('')
})

export default app
