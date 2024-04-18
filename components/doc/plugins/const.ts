import {
  CHECK_LIST,
  CODE,
  HEADING,
  HIGHLIGHT,
  INLINE_CODE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  TRANSFORMERS,
} from "@lexical/markdown"

import { IMAGE } from "@/components/doc/nodes/ImageNode/ImageNode"
import { SQL_NODE_TRANSFORMER } from "@/components/doc/nodes/SQL"

import { BOOKMARK } from "../nodes/BookmarkNode"
import { HR } from "./MarkdownTransformers"

export const allTransformers = [
  CHECK_LIST,
  CODE,
  HEADING,
  HIGHLIGHT,
  INLINE_CODE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  HR,
  IMAGE,
  BOOKMARK,
  SQL_NODE_TRANSFORMER,
  ...TRANSFORMERS,
]

export const fgColors = [
  { name: "default", value: "inherit" },
  { name: "red", value: "#ff8383ff" },
  { name: "orange", value: "#ffc379ff" },
  { name: "yellow", value: "#c4c76cff" },
  { name: "green", value: "#47873a" },
  { name: "cyan", value: "#70f3ffff" },
  { name: "blue", value: "#75aaffff" },
  { name: "indigo", value: "#9987ffff" },
  { name: "pink", value: "#ff9affff" },
]

export const bgColors = [
  { name: "default", value: "inherit" },
  { name: "red", value: "#ffadadff" },
  { name: "orange", value: "#ffd6a5ff" },
  { name: "yellow", value: "#fdffb6ff" },
  { name: "green", value: "#caffbfff" },
  { name: "cyan", value: "#9bf6ffff" },
  { name: "blue", value: "#a0c4ffff" },
  { name: "indigo", value: "#bdb2ffff" },
  { name: "pink", value: "#ffc6ffff" },
]
