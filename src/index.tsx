import React, { useState } from "react"
import { render } from "react-dom"

const App = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <h1>Change</h1>
      <button onClick={() => setCount(prev => prev + 1)}>{count}</button>
    </div>
  )
}

render(<App />, document.getElementById("root"))
