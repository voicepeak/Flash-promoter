import { AdapterRegistry } from "./registry.js";
import { bilibiliAdapter } from "./bilibili.js";
import { mockAdapter } from "./mock.js";
import { wechatAdapter } from "./wechat.js";
import { xhsAssistAdapter } from "./xhsAssist.js";
import { zhihuAssistAdapter } from "./zhihuAssist.js";
import { wordpressAdapter } from "./wordpress.js";

export const adapterRegistry = new AdapterRegistry();

adapterRegistry.register(mockAdapter);
adapterRegistry.register(wechatAdapter);
adapterRegistry.register(bilibiliAdapter);
adapterRegistry.register(zhihuAssistAdapter);
adapterRegistry.register(xhsAssistAdapter);
adapterRegistry.register(wordpressAdapter);

export {
  bilibiliAdapter,
  mockAdapter,
  wechatAdapter,
  xhsAssistAdapter,
  zhihuAssistAdapter,
  wordpressAdapter
};
