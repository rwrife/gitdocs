import { useEffect, useState } from 'react';
import './css/app.css'
import GitDocsService from "../gitdocs.service";
import { useLocation, useNavigate, useParams } from 'react-router';
import styles from "./css/doc.module.css";
import { Link } from 'react-router-dom';
import { FaFolder, FaFile, FaFileImage, FaCodeBranch, FaPlus } from "react-icons/fa";
import { TocItem } from './types';
import Markdown from 'react-markdown'
import {
  isRouteToMd,
  getRouteExtension,
  isExternalLink,
  customEncodeURIComponent,
  encodeRoute
} from './routeHelper';
import { gitdochost } from '../http-common';
import { NewVersion } from './NewVersion';
import { generateTitle } from '../utils';
import { FaPencilAlt, FaEye, FaEyeSlash, FaFileUpload } from "react-icons/fa";
import { LuSave } from "react-icons/lu";
import { MdOutlineCancel } from "react-icons/md";
import { IoArrowBackSharp } from "react-icons/io5";
import { AiOutlineFileMarkdown } from "react-icons/ai";
import rehypeRaw from 'rehype-raw';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGithubAdmonitionsToDirectives from 'remark-github-admonitions-to-directives';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

function Doc(props: any) {
  const { docName, '*': filePath } = useParams();
  const [toc, setToc] = useState<TocItem[]>([]);
  const [version, setVersion] = useState<string>("master");
  const [versions, setVersions] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState<string>("Click on a document to the left to view its contents");
  const [showVersion, setShowVersion] = useState<boolean>(false);
  const [editDoc, setEditDoc] = useState<boolean>(false);
  const [editDocPath, setEditDocPath] = useState<string>("");
  const [editDocContent, setEditDocContent] = useState<string>("");
  const [showHiddenFiles, setShowHiddenFiles] = useState<boolean>(false);
  const [commitId, setCommitId] = useState<string>("");
  const [rootFolder, setRootFolder] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  const loadVersions = () => {
    if (docName) {
      GitDocsService.getDocVersions(docName).then((response) => {
        setVersions(response.data);
      });
    }
  };

  useEffect(() => {
    if (docName) {
      loadVersions();
      GitDocsService.getDocCurrentVersion(docName).then((response) => {
        setVersion(response?.data);
      });
    }
  }, [docName]);

  const loadCommitId = () => {
    if (docName && version) {
      GitDocsService.getVersionCommitId(docName, version).then((response) => {
        setCommitId(response.data);
      });
    }
  }

  useEffect(() => {
    if (docName) {
      const timer = setInterval(() => {
        loadCommitId();
      }, 1000);
      loadCommitId();
      GitDocsService.getMetadata(docName, "docroot").then((response) => {
        setRootFolder(response.data === "/" ? "" : response.data);
      }).catch((e) => { setRootFolder(""); });


      return () => {
        clearInterval(timer);
      }
    }
  }, [docName, version]);

  const loadToc = () => {
    console.log(rootFolder);
    if (docName && version) {
      GitDocsService.getDocToc(docName, rootFolder ?? "", version, showHiddenFiles).then((response) => {
        setToc(response.data);
      });
    }
  };

  const loadChildren = (tocItem: TocItem) => {
    if (docName) {
      GitDocsService.getDocToc(docName, tocItem.name, version, showHiddenFiles).then((response) => {
        tocItem.children = response.data;
        setToc([...toc]);
      });
    }
  };

  useEffect(() => {
    if (commitId && rootFolder !== undefined) {
      loadToc();
    }
  }, [commitId, showHiddenFiles, rootFolder]);

  const loadDoc = () => {
    if (docName && filePath && version) {
      GitDocsService.getContent(docName, filePath, version).then((response) => {
        setMarkdown(response.data);
      }).catch((e) => { setMarkdown("Error loading document, may not exist in branch."); });
    }
  };

  useEffect(() => {
    if (filePath && version) {
      setEditDoc(false);
      loadDoc();
    } else {
      setMarkdown("Click on a document to the left to view its contents");
    }
  }, [filePath, commitId]);

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
          return <div key={item.id}><FaFileImage />{item?.file?.split('/').pop() || ''}</div>
      }

    })
  }

  const getContentUrl = (basePath: string = "", contentPath: string, isResource: boolean) => {
    // do nothing with fqdn urls (do we have a list of protocols?)
    if (isExternalLink(contentPath)) {
      return contentPath;
    }

    if (contentPath.startsWith("/")) {
      return `${gitdochost}/api/content/${docName}${contentPath}?DocVersion=${version}`;
    }

    basePath = basePath.split("/").slice(0, -1).join("/");
    console.log(basePath, contentPath);

    if (contentPath.startsWith("~/")) {
      basePath = "";
      contentPath = contentPath.slice(2);
      console.log(contentPath);
    }
    if (contentPath.startsWith("./")) {
      contentPath = contentPath.slice(2);
    }
    if (contentPath.startsWith("/")) {
      basePath = "";
      contentPath = contentPath.slice(1);
    }

    const resolvedPath = new URL(contentPath, `${gitdochost}/api/content/${docName}/${basePath ? basePath + '/' : ''}`).pathname;
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

  const renderDocToolbar = () => {
    return (
      <div className={styles.docToolbar}>
        <select value={version} defaultValue={version} name="version" id="version" onChange={(e) => setVersion(e.target.value)} className={styles.versionList}>
          {
            versions.map((v) => {
              return <option key={v} value={v}>{generateTitle(v, false)}</option>
            })
          }
        </select>
        <div className={styles.versionControls}>
          <button onClick={() => setShowVersion(true)}><FaPlus /> Version</button>
          {version != "master" && <button onClick={() => publishVersion()}>Publish</button>}
        </div>
        {version != "master" && <div className={styles.editControls}>
          {filePath && !editDoc && <button title='Edit' onClick={() => {
            setEditDocContent(markdown);
            setEditDocPath(filePath);
            setEditDoc(true);
          }}><FaPencilAlt /></button>}
          {editDoc && <>

            <input className={styles.inputBox} value={editDocPath} placeholder='File path and name...' onChange={(e) => setEditDocPath(e.target.value)} />
            <button title='Save' onClick={async () => {
              await GitDocsService.addTextFile(docName, version, editDocPath, editDocContent);
              loadToc();
              loadDoc();
              setEditDoc(false);
            }}><LuSave /></button>
            <button title='Cancel' onClick={() => { setEditDoc(false); loadDoc(); }}><MdOutlineCancel /></button></>}
        </div>}
      </div>)
  };

  return (
    <><div className={styles.doctitle}>
      <div>{generateTitle(docName, false)}</div>
      <div className={styles.commitId}><FaCodeBranch />{commitId.slice(0, 8)}</div>
    </div>
      <div className={styles.container}>
        <div className={styles.tocContainer}>
          <button style={{ width: "50%" }} onClick={() => navigate("/")}><IoArrowBackSharp /> Back</button>
          {renderChildren(toc)}
          {version != "master" && <div className={styles.tocControls}>
            <button
              onClick={() => setShowHiddenFiles(!showHiddenFiles)}
              title='Show Hidden Files'>{showHiddenFiles ? <FaEye /> : <FaEyeSlash />}</button>
            <button onClick={() => {
              setEditDocContent("");
              setEditDocPath("");
              setEditDoc(true);
            }}
              title='Add Markdown Document'><AiOutlineFileMarkdown /> Add</button>
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
            <button
              onClick={() => document.getElementById("fileInput").click()}
              title='Upload File'><FaFileUpload /> Upload</button>
          </div>}
        </div>
        <div className={styles.contentContainer}>
          {renderDocToolbar()}
          {!editDoc && <div>
            <Markdown
              remarkToRehypeOptions={{ allowDangerousHtml: true }}
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
              remarkPlugins={
                [
                  remarkGfm,
                  remarkFrontmatter,
                  remarkMdxFrontmatter,
                  remarkMath,
                  remarkGithubAdmonitionsToDirectives,
                ] as any
              }
              rehypePlugins={
                [
                  rehypeRaw,
                  rehypeKatex,
                  [rehypeHighlight, { detect: true, }],
                ] as any
              }
            >{markdown}</Markdown></div>}

          {editDoc && <textarea className={styles.editor} value={editDocContent} onChange={(e) => setEditDocContent(e.target.value)} />}
        </div>
        {showVersion && <NewVersion docName={docName} closeModal={(newver) => {
          setShowVersion(false);
          loadVersions();
          setVersion(newver);
        }} />}
      </div >

    </>
  )
}

export default Doc;