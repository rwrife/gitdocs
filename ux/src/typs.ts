export interface AskResponse {
  askId: String;
  question: String;
  answer: String;
}

export interface GitRepo {
  title: string;
  name: string;
  description: string;
  tags: string;
}

export interface SearchResult {
  repoName: string;
  title: string;
  filePath: string;
  content: string;
}

export interface TocItem {
  title: string;
  name: string;
  type: string;
  children?: TocItem[];
}