# flash-promoter 多平台内容发布工具 PRD

> 版本：v1.0  
> 日期：2026-05-29  
> 文档类型：产品需求文档 / PRD  
> 适用对象：产品经理、前端工程师、后端工程师、桌面端工程师、平台适配开发者  
> 产品定位：面向创作者、企业新媒体运营、知识博主、视频创作者的多平台内容适配与发布工作台  

---

## 1. 项目概述

### 1.1 项目背景

很多创作者需要在微信公众号、知乎、B站、小红书等平台同步发布内容。实际操作中，同一份内容往往不能直接复制到所有平台：

- 公众号偏长文阅读，重排版、摘要、封面、正文图片和图文结构。
- 知乎偏知识表达和讨论，重逻辑、问题意识、可信度和反营销感。
- B站偏视频/专栏，重标题、标签、分区、简介、时间轴、封面和审核状态。
- 小红书偏图文笔记，重封面感、短句、标签、场景化表达和图片卡片。

创作者通常需要重复执行以下操作：

1. 修改标题。
2. 调整正文格式。
3. 拆分长文。
4. 修改图片尺寸。
5. 生成不同平台的标签、话题、摘要。
6. 分别登录平台。
7. 复制粘贴内容。
8. 上传封面和正文图片。
9. 检查格式。
10. 发布或保存草稿。

这导致内容分发效率低、格式不一致、错误率高，并且团队协作时难以追踪每个平台的发布状态。

本项目旨在设计并实现一个工具，使用户可以在一个工作台中输入原始内容，系统自动生成适配各平台的版本，并支持一键发布、生成草稿、辅助发布或模拟发布。

---

## 2. 产品一句话定位

**flash-promoter 是一个面向创作者的多平台内容适配与发布工具，支持一次输入内容，自动生成公众号、知乎、B站、小红书等平台的专属版本，并通过官方 API、浏览器辅助或模拟发布完成分发。**

---

## 3. 核心目标

### 3.1 产品目标

1. 降低创作者在多平台发布内容时的重复劳动。
2. 将“同一内容复制粘贴”升级为“同一内容多平台风格化适配”。
3. 支持平台格式预览、发布前校验、发布状态追踪。
4. 提供插件化平台适配架构，方便后续扩展抖音、快手、微博、头条、CSDN、掘金、WordPress、自建站等平台。
5. 在不绕过平台规则的前提下，尽可能实现自动化或半自动化发布。

### 3.2 MVP 目标

第一版不追求所有平台真实直发，而是优先实现：

- 统一内容编辑器。
- Markdown / 富文本输入。
- 自动生成公众号、知乎、B站、小红书四个平台适配版本。
- 各平台预览。
- 发布前校验。
- 模拟发布。
- 公众号草稿生成能力。
- B站视频/专栏发布参数生成与后续 API 接入预留。
- 知乎、小红书浏览器辅助发布预留。

---

## 4. 非目标与边界

### 4.1 非目标

MVP 阶段暂不做：

1. 全平台账号矩阵管理。
2. 全平台真实直发。
3. 平台数据增长分析。
4. 粉丝画像分析。
5. 评论区自动回复。
6. 自动搬运他人内容。
7. 绕过验证码、绕过平台审核、绕过风控。
8. 非官方隐藏接口抓包发布。
9. 批量营销号式群发。
10. 内容违规规避工具。

### 4.2 合规边界

本产品必须遵守以下原则：

- 不绕过平台登录机制。
- 不绕过平台验证码。
- 不绕过平台风控。
- 不使用非公开隐藏接口作为核心稳定能力。
- 不承诺知乎、小红书等平台的普通创作者账号一定可官方 API 直发。
- 浏览器辅助发布必须由用户已登录账号主动操作。
- 真实发布前必须提供二次确认。
- 支持模拟发布，用于测试和演示。
- 所有真实发布行为必须记录日志。

---

## 5. 用户画像

### 5.1 个人知识创作者

特点：

- 经常写长文、经验总结、科普内容。
- 主要分发到公众号、知乎、小红书、B站专栏。
- 关注效率和排版质量。
- 账号数量少，一般 1-3 个。

核心需求：

- 一篇文章自动改成不同平台版本。
- 自动生成标题、摘要、标签。
- 减少重复复制粘贴。
- 保留每个平台发布记录。

### 5.2 视频创作者

特点：

- 内容核心是视频，但需要同步发布图文说明。
- 主要平台包括 B站、小红书、公众号。
- 需要生成视频标题、简介、标签、封面文案、置顶评论。

核心需求：

- 视频上传和投稿信息准备。
- 自动生成简介、标签和分区建议。
- 从视频脚本生成小红书笔记、公众号图文、知乎回答。
- 支持发布前检查。

### 5.3 企业新媒体运营

特点：

- 多账号、多平台、多成员协作。
- 内容需要审核。
- 需要统一品牌口径。
- 需要定时发布和状态追踪。

核心需求：

