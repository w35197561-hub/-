<template>
  <component :is="resolvedComponent" :component="component" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import type { ComponentData } from '@/types'
import { ComponentType } from '@/types'
import TextComponent from './TextComponent.vue'
import ImageComponent from './ImageComponent.vue'
import ButtonComponent from './ButtonComponent.vue'
import InputComponent from './InputComponent.vue'
import FormComponent from './FormComponent.vue'
import TabsComponent from './TabsComponent.vue'
import NumberInputComponent from './NumberInputComponent.vue'
import SelectComponent from './SelectComponent.vue'
import TextareaComponent from './TextareaComponent.vue'
import RadioGroupComponent from './RadioGroupComponent.vue'
import CheckboxGroupComponent from './CheckboxGroupComponent.vue'
import DividerComponent from './DividerComponent.vue'
import TimePickerComponent from './TimePickerComponent.vue'
import TableComponent from './TableComponent.vue'
import CollapseComponent from './CollapseComponent.vue'
import SwitchComponent from './SwitchComponent.vue'
import CascaderComponent from './CascaderComponent.vue'
import LinkComponent from './LinkComponent.vue'
import TreeComponent from './TreeComponent.vue'

const props = defineProps<{
  component: ComponentData
}>()

// 使用 ComponentType 枚举作为 key，确保类型安全，与枚举同步
const componentMap: Record<ComponentType, Component> = {
  [ComponentType.TEXT]: TextComponent,
  [ComponentType.IMAGE]: ImageComponent,
  [ComponentType.BUTTON]: ButtonComponent,
  [ComponentType.INPUT]: InputComponent,
  [ComponentType.FORM]: FormComponent,
  [ComponentType.CHART]: TextComponent, // Chart 组件占位，后续接入真实图表库
  [ComponentType.TABS]: TabsComponent,
  [ComponentType.NUMBER_INPUT]: NumberInputComponent,
  [ComponentType.SELECT]: SelectComponent,
  [ComponentType.TEXTAREA]: TextareaComponent,
  [ComponentType.RADIO_GROUP]: RadioGroupComponent,
  [ComponentType.CHECKBOX_GROUP]: CheckboxGroupComponent,
  [ComponentType.DIVIDER]: DividerComponent,
  [ComponentType.TIME_PICKER]: TimePickerComponent,
  [ComponentType.TABLE]: TableComponent,
  [ComponentType.COLLAPSE]: CollapseComponent,
  [ComponentType.SWITCH]: SwitchComponent,
  [ComponentType.CASCADER]: CascaderComponent,
  [ComponentType.LINK]: LinkComponent,
  [ComponentType.TREE]: TreeComponent,
}

const resolvedComponent = computed(() => componentMap[props.component.type] ?? TextComponent)
</script>
