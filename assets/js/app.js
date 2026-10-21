/* ==========================================================================
 * 开票信息展示页 · 交互逻辑
 * --------------------------------------------------------------------------
 * 设计原则：每家公司渲染为独立的 <section> 节点，节点上带 data-company 标识，
 * 切换 Tab 只切换显示状态，绝不跨公司复用 DOM 或共享可变状态 —— 从结构上
 * 保证多家公司的开票信息不会混淆。
 * ========================================================================== */

(function () {
  "use strict";

  var DATA = window.INVOICE_DATA || { companies: [] };
  var companies = Array.isArray(DATA.companies) ? DATA.companies.filter(isValid) : [];

  var ICONS = {
    copy:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a3 3 0 0 0-3 3v6.5A2.5 2.5 0 0 0 5.5 15"/></svg>',
    share:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.4 10.8 15.6 6.2M8.4 13.2l7.2 4.6"/></svg>',
    print:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6h.01"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12.5 5 5L20 6.5"/></svg>',
    link:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13.5a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1L11.6 6.8"/><path d="M14 10.5a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1.4-1.4"/></svg>',
  };

  /* ------------------------------------------------------------- 工具函数 */

  function isValid(company) {
    return company && typeof company.id === "string" && company.id && company.fullName;
  }

  /** 银行账号按 4 位分组展示，复制时仍取原始纯数字 */
  function groupAccount(raw) {
    var digits = String(raw || "").replace(/\s+/g, "");
    if (!/^\d+$/.test(digits)) return String(raw || "");
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // file:// 或非安全上下文下的兜底方案
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  var toastTimer = null;
  function toast(message) {
    var node = document.getElementById("toast");
    if (!node) return;
    node.querySelector("[data-toast-text]").textContent = message;
    node.setAttribute("data-show", "true");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      node.setAttribute("data-show", "false");
    }, 2200);
  }

  function copyWithFeedback(text, message) {
    copyText(text).then(
      function () {
        toast(message || "已复制到剪贴板");
      },
      function () {
        toast("复制失败，请手动选择文本");
      }
    );
  }

  /** 生成便于微信 / 邮件直接转发的纯文本 */
  function toPlainText(company) {
    var lines = [company.fullName];
    if (company.englishName) lines.push(company.englishName);
    lines.push("");
    lines.push("纳税人识别号：" + (company.taxId || "—"));
    if (company.taxpayerType) lines.push("纳税人资格：" + company.taxpayerType);
    lines.push("注册地址：" + (company.address || "—"));
    lines.push("注册电话：" + (company.phone || "—"));
    lines.push("开户银行：" + (company.bankName || "—"));
    lines.push("银行账号：" + (company.bankAccount || "—"));
    if (company.invoiceTypes && company.invoiceTypes.length) {
      lines.push("");
      lines.push("可开具发票：");
      company.invoiceTypes.forEach(function (type) {
        var desc = String(type.desc || "").replace(/<[^>]+>/g, "");
        lines.push("- " + type.name + "（税率 " + type.rate + "）" + (desc ? "：" + desc : ""));
      });
    }
    if (company.notice) {
      lines.push("");
      lines.push("备注：" + company.notice);
    }
    return lines.join("\n");
  }

  /* --------------------------------------------------------------- 渲染 */

  function renderField(label, value, options) {
    options = options || {};
    var wrap = el("div", "field" + (options.wide ? " field--wide" : ""));
    wrap.appendChild(el("span", "field__label", label));

    var text = options.mono ? value : value || "—";
    var p = el("p", "field__value" + (options.mono ? " field__value--mono" : ""), text);
    wrap.appendChild(p);

    if (value) {
      var btn = el("button", "field__copy");
      btn.type = "button";
      btn.innerHTML = ICONS.copy;
      btn.setAttribute("aria-label", "复制" + label);
      btn.title = "复制" + label;
      btn.addEventListener("click", function () {
        copyWithFeedback(options.copyValue != null ? options.copyValue : value, label + " 已复制");
      });
      wrap.appendChild(btn);
    }
    return wrap;
  }

  function renderPanel(company, index) {
    var section = el("section", "panel");
    section.id = "panel-" + company.id;
    section.setAttribute("role", "tabpanel");
    section.setAttribute("aria-labelledby", "tab-" + company.id);
    section.setAttribute("data-company", company.id);
    section.tabIndex = 0;
    section.hidden = true;

    section.appendChild(el("div", "panel__accent"));
    var body = el("div", "panel__body");
    section.appendChild(body);

    /* 1. 主体身份区：公司全称 + 纳税人识别号（视觉重心） */
    var identity = el("div", "identity");
    var main = el("div", "identity__main");

    if (company.taxpayerType) {
      main.appendChild(el("span", "identity__flag", company.taxpayerType));
    }

    var h2 = el("h2", "company-name", company.fullName);
    main.appendChild(h2);

    if (company.englishName) {
      main.appendChild(el("p", "company-en", company.englishName));
    }

    if (company.taxId) {
      var taxWrap = el("div", "taxid");
      taxWrap.appendChild(el("span", "taxid__label", "纳税人识别号"));
      taxWrap.appendChild(el("span", "taxid__value", company.taxId));

      var taxBtn = el("button", "field__copy");
      taxBtn.type = "button";
      taxBtn.innerHTML = ICONS.copy;
      taxBtn.setAttribute("aria-label", "复制纳税人识别号");
      taxBtn.title = "复制纳税人识别号";
      taxBtn.addEventListener("click", function () {
        copyWithFeedback(company.taxId, "纳税人识别号已复制");
      });
      taxWrap.appendChild(taxBtn);
      main.appendChild(taxWrap);
    }

    identity.appendChild(main);
    body.appendChild(identity);

    /* 2. 开票资料字段：严格取自当前 company 对象 */
    var fields = el("div", "fields");
    fields.appendChild(renderField("注册地址", company.address, { wide: true }));
    fields.appendChild(renderField("注册电话", company.phone));
    fields.appendChild(renderField("开户银行", company.bankName));
    fields.appendChild(
      renderField("银行账号", groupAccount(company.bankAccount), {
        mono: true,
        wide: true,
        copyValue: String(company.bankAccount || "").replace(/\s+/g, ""),
      })
    );
    body.appendChild(fields);

    /* 3. 发票类型与税率 */
    if (company.invoiceTypes && company.invoiceTypes.length) {
      var head = el("div", "section-head");
      head.appendChild(el("h3", "section-head__title", "可开具发票类型"));
      head.appendChild(el("span", "section-head__hint", "税率以合同约定及实际开票为准"));
      body.appendChild(head);

      var list = el("div", "invoices");
      company.invoiceTypes.forEach(function (type) {
        var card = el("div", "invoice");

        var top = el("div", "invoice__top");
        top.appendChild(el("h4", "invoice__name", type.name));
        if (type.rate) top.appendChild(el("span", "invoice__rate", type.rate));
        card.appendChild(top);

        if (type.desc) {
          var desc = el("p", "invoice__desc");
          // desc 来自同仓库的静态数据文件，允许少量行内标记（<em>）
          desc.innerHTML = type.desc;
          card.appendChild(desc);
        }
        list.appendChild(card);
      });
      body.appendChild(list);
    }

    /* 4. 该公司专属备注 */
    if (company.notice) {
      var notice = el("div", "notice");
      notice.innerHTML = ICONS.info;
      notice.appendChild(el("p", "", company.notice));
      body.appendChild(notice);
    }

    /* 5. 操作区 */
    var actions = el("div", "actions");

    var btnCopy = el("button", "btn btn--primary");
    btnCopy.type = "button";
    btnCopy.innerHTML = ICONS.copy + "<span>复制全部信息</span>";
    btnCopy.addEventListener("click", function () {
      copyWithFeedback(toPlainText(company), "已复制" + company.tabName + "全部开票信息");
    });
    actions.appendChild(btnCopy);

    var btnShare = el("button", "btn");
    btnShare.type = "button";
    btnShare.innerHTML = ICONS.share + "<span>转发给客户</span>";
    btnShare.addEventListener("click", function () {
      var text = toPlainText(company);
      if (navigator.share) {
        navigator.share({ title: company.fullName + " 开票信息", text: text }).catch(function () {});
      } else {
        copyWithFeedback(text, "当前浏览器不支持直接分享，信息已复制");
      }
    });
    actions.appendChild(btnShare);

    if (company.taxId && location.protocol !== "file:") {
      var btnLink = el("button", "btn");
      btnLink.type = "button";
      btnLink.innerHTML = ICONS.link + "<span>复制本条链接</span>";
      btnLink.addEventListener("click", function () {
        var url = location.origin + location.pathname + "#" + company.id;
        copyWithFeedback(url, "已复制「" + company.tabName + "」专属链接");
      });
      actions.appendChild(btnLink);
    }

    actions.appendChild(el("div", "actions__spacer"));

    var btnPrint = el("button", "btn btn--ghost");
    btnPrint.type = "button";
    btnPrint.innerHTML = ICONS.print + "<span>打印 / 存为 PDF</span>";
    btnPrint.addEventListener("click", function () {
      window.print();
    });
    actions.appendChild(btnPrint);

    section.appendChild(actions);

    section.setAttribute("aria-label", company.fullName + " 开票信息");
    if (index === 0) section.setAttribute("data-first", "true");
    return section;
  }

  /* --------------------------------------------------------------- 初始化 */

  function init() {
    var tabsBox = document.getElementById("tabs");
    var panelsBox = document.getElementById("panels");
    if (!tabsBox || !panelsBox) return;

    if (!companies.length) {
      panelsBox.innerHTML =
        '<div class="panel"><div class="empty">尚未配置公司开票信息，请在 <code>assets/js/data.js</code> 中补充。</div></div>';
      tabsBox.hidden = true;
      return;
    }

    var tabs = [];
    var panels = [];

    companies.forEach(function (company, index) {
      // Tab
      var tab = el("button", "tab");
      tab.type = "button";
      tab.id = "tab-" + company.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", "panel-" + company.id);
      tab.setAttribute("aria-selected", "false");
      tab.tabIndex = -1;
      tab.setAttribute("data-company", company.id);

      tab.appendChild(document.createTextNode(company.tabName || company.fullName));
      if (company.tabMeta) tab.appendChild(el("small", "", company.tabMeta));
      tab.addEventListener("click", function () {
        activate(index, true);
      });
      tabsBox.appendChild(tab);
      tabs.push(tab);

      // Panel
      var panel = renderPanel(company, index);
      panelsBox.appendChild(panel);
      panels.push(panel);
    });

    /* 键盘导航：左右方向键 + Home / End */
    tabsBox.addEventListener("keydown", function (event) {
      var current = tabs.indexOf(document.activeElement);
      if (current === -1) return;
      var next = null;
      if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      activate(next, true);
      tabs[next].focus();
    });

    var activeIndex = -1;

    function activate(index, updateHash) {
      if (index < 0 || index >= companies.length) return;
      if (index === activeIndex) {
        if (updateHash) syncHash(index);
        return;
      }
      activeIndex = index;

      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
      });

      // 只显示当前公司的面板，其余全部 hidden —— 信息严格隔离
      panels.forEach(function (panel, i) {
        panel.hidden = i !== index;
      });

      if (updateHash) syncHash(index);

      // 切换后保证内容从顶部可见（移动端体验）
      var panelTop = panels[index].getBoundingClientRect().top;
      if (panelTop < 0) {
        panels[index].scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function syncHash(index) {
      var id = companies[index].id;
      if (location.hash.slice(1) === id) return;
      if (history.replaceState) {
        history.replaceState(null, "", "#" + id);
      } else {
        location.hash = id;
      }
    }

    function indexFromHash() {
      var id = decodeURIComponent(location.hash.replace(/^#/, ""));
      if (!id) return -1;
      for (var i = 0; i < companies.length; i++) {
        if (companies[i].id === id) return i;
      }
      return -1;
    }

    /* 首屏：优先按 URL 直达，其次默认公司，再次第一家 */
    var start = indexFromHash();
    if (start === -1) {
      for (var i = 0; i < companies.length; i++) {
        if (companies[i].id === DATA.defaultCompanyId) start = i;
      }
    }
    if (start === -1) start = 0;
    activate(start, false);

    window.addEventListener("hashchange", function () {
      var index = indexFromHash();
      if (index !== -1) activate(index, false);
    });

    // 页头信息
    var title = document.getElementById("site-title");
    var subtitle = document.getElementById("site-subtitle");
    if (title && DATA.siteTitle) title.textContent = DATA.siteTitle;
    if (subtitle && DATA.siteSubtitle) subtitle.textContent = DATA.siteSubtitle;
    if (DATA.siteTitle) document.title = DATA.siteTitle + " · " + (DATA.siteSubtitle || "");

    var updated = document.getElementById("updated-at");
    if (updated && DATA.updatedAt) updated.textContent = DATA.updatedAt;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
