import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.tsx'
import { BrowserRouter, Link } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Doc from './Doc.tsx';
import AskAsish from './AskAsish.tsx';
import Header from './Header.tsx';
import SearchResults from './SearchResults.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="doc/:docName/*" element={<Doc />} />
          <Route path="search" element={<SearchResults />} />
        </Routes>
        <AskAsish />
      </BrowserRouter>
    </>
  </StrictMode>
)
