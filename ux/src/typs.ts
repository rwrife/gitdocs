export interface AskResponse {
  askId: string;
  question: string;
  answer: string;
  loading: boolean;
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