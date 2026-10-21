/**
 * 公司切换器（WAI-ARIA Tabs）
 * --------------------------------------------------------------------------
 * 只负责"选中态"和键盘操作，不直接改面板显隐——面板由 main.js 统一调度，
 * 避免切换器同时掌握两处 DOM。
 */

import { el, on, closestIn } from "../core/dom.js";

/**
 * @param {HTMLElement} container 具有 role="tablist" 的容器
 * @param {Array<{id: string, tabName: string, tabMeta?: string}>} companies
 * @param {(id: string) => void} onSelect
 */
export function createTabs(container, companies, onSelect) {
  const tabs = new Map();
  const fragment = document.createDocumentFragment();

  companies.forEach((company) => {
    const tab = el("button", "tab");
    tab.type = "button";
    tab.id = "tab-" + company.id;
    tab.dataset.id = company.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "panel-" + company.id);
    tab.setAttribute("aria-selected", "false");
    tab.tabIndex = -1;

    tab.appendChild(document.createTextNode(company.tabName));
    if (company.tabMeta) tab.appendChild(el("span", "tab__meta", company.tabMeta));

    fragment.appendChild(tab);
    tabs.set(company.id, tab);
  });

  container.appendChild(fragment);

  /* 事件委托：整组 Tab 只挂两个监听 */
  on(container, "click", (event) => {
    const tab = closestIn(container, event.target, '[role="tab"]');
    if (tab && tab.dataset.id) onSelect(tab.dataset.id);
  });

  on(container, "keydown", (event) => {
    const list = Array.from(tabs.values());
    const index = list.indexOf(document.activeElement);
    if (index === -1) return;

    let next = null;
    switch (event.key) {
      case "ArrowRight": next = (index + 1) % list.length; break;
      case "ArrowLeft": next = (index - 1 + list.length) % list.length; break;
      case "Home": next = 0; break;
      case "End": next = list.length - 1; break;
      default: return;
    }

    event.preventDefault();
    const target = list[next];
    onSelect(target.dataset.id);
    target.focus();
  });

  return {
    /** 更新选中态（不触发 onSelect，避免回环） */
    setActive(id) {
      tabs.forEach((tab, key) => {
        const selected = key === id;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
      });
    },
  };
}
