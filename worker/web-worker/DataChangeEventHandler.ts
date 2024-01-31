import {
  DataUpdateSignalType,
  EidosDataEventChannelMsg,
  EidosDataEventChannelMsgType,
  EidosDataEventChannelName,
} from "@/lib/const"
import { getTableIdByRawTableName } from "@/lib/utils"

import { DataSpace } from "./DataSpace"
import { TableManager } from "./sdk/table"

const bc = new BroadcastChannel(EidosDataEventChannelName)

export class DataChangeEventHandler {
  constructor(private dataSpace: DataSpace) {
    bc.onmessage = async (e: MessageEvent<EidosDataEventChannelMsg>) => {
      const { type, payload } = e.data
      if (type === EidosDataEventChannelMsgType.DataUpdateSignalType) {
        const { _new, _old, table } = payload
        switch (payload.type) {
          case DataUpdateSignalType.Insert:
          case DataUpdateSignalType.Update:
            const diff = DataChangeEventHandler.getDiff(_old, _new)
            const diffKeys = Object.keys(diff)
            const updateSignal = {
              table,
              rowId: _new._id,
              diff,
              diffKeys,
            }
            console.log("updateSignal", updateSignal)
            const tableId = getTableIdByRawTableName(table)
            const tm = new TableManager(tableId, this.dataSpace)
            await tm.compute.updateEffectCells(updateSignal)
            break
          case DataUpdateSignalType.Delete:
            if (table.startsWith("lk_")) {
              const tableId = getTableIdByRawTableName(table)
              const tm = new TableManager(tableId, this.dataSpace)
              const res = await tm.fields.link.getEffectRowsByRelationDeleted(
                table,
                _old as any
              )
              Object.entries(res).forEach(([tableName, fieldRowIdsMap]) => {
                Object.entries(fieldRowIdsMap).forEach(([k, v]) => {
                  Array.from(v as Set<string>).forEach((rowId) => {
                    this.dataSpace.linkRelationUpdater.addCell(
                      tableName,
                      k,
                      rowId
                    )
                  })
                })
              })
              break
            }
            break
          default:
            break
        }
      }
    }
  }

  static getDiff = (
    oldData: Record<string, any> | undefined,
    newData: Record<string, any>
  ) => {
    const diff: Record<
      string,
      {
        old: any
        new: any
      }
    > = {}
    Object.entries(newData).forEach(([k, v]) => {
      if (oldData?.hasOwnProperty(k) && oldData[k] !== v) {
        diff[k] = { old: oldData[k], new: v }
      }
      if (!oldData?.hasOwnProperty(k)) {
        diff[k] = { old: undefined, new: v }
      }
    })
    return diff
  }
}
