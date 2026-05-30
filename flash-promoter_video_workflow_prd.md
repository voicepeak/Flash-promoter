# flash-promoter 视频内容工作流 PRD

> 文档类型：产品需求文档 / PRD  
> 项目名称：flash-promoter  
> 子项目：视频内容工作流 / Video Workflow  
> 优先级：先做  
> 版本：v1.0  
> 目标：在现有图文/推文流程基础上，将“视频”提升为一等内容类型，形成独立的视频发布材料生成、编辑确认、校验和模拟发布流程。  

---

## 1. 背景

当前 `flash-promoter` 已经具备图文/推文类内容的基础流程：

```text
输入内容
→ 选择平台
→ 生成平台版本
→ 编辑确认
→ 校验发布
→ 模拟发布
→ 发布日志
```

但当前实际产品形态仍偏向：

- 公众号图文
- 知乎文章 / 回答
- 小红书图文笔记
- B站专栏或视频文案

虽然底层模型中已经预留了 `contentType: "video"` 和视频类 `Asset`，B站适配器中也出现了标题、简介、分区、时间轴、置顶评论等字段，但用户主流程里还没有真正的视频发布工作流。

因此，下一阶段应先完成“视频内容工作流”，再在此基础上接入 LLM 远端生成能力。

---

## 2. 核心目标

本阶段目标不是做真实视频上传，也不是做视频剪辑，而是先让视频成为产品的一等内容类型。

目标流程：

```text
选择内容类型：视频
→ 选择 / 上传视频
→ 填写视频基础信息
→ 选择目标平台
→ 生成视频发布材料
→ 编辑确认
→ 校验
→ 模拟发布
→ 写入日志
```

---

## 3. 非目标

本阶段不做以下功能：

1. 不做真实平台视频发布。
2. 不做 B站真实上传、分片上传、合片、投稿提交。
3. 不做小红书、知乎、B站 App 自动发布。
4. 不做视频剪辑。
5. 不做视频转码。
6. 不做自动加字幕。
7. 不做视频内容识别。
8. 不接远端 LLM。
9. 不做语音转文字。
10. 不做多账号管理。
11. 不做云同步。
12. 不破坏现有图文/推文流程。

---

## 4. 产品原则

1. 视频和图文必须是两条清晰流程，不要混在同一页面。
2. 视频 MVP 只做“视频发布材料生成”，不做真实视频发布。
3. B站、小红书、知乎、公众号在视频场景下的输出字段不同，不能继续完全套用图文结构。
4. 视频内容应拥有独立的数据模型、独立页面和独立校验逻辑。
5. 现有 `PlatformAdapter` 可以复用，但需要扩展对 video 类型的支持。
6. 所有视频发布动作在本阶段都只能是模拟发布。
7. 用户必须能清楚看到：本阶段未调用真实平台接口。

---

## 5. 用户故事

### 5.1 B站视频创作者

作为 B站创作者，我希望上传或选择一个视频文件，填写视频主题和脚本，然后自动生成：

- 视频标题
- 视频简介
- 标签
- 分区建议
- 封面文案
- 置顶评论
- 时间轴

这样我可以减少视频投稿前的文案准备时间。

---

### 5.2 小红书视频创作者

作为小红书创作者，我希望系统根据视频主题生成：

- 小红书标题
- 视频短文案
- 话题标签
- 封面文案
- 首评建议

这样我可以更快准备小红书视频笔记。

---

### 5.3 多平台视频运营

作为内容运营，我希望同一个视频可以生成 B站、小红书、知乎、公众号四个平台的发布材料，并逐个平台检查确认。

---

## 6. 总体流程设计

### 6.1 新建发布第一步增加内容类型选择

现有“新建发布”流程需要前置一个内容类型选择页。

```text
新建发布
→ 选择内容类型
  → 图文 / 推文
  → 视频
```

### 6.2 图文 / 推文流程

保持现有流程：

```text
输入内容
→ 选择平台
→ 生成平台版本
→ 编辑确认
→ 校验发布
→ 模拟发布
→ 发布结果
```

