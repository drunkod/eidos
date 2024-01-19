import { useRef, type FC } from "react"
import type { Identifier, XYCoord } from "dnd-core"
import { EyeIcon, EyeOffIcon, GripVerticalIcon } from "lucide-react"
import { useDrag, useDrop } from "react-dnd"

import { cn } from "@/lib/utils"

import "./index.css"

export const ItemTypes = {
  CARD: "card",
}

export interface CardProps {
  id: any
  text: string
  index: number
  isHidden: boolean
  moveCard: (dragIndex: number, hoverIndex: number) => void
  onToggleHidden: (id: any) => void
}

interface DragItem {
  index: number
  id: string
  type: string
}

export const FieldItemCard: FC<CardProps> = ({
  id,
  text,
  index,
  isHidden,
  moveCard,
  onToggleHidden,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      return { id, index }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))
  const handleToggleHidden = (id: string) => {
    if (id === "title") return
    onToggleHidden(id)
  }

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={cn("mb-2 flex cursor-pointer gap-2 p-2 hover:bg-secondary", {
        "dragging opacity-0": isDragging,
        "opacity-100": !isDragging,
      })}
    >
      <GripVerticalIcon className=" opacity-60" />
      <div className="flex w-full justify-between pr-2">
        {text}
        <span
          onClick={() => handleToggleHidden(id)}
          className={cn({
            disabled: id === "title",
          })}
        >
          {isHidden ? <EyeOffIcon /> : <EyeIcon />}
        </span>
      </div>
    </div>
  )
}
