import { TreeTableName } from "@/lib/sqlite/const"
import { ITreeNode } from "@/lib/store/ITreeNode"
import { extractIdFromShortId, getRawTableNameById } from "@/lib/utils"

import { BaseTable, BaseTableImpl } from "./base"

export class TreeTable extends BaseTableImpl implements BaseTable<ITreeNode> {
  name = TreeTableName
  createTableSql = `
  CREATE TABLE IF NOT EXISTS ${TreeTableName} (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    parent_id TEXT NULL,
    is_pinned BOOLEAN DEFAULT 0,
    is_full_width BOOLEAN DEFAULT 0,
    is_locked BOOLEAN DEFAULT 0,
    icon TEXT NULL,
    cover TEXT NULL,
    is_deleted BOOLEAN DEFAULT 0,
    hide_properties BOOLEAN DEFAULT 0,
    position REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TEMP TRIGGER IF NOT EXISTS ${TreeTableName}_insert_trigger
  AFTER INSERT ON ${TreeTableName}
  BEGIN
    SELECT eidos_meta_table_event_insert(
      '${TreeTableName}',
      json_object(
        'id', new.id,
        'name', new.name,
        'type', new.type,
        'parent_id', new.parent_id,
        'is_pinned', new.is_pinned,
        'is_full_width', new.is_full_width,
        'is_locked', new.is_locked,
        'icon', new.icon,
        'cover', new.cover,
        'is_deleted', new.is_deleted,
        'hide_properties', new.hide_properties,
        'position', new.position,
        'created_at', new.created_at,
        'updated_at', new.updated_at
      )
    );
  END;
  `

  getNextRowId = async () => {
    const res = await this.dataSpace.exec2(
      `SELECT max(rowid) as maxId from ${TreeTableName};`
    )
    return res[0].maxId + 1
  }

  async add(data: ITreeNode): Promise<ITreeNode> {
    const nextPosition = await this.getNextRowId()
    this.dataSpace.exec(
      `INSERT INTO ${TreeTableName} (id,name,type,parent_id,position) VALUES (? , ? , ? , ?,?);`,
      [data.id, data.name, data.type, data.parent_id, nextPosition]
    )
    return Promise.resolve({
      ...data,
      position: nextPosition,
    })
  }

  async get(id: string): Promise<ITreeNode | null> {
    const res = await this.dataSpace.exec2(
      `SELECT * FROM ${TreeTableName} where id = ?;`,
      [id]
    )
    if (res.length === 0) {
      return null
    }
    return res[0] as ITreeNode
  }

  async updateName(id: string, name: string): Promise<boolean> {
    try {
      await this.dataSpace.exec2(
        `UPDATE ${TreeTableName} SET name = ? WHERE id = ?;`,
        [name, id]
      )
      return Promise.resolve(true)
    } catch (error) {
      return Promise.resolve(false)
    }
  }

  async pin(id: string, is_pinned: boolean): Promise<boolean> {
    await this.dataSpace.exec2(
      `UPDATE ${TreeTableName} SET is_pinned = ? WHERE id = ?;`,
      [is_pinned, id]
    )
    return Promise.resolve(true)
  }

  async del(id: string, db = this.dataSpace.db): Promise<boolean> {
    this.dataSpace.syncExec2(
      `DELETE FROM ${TreeTableName} WHERE id = ?`,
      [id],
      db
    )
    return true
  }

  // @deprecated Proxy can't pass to main thread
  makeProxyRow(row: any): ITreeNode {
    const dataSpace = this.dataSpace
    return new Proxy(row, {
      get(target, p, receiver) {
        if (p === "children") {
          return []
        }
        return Reflect.get(target, p, receiver)
      },
      set(target, p: string, value, receiver) {
        dataSpace.exec(`UPDATE ${TreeTableName} SET ${p} = ? WHERE id = ?;`, [
          value,
          target.id,
        ])
        return Reflect.set(target, p, value, receiver)
      },
    })
  }

  async list(qs: {
    query?: string
    withSubNode?: boolean
  }): Promise<ITreeNode[]> {
    const { query, withSubNode } = qs
    let sql = `SELECT * FROM ${TreeTableName} `
    if (query) {
      sql += ` WHERE name like ?`
    }
    if (query && !withSubNode) {
      sql += ` AND parent_id is null`
    }

    sql += ` ORDER BY position DESC;`
    const bind = query ? [`%${query}%`] : undefined
    const res = await this.dataSpace.exec2(sql, bind)
    return res.map((row) => row)
  }

  async moveIntoTable(
    id: string,
    tableId: string,
    parentId?: string
  ): Promise<boolean> {
    try {
      await this.dataSpace.db.transaction(async (db) => {
        // update parent_id
        this.dataSpace.syncExec2(
          `UPDATE ${TreeTableName} SET parent_id = ? WHERE id = ?;`,
          [tableId, id],
          db
        )
        const tableName = getRawTableNameById(tableId)
        const title = (await this.get(id))?.name
        if (parentId) {
          const parentTableName = getRawTableNameById(parentId)
          this.dataSpace.syncExec2(
            `DELETE FROM ${parentTableName} WHERE _id = ?;`,
            [extractIdFromShortId(id)],
            db
          )
        }
        this.dataSpace.syncExec2(
          `INSERT INTO ${tableName} (_id,title) VALUES (?,?);`,
          [extractIdFromShortId(id), title],
          db
        )
      })
      return Promise.resolve(true)
    } catch (error) {
      return Promise.resolve(false)
    }
  }

  /**
   * id: uuid without '-'
   * miniId: last 8 char of id. most of time, it's enough to identify a node
   * @param idOrMiniId
   */
  async getNode(idOrMiniId: string): Promise<ITreeNode | null> {
    const res = await this.dataSpace.exec2(
      `SELECT * FROM ${TreeTableName} WHERE id = ? OR substr(id, -8) = ?;`,
      [idOrMiniId, idOrMiniId]
    )
    return res.length > 0 ? res[0] : null
  }

  public async checkLoop(id: string, parentId: string) {
    if (id === parentId) {
      throw new Error("Can't move into a child node")
    } else {
      const adjacencyList = await this.getAdjacencyList()
      const visited = new Set<string>()
      const hasLoop = this.dfs(adjacencyList, visited, id, parentId)
      if (hasLoop) {
        throw new Error("Can't move into a child node")
      }
      // ... continue with changing the parent
    }
  }

  private async getAdjacencyList(): Promise<Map<string, string[]>> {
    const res = await this.dataSpace.exec2(
      `SELECT id, parent_id FROM ${TreeTableName}`
    )
    const adjacencyList = new Map<string, string[]>()
    for (const row of res) {
      if (!adjacencyList.has(row.parent_id)) {
        adjacencyList.set(row.parent_id, [])
      }
      adjacencyList.get(row.parent_id)!.push(row.id)
    }
    return adjacencyList
  }

  private dfs(
    adjacencyList: Map<string, string[]>,
    visited: Set<string>,
    node: string,
    target: string
  ): boolean {
    if (node === target) {
      return true
    }
    visited.add(node)
    const neighbors = adjacencyList.get(node) || []
    for (const neighbor of neighbors) {
      if (
        !visited.has(neighbor) &&
        this.dfs(adjacencyList, visited, neighbor, target)
      ) {
        return true
      }
    }
    return false
  }
}