### 6.3 视频流程

新增视频流程：

```text
选择 / 上传视频
→ 填写视频信息
→ 选择平台
→ 生成视频发布材料
→ 编辑确认
→ 校验
→ 模拟发布
→ 发布结果
```

---

## 7. 必要前端模块变化

本阶段一定涉及前端模块调整。要求如下。

---

### 7.1 新增内容类型选择页

新增页面或组件：

```text
ContentTypeStep
```

页面显示两个卡片：

```text
图文 / 推文
视频
```

#### 图文 / 推文卡片

说明文案：

```text
适合公众号文章、知乎回答、小红书图文笔记、B站专栏等内容。
```

进入现有图文流程。

#### 视频卡片

说明文案：

```text
适合 B站视频、小红书视频、知乎视频回答、公众号视频介绍等内容。
```

进入新增视频流程。

#### 交互要求

1. 默认不自动选择。
2. 用户必须选择一种内容类型。
3. 选择后进入对应向导。
4. 顶部步骤条应根据内容类型变化。

---

### 7.2 拆分现有 FlowWizard

当前如果只有一个统一 `FlowWizard`，需要拆分为：

```text
FlowWizard
├── ContentTypeStep
├── ArticleFlowWizard
└── VideoFlowWizard
```

其中：

- `ArticleFlowWizard` 承接当前图文流程。
- `VideoFlowWizard` 承接新增视频流程。
- `FlowWizard` 只负责选择内容类型和路由分发。

不要在一个大组件里用大量条件判断堆出两套流程。

---

### 7.3 视频流程步骤条

视频流程顶部 Stepper 应为：

```text
1 选择视频
2 填写信息
3 选择平台
4 生成材料
5 编辑确认
6 校验发布
7 发布结果
```

其中“选择视频”和“填写信息”不能合并得太混乱。

---

### 7.4 新增视频选择页

新增页面或组件：

```text
VideoSelectStep
```

字段：

- 视频文件选择
- 文件名展示
- 文件大小
- 文件格式
- 本地路径或 URI
- 可选封面图
- 手动填写视频时长，可选
- 手动填写分辨率，可选

#### 文件读取要求

MVP 阶段只要求：

- 能选择本地视频文件。
- 能记录文件名。
- 能记录文件大小。
- 能记录 MIME 类型或后缀。
- 能记录本地路径或文件引用。
- 如果能安全读取时长和分辨率，则读取。
- 如果无法读取，则允许用户手动填写。

不要求：

- 转码。
- 压缩。
- 上传。
- 自动截图。
- 自动识别内容。

---

### 7.5 新增视频信息页

新增页面或组件：

```text
VideoInfoStep
```

字段：

- 视频标题 / 工作标题
- 视频主题
- 视频简介
- 目标观众
- 视频脚本，可选
- 字幕文本，可选
- 主要看点
- 风格选择
- 标签

#### 风格选项

建议：

```text
知识科普
产品介绍
测评
活动记录
口播
Vlog
教程
项目展示
```

#### 交互要求

1. 视频标题不能为空。
2. 视频主题不能为空。
3. 脚本和字幕可选。
4. 用户可以保存草稿。

---

### 7.6 视频平台选择页

新增或复用平台选择组件，但要改文案。

视频模式下平台卡片为：

| 平台 | 用户文案 | 内部模式 |
|---|---|---|
| B站 | 生成视频投稿材料 | simulate |
| 小红书 | 生成短视频笔记文案 | assist |
| 知乎 | 生成视频回答 / 说明文案 | assist |
| 公众号 | 生成视频介绍图文 | draft |

#### 交互要求

1. 默认选中 B站和小红书。
2. 公众号和知乎可选。
3. 至少选择一个平台。
4. 不展示 `simulate`、`assist`、`draft` 等技术词。
5. 所有平台在本阶段均不真实发布。

---

### 7.7 视频材料生成页

新增页面或组件：

```text
VideoGenerateStep
```

生成内容不是图文版本，而是“视频发布材料”。

生成完成后，每个平台一张卡片：

