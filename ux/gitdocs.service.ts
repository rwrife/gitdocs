import axios from 'axios';
import http, { gitdochost } from './http-common';
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

  saveVersion(docName: string, versionName: string) {
    return http.post(`publisher/branch?repoName=${docName}&branchName=${versionName}`);
  }

  addFile(docName: string, versionName: string, filePath: string, content: string) {
    var axclient = axios.create({
      baseURL: gitdochost
    })

    const formData = new FormData();

    const textAsFile = new Blob([content], { type: "text/plain" });
    formData.append("file", textAsFile, filePath);

    return axclient.post(`publisher/file/${filePath}?repoName=${docName}&branchName=${versionName}`, formData);
  }
}

export default new GitDocsService();