# flash-promoter AI 辅助填写与多模态内容编排 PRD

> 项目名称：flash-promoter  
> 模块名称：AI 辅助填写与多模态内容编排  
> 文档类型：产品需求文档 / PRD  
> 版本：v1.0  
> 核心定位：AI 不作为独立“分析模块”存在，而是嵌入到每一个内容填写、编辑、排布、优化动作中。用户在任意基础字段旁都可以手动触发 AI 帮助，AI 根据原始正文、图片、视频、脚本、字幕等素材，辅助生成各平台需要的标题、摘要、正文结构、标签、简介、封面文案、时间轴、置顶评论等内容组件。  

---

## 1. 设计结论

`flash-promoter` 的 AI 能力不应该设计成一个独立的“AI 分析页”或“AI 分析模块”。

正确设计是：

> AI 是贯穿整个内容生产流程的辅助填写与内容编排能力。  
> 用户在每一个字段、每一个平台内容包、每一个编辑环节，都可以通过手动按钮触发 AI 帮助。

也就是说，用户不需要先进入一个“AI 分析模块”，再返回填写表单。  
而是在当前正在填写的地方直接看到：

```text
AI 生成
AI 优化
AI 改写
AI 提取
AI 补全
AI 生成更多
AI 根据素材生成
AI 根据视频生成
```

AI 的位置应该是：

```text
字段旁边
内容块旁边
平台内容包内部
视频素材旁边
图片素材旁边
发布前检查处
```

而不是单独的一个大页面。

---

## 2. 核心目标

### 2.1 产品目标

让用户只需要提供低完成度素材，例如：

- 一篇原始正文
- 一段粗糙草稿
- 几张图片
- 一个视频文件
- 视频脚本
- 字幕文本
- 简短说明

系统即可通过 AI 辅助用户完成各平台发布所需内容的填写和排布。

### 2.2 用户体验目标

用户不需要一次性写完整内容，也不需要理解平台发布结构。

用户可以：

1. 先输入最少信息。
2. 在需要的字段旁点击 AI 按钮。
3. 让 AI 补全标题、摘要、正文、标签、话题、封面文案、视频简介等内容。
4. 对 AI 结果继续手动修改。
5. 再次触发 AI 优化局部字段。
6. 最终确认平台内容包。
7. 进入模拟发布或后续真实发布流程。

---

## 3. 设计原则

### 3.1 AI 是辅助填写，不是全自动接管

AI 的所有动作必须由用户手动触发。

推荐形式：

```text
字段右侧按钮：AI 生成
字段右侧按钮：AI 优化
内容块右上角：AI 改写
平台包顶部：AI 补全缺失项
```

不推荐：

```text
系统自动分析全部内容
系统自动覆盖用户输入
系统自动进入发布
系统自动替用户确认
```

---

### 3.2 AI 嵌入流程，不独立成模块

不设计单独的“AI 分析中心”。

AI 应分布在以下位置：

- 原始内容输入页
- 图文平台内容包页
- 视频基础信息页
- 视频平台内容包页
- 图片 / 封面素材页
- 发布前检查页
- 平台编辑确认页

---

### 3.3 用户始终拥有编辑权和确认权

AI 生成结果不能直接覆盖用户已有内容。

所有 AI 操作应遵守：

1. 生成结果先预览。
2. 用户点击“应用”后才写入字段。
3. 如果字段已有内容，默认提供“替换 / 追加 / 生成新版本”选择。
4. AI 生成内容标记为 `aiGenerated=true`。
5. 用户确认后标记为 `userConfirmed=true`。

---

### 3.4 多模态 LLM 是推荐能力

由于产品同时处理图文、图片和视频，LLM 配置不应只支持纯文本模型。

设置中应建议用户配置支持多模态能力的模型。

推荐能力包括：

- 文本理解
- 图片理解
- 视频关键帧理解
- 长上下文
- 结构化输出
- 中文内容编辑
- 平台风格改写

视频分析可分阶段实现：

```text
MVP：视频元数据 + 用户脚本 / 字幕 / 简介
增强：抽取关键帧 + 多模态模型理解
后续：音频转文字 + 视频语义分析
```

---

## 4. 非目标

本阶段不做：

