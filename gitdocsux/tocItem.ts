export default interface TocItem {
  title: string;
  name: string;
  type: string;
  children?: TocItem[];
}