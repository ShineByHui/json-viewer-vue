<script setup>
/**
 * ExtJS 风格右键上下文菜单。
 */
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  items: { type: Array, default: () => [] },
});

const emit = defineEmits(['action', 'close']);
</script>

<template>
  <div
    class="ext-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @mousedown.stop
  >
    <div v-for="(item, i) in items" :key="i">
      <div
        class="ext-menu-item"
        @click="
          emit('action', item.action);
          emit('close');
        "
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
