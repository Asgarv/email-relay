
import { ParsedBody, ParsedFile, RequestBody, RequestFiles } from './types/request';

import * as environment from './environment';

import fs from 'fs';

/**
 * Returns a sleeker request body, see ParsedBody.
 *
 * @param {RequestBody} body
 * @return {ParsedBody}
 */
export function parseBody(body: RequestBody): ParsedBody {

    const parsed: ParsedBody = {
        raw: body,

        subject: body.subject,

        to: body.to,
        to_address: extract(body.to).email,
        to_name: extract(body.to).name,

        from: body.from,
        from_address: extract(body.from).email,
        from_name: extract(body.from).name,

        html: body.html,
        text: body.text,

        attachments: [],

        ip: body.sender_ip
    };

    return parsed;
}

/**
 * Extracts the email address and name from a string e.g:
 * "firstname lastname <firstname.lastname@example.com>"
 *
 * @param {string} str
 * @return {IEmailExtract}
 */
function extract(str: string): IEmailExtract {
    const split = str.split('<');
    return {
        email: split[1].slice(0, split[1].length - 1),
        name: split[0].trim()
    };
}

interface IEmailExtract {
    email: string;
    name: string;
}

/**
 * Parses attachments.
 * Returns _filename, content, encoding and mimetype_ of each attachment.
 *
 * @param {object} attachments
 * @return {ParsedFile[]} Parsed attachments
 */
export function parseAttachments(attachments: RequestFiles, incoming: boolean): ParsedFile[] {

    const parsed: ParsedFile[] = [];

    Object.values(attachments).forEach((attachment: RequestFiles['file']): ParsedFile | undefined => {
        const buffer: Buffer | string = readAndDeleteFile(attachment.file, attachment.uuid);

        const file: ParsedFile = {
            encoding: attachment.encoding,
            filename: attachment.filename,
            mimetype: attachment.mimetype
        };

        if (typeof buffer === 'string') {
            if (incoming) {
                file.content = Buffer.from(buffer, 'utf-8');
            } else {
                return;
            }
        }
        else {
            file.content = buffer;
        }

        parsed.push(file);
    });

    return parsed;
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
function readAndDeleteFile(path: string, uuid: string): Buffer | string {
    try {
        const buffer: Buffer = fs.readFileSync(path);
        deleteFolderRecursive(`${environment.get('RELAY_TEMP_ATTACHMENT_PATH')}/${uuid}`);
        return buffer;
    } catch (error) {
        console.log(`Unable to read file at ${path}. File will not be deleted.`);
        return path;
    }
}

/**
 * Recursive function to delete folders using fs.
 * Thanks to https://stackoverflow.com/users/1350476/sharpcoder
 *
 * @param {string} path - Folder path
 * @return {void}
 */
function deleteFolderRecursive(path: string): void {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}
