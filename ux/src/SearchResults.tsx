import { useEffect, useState } from 'react';
import './css/app.css'
import styles from "./css/search.module.css";
import { useLocation, useNavigate } from 'react-router-dom';
import GitDocsService from "../gitdocs.service";
import { SearchResult } from './types.ts';
import { GrDocumentText } from 'react-icons/gr';
import { generateTitle } from '../utils';

function SearchResults(props: any) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q) {
      GitDocsService.search(q).then((response) => {
        console.log(response);
        if (response) {
          setSearchResults(response.data);
        }
      });
    }

  }, [location]);

  return (<div className="container">
    <div className={styles.searchPage}>
      <div className={styles.searchQuery}>
        Search results for: {new URLSearchParams(location.search).get('q')}
      </div>
      <div className={styles.searchResults}>
        {searchResults.map((result, i) => {
          return <div className={styles.result} key={`result_${i}`} onClick={() => {
            navigate(`/doc/${result.repoName}/${result.filePath}`);
          }}>
            <div className={styles.title}><GrDocumentText /> {generateTitle(result.title || result.filePath, false)}</div>
            <div className={styles.preview}>{result.content}</div>
            <div className={styles.footer}>{result.filePath}</div>
          </div>
        })}
      </div>
    </div>
  </div>
  );
}

export default SearchResults;