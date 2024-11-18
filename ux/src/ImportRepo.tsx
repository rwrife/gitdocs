import React from "react";
import styles from "./css/modal.module.css";
import GitDocsService from "../gitdocs.service";

export const ImportRepo = ({ closeModal }) => {

  const [projectName, setProjectName] = React.useState<string>("");
  const [projectDesc, setProjectDesc] = React.useState<string>("");
  const [projectFolder, setProjectFolder] = React.useState<string>("");
  const [projectTags, setProjectTags] = React.useState<string>("");
  const [repoUrl, setRepoUrl] = React.useState<string>("");
  const [repoBranch, setRepoBranch] = React.useState<string>("");
  const [repoFolder, setRepoFolder] = React.useState<string>("");

  const saveProject = async () => {
    await GitDocsService.importRepo(projectName, projectDesc, projectTags, repoUrl, repoBranch, repoFolder);
    closeModal();
  };

  return (
    <div className={styles.modalBack}>
      <div className={styles.modalContainer}>
        <div>
          <h2>Import ADO Repository</h2>
          <p>
            Enter the name of a new document project and git repo details below and hit save.
          </p>
          <input onChange={(e) => setProjectName(e.target.value)} className={styles.modalInput} type="text" placeholder="Project Name" />
          <input onChange={(e) => setProjectDesc(e.target.value)} className={styles.modalInput} type="text" placeholder="Description" />
          <input onChange={(e) => setProjectFolder(e.target.value)} className={styles.modalInput} type="text" placeholder="Folder" />
          <input onChange={(e) => setProjectTags(e.target.value)} className={styles.modalInput} type="text" placeholder="Tags" />
          <input onChange={(e) => setRepoUrl(e.target.value)} className={styles.modalInput} type="text" placeholder="Git Clone Uri" />
          <input onChange={(e) => setRepoBranch(e.target.value)} className={styles.modalInput} type="text" placeholder="Branch" />
          <input onChange={(e) => setRepoFolder(e.target.value)} className={styles.modalInput} type="text" placeholder="Default Folder" />
        </div>
        <div className={styles.modalButtons}>
          <button onClick={closeModal} className={styles.modal__closeBtn}>
            Cancel
          </button>
          <button onClick={() => saveProject()} className={styles.modal__saveBtn}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};