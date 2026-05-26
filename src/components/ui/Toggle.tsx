import styles from './Toggle.module.css'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  activeText?: string
  inactiveText?: string
}

export function Toggle({ checked, onChange, disabled, activeText, inactiveText }: ToggleProps) {
  return (
    <label className={`${styles.toggle} ${disabled ? styles.disabled : ''}`}>
      {inactiveText && <span className={styles.label}>{inactiveText}</span>}
      <span
        className={`${styles.track} ${checked ? styles.active : ''}`}
        onClick={(e) => {
          e.preventDefault()
          if (!disabled) onChange(!checked)
        }}
      >
        <span className={styles.thumb} />
      </span>
      {activeText && <span className={styles.label}>{activeText}</span>}
    </label>
  )
}
