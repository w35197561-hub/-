#!/usr/bin/env node
/**
 * 读取 Playwright JSON 报告，将失败记录追加到 docs/test-log.md
 * 全部通过时只打印一行，不写文件
 * 用法：node scripts/e2e-log.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const reportPath = join(root, 'playwright-report', 'results.json')
const logPath = join(root, 'docs', 'test-log.md')

if (!existsSync(reportPath)) {
  console.error('找不到测试报告：playwright-report/results.json，请先跑 npm run test:e2e')
  process.exit(1)
}

const report = JSON.parse(readFileSync(reportPath, 'utf-8'))
const date = new Date().toISOString().slice(0, 16).replace('T', ' ')

let passed = 0
let failed = 0
const failures = []

function collectSpecs(suites, describeChain = []) {
  for (const suite of suites ?? []) {
    const chain = suite.title ? [...describeChain, suite.title] : describeChain
    for (const spec of suite.specs ?? []) {
      const failedResults = spec.tests?.flatMap(t => t.results ?? []).filter(r => r.status === 'failed')
      if (!failedResults || failedResults.length === 0) {
        passed++
      } else {
        failed++
        failures.push({
          describe: chain.join(' > '),
          title: spec.title,
          file: spec.file,
          line: spec.line,
          errors: failedResults.map(r => {
            const msg = r.error?.message ?? '未知错误'
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

if (failed === 0) {
  console.log(`✅ 全部通过 (${passed}/${total})，无失败记录，不写入 test-log.md`)
  process.exit(0)
}

// 只在有失败时写入
let entry = `## ${date}  ❌ ${failed}/${total} 失败\n\n`

for (const f of failures) {
  entry += `### ${f.describe} > ${f.title}\n`
  entry += `> 文件：\`${f.file}:${f.line}\`\n\n`
  for (const e of f.errors) {
    entry += `**错误信息：**\n\`\`\`\n${e.msg}\n\`\`\`\n`
    if (e.stack) {
      entry += `**位置：** \`${e.stack}\`\n`
    }
    entry += '\n'
  }
}

entry += '---\n\n'

const existing = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '# E2E 测试记录\n\n'
const insertAt = existing.indexOf('\n\n') + 2
const updated = existing.slice(0, insertAt) + entry + existing.slice(insertAt)

writeFileSync(logPath, updated)
console.log(`❌ ${failed}/${total} 失败，已写入 docs/test-log.md`)
