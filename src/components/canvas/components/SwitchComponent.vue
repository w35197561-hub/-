<template>
  <div class="switch-wrapper">
    <!-- 设计态：禁用交互 -->
    <el-switch
      v-if="!isPreview"
      :model-value="component.props.value as boolean"
      :active-text="(component.props.activeText as string) ?? ''"
      :inactive-text="(component.props.inactiveText as string) ?? ''"
      :disabled="true"
    />
    <!-- 运行态：正常可交互 -->
    <el-switch
      v-else
      v-model="localValue"
      :active-text="(component.props.activeText as string) ?? ''"
      :inactive-text="(component.props.inactiveText as string) ?? ''"
      :disabled="component.props.disabled as boolean"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import type { Ref } from 'vue'
import type { ComponentData } from '@/types'

const props = defineProps<{ component: ComponentData }>()

const isPreview = inject<Ref<boolean>>('isPreview', ref(false))

const localValue = ref<boolean>((props.component.props.value as boolean) ?? false)
</script>

<style scoped>
.switch-wrapper {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
