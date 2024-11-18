import { useEffect, useState } from 'react'
import './css/app.css'

import GitDocsService from "../gitdocs.service";
import { NewProject } from './NewProject';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { generateTitle } from '../utils';
import { IoAddSharp } from "react-icons/io5";
import { GitRepo } from './types';
import { VscAzureDevops } from 'react-icons/vsc';
import { ImportRepo } from './ImportRepo';
import { FaFolder } from 'react-icons/fa';

import * as FaIcons from 'react-icons/fa';
import * as DiIcons from 'react-icons/di';
import * as SiIcons from 'react-icons/si';

function App() {
  const [docs, setDocs] = useState<GitRepo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const folder = new URLSearchParams(location.search).get('folder') ?? "";
  const [folders, setFolders] = useState<string[]>([]);

  const iconLibraries = {
    Fa: FaIcons,
    Di: DiIcons,
    Si: SiIcons,
  };

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const FolderIconRenderer = ({ iconName }) => {

    for (const library in iconLibraries) {
      const IconComponent = iconLibraries[library]?.[library + capitalizeFirstLetter(iconName).replace(/\s/g, "")] ||
        iconLibraries[library]?.[library + "Microsoft" + iconName];

      if (IconComponent) {
        return <IconComponent />;
      }
    }
    return <FaFolder />;
  };

  const loadDocs = () => {
    GitDocsService.getAllDocumenets().then((response) => {
      const docs = response.data;
      setDocs(docs.filter(doc => doc.folder == folder));

      const childFolders = Array.from(new Set(docs.filter(doc => doc.folder != folder)
        .map(doc => doc.folder)
        .filter(f => f.startsWith(folder))
        .map(f => {
          let result = f.slice(folder.length);

          if (result.startsWith("/")) {
            result = result.slice(1);
          }
          return result.split("/")[0];
        })));
      setFolders(childFolders)
    })
  };

  useEffect(() => {
    const t = setInterval(() => {
      loadDocs();
    }, 5000);
    loadDocs();
    return () => clearInterval(t);
  }, [showModal, showImportModal, folder])

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
    const red = Math.abs((hash & 0xFF0000) >> 16) % 250;  // Limit max to 160
    const green = Math.abs((hash & 0x00FF00) >> 8) % 200;
    const blue = Math.abs(hash & 0x0000FF) % 200;

    // Scale the RGB values to ensure a darker shade
    const darkRed = Math.floor(red * 0.6);
    const darkGreen = Math.floor(green * 0.8);
    const darkBlue = Math.floor(blue * 0.6);

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
          folders.map(f => (
            <button className='folder-button' onClick={() => {
              navigate(`/?folder=${folder ? folder + '/' + f : f}`);
            }}><FolderIconRenderer iconName={f} />{generateTitle(f, false)}</button>
          ))
        }
        {
          docs.map(doc => (
            <div className="doc-card" onClick={() => {
              navigate(`/doc/${doc.name}`);
            }}>
              <div className="doc-card-title"><Link key={doc.name} to={`/doc/${doc.name}`}>{generateTitle(doc.title || doc.name, false)}</Link></div>
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
        }} className="addproject-button"><IoAddSharp />New Project</button>
        <button onClick={() => {
          setShowImportModal(true);
        }} className='importdevops-button'><VscAzureDevops />Import Repo</button>
      </div >
      {showModal && <NewProject closeModal={() => setShowModal(false)} />}
      {showImportModal && <ImportRepo closeModal={() => setShowImportModal(false)} />}
    </>
  )
}

export default App
