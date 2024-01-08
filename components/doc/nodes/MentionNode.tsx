import { DecoratorNode } from "lexical"
import { NodeKey } from "lexical/LexicalNode"
import { ReactNode, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { NodeIconEditor } from "@/app/[database]/[table]/node-icon"
import { ItemIcon } from "@/components/sidebar/item-tree"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useQueryNode } from "@/hooks/use-query-node"
import { ITreeNode } from "@/lib/store/ITreeNode"

const MentionComponent = (props: { id: string }) => {
  const [node, setNode] = useState<ITreeNode | null>(null)
  const { space } = useCurrentPathInfo()
  // TODO: pass from props
  const { getNode } = useQueryNode()
  const { id } = props
  const router = useNavigate()
  const onClick = () => {
    router(`/${space}/${id}`)
  }
  useEffect(() => {
    getNode(id).then((node) => {
      setNode(node ?? null)
    })
  }, [getNode, id])
  return (
    <span
      className="inline-block cursor-pointer rounded-sm px-1 underline hover:bg-secondary"
      id={id}
      onClick={onClick}
    >
      {node && (
        <NodeIconEditor
          icon={node.icon}
          nodeId={node.id}
          disabled
          size="1em"
          customTrigger={
            <ItemIcon
              type={node?.type ?? ""}
              className="mr-1 inline-block h-5 w-5"
            />
          }
        />
      )}
      {node?.name ?? "loading"}
    </span>
  )
}

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

  createDOM(): HTMLElement {
    const node = document.createElement("span")
    // node.style.display = "inline-block"
    return node
  }

  updateDOM(): false {
    return false
  }

  decorate(): ReactNode {
    return <MentionComponent id={this.__id} />
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
