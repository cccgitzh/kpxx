/**
 * 应用入口
 * --------------------------------------------------------------------------
 * 只做三件事：读数据 → 建状态 → 把状态接到各视图上。
 * 页面逻辑集中在 model/ + ui/，这里不写渲染细节。
 */

import { el } from "./core/dom.js";
import { copyTextWithFeedback } from "./core/actions.js";
import { normalizeData } from "./model/normalize.js";
import { createStore } from "./model/store.js";
import { companyText } from "./model/texts.js";
import { createTabs } from "./ui/tabs.js";
import { createPanel } from "./ui/panel.js";
import { createDock } from "./ui/dock.js";
import { copyImage, downloadImage } from "./export/image.js";

/**
 * 首屏选中的公司：URL 锚点 > 数据里的默认值 > 第一家
 * @param {Array<{id: string}>} companies
 * @param {{defaultCompanyId: string}} meta
 */
function resolveInitialId(companies, meta) {
  const fromHash = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (fromHash && companies.some((company) => company.id === fromHash)) return fromHash;
  if (meta.defaultCompanyId && companies.some((company) => company.id === meta.defaultCompanyId)) {
    return meta.defaultCompanyId;
  }
  return companies[0].id;
}

/**
 * 页面级文案
 * @param {{title: string, subtitle: string, updatedAt: string}} meta
 */
function applyMeta(meta) {
  const titleNode = document.getElementById("site-title");
  if (titleNode) titleNode.textContent = meta.title;

  const updatedNode = document.getElementById("updated-at");
  if (updatedNode && meta.updatedAt) updatedNode.textContent = meta.updatedAt;

  document.title = meta.subtitle ? meta.title + " · " + meta.subtitle : meta.title;
}

function boot() {
  const tabsHost = document.getElementById("tabs");
  const panelHost = document.getElementById("panels");
  if (!tabsHost || !panelHost) return;

  const { companies, meta } = normalizeData(window.INVOICE_DATA);
  applyMeta(meta);

  if (!companies.length) {
    tabsHost.hidden = true;
    panelHost.appendChild(el("div", "empty", "尚未配置开票信息，请在 assets/js/data.js 中补充。"));
    return;
  }

  const store = createStore(companies, resolveInitialId(companies, meta));

  /* 面板按需创建：只有被访问过的公司才建 DOM */
  const panels = new Map();
  function ensurePanel(company) {
    let panel = panels.get(company.id);
    if (!panel) {
      panel = createPanel(company);
      panels.set(company.id, panel);
      panelHost.appendChild(panel);
    }
    return panel;
  }

  function syncHash(id) {
    if (location.hash.slice(1) === id) return;
    if (history.replaceState) history.replaceState(null, "", "#" + id);
    else location.hash = id;
  }

  function render(company, options) {
    const scroll = Boolean(options && options.scroll);

    panels.forEach((panel) => {
      panel.hidden = true;
    });

    const panel = ensurePanel(company);
    panel.hidden = false;
    tabs.setActive(company.id);
    syncHash(company.id);

    /* 切换后如果面板顶部已在视口外，滚回内容开头（移动端常用） */
    if (scroll && panel.getBoundingClientRect().top < 0) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const tabs = createTabs(tabsHost, companies, (id) => store.setActive(id));

  store.subscribe((company) => render(company, { scroll: true }));
  render(store.getActive(), { scroll: false });

  /* 支持浏览器前进/后退与手动改锚点 */
  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (id && store.has(id)) store.setActive(id);
  });

  createDock(document, {
    onText() {
      const company = store.getActive();
      if (company) copyTextWithFeedback(companyText(company, meta.footer), "已复制全部开票与收款信息");
    },
    onImage() {
      const company = store.getActive();
      if (company) copyImage(company, meta);
    },
    onDownload() {
      const company = store.getActive();
      if (company) downloadImage(company, meta);
    },
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
