import { addDays, addHours, format as formatDate, isSameMinute, startOfDay } from 'date-fns'
import React, { ReactElement, ReactNode, TouchEvent, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Selection, SelectionSchemeType, SelectionType } from 'typings/declarations'
import colors from './colors'
import selectionSchemes from './selection-schemes'
import { Subtitle, Text } from './typography'

const formatHour = (hour: number): string => {
  const h = hour === 0 || hour === 12 || hour === 24 ? 12 : hour % 12
  const abb = hour < 12 || hour === 24 ? ' am' : ' pm'
  return `${h}${abb}`
}

const Wrapper = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  width: 100%;
  user-select: none;
`

const Grid = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  flex-grow: 1;
`

type GridCellProps = {
  margin: number
}
export const GridCell = styled.div`
  margin: ${(props: GridCellProps) => props.margin}px;
  touch-action: none;
`

type DateCellProps = {
  selected: boolean
  selectedColor: string
  hoveredColor: string
  unselectedColor: string
}
const DateCellInternal = styled.div`
  width: 100%;
  background-color: ${(props: DateCellProps) => (props.selected ? props.selectedColor : props.unselectedColor)};

  &:hover {
    background-color: ${(props: DateCellProps) => props.hoveredColor};
    cursor: pointer;
  }
`

const DateLabel = styled(Subtitle)`
  margin: 5px 0;
  @media (max-width: 699px) {
    font-size: 12px;
  }
`

const TimeLabelCell = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
  margin-right: 10px;
  align-items: center;
  top: 5px;
`

const TimeText = styled(Text)`
  margin: 0;
  position: relative;
  line-height: 30px;
  font-weight: 600;
  @media (max-width: 699px) {
    font-size: 12px;
  }
