import { useMemo, useCallback } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { componentConfigs } from '../material/componentConfigs'
import { ComponentType } from '@/types'
import type { ActionConfig, ActionType, ValidationRule, RuleType } from '@/types'
import LayerPanel from './LayerPanel'
import { NumberInput } from '@/components/ui/NumberInput'
import { Toggle } from '@/components/ui/Toggle'
import styles from './PropertyPanel.module.css'

export default function PropertyPanel() {
  const currentComponent = useEditorStore((s) => s.currentComponent)
  const currentPage = useEditorStore((s) => s.currentPage)
  const updateComponentStyle = useEditorStore((s) => s.updateComponentStyle)
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps)
  const updateComponentEvents = useEditorStore((s) => s.updateComponentEvents)
  const deleteComponent = useEditorStore((s) => s.deleteComponent)
  const reorderComponent = useEditorStore((s) => s.reorderComponent)
  const componentConfig = useMemo(
    () => (currentComponent ? componentConfigs[currentComponent.type] : null),
    [currentComponent?.type],
  )

  // Component index in array (for reorder)
  const componentIndex = useMemo(() => {
    if (!currentPage || !currentComponent) return -1
    return currentPage.components.findIndex((c) => c.id === currentComponent.id)
  }, [currentPage, currentComponent])

  // Helpers
  const getPropVal = (field: string): unknown =>
    currentComponent ? (currentComponent.props as Record<string, unknown>)[field] : undefined
  const getStyleVal = (field: string): unknown =>
    currentComponent
      ? (currentComponent.style as unknown as Record<string, unknown>)[field]
      : undefined

  const handleStyleChange = useCallback(
    (field: string, value: unknown) => {
      if (!currentComponent) return
      updateComponentStyle(currentComponent.id, { [field]: value } as Record<string, unknown>)
    },
    [currentComponent, updateComponentStyle],
  )

  const handlePropChange = useCallback(
    (field: string, value: unknown) => {
      if (!currentComponent) return
      updateComponentProps(currentComponent.id, { [field]: value })
    },
    [currentComponent, updateComponentProps],
  )

  const resolveSetterProps = (s: {
    setterProps?:
      | Record<string, unknown>
      | ((props: Record<string, unknown>) => Record<string, unknown>)
  }) => {
    if (!s.setterProps) return {}
    if (typeof s.setterProps === 'function')
      return s.setterProps((currentComponent?.props ?? {}) as Record<string, unknown>)
    return s.setterProps
  }

  // Reorder info
  const totalComponents = currentPage?.components.length ?? 0
  const isFirst = componentIndex <= 0
  const isLast = !currentComponent || componentIndex >= totalComponents - 1

  // Collapse items
  const collapseItems = useMemo(() => {
    if (currentComponent?.type !== ComponentType.COLLAPSE) return []
    return Array.isArray(currentComponent.props.items)
      ? (currentComponent.props.items as Array<{ name: string; title: string; content: string }>)
      : []
  }, [currentComponent])

  // Button actions
  const otherComponents = useMemo(() => {
    if (!currentPage || !currentComponent) return []
    return currentPage.components.filter((c) => c.id !== currentComponent.id)
  }, [currentPage, currentComponent])

  const clickActions = useMemo<ActionConfig[]>(() => {
    if (!currentComponent) return []
    return currentComponent.events?.find((e) => e.type === 'click')?.actions ?? []
  }, [currentComponent])

  const saveClickActions = useCallback(
    (actions: ActionConfig[]) => {
      if (!currentComponent) return
      const existing = (currentComponent.events ?? []).filter((e) => e.type !== 'click')
      updateComponentEvents(currentComponent.id, [...existing, { type: 'click', actions }])
    },
    [currentComponent, updateComponentEvents],
  )

  // Validation rules
  const componentRules = useMemo<ValidationRule[]>(() => {
    if (!currentComponent) return []
    return (currentComponent.props.rules as ValidationRule[]) ?? []
  }, [currentComponent])

  const saveRules = useCallback(
    (rules: ValidationRule[]) => {
      if (!currentComponent) return
      handlePropChange('rules', rules)
    },
    [currentComponent, handlePropChange],
  )

  if (!currentComponent) {
    return (
      <div className={styles.propertyPanel}>
        <LayerPanel />
        <div className={styles.panelHeader}>
          <h3>{'\u5c5e\u6027\u914d\u7f6e'}</h3>
        </div>
        <div className={styles.emptyState}>
          <span style={{ fontSize: 48, color: '#ddd' }}>{'\u2139'}</span>
          <p>{'\u8bf7\u9009\u62e9\u8981\u914d\u7f6e\u7684\u7ec4\u4ef6'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.propertyPanel}>
      <LayerPanel />
      <div className={styles.panelHeader}>
        <h3>{'\u5c5e\u6027\u914d\u7f6e'}</h3>
        <button className={styles.deleteBtn} onClick={() => deleteComponent(currentComponent.id)}>
          {'\u5220\u9664\u7ec4\u4ef6'}
        </button>
      </div>

      <div className={styles.propertyContent}>
        <div style={{ height: '100%', overflowY: 'auto' }}>
          {/* Size */}
          <div className={styles.section}>
            <h4>{'\u5927\u5c0f'}</h4>
            <div className={styles.grid}>
              {[
                ['\u5bbd\u5ea6', 'width', 20],
                ['\u9ad8\u5ea6', 'height', 20],
              ].map(([label, field, min]) => (
                <div key={field as string} className={styles.propItem}>
                  <label>{label as string}</label>
                  <NumberInput
                    value={
                      currentComponent.style[field as keyof typeof currentComponent.style] as number
                    }
                    onChange={(v) => handleStyleChange(field as string, v)}
                    min={min as number}
                    step={1}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Reorder */}
          <div className={styles.section}>
            <h4>{'\u7ec4\u4ef6\u987a\u5e8f'}</h4>
            <div className={styles.zinfoRow}>
              <span className={styles.zinfoLabel}>{'\u5f53\u524d\u4f4d\u7f6e'}</span>
              <span className={styles.zinfoBadge}>{componentIndex + 1}</span>
              <span
                className={styles.zinfoTip}
              >{`\uff08\u5171 ${totalComponents} \u4e2a\uff09`}</span>
            </div>
            <div className={styles.layerBtnGrid}>
              <button
                className={styles.smallBtn}
                disabled={isFirst}
                onClick={() => reorderComponent(currentComponent.id, 0)}
              >
                {'\u2b06 \u7f6e\u9876'}
              </button>
              <button
                className={styles.smallBtn}
                disabled={isFirst}
                onClick={() => reorderComponent(currentComponent.id, componentIndex - 1)}
              >
                {'\u2191 \u4e0a\u79fb'}
              </button>
              <button
                className={styles.smallBtn}
                disabled={isLast}
                onClick={() => reorderComponent(currentComponent.id, componentIndex + 1)}
              >
                {'\u2193 \u4e0b\u79fb'}
              </button>
              <button
                className={styles.smallBtn}
                disabled={isLast}
                onClick={() => reorderComponent(currentComponent.id, totalComponents - 1)}
              >
                {'\u2b07 \u7f6e\u5e95'}
              </button>
            </div>
          </div>

          {/* Style setters */}
          {componentConfig?.styleSetters?.length ? (
            <div className={styles.section}>
              <h4>{'\u6837\u5f0f\u8bbe\u7f6e'}</h4>
              <div className={styles.grid}>
                {componentConfig.styleSetters.map((s) => (
                  <div key={s.field} className={styles.propItem}>
                    <label>{s.label}</label>
                    {s.setter === 'NumberSetter' && (
                      <NumberInput
                        value={getStyleVal(s.field) as number}
                        onChange={(v) => handleStyleChange(s.field, v)}
                        {...(s.setterProps as Record<string, number>)}
                      />
                    )}
                    {s.setter === 'ColorSetter' && (
                      <input
                        type="color"
                        value={(getStyleVal(s.field) as string) || '#000000'}
                        onChange={(e) => handleStyleChange(s.field, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Prop setters */}
          {componentConfig?.propSetters.length ? (
            <div className={styles.section}>
              <h4>{'\u7ec4\u4ef6\u5c5e\u6027'}</h4>
              <div className={styles.grid}>
                {componentConfig.propSetters.map((s) => (
                  <div key={s.field} className={styles.propItem}>
                    <label>{s.label}</label>
                    {s.setter === 'NumberSetter' && (
                      <NumberInput
                        value={getPropVal(s.field) as number}
                        onChange={(v) => handlePropChange(s.field, v)}
                        {...(resolveSetterProps(s) as Record<string, number>)}
                      />
                    )}
                    {s.setter === 'InputSetter' && (
                      <input
                        className={styles.input}
                        value={(getPropVal(s.field) as string) ?? ''}
                        onChange={(e) => handlePropChange(s.field, e.target.value)}
                      />
                    )}
                    {s.setter === 'TextareaSetter' && (
                      <textarea
                        className={styles.textarea}
                        rows={3}
                        value={(getPropVal(s.field) as string) ?? ''}
                        onChange={(e) => handlePropChange(s.field, e.target.value)}
                      />
                    )}
                    {s.setter === 'ColorSetter' && (
                      <input
                        type="color"
                        value={(getPropVal(s.field) as string) || '#000000'}
                        onChange={(e) => handlePropChange(s.field, e.target.value)}
                      />
                    )}
                    {s.setter === 'SelectSetter' && (
                      <select
                        className={styles.select}
                        value={String(getPropVal(s.field) ?? '')}
                        onChange={(e) => {
                          const opts =
                            (resolveSetterProps(s).options as Array<{ value: unknown }>) ?? []
                          const opt = opts.find((o) => String(o.value) === e.target.value)
                          handlePropChange(s.field, opt ? opt.value : e.target.value)
                        }}
                      >
                        {resolveSetterProps(s).options
                          ? (
                              resolveSetterProps(s).options as Array<{
                                label: string
                                value: unknown
                              }>
                            ).map((opt) => (
                              <option key={String(opt.value)} value={String(opt.value)}>
                                {opt.label}
                              </option>
                            ))
                          : (
                              (currentComponent.props[s.optionsField!] as Array<{
                                key: string
                                label: string
                              }>) ?? []
                            ).map((opt) => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label}
                              </option>
                            ))}
                      </select>
                    )}
                    {s.setter === 'SwitchSetter' && (
                      <Toggle
                        checked={(getPropVal(s.field) as boolean) ?? false}
                        onChange={(v) => handlePropChange(s.field, v)}
                      />
                    )}
                    {s.setter === 'StringListSetter' && (
                      <div className={styles.stringList}>
                        {((getPropVal(s.field) as string[]) ?? []).map((item, idx) => (
                          <div key={idx} className={styles.stringListRow}>
                            <input
                              className={styles.input}
                              value={item}
                              onChange={(e) => {
                                const arr = [...((getPropVal(s.field) as string[]) ?? [])]
                                arr[idx] = e.target.value
                                handlePropChange(s.field, arr)
                              }}
                            />
                            <button
                              className={styles.miniBtn}
                              onClick={() => {
                                const arr = ((getPropVal(s.field) as string[]) ?? []).filter(
                                  (_, i) => i !== idx,
                                )
                                handlePropChange(s.field, arr)
                              }}
                            >
                              {'\u2212'}
                            </button>
                          </div>
                        ))}
                        <button
                          className={styles.smallBtn}
                          onClick={() => {
                            const arr = [
                              ...((getPropVal(s.field) as string[]) ?? []),
                              '\u65b0\u9009\u9879',
                            ]
                            handlePropChange(s.field, arr)
                          }}
                        >
                          {'\u6dfb\u52a0\u9009\u9879'}
                        </button>
                      </div>
                    )}
                    {/* CascaderOptionsSetter, TreeDataSetter, TableColumnSetter, TableDataSetter simplified for brevity */}
                    {s.setter === 'CascaderOptionsSetter' && (
                      <span className={styles.hint}>
                        {'\u8bf7\u5728\u7ec4\u4ef6\u914d\u7f6e\u4e2d\u7f16\u8f91'}
                      </span>
                    )}
                    {s.setter === 'TreeDataSetter' && (
                      <span className={styles.hint}>
                        {'\u8bf7\u5728\u7ec4\u4ef6\u914d\u7f6e\u4e2d\u7f16\u8f91'}
                      </span>
                    )}
                    {s.setter === 'TableColumnSetter' && (
                      <span className={styles.hint}>
                        {'\u8bf7\u5728\u7ec4\u4ef6\u914d\u7f6e\u4e2d\u7f16\u8f91'}
                      </span>
                    )}
                    {s.setter === 'TableDataSetter' && (
                      <span className={styles.hint}>
                        {'\u8bf7\u5728\u7ec4\u4ef6\u914d\u7f6e\u4e2d\u7f16\u8f91'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Collapse items */}
          {currentComponent.type === ComponentType.COLLAPSE && (
            <div className={styles.section}>
              <h4>{'\u9762\u677f\u5217\u8868'}</h4>
              {collapseItems.map((item, idx) => (
                <div key={idx} className={styles.actionCard}>
                  <div className={styles.actionRow}>
                    <label>{'\u6807\u9898'}</label>
                    <input
                      className={styles.input}
                      value={item.title}
                      onChange={(e) => {
                        const items = collapseItems.map((it) => ({ ...it }))
                        items[idx]!.title = e.target.value
                        handlePropChange('items', items)
                      }}
                    />
                  </div>
                  <div className={styles.actionRow}>
                    <label>{'\u5185\u5bb9'}</label>
                    <textarea
                      className={styles.textarea}
                      rows={2}
                      value={item.content}
                      onChange={(e) => {
                        const items = collapseItems.map((it) => ({ ...it }))
                        items[idx]!.content = e.target.value
                        handlePropChange('items', items)
                      }}
                    />
                  </div>
                  <button
                    className={styles.linkBtn}
                    onClick={() =>
                      handlePropChange(
                        'items',
                        collapseItems.filter((_, i) => i !== idx),
                      )
                    }
                  >
                    {'\u5220\u9664\u9762\u677f'}
                  </button>
                </div>
              ))}
              <button
                className={styles.smallBtn}
                onClick={() => {
                  const n = collapseItems.length + 1
                  handlePropChange('items', [
                    ...collapseItems,
                    {
                      name: `panel${n}`,
                      title: `\u9762\u677f${n}`,
                      content: `\u9762\u677f${n}\u7684\u5185\u5bb9`,
                    },
                  ])
                }}
              >
                {'\u6dfb\u52a0\u9762\u677f'}
              </button>
            </div>
          )}

          {/* Validation rules */}
          {[ComponentType.INPUT, ComponentType.TEXTAREA, ComponentType.NUMBER_INPUT].includes(
            currentComponent.type,
          ) && (
            <div className={styles.section}>
              <h4>{'\u6821\u9a8c\u89c4\u5219'}</h4>
              {componentRules.map((rule, rIdx) => (
                <div key={rIdx} className={styles.actionCard}>
                  <div className={styles.actionCardHeader}>
                    <select
                      className={styles.select}
                      value={rule.type}
                      onChange={(e) =>
                        saveRules(
                          componentRules.map((r, i) =>
                            i === rIdx ? { ...r, type: e.target.value as RuleType } : r,
                          ),
                        )
                      }
                    >
                      <option value="required">{'\u5fc5\u586b'}</option>
                      {currentComponent.type !== ComponentType.NUMBER_INPUT && (
                        <>
                          <option value="minLength">{'\u6700\u5c0f\u957f\u5ea6'}</option>
                          <option value="maxLength">{'\u6700\u5927\u957f\u5ea6'}</option>
                        </>
                      )}
                      {currentComponent.type === ComponentType.NUMBER_INPUT && (
                        <>
                          <option value="min">{'\u6700\u5c0f\u503c'}</option>
                          <option value="max">{'\u6700\u5927\u503c'}</option>
                        </>
                      )}
                      {currentComponent.type === ComponentType.INPUT && (
                        <option value="pattern">{'\u6b63\u5219\u5339\u914d'}</option>
                      )}
                    </select>
                    <button
                      className={styles.miniBtn}
                      onClick={() => saveRules(componentRules.filter((_, i) => i !== rIdx))}
                    >
                      {'\u2212'}
                    </button>
                  </div>
                  {rule.type !== 'required' && (
                    <div className={styles.actionRow}>
                      <label>{rule.type === 'pattern' ? '\u6b63\u5219' : '\u6570\u503c'}</label>
                      <input
                        className={styles.input}
                        value={String(rule.value ?? '')}
                        onChange={(e) =>
                          saveRules(
                            componentRules.map((r, i) =>
                              i === rIdx
                                ? {
                                    ...r,
                                    value: ['minLength', 'maxLength', 'min', 'max'].includes(
                                      rule.type,
                                    )
                                      ? Number(e.target.value)
                                      : e.target.value,
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                    </div>
                  )}
                  <div className={styles.actionRow}>
                    <label>{'\u63d0\u793a\u8bed'}</label>
                    <input
                      className={styles.input}
                      value={rule.message ?? ''}
                      placeholder={'\u9ed8\u8ba4\u63d0\u793a'}
                      onChange={(e) =>
                        saveRules(
                          componentRules.map((r, i) =>
                            i === rIdx ? { ...r, message: e.target.value } : r,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              ))}
              <button
                className={styles.smallBtn}
                onClick={() =>
                  saveRules([...componentRules, { type: 'required' as RuleType, message: '' }])
                }
              >
                {'\u6dfb\u52a0\u89c4\u5219'}
              </button>
            </div>
          )}

          {/* Button events */}
          {currentComponent.type === ComponentType.BUTTON && (
            <div className={styles.section}>
              <h4>{'\u4ea4\u4e92\u4e8b\u4ef6'}</h4>
              {clickActions.map((action, aIdx) => (
                <div key={aIdx} className={styles.actionCard}>
                  <div className={styles.actionCardHeader}>
                    <select
                      className={styles.select}
                      value={action.type}
                      onChange={(e) => {
                        const updated = clickActions.map((a, i) =>
                          i === aIdx
                            ? ({ type: e.target.value as ActionType, params: {} } as ActionConfig)
                            : a,
                        )
                        saveClickActions(updated)
                      }}
                    >
                      <option value="alert">{'\u5f39\u51fa\u63d0\u793a'}</option>
                      <option value="link">{'\u8df3\u8f6c\u94fe\u63a5'}</option>
                      <option value="toggleVisible">
                        {'\u663e\u793a/\u9690\u85cf\u7ec4\u4ef6'}
                      </option>
                    </select>
                    <button
                      className={styles.miniBtn}
                      onClick={() => saveClickActions(clickActions.filter((_, i) => i !== aIdx))}
                    >
                      {'\u2212'}
                    </button>
                  </div>
                  {action.type === 'alert' && (
                    <div className={styles.actionRow}>
                      <label>{'\u6d88\u606f'}</label>
                      <input
                        className={styles.input}
                        value={action.params.message ?? ''}
                        onChange={(e) => {
                          const u = clickActions.map((a, i) =>
                            i === aIdx
                              ? { ...a, params: { ...a.params, message: e.target.value } }
                              : a,
                          )
                          saveClickActions(u)
                        }}
                      />
                    </div>
                  )}
                  {action.type === 'link' && (
                    <>
                      <div className={styles.actionRow}>
                        <label>URL</label>
                        <input
                          className={styles.input}
                          value={action.params.url ?? ''}
                          placeholder="https://"
                          onChange={(e) => {
                            const u = clickActions.map((a, i) =>
                              i === aIdx
                                ? { ...a, params: { ...a.params, url: e.target.value } }
                                : a,
                            )
                            saveClickActions(u)
                          }}
                        />
                      </div>
                      <div className={styles.actionRow}>
                        <label>{'\u6253\u5f00'}</label>
                        <select
                          className={styles.select}
                          value={String(action.params.openInNew ?? true)}
                          onChange={(e) => {
                            const u = clickActions.map((a, i) =>
                              i === aIdx
                                ? {
                                    ...a,
                                    params: { ...a.params, openInNew: e.target.value === 'true' },
                                  }
                                : a,
                            )
                            saveClickActions(u)
                          }}
                        >
                          <option value="true">{'\u65b0\u7a97\u53e3'}</option>
                          <option value="false">{'\u5f53\u524d\u7a97\u53e3'}</option>
                        </select>
                      </div>
                    </>
                  )}
                  {action.type === 'toggleVisible' && (
                    <>
                      <div className={styles.actionRow}>
                        <label>{'\u76ee\u6807'}</label>
                        <select
                          className={styles.select}
                          value={action.params.componentId ?? ''}
                          onChange={(e) => {
                            const u = clickActions.map((a, i) =>
                              i === aIdx
                                ? { ...a, params: { ...a.params, componentId: e.target.value } }
                                : a,
                            )
                            saveClickActions(u)
                          }}
                        >
                          {otherComponents.map((c) => (
                            <option
                              key={c.id}
                              value={c.id}
                            >{`${c.type} (${c.id.slice(-6)})`}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.actionRow}>
                        <label>{'\u64cd\u4f5c'}</label>
                        <select
                          className={styles.select}
                          value={action.params.operation ?? 'toggle'}
                          onChange={(e) => {
                            const u = clickActions.map((a, i) =>
                              i === aIdx
                                ? {
                                    ...a,
                                    params: {
                                      ...a.params,
                                      operation: e.target.value as 'toggle' | 'show' | 'hide',
                                    },
                                  }
                                : a,
                            )
                            saveClickActions(u)
                          }}
                        >
                          <option value="toggle">{'\u5207\u6362'}</option>
                          <option value="show">{'\u663e\u793a'}</option>
                          <option value="hide">{'\u9690\u85cf'}</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <button
                className={styles.smallBtn}
                onClick={() =>
                  saveClickActions([...clickActions, { type: 'alert', params: { message: '' } }])
                }
              >
                {'\u6dfb\u52a0\u52a8\u4f5c'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