- 统一内容池。
- 平台版本差异化。
- 发布状态看板。
- 审核流。
- 权限控制。
- 发布日志。

### 5.4 技术/开源项目维护者

特点：

- 经常发布技术文章、版本更新、教程、公告。
- 平台包括公众号、知乎、掘金、CSDN、B站。
- 需要 Markdown 友好。

核心需求：

- Markdown 直接导入。
- 代码块格式保留。
- 技术平台适配。
- 自动生成技术摘要和标签。

---

## 6. 典型使用场景

### 6.1 场景一：一篇长文同步到四个平台

用户输入一篇 Markdown 长文，点击“生成平台版本”。

系统输出：

- 公众号版：完整长文、摘要、封面建议、分级标题、图文排版。
- 知乎版：更强问题意识、逻辑论证、弱营销表达。
- B站版：专栏版正文、视频简介、标题、标签、分区建议。
- 小红书版：短标题、短句正文、话题标签、封面文案、图文卡片拆分。

用户分别预览后，选择：

- 公众号：生成草稿。
- B站：模拟发布。
- 知乎：复制或辅助填充。
- 小红书：生成图文卡片并辅助发布。

### 6.2 场景二：视频脚本转多平台内容

用户输入视频脚本和视频文件。

系统输出：

- B站投稿标题、简介、标签、分区建议、时间轴、置顶评论。
- 小红书图文笔记。
- 公众号推文版。
- 知乎问答版。

### 6.3 场景三：团队审核后发布

运营人员创建内容，AI 生成平台版本，提交主管审核。

审核通过后：

- 公众号生成草稿。
- B站提交稿件。
- 知乎打开辅助发布页。
- 小红书生成发布素材包。

系统记录每个平台的状态。

---

## 7. 平台能力调研与策略

### 7.1 平台能力总表

| 平台 | 内容形态 | 推荐发布方式 | MVP 策略 | 后续策略 |
|---|---|---|---|---|
| 微信公众号 | 图文、草稿、发布 | 官方 API | 生成草稿，默认不直发 | 支持发布草稿、查询状态 |
| 知乎 | 文章、回答、想法 | 浏览器辅助 | 生成知乎版内容，复制/辅助发布 | 根据官方能力变化再接入 |
| B站 | 视频、专栏文章 | 官方开放平台 API | 生成投稿参数、模拟发布 | 接入视频上传、合片、投稿、文章提交 |
| 小红书 | 图文笔记、视频笔记 | 分享开放平台 / 浏览器辅助 | 生成笔记文案、卡片、话题 | 移动端唤起、分享开放平台、辅助发布 |
| 掘金/CSDN | 技术文章 | API / 辅助发布 | 暂不纳入 MVP | 插件化扩展 |
| WordPress | 博客文章 | 官方 REST API | 暂不纳入 MVP | 插件化扩展 |
| 微博 | 短文、图片 | API / 辅助发布 | 暂不纳入 MVP | 插件化扩展 |
| 抖音/快手 | 短视频 | 开放平台 / 辅助发布 | 暂不纳入 MVP | 视频发布插件 |

### 7.2 公众号策略

公众号优先支持“生成草稿”，而不是默认真实发布。

原因：

- 公众号图文有封面、摘要、正文图片、原创声明、转载、推荐机制等细节。
- 正式发布影响较大。
- API 发布涉及 access_token、AppID、AppSecret、IP 白名单、素材上传等配置。
- 草稿箱更适合作为安全默认行为。

公众号流程建议：

```text
获取 access_token
→ 上传封面素材
→ 上传正文图片
→ 替换正文图片 URL
→ 新建草稿
→ 返回草稿 media_id
→ 用户可选择在公众号后台检查
→ 可选调用发布接口
→ 查询发布状态
```

### 7.3 B站策略

B站分为视频稿件和专栏稿件两类。

视频投稿流程：

```text
校验视频文件
→ 上传封面
→ 视频分片上传
→ 分片合片
→ 提交视频稿件
→ 查询审核状态
```

专栏文章流程：

```text
处理正文图片
→ 上传文章图片
→ 替换图片 URL
→ 提交文章
→ 查询审核状态
```

B站投稿后存在审核过程，因此系统不能把“提交成功”等同于“发布成功”。发布结果状态应区分：

- 已提交。
- 审核中。
- 审核通过。
- 审核失败。
- 已撤回。
- 发布失败。

### 7.4 知乎策略

知乎 MVP 阶段不承诺官方 API 直发。

推荐策略：

```text
生成知乎版内容
→ 用户预览
→ 点击“辅助发布”
→ 打开知乎发布页
→ 自动填充标题和正文
→ 用户检查
→ 用户手动点击发布
```

知乎适配重点：

- 减少营销口吻。
- 增强论证结构。
- 保留事实依据。
- 避免标题党。
- 可生成“回答版”和“文章版”两种输出。

### 7.5 小红书策略

小红书 MVP 阶段重点做内容适配和素材包生成。

推荐策略：

