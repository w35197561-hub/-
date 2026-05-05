#!/usr/bin/env node
/**
 * 读取 Playwright JSON 报告，将结果追加到 docs/test-log.md。
 * 失败时：复制截图到 docs/screenshots/ 并嵌入 markdown 图片。
 * 用法：node scripts/e2e-log.mjs
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const reportPath = join(root, 'playwright-report', 'results.json')
const logPath = join(root, 'docs', 'test-log.md')
const screenshotsDir = join(root, 'docs', 'screenshots')

if (!existsSync(reportPath)) {
  console.error('找不到测试报告：playwright-report/results.json，请先跑 npm run test:e2e')
  process.exit(1)
}

const report = JSON.parse(readFileSync(reportPath, 'utf-8'))
const now = new Date()
const stamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
].join('') + '_' + [
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
].join('')
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

let passed = 0
let failed = 0
const failures = []
let screenshotIndex = 0

const stripAnsi = (str) => str.replace(/\u001B\[[0-9;]*m/g, '')

function collectSpecs(suites, describeChain = []) {
  for (const suite of suites ?? []) {
    const chain = suite.title ? [...describeChain, suite.title] : describeChain
    for (const spec of suite.specs ?? []) {
      const failedResults = spec.tests?.flatMap(t => t.results ?? []).filter(r => r.status === 'failed')
      if (!failedResults || failedResults.length === 0) {
        passed++
      } else {
        failed++

        // 复制截图到 docs/screenshots/
        const screenshots = []
        for (const r of failedResults) {
          for (const att of r.attachments ?? []) {
            if (att.name === 'screenshot' && att.path && existsSync(att.path)) {
              mkdirSync(screenshotsDir, { recursive: true })
              const filename = `${stamp}_${++screenshotIndex}.png`
              copyFileSync(att.path, join(screenshotsDir, filename))
              screenshots.push(`./screenshots/${filename}`)
            }
          }
        }

        failures.push({
          describe: chain.join(' > '),
          title: spec.title,
          file: spec.file,
          line: spec.line,
          screenshots,
          errors: failedResults.map(r => {
            const msg = stripAnsi(r.error?.message ?? '未知错误')
            const stack = r.error?.stack
              ?.split('\n')
              .find(l => l.includes(spec.file))
              ?.trim()
            return { msg, stack }
          }),
        })
      }
    }
    collectSpecs(suite.suites, chain)
  }
}

collectSpecs(report.suites)

const total = passed + failed
const status = failed === 0 ? '✅' : '❌'
let entry = `## ${date}  ${status} E2E  ${failed === 0 ? `${passed}/${total} 通过` : `${failed}/${total} 失败`}\n\n`

if (failed === 0) {
  entry += `> 全部 ${total} 个用例通过。\n\n---\n\n`
  const existing = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '# 测试记录\n\n'
  const insertAt = existing.indexOf('\n\n') + 2
  writeFileSync(logPath, existing.slice(0, insertAt) + entry + existing.slice(insertAt))
  console.log(`✅ E2E 全部通过 (${passed}/${total})，已写入 docs/test-log.md`)
  process.exit(0)
}

for (const f of failures) {
  entry += `### ${f.describe} > ${f.title}\n`
  entry += `> 文件：\`${f.file}:${f.line}\`\n\n`
  for (const e of f.errors) {
    entry += `**错误信息：**\n\`\`\`\n${e.msg}\n\`\`\`\n`
    if (e.stack) entry += `**位置：** \`${e.stack}\`\n`
  }
  for (const s of f.screenshots) {
    entry += `\n![失败截图](${s})\n`
  }
  entry += '\n'
}

entry += '---\n\n'

const existing = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '# 测试记录\n\n'
const insertAt = existing.indexOf('\n\n') + 2
writeFileSync(logPath, existing.slice(0, insertAt) + entry + existing.slice(insertAt))
console.log(`❌ E2E ${failed}/${total} 失败，截图已保存至 docs/screenshots/，已写入 docs/test-log.md`)
