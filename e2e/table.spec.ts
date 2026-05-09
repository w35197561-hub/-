/**
 * Table 组件 E2E 验证
 *
 * 默认数据（来自 componentConfigs.ts）：
 *   { name: '张三', age: 28, city: '北京' }
 *   { name: '李四', age: 32, city: '上海' }
 *   { name: '王五', age: 25, city: '广州' }
 *
 * 年龄升序第1行 → 25（王五），降序第1行 → 32（李四）
 */
import { test, expect } from '@playwright/test'
import { ComponentType } from '../src/types'
import { dragComponentToCanvas } from './helpers/drag'

test.describe('Table 组件 - 编辑器验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.page-editor-container')).toBeVisible()
  })

  // ── Step 1：编辑器加载 ──────────────────────────────────────────────
  test('Step 1: 编辑器结构正常渲染', async ({ page }) => {
    await expect(page.locator('.editor-header')).toBeVisible()
    await expect(page.locator('.component-panel')).toBeVisible()
    await expect(page.locator('[data-testid="canvas-background"]')).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/table-e2e-01-editor-loaded.png' })
  })

  // ── Step 2：面板里有"表格"并可拖入画布 ───────────────────────────────
  test('Step 2a: 左侧组件面板显示"表格"条目', async ({ page }) => {
    await expect(page.locator(`[data-testid="component-item-${ComponentType.TABLE}"]`)).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/table-e2e-02-panel-has-table.png' })
  })

  test('Step 2b: 拖入画布后表格表头和数据行可见', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.TABLE, 200, 150)
    const wrapper = page.locator('[data-testid="component-wrapper"]').first()
    await expect(wrapper).toBeVisible()

    // 验证表头列
    await expect(wrapper.locator('th').filter({ hasText: '姓名' })).toBeVisible()
    await expect(wrapper.locator('th').filter({ hasText: '年龄' })).toBeVisible()
    await expect(wrapper.locator('th').filter({ hasText: '城市' })).toBeVisible()

    // 验证数据行（默认3条）
    const rows = wrapper.locator('tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(3)

    await page.screenshot({ path: 'docs/screenshots/table-e2e-03-table-rendered.png' })
  })

  // ── Step 3：属性面板配置项 ────────────────────────────────────────────
  test('Step 3: 选中表格后属性面板显示 columns / data / pageSize 配置项', async ({ page }) => {
    await dragComponentToCanvas(page, ComponentType.TABLE, 200, 150)

    // 点击画布中的组件使其选中
    const wrapper = page.locator('[data-testid="component-wrapper"]').first()
    await wrapper.click()

    const panel = page.locator('.property-panel')
    await expect(panel).toBeVisible()

    await expect(panel.getByText('列定义')).toBeVisible()
    await expect(panel.getByText('行数据')).toBeVisible()
    await expect(panel.getByText('每页行数')).toBeVisible()

    await page.screenshot({ path: 'docs/screenshots/table-e2e-04-property-panel.png' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 预览态交互：排序 + 分页
// 预览通过点击"实时预览"按钮打开 el-dialog，dialog 内的组件 isPreview=true
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Table 组件 - 预览态交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.page-editor-container')).toBeVisible()
    // 拖入 Table 组件
    await dragComponentToCanvas(page, ComponentType.TABLE, 200, 150)
    await expect(page.locator('[data-testid="component-wrapper"]')).toHaveCount(1)
  })

  /** 打开"实时预览"弹窗，返回弹窗内的 table-wrapper locator */
  async function openPreview(page: import('@playwright/test').Page) {
    const previewBtn = page.locator('button').filter({ hasText: '实时预览' }).first()
    await previewBtn.click()
    // 等待 dialog 出现
    const dialog = page.locator('.el-dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    // dialog 内的 table-wrapper
    return dialog.locator('.table-wrapper').first()
  }

  // ── Step 5a：点击年龄列头一次 → 升序，第一行年龄为最小值 25 ────────────
  test('Step 5a: 年龄列升序排序 - 第一行年龄为最小值 25', async ({ page }) => {
    const tableWrapper = await openPreview(page)
    await expect(tableWrapper).toBeVisible()

    await page.screenshot({ path: 'docs/screenshots/table-e2e-05-preview-opened.png' })

    // 点击"年龄"列头一次（升序）
    const ageHeader = tableWrapper.locator('th').filter({ hasText: '年龄' })
    await ageHeader.click()
    await page.waitForTimeout(300)

    // 取第一行、第二列（年龄）的文本（列顺序：姓名[0], 年龄[1], 城市[2]）
    const firstRowAgeCell = tableWrapper.locator('tbody tr').first().locator('td').nth(1)
    const ageAscText = await firstRowAgeCell.textContent()

    await page.screenshot({ path: 'docs/screenshots/table-e2e-06-sort-asc.png' })

    // 升序第一行应是最小年龄 25（王五）
    expect(ageAscText?.trim()).toBe('25')
  })

  // ── Step 5b：再点一次 → 降序，第一行年龄为最大值 32 ──────────────────
  test('Step 5b: 年龄列降序排序 - 第一行年龄为最大值 32', async ({ page }) => {
    const tableWrapper = await openPreview(page)
    await expect(tableWrapper).toBeVisible()

    const ageHeader = tableWrapper.locator('th').filter({ hasText: '年龄' })

    // 第一次点击：升序
    await ageHeader.click()
    await page.waitForTimeout(200)
    // 第二次点击：降序
    await ageHeader.click()
    await page.waitForTimeout(300)

    const firstRowAgeCell = tableWrapper.locator('tbody tr').first().locator('td').nth(1)
    const ageDescText = await firstRowAgeCell.textContent()

    await page.screenshot({ path: 'docs/screenshots/table-e2e-07-sort-desc.png' })

    // 降序第一行应是最大年龄 32（李四）
    expect(ageDescText?.trim()).toBe('32')
  })

  // ── Step 6：分页 - 默认3条数据1页，下一页禁用 ────────────────────────
  test('Step 6a: 默认数据3条 pageSize=5，分页控件可见且下一页按钮禁用', async ({ page }) => {
    const tableWrapper = await openPreview(page)
    await expect(tableWrapper).toBeVisible()

    // 分页控件应可见
    const pagination = page.locator('.el-dialog .pagination')
    await expect(pagination).toBeVisible()

    // 3条数据 < pageSize(5)，只有1页，下一页按钮应禁用
    const nextBtn = pagination.locator('button').filter({ hasText: '下一页' })
    await expect(nextBtn).toBeDisabled()

    // 页码信息显示"第 1"
    const pageInfo = pagination.locator('.page-info')
    await expect(pageInfo).toContainText('第 1')

    await page.screenshot({ path: 'docs/screenshots/table-e2e-08-pagination-single-page.png' })
  })

  // ── Step 6b：通过属性面板将 pageSize 改为 2，3条数据→2页，验证翻页 ──
  test('Step 6b: 通过属性面板将 pageSize 设为 2，点击下一页显示第2页', async ({ page }) => {
    // 选中画布中的 Table 组件，打开属性面板
    const wrapper = page.locator('[data-testid="component-wrapper"]').first()
    await wrapper.click()

    const panel = page.locator('.property-panel')
    await expect(panel).toBeVisible()

    // 找到"每页行数"的 el-input-number，将值改为 2（3条数据 → 2页：第1页2条，第2页1条）
    // el-input-number 有一个 input 元素
    const pageSizeLabel = panel.getByText('每页行数', { exact: false })
    await expect(pageSizeLabel).toBeVisible()

    // el-input-number 的 input 在同一个 .property-item 容器内
    const pageSizeItem = panel.locator('.property-item').filter({ has: page.getByText('每页行数', { exact: false }) })
    const pageSizeInput = pageSizeItem.locator('input').first()

    // 清空并输入 2
    await pageSizeInput.click({ clickCount: 3 })
    await pageSizeInput.fill('2')
    await pageSizeInput.press('Enter')
    await page.waitForTimeout(300)

    // 打开预览
    const tableWrapper = await openPreview(page)
    await expect(tableWrapper).toBeVisible()

    await page.screenshot({ path: 'docs/screenshots/table-e2e-09-page1.png' })

    // 第1页应显示2行（pageSize=2）
    await expect(tableWrapper.locator('tbody tr')).toHaveCount(2)

    // 记录第1页第1行姓名
    const firstPage1stRowName = await tableWrapper.locator('tbody tr').first().locator('td').first().textContent()

    // "下一页"应可点击（共2页）
    const pagination = page.locator('.el-dialog .pagination')
    const nextBtn = pagination.locator('button').filter({ hasText: '下一页' })
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'docs/screenshots/table-e2e-10-page2.png' })

    // 第2页第1行姓名应与第1页不同
    const firstPage2ndRowName = await tableWrapper.locator('tbody tr').first().locator('td').first().textContent()
    expect(firstPage2ndRowName?.trim()).not.toBe(firstPage1stRowName?.trim())

    // 页码信息显示"第 2"
    await expect(pagination.locator('.page-info')).toContainText('第 2')
  })
})
