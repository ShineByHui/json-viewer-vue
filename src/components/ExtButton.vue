<script setup>
/**
 * 扁平工具栏按钮，还原 bejson JSON 查看器的 ExtJS 按钮。
 * 线上站点的 ExtJS btn sprite 404，所以按钮是纯文本。
 */
defineProps({
  /** 可选图标路径，渲染为左侧背景图 */
  icon: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  title: { type: String, default: null },
});
</script>

<template>
  <button
    type="button"
    class="ext-btn"
    :class="{ 'ext-btn-icon': icon }"
    :style='icon ? { backgroundImage: `url("${icon}")` } : undefined'
    :disabled="disabled"
    :title="title"
  >
    <slot />
  </button>
</template>
