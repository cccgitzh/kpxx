/**
 * 公司面板
 * --------------------------------------------------------------------------
 * 一家公司 = 一个独立 <section role="tabpanel">，内部结构与数据一一对应。
 * 复制按钮用事件委托（整面板 1 个监听），通过 data-block / data-row 回到模型取值，
 * 既避免 N 个监听器，也避免把账号等原始数字写进 DOM 属性。
 */

import { el, on, closestIn } from "../core/dom.js";
import { toneColor } from "../core/theme.js";
import { copyTextWithFeedback } from "../core/actions.js";
import { blockText } from "../model/texts.js";
import { ICONS } from "./icons.js";

/**
 * 单行
 * @param {{label: string, text: string, mono: boolean}} row
 * @param {number} blockIndex
 * @param {number} rowIndex
 */
function buildRow(row, blockIndex, rowIndex) {
  const wrapper = el("div", "row");
  wrapper.appendChild(el("span", "row__k", row.label));
  wrapper.appendChild(el("span", "row__v" + (row.mono ? " row__v--mono" : ""), row.text));

  const button = el("button", "row__copy");
  button.type = "button";
  button.dataset.block = String(blockIndex);
  button.dataset.row = String(rowIndex);
  button.title = "复制" + row.label;
  button.setAttribute("aria-label", "复制" + row.label);
  button.innerHTML = ICONS.copy;
  wrapper.appendChild(button);

  return wrapper;
}

/**
 * 单个区块
 * @param {{index: string, title: string, tone: string, rows: Array}} block
 * @param {number} blockIndex
 */
function buildBlock(block, blockIndex) {
  const section = el("section", "block");
  section.style.setProperty("--tone", toneColor(block.tone));

  const head = el("div", "block__head");
  head.appendChild(el("span", "block__index", block.index));
  head.appendChild(el("h2", "block__name", block.title));
  head.appendChild(el("span", "block__rule"));

  const copyButton = el("button", "block__copy");
  copyButton.type = "button";
  copyButton.dataset.block = String(blockIndex);
  copyButton.title = "复制「" + block.title + "」整块";
  copyButton.setAttribute("aria-label", "复制「" + block.title + "」整块");
  copyButton.innerHTML = ICONS.copy + "<span>复制</span>";
  head.appendChild(copyButton);

  section.appendChild(head);

  const body = el("div", "block__body");
  const fragment = document.createDocumentFragment();
  block.rows.forEach((row, rowIndex) => {
    fragment.appendChild(buildRow(row, blockIndex, rowIndex));
  });
  body.appendChild(fragment);
  section.appendChild(body);

  return section;
}

/**
 * 创建一家公司的面板（构建时即 hidden，由 main.js 控制显隐）
 * @param {object} company 模型
 * @returns {HTMLElement}
 */
export function createPanel(company) {
  const panel = el("section", "sheet");
  panel.id = "panel-" + company.id;
  panel.dataset.company = company.id;
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", "tab-" + company.id);
  panel.tabIndex = 0;
  panel.hidden = true;

  const head = el("div", "sheet__head");
  head.appendChild(el("h1", "sheet__title", company.fullName));
  head.appendChild(el("p", "sheet__sub", company.subtitle));
  panel.appendChild(head);

  const blocks = document.createDocumentFragment();
  company.blocks.forEach((block, blockIndex) => {
    blocks.appendChild(buildBlock(block, blockIndex));
  });
  panel.appendChild(blocks);

  panel.appendChild(el("p", "sheet__foot", company.footer));

  /* 一次委托处理整块复制与单行复制 */
  on(panel, "click", (event) => {
    const blockButton = closestIn(panel, event.target, ".block__copy");
    if (blockButton) {
      const block = company.blocks[Number(blockButton.dataset.block)];
      if (block) copyTextWithFeedback(blockText(block), "已复制「" + block.title + "」", blockButton);
      return;
    }

    const rowButton = closestIn(panel, event.target, ".row__copy");
    if (rowButton) {
      const block = company.blocks[Number(rowButton.dataset.block)];
      const row = block && block.rows[Number(rowButton.dataset.row)];
      if (row) copyTextWithFeedback(row.copy, "已复制 " + row.label, rowButton);
    }
  });

  return panel;
}
