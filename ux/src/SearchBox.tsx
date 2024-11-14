import { useState } from 'react';

import styles from "./css/search.module.css";
import { FaSearch } from 'react-icons/fa';

export default function SearchBox() {


  return (
    <div className={styles.searchBox}>
      <FaSearch /><input type="text" placeholder="Search..." />
    </div>
  )
}