1. 不做 AI 自动发布。
2. 不做 AI 自动点击平台按钮。
3. 不做 AI 绕过登录、验证码或风控。
4. 不做无用户触发的自动改写。
5. 不做未确认直接覆盖字段。
6. 不做真实平台发布接口调用。
7. 不做复杂视频剪辑。
8. 不做自动生成视频成片。
9. 不把 AI 做成独立“分析模块”页面。
10. 不把 Provider 配置暴露为普通用户主流程。

---

## 5. 总体流程

### 5.1 图文 / 推文流程

```text
新建发布
→ 选择内容类型：图文 / 推文
→ 输入原始正文
→ AI 辅助生成标题 / 摘要 / 标签
→ 选择平台
→ 生成平台内容包
→ 在各平台字段中继续 AI 辅助填写
→ 用户确认
→ 发布前检查
→ 模拟发布 / 草稿 / 辅助发布
```

### 5.2 视频流程

```text
新建发布
→ 选择内容类型：视频
→ 选择视频文件
→ 填写视频主题 / 简介 / 脚本 / 字幕
→ AI 辅助提取视频信息
→ 选择平台
→ 生成视频平台内容包
→ AI 辅助生成标题 / 简介 / 标签 / 时间轴 / 封面文案
→ 用户确认
→ 发布前检查
→ 模拟发布 / 辅助发布
```

---

## 6. 设置页：LLM 配置要求

### 6.1 设置入口

设置页增加：

```text
AI / LLM 配置
```

该配置属于基础设置，不作为主流程的一步。

---

### 6.2 LLM 配置字段

需要支持：

- 是否启用 AI 辅助
- Provider 类型
- Base URL
- API Key
- Model
- Temperature
- Timeout
- Max Tokens
- 是否启用多模态能力
- 是否允许发送图片
- 是否允许发送视频关键帧
- 是否允许发送字幕 / 脚本
- 测试连接按钮
- 保存配置按钮
- 清除配置按钮

---

### 6.3 Provider 类型

MVP 阶段建议支持：

```text
OpenAI Compatible
```

这样可以兼容：

- OpenAI
- DeepSeek
- Qwen
- Moonshot
- OpenRouter
- 本地 OpenAI-compatible 服务
- 其他兼容接口

---

### 6.4 模型能力声明

配置模型时，应允许用户标记或自动检测模型能力：

```ts
type LlmModelCapabilities = {
  text: boolean;
  image: boolean;
  videoFrame: boolean;
  audioTranscription?: boolean;
  structuredOutput: boolean;
  longContext: boolean;
};
```

如果用户选择了不支持图片或视频的模型，则：

- 图文文字生成仍可用。
- 图片分析按钮置灰。
- 视频关键帧分析按钮置灰。
- 视频仍可基于标题、简介、脚本、字幕生成发布材料。

---

### 6.5 多模态模型推荐提示

设置页应提示：

```text
建议配置支持多模态能力的 LLM，以便进行图片封面分析、视频关键帧分析和图文素材理解。
如果当前模型只支持文本，系统仍可基于正文、脚本、字幕和手动填写信息生成平台内容包。
```

---

### 6.6 API Key 安全

要求：

1. API Key 加密保存。
2. API Key 不出现在前端日志。
3. API Key 不出现在发布日志。
4. API Key 保存后脱敏显示。
5. 清除 API Key 需要二次确认。
6. 不把平台账号凭证发送给 LLM。

---

## 7. AI 辅助填写交互设计

### 7.1 字段级 AI 按钮

所有基础填写字段旁边都可以有 AI 按钮。

例如：

```text
标题 [AI 生成]
摘要 [AI 生成]
标签 [AI 提取]
正文 [AI 优化]
封面文案 [AI 生成]
B站简介 [AI 生成]
小红书话题 [AI 生成]
时间轴 [AI 生成]
```

---

### 7.2 AI 操作菜单

点击字段旁的 AI 按钮后，不直接生成单一结果，而是弹出操作菜单。

常见操作：

- 生成
- 优化
- 改短
- 扩写
- 改口吻
- 提取
- 生成多个候选
- 根据当前素材生成
- 根据当前平台生成
- 根据视频 / 图片生成

---

### 7.3 AI 结果应用方式

AI 返回结果后，必须显示预览。

用户可以选择：