```text
生成小红书版标题
→ 生成短句正文
→ 生成话题标签
→ 生成封面文案
→ 长文拆分为图文卡片
→ 导出图片素材包
→ 浏览器辅助或移动端分享发布
```

小红书适配重点：

- 短标题。
- 强场景。
- 短段落。
- 话题标签。
- 封面吸引力。
- 适当 emoji，可开关。
- 图片比例适配。
- 避免夸大、医疗化、绝对化、功效承诺等高风险表达。

---

## 8. 核心功能需求

### 8.1 内容输入

#### 8.1.1 支持输入方式

| 输入方式 | MVP 支持 | 说明 |
|---|---|---|
| Markdown 输入 | 是 | 核心输入方式 |
| 富文本编辑 | 是 | 基础富文本能力 |
| 粘贴网页内容 | 是 | 自动清理格式 |
| 导入 Word | 否 | 后续支持 |
| 导入公众号链接 | 否 | 后续支持 |
| 导入视频脚本 | 是 | 作为文本输入 |
| 导入视频文件 | 部分支持 | MVP 可只做元数据和模拟发布 |
| 导入图片 | 是 | 用于正文图、封面、卡片图 |

#### 8.1.2 输入编辑器要求

- 支持标题、正文、摘要、标签。
- 支持 Markdown 预览。
- 支持图片拖拽上传。
- 支持代码块。
- 支持引用。
- 支持列表。
- 支持标题层级。
- 支持一键格式清理。
- 支持保存为本地草稿。

---

### 8.2 内容解析

用户输入内容后，系统需要解析为统一内容模型 `CanonicalPost`。

```ts
type CanonicalPost = {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  body: Block[];
  assets: Asset[];
  tags: string[];
  topics?: string[];
  authorNote?: string;
  sourceUrl?: string;
  contentType: "article" | "video" | "image-note" | "qa-answer";
  createdAt: number;
  updatedAt: number;
};
```

正文使用 Block 模型：

```ts
type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "image"; assetId: string; caption?: string }
  | { type: "quote"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "divider" };
```

这样可以避免后续平台转换时丢失结构。

---

### 8.3 AI 平台适配

#### 8.3.1 功能描述

用户点击“生成平台版本”后，系统调用 AI 生成不同平台版本。

输出必须是结构化 JSON，不允许 AI 直接控制发布行为。

#### 8.3.2 适配输出

```json
{
  "wechat": {
    "title": "",
    "summary": "",
    "bodyMarkdown": "",
    "coverPrompt": "",
    "coverText": "",
    "riskNotes": []
  },
  "zhihu": {
    "title": "",
    "bodyMarkdown": "",
    "topics": [],
    "answerStyle": "",
    "riskNotes": []
  },
  "bilibili": {
    "videoTitle": "",
    "articleTitle": "",
    "description": "",
    "tags": [],
    "partitionSuggestion": "",
    "timeline": [],
    "pinnedComment": "",
    "riskNotes": []
  },
  "xiaohongshu": {
    "title": "",
    "content": "",
    "hashtags": [],
    "coverText": "",
    "cardTexts": [],
    "emojiLevel": "none | low | medium",
    "riskNotes": []
  }
}
```

#### 8.3.3 AI 适配规则

AI 必须遵守：

1. 不改变事实。
2. 不编造数据。
3. 不编造引用。
4. 不夸大效果。
5. 不生成违规营销表达。
6. 不主动加入敏感内容。
7. 不生成“平台规避”相关建议。
8. 输出必须可回溯到原始内容。
9. 每个平台版本应保持主旨一致，但表达方式可以不同。
10. 所有生成内容需要用户可编辑。

---

### 8.4 平台预览

每个平台需要有独立预览页。

#### 8.4.1 公众号预览

展示：

- 标题。
- 作者。
- 摘要。
- 封面。
- 正文排版。
- 图片位置。
- 二级标题样式。
- 引用样式。
- 分享卡片摘要。

#### 8.4.2 知乎预览

展示：

- 标题。
- 正文。
- 话题。
- 文章版 / 回答版切换。
- 逻辑结构提示。
- 营销化风险提示。

#### 8.4.3 B站预览

展示：

- 视频标题。
- 简介。
- 标签。
- 分区建议。
- 封面。
- 时间轴。
- 置顶评论。
- 专栏文章预览。

#### 8.4.4 小红书预览

展示：

- 标题。
- 封面文案。
- 正文。
- 话题标签。
- 图片卡片预览。
- 卡片顺序。
- 字数和标签数量检查。

---

### 8.5 发布前校验

每个平台发布前必须校验。

#### 8.5.1 通用校验

- 标题不能为空。
- 正文不能为空。
- 图片资源存在。
- 图片格式支持。
- 标签数量合规。
- 内容长度不超限。
- 是否存在外链。
- 是否存在高风险词。
- 是否存在明显空段落。
- 是否存在未上传资产。
- 是否存在 AI 生成但未确认内容。

#### 8.5.2 公众号校验

