import type { Block } from "../models.js";

export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
        case "heading":
        case "quote":
          return block.text;
        case "code":
          return block.code;
        case "list":
          return block.items.join("\n");
        case "image":
          return block.caption ?? "";
        case "divider":
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return block.text;
        case "heading":
          return `${"#".repeat(block.level)} ${block.text}`;
        case "quote":
          return block.text
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n");
        case "code":
          return `\`\`\`${block.language ?? ""}\n${block.code}\n\`\`\``;
        case "list":
          return block.items
            .map((item, index) => (block.ordered ? `${index + 1}. ${item}` : `- ${item}`))
            .join("\n");
        case "image":
          return `![${block.caption ?? ""}](asset:${block.assetId})`;
        case "divider":
          return "---";
      }
    })
    .join("\n\n")
    .trim();
}

export function summarizeBlocks(blocks: Block[], maxLength = 120): string {
  const plain = blocksToPlainText(blocks).replace(/\s+/g, " ").trim();
  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, maxLength - 1)}…`;
}

export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？!?\.])\s+|\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}
