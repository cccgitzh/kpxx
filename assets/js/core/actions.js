/**
 * 复制动作
 * 把"写剪贴板 + 给反馈"固定成一条路径，各处复制行为保持一致。
 */

import { writeText } from "./clipboard.js";
import { notify, flash } from "./feedback.js";

/**
 * 复制文本并给出反馈
 * @param {string} text
 * @param {string} message 成功提示语
 * @param {HTMLElement} [button] 触发按钮（会闪一下对勾）
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyTextWithFeedback(text, message, button) {
  try {
    await writeText(text);
  } catch (err) {
    notify("复制失败，请手动选择文本");
    return false;
  }
  notify(message);
  flash(button);
  return true;
}
