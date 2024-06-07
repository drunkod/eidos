import { ReactNode } from "react"
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents"
import { DecoratorNode, EditorConfig, LexicalEditor, NodeKey } from "lexical"

import { nodeInfoMap } from "@/components/ai-chat/ai-input-editor"

import { MentionComponent } from "./MentionComponent"


export class MentionNode extends DecoratorNode<ReactNode> {
  __id: string

  static getType(): string {
    return "mention"
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__id, node.__key)
  }

  constructor(id: string, key?: NodeKey) {
    super(key)
    this.__id = id
  }

  getTextContent(): string {
    const title = nodeInfoMap.get(this.__id)?.name ?? "Untitled"
    return `<span data-node-id="${this.__id}">${title}</span>`
  }

  createDOM(): HTMLElement {
    const node = document.createElement("span")
    // node.style.display = "inline-block"
    return node
  }

  updateDOM(): false {
    return false
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): ReactNode {
    const nodeKey = this.getKey()
    const embedBlockTheme = config.theme.embedBlock || {}

    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    }
    return (
      <div className="inline-block">
        <BlockWithAlignableContents className={className} nodeKey={nodeKey}>
          <MentionComponent id={this.__id} />
        </BlockWithAlignableContents>
      </div>
    )
  }

  static importJSON(data: any): MentionNode {
    const node = $createMentionNode(data.id)
    return node
  }

  exportJSON() {
    return {
      id: this.__id,
      type: "mention",
      version: 1,
    }
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }
}

export function $createMentionNode(id: string): MentionNode {
  return new MentionNode(id)
}

export function $isMentionNode(
  node: MentionNode | null | undefined
): node is MentionNode {
  return node instanceof MentionNode
}
