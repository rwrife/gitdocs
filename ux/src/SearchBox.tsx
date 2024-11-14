import { useState } from 'react';

import styles from "./css/search.module.css";
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function SearchBox() {

  const navigate = useNavigate();

  return (
    <div className={styles.searchBox}>
      <FaSearch /><input type="text" placeholder="Search..." onKeyPress={
        (e) => {
          if (e.key === 'Enter') {
            if (e.target.value.length > 0) {
              navigate(`/search?q=${e.target.value}`);
            }
          }
        }
      } />
    </div>
  )
}