- 封面 media_id 是否存在。
- 正文图片是否已上传到公众号接口。
- 摘要长度是否合适。
- 标题长度是否合适。
- HTML 是否包含不支持标签。
- 是否默认生成草稿而不是直接发布。
- access_token 是否有效。
- 是否配置 IP 白名单。

#### 8.5.3 B站校验

- 标题长度。
- 简介长度。
- 标签数量。
- 分区是否已选择。
- 封面是否存在。
- 视频文件是否存在。
- 视频格式是否支持。
- 分片上传状态。
- 合片状态。
- 稿件提交状态。

#### 8.5.4 知乎校验

- 标题是否过度营销。
- 正文是否过短。
- 是否存在明显广告语。
- 外链是否过多。
- 问题意识是否明确。
- 是否有复制到剪贴板能力。

#### 8.5.5 小红书校验

- 标题长度。
- 正文短句化程度。
- 话题数量。
- 图片数量。
- 封面文案长度。
- 是否存在夸大表达。
- 是否存在敏感功效表达。
- 是否生成图片卡片。

---

## 9. 发布模式设计

### 9.1 四种发布模式

```ts
type PublishMode =
  | "simulate"
  | "draft"
  | "assist"
  | "publish";
```

| 模式 | 含义 | 适用平台 |
|---|---|---|
| simulate | 模拟发布，不调用平台 | 所有平台 |
| draft | 生成平台草稿 | 公众号、B站专栏等 |
| assist | 浏览器辅助填写，用户手动确认 | 知乎、小红书 |
| publish | 真实发布 | 仅限官方 API 能力明确的平台 |

### 9.2 默认模式

```ts
const defaultPublishMode = {
  wechat: "draft",
  bilibili: "simulate",
  zhihu: "assist",
  xiaohongshu: "assist"
};
```

### 9.3 发布状态

```ts
type PublishStatus =
  | "pending"
  | "validating"
  | "ready"
  | "simulated"
  | "draft_created"
  | "assist_opened"
  | "submitted"
  | "reviewing"
  | "published"
  | "failed"
  | "cancelled";
```

---

## 10. 浏览器辅助发布设计

### 10.1 适用场景

当平台没有稳定公开 API，或普通创作者难以获得发布权限时，使用浏览器辅助发布。

适用平台：

- 知乎。
- 小红书。
- 后续可扩展微博、头条、CSDN、掘金等。

### 10.2 工作方式

```text
用户点击辅助发布
→ 系统打开平台发布页
→ 用户使用自己的账号登录
→ 工具填充标题、正文、标签、图片
→ 用户检查内容
→ 用户手动点击发布
→ 工具记录“已打开辅助发布”
```

### 10.3 边界

浏览器辅助发布不得：

- 绕过登录。
- 绕过验证码。
- 自动破解风控。
- 使用隐藏接口。
- 自动点击最终发布按钮，除非用户明确开启并且平台规则允许。

---

## 11. 资产处理设计

### 11.1 图片资产

图片资产统一进入 Asset Pipeline。

```text
本地图片
→ 读取元数据
→ 格式校验
→ 压缩
→ 裁剪
→ 平台尺寸转换
→ 上传到对应平台
→ 替换正文引用
```

### 11.2 图片规格建议

| 平台 | 图片处理建议 |
|---|---|
| 公众号 | 正文图清晰，封面图单独处理，正文图片需上传并替换 URL |
| 知乎 | 保持清晰，减少过度营销封面 |
| B站 | 重点处理视频封面，专栏图需要平台图床 |
| 小红书 | 强化封面图，支持 3:4、1:1、4:5 卡片导出 |

### 11.3 小红书图文卡片生成

系统应支持将长文拆分为卡片：

```ts
type XhsCard = {
  index: number;
  title?: string;
  text: string;
  imageAssetId?: string;
  layout: "cover" | "text" | "image_text" | "summary";
};
```

卡片类型：

- 封面卡。
- 问题卡。
- 要点卡。
- 案例卡。
- 总结卡。
- 引导互动卡。

### 11.4 视频资产

视频资产用于 B站：

```text
本地视频
→ 校验格式
→ 获取时长
→ 提取封面候选帧
→ 生成封面图
→ 分片上传
→ 合片
→ 稿件提交
```

MVP 可只做视频元数据读取、封面建议和模拟发布。

---

## 12. 平台插件架构

### 12.1 插件接口

所有平台通过统一 `PlatformAdapter` 接入。

```ts
export type PublishMode = "simulate" | "draft" | "assist" | "publish";

export interface PlatformAdapter {
  id: string;
  name: string;

  capabilities: {
    supportsDraft: boolean;
    supportsDirectPublish: boolean;
    supportsAssistPublish: boolean;
    supportsSchedule: boolean;
    contentTypes: Array<"article" | "video" | "image-note" | "qa-answer">;
  };

  transform(input: CanonicalPost, options: TransformOptions): Promise<PlatformDraft>;

  validate(draft: PlatformDraft): Promise<ValidationResult>;

  publish(
    draft: PlatformDraft,
    account: PlatformAccount,
    mode: PublishMode
  ): Promise<PublishResult>;
}
```

