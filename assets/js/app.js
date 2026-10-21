/* ==========================================================================
   开票与收款信息 · 交互逻辑（极简黑白方案）
   --------------------------------------------------------------------------
   隔离原则：每家公司渲染为独立的 <section role="tabpanel" data-company="…">，
   切换只改 hidden，不跨公司复用 DOM、不共享可变状态，从结构上避免信息混淆。
   ========================================================================== */

(function () {
  "use strict";

  var DATA = window.INVOICE_DATA || { companies: [] };
  var COMPANIES = Array.isArray(DATA.companies) ? DATA.companies.filter(valid) : [];
  var FOOTER = DATA.footer || "信息如有变更，请以最新通知为准｜如有疑问请联系对接人员";
  var SUBTITLE = DATA.siteSubtitle || "请按以下信息开具发票、安排付款";

  var TONE = { one: "#1266e3", two: "#12a94b", thr: "#f39200" };
  var FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  var MONO = '"SF Mono","JetBrains Mono",Menlo,Consolas,monospace';

  var ICON = {
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a3 3 0 0 0-3 3v6.5A2.5 2.5 0 0 0 5.5 15"/></svg>',
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11"/><path d="m7.5 10 4.5 4.5L16.5 10"/><path d="M4 19h16"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a3 3 0 0 0-3 3v6.5A2.5 2.5 0 0 0 5.5 15"/></svg>',
  };

  /* ---------------------------------------------------------------- 工具 */

  function valid(c) {
    return c && typeof c.id === "string" && c.id && c.fullName;
  }

  function group4(raw) {
    var d = String(raw == null ? "" : raw).replace(/\s+/g, "");
    if (!/^\d{6,}$/.test(d)) return String(raw == null ? "" : raw);
    return d.replace(/(.{4})/g, "$1 ").trim();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ------------------------------------------------------------ 数据整形 */

  /** 把一家公司的数据整理成「区块 + 行」的结构 */
  function blocksOf(c) {
    var invoiceRows = [
      { k: "公司名称", v: c.fullName },
      { k: "纳税人识别号", v: c.taxId, mono: true },
      { k: "注册地址", v: c.address },
      { k: "注册电话", v: c.phone },
      { k: "开户银行", v: c.bankName },
      { k: "银行账号", v: c.bankAccount, account: true },
      { k: "税率说明", v: c.taxNote },
    ].filter(function (r) {
      return r.v != null && String(r.v).trim() !== "";
    });

    var blocks = [
      { title: "增值税专用发票开票信息", tone: "one", rows: invoiceRows },
    ];

    (c.receiptAccounts || []).forEach(function (acc) {
      var rows = (acc.rows || []).map(function (r) {
        return {
          k: r[0],
          v: r[1],
          account: r[2] === "account",
          mono: r[2] === "mono",
        };
      });
      blocks.push({ title: acc.title, tone: acc.tone || "two", rows: rows });
    });

    return blocks;
  }

  /** 行内展示值：账户按 4 位分组，其余原样 */
  function displayOf(row) {
    if (row.account) return group4(row.v);
    return String(row.v == null ? "" : row.v);
  }

  /** 单行复制值：账户去空格纯数字，其余原样 */
  function copyOf(row) {
    if (row.account) return String(row.v == null ? "" : row.v).replace(/\s+/g, "");
    return String(row.v == null ? "" : row.v);
  }

  function blockText(b) {
    return (
      "【" + b.title + "】\n" +
      b.rows.map(function (r) { return r.k + "：" + displayOf(r); }).join("\n")
    );
  }

  function fullText(c) {
    var out = [c.fullName, SUBTITLE, ""];
    blocksOf(c).forEach(function (b) {
      out.push("【" + b.title + "】");
      b.rows.forEach(function (r) { out.push(r.k + "：" + displayOf(r)); });
      out.push("");
    });
    out.push(FOOTER);
    return out.join("\n");
  }

  /* ---------------------------------------------------------------- 复制 */

  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.setAttribute("data-show", "true");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.setAttribute("data-show", "false"); }, 1800);
  }

  function markDone(btn) {
    if (!btn) return;
    var html = btn.innerHTML;
    btn.innerHTML = ICON.done;
    btn.setAttribute("data-done", "true");
    setTimeout(function () {
      btn.innerHTML = html;
      btn.removeAttribute("data-done");
    }, 1300);
  }

  function copyText(text, msg, btn) {
    function ok() { toast(msg); markDone(btn); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-999px;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); ok(); }
      catch (e) { toast("复制失败，请手动选择文本"); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else {
      fallback();
    }
  }

  /* ------------------------------------------------------------ 图片生成 */

  function wrapLines(ctx, text, font, maxW) {
    ctx.font = font;
    var lines = [], line = "";
    String(text).split("\n").forEach(function (seg) {
      line = "";
      for (var i = 0; i < seg.length; i++) {
        var ch = seg[i];
        if (ctx.measureText(line + ch).width > maxW && line) {
          lines.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
      if (line) lines.push(line);
      if (!lines.length) lines.push("");
    });
    return lines.length ? lines : [""];
  }

  var S = 3;              // 3 倍分辨率
  var W = 700;            // 逻辑宽度
  var PAD = 40;
  var TITLE_LH = 34;
  var VALUE_LH = 23;
  var ROW_PAD = 11;

  function buildCanvas(company) {
    var blocks = blocksOf(company);
    var m = document.createElement("canvas").getContext("2d");

    var F = {
      title: "800 23px " + FONT,
      sub: "400 12px " + FONT,
      idx: "500 11px " + MONO,
      head: "700 12px " + FONT,
      key: "400 12.5px " + FONT,
      val: "400 14.5px " + FONT,
      num: "400 14px " + MONO,
      foot: "400 11.5px " + FONT,
    };

    var innerW = W - PAD * 2;
    var valW = innerW - 112;

    var titleLines = wrapLines(m, company.fullName, F.title, innerW);

    var layout = blocks.map(function (b) {
      var rows = b.rows.map(function (r) {
        var font = r.account || r.mono ? F.num : F.val;
        return {
          k: r.k,
          lines: wrapLines(m, displayOf(r), font, valW),
          font: font,
        };
      });
      var h = rows.reduce(function (sum, r) {
        return sum + Math.max(r.lines.length * VALUE_LH, 20) + ROW_PAD * 2;
      }, 0);
      return { b: b, rows: rows, h: h };
    });

    var total =
      PAD +
      titleLines.length * TITLE_LH +
      10 + 9 + 8 +      // 副标题 + 间距 + 黑色粗线
      layout.reduce(function (s, x) { return s + 30 + 22 + x.h; }, 0) +
      34 + 12 + 16;     // 页脚

    var H = Math.ceil(total);
    var canvas = document.createElement("canvas");
    canvas.width = W * S;
    canvas.height = H * S;

    var ctx = canvas.getContext("2d");
    ctx.scale(S, S);
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    var y = PAD;

    /* 标题 */
    ctx.fillStyle = "#0a0a0a";
    ctx.font = F.title;
    titleLines.forEach(function (line) {
      ctx.fillText(line, PAD, y);
      y += TITLE_LH;
    });

    /* 副标题 */
    y += 10;
    ctx.fillStyle = "#8a8a8a";
    ctx.font = F.sub;
    ctx.fillText(SUBTITLE, PAD, y);
    y += 9 + 8;

    /* 标题下粗线 */
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(PAD, y, innerW, 2);
    y += 2;

    /* 区块 */
    layout.forEach(function (item, bi) {
      y += 30;

      var tone = TONE[item.b.tone] || "#9a9a9a";
      ctx.fillStyle = tone;
      ctx.font = F.idx;
      ctx.fillText("0" + (bi + 1), PAD, y + 2);

      ctx.fillStyle = "#0a0a0a";
      ctx.font = F.head;
      ctx.letterSpacing = "1.9px";
      ctx.fillText(item.b.title, PAD + 22, y + 1);
      var tw = ctx.measureText(item.b.title).width;
      ctx.letterSpacing = "0px";

      // 标题右侧延伸的细线
      var lineX = PAD + 22 + tw + 12;
      ctx.fillStyle = "#e4e4e4";
      ctx.fillRect(lineX, y + 9, W - PAD - lineX, 1);

      y += 22;

      /* 行 */
      item.rows.forEach(function (r) {
        var blockH = Math.max(r.lines.length * VALUE_LH, 20) + ROW_PAD * 2;
        var textY = y + ROW_PAD;

        ctx.fillStyle = "#9a9a9a";
        ctx.font = F.key;
        ctx.fillText(r.k, PAD, textY + 2);

        ctx.fillStyle = "#0a0a0a";
        ctx.font = r.font;
        r.lines.forEach(function (line, i) {
          ctx.fillText(line, PAD + 112, textY + i * VALUE_LH);
        });

        y += blockH;
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(PAD, y, innerW, 1);
      });
    });

    /* 页脚 */
    y += 34;
    ctx.fillStyle = "#e4e4e4";
    ctx.fillRect(PAD, y, innerW, 1);
    y += 12;
    ctx.fillStyle = "#9a9a9a";
    ctx.font = F.foot;
    wrapLines(m, FOOTER, F.foot, innerW).forEach(function (line, i) {
      ctx.fillText(line, PAD, y + i * 17);
    });

    return canvas;
  }

  function copyImage(company) {
    var canvas = buildCanvas(company);
    canvas.toBlob(function (blob) {
      if (!blob) { toast("生成图片失败"); return; }
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard
          .write([new window.ClipboardItem({ "image/png": blob })])
          .then(function () { toast("图片已复制，可直接粘贴发送"); })
          .catch(function () { download(blob, company); });
      } else {
        download(blob, company);
      }
    }, "image/png");
  }

  function download(blob, company) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = company.fullName + "-开票与收款信息.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast("已下载图片（当前浏览器不支持直接复制图片）");
  }

  /* ---------------------------------------------------------------- 渲染 */

  function buildPanel(c) {
    var panel = el("section", "sheet");
    panel.id = "panel-" + c.id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "tab-" + c.id);
    panel.setAttribute("data-company", c.id);
    panel.tabIndex = 0;
    panel.hidden = true;

    var head = el("div", "sheet__head");
    head.appendChild(el("h1", "sheet__title", c.fullName));
    head.appendChild(el("p", "sheet__sub", SUBTITLE));
    panel.appendChild(head);

    blocksOf(c).forEach(function (b, i) {
      var sec = el("section", "block");
      sec.style.setProperty("--tone", TONE[b.tone] || "#9a9a9a");

      var head = el("div", "block__head");
      head.appendChild(el("span", "block__index", "0" + (i + 1)));
      head.appendChild(el("h2", "block__name", b.title));
      head.appendChild(el("span", "block__rule"));

      var bc = el("button", "block__copy");
      bc.type = "button";
      bc.innerHTML = ICON.copy + "<span>复制</span>";
      bc.title = "复制「" + b.title + "」整块";
      bc.setAttribute("aria-label", "复制「" + b.title + "」整块");
      bc.addEventListener("click", function () {
        copyText(blockText(b), "已复制「" + b.title + "」", bc);
      });
      head.appendChild(bc);
      sec.appendChild(head);

      var body = el("div", "block__body");
      b.rows.forEach(function (r) {
        var row = el("div", "row");

        row.appendChild(el("span", "row__k", r.k));

        var v = el("span", "row__v" + (r.account || r.mono ? " row__v--mono" : ""), displayOf(r));
        row.appendChild(v);

        var rb = el("button", "row__copy");
        rb.type = "button";
        rb.innerHTML = ICON.copy;
        rb.title = "复制" + r.k;
        rb.setAttribute("aria-label", "复制" + r.k);
        rb.addEventListener("click", function () {
          copyText(copyOf(r), "已复制 " + r.k, rb);
        });
        row.appendChild(rb);

        body.appendChild(row);
      });
      sec.appendChild(body);
      panel.appendChild(sec);
    });

    panel.appendChild(el("p", "sheet__foot", FOOTER));
    return panel;
  }

  /* ---------------------------------------------------------------- 启动 */

  function init() {
    var tabsBox = document.getElementById("tabs");
    var host = document.getElementById("panels");
    if (!tabsBox || !host) return;

    var eyebrow = document.getElementById("site-title");
    if (eyebrow && DATA.siteTitle) eyebrow.textContent = DATA.siteTitle;
    var meta = document.getElementById("updated-at");
    if (meta && DATA.updatedAt) meta.textContent = DATA.updatedAt;
    if (DATA.siteSubtitle) document.title = DATA.siteTitle + " · " + DATA.siteSubtitle;

    if (!COMPANIES.length) {
      tabsBox.hidden = true;
      host.innerHTML = '<div class="empty">尚未配置开票信息，请在 assets/js/data.js 中补充。</div>';
      return;
    }

    var tabs = [], panels = [];

    COMPANIES.forEach(function (c, i) {
      var tab = el("button", "tab");
      tab.type = "button";
      tab.id = "tab-" + c.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", "panel-" + c.id);
      tab.setAttribute("aria-selected", "false");
      tab.tabIndex = -1;
      tab.appendChild(document.createTextNode(c.tabName || c.fullName));
      if (c.tabMeta) {
        var small = el("small", null, c.tabMeta);
        small.style.cssText = "font-size:11px;font-weight:400;letter-spacing:0;margin-left:6px;opacity:.7";
        tab.appendChild(small);
      }
      tab.addEventListener("click", function () { activate(i, true); });
      tabsBox.appendChild(tab);
      tabs.push(tab);

      var panel = buildPanel(c);
      host.appendChild(panel);
      panels.push(panel);
    });

    tabsBox.addEventListener("keydown", function (e) {
      var cur = tabs.indexOf(document.activeElement);
      if (cur === -1) return;
      var next = null;
      if (e.key === "ArrowRight") next = (cur + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (cur - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      activate(next, true);
      tabs[next].focus();
    });

    var current = -1;

    function activate(index, syncHash) {
      if (index < 0 || index >= COMPANIES.length) return;
      if (index === current) {
        if (syncHash) setHash(index);
        return;
      }
      current = index;

      tabs.forEach(function (t, i) {
        var on = i === index;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, i) { p.hidden = i !== index; });

      if (syncHash) setHash(index);

      var top = panels[index].getBoundingClientRect().top;
      if (top < 0) panels[index].scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function setHash(index) {
      var id = COMPANIES[index].id;
      if (location.hash.slice(1) === id) return;
      if (history.replaceState) history.replaceState(null, "", "#" + id);
      else location.hash = id;
    }

    function indexFromHash() {
      var id = decodeURIComponent(location.hash.replace(/^#/, ""));
      if (!id) return -1;
      for (var i = 0; i < COMPANIES.length; i++) {
        if (COMPANIES[i].id === id) return i;
      }
      return -1;
    }

    var start = indexFromHash();
    if (start === -1 && DATA.defaultCompanyId) {
      for (var i = 0; i < COMPANIES.length; i++) {
        if (COMPANIES[i].id === DATA.defaultCompanyId) start = i;
      }
    }
    activate(start === -1 ? 0 : start, false);

    window.addEventListener("hashchange", function () {
      var i = indexFromHash();
      if (i !== -1) activate(i, false);
    });

    /* 底部操作条 */
    var btnText = document.getElementById("btn-text");
    var btnImage = document.getElementById("btn-image");
    var btnDown = document.getElementById("btn-download");

    if (btnText) {
      btnText.innerHTML = ICON.text + "<span>复制全文</span>";
      btnText.addEventListener("click", function () {
        copyText(fullText(COMPANIES[current]), "已复制全部开票与收款信息");
      });
    }
    if (btnImage) {
      btnImage.innerHTML = ICON.image + "<span>复制图片</span>";
      btnImage.addEventListener("click", function () {
        copyImage(COMPANIES[current]);
      });
    }
    if (btnDown) {
      btnDown.innerHTML = ICON.download + "<span>下载图片</span>";
      btnDown.addEventListener("click", function () {
        var c = COMPANIES[current];
        buildCanvas(c).toBlob(function (blob) { download(blob, c); }, "image/png");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
