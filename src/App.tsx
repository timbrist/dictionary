import { useEffect, useState } from 'react'


import './App.css'

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, type User } from 'firebase/auth';
import {auth} from './firebase';

import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';

function App() {

  const [user, setUser] = useState<User |null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect( ()=>{
    const unsub = onAuthStateChanged(auth, (u)=>{
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  if(!ready)  return <div> Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ <Navigate to={user ? "/home": "/login"} replace/>} />
        <Route path="/login" element={<LoginPage user={user}/> } />

        <Route path="/home" element={ user? <HomePage user={user}/> : <Navigate to="/login" replace />} />

        <Route path="*" element={ <Navigate to="/" replace /> } />

      </Routes>
    
    </BrowserRouter>
  )
}

export default App
