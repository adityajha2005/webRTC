import { useState } from 'react'
import './App.css'
import { Routes, Route , BrowserRouter} from 'react-router-dom'
import {Sender} from './components/Sender'
import {Receiver} from './components/Receiver'
function App() {

  return (
   <BrowserRouter>
    <Routes>
      <Route path='/sender' element={<Sender/>}/>
      <Route path='/receiver' element={<Receiver/>}/>
    </Routes>
   </BrowserRouter>
  )
}

export default App
