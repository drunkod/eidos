"use client"

import { Menu } from "lucide-react"

import { useAppRuntimeStore } from "@/lib/store/runtime-store"
import { cn } from "@/lib/utils"
import { useSqlite } from "@/hooks/use-sqlite"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Loading } from "@/components/loading"
import { SideBar } from "@/components/sidebar"

import { useLayoutInit } from "./hook"
import { Nav } from "./nav"

const MobileSideBar = () => {
  const { isSidebarOpen, setSidebarOpen } = useAppRuntimeStore()
  return (
    <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger className="block md:hidden">
        <Menu size={32} />
      </SheetTrigger>
      <SheetContent size="content" position="left">
        <SideBar className="p-2" />
      </SheetContent>
    </Sheet>
  )
}

export function DatabaseLayoutBase({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { sqlite } = useSqlite()
  const { isShareMode } = useAppRuntimeStore()

  // event listen should be in useLayoutInit, and just listen once
  useLayoutInit()
  if (!isShareMode && !sqlite) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loading />
      </div>
    )
  }
  // when chat is open  2:7:3
  // when chat is close 2:10
  return (
    <div
      className={cn(
        "relative  grid h-screen  grid-cols-9 md:grid-cols-12",
        className
      )}
    >
      <div className={cn("col-span-3 hidden h-full md:block xl:col-span-2")}>
        <SideBar />
      </div>
      <div
        className={cn(
          "flex h-full flex-col lg:border-l",
          "col-span-9 xl:col-span-10"
        )}
      >
        <div className="flex justify-between p-2 md:justify-end">
          <MobileSideBar />
          <Nav />
        </div>
        <div className="z-[1] flex h-[calc(100vh-4rem)] grow overflow-auto">
          <div className="grow">{children}</div>
        </div>
      </div>
    </div>
  )
}
