#!/usr/bin/env node
/**
 * 根据 commit subject 自动更新 CHANGELOG.md。
 * 由 .git/hooks/commit-msg 调用，传入 commit subject 作为 argv[2]。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')
const changelogPath = join(root, 'CHANGELOG.md')

const subject = process.argv[2]?.trim()
if (!subject) {
  console.error('Usage: node update-changelog.mjs "<commit subject>"')
  process.exit(1)
}

// 跳过 merge commit 和仅修改 CHANGELOG 的 commit
if (/^Merge\b/i.test(subject) || subject.toLowerCase().includes('changelog')) {
  process.exit(0)
}

const today = new Date().toISOString().slice(0, 10)
const todayHeader = `## ${today}`
const newEntry = `\n\n### ${subject}\n`

let content = existsSync(changelogPath)
  ? readFileSync(changelogPath, 'utf-8')
  : '# Changelog\n\n记录每次提交的变更内容与原因。\n\n---\n\n'

// 已存在相同 subject 则跳过（防止 --amend 重复写入）
if (content.includes(`### ${subject}`)) {
  process.exit(0)
}

if (content.includes(todayHeader)) {
  content = content.replace(todayHeader, todayHeader + newEntry)
} else {
  content = content.replace('---\n', `---\n\n${todayHeader}\n${newEntry}`)
}

writeFileSync(changelogPath, content, 'utf-8')
console.log(`✅ CHANGELOG.md 已更新：[${today}] ${subject}`)
