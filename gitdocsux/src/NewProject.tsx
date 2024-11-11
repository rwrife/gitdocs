import React from "react";
import styles from "./modal.module.css";
import GitDocsService from "../gitdocs.service";

export const NewProject = ({ closeModal }) => {

  const saveProject = (projectName: string) => {
    GitDocsService.saveProject(projectName);
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
          <input className={styles.modalInput} type="text" placeholder="Project Name" />
        </div>
        <div className={styles.modalButtons}>
          <button onClick={closeModal} className={styles.modal__closeBtn}>
            Cancel
          </button>
          <button onClick={() => saveProject("New Project")} className={styles.modal__saveBtn}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};