import { useCallback, useEffect, useMemo, useState } from "react"
import { XIcon } from "lucide-react"

import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useUiColumns } from "@/hooks/use-ui-columns"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { FieldSelector } from "./field-selector"
import { useCurrentView } from "./hooks"
import { useViewQuery } from "./hooks/use-view-query"

export type OrderByItem = {
  column: string
  order: string | "ASC" | "DESC"
}

interface IViewEditorProps {
  onSortChange?: (sort: OrderByItem[]) => void
}
export function ViewSortEditor(props: IViewEditorProps) {
  const { currentView } = useCurrentView()
  const { parsedSql } = useViewQuery(currentView!)

  const oldOrderBy: OrderByItem[] = useMemo(() => {
    return (parsedSql.orderBy || []).map((item) => {
      return {
        column: (item.by as any).name as string,
        order: item.order as string,
      }
    })
  }, [parsedSql])
  const [addedFields, setAddedFields] = useState<string[]>(
    oldOrderBy.map((item) => item.column)
  )
  const [orderItems, setOrderItems] = useState<OrderByItem[]>(oldOrderBy)

  useEffect(() => {
    setOrderItems(oldOrderBy)
  }, [oldOrderBy])

  useEffect(() => {
    setAddedFields(orderItems.map((item) => item.column))
    props.onSortChange?.(orderItems)
  }, [orderItems, props])

  const { database, tableName } = useCurrentPathInfo()
  const { rawIdNameMap, uiColumns } = useUiColumns(tableName!, database!)
  const restFields = useMemo(() => {
    return uiColumns.filter((item) => {
      return addedFields.indexOf(item.table_column_name) === -1
    })
  }, [uiColumns, addedFields])

  const addSort = () => {
    const column = restFields[0].table_column_name
    if (restFields.length) {
      setOrderItems([
        ...orderItems,
        {
          column,
          order: "ASC",
        },
      ])
      setAddedFields([...addedFields, column])
    }
  }
  const delSort = useCallback(
    (index: number) => {
      console.log(index)
      const newOrderItems = [...orderItems]
      newOrderItems.splice(index, 1)
      console.log(newOrderItems)
      setOrderItems(newOrderItems)
    },
    [orderItems]
  )

  const onValueChange = useCallback(
    (value: string, index: number) => {
      const newOrderItems = [...orderItems]
      newOrderItems[index].column = value
      setOrderItems(newOrderItems)
    },
    [orderItems]
  )

  const onOrderChange = useCallback(
    (value: string, index: number) => {
      const newOrderItems = [...orderItems]
      newOrderItems[index].order = value
      setOrderItems(newOrderItems)
    },
    [orderItems]
  )

  const handleClearSort = () => {
    setOrderItems([])
  }

  return (
    <div className="w-[300px] rounded-lg border p-2 shadow-md">
      {orderItems.map((item, index) => {
        return (
          <div className="mt-4 flex items-center space-x-2" key={item.column}>
            {/* <MousePointerIcon className="text-gray-400" /> */}
            <FieldSelector
              fields={uiColumns}
              value={item.column}
              onChange={(value) => onValueChange(value, index)}
            />
            <Select
              value={item.order}
              onValueChange={(value) => onOrderChange(value, index)}
            >
              <SelectTrigger id="sort-order-2">
                <SelectValue placeholder="Ascending" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ASC">Ascending</SelectItem>
                <SelectItem value="DESC">Descending</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="text-gray-400"
              variant="ghost"
              onClick={() => delSort(index)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      })}

      <div className="mt-4 flex items-center justify-between">
        <Button
          className="flex items-center space-x-2"
          variant="outline"
          onClick={addSort}
        >
          {/* <PlusIcon className="w-4 h-4" /> */}
          <span>Add sort</span>
        </Button>
        <Button variant="ghost" onClick={handleClearSort}>
          <span>Delete sort</span>
        </Button>
      </div>
    </div>
  )
}
