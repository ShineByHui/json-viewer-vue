/**
 * JSON 树查看器的数据逻辑 —— 移植自源项目 src/lib/json.ts。
 * 渲染已解析 JSON 为可折叠节点层级，还原原 ExtJS `jsonviewercn_encode.js` 的行为。
 */

let nodeSeq = 0;

const ICONS = {
  object: "/images/bejson/jsonview/ico1/object.gif",
  array: "/images/bejson/jsonview/ico1/array.gif",
  string: "/images/bejson/jsonview/ico1/blue.gif",
  number: "/images/bejson/jsonview/ico1/green.gif",
  boolean: "/images/bejson/jsonview/ico1/yellow.gif",
  null: "/images/bejson/jsonview/ico1/red.gif",
  function: "/images/bejson/jsonview/ico1/red.gif",
};

export function detectType(value) {
  if (value === null) return "null";
  if (value === undefined) return "null";
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  if (t === "function") return "function";
  if (t === "object") return "object";
  return "string";
}

function nextId() {
  nodeSeq += 1;
  return `node-${nodeSeq}`;
}

/** 转义字符串值，用于引号内显示。 */
function escapeString(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function valueLabel(value, type) {
  switch (type) {
    case "string":
      return `"${escapeString(value)}"`;
    case "null":
      return "null";
    case "function":
      return "function";
    default:
      return String(value);
  }
}

/** 根据 key（或下标）与 value 构造节点的显示文本。 */
function nodeText(key, value, type) {
  const k = key === null ? "" : key;
  if (type === "object" || type === "array") return k;
  return `${k} : ${valueLabel(value, type)}`;
}

function buildChildren(value, type) {
  const out = [];
  if (type === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.push(makeNode(k, v));
    }
  } else if (type === "array") {
    value.forEach((v, i) => {
      out.push(makeNode(String(i), v));
    });
  }
  return out;
}

export function makeNode(key, value, expanded = false) {
  const type = detectType(value);
  const children = type === "object" || type === "array" ? buildChildren(value, type) : [];
  const isLeaf = children.length === 0;
  return {
    id: nextId(),
    key,
    text: nodeText(key, value, type),
    type,
    value,
    icon: ICONS[type],
    children,
    isLeaf,
    expanded,
  };
}

/** 构造合成根节点（"JSON"），包裹已解析值。 */
export function buildRoot(value) {
  const type = detectType(value);
  const children =
    type === "object" || type === "array" ? buildChildren(value, type) : [];
  return {
    id: nextId(),
    key: null,
    text: "JSON",
    type,
    value,
    icon: ICONS.object,
    children,
    isLeaf: children.length === 0,
    expanded: false,
  };
}

/**
 * 计算选中节点对应的属性表格行。
 * 对象/数组列出其子项（key → value）；叶子节点列出自身。
 * 原 PropertyGrid 对 Name 列升序排序（数字感知，保证数组下标自然有序）。
 */
