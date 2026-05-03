<template>
  <div class="property-panel">
    <!-- 图层列表面板（始终显示在顶部） -->
    <LayerPanel />
    <div class="panel-header">
      <h3>属性配置</h3>
      <el-button 
        v-if="currentComponent" 
        type="danger" 
        size="small" 
        @click="deleteCurrentComponent"
      >
        删除组件
      </el-button>
    </div>
    
    <div v-if="!currentComponent" class="empty-state">
      <el-icon><InfoFilled /></el-icon>
      <p>请选择要配置的组件</p>
    </div>
    
    <div v-else class="property-content">
      <el-scrollbar>
        <div class="property-section">
          <h4>位置和大小</h4>
          <div class="property-grid">
            <div class="property-item">
              <label>X坐标</label>
              <el-input-number
                v-model="currentComponent.style.left"
                :min="0"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>Y坐标</label>
              <el-input-number
                v-model="currentComponent.style.top"
                :min="0"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>宽度</label>
              <el-input-number
                v-model="currentComponent.style.width"
                :min="20"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>高度</label>
              <el-input-number
                v-model="currentComponent.style.height"
                :min="20"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>旋转角度</label>
              <el-input-number
                v-model="currentComponent.style.rotate"
                :min="-180"
                :max="180"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>图层顺序</label>
              <el-input-number
                v-model="currentComponent.style.zIndex"
                :min="1"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
          </div>
        </div>
        
        <div class="property-section">
          <h4>图层管理</h4>
          <!-- 当前 z-index 信息展示 -->
          <div class="zindex-info">
            <span class="zindex-label">当前层级</span>
            <div class="zindex-badge-row">
              <span class="zindex-badge">{{ currentComponent.style.zIndex }}</span>
              <span class="zindex-range-tip">（共 {{ totalLayers }} 层）</span>
            </div>
          </div>
          <!-- 快速操作按钮 -->
          <div class="property-buttons">
            <div class="layer-btn-grid">
              <el-button size="small" @click="moveLayer('top')" :disabled="isOnTop">
                <el-icon><DArrowRight style="transform: rotate(-90deg)" /></el-icon>
                置顶
              </el-button>
              <el-button size="small" @click="moveLayer('up')" :disabled="isOnTop">
                <el-icon><ArrowUp /></el-icon>
                上移一层
              </el-button>
              <el-button size="small" @click="moveLayer('down')" :disabled="isOnBottom">
                <el-icon><ArrowDown /></el-icon>
                下移一层
              </el-button>
              <el-button size="small" @click="moveLayer('bottom')" :disabled="isOnBottom">
                <el-icon><DArrowRight style="transform: rotate(90deg)" /></el-icon>
                置底
              </el-button>
            </div>
          </div>
          <!-- 直接输入 z-index -->
          <div class="zindex-input-row">
            <label>精确设置层级</label>
            <el-input-number
              v-model="customZIndex"
              :min="1"
              :max="999"
              :step="1"
              size="small"
              @change="applyCustomZIndex"
            />
          </div>
          <!-- 归一化按钮 -->
          <el-button
            size="small"
            type="info"
            plain
            class="normalize-btn"
            @click="normalizeAllLayers"
            title="将所有组件的层级整理为连续整数，消除层级混乱"
          >
            整理层级
          </el-button>
        </div>
        
        <div class="property-section">
          <h4>样式设置</h4>
          <div class="property-grid">
            <div class="property-item">
              <label>字体大小</label>
              <el-input-number
                v-model="currentComponent.style.fontSize"
                :min="8"
                :max="72"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>字体颜色</label>
              <el-color-picker
                v-model="currentComponent.style.color"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>背景颜色</label>
              <el-color-picker
                v-model="currentComponent.style.backgroundColor"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>边框宽度</label>
              <el-input-number
                v-model="currentComponent.style.borderWidth"
                :min="0"
                :max="10"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>边框颜色</label>
              <el-color-picker
                v-model="currentComponent.style.borderColor"
                @change="updateComponentStyle"
              />
            </div>
            <div class="property-item">
              <label>圆角</label>
              <el-input-number
                v-model="currentComponent.style.borderRadius"
                :min="0"
                :max="50"
                :step="1"
                @change="updateComponentStyle"
              />
            </div>
          </div>
        </div>
        
        <div class="property-section">
          <h4>组件属性</h4>
          <div class="property-grid">
            <div v-if="currentComponent.type === 'Text'" class="property-item">
              <label>文本内容</label>
              <el-input
                v-model="currentComponent.props.content"
                type="textarea"
                :rows="3"
                @change="updateComponentProps"
              />
            </div>
            
            <div v-if="currentComponent.type === 'Image'" class="property-item">
              <label>图片地址</label>
              <el-input
                v-model="currentComponent.props.src"
                placeholder="请输入图片URL"
                @change="updateComponentProps"
              />
            </div>
            
            <div v-if="currentComponent.type === 'Button'" class="property-item">
              <label>按钮文本</label>
              <el-input
                v-model="currentComponent.props.content"
                @change="updateComponentProps"
              />
            </div>
            
            <div v-if="currentComponent.type === 'Input'" class="property-item">
              <label>占位文本</label>
              <el-input
                v-model="currentComponent.props.placeholder"
                @change="updateComponentProps"
              />
            </div>

            <div v-if="currentComponent.type === 'Form'" class="property-item">
              <label>容器标题</label>
              <el-input
                v-model="currentComponent.props.title"
                @change="updateComponentProps"
              />
            </div>

            <div v-if="currentComponent.type === 'Tabs'" class="property-item">
              <label>当前激活Tab</label>
              <el-select
                v-model="currentComponent.props.activeTab"
                @change="updateComponentProps"
              >
                <el-option
                  v-for="tab in ((currentComponent.props.tabs as Array<{ key: string; label: string }>) || [])"
                  :key="tab.key"
                  :label="tab.label"
                  :value="tab.key"
                />
              </el-select>
            </div>

            <template v-if="currentComponent.type === ComponentType.TABLE">
              <!-- 列字段编辑器 -->
              <div class="property-item">
                <label>子字段</label>
                <div class="col-list">
                  <div
                    v-for="(col, idx) in localTableColumns"
                    :key="col.dataIndex + idx"
                    class="col-item"
                    :class="{ 'col-item--drag-over': dragOverIdx === idx }"
                    draggable="true"
                    @dragstart="onColDragStart(idx)"
                    @dragover.prevent="onColDragOver(idx)"
                    @dragleave="dragOverIdx = null"
                    @drop="onColDrop(idx)"
                    @dragend="dragOverIdx = null"
                  >
                    <span class="col-handle">⠿</span>
                    <button class="col-type-btn" @click="toggleColType(idx)" :title="col.colType === 'number' ? '数字列' : '文本列'">
                      <span v-if="col.colType === 'number'" class="col-type-icon col-type-num">123</span>
                      <span v-else class="col-type-icon col-type-text">T</span>
                    </button>
                    <input
                      class="col-title-input"
                      :value="col.title"
                      @input="updateColTitle(idx, ($event.target as HTMLInputElement).value)"
                      @blur="commitColumns"
                    />
                    <button class="col-action-btn" title="复制" @click="duplicateCol(idx)">⧉</button>
                    <button class="col-action-btn col-action-del" title="删除" @click="removeCol(idx)">🗑</button>
                  </div>
                </div>
                <button class="col-add-btn" @click="addCol">+ 添加列</button>
              </div>

              <!-- 数据源 -->
              <div class="property-item">
                <label>数据源（JSON 数组）</label>
                <el-input
                  v-model="localDataSource"
                  type="textarea"
                  :rows="4"
                  placeholder='[{"name":"张三","age":25}]'
                  @input="syncTableDataSource"
                  @change="commitTableDataSource"
                />
              </div>

              <!-- 边框 / 斑马纹 -->
              <div class="property-item">
                <label>边框</label>
                <el-select :model-value="tableBordered" @change="updateTableBordered">
                  <el-option label="有边框" :value="true" />
                  <el-option label="无边框" :value="false" />
                </el-select>
              </div>
              <div class="property-item">
                <label>斑马纹</label>
                <el-select :model-value="tableStriped" @change="updateTableStriped">
                  <el-option label="斑马纹" :value="true" />
                  <el-option label="无斑马纹" :value="false" />
                </el-select>
              </div>
            </template>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { ComponentType } from '@/types'
