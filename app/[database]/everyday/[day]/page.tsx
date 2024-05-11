import { useState } from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { useNavigate, useParams } from "react-router-dom"

import { getLocalDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Editor } from "@/components/doc/editor"

import { useDays } from "../hooks"

export default function EverydayPage() {
  const [open, setOpen] = useState(false)
  const { day, database } = useParams()
  const [month, setMonth] = useState<Date>(new Date(day as string))
  const router = useNavigate()
  const { days } = useDays()
  const handleDayClick = (date: Date, closePopover = false) => {
    const day = getLocalDate(date)
    setMonth(date)
    router(`/${database}/everyday/${day}`)
    closePopover && setOpen(false)
  }

  return (
    <div className="prose mx-auto w-full p-4 pt-0 lg:prose-xl xl:prose-2xl">
      <Editor
        isEditable
        title={day}
        showTitle
        namespace="eidos-notes"
        docId={day}
        titleStyle={{ maxWidth: "10ch" }}
        afterTitle={
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
              <CalendarIcon className="h-5 w-5 " />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                defaultMonth={new Date(day as string)}
                modifiers={{
                  days: days,
                }}
                month={month}
                onMonthChange={setMonth}
                initialFocus
                modifiersStyles={{ days: { border: "1px solid currentColor" } }}
                mode="single"
                showOutsideDays
                fixedWeeks
                selected={new Date(day as string)}
                onDayClick={(date) => handleDayClick(date, true)}
                footer={
                  <div className="mt-4 flex justify-between gap-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        const date = new Date(day as string)
                        date.setDate(date.getDate() - 1)
                        handleDayClick(date)
                      }}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const date = new Date()
                        handleDayClick(date)
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        const date = new Date(day as string)
                        date.setDate(date.getDate() + 1)
                        handleDayClick(date)
                      }}
                    >
                      Next
                    </Button>
                  </div>
                }
              />
            </PopoverContent>
          </Popover>
        }
      />
    </div>
  )
}
