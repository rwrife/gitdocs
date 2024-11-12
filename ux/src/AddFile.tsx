import React from "react";
import styles from "./modal.module.css";
import GitDocsService from "../gitdocs.service";

export const AddFile = ({ docName, docVersion, closeModal }) => {
  const [filePath, setFilePath] = React.useState<string>("");
  const [fileContent, setFileContent] = React.useState<string>("");

  const saveFile = async () => {
    await GitDocsService.addTextFile(docName, docVersion, filePath, fileContent);
    closeModal();
  };

  return (
    <div className={styles.modalBack}>
      <div className={styles.modalContainer}>
        <div>
          <h2>New Document</h2>
          <p>
            Enter the name of a new document project below and hit save.
          </p>
          <p>
            <input onChange={(e) => setFilePath(e.target.value)} className={styles.modalInput} type="text" placeholder="File Name" />
          </p>
          <textarea onChange={(e) => setFileContent(e.target.value)} className={styles.modalInput} rows={6} placeholder="Document content..." />

        </div>
        <div className={styles.modalButtons}>
          <button onClick={closeModal} className={styles.modal__closeBtn}>
            Cancel
          </button>
          <button onClick={() => saveFile()} className={styles.modal__saveBtn}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};