import LayerPanel from './LayerPanel.vue'
import {
  InfoFilled,
  ArrowUp,
  ArrowDown,
  DArrowRight
} from '@element-plus/icons-vue'

const editorStore = useEditorStore()

const currentComponent = computed(() => editorStore.currentComponent)

// 当前页面所有组件的层级列表
const allZIndices = computed(() => {
  if (!editorStore.currentPage) return []
  return editorStore.currentPage.components.map(c => c.style.zIndex)
})

const totalLayers = computed(() => editorStore.currentPage?.components.length ?? 0)

const maxZ = computed(() => allZIndices.value.length ? Math.max(...allZIndices.value) : 1)
const minZ = computed(() => allZIndices.value.length ? Math.min(...allZIndices.value) : 1)

const isOnTop = computed(() => {
  if (!currentComponent.value) return true
  return currentComponent.value.style.zIndex >= maxZ.value
})

const isOnBottom = computed(() => {
  if (!currentComponent.value) return true
  return currentComponent.value.style.zIndex <= minZ.value
})

// 精确设置层级输入框的本地状态
const customZIndex = ref(1)
watch(
  () => currentComponent.value?.style.zIndex,
  (val) => { if (val !== undefined) customZIndex.value = val },
  { immediate: true }
)

const applyCustomZIndex = (val: number | null) => {
  if (!currentComponent.value || val === null) return
  editorStore.setComponentZIndex(currentComponent.value.id, val)
}