`

type RefSetter = (refSetter: HTMLElement) => void

type Props = {
  selection: Selection
  onChange: (newSelection: Selection) => void
  minTime?: number
  maxTime?: number
  numDays?: number
  selectionScheme?: SelectionSchemeType
  startDate?: Date
  dateFormat?: string
  margin?: number
  unselectedColor?: string
  selectedColor?: string
  hoveredColor?: string
  renderDateCell?: (date: Date, selected: boolean, refSetter: RefSetter) => ReactNode
}

type Dates = Date[][]

type SelectionSchemeHandlers = {
  [index: string]: (startDate: Date, endDate: Date, dates: Dates) => Selection
}

export const preventScroll = (e: TouchEvent<HTMLDivElement>) => {
  e.preventDefault()
}

type CellToDate = Map<HTMLElement, Date>

// In the case that a user is drag-selecting, we don't want to call this.props.onChange() until they have completed
// the drag-select. selectionDraft serves as a temporary copy during drag-selects.
export const ScheduleSelector = ({
  selection,
  onChange,
  minTime = 9,
  maxTime = 23,
  numDays = 7,
  selectionScheme = 'square',
  startDate,
  dateFormat = 'E M-d',
  margin = 3,
  unselectedColor = colors.paleBlue,
  selectedColor = colors.blue,
  hoveredColor = colors.lightBlue,
  renderDateCell,
}: Props) => {
  const startTime = startOfDay(startDate)
  const dates: Dates = []
  const cellToDate: CellToDate = new Map()

  for (let d = 0; d < numDays; d += 1) {
    const currentDay = []
    for (let h = minTime; h <= maxTime; h += 1) {
      currentDay.push(addHours(addDays(startTime, d), h))
    }
    dates.push(currentDay)
  }

  const gridRef = useRef()

  const [selectionDraft, setSelectionDraft] = useState(selection)
  const [selectionType, setSelectionType] = useState<SelectionType | null>(null)
  const [selectionStart, setSelectionStart] = useState<Date | null>(null)
  const [isTouchDragging, setIsTouchDragging] = useState(false)

  const selectionSchemeHandlers: SelectionSchemeHandlers = {
    linear: selectionSchemes.linear,
    square: selectionSchemes.square,
  }

  const endSelection = () => {
    onChange(selectionDraft)
    setSelectionType(null)
    setSelectionStart(null)
  }

  useEffect(() => {
    // We need to add the endSelection event listener to the document itself in order
    // to catch the cases where the users ends their mouse-click somewhere besides
    // the date cells (in which case none of the DateCell's onMouseUp handlers would fire)
    //
    // This isn't necessary for touch events since the `touchend` event fires on
    // the element where the touch/drag started so it's always caught.
    document.addEventListener('mouseup', endSelection)

    // Prevent page scrolling when user is dragging on the date cells
    cellToDate.forEach((value, dateCell) => {
      if (dateCell && dateCell.addEventListener) {
        dateCell.addEventListener('touchmove', preventScroll, { passive: false })
      }
    })

    return () => {
      document.removeEventListener('mouseup', endSelection)
      cellToDate.forEach((value, dateCell) => {
        if (dateCell && dateCell.removeEventListener) {
          dateCell.removeEventListener('touchmove', preventScroll)
        }
      })
    }
  }, [])

  useEffect(() => {
    setSelectionDraft(selectionDraft)
  }, [JSON.stringify(selectionDraft)])

  // Performs a lookup into this.cellToDate to retrieve the Date that corresponds to
  // the cell where this touch event is right now. Note that this method will only work
  // if the event is a `touchmove` event since it's the only one that has a `touches` list.
  const getTimeFromTouchEvent = (e: TouchEvent<HTMLDivElement>): Date | null => {
    const { touches } = e
    if (!touches || touches.length === 0) return null
    const { clientX, clientY } = touches[0]
    const targetElement = document.elementFromPoint(clientX, clientY)
    const cellTime = cellToDate.get(targetElement)
    return cellTime
  }

  // Given an ending Date, determines all the dates that should be selected in this draft
  const updateAvailabilityDraft = (selectionEnd: Date | null) => {
    if (selectionType === null || selectionStart === null) return

    let newSelection = []
    if (selectionStart && selectionEnd && selectionType) {
      newSelection = selectionSchemeHandlers[selectionScheme](selectionStart, selectionEnd, dates)
    }

    let nextDraft = [...selectionDraft]
    if (selectionType === 'add') {
      nextDraft = Array.from(new Set([...nextDraft, ...newSelection]))
    } else if (selectionType === 'remove') {
      nextDraft = nextDraft.filter(a => !newSelection.find(b => isSameMinute(a, b)))
    }

    setSelectionDraft(nextDraft)
  }

  // Isomorphic (mouse and touch) handler since starting a selection works the same way for both classes of user input
  const handleSelectionStartEvent = (newStartTime: Date) => {
    // Check if the startTime cell is selected/unselected to determine if this drag-select should
    // add values or remove values
    const timeSelected = selectionDraft.find(a => isSameMinute(a, newStartTime))
    setSelectionType(timeSelected ? 'remove' : 'add')
    setSelectionStart(newStartTime)
  }

  const handleMouseEnterEvent = (time: Date) => {
    // Need to update selection draft on mouseup as well in order to catch the cases
    // where the user just clicks on a single cell (because no mouseenter events fire
    // in this scenario)
    updateAvailabilityDraft(time)
  }

  const handleMouseUpEvent = (time: Date) => {
    updateAvailabilityDraft(time)
    // Don't call this.endSelection() here because the document mouseup handler will do it
  }

  const handleTouchMoveEvent = (event: TouchEvent<HTMLDivElement>) => {
    setIsTouchDragging(true)
    const cellTime = getTimeFromTouchEvent(event)
    if (cellTime) {
      updateAvailabilityDraft(cellTime)
    }
  }

  const handleTouchEndEvent = () => {
    if (isTouchDragging) {
      // Going down this branch means the user tapped but didn't drag -- which
      // means the availability draft hasn't yet been updated (since
      // handleTouchMoveEvent was never called) so we need to do it now
      updateAvailabilityDraft(null)
      endSelection()
    } else {
      endSelection()
    }
    setIsTouchDragging(false)
  }

  const renderTimeLabels = () => {
    const labels = [<DateLabel key={-1} />] // Ensures time labels start at correct location
    for (let t = minTime; t <= maxTime; t += 1) {
      labels.push(
        <TimeLabelCell key={t}>
          <TimeText>{formatHour(t)}</TimeText>
        </TimeLabelCell>,
      )
    }
    return <Column margin={margin}>{labels}</Column>
  }

  const renderDateCellHandler = (time: Date, selected: boolean): ReactNode => {
    const refSetter = (dateCell: HTMLElement) => {
      cellToDate.set(dateCell, time)
    }
    if (renderDateCell) {
      return renderDateCell(time, selected, refSetter)
    }
    return (
      <DateCellInternal
        selected={selected}
        innerRef={refSetter}
        selectedColor={selectedColor}
        unselectedColor={unselectedColor}
        hoveredColor={hoveredColor}
      />
    )
  }

  const renderDateCellWrapper = (time: Date): ReactElement => {
    const startHandler = () => {
      handleSelectionStartEvent(time)
    }

    const selected = Boolean(selectionDraft.find(a => isSameMinute(a, time)))

    return (
      <GridCell
        className='rgdp__grid-cell'
        role='presentation'
        margin={margin}
        key={time.toISOString()}
        // Mouse handlers
        onMouseDown={startHandler}
        onMouseEnter={() => {
          handleMouseEnterEvent(time)
        }}
        onMouseUp={() => {
          handleMouseUpEvent(time)
        }}
        // Touch handlers
        // Since touch events fire on the event where the touch-drag started, there's no point in passing
        // in the time parameter, instead these handlers will do their job using the default SyntheticEvent
        // parameters
        onTouchStart={startHandler}
        onTouchMove={handleTouchMoveEvent}
        onTouchEnd={handleTouchEndEvent}
      >
        {renderDateCellHandler(time, selected)}
      </GridCell>
    )
  }

  const renderDateColumn = (dayOfTimes: Array<Date>) => (
    <Column key={dayOfTimes[0]} margin={margin}>
      <GridCell margin={margin}>
        <DateLabel>
          {formatDate(dayOfTimes[0], dateFormat)
            .split(' ')
            .map(ele => (
              <div style={{ marginBottom: 5 }}>{ele}</div>
            ))}
        </DateLabel>
      </GridCell>
      {dayOfTimes.map(time => renderDateCellWrapper(time))}
    </Column>
  )

  return (
    <Wrapper>
      <Grid innerRef={gridRef}>
        {renderTimeLabels()}
        {dates.map(renderDateColumn)}
      </Grid>
    </Wrapper>
  )
}