- 平台名称
- 标题预览
- 简介 / 文案预览
- 标签数量
- 是否有封面文案
- 是否有警告
- 编辑按钮

---

### 7.8 视频编辑确认页

新增页面或组件：

```text
VideoReviewStep
```

采用平台 Tab，不使用图文流程的字段。

#### B站 Tab

字段：

- 视频标题
- 视频简介
- 标签
- 分区建议
- 封面文案
- 置顶评论
- 时间轴

#### 小红书 Tab

字段：

- 标题
- 视频文案
- 话题标签
- 封面文案
- 首评建议

#### 知乎 Tab

字段：

- 视频回答标题
- 回答导语
- 视频说明
- 话题

#### 公众号 Tab

字段：

- 视频介绍图文标题
- 摘要
- 正文
- 封面文案

#### 确认机制

每个平台必须有：

```text
保存当前版本
确认当前平台
```

所有已选平台确认后，才能进入校验发布。

---

### 7.9 视频校验发布页

新增页面或组件：

```text
VideoValidateStep
```

校验卡片字段：

- 平台名称
- 发布材料类型
- 校验状态
- 错误
- 警告
- 是否可模拟发布

#### 通用视频校验

- 是否已选择视频文件。
- 是否有视频标题。
- 是否有视频主题。
- 所选平台是否已生成材料。
- 所选平台是否已确认。
- 是否存在空标题。
- 是否存在空正文 / 空简介。
- 是否存在异常标签。

#### B站校验

- 标题不能为空。
- 简介不能为空。
- 标签建议不少于 2 个。
- 分区建议不能为空。
- 视频文件存在。
- 明确提示：本阶段不真实上传 B站。

#### 小红书校验

- 标题不能为空。
- 视频文案不能为空。
- 话题建议不少于 2 个。
- 封面文案建议存在。
- 明确提示：仅辅助发布，不自动发布。

#### 知乎校验

- 标题不能为空。
- 视频说明不能为空。
- 话题建议存在。

#### 公众号校验

- 图文标题不能为空。
- 摘要建议存在。
- 正文不能为空。

---

### 7.10 视频发布结果页

新增页面或组件：

```text
VideoResultStep
```

结果卡片字段：

- 平台名称
- 操作类型
- 状态
- 时间
- 返回信息
- 查看日志

必须显示：

```text
本次为视频模拟发布，未调用真实平台接口。
```

---

### 7.11 发布记录页调整

发布记录页需要增加内容类型筛选：

```text
全部
图文 / 推文
视频
```

列表中需要展示：

- 内容类型
- 平台
- 操作类型
- 状态
- 创建时间
- 最近更新时间

视频记录详情中展示：

- 视频文件名
- 视频大小
- 视频时长，如有
- 视频分辨率，如有
- 平台生成材料
- 发布日志

---

### 7.12 设置页调整

设置页新增视频相关设置：

- 默认视频平台选择
- 默认视频风格
- 是否允许手动填写视频元数据
- 是否显示视频调试信息
- B站真实上传开关，默认关闭，仅预留
- 视频文件读取策略说明

---

## 8. 数据模型需求

### 8.1 CanonicalContent

建议从单一 `CanonicalPost` 逐步演进为：

```ts
export type CanonicalContent =
  | CanonicalArticle
  | CanonicalVideo
  | CanonicalImageNote
  | CanonicalQaAnswer;
```

如果短期不想大改，也可以在现有 `CanonicalPost` 上增加 `videoMeta`，但推荐新增 `CanonicalVideo`，避免模型越来越臃肿。

---

### 8.2 CanonicalVideo

```ts
export type CanonicalVideo = {
  id: string;
  contentType: "video";
  title: string;
  summary?: string;
  topic: string;
  audience?: string;
  style?: VideoStyle;
  script?: string;
  transcript?: string;
  highlights?: string[];
  tags: string[];
  videoAsset: VideoAsset;
  coverAsset?: Asset;
  createdAt: number;
  updatedAt: number;
};
```

---

### 8.3 VideoStyle

