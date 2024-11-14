import { useState } from 'react';
import { DiGit } from "react-icons/di";
import styles from "./css/header.module.css";
import SearchBox from './SearchBox.tsx';

export default function Header() {


  return (
    <div className={styles.header}>
      <div className={styles.title}><DiGit /><a href="/">Git Docs Demo</a></div>
      <SearchBox />
      <div></div>
    </div>
  )
}