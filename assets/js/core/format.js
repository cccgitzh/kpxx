/**
 * 格式化工具
 */

/**
 * 银行账号按每 4 位分组展示；非纯数字（如已有占位符）原样返回。
 * 设计约定：分组只用于"看"，复制时仍取原始数字。
 * @param {string|number} raw
 * @returns {string}
 */
export function groupDigits(raw) {
  const digits = String(raw == null ? "" : raw).replace(/\s+/g, "");
  if (!/^\d{6,}$/.test(digits)) return String(raw == null ? "" : raw);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * 把数字字符串压缩成纯数字（去掉展示用的空格）
 * @param {string|number} raw
 * @returns {string}
 */
export function stripSpaces(raw) {
  return String(raw == null ? "" : raw).replace(/\s+/g, "");
}
