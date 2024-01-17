import { SelectFromStatement, parseFirst, toSql } from "pgsql-ast-parser"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useSqlite } from "@/hooks/use-sqlite"
import { useTable } from "@/hooks/use-table"
import { IView } from "@/lib/store/IView"

export const useViewOperation = () => {
  const { tableId, tableName, space } = useCurrentPathInfo()
  const { updateViews } = useTable(tableName!, space)
  const { sqlite } = useSqlite()
  const addView = async () => {
    if (tableId && sqlite) {
      const view = await sqlite.createDefaultView(tableId)
      await updateViews()
      return view
    }
  }
  const delView = async (viewId: string) => {
    if (sqlite) {
      await sqlite.delView(viewId)
      await updateViews()
    }
  }
  const updateView = async (id: string, view: Partial<IView>) => {
    if (sqlite) {
      await sqlite.updateView(id, view)
      await updateViews()
    }
  }

  const addSort = (view: IView, column: string, direction: "ASC" | "DESC") => {
    const parsedSql = parseFirst(view?.query ?? "") as SelectFromStatement
    if (parsedSql?.orderBy?.some((item) => (item.by as any).name === column)) {
      const order = parsedSql.orderBy!.find(
        (item) => (item.by as any).name === column
      )!
      if (order.order !== direction) {
        order.order = direction
      } else {
        return
      }
    } else {
      parsedSql.orderBy = [
        ...(parsedSql.orderBy || []),
        {
          by: {
            type: "ref",
            name: column,
          },
          order: direction,
        },
      ]
    }
    const newSql = toSql.statement(parsedSql)
    updateView(view!.id, {
      query: newSql,
    })
  }

  return {
    addView,
    delView,
    updateView,
    addSort,
  }
}

export const useCurrentView = () => {
  const { tableName, space } = useCurrentPathInfo()
  const { views } = useTable(tableName!, space)
  const defaultViewId = useMemo(() => {
    return views[0]?.id
  }, [views])

  const [currentViewId, setCurrentViewId] = useState<string | undefined>(
    defaultViewId
  )
  let [searchParams, setSearchParams] = useSearchParams()
  const v = searchParams.get("v")

  useEffect(() => {
    if (v) {
      setCurrentViewId(v)
    } else {
      setCurrentViewId(defaultViewId)
    }
  }, [defaultViewId, setSearchParams, v])

  const currentView = useMemo(() => {
    return views.find((v) => v.id === currentViewId)
  }, [views, currentViewId])

  return {
    currentView,
    setCurrentViewId,
    defaultViewId,
  }
}
