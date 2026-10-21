/**
 * 纯文本序列化
 * 决定"复制出去的文字长什么样"：块标题用【】包裹，一行一个 标签：值，
 * 块之间留空行，保证粘到微信/邮件里字段对应关系不乱。
 */

/**
 * 单个区块的文本
 * @param {{title: string, rows: Array<{label: string, text: string}>}} block
 * @returns {string}
 */
export function blockText(block) {
  return (
    "【" + block.title + "】\n" +
    block.rows.map((row) => row.label + "：" + row.text).join("\n")
  );
}

/**
 * 整家公司（全部区块 + 页脚）的文本
 * @param {{fullName: string, subtitle: string, blocks: Array}} company
 * @param {string} footer
 * @returns {string}
 */
export function companyText(company, footer) {
  const lines = [company.fullName, company.subtitle, ""];

  company.blocks.forEach((block) => {
    lines.push("【" + block.title + "】");
    block.rows.forEach((row) => lines.push(row.label + "：" + row.text));
    lines.push("");
  });

  lines.push(footer);
  return lines.join("\n");
}
