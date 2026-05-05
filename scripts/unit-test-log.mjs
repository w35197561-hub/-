#!/usr/bin/env node
/**
 * 读取 Vitest JSON 报告，将结果追加到 docs/test-log.md。
 * 用法：node scripts/unit-test-log.mjs
 * 前置：vitest run --reporter=verbose --reporter=json --outputFile=vitest-report/results.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const reportPath = join(root, 'vitest-report', 'results.json')
const logPath = join(root, 'docs', 'test-log.md')

if (!existsSync(reportPath)) {
  console.error('找不到测试报告：vitest-report/results.json，请先跑 npm run test:log')
  process.exit(1)
}

const report = JSON.parse(readFileSync(reportPath, 'utf-8'))
const now = new Date()
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

const passed = report.numPassedTests ?? 0
const failed = report.numFailedTests ?? 0
const total = passed + failed

const status = failed === 0 ? '✅' : '❌'
let entry = `## ${date}  ${status} 单测  ${failed === 0 ? `${passed}/${total} 通过` : `${failed}/${total} 失败`}\n\n`

if (failed > 0) {
  // eslint-disable-next-line no-control-regex
  const stripAnsi = (str) => str.replace(/\u001B\[[0-9;]*m/g, '')
  for (const suite of report.testResults ?? []) {
    for (const test of suite.testResults ?? []) {
      if (test.status === 'failed') {
        const ancestors = test.ancestorTitles?.join(' > ')
        const name = [ancestors, test.title].filter(Boolean).join(' > ')
        entry += `### ${name}\n`
        if (test.failureMessages?.length) {
          const msg = stripAnsi(test.failureMessages[0]).split('\n').slice(0, 15).join('\n')
          entry += `\`\`\`\n${msg}\n\`\`\`\n\n`
        }
      }
    }
  }
}

entry += '---\n\n'

const existing = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '# 测试记录\n\n'
const insertAt = existing.indexOf('\n\n') + 2
writeFileSync(logPath, existing.slice(0, insertAt) + entry + existing.slice(insertAt))
console.log(`${status} 单测 ${failed === 0 ? `全部通过 (${passed}/${total})` : `${failed}/${total} 失败`}，已写入 docs/test-log.md`)
