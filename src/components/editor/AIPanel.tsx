import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { ComponentType } from '@/types'
import type { ComponentData } from '@/types'
import type { CanvasAction } from '@/services/aiApi'
import { chatWithAI } from '@/services/aiApi'
import { PAGE_TEMPLATES } from './AITemplates'
import type { PageTemplate } from './AITemplates'
import { useToast } from '@/components/ui/Toast'
import styles from './AIPanel.module.css'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  actions?: CanvasAction[]
}

interface AIPanelProps {
  open: boolean
  onClose: () => void
}

const quickActions = [
  '\u6dfb\u52a0\u6807\u9898',
  '\u6dfb\u52a0\u6309\u94ae',
  '\u6dfb\u52a0\u8f93\u5165\u6846',
  '\u6dfb\u52a0\u56fe\u7247',
  '\u80cc\u666f\u6539\u4e3a\u767d\u8272',
  '\u751f\u6210\u767b\u5f55\u9875',
]

const TYPE_MAP: Record<string, ComponentType> = {
  Text: ComponentType.TEXT,
  Image: ComponentType.IMAGE,
  Button: ComponentType.BUTTON,
  Input: ComponentType.INPUT,
  Form: ComponentType.FORM,
  Tabs: ComponentType.TABS,
}

function formatMessage(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}

function actionLabel(action: CanvasAction): string {
  const typeMap: Record<string, string> = {
    add_component: `\u6dfb\u52a0${action.componentType ?? ''}\u7ec4\u4ef6`,
    update_component_style: '\u66f4\u65b0\u6837\u5f0f',
    update_component_props: '\u66f4\u65b0\u5c5e\u6027',
    delete_component: '\u5220\u9664\u7ec4\u4ef6',
    set_page_style: '\u66f4\u65b0\u9875\u9762\u6837\u5f0f',
    clear_canvas: '\u6e05\u7a7a\u753b\u5e03',
    none: '\u65e0\u64cd\u4f5c',
  }
  return typeMap[action.type] ?? action.type
}

