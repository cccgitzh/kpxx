/**
 * 图片导出
 * --------------------------------------------------------------------------
 * 用 Canvas 手绘而不是 html2canvas：无第三方依赖、离线可用、3 倍分辨率下文字
 * 依然锐利，颜色与字体直接读 CSS 令牌，保证出图和页面一致。
 */

import { token, toneColor } from "../core/theme.js";
import { writeImage, downloadBlob } from "../core/clipboard.js";
import { notify } from "../core/feedback.js";

/* 版面常量：与 components.css / layout.css 的视觉参数对齐 */
const SCALE = 3;        // 3 倍图
const WIDTH = 700;      // 逻辑宽度
const PADDING = 40;
const TITLE_LINE = 34;
const VALUE_LINE = 23;
const ROW_PADDING = 11;

/** 复用的测量上下文，避免每次导出都新建 canvas */
let measureContext = null;
function measure() {
  if (!measureContext) measureContext = document.createElement("canvas").getContext("2d");
  return measureContext;
}

/**
 * 按字符宽度折行（中文按字断行，优于按词断行）
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {string} font
 * @param {number} maxWidth
 * @returns {string[]}
 */
function wrapLines(ctx, text, font, maxWidth) {
  ctx.font = font;
  const lines = [];
  let line = "";

  for (const char of String(text)) {
    if (ctx.measureText(line + char).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/**
 * 生成整家公司信息的图片
 * @param {object} company 模型
 * @param {{footer: string}} meta
 * @returns {HTMLCanvasElement}
 */
export function buildCanvas(company, meta) {
  const ink = token("--c-ink");
  const muted = token("--c-muted");
  const muted2 = token("--c-muted-2");
  const line = token("--c-line");
  const lineStrong = token("--c-line-strong");
  const sans = token("--font-sans");
  const mono = token("--font-mono");

  const font = {
    title: "800 23px " + sans,
    sub: "400 12px " + sans,
    index: "500 11px " + mono,
    head: "700 12px " + sans,
    key: "400 12.5px " + sans,
    value: "400 14.5px " + sans,
    num: "400 14px " + mono,
    foot: "400 11.5px " + sans,
  };

  const m = measure();
  const innerWidth = WIDTH - PADDING * 2;
  const valueWidth = innerWidth - 112;

  const titleLines = wrapLines(m, company.fullName, font.title, innerWidth);

  /* 先量高，再按同一套参数绘制 */
  const layout = company.blocks.map((block) => {
    const rows = block.rows.map((row) => ({
      label: row.label,
      font: row.mono ? font.num : font.value,
      lines: wrapLines(m, row.text, row.mono ? font.num : font.value, valueWidth),
    }));
    const height = rows.reduce(
      (sum, row) => sum + Math.max(row.lines.length * VALUE_LINE, 20) + ROW_PADDING * 2,
      0
    );
    return { block, rows, height };
  });

  const totalHeight =
    PADDING +
    titleLines.length * TITLE_LINE +
    27 +                                          // 副标题间距 + 文字高度
    layout.reduce((sum, item) => sum + 30 + 22 + item.height, 0) +
    34 + 12 + 16;                                 // 页脚

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = Math.ceil(totalHeight) * SCALE;

  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, canvas.height / SCALE);

  let y = PADDING;

  /* 标题 */
  ctx.fillStyle = ink;
  ctx.font = font.title;
  titleLines.forEach((text) => {
    ctx.fillText(text, PADDING, y);
    y += TITLE_LINE;
  });

  /* 副标题 */
  y += 10;
  ctx.fillStyle = muted2;
  ctx.font = font.sub;
  ctx.fillText(company.subtitle, PADDING, y);
  y += 17;

  /* 标题下粗线 */
  ctx.fillStyle = ink;
  ctx.fillRect(PADDING, y, innerWidth, 2);
  y += 2;

  /* 区块 */
  layout.forEach((item, blockIndex) => {
    y += 30;

    ctx.fillStyle = toneColor(item.block.tone);
    ctx.font = font.index;
    ctx.fillText(item.block.index, PADDING, y + 2);

    ctx.fillStyle = ink;
    ctx.font = font.head;
    ctx.letterSpacing = "1.9px";
    ctx.fillText(item.block.title, PADDING + 22, y + 1);
    const titleWidth = ctx.measureText(item.block.title).width;
    ctx.letterSpacing = "0px";

    /* 标题右侧延伸的细线 */
    const rulerStart = PADDING + 22 + titleWidth + 12;
    ctx.fillStyle = lineStrong;
    ctx.fillRect(rulerStart, y + 9, WIDTH - PADDING - rulerStart, 1);

    y += 22;

    /* 行 */
    item.rows.forEach((row) => {
      const rowHeight = Math.max(row.lines.length * VALUE_LINE, 20) + ROW_PADDING * 2;
      const textTop = y + ROW_PADDING;

      ctx.fillStyle = muted;
      ctx.font = font.key;
      ctx.fillText(row.label, PADDING, textTop + 2);

      ctx.fillStyle = ink;
      ctx.font = row.font;
      row.lines.forEach((text, i) => {
        ctx.fillText(text, PADDING + 112, textTop + i * VALUE_LINE);
      });

      y += rowHeight;
      ctx.fillStyle = line;
      ctx.fillRect(PADDING, y, innerWidth, 1);
    });
  });

  /* 页脚 */
  y += 34;
  ctx.fillStyle = lineStrong;
  ctx.fillRect(PADDING, y, innerWidth, 1);
  y += 12;
  ctx.fillStyle = muted;
  ctx.font = font.foot;
  wrapLines(m, meta.footer, font.foot, innerWidth).forEach((text, i) => {
    ctx.fillText(text, PADDING, y + i * 17);
  });

  return canvas;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob|null>}
 */
function toBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** @param {object} company */
function filename(company) {
  return company.fullName + "-开票与收款信息.png";
}

/**
 * 复制为图片；浏览器不支持写图片时自动降级为下载
 * @param {object} company
 * @param {{footer: string}} meta
 */
export async function copyImage(company, meta) {
  const blob = await toBlob(buildCanvas(company, meta));
  if (!blob) {
    notify("生成图片失败，请重试");
    return;
  }

  if (await writeImage(blob)) {
    notify("图片已复制，可直接粘贴发送");
    return;
  }

  downloadBlob(blob, filename(company));
  notify("已下载图片（当前浏览器不支持直接复制图片）");
}

/**
 * 下载为图片
 * @param {object} company
 * @param {{footer: string}} meta
 */
export async function downloadImage(company, meta) {
  const blob = await toBlob(buildCanvas(company, meta));
  if (!blob) {
    notify("生成图片失败，请重试");
    return;
  }
  downloadBlob(blob, filename(company));
  notify("图片已下载");
}
