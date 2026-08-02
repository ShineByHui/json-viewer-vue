<script setup>
import ExtButton from './ExtButton.vue';

/**
 * ExtJS 风格模态消息框。
 */
defineProps({
  data: { type: Object, required: true },
});
</script>

<template>
  <div class="ext-msgbox-overlay" @mousedown.stop>
    <div class="ext-msgbox">
      <div class="ext-msgbox-header">{{ data.title }}</div>
      <div class="ext-msgbox-body">{{ data.body }}</div>
      <div v-if="data.buttons && data.buttons.length > 0" class="ext-msgbox-bbar">
        <ExtButton v-for="(b, i) in data.buttons" :key="i" @click="b.onClick">
          {{ b.label }}
        </ExtButton>
      </div>
    </div>
  </div>
</template>