```ts
export type VideoStyle =
  | "knowledge"
  | "product"
  | "review"
  | "event"
  | "talking-head"
  | "vlog"
  | "tutorial"
  | "project-demo";
```

---

### 8.4 VideoAsset

```ts
export type VideoAsset = {
  id: string;
  type: "video";
  localPath: string;
  filename: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  codec?: string;
  createdAt: number;
  updatedAt: number;
};
```

---

### 8.5 VideoPlatformDraft

```ts
export type VideoPlatformDraft = {
  id: string;
  contentId: string;
  contentType: "video";
  platform: "bilibili" | "xiaohongshu" | "zhihu" | "wechat";
  title: string;
  description?: string;
  body?: string;
  tags?: string[];
  topics?: string[];
  coverText?: string;
  platformMeta: VideoPlatformMeta;
  aiGenerated: boolean;
  userConfirmed: boolean;
  createdAt: number;
  updatedAt: number;
};
```

---

### 8.6 VideoPlatformMeta

```ts
export type VideoPlatformMeta =
  | {
      platform: "bilibili";
      partitionSuggestion?: string;
      timeline?: string[];
      pinnedComment?: string;
    }
  | {
      platform: "xiaohongshu";
      hashtags?: string[];
      firstComment?: string;
    }
  | {
      platform: "zhihu";
      answerIntro?: string;
      topics?: string[];
    }
  | {
      platform: "wechat";
      summary?: string;
      articleBodyMarkdown?: string;
    };
```

---

## 9. 本地规则生成要求

本阶段暂不接 LLM，但要实现本地规则生成。

新增：

```text
generateVideoPlatformAdaptation()
```

输入：

```ts
CanonicalVideo
```

输出：

```ts
VideoPlatformDraft[]
```

生成规则可以简单，但必须结构完整。

### 9.1 B站规则生成

生成：

- 标题：基于视频标题和主题
- 简介：基于 summary / script / highlights
- 标签：基于 tags 和 style
- 分区建议：基于 style
- 封面文案：提炼 1 句
- 置顶评论：引导讨论
- 时间轴：如果 highlights 存在则生成占位

---

### 9.2 小红书规则生成

生成：

- 标题：短标题
- 文案：短句化
- 话题标签：基于 tags
- 封面文案
- 首评建议

---

### 9.3 知乎规则生成

生成：

- 视频回答标题
- 回答导语
- 视频说明
- 话题

---

### 9.4 公众号规则生成

生成：

- 视频介绍图文标题
- 摘要
- 正文 Markdown
- 封面文案

---

## 10. 后端 / API 需求

如果当前已有 local-api，需要新增或扩展以下接口。

### 10.1 创建视频内容

```http
POST /contents/video
```

或沿用：

```http
POST /posts
```

但必须支持 `contentType: "video"`。

请求字段：

```json
{
  "contentType": "video",
  "title": "视频标题",
  "topic": "视频主题",
  "summary": "视频简介",
  "script": "视频脚本",
  "transcript": "字幕文本",
  "tags": ["B站", "教程"],
  "videoAssetId": "asset_xxx",
  "coverAssetId": "asset_xxx"
}
```

---

### 10.2 上传 / 登记视频资产

```http
POST /assets/video
```

MVP 可以先做本地文件登记，不做远端上传。

返回：

```json
{
  "assetId": "video_xxx",
  "filename": "demo.mp4",
  "size": 12345678,
  "mimeType": "video/mp4"
}
```

---

### 10.3 生成视频平台材料

```http
POST /contents/{contentId}/video-adaptations
```

请求：

```json
{
  "platforms": ["bilibili", "xiaohongshu", "zhihu", "wechat"]
}
```

返回：

```json
{
  "drafts": []
}
```

---

### 10.4 视频模拟发布

沿用现有 publish job，但需要记录 `contentType: "video"`。

```http
POST /drafts/{draftId}/publish
```

请求：

```json
{
  "mode": "simulate"
}
```

---

## 11. 数据库存储需求

如果现有表能承载 JSON，可以先不新增大量表，但需要确保能保存视频字段。

推荐新增或扩展：

### 11.1 contents / posts

