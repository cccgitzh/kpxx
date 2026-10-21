/**
 * 图标集
 * 内联 SVG，避免额外请求；统一 stroke-width 保证视觉一致。
 */

const wrap = (body, width = 1.9) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  copy: wrap(
    '<rect x="9" y="9" width="11" height="11" rx="2"/>' +
      '<path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a3 3 0 0 0-3 3v6.5A2.5 2.5 0 0 0 5.5 15"/>'
  ),
  done: wrap('<path d="m4 12.5 5 5L20 6.5"/>', 2.6),
  text: wrap(
    '<rect x="9" y="9" width="11" height="11" rx="2"/>' +
      '<path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a3 3 0 0 0-3 3v6.5A2.5 2.5 0 0 0 5.5 15"/>',
    1.7
  ),
  image: wrap(
    '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
      '<circle cx="8.5" cy="9.5" r="1.6"/>' +
      '<path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>',
    1.7
  ),
  download: wrap(
    '<path d="M12 3v11"/><path d="m7.5 10 4.5 4.5L16.5 10"/><path d="M4 19h16"/>',
    1.7
  ),
};
