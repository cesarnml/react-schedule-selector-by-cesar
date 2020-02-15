import { hot } from "react-hot-loader"
import React, { useState } from "react"

const App = () => {
  const [count, setCount] = useState(0)
  console.log("hmm")
  return (
    <div>
      <h1>Nah</h1>
      <h2>Finally</h2>
      <button type='button' onClick={() => setCount(prev => prev + 1)}>
        {count}
      </button>
    </div>
  )
}

export default hot(module)(App)
