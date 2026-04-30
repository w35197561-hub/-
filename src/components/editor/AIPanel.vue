<template>
  <div class="ai-panel" :class="{ 'ai-panel--open': modelValue }">
    <!-- 折叠时的悬浮按钮 -->
    <div v-if="!modelValue" class="ai-trigger" @click="$emit('update:modelValue', true)">
      <el-tooltip content="AI 助手" placement="left">
        <div class="ai-trigger-btn">
          <span class="ai-icon">✦</span>
        </div>
      </el-tooltip>
    </div>

    <!-- 展开的对话面板 -->
    <div v-else class="ai-chat">
      <!-- 标题栏 -->
      <div class="ai-chat__header">
        <div class="ai-chat__title">
          <span class="ai-icon">✦</span>
          <span>AI 画布助手</span>
          <el-tag v-if="hasApiKey" size="small" type="success" effect="plain">DeepSeek</el-tag>
          <el-tag v-else size="small" type="warning" effect="plain">演示模式</el-tag>
        </div>
        <el-button circle size="small" text @click="$emit('update:modelValue', false)">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 消息列表 -->
      <div ref="messagesRef" class="ai-chat__messages">
        <!-- 欢迎气泡 -->
        <div class="ai-message ai-message--assistant">
          <div class="ai-avatar">✦</div>
          <div class="ai-bubble">
            <p>你好！我是 AI 画布助手，可以帮你操控编辑器。试试说：</p>
            <ul>
              <li>「添加一个标题组件」</li>
              <li>「添加一个按钮」</li>
              <li>「添加输入框」</li>
              <li>「修改背景色为蓝色」</li>
            </ul>
          </div>
        </div>

        <!-- 历史消息 -->
        <template v-for="(msg, index) in messages" :key="index">
          <div
            class="ai-message"
            :class="msg.role === 'user' ? 'ai-message--user' : 'ai-message--assistant'"
          >
            <div v-if="msg.role === 'assistant'" class="ai-avatar">✦</div>
            <div class="ai-bubble" v-html="formatMessage(msg.content)" />
            <div v-if="msg.role === 'user'" class="ai-avatar ai-avatar--user">我</div>
          </div>

          <!-- AI 执行的动作标签 -->
          <div v-if="msg.role === 'assistant' && msg.actions?.length" class="ai-actions-tag">
            <el-tag
              v-for="(action, ai) in msg.actions"
              :key="ai"
              size="small"
              type="success"
              effect="plain"
            >
              {{ actionLabel(action) }}
            </el-tag>
          </div>
        </template>

        <!-- 加载中 -->
        <div v-if="loading" class="ai-message ai-message--assistant">
          <div class="ai-avatar">✦</div>
          <div class="ai-bubble ai-bubble--loading">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
        </div>
      </div>

      <!-- 快捷指令 -->
      <div class="ai-quick-actions">
        <el-button
          v-for="quick in quickActions"
          :key="quick"
          size="small"
          round
          plain
          :disabled="loading"
          @click="sendQuick(quick)"
        >
          {{ quick }}
        </el-button>
      </div>

      <!-- 输入区 -->
      <div class="ai-chat__input">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="2"
          placeholder="描述你想要的操作，例如：添加一个红色按钮"
          resize="none"
          :disabled="loading"
          @keydown.enter.exact.prevent="handleSend"
        />
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!inputText.trim()"
          class="ai-send-btn"
          @click="handleSend"
        >
          <el-icon v-if="!loading"><Promotion /></el-icon>
        </el-button>
      </div>
      <div class="ai-chat__hint">Enter 发送 · Shift+Enter 换行</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Promotion } from '@element-plus/icons-vue'
import { useEditorStore } from '@/stores/editor'
import { ComponentType } from '@/types'
import type { CanvasAction } from '@/services/aiApi'
import { chatWithAI } from '@/services/aiApi'

// =====================
// Props / Emits
// =====================
defineProps<{ modelValue: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

// =====================
// 状态
// =====================
const editorStore = useEditorStore()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  actions?: CanvasAction[]
}

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const messagesRef = ref<HTMLElement | null>(null)
const hasApiKey = ref(false)
const aiMode = ref<'deepseek' | 'mock'>('mock')

// 启动时查询后端 AI 配置状态
async function fetchAiStatus() {
  try {
    const res = await fetch('/api/ai/status')
    const json = await res.json() as { success: boolean; data?: { mode: string } }
    if (json.success && json.data) {
      aiMode.value = json.data.mode as 'deepseek' | 'mock'
      hasApiKey.value = json.data.mode === 'deepseek'
    }
  } catch {
    // 后端未启动时静默忽略
  }
}
fetchAiStatus()

const quickActions = ['添加标题', '添加按钮', '添加输入框', '添加图片', '背景改为白色']

// =====================
// 工具函数
// =====================
function formatMessage(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}

