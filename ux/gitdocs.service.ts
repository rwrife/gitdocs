import axios from 'axios';
import http, { gitdochost } from './http-common';
import TocItem from './tocItem';
import { GitRepo, SearchResult } from './types';
import { AskResponse } from './src/typs';

class GitDocsService {
  getAllDocumenets() {
    return http.get<GitRepo[]>('publisher');
  }

  ask(query: string, askid: string) {
    return http.post<AskResponse>(`ask?askid=${askid}&q=${query}`);
  }

  search(query: string) {
    return http.get<SearchResult[]>(`search?q=${query}`);
  }

  saveProject(projectName: string, projectDesc: string, projectFolder: string, projectTags: string) {
    const repoName = projectName.replace(/\s/g, '-').toLowerCase();
    projectTags = projectTags.split(",").map(tag => tag.trim()).join(",").replace(/\s/g, '-').toLowerCase();
    return http.post(`publisher?repoName=${repoName}&description=${projectDesc}&title=${projectName}&tags=${projectTags}&folder=${encodeURIComponent(projectFolder)}`);
  }

  importRepo(projectName: string, projectDesc: string, projectTags: string, repoUrl: string, repoBranch: string, projectFolder: string, repoFolder: string) {
    const repoName = projectName.replace(/\s/g, '-').toLowerCase();
    projectTags = projectTags.split(",").map(tag => tag.trim()).join(",").replace(/\s/g, '-').toLowerCase();
    return http.post(`publisher/import?repoName=${repoName}&description=${projectDesc}&title=${projectName}&tags=${projectTags}&repoUrl=${encodeURIComponent(repoUrl)}&branchName=${repoBranch}&defaultFolder=${encodeURIComponent(repoFolder)}&folder=${encodeURIComponent(projectFolder)}`);
  }

  getDocToc(docName: string, path: string, docVersion: string = "master", showHidden: boolean = false) {
    return http.get<TocItem[]>(`docs/${docName}/toc/${path}?Showhidden=${showHidden.toString()}&DocVersion=${docVersion}`);
  }

  getContent(docName: string, path: string, docVersion: string = "master") {
    return http.get<string>(`content/${docName}/${path}?DocVersion=${docVersion}`);
  }

  getDocCurrentVersion(docName: string) {
    return http.get<string>(`docs/${docName}/defaultbranch`);
  }

  getDocVersions(docName: string) {
    return http.get<string[]>(`docs/${docName}/versions`);
  }

  saveVersion(docName: string, versionName: string) {
    return http.post(`publisher/branch?repoName=${docName}&branchName=${versionName}`);
  }

  getVersionCommitId(docName: string, versionName: string) {
    return http.get<string>(`docs/${docName}/versions/${encodeURIComponent(versionName)}/gitsha`);
  }

  addTextFile(docName: string, versionName: string, filePath: string, content: string) {
    var axclient = axios.create({
      baseURL: `${gitdochost}/api/`,
    })

    const formData = new FormData();

    const textAsFile = new Blob([content], { type: "text/plain" });
    formData.append("file", textAsFile, filePath);

    return axclient.post(`publisher/file/${filePath}?repoName=${docName}&branchName=${versionName}`, formData);
  }

  getMetadata(docName: string, metadataKey: string) {
    return http.get(`docs/${docName}/metadata/${metadataKey}`);
  }

  addFile(docName: string, versionName: string, file: any) {
    console.log(docName, versionName, file);
    var axclient = axios.create({
      baseURL: `${gitdochost}/api/`,
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