export default function AIPanel({ open, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [generateMode, setGenerateMode] = useState<'append' | 'replace'>('replace')
  const [showTemplates, setShowTemplates] = useState(true)
  const messagesRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { mode: string } }) => {
        if (json.success && json.data) setHasApiKey(json.data.mode === 'deepseek')
      })
      .catch(() => {})
  }, [])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }, 0)
  }, [])

  const buildCanvasContext = useCallback(() => {
    const store = useEditorStore.getState()
    const page = store.currentPage
    if (!page) return null
    return {
      pageTitle: page.title,
      componentCount: page.components.length,
      components: page.components.map((c) => ({
        id: c.id,
        type: c.type,
        props: c.props as Record<string, unknown>,
        style: { width: c.style.width, height: c.style.height },
      })),
    }
  }, [])

  const executeActions = useCallback((actions: CanvasAction[]) => {
    const store = useEditorStore.getState()

    const hasClear = actions.some((a) => a.type === 'clear_canvas')
    const addActions = actions.filter((a) => a.type === 'add_component')
    const isBatchGenerate = addActions.length > 1 || (addActions.length >= 1 && hasClear)

    if (isBatchGenerate) {
      const componentDefs = addActions
        .map((action) => {
          const compType = TYPE_MAP[action.componentType ?? '']
          if (!compType) return null
          return {
            type: compType,
            style: (action.style ?? {}) as Partial<ComponentData['style']>,
            props: action.props ?? {},
          }
        })
        .filter(Boolean) as Array<{
        type: ComponentType
        style: Partial<ComponentData['style']>
        props: Record<string, unknown>
      }>

      if (componentDefs.length > 0) {
        store.batchAddComponents(componentDefs, hasClear)
      }

      // Handle page style if present
      const pageStyleAction = actions.find((a) => a.type === 'set_page_style')
      if (pageStyleAction?.pageStyle) {
        store.updateComponentStyle(
          '__page__',
          pageStyleAction.pageStyle as Partial<ComponentData['style']>,
        )
      }
      return
    }

    // Single action path
    for (const action of actions) {
      switch (action.type) {
        case 'add_component': {
          const compType = TYPE_MAP[action.componentType ?? '']
          if (!compType) break
          store.addComponent(compType, { ...(action.props ?? {}), ...(action.style ?? {}) })
          break
        }
        case 'update_component_style': {
          const targetId = action.componentId ?? store.currentComponent?.id
          if (targetId && action.style)
            store.updateComponentStyle(targetId, action.style as Partial<ComponentData['style']>)
          break
        }
        case 'update_component_props': {
          const targetId = action.componentId ?? store.currentComponent?.id
          if (targetId && action.props) store.updateComponentProps(targetId, action.props)
          break
        }
        case 'delete_component': {
          const targetId = action.componentId ?? store.currentComponent?.id
          if (targetId) store.deleteComponent(targetId)
          break
        }
        case 'set_page_style':
          break
      }
    }
  }, [])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || loading) return
    const store = useEditorStore.getState()
    if (!store.currentPage) {
      toast.warning('\u8bf7\u5148\u521b\u5efa\u6216\u6253\u5f00\u4e00\u4e2a\u9875\u9762')
      return
    }

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInputText('')
    setLoading(true)
    scrollToBottom()

    try {
      const canvasContext = buildCanvasContext()!
      const historyMessages = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      historyMessages.push({ role: 'user' as const, content: text })
      const result = await chatWithAI(historyMessages, canvasContext, generateMode)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply, actions: result.actions },
      ])
      if (result.actions.length > 0) executeActions(result.actions)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI \u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528'
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `\u26a0\ufe0f ${msg}\uff0c\u8bf7\u786e\u8ba4\u540e\u7aef\u670d\u52a1\u5df2\u542f\u52a8\u3002`,
        },
      ])
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }, [
    inputText,
    loading,
    messages,
    generateMode,
    scrollToBottom,
    buildCanvasContext,
    executeActions,
    toast,
  ])

  const sendQuick = useCallback(
    (text: string) => {
      setInputText(text)
      setTimeout(() => {
        const store = useEditorStore.getState()
        if (!store.currentPage) {
          toast.warning('\u8bf7\u5148\u521b\u5efa\u6216\u6253\u5f00\u4e00\u4e2a\u9875\u9762')
          return
        }
        setMessages((prev) => [...prev, { role: 'user', content: text }])
        setInputText('')
        setLoading(true)
        const canvasContext = buildCanvasContext()!
        chatWithAI([{ role: 'user', content: text }], canvasContext, generateMode)
          .then((result) => {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: result.reply, actions: result.actions },
            ])
            if (result.actions.length > 0) executeActions(result.actions)
          })
          .catch((e) => {
            const msg =
              e instanceof Error ? e.message : 'AI \u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528'
            setMessages((prev) => [...prev, { role: 'assistant', content: `\u26a0\ufe0f ${msg}` }])
          })
          .finally(() => {
            setLoading(false)
            scrollToBottom()
          })
      }, 0)
    },
    [generateMode, buildCanvasContext, executeActions, scrollToBottom, toast],
  )

  const sendTemplate = useCallback(
    async (template: PageTemplate) => {
      if (loading) return
      const store = useEditorStore.getState()
      if (!store.currentPage) {
        toast.warning('\u8bf7\u5148\u521b\u5efa\u6216\u6253\u5f00\u4e00\u4e2a\u9875\u9762')
        return
      }

      if (template.mode === 'replace' && store.currentPage.components.length > 0) {
        if (
          !window.confirm(
            `\u751f\u6210\u201c${template.label}\u201d\u5c06\u6e05\u7a7a\u5f53\u524d\u753b\u5e03\u5185\u5bb9\uff0c\u662f\u5426\u7ee7\u7eed\uff1f`,
          )
        )
          return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: `[\u6a21\u677f] ${template.label}` },
      ])
      setLoading(true)
      scrollToBottom()

      try {
        const canvasContext = buildCanvasContext()!
        const result = await chatWithAI(
          [{ role: 'user', content: template.prompt }],
          canvasContext,
          template.mode,
        )
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.reply, actions: result.actions },
        ])
        if (result.actions.length > 0) executeActions(result.actions)
        toast.success(
          `\u201c${template.label}\u201d\u751f\u6210\u5b8c\u6210\uff0c\u53ef\u6309 Ctrl+Z \u64a4\u9500`,
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'AI \u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528'
        setMessages((prev) => [...prev, { role: 'assistant', content: `\u26a0\ufe0f ${msg}` }])
      } finally {
        setLoading(false)
        scrollToBottom()
      }
    },
    [loading, buildCanvasContext, executeActions, scrollToBottom, toast],
  )

  if (!open) {
    return (
      <div className={styles.aiPanel}>
        <div className={styles.aiTrigger} onClick={() => onClose()}>
          <div className={styles.aiTriggerBtn} title="AI \u52a9\u624b">
            <span className={styles.aiIcon}>{'\u2726'}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.aiPanel} ${styles.aiPanelOpen}`}>
      <div className={styles.aiChat}>
        <div className={styles.aiChatHeader}>
          <div className={styles.aiChatTitle}>
            <span className={styles.aiIcon}>{'\u2726'}</span>
            <span>AI 画布助手</span>
            <span className={`${styles.tag} ${hasApiKey ? styles.tagSuccess : styles.tagWarning}`}>
              {hasApiKey ? 'DeepSeek' : '\u6f14\u793a\u6a21\u5f0f'}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Mode switch */}
        <div className={styles.modeSwitch}>
          <span className={styles.modeSwitchLabel}>{'\u751f\u6210\u6a21\u5f0f\uff1a'}</span>
          <button
            className={`${styles.modeBtn} ${generateMode === 'replace' ? styles.modeBtnActive : ''}`}
            onClick={() => setGenerateMode('replace')}
          >
            {'\u66ff\u6362'}
          </button>
          <button
            className={`${styles.modeBtn} ${generateMode === 'append' ? styles.modeBtnActive : ''}`}
            onClick={() => setGenerateMode('append')}
          >
            {'\u8ffd\u52a0'}
          </button>
        </div>

        {/* Templates */}
        <div className={styles.templateSection}>
          <button className={styles.templateToggle} onClick={() => setShowTemplates((v) => !v)}>
            {`\u2726 \u9875\u9762\u6a21\u677f ${showTemplates ? '\u25b2' : '\u25bc'}`}
          </button>
          {showTemplates && (
            <div className={styles.templateGrid}>
              {PAGE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  className={styles.templateCard}
                  disabled={loading}
                  onClick={() => sendTemplate(tpl)}
                >
                  <span className={styles.templateIcon}>{tpl.icon}</span>
                  <span className={styles.templateLabel}>{tpl.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={messagesRef} className={styles.aiChatMessages}>
          <div className={`${styles.aiMessage} ${styles.aiMessageAssistant}`}>
            <div className={styles.aiAvatar}>{'\u2726'}</div>
            <div className={styles.aiBubble}>
              <p>
                {
                  '\u4f60\u597d\uff01\u6211\u662f AI \u753b\u5e03\u52a9\u624b\uff0c\u53ef\u4ee5\u5e2e\u4f60\u64cd\u63a7\u7f16\u8f91\u5668\u3002\u8bd5\u8bd5\uff1a'
                }
              </p>
              <ul>
                <li>{'\u300c\u751f\u6210\u4e00\u4e2a\u767b\u5f55\u9875\u300d'}</li>
                <li>{'\u300c\u6dfb\u52a0\u4e00\u4e2a\u6807\u9898\u7ec4\u4ef6\u300d'}</li>
                <li>{'\u300c\u4fee\u6539\u80cc\u666f\u8272\u4e3a\u84dd\u8272\u300d'}</li>
              </ul>
              <p>
                {
                  '\u6216\u70b9\u51fb\u4e0a\u65b9\u6a21\u677f\u5feb\u901f\u751f\u6210\u9875\u9762\u3002'
                }
              </p>
            </div>
          </div>

          {messages.map((msg, index) => (
            <div key={index}>
              <div
                className={`${styles.aiMessage} ${msg.role === 'user' ? styles.aiMessageUser : styles.aiMessageAssistant}`}
              >
                {msg.role === 'assistant' && <div className={styles.aiAvatar}>{'\u2726'}</div>}
                <div
                  className={styles.aiBubble}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                {msg.role === 'user' && (
                  <div className={`${styles.aiAvatar} ${styles.aiAvatarUser}`}>{'\u6211'}</div>
                )}
              </div>
              {msg.role === 'assistant' && msg.actions?.length ? (
                <div className={styles.aiActionsTag}>
                  {msg.actions
                    .filter((a) => a.type !== 'none')
                    .map((action, ai) => (
                      <span key={ai} className={styles.actionTag}>
                        {actionLabel(action)}
                      </span>
                    ))}
                </div>
              ) : null}
            </div>
          ))}

          {loading && (
            <div className={`${styles.aiMessage} ${styles.aiMessageAssistant}`}>
              <div className={styles.aiAvatar}>{'\u2726'}</div>
              <div className={`${styles.aiBubble} ${styles.aiBubbleLoading}`}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          )}
        </div>

        <div className={styles.aiQuickActions}>
          {quickActions.map((quick) => (
            <button
              key={quick}
              className={styles.quickBtn}
              disabled={loading}
              onClick={() => sendQuick(quick)}
            >
              {quick}
            </button>
          ))}
        </div>

        <div className={styles.aiChatInput}>
          <textarea
            className={styles.inputArea}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              '\u63cf\u8ff0\u4f60\u60f3\u8981\u7684\u64cd\u4f5c\uff0c\u4f8b\u5982\uff1a\u751f\u6210\u4e00\u4e2a\u767b\u5f55\u9875'
            }
            rows={2}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!inputText.trim() || loading}
          >
            {loading ? '...' : '\u2191'}
          </button>
        </div>
        <div className={styles.aiChatHint}>{'Enter 发送 · Shift+Enter 换行'}</div>
      </div>
    </div>
  )
}
