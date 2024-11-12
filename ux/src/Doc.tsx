import { useEffect, useState } from 'react'
import './App.css'
import GitDocsService from "../gitdocs.service";
import { useLocation, useParams } from 'react-router';
import styles from "./doc.module.css";
import { Link } from 'react-router-dom';
import { FaFolder, FaFile, FaFileImage } from "react-icons/fa";
import TocItem from '../tocItem';
import Markdown from 'https://esm.sh/react-markdown@9'
import {
  getRouteDiff,
  isRouteToMd,
  getRouteExtension,
  isExternalLink,
  customEncodeURIComponent,
  encodeRoute
} from './routeHelper';
import { gitdochost } from '../http-common';
import { NewVersion } from './NewVersion';
import { AddFile } from './AddFile';
import { generateTitle } from '../utils';

function Doc(props: any) {
  const { docName, '*': filePath } = useParams();
  const [toc, setToc] = useState<TocItem[]>([]);
  const [version, setVersion] = useState<string>("master");
  const [versions, setVersions] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState<string>("Click on a document to the left to view its contents");
  const location = useLocation();
  const [showVersion, setShowVersion] = useState<boolean>(false);
  const [showAddFile, setShowAddFile] = useState<boolean>(false);

  const loadVersions = () => {
    if (docName) {
      GitDocsService.getDocVersions(docName).then((response) => {
        setVersions(response.data);
      });
    }
  };

  useEffect(() => {
    loadVersions();
  }, [docName]);

  const loadToc = () => {
    if (docName && version) {
      GitDocsService.getDocToc(docName, "", version).then((response) => {
        setToc(response.data);
      });
    }
  };

  useEffect(() => {
    loadToc();
  }, [docName, version]);

  const loadChildren = (tocItem: TocItem) => {
    if (docName) {
      GitDocsService.getDocToc(docName, tocItem.name, version).then((response) => {
        tocItem.children = response.data;
        setToc([...toc]);
      });
    }
  }

  useEffect(() => {
    if (filePath && docName && version) {
      console.log('loading content', docName, filePath, version);

      GitDocsService.getContent(docName, filePath, version).then((response) => {
        setMarkdown(response.data);
      }).catch((e) => { setMarkdown("Error loading document, may not exist in branch."); });

    } else {
      setMarkdown("Click on a document to the left to view its contents");
    }
  }, [filePath, version]);

  const renderChildren = (tocItems: TocItem[]) => {
    return tocItems.map((item: any) => {
      switch (item.type) {
        case "doc":
          return <div key={item.id}><FaFile /><Link to={`/doc/${docName}/${item.file}`}>{item.title}</Link></div>
        case "folder":
          if (item.children) {
            return (<div>
              <div key={item.id}><FaFolder /><span onClick={() => { loadChildren(item) }}>{item.title}</span></div>
              <div className={styles.tocChildren}>
                {renderChildren(item.children)}
              </div>
            </div>)
          } else {
            return <div key={item.id}><FaFolder /><span onClick={() => { loadChildren(item) }}>{item.title}</span></div>
          }
        default:
          return <div key={item.id}><FaFileImage />{item.title}</div>
      }

    })
  }

  const getContentUrl = (basePath: string = "", contentPath: string, isResource: boolean) => {
    // do nothing with fqdn urls (do we have a list of protocols?)
    if (isExternalLink(contentPath)) {
      return contentPath;
    }
    //https://localhost:7089/content/test/screen.png?DocVersion=master

    if (contentPath.startsWith("/")) {
      return `${gitdochost}/content/${docName}${contentPath}?DocVersion=${version}`;
    }

    basePath = basePath.split("/").slice(0, -1).join("/");
    console.log(basePath, contentPath);

    const resolvedPath = new URL(contentPath, `${gitdochost}/content/${docName}/${basePath}/`).pathname;
    console.log(resolvedPath);
    const contentUrl = `${gitdochost}${resolvedPath}?DocVersion=${version}`;
    return contentUrl;
  }

  const publishVersion = () => {
    if (docName && version && version !== "master") {
      GitDocsService.publishVersion(docName, version).then(() => {
        loadVersions();
        setVersion("master");
      });
    }
  }

  return (
    <><div className={styles.doctitle}>{generateTitle(docName, false)}</div>
      <div className={styles.container}>
        <div className={styles.tocContainer}>
          <Link to="/">Back to Docs</Link>
          <select value={version} defaultValue={version} name="version" id="version" onChange={(e) => setVersion(e.target.value)} className={styles.versionList}>
            {
              versions.map((v) => {
                return <option key={v} value={v}>{generateTitle(v, false)}</option>
              })
            }
          </select>
          <div className={styles.versionControls}>
            <button onClick={() => setShowVersion(true)}>New Version</button>
            {version != "master" && <button onClick={() => publishVersion()}>Publish</button>}
          </div>
          {renderChildren(toc)}
          {version != "master" && <button onClick={() => setShowAddFile(true)}>Add Document</button>}
          <input
            id="fileInput"
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                GitDocsService.addFile(docName, version, e.target.files[0])
              }
            }}
          />
          {version != "master" && <button onClick={() => document.getElementById("fileInput").click()}>Upload File</button>}
        </div>
        <div className={styles.contentContainer}>
          <Markdown
            components={{
              a: (props) => {
                if (isRouteToMd(props.href)) {
                  return (<Link to={customEncodeURIComponent(
                    getContentUrl(filePath, props.href, false))}>{props?.children}</Link>);
                } else {
                  const routeExt = getRouteExtension(props.href);

                  // achor to folder, assume index.md
                  if (!routeExt && !isExternalLink(props.href)) {
                    const splitRoute = props.href?.split('/') ?? ['/'];
                    splitRoute.push('index.md');

                    return (<Link to={encodeRoute(
                      getContentUrl(filePath, splitRoute.join('/'), false))}>{props?.children}</Link>);
                  }

                  // anchor to external resource
                  return (<a target="_blank" rel="noopener noreferrer"
                    href={getContentUrl(filePath, props.href, true)}>{props?.children}</a>);
                }
              },
              img: (props) => (<img alt={`${props.alt}`} src={getContentUrl(filePath, props.src, true)} />)
            }}
          >{markdown}</Markdown>
        </div>
        {showVersion && <NewVersion docName={docName} closeModal={(newver) => {
          setShowVersion(false);
          loadVersions();
          setVersion(newver);
        }} />}
        {showAddFile && <AddFile docName={docName} docVersion={version} closeModal={() => {
          setShowAddFile(false);
          loadToc();
        }} />}
      </div>

    </>
  )
}

export default Doc;