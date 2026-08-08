<script setup>
defineProps({
  pages: { type: Array, required: true },
  activeId: { type: String, default: null },
});

const emit = defineEmits(['select', 'add', 'close']);

/** 顶部 "页面管理" tab 栏：左侧页面 tab，右上角新建页面按钮。 */
</script>

<template>
  <div class="ext-tabs">
    <div class="ext-tablist">
      <div
        v-for="page in pages"
        :key="page.id"
        class="ext-tab"
        :class="{ active: page.id === activeId }"
        @click="emit('select', page.id)"
      >
        <span class="ext-tab-title">{{ page.name }}</span>
        <span
          class="ext-tab-close"
          title="关闭页面"
          @click.stop="emit('close', page.id)"
        >×</span>
      </div>
    </div>
    <div class="ext-tabs-fill" />
    <button
      class="ext-btn ext-tab-add"
      title="新建页面"
      @click="emit('add')"
    >＋ 新建页面</button>
  </div>
</template>

<style scoped>
.ext-tabs {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
  height: 30px;
  box-sizing: border-box;
  padding: 3px 4px 0 4px;
  background: #dfe8f6;
  border-bottom: 1px solid #99bbe8;
  user-select: none;
}

.ext-tablist {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
  height: 100%;
}

.ext-tabs-fill {
  flex: 1 1 auto;
}

.ext-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 23px;
  padding: 0 4px 0 10px;
  box-sizing: border-box;
  font: 400 11px tahoma, arial, verdana, sans-serif;
  color: #000;
  background: #d0def0 url("/images/bejson/ico1/white-top-bottom.gif") repeat-x 0 -1px;
  border: 1px solid #99bbe8;
  border-bottom: 0 none;
  cursor: pointer;
  white-space: nowrap;
}
.ext-tab:hover {
  background-color: #e6eefc;
}
.ext-tab.active {
  background: #fff;
  color: #15428b;
  font-weight: bold;
  border-bottom-color: #fff;
}

.ext-tab-close {
  width: 14px;
  height: 14px;
  line-height: 13px;
  text-align: center;
  font-size: 12px;
  color: #808080;
  border-radius: 2px;
  cursor: pointer;
}
.ext-tab-close:hover {
  background: #c42b1c;
  color: #fff;
}

.ext-tab-add {
  flex: 0 0 auto;
  align-self: center;
  margin: 0 2px 3px 6px;
  height: 20px;
  padding: 0 8px;
  border: 1px solid #99bbe8;
  background: #d0def0 url("/images/bejson/ico1/white-top-bottom.gif") repeat-x 0 -1px;
  color: #15428b;
  font: bold 11px tahoma, arial, verdana, sans-serif;
  border-radius: 2px;
}
.ext-tab-add:hover {
  background-color: #e6eefc;
}
</style>
