<script setup>
/**
 * 右侧 "属性" 面板：ExtJS 风格 Name/Value 属性表格。
 */
defineProps({
  rows: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="ext-panel h-full min-h-0">
    <div class="ext-panel-header">属性</div>
    <div class="ext-panel-body" style="padding: 1px">
      <div class="ext-grid">
        <div class="ext-grid-header">
          <div class="ext-grid-hd sorted">
            Name<span class="sort-icon" />
          </div>
          <div class="ext-grid-hd">Value</div>
        </div>
        <div class="ext-grid-body">
          <div
            v-for="(row, i) in rows"
            :key="`${row.name}-${i}`"
            class="ext-grid-row"
            :class="{ alt: i % 2 === 1 }"
          >
            <div class="ext-grid-cell">{{ row.name }}</div>
            <div class="ext-grid-cell">{{ row.value }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
