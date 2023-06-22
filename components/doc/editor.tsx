"use client"

import React, { useState } from "react"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"

import { AllNodes } from "./nodes"
import { AllPlugins } from "./plugins"
import { AutoSavePlugin } from "./plugins/AutoSavePlugin"
import { DraggableBlockPlugin } from "./plugins/DraggableBlockPlugin"
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingTextFormatToolbarPlugin"
import defaultTheme from "./themes/default"

const editorConfig: any = {
  // The editor theme
  theme: defaultTheme,
  // Handling of errors during update
  onError(error: any) {
    throw error
  },
  // Any custom nodes go here
  nodes: AllNodes,
}

interface EditorProps {
  docId?: string
  onSave: (content: string) => void
  initContent?: string
  isEditable: boolean
  autoSave?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function Editor(props: EditorProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)
  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }
  const initConfig = {
    ...editorConfig,
    editable: props.isEditable,
  }
  return (
    <div className="flex items-center justify-center">
      <div className="h-full w-full">
        <LexicalComposer initialConfig={initConfig}>
          <div
            className="editor-container h-full"
            ref={ref}
            id="editor-container"
          >
            <div className="editor-inner relative h-full">
              <RichTextPlugin
                contentEditable={
                  <div className="editor relative" ref={onRef}>
                    <ContentEditable className="editor-input prose p-2 outline-none dark:prose-invert" />
                    <div
                      className="h-12 w-full"
                      role="safe-bottom-padding"
                    ></div>
                  </div>
                }
                placeholder={
                  <div className="pointer-events-none absolute left-2 top-3 text-[#aaa]">
                    {props.placeholder ?? "press / for Command"}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <AllPlugins />
              {props.autoFocus && <AutoFocusPlugin />}
              <AutoSavePlugin
                onSave={props.onSave}
                autoSave={props.autoSave}
                initContent={props.initContent}
              />
              <FloatingTextFormatToolbarPlugin />
              {floatingAnchorElem && (
                <>
                  <DraggableBlockPlugin anchorElem={floatingAnchorElem!} />
                </>
              )}
            </div>
          </div>
        </LexicalComposer>
      </div>
    </div>
  )
}
