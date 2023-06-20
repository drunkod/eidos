import { useState } from "react"
import { LexicalEditor } from "lexical"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { INSERT_SQL_COMMAND } from "."

interface SqlQueryDialogProps {
  activeEditor: LexicalEditor
  onClose: () => void
}

const Placeholder = "SELECT date();"
export const SqlQueryDialog = (props: SqlQueryDialogProps) => {
  const [sql, setSql] = useState("")
  const { activeEditor, onClose } = props

  const handleQuery = () => {
    activeEditor.dispatchCommand(INSERT_SQL_COMMAND, sql)
    onClose()
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleQuery()
    }
    if (e.key === "Escape") {
      onClose()
    }

    if (e.key === "Tab") {
      e.preventDefault()
      e.stopPropagation()
      setSql(Placeholder)
    }
  }
  return (
    <div className="flex gap-2">
      <Input
        placeholder={Placeholder}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button onClick={handleQuery}>Query</Button>
    </div>
  )
}
