import axios from 'axios';
import http, { gitdochost } from './http-common';
import TocItem from './tocItem';
import GitRepo from './gitRepo';

class GitDocsService {
  getAllDocumenets() {
    return http.get<GitRepo[]>('/publisher');
  }

  saveProject(projectName: string, projectDesc: string, projectTags: string) {
    projectName = projectName.replace(/\s/g, '-').toLowerCase();
    projectTags = projectTags.split(",").map(tag => tag.trim()).join(",").replace(/\s/g, '-').toLowerCase();
    return http.post(`/publisher?repoName=${projectName}&description=${projectDesc}&title=${projectName}&tags=${projectTags}`);
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

  addTextFile(docName: string, versionName: string, filePath: string, content: string) {
    var axclient = axios.create({
      baseURL: gitdochost
    })

    const formData = new FormData();

    const textAsFile = new Blob([content], { type: "text/plain" });
    formData.append("file", textAsFile, filePath);

    return axclient.post(`publisher/file/${filePath}?repoName=${docName}&branchName=${versionName}`, formData);
  }

  addFile(docName: string, versionName: string, file: any) {
    console.log(docName, versionName, file);
    var axclient = axios.create({
      baseURL: gitdochost,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    const formData = new FormData();
    formData.append("file", file);

    return axclient.post(`publisher/file/${file.name}?repoName=${docName}&branchName=${versionName}`, formData);
  }

  publishVersion(docName: string, versionName: string) {
    return http.post(`publisher/publish?repoName=${docName}&branchName=${versionName}`);
  }
}

export default new GitDocsService();