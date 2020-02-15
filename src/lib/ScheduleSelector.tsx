import React from "react"
import { Selection, SelectionSchemeType } from "../typings/declations"

const formatHour = (hour: number): string => {
  const h = hour === 0 || hour === 12 || hour === 24 ? 12 : hour % 12
  const abb = hour < 12 || hour === 24 ? "am" : "pm"
  return `${h}${abb}`
}

type Props = {
  minTime: number
  maxTime: number
  numDays: number
  selection: Selection
  startDate: Date
  dateFormat?: string
  margin?: number
  unselectedColor?: string
  selectedColor?: string
  hoveredColor?: string
  selectionScheme?: SelectionSchemeType
  onChange: (newSelection: Selection) => void
}
export const ScheduleSelector = (props: Props) => {
  return <div>Done</div>
}
