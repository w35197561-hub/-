import { useState, useEffect, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useHistoryStore } from '@/stores/historyStore'
import { PreviewProvider } from '@/context/PreviewContext'
import ComponentPanel from '../material/ComponentPanel'
import EditorCanvas from '../canvas/EditorCanvas'
import PropertyPanel from '../property/PropertyPanel'
import LivePreviewPanel from './LivePreviewPanel'
import AIPanel from './AIPanel'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { savePage, createPage, fetchPageList, fetchPage } from '@/services/api'
import type { PageListItem } from '@/services/api'
import styles from './Editor.module.css'

export default function Editor() {
  const currentPage = useEditorStore((s) => s.currentPage)
  const createNewPage = useEditorStore((s) => s.createNewPage)
  const loadPageData = useEditorStore((s) => s.loadPageData)
  const exportPageData = useEditorStore((s) => s.exportPageData)
  const clearPreviewState = useEditorStore((s) => s.clearPreviewState)
  const canUndo = useHistoryStore((s) => s.canUndo)
  const canRedo = useHistoryStore((s) => s.canRedo)
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)
  const toast = useToast()

  const [livePreviewVisible, setLivePreviewVisible] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [pageListVisible, setPageListVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pageList, setPageList] = useState<PageListItem[]>([])

  useEffect(() => {
    if (!livePreviewVisible) clearPreviewState()
  }, [livePreviewVisible, clearPreviewState])

  useEffect(() => {
    if (!currentPage) createNewPage()
  }, [])

  const handleExport = useCallback(() => {
    const pageData = exportPageData()
    if (pageData) {
      const blob = new Blob([pageData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentPage?.title || 'page'}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      toast.warning('没有页面数据可导出')
    }
  }, [exportPageData, currentPage, toast])

  const handleSave = useCallback(async () => {
    const page = currentPage
    if (!page) {
      toast.warning('当前没有可保存的页面')
      return
    }
    setIsSaving(true)
    try {
      const listRes = await fetchPageList().catch(() => [] as PageListItem[])
      const exists = listRes.some((p) => p.id === page.id)
      const saved = exists ? await savePage(page.id, page) : await createPage(page)
      toast.success(`页面「${saved.title}」保存成功`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [currentPage, toast])

  const handleOpenPageList = useCallback(async () => {
    try {
      const list = await fetchPageList()
      setPageList(list)
      setPageListVisible(true)
    } catch {
      toast.error('获取页面列表失败，请确认后端服务已启动')
    }
  }, [toast])

  const handleLoadPage = useCallback(
    async (item: PageListItem) => {
      if (!window.confirm(`加载页面「${item.title}」将替换当前画布内容，是否继续？`)) return
      try {
        const pageData = await fetchPage(item.id)
        loadPageData(pageData)
        setPageListVisible(false)
        toast.success(`页面「${pageData.title}」已加载`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '加载失败')
      }
    },
    [loadPageData, toast],
  )

  return (
    <PreviewProvider isPreview={false}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>可视化页面编辑器</h1>
            <span className={styles.pageTitle}>{currentPage?.title || '未命名页面'}</span>
          </div>

          <div className={styles.headerCenter}>
            <div className={styles.btnGroup}>
              <button
                className={styles.btn}
                data-testid="btn-undo"
                onClick={undo}
                disabled={!canUndo()}
              >
                {'← 撤销'}
              </button>
              <button
                className={styles.btn}
                data-testid="btn-redo"
                onClick={redo}
                disabled={!canRedo()}
              >
                {'重做 →'}
              </button>
            </div>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => setLivePreviewVisible(true)}
            >
              {'▶ 实时预览'}
            </button>
            <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={handleExport}>
              {'⬇ 导出JSON'}
            </button>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.btn} onClick={handleOpenPageList}>
              打开
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button className={styles.btn} onClick={() => createNewPage()}>
              新建页面
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <ComponentPanel />
          <EditorCanvas />
          <PropertyPanel />
        </div>

        <Modal
          open={livePreviewVisible}
          title="实时预览"
          width="90%"
          onClose={() => setLivePreviewVisible(false)}
        >
          <LivePreviewPanel />
        </Modal>

        <Modal
          open={pageListVisible}
          title="打开页面"
          width="600px"
          onClose={() => setPageListVisible(false)}
          footer={
            <button className={styles.btn} onClick={() => setPageListVisible(false)}>
              关闭
            </button>
          }
        >
          {pageList.length === 0 ? (
            <div className={styles.emptyState}>暂无已保存的页面</div>
          ) : (
            <table className={styles.pageTable}>
              <thead>
                <tr>
                  <th>页面名称</th>
                  <th>组件数</th>
                  <th>最后保存</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pageList.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td style={{ textAlign: 'center' }}>{row.componentCount}</td>
                    <td>{new Date(row.updatedAt).toLocaleString()}</td>
                    <td>
                      <button className={styles.linkBtn} onClick={() => handleLoadPage(row)}>
                        打开
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>

        <AIPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(!aiPanelOpen)} />
      </div>
    </PreviewProvider>
  )
}
