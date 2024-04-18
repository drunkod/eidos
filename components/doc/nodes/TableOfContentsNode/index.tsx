import { ReactNode } from "react"
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import LexicalTableOfContents from "@lexical/react/LexicalTableOfContents"
import { DecoratorNode, EditorConfig, LexicalEditor, NodeKey } from "lexical"

import { cn } from "@/lib/utils"

import { makeTitleLevels } from "./helper"

export const TableOfContentsComponent = () => {
  const [editor] = useLexicalComposerContext()

  function scrollToNode(key: NodeKey) {
    editor.getEditorState().read(() => {
      const domElement = editor.getElementByKey(key)
      if (domElement !== null) {
        domElement.scrollIntoView()
      }
    })
  }
  const handleClick = (key: NodeKey) => {
    scrollToNode(key)
  }
  return (
    <LexicalTableOfContents>
      {(tableOfContents) => {
        if (tableOfContents.length === 0) {
          return (
            <div>
              <div className="w-full cursor-pointer underline opacity-70 hover:bg-secondary">
                add some headings to your document to create a table of
                contents.
              </div>
            </div>
          )
        }
        const titleLevels = makeTitleLevels(
          tableOfContents.map((item) => item[2])
        )
        return (
          <div>
            {tableOfContents.map((toc, index) => {
              const [id, text, tag] = toc
              const level = titleLevels[index]
              return (
                <div
                  className={cn(
                    "w-full cursor-pointer underline opacity-70 hover:bg-secondary",
                    {
                      "pl-0": level === 1,
                    },
                    {
                      "pl-4": level === 2,
                    },
                    {
                      "pl-8": level === 3,
                    },
                    {
                      "pl-12": level === 4,
                    }
                  )}
                  onClick={() => handleClick(id)}
                  key={id}
                >
                  {text}
                </div>
              )
            })}
          </div>
        )
      }}
    </LexicalTableOfContents>
  )
}

export class TableOfContentsNode extends DecoratorNode<ReactNode> {
  static getType(): string {
    return "toc"
  }

  static clone(node: TableOfContentsNode): TableOfContentsNode {
    return new TableOfContentsNode()
  }

  createDOM(): HTMLElement {
    const node = document.createElement("div")
    return node
  }

  updateDOM(): false {
    return false
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): ReactNode {
    const data = this.exportJSON()
    const nodeKey = this.getKey()
    const embedBlockTheme = config.theme.embedBlock || {}

    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    }
    return (
      <BlockWithAlignableContents className={className} nodeKey={nodeKey}>
        <TableOfContentsComponent />
      </BlockWithAlignableContents>
    )
  }

  static importJSON(data: any): TableOfContentsNode {
    const node = $createTableOfContentsNode()
    return node
  }

  exportJSON() {
    return {
      type: "toc",
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

export function $createTableOfContentsNode(): TableOfContentsNode {
  return new TableOfContentsNode()
}

export function $isTableOfContentsNode(
  node: TableOfContentsNode | null | undefined
): node is TableOfContentsNode {
  return node instanceof TableOfContentsNode
}