增加：

```text
content_type
```

或在 `canonical_json` 中保存 `contentType: "video"`。

---

### 11.2 assets

确保支持：

```text
type = video
```

并可保存：

- filename
- local_path
- mime_type
- size
- duration
- width
- height
- fps
- codec

---

### 11.3 platform_drafts

需要支持：

```text
content_type = video
```

或在 `draft_json` 中保存。

---

### 11.4 publish_jobs

需要支持记录：

```text
content_type = video
```

如果不改表结构，也必须写入 `result_json` 或 `raw_json`。

---

## 12. 发布模式

视频阶段只允许：

```text
simulate
```

辅助类平台可以在 UI 上显示：

```text
辅助发布材料
```

但内部仍然不调用真实平台。

### 禁止出现的按钮

- 真实上传 B站
- 发布到小红书
- 发布到知乎
- 发布到公众号
- 一键全平台发布

### 允许出现的按钮

- 生成视频发布材料
- 保存当前平台版本
- 确认当前平台
- 模拟发布
- 查看日志

---

## 13. 验收标准

### 13.1 流程验收

1. 用户新建发布时可以选择“视频”。
2. 选择视频后进入视频专属流程。
3. 用户可以选择本地视频文件。
4. 用户可以填写视频标题、主题、简介、脚本、标签。
5. 用户可以选择 B站、小红书、知乎、公众号作为目标平台。
6. 系统可以生成各平台视频发布材料。
7. 用户可以逐个平台编辑并确认。
8. 系统可以进行视频发布前校验。
9. 用户可以执行视频模拟发布。
10. 系统可以写入视频发布日志。
11. 发布记录中可以区分图文内容和视频内容。

---

### 13.2 UI 验收

1. 图文流程和视频流程不混在一个页面里。
2. 视频流程有独立 Stepper。
3. 视频平台详情页显示视频专属字段。
4. 不暴露 `adapter`、`simulate`、`publish job` 等开发词。
5. 不出现真实发布按钮。
6. 用户能明确知道：当前是模拟发布。

---

### 13.3 数据验收

1. 视频内容能持久化。
2. 视频资产能持久化。
3. 视频平台草稿能持久化。
4. 视频发布任务能持久化。
5. 视频发布日志能持久化。
6. 现有图文数据不受影响。

---

### 13.4 回归验收

1. 现有图文 / 推文流程仍可使用。
2. 现有 mock 发布仍可使用。
3. 现有发布记录仍可查看。
4. 现有设置页不报错。
5. typecheck 通过。
6. acceptance 测试通过。

---

## 14. 给开发实现的简短提示词

```text
请基于 flash-promoter 当前项目新增视频内容工作流。

重点：
1. 先做视频，不接 LLM，不做真实发布。
2. 在新建发布第一步增加内容类型选择：图文 / 推文、视频。
3. 图文 / 推文继续走现有流程。
4. 视频走独立流程：选择视频 → 填写信息 → 选择平台 → 生成视频发布材料 → 编辑确认 → 校验 → 模拟发布。
5. 新增视频模型：CanonicalVideo、VideoAsset、VideoPlatformDraft。
6. 新增视频平台材料生成函数 generateVideoPlatformAdaptation。
7. B站、小红书、知乎、公众号输出字段必须区分，不能直接套用文章结构。
8. 前端必须新增或拆分 ContentTypeStep、ArticleFlowWizard、VideoFlowWizard、VideoSelectStep、VideoInfoStep、VideoGenerateStep、VideoReviewStep、VideoValidateStep、VideoResultStep。
9. 发布记录页增加内容类型筛选。
10. 设置页增加视频默认配置。
11. 只做模拟发布，不出现真实发布按钮。
12. 保证现有图文流程不受影响。
```

---

## 15. 总结

本 PRD 的核心是：

```text
先让视频成为一等内容类型
再谈 LLM 远端生成
最后才谈真实视频发布
```

完成本阶段后，`flash-promoter` 将从“图文/推文适配工具”升级为“图文 + 视频双内容类型的多平台发布材料生成工具”。
