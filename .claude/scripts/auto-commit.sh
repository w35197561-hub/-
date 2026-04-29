#!/bin/bash

# auto-commit.sh — 自动提交并推送到远端，同时记录 commit 日志
#
# 用法:
#   ./auto-commit.sh "<commit message>"               # 提交所有变更
#   ./auto-commit.sh "<commit message>" --staged-only  # 只提交暂存区
#   ./auto-commit.sh --log                             # 查看 commit 日志

set -e

# ── 颜色 ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 日志路径（存放在 .claude 目录下）────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$CLAUDE_DIR/commit.log"

# ── 查看日志模式 ───────────────────────────────────────────────
if [ "${1:-}" = "--log" ]; then
  if [ ! -f "$LOG_FILE" ]; then
    info "暂无 commit 日志"
  else
    cat "$LOG_FILE"
  fi
  exit 0
fi

# ── 参数检查 ──────────────────────────────────────────────────
if [ $# -eq 0 ]; then
  error "请提供 commit message\n用法: $0 \"<commit message>\" [--staged-only]\n      $0 --log  # 查看日志"
fi

COMMIT_MSG="$1"
STAGED_ONLY=false
[ "${2:-}" = "--staged-only" ] && STAGED_ONLY=true

# ── 基础检查 ──────────────────────────────────────────────────
git rev-parse --git-dir > /dev/null 2>&1 || error "当前目录不是 Git 仓库"

BRANCH=$(git branch --show-current)
info "当前分支: $BRANCH"

# ── 检查是否有变更 ─────────────────────────────────────────────
HAS_STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
HAS_UNSTAGED=$(git diff --name-only | wc -l | tr -d ' ')
HAS_UNTRACKED=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')

if [ "$HAS_STAGED" -eq 0 ] && [ "$HAS_UNSTAGED" -eq 0 ] && [ "$HAS_UNTRACKED" -eq 0 ]; then
  warning "没有任何变更可提交"
  exit 0
fi

# ── git add ───────────────────────────────────────────────────
if [ "$STAGED_ONLY" = false ]; then
  info "暂存所有变更 (git add -A)..."
  git add -A
  info "已暂存文件:"
  git diff --cached --name-status | sed 's/^/  /'
else
  [ "$HAS_STAGED" -eq 0 ] && error "暂存区为空，请先执行 git add 或去掉 --staged-only 参数"
  info "使用暂存区现有变更:"
  git diff --cached --name-status | sed 's/^/  /'
fi

# ── commit message 格式校验 ────────────────────────────────────
CONVENTIONAL_PATTERN='^(feat|fix|refactor|style|perf|chore|docs|test)(\(.+\))?: .+'
if ! echo "$COMMIT_MSG" | grep -qE "$CONVENTIONAL_PATTERN"; then
  warning "commit message 不符合 Conventional Commits 规范，建议格式："
  warning "  <type>(<scope>): <subject>"
  warning "  例如: feat(components): 新增 SelectComponent"
  warning "继续提交中..."
fi

# ── git commit ────────────────────────────────────────────────
info "提交: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

COMMIT_HASH=$(git rev-parse --short HEAD)
FILE_COUNT=$(git diff HEAD~1 --name-only | wc -l | tr -d ' ')
CHANGED_FILES=$(git diff HEAD~1 --name-status | sed 's/^/  /')

# ── git push ──────────────────────────────────────────────────
REMOTE_EXISTS=$(git ls-remote --heads origin "$BRANCH" | wc -l | tr -d ' ')
if [ "$REMOTE_EXISTS" -eq 0 ]; then
  info "远端不存在分支 $BRANCH，首次推送..."
  git push -u origin "$BRANCH"
else
  info "推送到 origin/$BRANCH..."
  git push origin "$BRANCH"
fi

# ── 写入 commit 日志 ───────────────────────────────────────────
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
{
  echo "[$TIMESTAMP]"
  echo "分支:   $BRANCH"
  echo "Hash:   $COMMIT_HASH"
  echo "消息:   $COMMIT_MSG"
  echo "文件:   $FILE_COUNT 个"
  echo "$CHANGED_FILES"
  printf '%.0s─' {1..50}
  echo
} >> "$LOG_FILE"

info "日志已追加到 $(realpath --relative-to="$(pwd)" "$LOG_FILE" 2>/dev/null || echo "$LOG_FILE")"

# ── 完成 ──────────────────────────────────────────────────────
success "提交成功！"
info "分支:  $BRANCH"
info "Hash:  $COMMIT_HASH"
info "消息:  $COMMIT_MSG"
info "文件:  $FILE_COUNT 个"