function actionLabel(action: CanvasAction): string {
  const typeMap: Record<string, string> = {
    add_component: `添加${action.componentType ?? ''}组件`,
    update_component_style: '更新样式',
    update_component_props: '更新属性',
    delete_component: '删除组件',
    set_page_style: '更新页面样式',
    none: '无操作'
  }
  return typeMap[action.type] ?? action.type
}

async function scrollToBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// =====================
// 执行 AI 返回的画布动作
// =====================
function executeActions(actions: CanvasAction[]) {
  for (const action of actions) {
    switch (action.type) {
      case 'add_component': {
        const typeMap: Record<string, ComponentType> = {
          Text: ComponentType.TEXT,
          Image: ComponentType.IMAGE,
          Button: ComponentType.BUTTON,
          Input: ComponentType.INPUT,
          Form: ComponentType.FORM,
          Tabs: ComponentType.TABS
        }
        const compType = typeMap[action.componentType ?? '']
        if (!compType) break

        // 合并 style 和 props 作为 initialProps
        const initialProps: Record<string, unknown> = {
          ...(action.props ?? {}),
          ...(action.style ?? {})
        }
        editorStore.addComponent(compType, initialProps)
        break
      }

      case 'update_component_style': {
        const targetId = action.componentId ?? editorStore.currentComponent?.id
        if (targetId && action.style) {
          editorStore.updateComponentStyle(targetId, action.style as never)
        }
        break
      }

      case 'update_component_props': {
        const targetId = action.componentId ?? editorStore.currentComponent?.id
        if (targetId && action.props) {
          editorStore.updateComponentProps(targetId, action.props)
        }
        break
      }

      case 'delete_component': {
        const targetId = action.componentId ?? editorStore.currentComponent?.id
        if (targetId) {
          editorStore.deleteComponent(targetId)
        }
        break
      }

      case 'set_page_style': {
        if (action.pageStyle && editorStore.currentPage) {
          Object.assign(editorStore.currentPage.style, action.pageStyle)
        }
        break
      }
    }
  }
}

// =====================
// 发送消息
// =====================
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  // 没有页面时提示
  if (!editorStore.currentPage) {
    ElMessage.warning('请先创建或打开一个页面')
    return
  }

  // 用户消息入列
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    // 构造画布快照上下文
    const page = editorStore.currentPage
    const canvasContext = {
      pageTitle: page.title,
      componentCount: page.components.length,
      components: page.components.map(c => ({
        id: c.id,
        type: c.type,
        props: c.props as Record<string, unknown>
      }))
    }

    // 发送给后端（仅最近 10 条历史）
    const historyMessages = messages.value.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }))

    const result = await chatWithAI(historyMessages, canvasContext)

    // AI 回复入列
    messages.value.push({
      role: 'assistant',
      content: result.reply,
      actions: result.actions
    })

    // 执行画布动作
    if (result.actions.length > 0) {
      executeActions(result.actions)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI 服务暂时不可用'
    messages.value.push({
      role: 'assistant',
      content: `⚠️ ${msg}，请确认后端服务已启动。`
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function sendQuick(text: string) {
  inputText.value = text
  handleSend()
}
</script>

<style scoped>
/* =====================
   悬浮触发按钮
   ===================== */
.ai-panel {
  position: fixed;
  right: 20px;
  bottom: 40px;
  z-index: 9999;
}

.ai-trigger {
  cursor: pointer;
}

.ai-trigger-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.45);
  transition: transform 0.2s, box-shadow 0.2s;
}

.ai-trigger-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
}

.ai-icon {
  font-size: 20px;
  color: #fff;
  line-height: 1;
}

/* =====================
   对话面板
   ===================== */
.ai-chat {
  width: 360px;
  height: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ai-chat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
}

.ai-chat__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.ai-chat__title .ai-icon {
  font-size: 16px;
}

/* =====================
   消息列表
   ===================== */
.ai-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

.ai-message {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.ai-message--user {
  flex-direction: row-reverse;
}

.ai-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.ai-avatar--user {
  background: #10b981;
  font-size: 11px;
  font-weight: 600;
}

.ai-bubble {
  max-width: 240px;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.ai-message--assistant .ai-bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.ai-message--user .ai-bubble {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-bubble p { margin: 0 0 6px; }
.ai-bubble ul { margin: 4px 0 0; padding-left: 16px; }
.ai-bubble li { margin-bottom: 3px; }

/* 加载动画 */
.ai-bubble--loading {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9ca3af;
  animation: bounce 1.2s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* 动作标签 */
.ai-actions-tag {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-left: 38px;
  margin-top: -6px;
}

/* =====================
   快捷指令
   ===================== */
.ai-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid #f0f0f0;
}

/* =====================
   输入区
   ===================== */
.ai-chat__input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
}

.ai-chat__input :deep(.el-textarea__inner) {
  border-radius: 10px;
  font-size: 13px;
  resize: none;
}

.ai-send-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
}

.ai-chat__hint {
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  padding: 2px 0 8px;
}
</style>
