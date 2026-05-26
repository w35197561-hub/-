import { useState, useCallback } from 'react'
import { useIsPreview } from '@/context/PreviewContext'
import { useEditorStore } from '@/stores/editorStore'
import type { ComponentType } from '@/types'

export function useContainerDrop(containerId: string, getSlotKey: () => string) {
  const isPreview = useIsPreview()
  const addChildComponent = useEditorStore((s) => s.addChildComponent)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)

  const handleDragOver = useCallback(
    (slotKey: string, event: React.DragEvent) => {
      if (isPreview) return
      event.preventDefault()
      event.stopPropagation()
      setDragOverSlot(slotKey)
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    },
    [isPreview],
  )

  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null)
  }, [])

  const handleDrop = useCallback(
    (slotKey: string, event: React.DragEvent) => {
      if (isPreview) return
      event.stopPropagation()
      event.preventDefault()
      setDragOverSlot(null)
      if (!event.dataTransfer) return
      const componentType = event.dataTransfer.getData('componentType') as ComponentType
      if (!componentType) return
      addChildComponent(containerId, componentType, {}, slotKey)
    },
    [isPreview, addChildComponent, containerId],
  )

  const handleSingleDragOver = useCallback(
    (event: React.DragEvent) => {
      handleDragOver(getSlotKey(), event)
    },
    [handleDragOver, getSlotKey],
  )

  const handleSingleDrop = useCallback(
    (event: React.DragEvent) => {
      handleDrop(getSlotKey(), event)
    },
    [handleDrop, getSlotKey],
  )

  return {
    dragOverSlot,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSingleDragOver,
    handleSingleDrop,
  }
}
