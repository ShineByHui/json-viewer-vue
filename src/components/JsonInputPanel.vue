<script setup>
import ExtButton from './ExtButton.vue';

defineProps({
  value: { type: String, default: '' },
});

const emit = defineEmits(['text-change', 'action']);

/** 左侧 "JSON数据" 面板：头部 + 工具栏（5 个按钮）+ 等宽字体 textarea。 */
</script>

<template>
  <div class="ext-panel h-full min-h-0">
    <div class="ext-panel-header">JSON数据</div>
    <div class="ext-panel-tbar">
      <div class="ext-toolbar">
        <ExtButton @click="emit('action', 'copy')">复制</ExtButton>
        <span class="ext-sep" />
        <ExtButton @click="emit('action', 'format')">格式化</ExtButton>
        <span class="ext-sep" />
        <ExtButton @click="emit('action', 'remove-space')">删除空格</ExtButton>
        <span class="ext-sep" />
        <ExtButton @click="emit('action', 'remove-space-escape')">
          删除空格并转义
        </ExtButton>
        <span class="ext-sep" />
        <ExtButton @click="emit('action', 'remove-escape')">去除转义</ExtButton>
      </div>
    </div>
    <div class="ext-panel-body" style="padding: 1px">
      <textarea
        id="edit"
        class="ext-textarea"
        :value="value"
        @input="emit('text-change', $event.target.value)"
        placeholder="将JSON数据粘贴到这里!"
        spellcheck="false"
      />
    </div>
  </div>
</template>
