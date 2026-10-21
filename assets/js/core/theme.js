/**
 * 设计令牌读取
 * --------------------------------------------------------------------------
 * 颜色、字体只写在 CSS 里（tokens.css），JS 侧（尤其是 Canvas 出图）按需读取，
 * 避免同一份色值在 CSS 与 JS 中各维护一遍而走样。
 * 结果按变量名缓存，首次读取后无额外开销。
 */

const cache = new Map();
const fallbacks = {
  "--c-ink": "#0a0a0a",
  "--c-text": "#1a1a1a",
  "--c-muted": "#9a9a9a",
  "--c-muted-2": "#8a8a8a",
  "--c-line": "#f0f0f0",
  "--c-line-strong": "#e4e4e4",
  "--font-sans": "sans-serif",
  "--font-mono": "monospace",
  "--c-tone-one": "#1266e3",
  "--c-tone-two": "#12a94b",
  "--c-tone-thr": "#f39200",
};

/**
 * 读取一个 CSS 自定义属性的计算值
 * @param {string} name 形如 "--c-ink"
 * @returns {string}
 */
export function token(name) {
  if (cache.has(name)) return cache.get(name);
  let value = "";
  try {
    value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  } catch (err) {
    value = "";
  }
  if (!value) value = fallbacks[name] || "";
  cache.set(name, value);
  return value;
}

/**
 * 区块序号色，key 对应 tokens.css 中的 --c-tone-*
 * @param {"one"|"two"|"thr"} key
 * @returns {string}
 */
export function toneColor(key) {
  return token("--c-tone-" + key) || token("--c-tone-one");
}
