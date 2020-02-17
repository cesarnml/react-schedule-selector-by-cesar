import { hot } from 'react-hot-loader'
import React, { useState, Ref } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { ScheduleSelector } from 'lib/ScheduleSelector'
import { Selection } from 'typings/declarations'
import moment from 'moment'

const GlobalStyle = createGlobalStyle`
body {
    font-family: sans-serif;
  }

  * {
    box-sizing: border-box;
  }
`
const DataCell = styled.div`
  background-color: ${({ selected }: { selected: boolean }) => (selected ? 'rgba(162, 198, 248, 1)' : '#dbedff')};
  margin: ${({ selected }) => (selected ? '0px 3px' : '3px')};
  padding: ${({ selected }) => (selected ? '3px 0px' : '0px')};
  line-height: 30px;
  text-align: center;
  &:hover {
    background-color: rgba(89, 154, 242, 1);
    cursor: pointer;
  }
`

const daysFromMonday = moment().weekday() - 6

const App = () => {
  const [selection, setSelection] = useState<Selection>([])
  const [startDate, setStartDate] = useState<Date>(new Date(moment().add(daysFromMonday, 'd')))

  const handleChange = (newSelection: Selection) => {
    setSelection(newSelection)
  }

  // This doesn't work; Bug with ScheduleSelector, I think
  const handlePrevious = () => {
    setStartDate(prev => new Date(moment(prev).add(-7, 'd')))
  }

  // This doesn't work; Bug with ScheduleSelector, I think
  const handleNext = () => {
    setStartDate(prev => new Date(moment(prev).add(7, 'd')))
  }

  return (
    <>
      <GlobalStyle />
      <button type='button' onClick={handlePrevious}>
        Previous Week
      </button>
      <button type='button' onClick={handleNext}>
        Next Week
      </button>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <ScheduleSelector
          minTime={8}
          maxTime={22}
          numDays={7}
          selection={selection}
          startDate={startDate}
          onChange={handleChange}
          margin={0}
          renderDateCell={(time: Date, selected: boolean, refSetter: Ref<HTMLDivElement>) => {
            return (
              <DataCell ref={refSetter} selected={selected}>
                &nbsp;
              </DataCell>
            )
          }}
        />
      </div>
    </>
  )
}

export default hot(module)(App)
