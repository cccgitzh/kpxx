/**
 * 底部操作条
 * 只负责按钮文案与事件绑定；具体做什么由调用方注入。
 */

import { on } from "../core/dom.js";
import { ICONS } from "./icons.js";

/**
 * @param {Document|HTMLElement} root
 * @param {{onText: Function, onImage: Function, onDownload: Function}} handlers
 */
export function createDock(root, handlers) {
  const buttons = [
    { node: root.querySelector("#btn-text"), icon: ICONS.text, label: "复制全文", handler: handlers.onText },
    { node: root.querySelector("#btn-image"), icon: ICONS.image, label: "复制图片", handler: handlers.onImage },
    { node: root.querySelector("#btn-download"), icon: ICONS.download, label: "下载图片", handler: handlers.onDownload },
  ];

  buttons.forEach(({ node, icon, label, handler }) => {
    if (!node) return;
    node.innerHTML = icon + "<span>" + label + "</span>";
    on(node, "click", handler);
  });
}
