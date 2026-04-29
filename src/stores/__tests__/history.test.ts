import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHistoryStore } from '../history'
import type { Command } from '@/types'

// ── 测试工具：创建一个可追踪执行次数的 mock command ────────────
function createMockCommand(onExecute?: () => void, onUndo?: () => void): Command {
  return {
    execute: onExecute ?? (() => {}),
    undo: onUndo ?? (() => {}),
  }
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── executeCommand ────────────────────────────────────────────
  describe('executeCommand', () => {
    it('执行命令后 undoStack 增加一条，redoStack 清空', () => {
      const store = useHistoryStore()
      let count = 0
      const cmd = createMockCommand(() => { count++ })

      store.executeCommand(cmd)

      expect(count).toBe(1)
      expect(store.undoStack.length).toBe(1)
      expect(store.redoStack.length).toBe(0)
    })

    it('执行新命令后 redoStack 被清空', () => {
      const store = useHistoryStore()
      const cmd1 = createMockCommand()
      const cmd2 = createMockCommand()

      store.executeCommand(cmd1)
      store.undo()                  // 产生一条 redo 记录
      expect(store.redoStack.length).toBe(1)

      store.executeCommand(cmd2)    // 新命令应清空 redo
      expect(store.redoStack.length).toBe(0)
    })

    it('超过 maxHistorySize 时最旧的命令被丢弃', () => {
      const store = useHistoryStore()
      // maxHistorySize 是 ref，通过 $patch 修改内部状态
      store.$patch({ maxHistorySize: 3 })

      for (let i = 0; i < 4; i++) {
        store.executeCommand(createMockCommand())
      }

      expect(store.undoStack.length).toBe(3)
    })
  })

  // ── undo ─────────────────────────────────────────────────────
  describe('undo', () => {
    it('undo 调用最后一条命令的 undo 方法，并移入 redoStack', () => {
      const store = useHistoryStore()
      let undoCalled = false
      const cmd = createMockCommand(undefined, () => { undoCalled = true })

      store.executeCommand(cmd)
      store.undo()

      expect(undoCalled).toBe(true)
      expect(store.undoStack.length).toBe(0)
      expect(store.redoStack.length).toBe(1)
    })

    it('undoStack 为空时 undo 不报错', () => {
      const store = useHistoryStore()
      expect(() => store.undo()).not.toThrow()
    })

    it('canUndo 在有记录时为 true，无记录时为 false', () => {
      const store = useHistoryStore()
      expect(store.canUndo()).toBe(false)

      store.executeCommand(createMockCommand())
      expect(store.canUndo()).toBe(true)

      store.undo()
      expect(store.canUndo()).toBe(false)
    })
  })

  // ── redo ─────────────────────────────────────────────────────
  describe('redo', () => {
    it('redo 重新执行命令，并移回 undoStack', () => {
      const store = useHistoryStore()
      let execCount = 0
      const cmd = createMockCommand(() => { execCount++ })

      store.executeCommand(cmd)   // execCount = 1
      store.undo()
      store.redo()                // execCount = 2

      expect(execCount).toBe(2)
      expect(store.undoStack.length).toBe(1)
      expect(store.redoStack.length).toBe(0)
    })

    it('redoStack 为空时 redo 不报错', () => {
      const store = useHistoryStore()
      expect(() => store.redo()).not.toThrow()
    })

    it('canRedo 在 undo 后为 true，redo 后为 false', () => {
      const store = useHistoryStore()
      store.executeCommand(createMockCommand())
      expect(store.canRedo()).toBe(false)

      store.undo()
      expect(store.canRedo()).toBe(true)

      store.redo()
      expect(store.canRedo()).toBe(false)
    })
  })

  // ── clearHistory ──────────────────────────────────────────────
  describe('clearHistory', () => {
    it('clearHistory 清空 undo 和 redo 栈', () => {
      const store = useHistoryStore()
      store.executeCommand(createMockCommand())
      store.executeCommand(createMockCommand())
      store.undo()

      store.clearHistory()

      expect(store.undoStack.length).toBe(0)
      expect(store.redoStack.length).toBe(0)
    })
  })

  // ── 复合场景 ──────────────────────────────────────────────────
  describe('复合场景', () => {
    it('多次 undo/redo 顺序正确', () => {
      const store = useHistoryStore()
      const log: string[] = []

      const cmd1 = createMockCommand(
        () => log.push('exec-1'),
        () => log.push('undo-1'),
      )
      const cmd2 = createMockCommand(
        () => log.push('exec-2'),
        () => log.push('undo-2'),
      )

      store.executeCommand(cmd1)   // exec-1
      store.executeCommand(cmd2)   // exec-2
      store.undo()                 // undo-2
      store.undo()                 // undo-1
      store.redo()                 // exec-1
      store.redo()                 // exec-2

      expect(log).toEqual(['exec-1', 'exec-2', 'undo-2', 'undo-1', 'exec-1', 'exec-2'])
    })
  })
})
