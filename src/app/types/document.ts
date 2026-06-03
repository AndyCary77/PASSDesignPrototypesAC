export type DocumentStatus = 'success' | 'error' | 'warning';

export interface Document {
  id: string;
  title: string;
  subtitle: string;
  createdDate: string;
  status: DocumentStatus;
  type: string;
}