```text
应用
追加
替换
生成新版本
重新生成
取消
```

如果字段已有内容，默认不直接覆盖。

---

### 7.4 AI 生成状态

每个由 AI 生成或修改的字段应记录：

- 生成时间
- 使用的模型
- 来源素材
- 是否被用户修改
- 是否被用户确认

字段级状态示例：

```ts
type AiFieldState = {
  fieldKey: string;
  aiGenerated: boolean;
  userEdited: boolean;
  userConfirmed: boolean;
  model?: string;
  generatedAt?: number;
};
```

---

## 8. 图文场景：字段级 AI 辅助设计

### 8.1 原始正文页

用户可以只输入正文。

字段：

- 标题，可空
- 正文，必填
- 摘要，可空
- 标签，可空
- 图片，可选

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 标题 | 根据正文生成标题、生成多个标题、降低标题党 |
| 摘要 | 根据正文生成摘要、压缩摘要 |
| 标签 | 从正文提取标签 |
| 正文 | 优化结构、增加小标题、改成更正式、改成更口语 |
| 图片 | 分析图片内容、生成图片说明、生成封面文案 |

---

### 8.2 公众号内容包

字段：

- 标题
- 备选标题
- 摘要
- 导语
- 正文
- 小标题
- 重点句
- 封面文案
- 分享摘要
- 标签

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 标题 | 生成更多标题、降低营销感、增强点击欲 |
| 摘要 | 生成摘要、压缩到指定长度 |
| 导语 | 重新写导语、增强故事感、增强专业感 |
| 正文 | 重新排布、增加小标题、优化段落 |
| 小标题 | 重新生成小标题、统一风格 |
| 重点句 | 提取金句、提取关键观点 |
| 封面文案 | 生成封面短句 |
| 分享摘要 | 生成分享卡片摘要 |

---

### 8.3 知乎内容包

字段：

- 标题
- 问题角度
- 核心观点
- 正文
- 论点
- 案例
- 局限性说明
- 话题

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 标题 | 改成知乎风格、降低营销感 |
| 问题角度 | 提炼问题意识 |
| 核心观点 | 提炼论点 |
| 正文 | 增强论证、改成回答体、减少宣传口吻 |
| 案例 | 从正文中提取案例 |
| 局限性说明 | 补充谨慎表达 |
| 话题 | 生成知乎话题 |

---

### 8.4 小红书图文内容包

字段：

- 标题
- 备选标题
- 正文
- 话题标签
- 封面文案
- 图文卡片
- 首评建议

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 标题 | 生成短标题、生成多个标题 |
| 正文 | 短句化、生活化、降低营销感 |
| 话题标签 | 生成话题、筛选话题 |
| 封面文案 | 生成封面标题 |
| 图文卡片 | 拆成卡片、重排卡片 |
| 首评建议 | 生成互动式首评 |

---

### 8.5 B站专栏 / 文案内容包

字段：

- 专栏标题
- 正文
- 简介
- 标签
- 分区建议
- 封面文案
- 置顶评论

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 标题 | 生成 B站标题、降低标题党 |
| 简介 | 生成简介、压缩简介 |
| 标签 | 生成标签 |
| 分区建议 | 推荐分区 |
| 置顶评论 | 生成互动评论 |
| 封面文案 | 生成封面文字 |

---

## 9. 视频场景：多模态 AI 辅助设计

### 9.1 视频基础信息页

字段：

- 视频文件
- 视频主题
- 视频标题
- 视频简介
- 视频脚本
- 字幕文本
- 封面图
- 标签
- 主要看点
- 目标观众

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 视频主题 | 根据文件名、简介、脚本生成主题 |
| 视频标题 | 根据脚本 / 字幕 / 视频说明生成标题 |
| 视频简介 | 根据脚本 / 字幕生成简介 |
| 标签 | 根据脚本 / 字幕 / 视频信息提取标签 |
| 主要看点 | 从脚本 / 字幕中提取看点 |
| 封面图 | 多模态分析图片，生成封面文案 |
| 字幕文本 | 后续可接 ASR 自动生成 |
| 视频文件 | 读取元数据、抽关键帧、后续多模态分析 |

---

### 9.2 视频分析分层

#### Level 0：基础元数据

不依赖 LLM，系统读取：

