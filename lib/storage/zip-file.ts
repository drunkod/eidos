import JSZip from "jszip"

import {
  EidosFileSystemManager,
  efsManager,
  getDirHandle,
} from "./eidos-file-system"

export async function zipDirectory(
  dirPaths: string[],
  zip = new JSZip()
): Promise<JSZip> {
  const dirHandle = await getDirHandle(dirPaths)
  for await (let entry of dirHandle.values()) {
    if (entry.kind === "directory") {
      const dirZip = zip.folder(entry.name)
      if (dirZip) {
        await zipDirectory([...dirPaths, entry.name], dirZip)
      }
    }
    if (entry.kind === "file") {
      const file = await (entry as FileSystemFileHandle).getFile()
      const content = await file.arrayBuffer()
      zip.file(entry.name, content, { binary: true })
      continue
    }
  }
  return zip
}

export const zipFile2Blob = async (file: JSZip.JSZipObject) => {
  const content = await file.async("arraybuffer")
  const filename = file.name.split("/").slice(-1)[0]
  return new File([content], filename)
}

const isDbFilePaths = (paths: string[]) => {
  return (
    paths.length === 3 && paths[0] === "spaces" && paths[2] === "db.sqlite3"
  )
}

export async function getPackageJsonFromZipFile(file: File) {
  const zip = await JSZip.loadAsync(file)
  return getPackageJsonFromZip(zip)
}

export async function unZipFileToDir(file: File, rootPaths: string[]) {
  const zip = await JSZip.loadAsync(file)
  return importZipFileIntoDir(rootPaths, zip)
}

async function getPackageJsonFromZip(zip: JSZip) {
  const packageJson = zip.files["package.json"]
  if (!packageJson) {
    return null
  }
  const content = await packageJson.async("text")
  return JSON.parse(content)
}

export async function importZipFileIntoDir(rootPaths: string[], zip: JSZip) {
  for (let path in zip.files) {
    const entry = zip.files[path]
    console.log("import zip file", entry)
    if (entry.dir) {
      const paths = entry.name.split("/").filter((i) => i)
      const dirName = paths[paths.length - 1]
      const parentDir = paths.slice(0, -1)
      try {
        const dirParents = [...rootPaths, ...parentDir]
        await efsManager.addDir(dirParents, dirName)
      } catch (error) {
        console.warn("import zip file into dir", entry, dirName, error)
      }
    } else {
      const dirPaths = entry.name.split("/").slice(0, -1)
      const p = [...rootPaths, ...dirPaths]
      try {
        const file = await zipFile2Blob(entry)
        if (isDbFilePaths([...p, file.name])) {
          const opfsRoot = await navigator.storage.getDirectory()
          new EidosFileSystemManager(opfsRoot).addFile(p, file)
          continue
        }
        await efsManager.addFile(p, file)
      } catch (error) {
        console.warn("import zip file into dir", entry, p, error)
      }
    }
  }
}
