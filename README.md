# 开票信息展示页 · Invoice Info

一个供销售人员直接发给客户的开票信息页面。多家公司以 Tab 分区展示，**不同主体的开票信息在结构上彼此隔离**（每家公司渲染为独立的 `<section role="tabpanel">`，切换时只切换显示状态，不跨公司复用 DOM 或共享可变状态），并支持把某一家公司的信息以专属链接直接打开。

零依赖、零构建，纯静态 HTML / CSS / JS。

- 代码仓库：<https://github.com/cccgitzh/kpxx>
- 线上地址：<https://kpxx.edgeone.dev>（EdgeOne Makers 项目 `kpxx`，海外区）

## 功能

- **多主体 Tab 切换**：桌面端等分排列，移动端横向滑动；支持 `←` `→` `Home` `End` 键盘导航，符合 WAI-ARIA Tabs 规范。
- **关键信息突出**：公司全称作为页面主标题，纳税人识别号使用等宽字体 + 高亮底色作为第二视觉锚点。
- **字段完整**：公司全称、纳税人识别号、注册地址、注册电话、开户银行、银行账号、可开具发票类型及对应税率说明。
- **一键复制**：每个字段可单独复制，也可「复制全部信息」生成适合微信 / 邮件直接转发的纯文本；银行账号按 4 位分组展示，复制时仍为纯数字。
- **转发与分享**：调用系统分享面板（移动端），不支持的浏览器自动降级为复制文本。
- **专属链接**：`index.html#公司id` 可直接定位到某一开票主体，转发时不会让对方看到别家公司的信息。
- **打印友好**：一键打印 / 存为 PDF，自动隐藏切换器与按钮，只保留当前主体内容。
- **响应式**：单列 / 双列栅格自动切换，适配手机、平板与桌面。

## 目录结构

```
invoice-info/
├── index.html              # 页面骨架（最后编写，依赖先就位）
├── assets/
│   ├── css/style.css       # 全部样式（含响应式与打印样式）
│   └── js/
│       ├── data.js         # ★ 唯一需要修改的数据文件
│       └── app.js          # 渲染与交互逻辑
└── README.md
```

## 替换为真实信息

只需要编辑 `assets/js/data.js` 里的 `companies` 数组，页面会自动生成对应的 Tab 与内容：

```js
{
  id: "your-company",          // 唯一标识，用于 #锚点直达
  tabName: "公司简称",          // Tab 上的名称
  tabMeta: "城市 · 分部",       // Tab 上的小字补充
  fullName: "××科技有限公司",   // 营业执照全称
  englishName: "…",            // 可选
  taxpayerType: "增值税一般纳税人",
  taxId: "91310115MA1K9X8Q2T", // 纳税人识别号
  address: "注册地址",
  phone: "注册电话",
  bankName: "开户银行（含支行）",
  bankAccount: "银行账号（纯数字）",
  invoiceTypes: [
    { name: "增值税专用发票", rate: "13%", desc: "适用范围说明" }
  ],
  notice: "该主体的专属提示，可留空"
}
```

同时可修改文件顶部的 `siteTitle`、`siteSubtitle`、`updatedAt`、`defaultCompanyId`。

> ⚠️ 仓库内的公司名称、税号、电话、账号均为**演示数据**，上线前请务必替换为财务部门提供的真实信息，并确认公开托管的合规性（若信息不宜公开，请将仓库设为私有，或为页面增加简单访问口令）。

## 本地预览

```bash
# 任意静态服务器均可
python -m http.server 8088
# 然后打开 http://127.0.0.1:8088/
```

## 部署

已通过 EdgeOne Makers 部署（静态站点，无需构建），线上地址 <https://kpxx.edgeone.dev>。后续更新内容后重新部署：

```bash
npm i -g edgeone@latest
edgeone makers deploy -n kpxx -a overseas
```

> 说明：`edgeone.cool`（中国区）域名受备案策略限制，直接访问会被鉴权网关拦截返回 401，因此本项目部署在海外区（`edgeone.dev`）以获得公开可访问的地址。若要长期稳定对外，建议在控制台为项目绑定一个已完成 ICP 备案的自有域名。
