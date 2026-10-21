/**
 * 剪贴板与文件下载
 * --------------------------------------------------------------------------
 * 统一处理"现代 API 可用 / 不可用"的差异，调用方只关心结果，不关心兼容分支。
 */

/**
 * 复制纯文本；优先用异步剪贴板 API，失败时回退到 textarea + execCommand。
 * @param {string} text
 * @returns {Promise<void>} 失败时 reject
 */
export async function writeText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      /* 权限被拒或非安全上下文，继续走回退方案 */
    }
  }
  legacyCopy(text);
}

/**
 * textarea 兜底方案（file:// 或权限受限时）
 * @param {string} text
 */
function legacyCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:-999px;left:0;opacity:0";
  document.body.appendChild(area);
  area.select();
  try {
    const ok = document.execCommand("copy");
    if (!ok) throw new Error("execCommand copy failed");
  } finally {
    document.body.removeChild(area);
  }
}

/**
 * 把 PNG 写入剪贴板
 * @param {Blob} blob
 * @returns {Promise<boolean>} true=已复制，false=浏览器不支持（调用方降级为下载）
 */
export async function writeImage(blob) {
  if (!navigator.clipboard || !window.ClipboardItem) return false;
  try {
    await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 触发浏览器下载
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