- 文件名
- 大小
- 格式
- 时长
- 分辨率
- 帧率

#### Level 1：文本分析

依赖文本 LLM，输入：

- 视频标题
- 视频简介
- 视频脚本
- 字幕文本
- 用户填写的主要看点

输出：

- 视频主题
- 摘要
- 标签
- 看点
- 平台推荐

#### Level 2：图片 / 封面分析

依赖多模态 LLM，输入：

- 封面图
- 视频截图
- 用户选择的图片

输出：

- 图片内容描述
- 封面文案建议
- 适合小红书 / B站的封面方向
- 图片说明

#### Level 3：视频关键帧分析

依赖多模态 LLM 或关键帧抽取，输入：

- 视频抽帧图
- 视频元数据
- 脚本 / 字幕

输出：

- 视频场景判断
- 封面截图建议
- 画面亮点
- 小红书截图建议
- B站封面建议

MVP 可先实现 Level 0 + Level 1，预留 Level 2 / Level 3。

---

### 9.3 B站视频内容包

字段：

- 视频标题
- 备选标题
- 简介
- 标签
- 分区建议
- 封面文案
- 时间轴
- 置顶评论

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 视频标题 | 生成 5 个标题、降低标题党、增强点击欲 |
| 简介 | 根据脚本 / 字幕生成简介 |
| 标签 | 生成标签、补充标签 |
| 分区建议 | 推荐分区 |
| 封面文案 | 根据主题 / 封面图生成 |
| 时间轴 | 根据脚本 / 字幕生成时间轴 |
| 置顶评论 | 生成互动评论 |

---

### 9.4 小红书视频内容包

字段：

- 标题
- 视频文案
- 话题标签
- 封面文案
- 首评建议
- 截图建议

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 标题 | 生成短标题 |
| 视频文案 | 改成短句、生活化 |
| 话题标签 | 生成话题 |
| 封面文案 | 根据视频 / 图片生成 |
| 首评建议 | 生成互动首评 |
| 截图建议 | 根据关键帧或封面图生成 |

---

### 9.5 知乎视频内容包

字段：

- 视频回答标题
- 回答导语
- 视频说明
- 话题
- 理性解释角度

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 标题 | 改成知乎风格 |
| 回答导语 | 生成导语 |
| 视频说明 | 生成说明 |
| 话题 | 生成话题 |
| 理性解释角度 | 提炼问题意识 |

---

### 9.6 公众号视频介绍内容包

字段：

- 图文标题
- 摘要
- 导语
- 正文
- 封面文案
- 视频看点
- 重点句

AI 按钮：

| 字段 | AI 能力 |
|---|---|
| 图文标题 | 生成公众号标题 |
| 摘要 | 生成摘要 |
| 导语 | 生成导语 |
| 正文 | 生成视频介绍推文 |
| 封面文案 | 生成封面文字 |
| 视频看点 | 提取看点 |
| 重点句 | 提取重点句 |

---

## 10. 平台内容包设计

### 10.1 内容包定义

平台内容包不是一段正文，而是一组平台发布所需组件。

```ts
type PlatformContentPackage = {
  id: string;
  contentId: string;
  contentType: "article" | "video";
  platform: PlatformId;
  packageType: string;
  slots: Record<string, ContentSlot>;
  aiGenerated: boolean;
  userConfirmed: boolean;
  createdAt: number;
  updatedAt: number;
};
```

### 10.2 ContentSlot

```ts
type ContentSlot = {
  key: string;
  label: string;
  value: string | string[] | Record<string, unknown>;
  required: boolean;
  aiAssistEnabled: boolean;
  aiGenerated: boolean;
  userEdited: boolean;
  userConfirmed: boolean;
};
```

### 10.3 Slot 示例

B站视频内容包：

```ts
slots = {
  title: { label: "视频标题", required: true },
  description: { label: "视频简介", required: true },
  tags: { label: "标签", required: true },
  partitionSuggestion: { label: "分区建议", required: true },
  coverText: { label: "封面文案", required: false },
  timeline: { label: "时间轴", required: false },
  pinnedComment: { label: "置顶评论", required: false }
}
```

小红书图文内容包：

