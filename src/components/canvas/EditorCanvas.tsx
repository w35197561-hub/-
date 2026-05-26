import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import type { ComponentData } from '@/types'
import { ComponentType } from '@/types'
import ComponentRenderer from './components/ComponentRenderer'
import styles from './EditorCanvas.module.css'

export default function EditorCanvas() {
  const currentPage = useEditorStore((s) => s.currentPage)
  const currentComponent = useEditorStore((s) => s.currentComponent)
  const canvasScale = useEditorStore((s) => s.canvasScale)
  const selectComponent = useEditorStore((s) => s.selectComponent)
  const clearSelectedComponents = useEditorStore((s) => s.clearSelectedComponents)
  const setCanvasScale = useEditorStore((s) => s.setCanvasScale)
  const addComponent = useEditorStore((s) => s.addComponent)
  const reorderComponent = useEditorStore((s) => s.reorderComponent)
  const createNewPage = useEditorStore((s) => s.createNewPage)

  // Resize state refs
  const isResizingRef = useRef(false)
  const resizeDirectionRef = useRef('')
  const resizeStartXRef = useRef(0)
  const resizeStartYRef = useRef(0)
  const originalWidthRef = useRef(0)
  const originalHeightRef = useRef(0)
  const resizeStartStyleRef = useRef<ComponentData['style'] | null>(null)
  const resizeComponentIdRef = useRef<string | null>(null)

  // Drag-to-reorder state
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const draggingIdRef = useRef<string | null>(null)

  // Resize handlers (only width/height, no top/left)
  const handleResize = useCallback((event: MouseEvent) => {
    const state = useEditorStore.getState()
    const compId = resizeComponentIdRef.current
    if (!isResizingRef.current || !compId) return

    const deltaX = (event.clientX - resizeStartXRef.current) / state.canvasScale
    const deltaY = (event.clientY - resizeStartYRef.current) / state.canvasScale
    const dir = resizeDirectionRef.current

    let newWidth = originalWidthRef.current
    let newHeight = originalHeightRef.current

    if (dir.includes('r')) newWidth = Math.max(20, originalWidthRef.current + deltaX)
    if (dir.includes('b')) newHeight = Math.max(20, originalHeightRef.current + deltaY)

    state.updateComponentStyleSilent(compId, { width: newWidth, height: newHeight })
  }, [])

  const stopResize = useCallback(() => {
    const state = useEditorStore.getState()
    const compId = resizeComponentIdRef.current
    if (isResizingRef.current && compId && resizeStartStyleRef.current) {
      const comp = state.getComponentById(compId)
      if (comp) {
        const hasChanged =
          comp.style.width !== resizeStartStyleRef.current.width ||
          comp.style.height !== resizeStartStyleRef.current.height
        if (hasChanged) {
          state.batchUpdateComponentStyle(compId, resizeStartStyleRef.current, {
            width: comp.style.width,
            height: comp.style.height,
          })
        }
      }
    }
    isResizingRef.current = false
    resizeStartStyleRef.current = null
    resizeComponentIdRef.current = null
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
  }, [handleResize])

  const startResize = useCallback(
    (component: ComponentData, direction: string, event: React.MouseEvent) => {
      isResizingRef.current = true
      resizeDirectionRef.current = direction
      resizeComponentIdRef.current = component.id
      resizeStartXRef.current = event.clientX
      resizeStartYRef.current = event.clientY
      originalWidthRef.current = component.style.width
      originalHeightRef.current = component.style.height
      resizeStartStyleRef.current = { ...component.style }

      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', stopResize)
      event.preventDefault()
      event.stopPropagation()
    },
    [handleResize, stopResize],
  )

  const handleComponentClick = useCallback(
    (component: ComponentData, event: React.MouseEvent) => {
      selectComponent(component.id, event.shiftKey)
      event.stopPropagation()
    },
    [selectComponent],
  )

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        clearSelectedComponents()
      }
    },
    [clearSelectedComponents],
  )

  // Drop from material panel
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      if (!event.dataTransfer || !currentPage) return
      const componentType = event.dataTransfer.getData('componentType') as ComponentType
      if (!componentType) return
      // Flow layout: just append, no position needed
      addComponent(componentType)
      setDragOverIndex(null)
    },
    [currentPage, addComponent],
  )

  // Drag-to-reorder handlers
  const handleReorderDragStart = useCallback((componentId: string, event: React.DragEvent) => {
    draggingIdRef.current = componentId
    event.dataTransfer.setData('reorderId', componentId)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleReorderDragOver = useCallback((index: number, event: React.DragEvent) => {
    event.preventDefault()
    // Only show indicator for reorder (not material panel drops)
    if (draggingIdRef.current) {
      event.dataTransfer.dropEffect = 'move'
      setDragOverIndex(index)
    }
  }, [])

  const handleReorderDrop = useCallback(
    (targetIndex: number, event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const sourceId = draggingIdRef.current
      if (sourceId) {
        reorderComponent(sourceId, targetIndex)
      }
      draggingIdRef.current = null
      setDragOverIndex(null)
    },
    [reorderComponent],
  )

  const handleReorderDragEnd = useCallback(() => {
    draggingIdRef.current = null
    setDragOverIndex(null)
  }, [])

  useEffect(() => {
    if (!currentPage) createNewPage()
  }, [])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
    }
  }, [handleResize, stopResize])

  const resizeHandles = ['r', 'b', 'br'] as const

  return (
    <div className={styles.editorCanvas}>
      <div className={styles.canvasToolbar}>
        <div className={styles.btnGroup}>
          <button
            className={styles.toolBtn}
            onClick={() => setCanvasScale(Math.max(canvasScale - 0.1, 0.5))}
            disabled={canvasScale <= 0.5}
          >
            -
          </button>
          <button className={styles.toolBtn}>{Math.round(canvasScale * 100)}%</button>
          <button
            className={styles.toolBtn}
            onClick={() => setCanvasScale(Math.min(canvasScale + 0.1, 2))}
            disabled={canvasScale >= 2}
          >
            +
          </button>
          <button className={styles.toolBtn} onClick={() => setCanvasScale(1)}>
            1:1
          </button>
        </div>
      </div>

      <div
        className={styles.canvasContainer}
        style={{ transform: `scale(${canvasScale})`, transformOrigin: 'center top' }}
        onMouseDown={handleCanvasClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className={styles.canvasBackground}
          data-testid="canvas-background"
          style={{ backgroundColor: currentPage?.style.backgroundColor || '#ffffff' }}
        >
          {currentPage?.components.map((component, index) => (
            <div
              key={component.id}
              className={`${styles.componentWrapper} ${currentComponent?.id === component.id ? styles.selected : ''} ${dragOverIndex === index ? styles.dragOverIndicator : ''}`}
              data-testid="component-wrapper"
              draggable
              style={{
                width: `${component.style.width}px`,
                height: `${component.style.height}px`,
              }}
              onClick={(e) => handleComponentClick(component, e)}
              onDragStart={(e) => handleReorderDragStart(component.id, e)}
              onDragOver={(e) => handleReorderDragOver(index, e)}
              onDrop={(e) => handleReorderDrop(index, e)}
              onDragEnd={handleReorderDragEnd}
              onDragLeave={() => {
                if (draggingIdRef.current) setDragOverIndex(null)
              }}
            >
              <ComponentRenderer component={component} />

              {currentComponent?.id === component.id && (
                <div className={styles.resizeHandles}>
                  {resizeHandles.map((dir) => (
                    <div
                      key={dir}
                      className={`${styles.handle} ${styles[`handle_${dir}`]}`}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        startResize(component, dir, e)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {currentPage?.components.length === 0 && (
            <div className={styles.emptyHint}>
              <span style={{ fontSize: 36, color: '#ddd' }}>{'\u2b07'}</span>
              <p>
                {
                  '\u4ece\u5de6\u4fa7\u62d6\u5165\u7ec4\u4ef6\uff0c\u6216\u4f7f\u7528 AI \u52a9\u624b\u751f\u6210\u9875\u9762'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
