import styles from './NumberInput.module.css'

interface NumberInputProps {
  value: number | undefined
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  size?: 'small' | 'default'
}

export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  size = 'default',
}: NumberInputProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  return (
    <div className={`${styles.numberInput} ${size === 'small' ? styles.small : ''}`}>
      <button
        className={styles.btn}
        onClick={() => onChange(clamp((value ?? 0) - step))}
        disabled={(value ?? 0) <= min}
      >
        -
      </button>
      <input
        type="number"
        className={styles.input}
        value={value ?? ''}
        min={min === -Infinity ? undefined : min}
        max={max === Infinity ? undefined : max}
        step={step}
        onChange={(e) => {
          const v = e.target.value
          if (v === '') return
          onChange(clamp(Number(v)))
        }}
      />
      <button
        className={styles.btn}
        onClick={() => onChange(clamp((value ?? 0) + step))}
        disabled={(value ?? 0) >= max}
      >
        +
      </button>
    </div>
  )
}
