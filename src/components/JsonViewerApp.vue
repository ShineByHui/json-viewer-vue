<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import JsonInputPanel from './JsonInputPanel.vue';
import JsonTree from './JsonTree.vue';
import PropertiesGrid from './PropertiesGrid.vue';
import MessageBox from './MessageBox.vue';
import ContextMenu from './ContextMenu.vue';
import {
  buildRoot,
  parseJson,
  formatJsonText,
  getGridRows,
  searchNodes,
  subtreeMatches,
  mapNode,
  toggleNode,
  setNodeExpanded,
  expandAll,
  collapseAll,
  nodeKeyValue,
  findById,
} from '../lib/json.js';

const ABOUT_TEXT = '如果觉得好用,请按Ctrl+D收藏！谢谢！';

const inputText = ref('');
const root = ref(buildRoot(null));
const selectedId = ref(null);
const searchTerm = ref('');
const matches = ref([]);
const matchIndex = ref(-1);
const message = ref(null);
const menu = ref(null);
const menuItems = ref([]);
const toast = ref(null);
let toastTimer = null;

const selectedNode = computed(() =>
  selectedId.value ? findById(root.value, selectedId.value) : null
);
const gridRows = computed(() => getGridRows(selectedNode.value));

const matchIds = computed(() => matches.value.map((m) => m.id));
const currentMatchId = computed(() =>
  matchIndex.value >= 0 ? (matches.value[matchIndex.value]?.id ?? null) : null
);

function showToast(text) {
  toast.value = { text, key: Date.now() };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 1600);
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
  } catch {
    showToast('复制失败，请手动复制');
  }
}

function handleFormat() {
  try {
    const parsed = parseJson(inputText.value);
    // 美化源文本（2 空格缩进，保留数字字面量）。
    inputText.value = formatJsonText(inputText.value);
    const newRoot = buildRoot(parsed);
    root.value = newRoot;
    selectedId.value = newRoot.id;
    matches.value = [];
    matchIndex.value = -1;
    searchTerm.value = '';
  } catch {
    message.value = {
      title: '提示',
      body: 'JSON 错误',
      buttons: [{ label: 'OK', onClick: () => (message.value = null) }],
    };
  }
}

