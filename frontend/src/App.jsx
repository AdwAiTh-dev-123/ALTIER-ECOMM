import { useState } from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

import './App.css'

function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/' element={<h1>Welcome to Atelier Stores</h1>} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
