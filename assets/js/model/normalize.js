/**
 * 数据整形
 * --------------------------------------------------------------------------
 * 把 data.js 里"便于手写"的原始结构，转换成"便于渲染"的模型：
 *   原始：平铺字段 + receiptAccounts[].rows（数组形式）
 *   模型：blocks[] → rows[] → { label, text, copy, mono }
 *
 * 渲染层不再关心数据怎么写的，只认模型；数据文件保持对人友好。
 */

import { groupDigits, stripSpaces } from "../core/format.js";

const INVOICE_BLOCK_TITLE = "增值税专用发票开票信息";

/**
 * 构造一行；空值返回 null（由调用方过滤，实现"留空即隐藏"）
 * @param {string} label
 * @param {string|number} value
 * @param {{mono?: boolean, account?: boolean}} [options]
 * @returns {{label: string, text: string, copy: string, mono: boolean}|null}
 */
function makeRow(label, value, options = {}) {
  if (value == null || String(value).trim() === "") return null;

  const raw = String(value);
  const isAccount = Boolean(options.account);

  return {
    label,
    text: isAccount ? groupDigits(raw) : raw,   // 展示值
    copy: isAccount ? stripSpaces(raw) : raw,   // 复制值（账号去空格）
    mono: Boolean(options.mono) || isAccount,
  };
}

/**
 * ① 开票信息区块：字段顺序由这里固定，缺省字段自动跳过
 * @param {object} company
 */
function buildInvoiceBlock(company) {
  const rows = [
    makeRow("公司名称", company.fullName),
    makeRow("纳税人识别号", company.taxId, { mono: true }),
    makeRow("注册地址", company.address),
    makeRow("注册电话", company.phone),
    makeRow("开户银行", company.bankName),
    makeRow("银行账号", company.bankAccount, { account: true }),
    makeRow("税率说明", company.taxNote),
  ].filter(Boolean);

  return { title: INVOICE_BLOCK_TITLE, tone: "one", rows };
}

/**
 * ② ③ 收款账户区块：数量由数据决定（1 个或多个）
 * @param {object} account
 */
function buildAccountBlock(account) {
  const rows = (account.rows || [])
    .map((row) => makeRow(row[0], row[1], { account: row[2] === "account", mono: row[2] === "mono" }))
    .filter(Boolean);

  return { title: account.title || "收款账户", tone: account.tone || "two", rows };
}

/**
 * 单家公司 -> 渲染模型
 * @param {object} raw data.js 中的一项
 * @param {{subtitle: string}} meta
 */
function buildCompany(raw, meta) {
  const blocks = [buildInvoiceBlock(raw), ...(raw.receiptAccounts || []).map(buildAccountBlock)]
    .map((block, i) => ({ ...block, index: String(i + 1).padStart(2, "0") }));

  return {
    id: raw.id,
    tabName: raw.tabName || raw.fullName,
    tabMeta: raw.tabMeta || "",
    fullName: raw.fullName,
    subtitle: meta.subtitle,
    footer: meta.footer,
    blocks,
  };
}

/**
 * 校验：至少要能标识一家公司
 * @param {object} company
 */
function isValid(company) {
  return Boolean(company && typeof company.id === "string" && company.id && company.fullName);
}

/**
 * 全局数据 -> { companies, meta }
 * @param {object} raw window.INVOICE_DATA
 */
export function normalizeData(raw) {
  const source = raw || {};
  const meta = {
    title: source.siteTitle || "开票与收款信息",
    subtitle: source.siteSubtitle || "请按以下信息开具发票、安排付款",
    footer: source.footer || "信息如有变更，请以最新通知为准｜如有疑问请联系对接人员",
    updatedAt: source.updatedAt || "",
    defaultCompanyId: source.defaultCompanyId || "",
  };

  const companies = (Array.isArray(source.companies) ? source.companies : [])
    .filter(isValid)
    .map((company) => buildCompany(company, meta));

  return { companies, meta };
}
