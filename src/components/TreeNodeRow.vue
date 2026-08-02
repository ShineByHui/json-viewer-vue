<script setup>
import { ref, watch } from 'vue';

/**
 * 单个树节点行（递归组件）。对应源项目 JsonTree.tsx 中的 TreeNodeRow。
 */
const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  isLast: { type: Boolean, default: false },
  selectedId: { type: String, default: null },
  matchIds: { type: Array, default: () => [] },
  currentMatchId: { type: String, default: null },
});

const emit = defineEmits(['toggle', 'select', 'context-menu']);

/** 根据节点位置 + 状态决定肘线图标类名。 */
function elbowClass(node, isLast) {
  if (node.children.length === 0) {
    return isLast ? 'elbow-end' : 'elbow';
  }
  if (!node.expanded) {
    return isLast ? 'elbow-end-plus' : 'elbow-plus';
  }
  return isLast ? 'elbow-end-minus' : 'elbow-minus';
}

const rowEl = ref(null);

// 当前搜索命中项滚动到可视区域
watch(
  () => props.currentMatchId,
  (val) => {
    if (val === props.node.id) {
      rowEl.value?.scrollIntoView({ block: 'nearest' });
    }
  },
);
</script>

<template>
  <li class="ext-tree-node">
    <div
      ref="rowEl"
      class="ext-tree-row"
      :class="{ selected: selectedId === node.id }"
      @contextmenu.prevent="emit('context-menu', node, $event.clientX, $event.clientY)"
    >
      <span v-for="i in depth" :key="i" class="ext-tree-indent" />
      <span
        class="ext-tree-ec"
        :class="elbowClass(node, isLast)"
        aria-hidden="true"
        @click="emit('toggle', node.id)"
      />
      <span
        class="ext-tree-icon"
        :style='{ backgroundImage: `url("${node.icon}")` }'
        aria-hidden="true"
      />
      <a
        href="#"
        class="ext-tree-anchor"
        :class="{ match: matchIds.includes(node.id) }"
        @click.prevent="emit('select', node.id)"
      >
        {{ node.text }}
      </a>
    </div>
    <ul v-if="node.children.length > 0 && node.expanded" class="ext-tree-children">
      <TreeNodeRow
        v-for="(child, i) in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :is-last="i === node.children.length - 1"
        :selected-id="selectedId"
        :match-ids="matchIds"
        :current-match-id="currentMatchId"
        @toggle="emit('toggle', $event)"
        @select="emit('select', $event)"
        @context-menu="emit('context-menu', $event)"
      />
    </ul>
  </li>
</template>
