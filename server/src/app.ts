import express from 'express'
import cors from 'cors'
import pagesRouter from './routes/pages'
import aiRouter from './routes/ai'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

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