export function getGridRows(node) {
  if (!node) return [];
  if (node.type === "object" || node.type === "array") {
    return node.children
      .map((c) => ({
        name: c.key ?? "",
        value: c.type === "object" || c.type === "array" ? "..." : valueLabel(c.value, c.type),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  }
  return [{ name: node.key ?? "", value: valueLabel(node.value, node.type) }];
}

/** 解析原始文本为 JSON；无效时抛错。 */
export function parseJson(text) {
  const cleaned = text.trim();
  if (!cleaned) throw new Error("empty");
  return JSON.parse(cleaned);
}

/**
 * 以 2 空格缩进美化 JSON 文本，同时保留数字字面量原样
 * （尾随零、指数、大整数）—— 原站用 bignumber.js 实现，`1.50` 输出仍是 `1.50`。
 * 标准的 `JSON.stringify` 会归一化它们，与目标站点不一致。无效 JSON 抛错。
 */
export function formatJsonText(source) {
  const src = source.trim();
  if (!src) throw new Error("empty");
  let pos = 0;
  const len = src.length;

  const pad = (n) => "  ".repeat(n);

  function skipWs() {
    while (pos < len && /\s/.test(src[pos])) pos++;
  }

  function parseString() {
    pos++; // consume opening quote
    let result = "";
    while (pos < len) {
      const ch = src[pos];
      if (ch === '"') {
        pos++;
        return result;
      }
      if (ch === "\\") {
        const esc = src[pos + 1];
        pos += 2;
        switch (esc) {
          case '"': result += '"'; break;
          case "\\": result += "\\"; break;
          case "/": result += "/"; break;
          case "b": result += "\b"; break;
          case "f": result += "\f"; break;
          case "n": result += "\n"; break;
          case "r": result += "\r"; break;
          case "t": result += "\t"; break;
          case "u":
            result += String.fromCharCode(parseInt(src.slice(pos, pos + 4), 16));
            pos += 4;
            break;
          default:
            throw new Error("bad escape");
        }
      } else {
        result += ch;
        pos++;
      }
    }
    throw new Error("bad string");
  }

  /** 原样捕获源中的数字字面量。 */
  function parseNumber() {
    const start = pos;
    if (src[pos] === "-") pos++;
    while (pos < len && /[\d.]/.test(src[pos])) pos++;
    if (pos < len && /[eE]/.test(src[pos])) {
      pos++;
      if (pos < len && /[+-]/.test(src[pos])) pos++;
      while (pos < len && /\d/.test(src[pos])) pos++;
    }
    const literal = src.slice(start, pos);
    if (!isFinite(Number(literal))) throw new Error("bad number");
    return literal;
  }

  function parseValue(depth) {
    skipWs();
    if (pos >= len) throw new Error("bad json");
    const ch = src[pos];
    if (ch === '"') return JSON.stringify(parseString());
    if (ch === "{") return parseObject(depth);
    if (ch === "[") return parseArray(depth);
    if (ch === "-" || /\d/.test(ch)) return parseNumber();
    for (const lit of ["true", "false", "null"]) {
      if (src.startsWith(lit, pos)) {
        pos += lit.length;
        return lit;
      }
    }
    throw new Error("bad json");
  }

  function parseObject(depth) {
    pos++; // {
    skipWs();
    if (src[pos] === "}") {
      pos++;
      return "{}";
    }
    const parts = [];
    while (true) {
      skipWs();
      if (src[pos] !== '"') throw new Error("bad key");
      const key = parseString();
      skipWs();
      if (src[pos] !== ":") throw new Error("missing colon");
      pos++;
      parts.push(`${JSON.stringify(key)}: ${parseValue(depth + 1)}`);
      skipWs();
      if (src[pos] === ",") {
        pos++;
        continue;
      }
      if (src[pos] === "}") {
        pos++;
        break;
      }
      throw new Error("bad object");
    }
    return (
      "{\n" + parts.map((p) => pad(depth + 1) + p).join(",\n") + "\n" + pad(depth) + "}"
    );
  }

  function parseArray(depth) {
    pos++; // [
    skipWs();
    if (src[pos] === "]") {
      pos++;
      return "[]";
    }
    const parts = [];
    while (true) {
      parts.push(parseValue(depth + 1));
      skipWs();
      if (src[pos] === ",") {
        pos++;
        continue;
      }
      if (src[pos] === "]") {
        pos++;
        break;
      }
      throw new Error("bad array");
    }
    return (
      "[\n" + parts.map((p) => pad(depth + 1) + p).join(",\n") + "\n" + pad(depth) + "]"
    );
  }

  skipWs();
  const result = parseValue(0);
  skipWs();
  if (pos < len) throw new Error("trailing content");
  return result;
}

/** 深度优先展平所有节点（含隐藏节点），用于搜索 / 全部展开。 */
export function flatten(node, acc = []) {
  acc.push(node);
  for (const child of node.children) flatten(child, acc);
  return acc;
}

/** 查找文本包含 `term` 的节点（不区分大小写）。 */
export function searchNodes(root, term) {
  const q = term.toLowerCase();
  if (!q) return [];
  return flatten(root).filter((n) => n.text.toLowerCase().includes(q));
}

/** 子树内是否有文本匹配该词（用于行高亮）。 */
export function subtreeMatches(node, term) {
  return flatten(node).some((n) => n.text.toLowerCase().includes(term.toLowerCase()));
}

/** 获取节点原始 key + value，用于右键菜单复制操作。 */
export function nodeKeyValue(node) {
  const key = node.key ?? "";
  const raw =
    typeof node.value === "object" && node.value !== null
      ? JSON.stringify(node.value)
      : String(node.value);
  return { key, value: raw };
}

/** 不可变遍历树；`fn` 返回节点的替换值。 */
export function mapNode(node, fn) {
  const next = fn(node);
  return { ...next, children: next.children.map((c) => mapNode(c, fn)) };
}

/** 按 id 切换节点展开状态（不可变）。 */
export function toggleNode(root, id) {
  return mapNode(root, (n) => (n.id === id ? { ...n, expanded: !n.expanded } : n));
}

/** 按 id 设置单个节点的展开状态（不可变）。 */
export function setNodeExpanded(root, id, expanded) {
  return mapNode(root, (n) => (n.id === id ? { ...n, expanded } : n));
}

/** 展开全部节点。 */
export function expandAll(root) {
  return mapNode(root, (n) => ({
    ...n,
    expanded: n.children.length > 0 ? true : n.expanded,
  }));
}

/** 收起全部节点。 */
export function collapseAll(root) {
  return mapNode(root, (n) => ({ ...n, expanded: false }));
}

/** 按 id 查找节点（含隐藏节点）。 */
export function findById(node, id) {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
}