function handleAction(action) {
  switch (action) {
    case 'copy':
      copyText(inputText.value, '复制成功');
      break;
    case 'format':
      handleFormat();
      break;
    case 'remove-space':
      inputText.value = inputText.value.replace(/\s+/g, '');
      break;
    case 'remove-space-escape':
      inputText.value = JSON.stringify(inputText.value.replace(/\s+/g, ''));
      break;
    case 'remove-escape': {
      inputText.value = (() => {
        try {
          const v = JSON.parse(inputText.value);
          return typeof v === 'string' ? v : inputText.value;
        } catch {
          return inputText.value.replace(/\\(["\\/bfnrt])/g, '$1');
        }
      })();
      break;
    }
    case 'expand-all':
      root.value = expandAll(root.value);
      break;
    case 'collapse-all':
      root.value = collapseAll(root.value);
      break;
  }
}

function handleToggle(id) {
  root.value = root.value ? toggleNode(root.value, id) : root.value;
}

function handleSelect(id) {
  selectedId.value = id;
}

function runSearch(term, startFrom) {
  const results = searchNodes(root.value, term);
  matches.value = results;
  if (results.length === 0) {
    matchIndex.value = -1;
    if (term.trim()) {
      message.value = {
        title: '提示',
        body: 'Phrase not found!',
        buttons: [{ label: 'OK', onClick: () => (message.value = null) }],
      };
    }
    return;
  }
  // 展开包含匹配的分支，让命中项可见。
  root.value = mapNode(root.value, (n) =>
    subtreeMatches(n, term) ? { ...n, expanded: true } : n
  );
  const idx = startFrom >= 0 ? startFrom : 0;
  matchIndex.value = idx;
  selectedId.value = results[idx].id;
}

function handleSearchGo() {
  runSearch(searchTerm.value.trim(), 0);
}

function handleNextMatch() {
  if (matches.value.length === 0) return;
  const idx = (matchIndex.value + 1) % matches.value.length;
  matchIndex.value = idx;
  selectedId.value = matches.value[idx].id;
}

function handlePrevMatch() {
  if (matches.value.length === 0) return;
  const idx = (matchIndex.value - 1 + matches.value.length) % matches.value.length;
  matchIndex.value = idx;
  selectedId.value = matches.value[idx].id;
}

function handleAbout() {
  message.value = {
    title: '关于',
    body: ABOUT_TEXT,
    buttons: [{ label: 'OK', onClick: () => (message.value = null) }],
  };
}

function handleContextAction(action) {
  if (!menu.value) return;
  const { key, value } = nodeKeyValue(menu.value.node);
  switch (action) {
    case 'copy-key':
      copyText(key, 'Key 复制成功');
      break;
    case 'copy-value':
      copyText(value, '复制成功');
      break;
    case 'copy-key-value':
      copyText(`${key}: ${value}`, '复制成功');
      break;
    case 'expand-children':
      root.value = setNodeExpanded(root.value, menu.value.node.id, true);
      break;
    case 'collapse-children':
      root.value = setNodeExpanded(root.value, menu.value.node.id, false);
      break;
  }
}

function openContextMenu(node, x, y) {
  const items = [
    { label: '复制Key', action: 'copy-key' },
    { label: '复制Value', action: 'copy-value' },
    { label: '复制Key+Value', action: 'copy-key-value' },
  ];
  if (!node.isLeaf) {
    items.push(
      { label: '展开所有子节点', action: 'expand-children' },
      { label: '收起所有子节点', action: 'collapse-children' }
    );
  }
  menuItems.value = items;
  menu.value = { node, x, y };
}

// 点击菜单外区域关闭右键菜单
function closeMenu() {
  menu.value = null;
}
watch(
  () => menu.value,
  (val) => {
    if (val) window.addEventListener('click', closeMenu);
    else window.removeEventListener('click', closeMenu);
  },
);
onUnmounted(() => window.removeEventListener('click', closeMenu));
</script>

<template>
  <div class="flex h-full min-h-0 flex-col md:flex-row">
    <div class="h-[40vh] md:h-full md:w-[400px]">
      <JsonInputPanel
        :value="inputText"
        @text-change="inputText = $event"
        @action="handleAction"
      />
    </div>
    <div class="ext-split hidden md:block" />
    <div class="flex h-[45vh] min-w-0 flex-1 flex-col md:h-full">
      <div class="min-h-0 flex-1">
        <JsonTree
          :root="root"
          :selected-id="selectedId"
          :search-term="searchTerm"
          :match-ids="matchIds"
          :current-match-id="currentMatchId"
          @search-change="searchTerm = $event"
          @search-go="handleSearchGo"
          @next-match="handleNextMatch"
          @prev-match="handlePrevMatch"
          @toggle="handleToggle"
          @select="handleSelect"
          @expand-all="root = expandAll(root)"
          @collapse-all="root = collapseAll(root)"
          @about="handleAbout"
          @context-menu="openContextMenu"
        />
      </div>
    </div>
    <div class="ext-split hidden md:block" />
    <div class="h-[30vh] md:h-full md:w-[300px]">
      <PropertiesGrid :rows="gridRows" />
    </div>

    <MessageBox v-if="message" :data="message" />

    <ContextMenu
      v-if="menu"
      :x="menu.x"
      :y="menu.y"
      :items="menuItems"
      @action="handleContextAction"
      @close="menu = null"
    />

    <div
      v-if="toast"
      :key="toast.key"
      class="ext-msgbox-body"
      style="
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1200;
        background: #f1f1f1;
        border: 1px solid #99bbe8;
        box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
        padding: 8px 16px;
      "
    >
      {{ toast.text }}
    </div>
  </div>
</template>