const normalizeAllLayers = () => {
  editorStore.normalizeZIndex()
}

const updateComponentStyle = () => {
  if (!currentComponent.value) return
  editorStore.updateComponentStyle(currentComponent.value.id, currentComponent.value.style)
}

const updateComponentProps = () => {
  if (!currentComponent.value) return
  editorStore.updateComponentProps(currentComponent.value.id, currentComponent.value.props)
}

const moveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
  if (!currentComponent.value) return
  editorStore.moveComponentLayer(currentComponent.value.id, direction)
}

const deleteCurrentComponent = () => {
  if (!currentComponent.value) return
  editorStore.deleteComponent(currentComponent.value.id)
}

// ── Table 列编辑器 ────────────────────────────────────────────────
interface ColItem { title: string; dataIndex: string; colType: 'text' | 'number' }

const parseColumns = (raw: unknown): ColItem[] => {
  if (!Array.isArray(raw)) return []
  return (raw as string[]).map((s) => {
    const parts = s.split(':')
    const title = parts[0] || ''
    const dataIndex = parts[1] || title
    const colType = parts[2] === 'number' ? 'number' : 'text'
    return { title, dataIndex, colType } as ColItem
  })
}

const serializeColumns = (cols: ColItem[]): string[] =>
  cols.map((c) => `${c.title}:${c.dataIndex}:${c.colType}`)

const localTableColumns = ref<ColItem[]>([])
const localDataSource = ref('')
const dragSrcIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

watch(
  () => currentComponent.value?.props.columns,
  (cols) => { localTableColumns.value = parseColumns(cols) },
  { immediate: true },
)

watch(
  () => currentComponent.value?.props.dataSource,
  (ds) => { localDataSource.value = (ds as string) ?? '' },
  { immediate: true },
)

// 实时写入 store（不记历史）
const flushColumns = () => {
  if (!currentComponent.value) return
  Object.assign(currentComponent.value.props, { columns: serializeColumns(localTableColumns.value) })
}

// 失焦时写 Command（记历史）
const commitColumns = () => {
  if (!currentComponent.value) return
  editorStore.updateComponentProps(currentComponent.value.id, {
    columns: serializeColumns(localTableColumns.value),
  })
}

const updateColTitle = (idx: number, val: string) => {
  const col = localTableColumns.value[idx]
  if (!col) return
  if (!col.dataIndex || col.dataIndex === col.title) col.dataIndex = val
  col.title = val
  flushColumns()
}

const toggleColType = (idx: number) => {
  const col = localTableColumns.value[idx]
  if (!col) return
  col.colType = col.colType === 'text' ? 'number' : 'text'
  commitColumns()
}

