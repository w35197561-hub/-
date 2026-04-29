import { test, expect } from '@playwright/test'
import { ComponentType } from '../src/types'
import { dragComponentToCanvas } from './helpers/drag'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // 等待编辑器完成挂载
  await expect(page.locator('.page-editor-container')).toBeVisible()
})

// ─────────────────────────────────────────────
// 编辑器加载
// ─────────────────────────────────────────────
test.describe('编辑器加载', () => {
  test('页面结构正常渲染', async ({ page }) => {
    await expect(page.locator('.editor-header')).toBeVisible()
    await expect(page.locator('.component-panel')).toBeVisible()
    await expect(page.locator('[data-testid="canvas-background"]')).toBeVisible()
  })

  test('组件面板显示全部 6 个组件', async ({ page }) => {
    const types = [
      ComponentType.TEXT,
      ComponentType.IMAGE,
      ComponentType.BUTTON,
      ComponentType.INPUT,
      ComponentType.FORM,
      ComponentType.TABS,
    ]
    for (const type of types) {
      await expect(page.locator(`[data-testid="component-item-${type}"]`)).toBeVisible()
    }
  })

  test('初始状态撤销/重做按钮均禁用', async ({ page }) => {
    await expect(page.locator('[data-testid="btn-undo"]')).toBeDisabled()
    await expect(page.locator('[data-testid="btn-redo"]')).toBeDisabled()
  })
})

// ─────────────────────────────────────────────
// 拖拽组件到画布
// ─────────────────────────────────────────────
test.describe('拖拽组件到画布', () => {
  test('拖入文本组件 → 画布出现 1 个组件', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.TEXT, 200, 150)
    await expect(page.locator('[data-testid="component-wrapper"]')).toHaveCount(1)
  })

  test('连续拖入两个组件 → 画布出现 2 个组件', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.TEXT, 200, 150)
    await dragComponentToCanvas(page, ComponentType.BUTTON, 450, 150)
    await expect(page.locator('[data-testid="component-wrapper"]')).toHaveCount(2)
  })
})

// ─────────────────────────────────────────────
// 撤销 / 重做
// ─────────────────────────────────────────────
test.describe('撤销/重做', () => {
  test('拖入组件后撤销按钮可用', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.TEXT, 200, 150)
    await expect(page.locator('[data-testid="btn-undo"]')).toBeEnabled()
  })

  test('撤销后组件从画布消失', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.TEXT, 200, 150)
    await expect(page.locator('[data-testid="component-wrapper"]')).toHaveCount(1)

    await page.locator('[data-testid="btn-undo"]').click()
    await expect(page.locator('[data-testid="component-wrapper"]')).toHaveCount(0)
  })

  test('撤销后重做，组件重新出现', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.TEXT, 200, 150)
    await page.locator('[data-testid="btn-undo"]').click()
    await expect(page.locator('[data-testid="component-wrapper"]')).toHaveCount(0)

    await page.locator('[data-testid="btn-redo"]').click()
    await expect(page.locator('[data-testid="component-wrapper"]')).toHaveCount(1)
  })
})

// ─────────────────────────────────────────────
// NumberInput 组件
// ─────────────────────────────────────────────
test.describe('NumberInput 组件', () => {
  test('组件面板显示数字输入项', async ({ page }) => {
    await expect(page.locator(`[data-testid="component-item-${ComponentType.NUMBER_INPUT}"]`)).toBeVisible()
  })

  test('拖入画布后正常渲染', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.NUMBER_INPUT, 200, 150)
    await expect(page.locator('[data-testid="component-wrapper"]')).toHaveCount(1)
  })
})

// ─────────────────────────────────────────────
// 属性面板
// ─────────────────────────────────────────────
test.describe('属性面板', () => {
  test('点击画布组件后属性面板显示内容', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.TEXT, 200, 150)

    const wrapper = page.locator('[data-testid="component-wrapper"]').first()
    await wrapper.click()

    // 属性面板（右侧）应出现内容，class 来自 PropertyPanel.vue
    await expect(page.locator('.property-panel')).toBeVisible()
  })
})
