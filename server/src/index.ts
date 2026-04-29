import 'dotenv/config'
import path from 'path'
import { createApp } from './app'

const app = createApp()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

// 请求日志（仅生产/开发模式，不在测试中注入）
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`)
  next()
})

app.listen(PORT, () => {
  console.log('')
  console.log('  ✅  后端服务已启动')
  console.log(`  📡  http://localhost:${PORT}`)
  console.log(`  📂  数据目录: ${path.resolve(__dirname, '../../data')}`)
  console.log('')
})

export default app