```ts
slots = {
  title: { label: "标题", required: true },
  caption: { label: "正文", required: true },
  hashtags: { label: "话题标签", required: true },
  coverText: { label: "封面文案", required: false },
  cardTexts: { label: "图文卡片", required: false },
  firstComment: { label: "首评建议", required: false }
}
```

---

## 11. 平台配方设计

### 11.1 PlatformRecipe

系统需要通过平台配方定义每个平台每种内容类型需要哪些字段。

```ts
type PlatformRecipe = {
  platform: PlatformId;
  contentType: "article" | "video";
  packageType: string;
  requiredSlots: SlotDefinition[];
  optionalSlots: SlotDefinition[];
  styleRules: string[];
  validationRules: string[];
};
```

### 11.2 SlotDefinition

```ts
type SlotDefinition = {
  key: string;
  label: string;
  type: "text" | "textarea" | "tags" | "list" | "cards" | "timeline";
  required: boolean;
  aiActions: AiActionType[];
};
```

### 11.3 AiActionType

```ts
type AiActionType =
  | "generate"
  | "optimize"
  | "rewrite"
  | "shorten"
  | "expand"
  | "extract"
  | "generateAlternatives"
  | "generateFromText"
  | "generateFromImage"
  | "generateFromVideo"
  | "riskCheck";
```

平台配方决定前端自动渲染哪些字段，以及每个字段旁出现哪些 AI 按钮。

---

## 12. 前端页面设计

### 12.1 新建内容入口

第一步：

```text
选择内容类型
```

卡片：

- 图文 / 推文
- 视频

### 12.2 图文流程

```text
1 输入原稿
2 选择平台
3 生成内容包
4 编辑排布
5 发布前检查
6 发布结果
```

说明：

不单独设计“AI 分析页”。  
如果需要内容理解，应在当前页中以“AI 帮我补全 / AI 生成平台内容包”的方式触发。

### 12.3 视频流程

```text
1 选择视频
2 填写基础信息
3 选择平台
4 生成内容包
5 编辑排布
6 发布前检查
7 发布结果
```

说明：

视频分析能力通过字段按钮触发：

- 视频文件旁：读取信息 / 抽关键帧
- 主题旁：AI 生成
- 简介旁：AI 生成
- 标签旁：AI 提取
- 封面旁：AI 生成文案

### 12.4 平台编辑排布页

每个平台内容包进入单独编辑页。

页面结构：

```text
平台名称
内容包完成度
字段组件列表
AI 快捷操作区
版本历史
确认按钮
```

字段组件：

```text
字段标题
字段内容
AI 操作按钮
字段状态
```

示例：

```text
视频标题
[当前标题内容]
[AI 生成更多] [AI 优化] [AI 降低标题党]
```

---

## 13. AI 快捷操作区

### 13.1 全局快捷操作

位于平台编辑页顶部。

可选：

- 补全缺失项
- 统一风格
- 降低营销感
- 生成更多标题
- 重新生成全部
- 检查发布风险

### 13.2 字段快捷操作

位于每个字段旁边。

例如：

标题字段：

- AI 生成
- AI 生成更多
- AI 优化
- AI 降低标题党

标签字段：

- AI 提取
- AI 补充
- AI 精简

正文 / 简介字段：

- AI 改写
- AI 缩短
- AI 扩写
- AI 改风格

---

## 14. AI 结果确认与版本管理

### 14.1 AI 结果预览

AI 结果不直接覆盖字段。

流程：

```text
点击 AI 按钮
→ 生成结果
→ 弹出预览
→ 用户选择应用 / 追加 / 替换 / 新版本 / 取消
```

### 14.2 版本记录

每次 AI 应用应生成版本记录。

```ts
type DraftVersion = {
  id: string;
  packageId: string;
  slotKey?: string;
  versionNumber: number;
  source: "manual" | "ai";
  action: AiActionType;
  before: unknown;
  after: unknown;
  createdAt: number;
};
```

### 14.3 回退能力

用户可以：

- 查看历史版本
- 回退单个字段
- 回退整个平台内容包
- 对比 AI 修改前后差异

---

## 15. 发布前检查

发布前检查应基于平台内容包的 slots。

### 15.1 检查内容

- 必填字段是否为空。
- AI 生成字段是否已确认。
- 用户是否确认整个平台内容包。
- 是否存在低置信度视频理解。
- 是否存在过度营销表达。
- 是否存在平台风险提示。
- 是否存在未处理素材。

