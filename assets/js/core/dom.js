/**
 * DOM 小工具
 * 只做一件事的薄封装，避免各模块重复写 createElement 样板代码。
 */

/**
 * 创建元素
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * 绑定事件并返回解绑函数
 * @param {EventTarget} target
 * @param {string} type
 * @param {EventListener} handler
 * @param {AddEventListenerOptions|boolean} [options]
 * @returns {() => void}
 */
export function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/**
 * 在一个容器范围内向上查找匹配元素，找不到则返回 null
 * @param {Element} root
 * @param {EventTarget|null} start
 * @param {string} selector
 * @returns {HTMLElement|null}
 */
export function closestIn(root, start, selector) {
  if (!(start instanceof Element)) return null;
  const hit = start.closest(selector);
  return hit && root.contains(hit) ? hit : null;
}
