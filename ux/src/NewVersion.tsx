import React from "react";
import styles from "./css/modal.module.css";
import GitDocsService from "../gitdocs.service";

export const NewVersion = ({ docName, closeModal }) => {

  const [versionName, setVersionName] = React.useState<string>("");

  const saveVersion = async () => {
    await GitDocsService.saveVersion(docName, versionName.replace(/\s/g, '-'));
    closeModal(versionName.replace(/\s/g, '-'));
  };

  return (
    <div className={styles.modalBack}>
      <div className={styles.modalContainer}>
        <div>
          <h2>New Version</h2>
          <p>
            Enter a new, unique, version name below, based on master.
          </p>
          <input onChange={(e) => setVersionName(e.target.value)} className={styles.modalInput} type="text" placeholder="Version Name" />
        </div>
        <div className={styles.modalButtons}>
          <button onClick={closeModal} className={styles.modal__closeBtn}>
            Cancel
          </button>
          <button onClick={() => saveVersion()} className={styles.modal__saveBtn}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};