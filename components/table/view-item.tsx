import { useState } from "react"
import { IView } from "@/worker/meta_table/view"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "../ui/button"
import { ViewEditor } from "./view-editor"

interface IViewItemProps {
  view: IView
  isActive: boolean
  jump2View: (viewId: string) => void
  deleteView: () => void
  disabledDelete?: boolean
}
export const ViewItem = ({
  view,
  isActive,
  jump2View,
  deleteView,
  disabledDelete,
}: IViewItemProps) => {
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleOpen = () => {
    if (isActive) {
      setOpen(!open)
    }
  }

  const handleEdit = () => {
    setEditDialogOpen(true)
    setOpen(false)
  }

  return (
    <>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DropdownMenu onOpenChange={handleOpen} open={open}>
          <DropdownMenuTrigger>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              onClick={() => jump2View(view.id)}
              size="sm"
            >
              <span className="select-none">{view.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={handleEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem disabled={disabledDelete}>
              <DialogTrigger>Delete</DialogTrigger>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure delete this view?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              view
            </DialogDescription>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteView}>
                Delete
              </Button>
            </DialogFooter>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      {editDialogOpen && (
        <ViewEditor setEditDialogOpen={setEditDialogOpen} view={view} />
      )}
    </>
  )
}
