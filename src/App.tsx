import { hot } from "react-hot-loader"
import React, { useState } from "react"
import { createGlobalStyle } from "styled-components"
import { ScheduleSelector } from "./lib/ScheduleSelector"
import { Selection } from "./typings/declations"

const GlobalStyle = createGlobalStyle`
body {
    font-family: sans-serif;
  }

  * {
    box-sizing: border-box;
  }
`

const App = () => {
  const [selection, setSelection] = useState<Selection>([])
  const [startDate, setStartDate] = useState<Date>(new Date())

  const handleChange = (newSelection: Selection) => {
    setSelection(newSelection)
  }
  return (
    <>
      <GlobalStyle />
      <h1>Works!</h1>
      <ScheduleSelector
        minTime={8}
        maxTime={22}
        numDays={7}
        selection={selection}
        startDate={startDate}
        onChange={handleChange}
      />
    </>
  )
}

export default hot(module)(App)
