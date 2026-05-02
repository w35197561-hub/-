<template>
  <div class="page-editor-container">
    <div class="editor-header">
      <div class="header-left">
        <h1>可视化页面编辑器</h1>
        <span class="page-title">{{ currentPage?.title || '未命名页面' }}</span>
      </div>
      
      <div class="header-center">
        <el-button-group>
          <el-button data-testid="btn-undo" @click="handleUndo" :disabled="!canUndo">
            <el-icon><RefreshLeft /></el-icon>
            撤销
          </el-button>
          <el-button data-testid="btn-redo" @click="handleRedo" :disabled="!canRedo">
            <el-icon><RefreshRight /></el-icon>
            重做
          </el-button>
        </el-button-group>
        
        <el-button @click="livePreviewVisible = true" type="primary">
          <el-icon><Monitor /></el-icon>
          实时预览
        </el-button>
        
        <el-button @click="handleExport" type="success">
          <el-icon><Download /></el-icon>
          导出JSON
        </el-button>
      </div>
      
      <div class="header-right">
        <el-button @click="handleOpenPageList">
          <el-icon><FolderOpened /></el-icon>
          打开
        </el-button>
        <el-button @click="handleSave" :loading="isSaving" type="primary">
          <el-icon><Document /></el-icon>
          保存
        </el-button>
        <el-button @click="handleNewPage">
          <el-icon><Plus /></el-icon>
          新建页面
        </el-button>
      </div>
    </div>
    
    <div class="editor-body">
      <ComponentPanel />
      <EditorCanvas />
      <PropertyPanel />
    </div>
    
    <!-- 实时预览弹窗 -->
    <el-dialog
      v-model="livePreviewVisible"
      title="实时预览"
      width="90%"
      top="4vh"
    >
      <LivePreviewPanel />
    </el-dialog>

    <!-- 页面列表弹窗 -->
    <el-dialog
      v-model="pageListVisible"
      title="打开页面"
      width="600px"
    >
      <div v-if="pageList.length === 0" class="page-list-empty">
        <el-empty description="暂无已保存的页面" />
      </div>
      <el-table v-else :data="pageList" style="width: 100%" highlight-current-row>
        <el-table-column prop="title" label="页面名称" min-width="150" />
        <el-table-column prop="componentCount" label="组件数" width="80" align="center" />
        <el-table-column label="最后保存" width="170">
          <template #default="{ row }">
            {{ new Date(row.updatedAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleLoadPage(row)">打开</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="pageListVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- AI 助手面板 -->
    <AIPanel v-model="aiPanelVisible" />
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line vue/multi-word-component-names
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import ComponentPanel from '../material/ComponentPanel.vue'
import EditorCanvas from '../canvas/EditorCanvas.vue'
import PropertyPanel from '../property/PropertyPanel.vue'
import LivePreviewPanel from './LivePreviewPanel.vue'
import AIPanel from './AIPanel.vue'
import {
  RefreshLeft,
  RefreshRight,
  Monitor,
  Download,
  Document,
  Plus,
  FolderOpened
} from '@element-plus/icons-vue'
import { savePage, createPage, fetchPageList, fetchPage } from '@/services/api'
import type { PageListItem } from '@/services/api'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()


const pageListVisible = ref(false)
const livePreviewVisible = ref(false)
const aiPanelVisible = ref(false)
const isSaving = ref(false)
const pageList = ref<PageListItem[]>([])

const currentPage = computed(() => editorStore.currentPage)
const canUndo = computed(() => historyStore.canUndo())
const canRedo = computed(() => historyStore.canRedo())

const handleUndo = () => {
  historyStore.undo()
}

const handleRedo = () => {
  historyStore.redo()
}

const handleExport = () => {
  const pageData = editorStore.exportPageData()
  if (pageData) {
    const blob = new Blob([pageData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentPage.value?.title || 'page'}.json`
    a.click()
    URL.revokeObjectURL(url)
  } else {
    ElMessage.warning('没有页面数据可导出')
  }
}

/** 保存当前页面到后端 */
const handleSave = async () => {
  const page = currentPage.value
  if (!page) {
    ElMessage.warning('当前没有可保存的页面')
    return
  }

  isSaving.value = true
  try {
    // 判断是新建还是更新：若后端已有此 id 则 PUT，否则 POST
    let saved
    const listRes = await fetchPageList().catch(() => [] as PageListItem[])
    const exists = listRes.some((p) => p.id === page.id)

    if (exists) {
      saved = await savePage(page.id, page)
    } else {
      saved = await createPage(page)
    }

    ElMessage.success(`页面「${saved.title}」保存成功`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败'
    ElMessage.error(msg)
  } finally {
    isSaving.value = false
  }
}

/** 新建页面 */
const handleNewPage = () => {
  editorStore.createNewPage()
}

/** 打开页面列表 */
const handleOpenPageList = async () => {
  try {
    pageList.value = await fetchPageList()
    pageListVisible.value = true
  } catch {
    ElMessage.error('获取页面列表失败，请确认后端服务已启动')
  }
}

/** 加载选中的页面 */
const handleLoadPage = async (item: PageListItem) => {
  try {
    await ElMessageBox.confirm(
      `加载页面「${item.title}」将替换当前画布内容，是否继续？`,
      '加载页面',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )

    const pageData = await fetchPage(item.id)
    // 将后端数据写入 store
    editorStore.loadPageData(pageData)
    pageListVisible.value = false
    ElMessage.success(`页面「${pageData.title}」已加载`)
  } catch (e) {
    // 用户取消不报错
    if (e !== 'cancel') {
      const msg = e instanceof Error ? e.message : '加载失败'
      ElMessage.error(msg)
    }
  }
}

// 初始化：若无当前页面则创建一个默认页面
onMounted(() => {
  if (!currentPage.value) {
    editorStore.createNewPage()
  }
})
</script>

<style scoped>
.page-editor-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.editor-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.page-title {
  color: #666;
  font-size: 14px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

</style>