### 15.2 检查结果

状态：

```text
通过
有警告
有错误
```

错误阻止继续，警告允许继续但需要提示。

---

## 16. 后端 / 核心模块设计

### 16.1 LLM Provider

负责：

- 配置模型
- 调用模型
- 支持文本、多模态输入
- 处理重试
- 处理超时
- 处理结构化输出
- 脱敏日志

### 16.2 AI Action Service

新增服务：

```text
ai-action-service
```

职责：

- 根据字段和动作调用 LLM。
- 根据上下文构造请求。
- 返回候选结果。
- 不直接写入字段。
- 不直接发布。

### 16.3 Platform Recipe Service

职责：

- 定义平台内容包字段。
- 定义每个字段可用 AI 操作。
- 定义平台校验规则。

### 16.4 Content Package Service

职责：

- 创建内容包。
- 更新字段。
- 应用 AI 结果。
- 管理字段状态。
- 管理版本历史。

### 16.5 Asset Intelligence Service

职责：

- 读取视频元数据。
- 读取图片信息。
- 抽取关键帧，后续。
- 调用多模态模型分析图片 / 关键帧，后续。
- 将分析结果提供给 AI Action Service。

---

## 17. 数据模型

### 17.1 LlmConfig

```ts
type LlmConfig = {
  enabled: boolean;
  provider: "openai-compatible";
  baseUrl: string;
  apiKeyEncrypted: string;
  model: string;
  temperature: number;
  timeoutMs: number;
  maxTokens?: number;
  capabilities: LlmModelCapabilities;
  createdAt: number;
  updatedAt: number;
};
```

### 17.2 LlmModelCapabilities

```ts
type LlmModelCapabilities = {
  text: boolean;
  image: boolean;
  videoFrame: boolean;
  structuredOutput: boolean;
  longContext: boolean;
};
```

### 17.3 CanonicalContent

```ts
type CanonicalContent =
  | CanonicalArticle
  | CanonicalVideo;
```

### 17.4 CanonicalArticle

```ts
type CanonicalArticle = {
  id: string;
  contentType: "article";
  rawText: string;
  title?: string;
  summary?: string;
  tags?: string[];
  images?: Asset[];
  createdAt: number;
  updatedAt: number;
};
```

### 17.5 CanonicalVideo

```ts
type CanonicalVideo = {
  id: string;
  contentType: "video";
  videoAsset: VideoAsset;
  title?: string;
  topic?: string;
  summary?: string;
  script?: string;
  transcript?: string;
  coverAsset?: Asset;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
};
```

### 17.6 PlatformContentPackage

```ts
type PlatformContentPackage = {
  id: string;
  contentId: string;
  contentType: "article" | "video";
  platform: PlatformId;
  packageType: string;
  slots: Record<string, ContentSlot>;
  userConfirmed: boolean;
  createdAt: number;
  updatedAt: number;
};
```

### 17.7 ContentSlot

```ts
type ContentSlot = {
  key: string;
  label: string;
  value: unknown;
  required: boolean;
  aiAssistEnabled: boolean;
  aiGenerated: boolean;
  userEdited: boolean;
  userConfirmed: boolean;
  confidence?: "low" | "medium" | "high";
  sourceAssets?: string[];
};
```

### 17.8 AiActionRequest

```ts
type AiActionRequest = {
  contentId: string;
  packageId?: string;
  slotKey?: string;
  action: AiActionType;
  platform?: PlatformId;
  contentType: "article" | "video";
  inputContext: Record<string, unknown>;
};
```

### 17.9 AiActionResult

```ts
type AiActionResult = {
  id: string;
  action: AiActionType;
  candidates: unknown[];
  model: string;
  usedAssets?: string[];
  warnings?: string[];
  createdAt: number;
};
```

---

## 18. API 设计

### 18.1 LLM 配置

```http
POST /settings/llm
GET /settings/llm
POST /settings/llm/test
DELETE /settings/llm
```

### 18.2 AI 字段动作

```http
POST /ai/actions
```

请求示例：

```json
{
  "contentId": "content_001",
  "packageId": "pkg_001",
  "slotKey": "title",
  "action": "generateAlternatives",
  "platform": "bilibili",
  "contentType": "video"
}
```

