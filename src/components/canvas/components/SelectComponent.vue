<template>
  <div :style="wrapperStyle">
    <el-select
      :placeholder="component.props.placeholder ?? '请选择'"
      multiple
      collapse-tags
      collapse-tags-tooltip
      disabled
      style="width: 100%"
    >
      <el-option
        v-for="(label, idx) in options"
        :key="idx"
        :label="label"
        :value="String(idx)"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentData } from '@/types'

const props = defineProps<{ component: ComponentData }>()

const options = computed(
  () => (props.component.props.options as string[] | undefined) ?? [],
)

const wrapperStyle = computed(() => ({
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  backgroundColor: props.component.style.backgroundColor ?? '',
  borderRadius: props.component.style.borderRadius != null
    ? `${props.component.style.borderRadius}px`
    : '',
  overflow: 'hidden',
}))
</script>
