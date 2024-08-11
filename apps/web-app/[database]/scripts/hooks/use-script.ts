import { IScript } from "@/worker/web-worker/meta-table/script"
import { useState } from "react"

import { useSqlite } from "@/hooks/use-sqlite"

import { checkPromptEnable } from "../helper"

export const useScript = () => {
  const { sqlite } = useSqlite()
  const [installLoading, setInstallLoading] = useState(false)

  const addScript = async (script: IScript) => {
    if (!sqlite) return
    await sqlite.addScript(script)
    console.log("addScript", script)
  }
  const deleteScript = async (id: string) => {
    if (!sqlite) return
    await sqlite.deleteScript(id)
    console.log("deleteScript", id)
  }
  const updateScript = async (script: IScript) => {
    if (!sqlite) return
    await sqlite.script.set(script.id, script)
    console.log("updateScript", script)
  }
  const installScript = async (script: IScript) => {
    setInstallLoading(true)
    script && (await addScript(script))
    setInstallLoading(false)
  }
  const enableScript = async (id: string) => {
    if (!sqlite) return
    const data = await sqlite.script.get(id)
    if (data?.type === "prompt") {
      checkPromptEnable(data)
    }
    await sqlite.enableScript(id)
    console.log("enableScript", id)
  }
  const disableScript = async (id: string) => {
    if (!sqlite) return
    await sqlite.disableScript(id)
    console.log("disableScript", id)
  }
  return {
    addScript,
    deleteScript,
    updateScript,
    installScript,
    installLoading,
    enableScript,
    disableScript,
  }
}
