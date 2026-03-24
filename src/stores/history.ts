import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Command } from '@/types'

export const useHistoryStore = defineStore('history', () => {
  const undoStack = ref<Command[]>([])
  const redoStack = ref<Command[]>([])
  const maxHistorySize = ref(50)

  const canUndo = () => undoStack.value.length > 0
  const canRedo = () => redoStack.value.length > 0

  const executeCommand = (command: Command) => {
    command.execute()
    undoStack.value.push(command)
    
    if (undoStack.value.length > maxHistorySize.value) {
      undoStack.value.shift()
    }
    
    redoStack.value.length = 0
  }

  const undo = () => {
    if (!canUndo()) return
    
    const command = undoStack.value.pop()
    if (command) {
      command.undo()
      redoStack.value.push(command)
    }
  }

  const redo = () => {
    if (!canRedo()) return
    
    const command = redoStack.value.pop()
    if (command) {
      command.execute()
      undoStack.value.push(command)
    }
  }

  const clearHistory = () => {
    undoStack.value.length = 0
    redoStack.value.length = 0
  }

  return {
    undoStack: undoStack,
    redoStack: redoStack,
    maxHistorySize: maxHistorySize,
    canUndo,
    canRedo,
    executeCommand,
    undo,
    redo,
    clearHistory
  }
})