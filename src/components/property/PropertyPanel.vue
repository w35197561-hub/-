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
        
        <!-- 样式设置 -->
        <div class="property-section" v-if="componentConfig?.styleSetters?.length">
          <h4>样式设置</h4>
          <div class="property-grid">
            <div v-for="s in componentConfig.styleSetters" :key="s.field" class="property-item">
              <label>{{ s.label }}</label>
              <el-input-number
                v-if="s.setter === 'NumberSetter'"
                :model-value="getStyleVal(s.field) as number"
                v-bind="s.setterProps"
                @update:model-value="val => setStyleVal(s.field, val)"
                @change="updateComponentStyle"
              />
              <el-color-picker
                v-else-if="s.setter === 'ColorSetter'"
                :model-value="getStyleVal(s.field) as string"
                @update:model-value="val => setStyleVal(s.field, val)"
                @change="updateComponentStyle"
              />
            </div>
          </div>
        </div>

        <!-- 组件属性 -->
        <div class="property-section" v-if="componentConfig?.propSetters.length">
          <h4>组件属性</h4>
          <div class="property-grid">
            <template v-if="componentConfig?.propSetters">
              <div v-for="s in componentConfig.propSetters" :key="s.field" class="property-item">
                <label>{{ s.label }}</label>
                <el-input-number
                  v-if="s.setter === 'NumberSetter'"
                  :model-value="getPropVal(s.field) as number"
                  v-bind="resolveSetterProps(s)"
                  @update:model-value="val => setPropVal(s.field, val)"
                  @change="updateComponentProps"
                />
                <el-input
                  v-else-if="s.setter === 'InputSetter'"
                  :model-value="getPropVal(s.field) as string"
                  v-bind="resolveSetterProps(s)"
                  @update:model-value="val => setPropVal(s.field, val)"
                  @change="updateComponentProps"
                />
                <el-input
                  v-else-if="s.setter === 'TextareaSetter'"
                  :model-value="getPropVal(s.field) as string"
                  type="textarea"
                  :rows="3"
                  @update:model-value="val => setPropVal(s.field, val)"
                  @change="updateComponentProps"
                />
                <el-color-picker
                  v-else-if="s.setter === 'ColorSetter'"
                  :model-value="getPropVal(s.field) as string"
                  @update:model-value="val => setPropVal(s.field, val)"
                  @change="updateComponentProps"
                />
                <el-select
                  v-else-if="s.setter === 'SelectSetter'"
                  :model-value="getPropVal(s.field)"
                  @update:model-value="val => { setPropVal(s.field, val); updateComponentProps() }"
                >
                  <el-option
                    v-for="opt in (currentComponent.props[s.optionsField!] as Array<{key:string;label:string}> || [])"
                    :key="opt.key" :label="opt.label" :value="opt.key"
                  />
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
import { componentConfigs } from '../material/componentConfigs'
import LayerPanel from './LayerPanel.vue'
import {
  InfoFilled,
  ArrowUp,
  ArrowDown,
  DArrowRight
} from '@element-plus/icons-vue'

const editorStore = useEditorStore()

const currentComponent = computed(() => editorStore.currentComponent)

const componentConfig = computed(() =>
  currentComponent.value ? componentConfigs[currentComponent.value.type] : null
)


const resolveSetterProps = (s: { setterProps?: Record<string, unknown> | ((props: Record<string, unknown>) => Record<string, unknown>) }) => {
  if (!s.setterProps) return {}
  if (typeof s.setterProps === 'function')
    return s.setterProps((currentComponent.value?.props ?? {}) as Record<string, unknown>)
  return s.setterProps
}

const getPropVal = (field: string): unknown =>
  currentComponent.value ? (currentComponent.value.props as Record<string, unknown>)[field] : undefined

const setPropVal = (field: string, val: unknown) => {
  if (!currentComponent.value) return
  ;(currentComponent.value.props as Record<string, unknown>)[field] = val
}

const getStyleVal = (field: string): unknown =>
  currentComponent.value ? (currentComponent.value.style as Record<string, unknown>)[field] : undefined

const setStyleVal = (field: string, val: unknown) => {
  if (!currentComponent.value) return
  ;(currentComponent.value.style as Record<string, unknown>)[field] = val
}

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