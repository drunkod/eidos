import { useEffect, useMemo, useState } from "react"
import { IEmbedding } from "@/worker/web-worker/meta-table/embedding"
import { ICommand, IScript } from "@/worker/web-worker/meta-table/script"
import { useMap } from "ahooks"
import { create } from "zustand"

import { getPrompt } from "@/lib/ai/openai"
import { ITreeNode } from "@/lib/store/ITreeNode"
import { getRawTableNameById } from "@/lib/utils"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useDocEditor } from "@/hooks/use-doc-editor"
import { useSqlite } from "@/hooks/use-sqlite"
import { useUiColumns } from "@/hooks/use-ui-columns"
import { useTablesUiColumns } from "@/apps/web-app/[database]/scripts/hooks/use-all-table-fields"

import { useScriptFunction } from "../script-container/hook"

export const sysPrompts = {
  base: ``,
  eidosBaseHelper: `you must abide by the following rules:
- data from query which can be trusted, you can display it directly, don't need to check it.
- if user want to query some data, you need to generate SQL. then user will tell you the query result.
- 回答必须简单,不要有多余的语气词,比如"好的", "知道了", "请稍等"等等
- when user want to generate visualization, you use mermaid to generate it. return the mermaid code in code block. with language type 'mermaid'
`,
  eidosActionCreator: `now you are a action creator, you can create action.
- user just know name of table and name of column, don't know tableName and tableColumnName
- tableName and tableColumnName are actually exist in sqlite database. you will use them to query database.
- tableColumnName will be mapped, such as 'title : cl_a4ef', title is name of column, cl_a4ef is tableColumnName, you will use cl_a4ef to query database. otherwise you will be punished.
- data from query which can be trusted, you can display it directly, don't need to check it.

1. an action is a function, it can be called by user.
2. function has name, params and nodes
2.1 name is name of function, it can be called by user.
2.2 params is parameters of function, it can be used in nodes.
2.3 nodes is a list of node, it can be used to do something. node has name and params,every node is a function-call
3. build-in function-call below:
- addRow: add a row to table, has two params: tableName and data. data is a object, it's key is tableColumnName, it's value is data from user.

example:
q: 我想创建一个 todo 的 action, 它有一个 content 参数，我想把它保存到 todos 表的 title 字段中
a: {
  name: todo,
  params: [
    {
      name: content,
      type: string,
    }
  ],
  nodes: [
    {
      name: addRow,
      params: [
        {
          name: tableName,
          value: tb_f1ab6a737f5a4c059aeb106f8ea5a79d
        },
        {
          name: data
          value: {
            title: '{{content}}'
          }
        }
      ]
    }
  ]
}
`,
}

const usePromptContext = () => {
  const { space: database, tableName } = useCurrentPathInfo()
  const [currentDocMarkdown, setCurrentDocMarkdown] = useState("")
  const { uiColumns } = useUiColumns(tableName || "", database)

  const context = {
    tableName,
    uiColumns,
    databaseName: database,
    currentDocMarkdown,
  }
  return {
    setCurrentDocMarkdown,
    context,
  }
}

export const useUserPrompts = () => {
  const { sqlite } = useSqlite()
  const [prompts, setPrompts] = useState<IScript[]>([])
  useEffect(() => {
    sqlite?.script
      .list({
        type: "prompt",
        enabled: 1,
      })
      .then((res) => {
        setPrompts(res)
      })
  }, [sqlite])

  return {
    prompts,
  }
}

export const useSystemPrompt = (
  currentSysPrompt: string,
  contextNodes: ITreeNode[] = [],
  contextEmbeddings: IEmbedding[] = []
) => {
  const { context } = usePromptContext()
  const [_map, { set, reset, get }] = useMap<string, string>()
  const { sqlite } = useSqlite()
  const { getDocMarkdown } = useDocEditor(sqlite)

  const tables = useMemo(
    () =>
      contextNodes
        .filter((node) => node.type === "table")
        .map((node) => getRawTableNameById(node.id)),
    [contextNodes]
  )

  const docs = useMemo(
    () =>
      contextNodes.filter((node) => node.type === "doc").map((node) => node.id),
    [contextNodes]
  )

  useEffect(() => {
    async function loadDocs() {
      for (const docId of docs) {
        const markdown = await getDocMarkdown(docId)
        set(docId, markdown)
      }
    }
    loadDocs()
  }, [docs, getDocMarkdown, set])

  const { uiColumnsMap } = useTablesUiColumns(tables)
  const { prompts } = useUserPrompts()
  return useMemo(() => {
    if (sysPrompts.hasOwnProperty(currentSysPrompt)) {
      const baseSysPrompt =
        sysPrompts[currentSysPrompt as keyof typeof sysPrompts]
      let systemPrompt =
        getPrompt(baseSysPrompt, context, currentSysPrompt === "base") +
        `\n--------------- \nhere are some data for nodes:\n ${JSON.stringify(
          contextNodes,
          null,
          2
        )}` +
        Object.keys(uiColumnsMap)
          .map((tableName) => {
            return `\n ${tableName} has columns: ${JSON.stringify(
              uiColumnsMap[tableName].map((c) => c.name),
              null,
              2
            )}`
          })
          .join("\n")
      _map.forEach((value, key) => {
        systemPrompt += `\n--------------- \n <doc-content id=${key}> \n${value} \n </doc-content>`
      })
      if (contextEmbeddings.length > 0) {
        systemPrompt += `\n--------------- \nhere are some context: \n${contextEmbeddings
          .map((r) => r.raw_content)
          .join("\n")}`
      }

      return {
        systemPrompt,
      }
    } else {
      const currentPrompt = prompts.find((p) => p.id === currentSysPrompt)
      return {
        systemPrompt: currentPrompt?.code,
      }
    }
  }, [
    _map,
    context,
    contextEmbeddings,
    contextNodes,
    currentSysPrompt,
    prompts,
    uiColumnsMap,
  ])
}

type Store = {
  currentSysPrompt: keyof typeof sysPrompts | string
  setCurrentSysPrompt: (value: keyof typeof sysPrompts | string) => void
}

export const useAIChatStore = create<Store>((set) => ({
  currentSysPrompt: "base",
  setCurrentSysPrompt: (value) => set(() => ({ currentSysPrompt: value })),
}))

export const usePrompt = (scriptId: string) => {
  const [script, setScript] = useState<IScript | null>()
  const { sqlite } = useSqlite()
  useEffect(() => {
    sqlite?.script.get(scriptId).then((res) => {
      setScript(res)
    })
  }, [scriptId, sqlite])
  return script
}

export const useScriptCall = () => {
  const { callFunction } = useScriptFunction()

  const handleScriptActionCall = async (
    action: IScript,
    input: any,
    command?: ICommand
  ) => {
    await callFunction({
      input,
      command: command?.name || "default",
      context: {
        tables: action.fields_map,
        env: action.env_map || {},
      },
      code: action.code,
      id: action.id,
    })
  }

  return { handleScriptActionCall }
}
