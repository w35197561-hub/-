<template>
  <div class="code-panel">
    <div class="fn-list">
      <div class="fn-list-header">
        <span class="fn-list-title">函数列表</span>
        <el-button :icon="Plus" size="small" @click="addFunction">新增</el-button>
      </div>
      <div class="fn-items">
        <div
          v-for="name in functionNames"
          :key="name"
          class="fn-item"
          :class="{ active: selectedFn === name }"
          @click="selectFunction(name)"
        >
          <span class="fn-name">{{ name }}</span>
          <el-button
            :icon="Delete"
            size="small"
            link
            type="danger"
            @click.stop="removeFunction(name)"
          />
        </div>
        <div v-if="functionNames.length === 0" class="fn-empty">暂无函数</div>
      </div>
    </div>

    <div class="fn-editor">
      <template v-if="selectedFn">
        <div class="fn-editor-header">
          <code>function {{ selectedFn }}() {</code>
        </div>
        <textarea
          class="fn-textarea"
          :value="currentBody"
          spellcheck="false"
          @input="onInput"
          @blur="save"
        />
        <div class="fn-editor-footer"><code>}</code></div>
      </template>
      <div v-else class="fn-placeholder">选择左侧函数开始编辑</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()

const functions = computed(() => editorStore.currentPage?.functions ?? {})
const functionNames = computed(() => Object.keys(functions.value))

const selectedFn = ref<string | null>(null)
const localBody = ref('')

const currentBody = computed(() => {
  if (!selectedFn.value) return ''
  return selectedFn.value in functions.value ? functions.value[selectedFn.value] : localBody.value
})

const selectFunction = (name: string) => {
  selectedFn.value = name
  localBody.value = functions.value[name] ?? ''
}

const onInput = (e: Event) => {
  localBody.value = (e.target as HTMLTextAreaElement).value
}

const save = () => {
  if (!selectedFn.value) return
  editorStore.updatePageFunctions({ ...functions.value, [selectedFn.value]: localBody.value })
}

const addFunction = () => {
  const base = 'myFunction'
  let name = base
  let i = 1
  while (name in functions.value) {
    name = `${base}${i++}`
  }
  editorStore.updatePageFunctions({ ...functions.value, [name]: '' })
  selectedFn.value = name
  localBody.value = ''
}

const removeFunction = (name: string) => {
  const updated = { ...functions.value }
  delete updated[name]
  editorStore.updatePageFunctions(updated)
  if (selectedFn.value === name) {
    selectedFn.value = null
    localBody.value = ''
  }
}
</script>

<style scoped>
.code-panel {
  display: flex;
  height: 480px;
  gap: 0;
}

.fn-list {
  width: 200px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.fn-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.fn-list-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.fn-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.fn-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.fn-item:hover {
  background: #f5f7fa;
}

.fn-item.active {
  background: #ecf5ff;
}

.fn-name {
  font-size: 13px;
  color: #333;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fn-empty {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.fn-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  overflow: hidden;
}

.fn-editor-header,
.fn-editor-footer {
  padding: 6px 16px;
  background: #1e1e1e;
  color: #569cd6;
  font-family: monospace;
  font-size: 13px;
}

.fn-textarea {
  flex: 1;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  outline: none;
  resize: none;
  padding: 0 16px 0 32px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
}

.fn-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 14px;
}
</style>
