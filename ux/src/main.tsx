import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Link } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Doc from './Doc.tsx';
import { DiGit } from "react-icons/di";
import AskAsish from './AskAsish.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <div className="header">
        <DiGit /><div><a href="/">Git Docs Demo</a></div>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="doc/:docName/*" element={<Doc />} />
        </Routes>
      </BrowserRouter>

      <AskAsish />
    </>
  </StrictMode>
)
