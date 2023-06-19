import { GridCellKind } from "@glideapps/glide-data-grid"

import { DatePickerCell } from "@/components/cells/date-picker-cell"

import { BaseField } from "./base"

type DateProperty = {}

type DateCell = DatePickerCell

export class DateField extends BaseField<DateCell, DateProperty, string> {
  static type = "date"

  getCellContent(rawData: string | undefined): DateCell {
    return {
      kind: GridCellKind.Custom,
      data: {
        kind: "date-picker-cell",
        date: rawData ? new Date(rawData) : undefined,
        displayDate: rawData ? new Date(rawData).toLocaleString() : "",
        format: "date",
      },
      copyData: rawData ?? "",
      allowOverlay: true,
    }
  }

  cellData2RawData(cell: DateCell) {
    return cell.data.displayDate
  }
}
