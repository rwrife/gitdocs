import { useEffect, useState } from 'react'
import './App.css'
import GitDocsService from "../gitdocs.service";
import { useParams } from 'react-router';
import styles from "./doc.module.css";
import { Link } from 'react-router-dom';
import { FaFolder, FaFile, FaFileImage } from "react-icons/fa";
import TocItem from '../tocItem';
import Markdown from 'https://esm.sh/react-markdown@9'

function Doc(props: any) {

  const { docName, '*': filePath } = useParams();
  const [toc, setToc] = useState<TocItem[]>([]);

  const [markdown, setMarkdown] = useState<string>("Click on a document to the left to view its contents");

  useEffect(() => {
    console.log(docName, filePath);
  }, [docName]);

  useEffect(() => {
    if (docName) {
      GitDocsService.getDocToc(docName, "").then((response) => {
        console.log(response.data);
        setToc(response.data);
      });
    }
  }, [docName]);

  const loadChildren = (tocItem: TocItem) => {
    console.log(tocItem)
    if (docName) {
      GitDocsService.getDocToc(docName, tocItem.name).then((response) => {
        tocItem.children = response.data;
        setToc([...toc]);
      });
    }
  }

  useEffect(() => {
    if (filePath && docName) {
      GitDocsService.getContent(docName, filePath).then((response) => {
        setMarkdown(response.data);
      });
    } else {
      setMarkdown("Click on a document to the left to view its contents");
    }
  }, [filePath]);

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

  return (
    <><h1>{docName}</h1>
      <div className={styles.container}>
        <div className={styles.tocContainer}>
          <Link to="/">Back to Docs</Link>
          {renderChildren(toc)}
          <button>Add Document</button>
          <button>Upload File</button>
        </div>
        <div className={styles.contentContainer}>
          <Markdown>{markdown}</Markdown>
        </div>
      </div>
    </>
  )
}

export default Doc;