import { JsonSchema7ObjectType } from "zod-to-json-schema/src/parsers/object"

import { ScriptTableName } from "@/lib/sqlite/const"

import { BaseTable, BaseTableImpl } from "./base"

export interface IScript {
  id: string
  name: string
  description: string
  version: string
  code: string
  inputJSONSchema?: JsonSchema7ObjectType
  outputJSONSchema?: JsonSchema7ObjectType
  tables?: {
    name: string
    fields: {
      name: string
      type: string
    }[]
  }[]
  envMap?: {
    [key: string]: string
  }
  fieldsMap?: {
    [tableName: string]: {
      name: string
      fieldsMap: {
        [fieldName: string]: string
      }
    }
  }
}

export class ScriptTable extends BaseTableImpl implements BaseTable<IScript> {
  name = ScriptTableName
  createTableSql = `
    CREATE TABLE IF NOT EXISTS ${this.name} (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        version TEXT,
        code TEXT,
        inputJSONSchema TEXT,
        outputJSONSchema TEXT,
        tables TEXT,
        envMap TEXT,
        fieldsMap TEXT
    );
`

  add(data: IScript): Promise<IScript> {
    this.dataSpace.exec2(
      `INSERT INTO ${this.name} (id, name, description, version, code, inputJSONSchema, outputJSONSchema, tables, envMap, fieldsMap) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.description,
        data.version,
        data.code,
        data.inputJSONSchema,
        data.outputJSONSchema,
        data.tables,
        data.envMap,
        data.fieldsMap,
      ]
    )
    return Promise.resolve(data)
  }
  set(id: string, data: IScript): Promise<boolean> {
    this.dataSpace.exec2(
      `UPDATE ${this.name} SET name = ?, description = ?, version = ?, code = ?, inputJSONSchema = ?, outputJSONSchema = ?, envMap = ?, fieldsMap = ? WHERE id = ?`,
      [
        data.name,
        data.description,
        data.version,
        data.code,
        data.inputJSONSchema,
        data.outputJSONSchema,
        data.envMap,
        data.fieldsMap,
        id,
      ]
    )
    return Promise.resolve(true)
  }
  del(id: string): Promise<boolean> {
    this.dataSpace.exec2(`DELETE FROM ${this.name} WHERE id = ?`, [id])
    return Promise.resolve(true)
  }
  async get(id: string): Promise<IScript | null> {
    const res = await this.dataSpace.exec2(
      `SELECT * FROM ${this.name} WHERE id = ?`,
      [id]
    )
    if (!res.length) {
      return Promise.resolve(null)
    }
    return Promise.resolve({
      id: res[0].id,
      name: res[0].name,
      description: res[0].description,
      version: res[0].version,
      code: res[0].code,
      inputJSONSchema: JSON.parse(res[0].inputJSONSchema),
      outputJSONSchema: JSON.parse(res[0].outputJSONSchema),
      tables: JSON.parse(res[0].tables),
      envMap: JSON.parse(res[0].envMap),
      fieldsMap: JSON.parse(res[0].fieldsMap),
    })
  }
  async list(): Promise<IScript[]> {
    const res = await this.dataSpace.exec2(`SELECT * FROM ${this.name}`)
    return Promise.resolve(
      res.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        version: item.version,
        code: item.code,
        inputJSONSchema: JSON.parse(item.inputJSONSchema),
        outputJSONSchema: JSON.parse(item.outputJSONSchema),
        tables: JSON.parse(item.tables),
        envMap: JSON.parse(item.envMap),
        fieldsMap: JSON.parse(item.fieldsMap),
      }))
    )
  }
}
