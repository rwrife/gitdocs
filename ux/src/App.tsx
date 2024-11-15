import { useEffect, useState } from 'react'
import './css/app.css'

import GitDocsService from "../gitdocs.service";
import { NewProject } from './NewProject';
import { Link, useNavigate } from 'react-router-dom';
import { generateTitle } from '../utils';
import { IoAddSharp } from "react-icons/io5";
import { GitRepo } from './types';
import { VscAzureDevops } from 'react-icons/vsc';
import { ImportRepo } from './ImportRepo';

function App() {
  const [docs, setDocs] = useState<GitRepo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = useNavigate();

  const loadDocs = () => {
    GitDocsService.getAllDocumenets().then((response) => {
      setDocs(response.data);
    })
  };

  useEffect(() => {
    loadDocs();
  }, [showModal])

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  // Function to generate a consistent dark color based on hash
  const generateColorFromHash = (text) => {
    const hash = hashString(text);

    // Create RGB values that are constrained to darker shades
    const red = Math.abs((hash & 0xFF0000) >> 16) % 200;  // Limit max to 160
    const green = Math.abs((hash & 0x00FF00) >> 8) % 200;
    const blue = Math.abs(hash & 0x0000FF) % 200;

    // Scale the RGB values to ensure a darker shade
    const darkRed = Math.floor(red * 0.7);
    const darkGreen = Math.floor(green * 0.7);
    const darkBlue = Math.floor(blue * 0.7);

    return [`rgba(${darkRed}, ${darkGreen}, ${darkBlue}, 0.6)`, `rgb(${darkRed}, ${darkGreen}, ${darkBlue})`];
  };

  // Store unique colors for each unique text value
  const colors = {};
  const getTagColor = (text: string) => {
    if (!colors[text]) {
      colors[text] = generateColorFromHash(text);
    }
    return colors[text];
  };

  return (
    <>
      <div className="container">
        {
          docs.map(doc => (
            <div className="doc-card" onClick={() => {
              navigate(`/doc/${doc.name}`);
            }}>
              <div className="doc-card-title"><Link key={doc.name} to={`/doc/${doc.name}`}>{generateTitle(doc.title, false)}</Link></div>
              <div className="doc-card-desc">
                {doc.description}
              </div>
              <div className="doc-card-tags">
                {doc.tags && doc.tags.trim().split(',').map(tag => (
                  <div className="tag"
                    style={{
                      backgroundColor: getTagColor(tag)[0],
                      border: `1px solid ${getTagColor(tag)[1]}`,
                      padding: '10px 15px',
                      borderRadius: '5px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}
                  >{generateTitle(tag, false)}</div>
                ))}
              </div>
            </div>
          ))
        }
        <button onClick={() => {
          setShowModal(true);
          loadDocs();
        }} className="addproject-button"><IoAddSharp />New Project</button>
        <button onClick={() => {
          setShowImportModal(true);
          loadDocs();
        }} className='importdevops-button'><VscAzureDevops />Import Repo</button>
      </div >
      {showModal && <NewProject closeModal={() => setShowModal(false)} />}
      {showImportModal && <ImportRepo closeModal={() => setShowImportModal(false)} />}
    </>
  )
}

export default App
