


export type ISendExt = {
  type: 'image_url' | 'text' | 'thinking';
  url?: string;
  meta?: Record<string, any>;
}

export interface IProgressEvent {
  type: 'progress' | 'tool' | 'model' | 'image' | 'error';
  step: string;
  message: string;
  data?: Record<string, any>;
  persist?: boolean;
}

export type OnProgressCallback = (event: IProgressEvent) => Promise<void> | void;