### 18.3 应用 AI 结果

```http
POST /packages/{packageId}/slots/{slotKey}/apply-ai-result
```

请求：

```json
{
  "resultId": "ai_result_001",
  "candidateIndex": 0,
  "applyMode": "replace"
}
```

### 18.4 生成平台内容包

```http
POST /contents/{contentId}/packages
```

请求：

```json
{
  "platforms": ["wechat", "zhihu", "bilibili", "xiaohongshu"]
}
```

### 18.5 版本历史

```http
GET /packages/{packageId}/versions
POST /packages/{packageId}/versions/{versionId}/restore
```

---

## 19. 日志与审计

### 19.1 需要记录

- AI 动作类型
- 作用字段
- 使用模型
- 使用素材
- 是否应用结果
- 应用方式
- 错误信息
- 耗时
- 是否多模态

### 19.2 不记录

- API Key
- 平台账号密码
- 平台 Cookie
- 未脱敏请求头
- 用户不允许保存的敏感素材

---

## 20. MVP 功能范围

### 20.1 必须实现

1. 设置页配置真实 LLM。
2. LLM 配置支持能力标记，包含多模态能力。
3. 图文 / 视频内容类型选择。
4. 图文基础字段 AI 辅助生成。
5. 视频基础字段 AI 辅助生成。
6. 平台内容包字段级 AI 按钮。
7. AI 结果预览后应用。
8. 平台内容包 slots 结构。
9. 平台配方定义字段和 AI 操作。
10. 发布前检查基于 slots。
11. AI 生成内容确认机制。
12. 模拟发布。
13. 日志记录。
14. 不真实发布。

### 20.2 建议实现

1. 图片封面分析。
2. 视频关键帧抽取。
3. 基于关键帧的封面文案生成。
4. 字段版本回退。
5. AI 操作历史查看。

### 20.3 暂不实现

1. 真实平台发布。
2. 自动点击发布按钮。
3. 视频转码。
4. 自动生成完整视频。
5. 自动字幕识别，除非已有能力。
6. 多账号管理。
7. 团队协作。

---

## 21. 前端验收标准

1. 设置页可以配置真实 LLM。
2. 设置页可以标记模型是否支持图片 / 视频关键帧。
3. 用户可以在标题、摘要、标签、正文、简介、封面文案等字段旁看到 AI 按钮。
4. AI 按钮必须由用户手动触发。
5. AI 结果必须先预览，再应用。
6. AI 结果不能自动覆盖已有内容。
7. 图文内容包和视频内容包都支持字段级 AI 辅助。
8. 视频字段支持基于脚本 / 字幕 / 封面图 / 关键帧的 AI 生成，按模型能力启用。
9. 发布前检查能识别未确认 AI 内容。
10. 用户明确知道当前只是模拟发布或辅助发布，不是真实平台发布。

---

## 22. 后端验收标准

1. 能保存 LLM 配置并加密 API Key。
2. 能测试 LLM 连接。
3. 能根据字段级动作调用 LLM。
4. 能处理文本输入。
5. 能在模型支持时处理图片输入。
6. 能在模型支持时处理视频关键帧输入。
7. 能返回候选结果。
8. 能应用 AI 结果到指定 slot。
9. 能记录版本历史。
10. 能记录 AI 调用日志。
11. 不触发真实平台发布接口。
12. API Key 不出现在日志中。

---

## 23. 总结

本阶段的核心设计是：

```text
AI 不再是一个单独分析模块，
而是每个字段、每个内容块、每个平台包旁边的辅助填写能力。
```

用户体验应是：

```text
我在填写任何内容时，
都可以点一下 AI，
让它根据我的原始素材、图片、视频、脚本和平台目标帮我补全。
```

同时，系统必须支持真实 LLM 配置，且建议配置多模态 LLM。

最终目标：

```text
原始正文
→ AI 辅助生成标题、摘要、正文结构、平台内容包

视频素材
→ AI 辅助生成简介、标签、时间轴、封面文案、平台视频发布包

用户手动确认
→ 发布前检查
→ 模拟发布 / 草稿 / 辅助发布
```

这才是 `flash-promoter` 的核心产品价值。
