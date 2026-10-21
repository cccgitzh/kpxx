/**
 * 操作反馈：底部提示条 + 按钮对勾
 * 所有"复制成功 / 失败"的视觉反馈都走这里，保证节奏一致。
 */

import { ICONS } from "../ui/icons.js";

const TOAST_DURATION = 1800;
const FLASH_DURATION = 1300;

let toastNode = null;
let hideTimer = 0;

/**
 * 显示一条提示
 * @param {string} message
 */
export function notify(message) {
  if (!toastNode) toastNode = document.getElementById("toast");
  if (!toastNode) return;
  toastNode.textContent = message;
  toastNode.setAttribute("data-show", "true");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => toastNode.setAttribute("data-show", "false"), TOAST_DURATION);
}

/**
 * 让按钮短暂变成对勾，表示"这一下确实复制了"
 * 用 busy 标记避免连点时把对勾当成原始内容记录。
 * @param {HTMLElement|null} button
 */
export function flash(button) {
  if (!button || button.dataset.busy === "1") return;

  const original = button.innerHTML;
  button.dataset.busy = "1";
  button.innerHTML = ICONS.done;
  button.setAttribute("data-done", "true");

  setTimeout(() => {
    button.innerHTML = original;
    button.removeAttribute("data-done");
    delete button.dataset.busy;
  }, FLASH_DURATION);
}