### 12.2 平台草稿模型

```ts
type PlatformDraft = {
  id: string;
  platform: string;
  postId: string;
  title: string;
  body: string | Block[];
  summary?: string;
  tags?: string[];
  topics?: string[];
  assets?: Asset[];
  platformMeta: Record<string, any>;
  validation?: ValidationResult;
  createdAt: number;
  updatedAt: number;
};
```

### 12.3 发布结果模型

```ts
type PublishResult = {
  platform: string;
  mode: PublishMode;
  status: PublishStatus;
  externalId?: string;
  url?: string;
  draftId?: string;
  reviewStatus?: string;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
  raw?: any;
  createdAt: number;
};
```

### 12.4 新平台接入流程

新增平台只需要完成：

1. 新建 adapter。
2. 声明能力。
3. 实现 transform。
4. 实现 validate。
5. 实现 publish。
6. 配置平台限制。
7. 增加预览组件。
8. 增加测试用例。

示例：

```ts
export const juejinAdapter: PlatformAdapter = {
  id: "juejin",
  name: "掘金",

  capabilities: {
    supportsDraft: true,
    supportsDirectPublish: false,
    supportsAssistPublish: true,
    supportsSchedule: false,
    contentTypes: ["article"]
  },

  async transform(input, options) {
    // 转为掘金技术文章风格
  },

  async validate(draft) {
    // 校验标题、标签、正文、代码块
  },

  async publish(draft, account, mode) {
    // 模拟 / 辅助 / API 发布
  }
};
```

---

## 13. 系统架构

### 13.1 推荐形态

推荐优先做 **本地桌面应用**，而不是纯 SaaS。

原因：

- 用户账号和 cookie 更适合保存在本地。
- 浏览器辅助发布更容易实现。
- 图片、视频等大文件不必先上传云端。
- 用户对平台账号安全更信任。
- 更适合个人创作者和小团队早期使用。

建议技术栈：

```text
Tauri / Electron
+ React
+ TypeScript
+ Node.js Worker
+ Playwright
+ SQLite
+ 本地加密凭证存储
```

### 13.2 架构图

```text
┌─────────────────────────────────────┐
│             Desktop UI              │
│  编辑器 / 平台预览 / 发布面板 / 日志  │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│             Core Engine             │
│ CanonicalPost / Pipeline / JobQueue  │
└─────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ AI Layer │ │ Renderer │ │ Assets   │
└──────────┘ └──────────┘ └──────────┘
        │         │         │
        └─────────┼─────────┘
                  ▼
┌─────────────────────────────────────┐
│          Platform Adapters           │
│ WeChat / Bilibili / Zhihu / XHS      │
└─────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   Official API  Assist    Simulate
```

### 13.3 模块划分

```text
flash-promoter/
  apps/
    desktop/
      src/
        pages/
        components/
        stores/
        routes/
    local-api/
      src/
        server.ts
        ipc.ts

  packages/
    core/
      src/
        canonical/
        pipeline/
        job-queue/
        validation/
    ai-adapter/
      src/
        prompts/
        schema/
        llm-client/
    renderer/
      src/
        markdown/
        html/
        wechat/
        zhihu/
        bilibili/
        xhs/
    asset-pipeline/
      src/
        image/
        video/
        uploader/
    adapters/
      mock/
      wechat/
      bilibili/
      zhihu-assist/
      xhs-assist/
    browser-assist/
      src/
        playwright/
        selectors/
        fill-strategies/
    storage/
      src/
        sqlite/
        encryption/
```

---

## 14. 数据库设计

### 14.1 posts

```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 14.2 platform_drafts

```sql
CREATE TABLE platform_drafts (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  draft_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 14.3 publish_jobs

```sql
CREATE TABLE publish_jobs (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  result_json TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 14.4 accounts

```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  display_name TEXT,
  auth_type TEXT NOT NULL,
  encrypted_credentials TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 14.5 assets

```sql
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  type TEXT NOT NULL,
  local_path TEXT,
  mime_type TEXT,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  hash TEXT,
  platform_urls_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 14.6 publish_logs

```sql
CREATE TABLE publish_logs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  raw_json TEXT,
  created_at INTEGER NOT NULL
);
```

---

## 15. API / IPC 设计

### 15.1 创建内容

```http
POST /posts
```

请求：

```json
{
  "title": "原始标题",
  "bodyMarkdown": "正文内容",
  "tags": ["AI", "创作"]
}
```

响应：

```json
{
  "id": "post_001",
  "status": "created"
}
```

### 15.2 生成平台版本

```http
POST /posts/{postId}/generate
```

请求：

```json
{
  "platforms": ["wechat", "zhihu", "bilibili", "xiaohongshu"],
  "style": "balanced"
}
```

响应：

```json
{
  "drafts": [
    {
      "id": "draft_001",
      "platform": "wechat",
      "status": "ready"
    }
  ]
}
```

### 15.3 校验平台草稿

```http
POST /drafts/{draftId}/validate
```

响应：

```json
{
  "ok": true,
  "warnings": [],
  "errors": []
}
```

### 15.4 发布草稿

```http
POST /drafts/{draftId}/publish
```

请求：

```json
{
  "mode": "simulate"
}
```

响应：

```json
{
  "jobId": "job_001",
  "status": "simulated"
}
```

### 15.5 获取发布状态

```http
GET /publish-jobs/{jobId}
```

响应：

```json
{
  "jobId": "job_001",
  "platform": "wechat",
  "status": "draft_created",
  "message": "公众号草稿创建成功"
}
```

---

## 16. UI 设计

### 16.1 页面结构

```text
左侧导航：
- 内容列表
- 新建内容
- 发布任务
- 平台账号
- 设置

