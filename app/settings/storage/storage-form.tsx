"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { get } from "lodash"
import { Check, ChevronsUpDown } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import {
  EidosFileSystemManager,
  FileSystemType,
  getFsRootHandle,
} from "@/lib/storage/eidos-file-system"
import { cn } from "@/lib/utils"
import { useIndexedDB } from "@/hooks/use-indexed-db"
import { useSqlite } from "@/hooks/use-sqlite"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/react-hook-form/form"

const fsTypes = [
  { label: "OPFS", value: FileSystemType.OPFS },
  { label: "Native File System", value: FileSystemType.NFS },
] as const

const storageFormSchema = z.object({
  fsType: z.enum([FileSystemType.OPFS, FileSystemType.NFS]),
  localPath: z.string().optional(),
  autoBackupDbBeforeQuit: z.boolean().optional(),
})

type StorageFormValues = z.infer<typeof storageFormSchema>

export function StorageForm() {
  const [localPath, setLocalPath] = useIndexedDB("kv", "localPath", null)
  const [fsType, setFsType] = useIndexedDB("kv", "fs", FileSystemType.OPFS)
  const [autoBackupDbBeforeQuit, setAutoBackupDbBeforeQuit] = useIndexedDB(
    "kv",
    "autoBackupDbBeforeQuit",
    false
  )
  const [isGranted, setIsGranted] = useState(false)
  const { sqlite } = useSqlite()

  const form = useForm<StorageFormValues>({
    resolver: zodResolver(storageFormSchema),
  })

  useEffect(() => {
    if (localPath) {
      const checkPermission = async () => {
        const res = await localPath.requestPermission({
          mode: "readwrite",
        })
        setIsGranted(res === "granted")
      }
      checkPermission()
    }
  }, [localPath])

  useEffect(() => {
    form.setValue("fsType", fsType)
  }, [form, fsType])

  useEffect(() => {
    form.setValue("localPath", localPath?.name)
  }, [form, localPath])

  useEffect(() => {
    form.setValue("autoBackupDbBeforeQuit", autoBackupDbBeforeQuit)
  }, [form, autoBackupDbBeforeQuit])

  const handleSelectLocalPath = async () => {
    const dirHandle = await (window as any).showDirectoryPicker()
    // store this dirHandle to indexedDB
    setLocalPath(dirHandle as FileSystemDirectoryHandle)
    if (dirHandle) {
      const res = await dirHandle.requestPermission({
        mode: "readwrite",
      })
    }
  }

  const handleAutoBackupChange = (checked: boolean) => {
    setAutoBackupDbBeforeQuit(checked)
  }

  async function onSubmit() {
    const data = form.getValues()

    if (data.fsType === FileSystemType.NFS) {
      if (!localPath) {
        toast({
          title: "Local path not selected",
          description: "You need to select a local path to store your files.",
        })
        return
      }
      if (!isGranted) {
        toast({
          title: "Permission denied",
          description: "You need to grant permission to access the directory.",
        })
        return
      }
    }
    const sourceFs = fsType
    const targetFs = data.fsType
    sqlite?.transformFileSystem(sourceFs, targetFs)
    setFsType(data.fsType)
    setAutoBackupDbBeforeQuit(data.autoBackupDbBeforeQuit)
    toast({
      title: "Settings updated",
    })
  }

  // get current fsType
  const currentFsType = form.getValues("fsType")

  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="fsType"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>File System</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[200px] justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? fsTypes.find((fsType) => fsType.value === field.value)
                            ?.label
                        : "Select File System"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search type..." />
                    <CommandEmpty>No type found.</CommandEmpty>
                    <CommandGroup>
                      {fsTypes.map((type) => (
                        <CommandItem
                          value={type.value}
                          key={type.value}
                          onSelect={(value: any) => {
                            form.setValue("fsType", value as FileSystemType)
                            form.trigger("fsType")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              type.value === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {type.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                which file system to store your files. <br /> OPFS stores files
                in the browser's storage, while Native File System stores files
                in a local directory on your device.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {currentFsType === FileSystemType.NFS && (
          <>
            <FormField
              control={form.control}
              name="localPath"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Local Path</FormLabel>
                  <div className="flex gap-1">
                    <Input
                      autoComplete="off"
                      type="text"
                      disabled
                      value={localPath?.name}
                    />{" "}
                    <Button type="button" onClick={handleSelectLocalPath}>
                      Select
                    </Button>
                  </div>
                  <FormDescription>
                    the local path where your files will be stored.
                    {isGranted ? (
                      <span className="text-green-500">
                        {" "}
                        Permission granted.
                      </span>
                    ) : (
                      <span className="text-red-500"> Permission denied.</span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="autoBackupDbBeforeQuit"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Auto Backup Database</FormLabel>
                  <div className="flex flex-col gap-1">
                    <Switch
                      checked={autoBackupDbBeforeQuit}
                      onCheckedChange={handleAutoBackupChange}
                      className="form-checkbox"
                    />
                    <FormDescription>
                      backup the database before you quit the app.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <Button type="button" className="mt-4" onClick={() => onSubmit()}>
          Update
        </Button>
      </form>
    </Form>
  )
}
