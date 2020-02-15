import React from 'react'
import { render } from 'react-dom'
import App from './App'

render(<App />, document.getElementById('root'))

if (module.hot) {
  console.log('🔥')
  module.hot.accept()
}
