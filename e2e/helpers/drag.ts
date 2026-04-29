import type { Page } from '@playwright/test'
import { ComponentType } from '../../src/types'

/**
 * 将组件从面板拖入画布。
 * 原生 HTML5 DnD 依赖 dataTransfer，Playwright 的 dragAndDrop() 无法注入，
 * 所以手动 dispatch dragstart / dragover / drop 事件。
 */
export async function dragComponentToCanvas(
  page: Page,
  componentType: ComponentType,
  dropX: number,
  dropY: number
) {
  const item = page.locator(`[data-testid="component-item-${componentType}"]`)
  const canvas = page.locator('[data-testid="canvas-background"]')

  const itemBox = await item.boundingBox()
  const canvasBox = await canvas.boundingBox()
  if (!itemBox || !canvasBox) throw new Error('无法获取元素位置')

  const startX = itemBox.x + itemBox.width / 2
  const startY = itemBox.y + itemBox.height / 2
  const endX = canvasBox.x + dropX
  const endY = canvasBox.y + dropY

  await page.evaluate(
    ({ componentType, startX, startY, endX, endY }) => {
      const source = document.querySelector(
        `[data-testid="component-item-${componentType}"]`
      ) as HTMLElement
      const target = document.querySelector(
        '[data-testid="canvas-background"]'
      ) as HTMLElement

      if (!source || !target) return

      const dt = new DataTransfer()
      dt.setData('componentType', componentType)

      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt, clientX: startX, clientY: startY }))
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: dt, clientX: endX, clientY: endY }))
      target.dispatchEvent(new DragEvent('dragover',  { bubbles: true, dataTransfer: dt, clientX: endX, clientY: endY }))
      target.dispatchEvent(new DragEvent('drop',      { bubbles: true, dataTransfer: dt, clientX: endX, clientY: endY }))
      source.dispatchEvent(new DragEvent('dragend',   { bubbles: true, dataTransfer: dt }))
    },
    { componentType, startX, startY, endX, endY }
  )

  // 等待 Vue 响应式更新
  await page.waitForTimeout(100)
}
