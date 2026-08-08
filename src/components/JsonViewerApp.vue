<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import JsonInputPanel from './JsonInputPanel.vue';
import JsonTree from './JsonTree.vue';
import PropertiesGrid from './PropertiesGrid.vue';
import MessageBox from './MessageBox.vue';
import ContextMenu from './ContextMenu.vue';
import PageTabs from './PageTabs.vue';
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

// 全局（跨页面共享）弹窗状态
const message = ref(null);
const menu = ref(null);
const menuItems = ref([]);
const toast = ref(null);
let toastTimer = null;

// ---- 页面管理：每个页面持有自己的 JSON 编辑状态 ----
let pageSeq = 0;
function createPage(name) {
  pageSeq += 1;
  return {
    id: `page-${pageSeq}`,
    name: name || `页面 ${pageSeq}`,
    inputText: '',
    root: buildRoot(null),
    selectedId: null,
    searchTerm: '',
    matches: [],
    matchIndex: -1,
  };
}

const pages = ref([createPage()]);
const activePageId = ref(pages.value[0].id);

const activePage = computed(
  () => pages.value.find((p) => p.id === activePageId.value) ?? pages.value[0]
);

function selectPage(id) {
  activePageId.value = id;
}

function addPage() {
  const page = createPage();
  pages.value.push(page);
  activePageId.value = page.id;
}

function closePage(id) {
  const idx = pages.value.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const wasActive = activePageId.value === id;
  pages.value.splice(idx, 1);
  // 至少保留一个页面
  if (pages.value.length === 0) {
    pages.value.push(createPage());
  }
  if (wasActive) {
    activePageId.value = pages.value[Math.min(idx, pages.value.length - 1)].id;
  }
}

const selectedNode = computed(() =>
  activePage.value.selectedId
    ? findById(activePage.value.root, activePage.value.selectedId)
    : null
);
const gridRows = computed(() => getGridRows(selectedNode.value));

const matchIds = computed(() => activePage.value.matches.map((m) => m.id));
const currentMatchId = computed(() =>
  activePage.value.matchIndex >= 0
    ? (activePage.value.matches[activePage.value.matchIndex]?.id ?? null)
    : null
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
  const page = activePage.value;
  try {
    const parsed = parseJson(page.inputText);
    // 美化源文本（2 空格缩进，保留数字字面量）。
    page.inputText = formatJsonText(page.inputText);
    const newRoot = buildRoot(parsed);
    page.root = newRoot;
    page.selectedId = newRoot.id;
    page.matches = [];
    page.matchIndex = -1;
    page.searchTerm = '';
  } catch {
    message.value = {
      title: '提示',
      body: 'JSON 错误',
      buttons: [{ label: 'OK', onClick: () => (message.value = null) }],
    };
  }
}

function handleAction(action) {
  const page = activePage.value;
  switch (action) {
    case 'copy':
      copyText(page.inputText, '复制成功');
      break;
    case 'format':
      handleFormat();
      break;
    case 'remove-space':
      page.inputText = page.inputText.replace(/\s+/g, '');
      break;
    case 'remove-space-escape':
      page.inputText = JSON.stringify(page.inputText.replace(/\s+/g, ''));
      break;
    case 'remove-escape': {
      page.inputText = (() => {
        try {
          const v = JSON.parse(page.inputText);
          return typeof v === 'string' ? v : page.inputText;
        } catch {
          return page.inputText.replace(/\\(["\\/bfnrt])/g, '$1');
        }
      })();
      break;
    }
    case 'expand-all':
      page.root = expandAll(page.root);
      break;
    case 'collapse-all':
      page.root = collapseAll(page.root);
      break;
  }
}

function handleToggle(id) {
  const page = activePage.value;
  page.root = page.root ? toggleNode(page.root, id) : page.root;
}

function handleSelect(id) {
  activePage.value.selectedId = id;
}

function runSearch(term, startFrom) {
  const page = activePage.value;
  const results = searchNodes(page.root, term);
  page.matches = results;
  if (results.length === 0) {
    page.matchIndex = -1;
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
  page.root = mapNode(page.root, (n) =>
    subtreeMatches(n, term) ? { ...n, expanded: true } : n
  );
  const idx = startFrom >= 0 ? startFrom : 0;
  page.matchIndex = idx;
  page.selectedId = results[idx].id;
}

function handleSearchGo() {
  runSearch(activePage.value.searchTerm.trim(), 0);
}

function handleNextMatch() {
  const page = activePage.value;
  if (page.matches.length === 0) return;
  const idx = (page.matchIndex + 1) % page.matches.length;
  page.matchIndex = idx;
  page.selectedId = page.matches[idx].id;
}

function handlePrevMatch() {
  const page = activePage.value;
  if (page.matches.length === 0) return;
  const idx = (page.matchIndex - 1 + page.matches.length) % page.matches.length;
  page.matchIndex = idx;
  page.selectedId = page.matches[idx].id;
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
      activePage.value.root = setNodeExpanded(
        activePage.value.root,
        menu.value.node.id,
        true
      );
      break;
    case 'collapse-children':
      activePage.value.root = setNodeExpanded(
        activePage.value.root,
        menu.value.node.id,
        false
      );
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
  <div class="flex h-full min-h-0 flex-col">
    <PageTabs
      :pages="pages"
      :active-id="activePageId"
      @select="selectPage"
      @add="addPage"
      @close="closePage"
    />
    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <div class="h-[40vh] md:h-full md:w-[400px]">
        <JsonInputPanel
          :value="activePage.inputText"
          @text-change="activePage.inputText = $event"
          @action="handleAction"
        />
      </div>
      <div class="ext-split hidden md:block" />
      <div class="flex h-[45vh] min-w-0 flex-1 flex-col md:h-full">
        <div class="min-h-0 flex-1">
          <JsonTree
            :root="activePage.root"
            :selected-id="activePage.selectedId"
            :search-term="activePage.searchTerm"
            :match-ids="matchIds"
            :current-match-id="currentMatchId"
            @search-change="activePage.searchTerm = $event"
            @search-go="handleSearchGo"
            @next-match="handleNextMatch"
            @prev-match="handlePrevMatch"
            @toggle="handleToggle"
            @select="handleSelect"
            @expand-all="activePage.root = expandAll(activePage.root)"
            @collapse-all="activePage.root = collapseAll(activePage.root)"
            @about="handleAbout"
            @context-menu="openContextMenu"
          />
        </div>
      </div>
      <div class="ext-split hidden md:block" />
      <div class="h-[30vh] md:h-full md:w-[300px]">
        <PropertiesGrid :rows="gridRows" />
      </div>
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
