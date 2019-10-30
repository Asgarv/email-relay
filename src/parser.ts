import {
  ParsedBody,
  ParsedFile,
  RequestBody,
  RequestFiles
} from './types/request';

import * as environment from './environment';

import fs from 'fs';

interface EmailExtract {
  email: string;
  name: string;
}

/**
 * Returns a sleeker request body, see ParsedBody.
 *
 * @param {RequestBody} body
 * @return {ParsedBody}
 */
export function parseBody(body: RequestBody): ParsedBody {
  return {
    raw: body,
    subject: body.subject,
    to: {
      email: extract(body.to).email,
      name: extract(body.to).name.replace(/"/g, '')
    },
    from: {
      email: extract(body.from).email,
      name: extract(body.from).name.replace(/"/g, '')
    },
    html: body.html,
    text: body.text,
    attachments: [],
    ip: body.sender_ip
  };
}

/**
 * Extracts the email address and name from a string e.g:
 * "firstname lastname <firstname.lastname@example.com>"
 *
 * @param {string} str
 * @return {EmailExtract}
 */
export function extract(str: string): EmailExtract {
  if (!str.includes('<')) {
    return {
      email: str,
      name: ''
    };
  } else {
    const split = str.split('<');
    const email = split[1].slice(0, split[1].length - 1);
    let name = split[0].trim();
    if (email === name.replace(/"/g, '')) {
      name = '';
    }
    return {
      email,
      name
    };
  }
}

/**
 * Function to delete folders using fs.
 * Note: Recursive function!
 * Thanks to https://stackoverflow.com/users/1350476/sharpcoder
 *
 * @param {string} path - Folder path
 * @return {void}
 */
function deleteFolder(path: string): void {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      const cPath = path + '/' + file;
      if (fs.lstatSync(cPath).isDirectory()) {
        deleteFolder(cPath);
      } else {
        fs.unlinkSync(cPath);
      }
    });
    fs.rmdirSync(path);
  }
}

/**
 * Returns a buffer of the file at the provided path.
 * Once the buffer is read, the file is deleted from the disk.
 *
 * @param {string} path - Path to the file
 * @param {boolean} incoming - Incoming relay
 * Includes a failsafe for incoming relays if the application is unable to read the file.
 * The file remains saved on the machine, and a .txt file will be attached containing the filepath.
 * @return {Buffer}
 */
function readAndDeleteFile(path: string, uuid: string): string {
  try {
    const buffer: string = fs.readFileSync(path, { encoding: 'base64' });
    deleteFolder(`${environment.get('RELAY_TEMP_ATTACHMENT_PATH')}/${uuid}`);
    return buffer;
  } catch (error) {
    console.log(`Unable to read file at ${path}. File will not be deleted.`);
    return path;
  }
}

/**
 * Parses attachments.
 * Returns _filename, content, encoding and mimetype_ of each attachment.
 *
 * @param {object} attachments
 * @return {ParsedFile[]} Parsed attachments
 */
export function parseAttachments(attachments: RequestFiles): ParsedFile[] {
  const parsed: ParsedFile[] = [];

  Object.values(attachments).forEach(
    (attachment: RequestFiles['file']): void => {
      const buffer: string = readAndDeleteFile(
        attachment.file,
        attachment.uuid
      );

      const file: ParsedFile = {
        encoding: attachment.encoding,
        filename: attachment.filename,
        mimetype: attachment.mimetype
      };

      if (typeof buffer === 'string') {
        file.content = buffer;
      }

      parsed.push(file);
    }
  );

  return parsed;
}
