import type { Request, Response, NextFunction } from 'express'
import type { ApiResponse } from '../types'

export interface AppError extends Error {
  statusCode?: number
}

/** 统一错误处理中间件 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Server Error]', err.message, err.stack)

  const statusCode = err.statusCode ?? 500
  const response: ApiResponse = {
    success: false,
    error: err.message || '服务器内部错误'
  }

  res.status(statusCode).json(response)
}

/** 统一 404 处理 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `接口不存在: ${req.method} ${req.path}`
  } as ApiResponse)
}
