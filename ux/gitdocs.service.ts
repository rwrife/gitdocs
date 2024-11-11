import http from './http-common';
import TocItem from './tocItem';

class GitDocsService {
  getAllDocumenets() {
    return http.get<string[]>('/publisher');
  }

  saveProject(projectName: string) {
    projectName = projectName.replace(/\s/g, '-').toLowerCase();
    return http.post(`/publisher?repoName=${projectName}`);
  }

  getDocToc(docName: string, path: string, docVersion: string = "master", showHidden: boolean = false) {
    return http.get<TocItem[]>(`docs/${docName}/toc/${path}?Showhidden=${showHidden.toString()}&DocVersion=${docVersion}`);
  }

  getContent(docName: string, path: string, docVersion: string = "master") {
    return http.get<string>(`content/${docName}/${path}?DocVersion=${docVersion}`);
  }

  getDocVersions(docName: string) {
    return http.get<string[]>(`docs/${docName}/versions`);
  }
}

export default new GitDocsService();