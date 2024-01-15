// @ts-nocheck
// user defined function to scale formula field function

import { Sqlite3Static } from "@sqlite.org/sqlite-wasm"

import {
  DataUpdateSignalType,
  EidosDataEventChannelMsgType,
  EidosDataEventChannelName,
} from "@/lib/const.ts"

const bc = new BroadcastChannel(EidosDataEventChannelName)

export const withSqlite3AllUDF = (sqlite3: Sqlite3Static) => {
  const sjac = sqlite3.capi.sqlite3_js_aggregate_context
  const wasm = sqlite3.wasm
  const capi = sqlite3.capi

  const twice = {
    name: "twice",
    xFunc: function (pCx, arg) {
      return arg + arg
    },
    opt: {
      deterministic: true,
    },
  }

  const today = {
    name: "today",
    xFunc: function (pCx) {
      return new Date().toISOString().slice(0, 10)
    },
    opt: {
      deterministic: false,
    },
  }

  // const filterAll = {
  //   name: "filterAll",
  //   xStep: function (pCtx, ...args) {
  //     console.log(pCtx, args)
  //     const ac = sjac(pCtx, 4)
  //     let res = wasm.peek32(ac)
  //     res = args.every((arg) => Boolean(arg))
  //     wasm.poke32(ac, res)
  //   },
  //   xFinal: (pCtx) => {
  //     const ac = sjac(pCtx, 0)
  //     capi.sqlite3_result_int(pCtx, ac ? wasm.peek32(ac) : 0)
  //     // capi.sqlite3_result_int(pCtx, ac ? wasm.peek32(ac) : 0)
  //     // xFinal() may either return its value directly or call
  //     // sqlite3_result_xyz() and return undefined. Both are
  //     // functionally equivalent.
  //   },
  //   arity: -1,
  //   opt: {
  //     deterministic: true,
  //   },
  // }

  // user defined function to handle data event
  const eidos_data_event_update = {
    name: "eidos_data_event_update",
    xFunc: function (pCx, table, _new, _old) {
      bc.postMessage({
        type: EidosDataEventChannelMsgType.DataUpdateSignalType,
        payload: {
          type: DataUpdateSignalType.Update,
          table,
          _new: JSON.parse(_new),
          _old: JSON.parse(_old),
        },
      })
    },
  }

  const eidos_data_event_insert = {
    name: "eidos_data_event_insert",
    xFunc: function (pCx, table, _new) {
      bc.postMessage({
        type: EidosDataEventChannelMsgType.DataUpdateSignalType,
        payload: {
          type: DataUpdateSignalType.Insert,
          table,
          _new: JSON.parse(_new),
        },
      })
    },
  }

  const eidos_data_event_delete = {
    name: "eidos_data_event_delete",
    xFunc: function (pCx, table, _old) {
      bc.postMessage({
        type: EidosDataEventChannelMsgType.DataUpdateSignalType,
        payload: {
          type: DataUpdateSignalType.Delete,
          table,
          _old: JSON.parse(_old),
        },
      })
    },
  }
  const ALL_UDF = [
    twice,
    today,
    // filterAll,
    eidos_data_event_update,
    eidos_data_event_insert,
    eidos_data_event_delete,
  ]
  return ALL_UDF
}
