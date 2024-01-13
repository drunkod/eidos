// import "@glideapps/glide-data-grid-cells"
import DatePicker from "./date-picker-cell"
import { FileCellRenderer } from "./file/file-cell"
import LinkCell from "./link-cell"
import MultiSelectCell from "./multi-select-cell"
import RatingCell from "./rating-cell"
import SelectCell from "./select-cell"

const cells = [
  RatingCell,
  // SparklineCell,
  // TagsCell,
  // UserProfileCell,
  SelectCell,
  MultiSelectCell,
  LinkCell,
  // ArticleCell,
  // SpinnerCell,
  // RangeCell,
  DatePicker,
  FileCellRenderer,
  // LinksCell,
  // ButtonCell,
]

export const customCells = cells
