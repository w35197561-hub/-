import express from 'express'
import cors from 'cors'
import pagesRouter from './routes/pages'
import aiRouter from './routes/ai'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

//  用 Node.js 原生的 http 模块，大概长这样：

//   const http = require('http')

//   const server = http.createServer((req, res) => {
//     if (req.method === 'GET' && req.url === '/api/pages') {
//       res.writeHead(200, { 'Content-Type': 'application/json' })
//       res.end(JSON.stringify({ success: true, data: [] }))
//     } else if (req.method === 'POST' && req.url === '/api/pages') {
//       let body = ''
//       req.on('data', chunk => { body += chunk })
//       req.on('end', () => {
//         const data = JSON.parse(body)
//         // 处理...
//         res.end(JSON.stringify({ success: true }))
//       })
//     } else {
//       res.writeHead(404)
//       res.end('Not Found')
//     }
//   })

//   server.listen(3001)
export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use('/api/pages', pagesRouter)
  app.use('/api/ai', aiRouter)

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
  })

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
