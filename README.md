# 开票与收款信息 · Invoice & Payment Info

供销售人员直接发给客户的开票与收款信息页。多家公司以 Tab 分区，**不同主体的信息在结构上彼此隔离**（每家渲染为独立的 `<section role="tabpanel">`，切换只改 `hidden`，不跨公司复用 DOM 或共享状态），并支持把某一家公司以专属链接直接打开。

极简黑白风格：只用字号、字重、留白和一根细线建立层级，唯一的色彩是区块序号（蓝 / 绿 / 橙），用于区分"开票信息 / 对公账户 / 对私账户"。

零依赖、零构建，纯静态 HTML / CSS / JS。

- 代码仓库：<https://github.com/cccgitzh/kpxx>
- 线上地址：<https://kpxx.edgeone.dev>（EdgeOne Makers 项目 `kpxx`，海外区）

## 功能

**三层复制粒度**

| 层级 | 操作 | 复制内容 |
|---|---|---|
| 单行 | 鼠标移到某行，右侧浮出复制图标（手机常显） | 该行的值，银行账号复制为纯数字 |
| 整块 | 区块标题右侧「复制」 | `【块标题】` + 该块所有 `标签：值` |
| 整页 | 底部「复制全文」 | 全部区块 + 页脚，块间空行 |
| 整页 | 底部「复制图片」/「下载图片」 | 3 倍分辨率 PNG，可直接粘贴到微信/邮件 |

**其它**

- 公司 Tab 支持 `←` `→` `Home` `End` 键盘导航，符合 WAI-ARIA Tabs 规范。
- `index.html#公司id` 直达某个开票主体，转发时不会让对方看到别家公司。
- 打印 / 存为 PDF：自动隐藏 Tab 与操作条，只保留当前主体。
- `noindex` 不被搜索引擎收录。
- 响应式：桌面双栏（标签 / 值左右排布），手机自动改为上下堆叠、复制图标常显。

## 目录结构

```
invoice-info/
├── index.html                  # 页面骨架（只声明容器，不含渲染逻辑）
├── assets/
│   ├── css/
│   │   ├── tokens.css          # 设计令牌：颜色 / 字号 / 间距 / 圆角
│   │   ├── base.css            # 重置与全局排版
│   │   ├── layout.css          # 页面骨架、页头、Tab、纸面
│   │   ├── components.css      # 区块、信息行、操作条、提示
│   │   └── print.css           # 打印样式（仅打印时加载）
│   └── js/
│       ├── data.js             # ★ 唯一需要修改的数据文件（普通脚本）
│       ├── main.js             # 入口：读数据 → 建状态 → 接视图
│       ├── core/               # 与业务无关的基础能力
│       │   ├── dom.js          #   元素创建、事件绑定
│       │   ├── format.js       #   账号 4 位分组
│       │   ├── theme.js        #   从 CSS 读设计令牌（供 Canvas 用）
│       │   ├── clipboard.js    #   写剪贴板 / 下载（含降级）
│       │   ├── feedback.js     #   提示条 + 按钮对勾
│       │   └── actions.js      #   "复制 + 反馈"组合动作
│       ├── model/              # 数据与状态
│       │   ├── normalize.js    #   原始数据 → 渲染模型
│       │   ├── texts.js        #   纯文本序列化（复制出去的格式）
│       │   └── store.js        #   当前公司状态 + 订阅
│       ├── ui/                 # 视图
│       │   ├── tabs.js         #   公司切换器（含键盘操作）
│       │   ├── panel.js        #   公司面板（事件委托）
│       │   ├── dock.js         #   底部操作条
│       │   └── icons.js        #   内联 SVG 图标
│       └── export/
│           └── image.js        # Canvas 出图
└── README.md
```

依赖方向是单向的：`ui / export` → `model` → `core`，`main.js` 只做装配，
因此改样式不会碰到数据，换数据也不用动渲染。

## 替换为真实信息

只需要编辑 `assets/js/data.js` 里的 `companies` 数组，页面会自动生成 Tab 与区块：

```js
{
  id: "your-company",            // 唯一标识，用于 #锚点直达
  tabName: "公司简称",
  tabMeta: "上海 · 总部",         // Tab 上的灰色小字，可省略

  // ① 开票信息（字段固定顺序，留空则自动隐藏该行）
  fullName: "××科技有限公司",
  taxId: "91310115MA1K9X8Q2T",
  address: "注册地址",
  phone: "注册电话",
  bankName: "开户银行（含支行）",
  bankAccount: "1001234567890123456",   // 纯数字，展示时自动 4 位分组
  taxNote: "增值税专用发票 13%（货物）、6%（技术服务）；普通发票（电子）同税率",

  // ② ③ 收款账户：可只配 1 个，也可以配 3 个以上
  receiptAccounts: [
    {
      title: "对公收款账户（推荐）",
      tone: "two",                        // one=蓝 two=绿 thr=橙
      rows: [
        ["账户名称", "××科技有限公司"],
        ["开户银行", "中国工商银行××支行"],
        ["银行账号", "1001234567890123456", "account"], // account=4 位分组、复制纯数字
        ["联行号", "102290012345", "mono"],             // mono=等宽字体
      ],
    },
  ],
}
```

行数组的第三个参数可选：`"account"` 按 4 位分组展示（复制时仍是纯数字）、`"mono"` 用等宽字体、省略则为普通文本。

文件顶部还可修改 `siteTitle`、`siteSubtitle`、`updatedAt`、`footer`、`defaultCompanyId`。

> ⚠️ 仓库内的公司名称、税号、电话、账号均为**演示数据**，上线前请替换为财务提供的真实信息。
> 页面为公开可访问，若信息敏感，建议只发给特定客户，或后续绑定备案域名再加访问口令。

## 本地预览

```bash
python -m http.server 8088
# 打开 http://127.0.0.1:8088/
```

> 脚本使用 ES Module，**必须通过 http(s) 访问**；直接双击 `index.html`（`file://`）时模块不会执行，
> 页面会显示一条提示而不是白屏。复制图片与复制文本依赖 HTTPS 安全上下文，`file://` 下「复制图片」会降级为下载。

## 部署

已部署在 EdgeOne Makers（静态站点，无需构建）。更新内容后重新部署：

```bash
npm i -g edgeone@latest
edgeone makers deploy -n kpxx -a overseas
```

> 说明：`edgeone.cool`（中国区）域名受备案策略限制，直接访问会被鉴权网关拦截返回 401，因此本项目部署在海外区（`edgeone.dev`）以获得公开可访问地址。若要长期稳定对外，建议在控制台绑定一个已完成 ICP 备案的自有域名。
