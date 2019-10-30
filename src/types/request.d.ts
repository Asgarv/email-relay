declare global {
  namespace Express {
    interface Request {
      files: RequestFiles;
    }
  }
}

export interface ParsedBody {
  raw: RequestBody;
  subject: string;
  to: {
    name: string;
    email: string;
  };
  from: {
    name: string;
    email: string;
  };
  text: string;
  html: string;
  attachments: object[];
  ip: string;
}

export interface ParsedFile {
  filename: string;
  content?: string;
  encoding: string;
  mimetype: string;
}

export interface RequestBody {
  headers: string;
  dkim: string;
  to: string;
  html: string;
  from: string;
  text: string;
  sender_ip: string;
  envelope: string;
  attachments: string;
  subject: string;
  'attachment-info': string;
  charsets: string;
  SPF: string;
}

export interface RequestFiles {
  [file: string]: {
    uuid: string;
    field: string;
    file: string;
    filename: string;
    encoding: string;
    mimetype: string;
    truncated: boolean;
    done: boolean;
  };
}
