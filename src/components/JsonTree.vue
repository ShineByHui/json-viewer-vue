<script setup>
import ExtButton from './ExtButton.vue';
import TreeNodeRow from './TreeNodeRow.vue';

/**
 * 中间 "视图" 面板：查找工具栏 + 递归 JSON 树。
 */
defineProps({
  root: { type: Object, required: true },
  selectedId: { type: String, default: null },
  searchTerm: { type: String, default: '' },
  matchIds: { type: Array, default: () => [] },
  currentMatchId: { type: String, default: null },
});

const emit = defineEmits([
  'search-change',
  'search-go',
  'next-match',
  'prev-match',
  'toggle',
  'select',
  'expand-all',
  'collapse-all',
  'about',
  'context-menu',
]);
</script>

<template>
  <div class="ext-panel h-full min-h-0">
    <div class="ext-panel-header">视图</div>
    <div class="ext-panel-tbar">
      <div class="ext-toolbar">
        <span class="ext-tbtext">查找:</span>
        <input
          class="ext-field"
          style="width: 133px"
          :value="searchTerm"
          @input="emit('search-change', $event.target.value)"
          @keydown.enter="emit('search-go')"
        />
        <ExtButton @click="emit('search-go')">GO!</ExtButton>
        <ExtButton
          icon="/images/bejson/jsonview/ico1/arrow_down.png"
          @click="emit('next-match')"
        >
          下一个
        </ExtButton>
        <ExtButton
          icon="/images/bejson/jsonview/ico1/arrow_up.png"
          @click="emit('prev-match')"
        >
          上一个
        </ExtButton>
        <span class="ext-sep" />
        <ExtButton @click="emit('expand-all')">全部展开</ExtButton>
        <ExtButton @click="emit('collapse-all')">全部收缩</ExtButton>
        <span class="ext-tbfill" />
        <ExtButton @click="window.location.href = 'https://www.bejson.com'">
          回到首页
        </ExtButton>
        <ExtButton @click="emit('about')">关于</ExtButton>
      </div>
    </div>
    <div class="ext-panel-body" style="padding: 1px">
      <div class="ext-tree">
        <ul class="ext-tree-children" style="padding: 0; margin: 0">
          <TreeNodeRow
            :node="root"
            :depth="0"
            :is-last="true"
            :selected-id="selectedId"
            :match-ids="matchIds"
            :current-match-id="currentMatchId"
            @toggle="emit('toggle', $event)"
            @select="emit('select', $event)"
            @context-menu="emit('context-menu', $event)"
          />
        </ul>
      </div>
    </div>
  </div>
</template>
