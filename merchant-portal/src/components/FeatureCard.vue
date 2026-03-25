<script setup lang="ts">
import ToggleSwitch from './ToggleSwitch.vue'

const props = defineProps<{
  name: string
  description: string
  enabled: boolean
}>()

const emit = defineEmits<{
  toggle: [value: boolean]
}>()
</script>

<template>
  <div class="feature-card" :class="{ enabled: props.enabled }">
    <div class="feature-header">
      <div class="feature-icon">
        <slot name="icon" />
      </div>
      <div class="feature-info">
        <div class="feature-name">{{ props.name }}</div>
        <div class="feature-desc">{{ props.description }}</div>
      </div>
      <div class="toggle-wrap">
        <ToggleSwitch
          :model-value="props.enabled"
          @update:model-value="emit('toggle', $event as boolean)"
        />
      </div>
    </div>
    <div v-if="props.enabled" class="feature-expand">
      <slot />
    </div>
  </div>
</template>
