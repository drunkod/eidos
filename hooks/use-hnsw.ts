import { useEffect, useRef } from "react"
import { DataSpace } from "@/worker/web-worker/DataSpace"
import { IEmbedding } from "@/worker/web-worker/meta-table/embedding"
import zip from "lodash/zip"

import { DocLoader } from "@/lib/ai/doc_loader/doc"
import { PDFLoader } from "@/lib/ai/doc_loader/pdf"
import { LLMBaseVendor } from "@/lib/ai/llm_vendors/base"
import { BGEM3 } from "@/lib/ai/llm_vendors/bge"
import { getHnswIndex } from "@/lib/ai/vec_search"
import { EmbeddingTableName } from "@/lib/sqlite/const"

import { useSqlite } from "./use-sqlite"

// we can't import hnswlib in worker directly, because it's also a web worker
class EmbeddingManager {
  dataSpace: DataSpace

  constructor(dataSpace: DataSpace) {
    this.dataSpace = dataSpace
  }

  /**
   * @param model
   * @param source for hnswlib, it's the filename. for query, it's scope param
   */
  async filterEmbeddings(model: string, source: string) {
    const res = await this.dataSpace
      .sql2`SELECT id, raw_content,source,source_type FROM ${Symbol(
      EmbeddingTableName
    )} WHERE model = ${model} AND source = ${source}`

    const embeddingIndexMap = new Map<number, IEmbedding>()
    const embeddings: number[][] = []
    res.forEach((row, index) => {
      const embedding = JSON.parse(row.embedding)
      embeddingIndexMap.set(index, row)
      embeddings.push(embedding)
    })
    return {
      embeddings,
      embeddingIndexMap,
    }
  }

  async getMetadata(ids: string[]) {
    const res = await this.dataSpace
      .sql2`SELECT id, raw_content,source,source_type FROM ${Symbol(
      EmbeddingTableName
    )} WHERE id IN ${ids}`
    const resMap = res.reduce((acc, row) => {
      acc[row.id] = row
      return acc
    }, {} as Record<string, IEmbedding>)
    return ids.map((id) => resMap[id])
  }

  async clearEmbeddings(model: string, source: string) {
    // query all embeddings of this source
    const res = await this.dataSpace.sql2`SELECT id FROM ${Symbol(
      EmbeddingTableName
    )} WHERE model = ${model} AND source = ${source}`

    const { exists, vectorHnswIndex } = await getHnswIndex(model, "all")
    const ids = res.map((row) => parseInt(row.id))
    if (exists) {
      vectorHnswIndex.markDeleteItems(ids)
    }
    // delete all embeddings of this source
    await this.dataSpace.sql2`DELETE FROM ${Symbol(
      EmbeddingTableName
    )} WHERE model = ${model} AND source = ${source}`
  }

  public async query(
    query: string,
    model: string,
    scope: string,
    k = 3,
    provider: LLMBaseVendor
  ) {
    const embeddings = await provider.embedding([query], model)
    const embedding = embeddings[0]
    if (!embedding) return []
    const { exists, vectorHnswIndex } = await getHnswIndex(model, scope)
    // const { embeddingIndexMap, embeddings: oldEmbeddings } =
    //   await this.filterEmbeddings(model, scope)
    // if (!exists) {
    //   vectorHnswIndex.addItems(oldEmbeddings, true)
    // }
    const { neighbors } = vectorHnswIndex.searchKnn(
      embedding,
      k,
      undefined
    ) as any
    return this.getMetadata(neighbors.map((r: number) => r.toString()))
  }

  public async createEmbedding(
    id: string,
    type: "doc" | "table" | "file",
    model: string,
    provider: LLMBaseVendor
  ) {
    let loader
    let pages: { content: string; meta: any }[]
    const dataSpace = this.dataSpace
    if (type !== "file") {
      await this.clearEmbeddings(model, id)
      console.log("clearEmbeddings", model, id)
    }
    async function embedding(pages: { content: string; meta: any }[]) {
      if (!pages.length) {
        return
      }
      const embeddingMethod = async (texts: string[]) =>
        provider.embedding(texts, model)
      const embeddings = await embeddingMethod(
        pages.map((page) => page.content)
      )
      const { exists, vectorHnswIndex } = await getHnswIndex(model, "all")
      const labels = vectorHnswIndex.addItems(embeddings, true)
      console.log("labels", labels)
      for (const [page, embedding, embeddingId] of zip(
        pages,
        embeddings,
        labels
      )) {
        if (page && embedding) {
          await dataSpace.addEmbedding({
            id: embeddingId!.toString(),
            embedding: JSON.stringify(embedding),
            model,
            raw_content: page.content,
            source_type: type,
            source: id,
          })
        }
      }
    }

    switch (type) {
      case "file":
        // pdf
        loader = new PDFLoader()
        const file = await this.dataSpace.getFileById(id)
        if (!file) {
          console.warn("file not found")
          return
        }
        if (file.is_vectorized) {
          console.warn("file is already vectorized")
          return
        }
        pages = await loader.load(file.path)
        await embedding(pages)
        await this.dataSpace.updateFileVectorized(id, true)
        break
      case "doc":
        loader = new DocLoader(this.dataSpace)
        pages = await loader.load(id)
        await embedding(pages)
        break
      case "table":
      default:
        throw new Error("unknown type")
    }
  }
}

export const useHnsw = () => {
  const { sqlite } = useSqlite()
  const emRef = useRef<EmbeddingManager | null>(null)

  useEffect(() => {
    if (sqlite) {
      emRef.current = new EmbeddingManager(sqlite)
    }
  }, [sqlite])
  // embedding
  async function createEmbedding(data: {
    id: string
    type: "doc" | "table" | "file"
    model: string
    provider: LLMBaseVendor
  }) {
    const { id, type, model, provider } = data
    return await emRef.current?.createEmbedding(id, type, model, provider)
  }

  async function queryEmbedding(data: {
    query: string
    model: string
    scope: string
    k?: number
    provider: LLMBaseVendor
  }): Promise<any[] | undefined> {
    const { query, model, scope, k, provider } = data
    return await emRef.current?.query(query, model, scope, k, provider)
  }

  useEffect(() => {
    ;(window as any).queryEmbedding = async (text: string) => {
      const res = await queryEmbedding({
        query: text,
        model: "bge-m3",
        scope: "all",
        provider: new BGEM3(),
      })
      return res
    }
    navigator.serviceWorker.onmessage = async (event) => {
      const { type, data } = event.data
      console.log("hnsw", type, data)
      if (type === "createEmbedding") {
        const res = await createEmbedding(data)
        event.ports[0].postMessage(res)
      } else if (type === "queryEmbedding") {
        const res = await queryEmbedding(data)
        event.ports[0].postMessage(res)
      }
    }
  }, [])

  return {
    createEmbedding,
    queryEmbedding,
  }
}
