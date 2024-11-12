import { useEffect, useState } from 'react'
import './App.css'

import GitDocsService from "../gitdocs.service";
import { NewProject } from './NewProject';
import { Link } from 'react-router-dom';
import { generateTitle } from '../utils';

function App() {
  const [docs, setDocs] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false)

  const loadDocs = () => {
    GitDocsService.getAllDocumenets().then((response) => {
      setDocs(response.data);
    })
  };

  useEffect(() => {
    loadDocs();
  }, [showModal])

  return (
    <div className="container">
      <h1>Git Docs Demo</h1>
      <div className="card projectList">
        <h2>All Projects</h2>
        {
          docs.map(doc => (<Link key={doc} to={`/doc/${doc}`}>{generateTitle(doc, false)}</Link>))
        }
      </div>
      <button onClick={() => {
        setShowModal(true);
        loadDocs();
      }}>New Project</button>
      {showModal && <NewProject closeModal={() => setShowModal(false)} />}
    </div >
  )
}

export default App
