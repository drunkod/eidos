import { ViewTableName } from "@/lib/sqlite/const"
import { replaceQueryTableName } from "@/lib/sqlite/sql-parser"
import { getUuid } from "@/lib/utils"

import { IView, ViewTypeEnum } from "../../../lib/store/IView"
import { BaseTable, BaseTableImpl } from "./base"

export class ViewTable extends BaseTableImpl implements BaseTable<IView> {
  name = ViewTableName
  createTableSql = `
CREATE TABLE IF NOT EXISTS ${this.name} (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  tableId TEXT NOT NULL,
  query TEXT NOT NULL,
  properties TEXT,
  filter TEXT
);
`

  JSONFields = ["properties", "filter"]
  async add(data: IView): Promise<IView> {
    await this.dataSpace.exec2(
      `INSERT INTO ${this.name} (id,name,type,tableId,query) VALUES (? , ? , ? , ? , ?);`,
      [data.id, data.name, data.type, data.tableId, data.query]
    )
    return data
  }

  get(id: string): Promise<IView | null> {
    throw new Error("Method not implemented.")
  }

  async del(id: string): Promise<boolean> {
    try {
      await this.dataSpace.exec2(`DELETE FROM ${this.name} WHERE id = ?`, [id])
      return true
    } catch (error) {
      console.warn(error)
      return false
    }
  }

  async deleteByTableId(tableId: string) {
    await this.dataSpace.exec2(`DELETE FROM ${this.name} WHERE tableId = ?`, [
      tableId,
    ])
  }

  // methods
  public async updateQuery(id: string, query: string) {
    await this.dataSpace.exec2(
      `UPDATE ${this.name} SET query = ? WHERE id = ?`,
      [query, id]
    )
  }

  public async list(tableId: string): Promise<IView[]> {
    const res = await this.dataSpace.exec2(
      `SELECT * FROM ${this.name} WHERE tableId = ?;`,
      [tableId]
    )
    return res.map((item) => {
      if (item.properties) {
        item.properties = JSON.parse(item.properties)
      }
      if (item.filter) {
        item.filter = JSON.parse(item.filter)
      }
      return item
    })
  }

  public async createDefaultView(tableId: string) {
    return await this.add({
      id: getUuid(),
      name: "New View",
      type: ViewTypeEnum.Grid,
      tableId,
      query: `SELECT * FROM tb_${tableId}`,
    })
  }

  public async isRowExistInQuery(
    tableId: string,
    rowId: string,
    query: string
  ) {
    const tmpTableName = `temp_table_${getUuid().slice(0, 8)}`
    const tableName = `tb_${tableId}`
    let isExist = false
    try {
      await this.dataSpace.exec2(
        `CREATE TEMPORARY TABLE ${tmpTableName} AS SELECT * FROM ${tableName} WHERE _id = ?`,
        [rowId]
      )
      // Check if the row exists in the temporary table
      const newQuery = replaceQueryTableName(query, {
        [tableName]: tmpTableName,
      })
      const result = await this.dataSpace.exec2(newQuery)
      isExist = result.length > 0
    } catch (error) {
    } finally {
      // Drop the temporary table
      await this.dataSpace.exec2(`DROP TABLE ${tmpTableName}`)
    }
    return isExist
  }
}
