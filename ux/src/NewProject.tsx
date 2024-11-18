import React from "react";
import styles from "./css/modal.module.css";
import GitDocsService from "../gitdocs.service";

export const NewProject = ({ closeModal }) => {

  const [projectName, setProjectName] = React.useState<string>("");
  const [projectDesc, setProjectDesc] = React.useState<string>("");
  const [projectTags, setProjectTags] = React.useState<string>("");
  const [projectFolder, setProjectFolder] = React.useState<string>("");

  const saveProject = async () => {
    await GitDocsService.saveProject(projectName, projectDesc, projectFolder, projectTags);
    closeModal();
  };

  return (
    <div className={styles.modalBack}>
      <div className={styles.modalContainer}>
        <div>
          <h2>New Document Project</h2>
          <p>
            Enter the name of a new document project below and hit save.
          </p>
          <input onChange={(e) => setProjectName(e.target.value)} className={styles.modalInput} type="text" placeholder="Project Name" />
          <input onChange={(e) => setProjectDesc(e.target.value)} className={styles.modalInput} type="text" placeholder="Description" />
          <input onChange={(e) => setProjectFolder(e.target.value)} className={styles.modalInput} type="text" placeholder="Folder" />
          <input onChange={(e) => setProjectTags(e.target.value)} className={styles.modalInput} type="text" placeholder="Tags" />
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