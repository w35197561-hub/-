<template>
  <div class="link-component" :style="wrapperStyle">
    <!-- 运行态：真实 <a> 标签，可正常跳转 -->
    <a
      v-if="isPreview"
      class="link-inner"
      :href="resolvedHref"
      :target="(component.props.target as string) || '_blank'"
    >
      {{ component.props.content ?? '' }}
    </a>
    <!-- 设计态：<span> 渲染，阻止跳转 -->
    <span v-else class="link-inner" @click.prevent>
      {{ component.props.content ?? '' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { Ref } from 'vue'
import type { ComponentData } from '@/types'
import { useComponentStyle } from './composables/useComponentStyle'

const props = defineProps<{
  component: ComponentData
}>()

const { baseStyle } = useComponentStyle(props.component.style)
const isPreview = inject<Ref<boolean>>('isPreview', ref(false))

const resolvedHref = computed(() => {
  const href = (props.component.props.href as string) || ''
  if (!href) return '#'
  return /^https?:\/\//i.test(href) ? href : `https://${href}`
})

const wrapperStyle = computed(() => ({
  ...baseStyle.value,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))
</script>

<style scoped>
.link-component {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.link-inner {
  text-decoration: underline;
  cursor: pointer;
  color: inherit;
  font-size: inherit;
}

a.link-inner {
  text-decoration: underline;
}
</style>