主工作区：
- 原始内容编辑器
- 平台版本 Tab
- 平台预览
- 校验结果
- 发布按钮

右侧面板：
- AI 生成选项
- 平台适配选项
- 资产列表
- 发布日志
```

### 16.2 主要页面

#### 内容列表页

展示：

- 标题。
- 创建时间。
- 最近更新时间。
- 已生成平台。
- 发布状态。
- 操作按钮。

#### 编辑器页

包含：

- 原始内容编辑。
- Markdown 预览。
- 图片上传。
- 一键生成平台版本。
- 保存草稿。

#### 平台预览页

使用 Tab：

- 公众号。
- 知乎。
- B站。
- 小红书。

每个 Tab 包含：

- 平台标题。
- 平台正文。
- 标签。
- 封面。
- 校验结果。
- 发布操作。

#### 发布任务页

展示：

- 平台。
- 模式。
- 状态。
- 外部 ID。
- 错误信息。
- 创建时间。
- 最近更新时间。

---

## 17. 发布任务流程

### 17.1 单平台发布

```text
用户选择平台
→ 系统读取平台草稿
→ 执行校验
→ 校验失败则阻止发布
→ 校验通过
→ 创建 publish_job
→ 执行对应 adapter.publish()
→ 写入 publish_logs
→ 返回结果
```

### 17.2 多平台发布

```text
用户选择多个平台
→ 按平台分别校验
→ 失败平台显示错误
→ 成功平台进入发布队列
→ 每个平台独立执行
→ 汇总发布报告
```

### 17.3 失败重试

失败类型：

- 网络错误。
- access_token 失效。
- 图片上传失败。
- 平台参数不合法。
- 浏览器页面结构变化。
- 用户取消。
- 平台审核失败。

重试策略：

- 网络错误可自动重试 2 次。
- token 失效可刷新后重试。
- 参数错误不自动重试。
- 审核失败不自动重试。
- 浏览器辅助失败需用户手动重启流程。

---

## 18. 安全设计

### 18.1 凭证管理

必须支持：

- 本地加密存储。
- 不明文保存 AppSecret。
- 不在日志中输出 access_token。
- 不在前端持久化敏感字段。
- 支持用户删除账号授权。
- 支持导出前清理敏感信息。

桌面端可使用：

- macOS Keychain。
- Windows Credential Manager。
- Linux Secret Service。
- 或本地加密 vault。

### 18.2 发布安全

- 真实发布前弹出确认。
- 批量发布需要二次确认。
- 默认使用草稿或模拟发布。
- 发布日志可审计。
- 发布失败不重复提交。
- 用户可取消任务。

### 18.3 内容安全

- AI 生成内容必须标记为“未确认”。
- 用户确认后才能发布。
- 高风险内容显示警告。
- 不提供规避平台审核建议。
- 不提供违规内容美化建议。

---

## 19. 权限设计

MVP 阶段可简化为单用户本地模式。

后续团队版支持：

| 角色 | 权限 |
|---|---|
| Owner | 全部权限 |
| Admin | 账号管理、发布、审核 |
| Editor | 编辑内容、生成平台版本 |
| Reviewer | 审核内容 |
| Publisher | 发布内容 |
| Viewer | 只读查看 |

审核流：

```text
编辑中
→ 待审核
→ 审核通过
→ 可发布
→ 已发布
```

---

## 20. 竞品参考

### 20.1 Wechatsync

特点：

- Chrome 浏览器扩展。
- 支持微信公众号文章同步到知乎、头条、掘金、小红书、CSDN 等多个平台。
- 偏文章同步和插件形态。
- 适合参考其“浏览器扩展 + 多平台同步”的产品路径。

差异化方向：

- flash-promoter 不只是同步，而是做平台风格适配。
- 支持 AI 生成平台版本。
- 支持资产处理和图文卡片。
- 支持发布任务日志。
- 支持桌面端和插件化平台架构。

### 20.2 蚁小二等商业工具

特点：

- 多账号管理。
- 团队协作。
- 定时发布。
- 数据统计。
- 偏新媒体运营团队。

差异化方向：

- flash-promoter 初期聚焦个人创作者和小团队。
- 优先解决“内容适配质量”和“半自动发布”。
- 降低账号托管风险。
- 本地优先，增强隐私和可控性。

### 20.3 小红书发布插件类工具

特点：

- 常见形态为浏览器插件。
- 通过表格导入任务。
- 自动打开创作平台并填写内容。
- 对平台页面结构变化敏感。

差异化方向：

- flash-promoter 将辅助发布作为一种模式，而不是唯一能力。
- 不绑定单一平台。
- 支持统一内容模型和多平台插件扩展。

---

## 21. MVP 功能清单

### 21.1 P0 必须实现

| 模块 | 功能 | 说明 |
|---|---|---|
| 编辑器 | Markdown 输入 | 核心输入方式 |
| 编辑器 | 图片上传 | 本地资产管理 |
| 内容模型 | CanonicalPost | 平台无关内容结构 |
| AI 适配 | 生成四平台版本 | 公众号、知乎、B站、小红书 |
| 预览 | 平台预览 | 每个平台独立预览 |
| 校验 | 通用校验 | 标题、正文、图片、标签 |
| 发布 | 模拟发布 | 所有平台可模拟 |
| 日志 | 发布日志 | 记录每次操作 |
| 存储 | SQLite | 本地保存 |
| 插件 | Mock Adapter | 跑通完整流程 |

### 21.2 P1 推荐实现

| 模块 | 功能 | 说明 |
|---|---|---|
| 公众号 | 新建草稿 | 官方 API |
| B站 | 投稿参数生成 | 暂可模拟 |
| 小红书 | 图文卡片导出 | 生成卡片图片 |
| 知乎 | 复制 / 辅助发布 | 打开发布页并填充 |
| 浏览器辅助 | Playwright 基础能力 | 页面填充 |
| 凭证 | 本地加密存储 | 保存平台凭证 |

### 21.3 P2 后续实现

| 模块 | 功能 | 说明 |
|---|---|---|
| B站 | 视频分片上传 | 官方 API |
| B站 | 专栏文章提交 | 官方 API |
| 公众号 | 发布草稿 | 二次确认 |
| 小红书 | 分享开放平台 | 移动端唤起 |
| 团队 | 审核流 | 多人协作 |
| 数据 | 发布表现分析 | 阅读、点赞、收藏等 |
| 扩展 | 插件市场 | 更多平台 |

---

## 22. 验收标准

### 22.1 内容适配验收

输入一篇 1500 字原始文章，系统应在 60 秒内生成：

- 公众号长文版。
- 知乎逻辑版。
- B站标题、简介、标签、专栏版。
- 小红书短句笔记和卡片文案。

要求：

- 四个平台内容主旨一致。
- 不编造事实。
- 每个平台风格有明显差异。
- 用户可编辑所有生成内容。

### 22.2 模拟发布验收

用户选择四个平台模拟发布后：

- 每个平台生成一条 publish_job。
- 状态为 simulated。
- 日志中包含平台、时间、模式、结果。
- 不调用任何真实平台接口。

### 22.3 公众号草稿验收

用户配置公众号后：

- 可以获取 access_token。
- 可以上传封面。
- 可以创建草稿。
- 创建成功后记录 media_id。
- 创建失败时显示错误码和解释。
- 不默认调用正式发布接口。

### 22.4 浏览器辅助验收

用户点击知乎辅助发布后：

- 打开浏览器。
- 进入知乎发布页。
- 填充标题和正文。
- 用户可检查内容。
- 系统不自动绕过验证码。
- 系统不自动强制点击发布。

### 22.5 插件扩展验收

新增一个平台 adapter 后：

- 不修改 core 主流程。
- 可以注册到 adapterRegistry。
- 可以出现在平台选择列表。
- 可以执行 transform、validate、publish。
- 可以生成独立日志。

---

## 23. 风险清单

### 23.1 平台 API 风险

风险：

- 平台开放 API 权限变化。
- 普通创作者无法申请某些接口。
- 接口限流。
- 审核状态不可控。

应对：

- 默认模拟发布和草稿模式。
- 平台能力动态配置。
- 接口失败时降级为辅助发布。
- 清楚展示平台能力边界。

### 23.2 浏览器辅助发布风险

风险：

- 页面结构变化导致填充失败。
- 平台风控。
- 用户未登录。
- 图片上传失败。

应对：

- selector 配置化。
- 提供人工复制模式。
- 不承诺全自动。
- 保留错误截图和日志。
- 用户手动确认。

### 23.3 AI 内容风险

风险：

- AI 编造事实。
- AI 过度营销。
- AI 生成平台不友好的内容。
- AI 输出 JSON 不稳定。

应对：

- 使用 JSON Schema。
- 增加事实一致性检查。
- AI 内容标记为未确认。
- 用户确认后才能发布。
- 高风险内容警告。

### 23.4 账号安全风险

风险：

- AppSecret 泄露。
- token 泄露。
- cookie 泄露。
- 用户误发布。

应对：

- 本地加密存储。
- 日志脱敏。
- 二次确认。
- 默认草稿。
- 支持清除凭证。

---

## 24. 技术实现建议

### 24.1 前端

建议：

- React。
- TypeScript。
- Zustand / Jotai。
- Monaco Editor 或 Milkdown / TipTap。
- Tailwind CSS。
- shadcn/ui。

### 24.2 桌面端

建议：

- Tauri：更轻量，适合本地工具。
- Electron：生态成熟，Node 能力强。

如果需要大量 Playwright、Node 插件和本地自动化，Electron 实现会更顺手；如果追求体积和安全，Tauri 更适合。

### 24.3 后端 / 本地服务

建议：

- Node.js。
- Fastify。
- SQLite。
- Prisma / Drizzle。
- Zod 做 Schema 校验。
- BullMQ 或本地 Job Queue。

### 24.4 AI 层

建议：

- 独立 `ai-adapter` 包。
- 支持 OpenAI-compatible API。
- 支持本地模型配置。
- 所有输出经过 JSON Schema 校验。
- 不把平台凭证传给 AI。

### 24.5 浏览器辅助

建议：

- Playwright。
- 使用持久化浏览器上下文。
- selector 配置化。
- 操作前后截图。
- 不绕过验证码。
- 最终发布默认人工确认。

---

## 25. 推荐开发任务拆分

### 25.1 Task 1：项目初始化

- 初始化 monorepo。
- 配置 TypeScript。
- 配置桌面端。
- 配置 SQLite。
- 配置基础 UI。

### 25.2 Task 2：核心内容模型

- 实现 CanonicalPost。
- 实现 Markdown 解析。
- 实现 Block 模型。
- 实现本地保存。

### 25.3 Task 3：平台 Adapter 框架

- 实现 PlatformAdapter 接口。
- 实现 adapterRegistry。
- 实现 mockAdapter。
- 实现 publish job。

### 25.4 Task 4：AI 生成平台版本

- 实现 prompt。
- 实现 JSON Schema。
- 实现生成调用。
- 实现结果保存。
- 实现失败重试。

### 25.5 Task 5：平台预览

- 公众号预览组件。
- 知乎预览组件。
- B站预览组件。
- 小红书预览组件。

### 25.6 Task 6：发布前校验

- 通用校验。
- 公众号校验。
- B站校验。
- 知乎校验。
- 小红书校验。

### 25.7 Task 7：模拟发布

- 每个平台支持 simulate。
- 生成 publish_job。
- 生成 publish_logs。
- 显示发布报告。

### 25.8 Task 8：公众号草稿

- 账号配置。
- token 获取。
- 封面上传。
- 正文图片上传。
- 新建草稿。
- 错误码处理。

### 25.9 Task 9：浏览器辅助

- 打开平台发布页。
- 填充标题。
- 填充正文。
- 填充标签。
- 记录日志。
- 用户手动确认。

---

## 26. 参考资料

> 具体接口以平台官方最新文档为准。以下资料用于产品策略和技术边界判断。

1. B站开放平台 - 文件分片上传  
   https://open.bilibili.com/doc/4/733a520a-c50f-7bb4-17cb-35338ba20500

2. B站开放平台 - 文件分片合片  
   https://open.bilibili.com/doc/4/0828e499-38d8-9e58-2a70-a7eaebf9dd64

3. B站开放平台 - 视频稿件提交  
   https://open.bilibili.com/doc/4/f7fc57dd-55a1-5cb1-cba4-61fb2994bf0f

4. B站开放平台 - 文章提交  
   https://open.bilibili.com/doc/4/b14b77b6-8889-8c8b-2e83-17c5a4c550fb

5. 小红书分享开放平台  
   https://agora.xiaohongshu.com/

6. Wechatsync 开源项目  
   https://github.com/wechatsync/Wechatsync

7. 微信公众号 API 发布流程参考  
   https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html  
   https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html  
   https://developers.weixin.qq.com/doc/offiaccount/Publish/Publish.html

---

## 27. 最终判断

本项目的正确产品方向不是“强行实现所有平台全自动直发”，而是：

```text
统一内容输入
→ AI 多平台风格适配
→ 平台格式预览
→ 发布前校验
→ 根据平台能力选择官方 API / 浏览器辅助 / 模拟发布
→ 记录状态与日志
→ 插件化扩展更多平台
```

这样的设计更稳、更容易落地，也更适合后续发展为创作者工作台或企业新媒体运营工具。

MVP 最小闭环应定义为：

> 用户输入一篇内容，系统生成公众号、知乎、B站、小红书四个平台版本，并支持预览、校验、模拟发布；公众号可生成草稿；知乎和小红书走辅助发布；B站预留官方开放平台接入。

完成该闭环后，再逐步扩展真实发布、团队协作、内容日历、数据回收和多账号矩阵管理。
