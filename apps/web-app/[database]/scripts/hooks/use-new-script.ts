import { IScript } from "@/worker/web-worker/meta-table/script"
import { useNavigate } from "react-router-dom"

import { generateId } from "@/lib/utils"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"

import { useScript } from "./use-script"

export const useNewScript = () => {
  const { addScript } = useScript()
  const router = useNavigate()
  const { space } = useCurrentPathInfo()

  const handleCreateNewScript = async (
    template: "script" | "udf" | "prompt" = "script"
  ) => {
    const newScriptId = generateId()
    const newScript: IScript = {
      id: newScriptId,
      name: `New Script - ${newScriptId}`,
      commands: [],
      type: "script",
      description: "Script Description",
      version: "0.0.1",
      ts_code: `export default async function (input:Input, context:Context) {
    eidos.currentSpace.notify({
        title: "hello eidos"
    })
}`,
      code: `export default async function (input, context) {
    eidos.currentSpace.notify({
        title: "hello eidos"
    })
}`,
    }

    const newUDFScript: IScript = {
      id: newScriptId,
      name: `myTwice`,
      commands: [],
      type: "udf",
      description: "twice the input",
      version: "0.0.1",
      code: `function myFunc(pCx, arg) {
    return arg + arg
}`,
    }

    const promptScript: IScript = {
      id: newScriptId,
      name: `New Prompt - ${newScriptId}`,
      commands: [],
      type: "prompt",
      description: "Prompt Description",
      version: "0.0.1",
      code: `you are a helpful robot!`,
    }

    const templateMap = {
      script: newScript,
      udf: newUDFScript,
      prompt: promptScript,
    }

    const script = templateMap[template]
    await addScript(script)
    router(`/${space}/extensions/${newScriptId}`)
  }

  return {
    handleCreateNewScript,
  }
}
