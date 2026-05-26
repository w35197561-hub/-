import { create } from 'zustand'
import type { Command } from '@/types'

interface HistoryState {
  undoStack: Command[]
  redoStack: Command[]
  maxHistorySize: number
  canUndo: () => boolean
  canRedo: () => boolean
  executeCommand: (command: Command) => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  executeCommand: (command) => {
    command.execute()
    set((state) => {
      const newStack = [...state.undoStack, command]
      if (newStack.length > state.maxHistorySize) newStack.shift()
      return { undoStack: newStack, redoStack: [] }
    })
  },

  undo: () => {
    const { undoStack, redoStack } = get()
    if (!undoStack.length) return
    const command = undoStack[undoStack.length - 1]!
    command.undo()
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, command],
    })
  },

  redo: () => {
    const { undoStack, redoStack } = get()
    if (!redoStack.length) return
    const command = redoStack[redoStack.length - 1]!
    command.execute()
    set({
      undoStack: [...undoStack, command],
      redoStack: redoStack.slice(0, -1),
    })
  },

  clearHistory: () => set({ undoStack: [], redoStack: [] }),
}))
