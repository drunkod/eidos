import { MouseEventHandler, useCallback } from "react"
import { $patchStyleText } from "@lexical/selection"
import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

// https://coolors.co/ffadad-ffd6a5-fdffb6-caffbf-9bf6ff-a0c4ff-bdb2ff-ffc6ff-fffffc
// --melon: #ffadadff;
// --sunset: #ffd6a5ff;
// --cream: #fdffb6ff;
// --tea-green: #caffbfff;
// --electric-blue: #9bf6ffff;
// --jordy-blue: #a0c4ffff;
// --periwinkle: #bdb2ffff;
// --mauve: #ffc6ffff;
// --baby-powder: #fffffcff;

// font color

const fgColors = [
  { name: "default", value: "inherit" },
  { name: "light-red", value: "#ff8383ff" },
  { name: "earth-yellow", value: "#ffc379ff" },
  { name: "mindaro", value: "#c4c76cff" },
  { name: "screamin-green", value: "#47873a" },
  { name: "electric-blue", value: "#70f3ffff" },
  { name: "ruddy-blue", value: "#75aaffff" },
  { name: "tropical-indigo", value: "#9987ffff" },
  { name: "violet-web-color", value: "#ff9affff" },
]

const bgColors = [
  { name: "default", value: "inherit" },
  { name: "melon", value: "#ffadadff" },
  { name: "sunset", value: "#ffd6a5ff" },
  { name: "cream", value: "#fdffb6ff" },
  { name: "tea-green", value: "#caffbfff" },
  { name: "electric-blue", value: "#9bf6ffff" },
  { name: "jordy-blue", value: "#a0c4ffff" },
  { name: "periwinkle", value: "#bdb2ffff" },
  { name: "mauve", value: "#ffc6ffff" },
]

export const ColorPicker = ({
  activeEditor,
}: {
  activeEditor: LexicalEditor
}) => {
  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      activeEditor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles)
        }
      })
    },
    [activeEditor]
  )

  const onFontColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ color: value })
    },
    [applyStyleText]
  )

  const onBgColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ "background-color": value })
    },
    [applyStyleText]
  )

  const handleBgColorSelect: MouseEventHandler<HTMLDivElement> = (e) => {
    onBgColorSelect(e.currentTarget.style.backgroundColor)
    e.stopPropagation()
    e.preventDefault()
  }

  const handleFontColorSelect: MouseEventHandler<HTMLDivElement> = (e) => {
    onFontColorSelect(e.currentTarget.dataset.color!)
    e.stopPropagation()
    e.preventDefault()
  }

  const { theme } = useTheme()
  return (
    <div className="w-full p-2">
      <h2>FontColor</h2>
      <div className="flex gap-1 p-2">
        {fgColors.map(({ value: color }, index) => {
          return (
            <div
              onMouseDownCapture={handleFontColorSelect}
              data-color={color}
              style={
                index === 0
                  ? {
                      backgroundColor: theme === "light" ? "black" : "white",
                    }
                  : { backgroundColor: color }
              }
              className={cn(
                "h-[32px] w-[32px] rounded-[32px]",
                index === 0 &&
                  "border border-black bg-black dark:border-white dark:bg-white"
              )}
            ></div>
          )
        })}
      </div>
      <h2>BackgroundColor</h2>
      <div className="flex gap-1 p-2">
        {bgColors.map(({ value: color }, index) => {
          return (
            <div
              onMouseDownCapture={handleBgColorSelect}
              style={{ backgroundColor: color }}
              className={cn(
                "h-[32px] w-[32px] rounded-[32px]",
                index === 0 && "border border-black dark:border-white"
              )}
            ></div>
          )
        })}
      </div>
    </div>
  )
}
