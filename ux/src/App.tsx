import { useEffect, useState } from 'react'
import './App.css'

import GitDocsService from "../gitdocs.service";
import { NewProject } from './NewProject';
import { Link } from 'react-router-dom';

function App() {
  const [docs, setDocs] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    GitDocsService.getAllDocumenets().then((response) => {
      setDocs(response.data);
    })
  }, [showModal])

  return (
    <div className="container">
      <h1>Git Docs Demo</h1>
      <div className="card projectList">
        <h2>All Projects</h2>
        {
          docs.map(doc => (<Link key={doc} to={`/doc/${doc}`}>{doc}</Link>))
        }
      </div>
      <button onClick={() => setShowModal(true)}>New Project</button>
      {showModal && <NewProject closeModal={() => setShowModal(false)} />}
    </div >
  )
}

export default App
