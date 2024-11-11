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

function Doc(props: any) {
  const { docName, '*': filePath } = useParams();
  const [toc, setToc] = useState<TocItem[]>([]);
  const [version, setVersion] = useState<string>("master");
  const [versions, setVersions] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState<string>("Click on a document to the left to view its contents");
  const location = useLocation();


  useEffect(() => {
    if (docName) {
      GitDocsService.getDocVersions(docName).then((response) => {
        setVersions(response.data);
      });
    }
  }, [docName]);

  useEffect(() => {
    if (docName && version) {
      GitDocsService.getDocToc(docName, "", version).then((response) => {
        console.log(response.data);
        setToc(response.data);
      });
    }
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
    if (filePath && docName) {
      try {
        GitDocsService.getContent(docName, filePath, version).then((response) => {
          setMarkdown(response.data);
        });
      } catch (e) {
        setMarkdown("Error loading document");
      }
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



  const getContentUrl = (contentUrl: string, isResource: boolean) => {
    // do nothing with fqdn urls (do we have a list of protocols?)
    if (isExternalLink(contentUrl)) {
      return contentUrl;
    }
    //https://localhost:7089/content/test/screen.png?DocVersion=master
    console.log(contentUrl, location);

    if (filePath) {
      const localDocUrl = getRouteDiff(filePath, location.pathname);
      console.log(localDocUrl);
    }

    contentUrl = `${gitdochost}/content/${docName}/${contentUrl}?DocVersion=master`;

    return contentUrl;
  }

  return (
    <><h1>{docName}</h1>
      <div className={styles.container}>
        <div className={styles.tocContainer}>
          <Link to="/">Back to Docs</Link>
          <select name="version" id="version" onChange={(e) => setVersion(e.target.value)} className={styles.versionList}>
            {
              versions.map((v) => {
                return <option key={v} value={v} selected={v === version}>{v}</option>
              })
            }
          </select>
          <div className={styles.versionControls}>
            <button>New Version</button>
            <button>Publish Version</button>
          </div>
          {renderChildren(toc)}
          <button>Add Document</button>
          <button>Upload File</button>
        </div>
        <div className={styles.contentContainer}>
          <Markdown
            components={{
              a: (props) => {
                if (isRouteToMd(props.href)) {
                  return (<Link to={customEncodeURIComponent(
                    getContentUrl(props.href, false))}>{props?.children}</Link>);
                } else {
                  const routeExt = getRouteExtension(props.href);

                  // achor to folder, assume index.md
                  if (!routeExt && !isExternalLink(props.href)) {
                    const splitRoute = props.href?.split('/') ?? ['/'];
                    splitRoute.push('index.md');

                    return (<Link to={encodeRoute(
                      getContentUrl(splitRoute.join('/'), false))}>{props?.children}</Link>);
                  }

                  // anchor to external resource
                  return (<a target="_blank" rel="noopener noreferrer"
                    href={getContentUrl(props.href, true)}>{props?.children}</a>);
                }
              },
              img: (props) => (<img alt={`${props.alt}`} src={getContentUrl(props.src, true)} />)
            }}
          >{markdown}</Markdown>
        </div>
      </div>
    </>
  )
}

export default Doc;