const duplicateCol = (idx: number) => {
  const src = localTableColumns.value[idx]
  if (!src) return
  localTableColumns.value.splice(idx + 1, 0, { ...src, dataIndex: src.dataIndex + '_copy' })
  commitColumns()
}

const removeCol = (idx: number) => {
  localTableColumns.value.splice(idx, 1)
  commitColumns()
}

const addCol = () => {
  const n = localTableColumns.value.length + 1
  localTableColumns.value.push({ title: `列${n}`, dataIndex: `col${n}`, colType: 'text' })
  commitColumns()
}

// 拖拽排序
const onColDragStart = (idx: number) => { dragSrcIdx.value = idx }
const onColDragOver = (idx: number) => { dragOverIdx.value = idx }
const onColDrop = (idx: number) => {
  const src = dragSrcIdx.value
  if (src === null || src === idx) return
  const cols = [...localTableColumns.value]
  const [item] = cols.splice(src, 1) as [ColItem]
  cols.splice(idx, 0, item)
  localTableColumns.value = cols
  dragSrcIdx.value = null
  dragOverIdx.value = null
  commitColumns()
}

// dataSource 同步
const syncTableDataSource = () => {
  if (!currentComponent.value) return
  Object.assign(currentComponent.value.props, { dataSource: localDataSource.value })
}

const commitTableDataSource = () => {
  if (!currentComponent.value) return
  editorStore.updateComponentProps(currentComponent.value.id, { dataSource: localDataSource.value })
}

const tableBordered = computed(() => {
  if (!currentComponent.value || currentComponent.value.type !== ComponentType.TABLE) return true
  return (currentComponent.value.props.bordered as boolean | undefined) ?? true
})

const updateTableBordered = (value: boolean) => {
  if (!currentComponent.value) return
  editorStore.updateComponentProps(currentComponent.value.id, { bordered: value })
}

const tableStriped = computed(() => {
  if (!currentComponent.value || currentComponent.value.type !== ComponentType.TABLE) return false
  return (currentComponent.value.props.striped as boolean | undefined) ?? false
})

const updateTableStriped = (value: boolean) => {
  if (!currentComponent.value) return
  editorStore.updateComponentProps(currentComponent.value.id, { striped: value })
}
</script>

<style scoped>
.property-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 40px 20px;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.property-content {
  flex: 1;
  height: 0;
}

.property-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.property-section:last-child {
  border-bottom: none;
}

.property-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.property-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.property-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Table 列编辑器 ─────────────────────────────────── */
.col-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 6px;
}

.col-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: default;
  transition: border-color 0.15s;
}

.col-item--drag-over {
  border-color: #409eff;
  background: #ecf5ff;
}

.col-handle {
  color: #c0c4cc;
  cursor: grab;
  font-size: 14px;
  flex-shrink: 0;
  user-select: none;
}

.col-type-btn {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  padding: 2px 4px;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}

.col-type-btn:hover {
  border-color: #409eff;
}

.col-type-icon {
  font-size: 11px;
  font-weight: 700;
  display: block;
  min-width: 22px;
  text-align: center;
}

.col-type-text { color: #606266; }
.col-type-num  { color: #409eff; }

.col-title-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #303133;
  background: transparent;
  min-width: 0;
}

.col-title-input:focus {
  border-bottom: 1px solid #409eff;
}

.col-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  flex-shrink: 0;
  padding: 2px;
  line-height: 1;
}

.col-action-btn:hover { color: #409eff; }
.col-action-del:hover { color: #f56c6c; }

.col-add-btn {
  width: 100%;
  padding: 8px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background: #fafafa;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.col-add-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.zindex-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.zindex-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.zindex-badge-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.zindex-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 22px;
  padding: 0 8px;
  background: #409eff;
  color: white;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 600;
}

.zindex-range-tip {
  font-size: 11px;
  color: #999;
}

.layer-btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 10px;
}

.layer-btn-grid .el-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
}

.zindex-input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 8px;
}

.zindex-input-row label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.zindex-input-row .el-input-number {
  width: 100px;
}

.normalize-btn {
  width: 100%;
  font-size: 12px;
}

.el-scrollbar {
  height: 100%;
}
</style>