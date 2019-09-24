
import { ParsedBody, RequestBody, RequestFiles } from './types/request';

import * as environment from './environment';
import * as parser from './parser';

import sendgrid from '@sendgrid/mail';

/**
 * Processes the message body and files and determines if it should be relayed or not.
 *
 * @param {RequestBody} body
 * @param {RequestFiles} files
 * @return {object}
 */
export function process(body: RequestBody, files: RequestFiles): object {

    const data: ParsedBody = parser.parseBody(body);

    const relay: any = detectRelay(data.subject);

    const attachments: ParsedBody['attachments'] = parser.parseAttachments(files, relay.relay);

    if (relay.relay) {
        // Outgoing
        sendgrid.send({
            attachments: [],
            from: environment.get('RELAY_FROM_ADDRESS'),
            html: data.html,
            subject: relay.subject,
            text: data.text,
            to: relay.to
        });
    } else {
        // Incoming
        sendgrid.send({
            attachments: [],
            from: data.to,
            html: data.html,
            subject: `${data.subject} Relay: ${data.from_name} ${environment.get('RELAY_ADDRESS_PREFIX')}${data.from_address}${environment.get('RELAY_ADDRESS_SUFFIX')}`,
            text: data.text,
            to: environment.get('RELAY_EMAIL_ADDRESS'),
        });
    }

    return {};
}

/**
 * Uses RELAY_ADDRESS_PREFIX and RELAY_ADDRESS_SUFFIX to check if the message should be relayed.
 *
 * @param {string} subject
 * @return {object}
 */
function detectRelay(subject: string): object {

    const prefix = environment.get('RELAY_ADDRESS_PREFIX');
    const suffix = environment.get('RELAY_ADDRESS_SUFFIX');

    // If subject contains `Relay:` and the prefix and suffix
    if (subject.includes('Relay:') && subject.includes(prefix) && subject.includes(suffix)) {
        const to: string = subject.substring(
            subject.lastIndexOf('Relay:') + 6,
            subject.lastIndexOf(suffix) + 1
        ).trim();
        const toAddress: string = subject.substring(
            subject.lastIndexOf(prefix) + 1,
            subject.lastIndexOf(suffix)
        );
        const toName: string = subject.substring(
            subject.lastIndexOf('Relay:') + 6,
            subject.lastIndexOf(prefix)
        ).trim();

        return {
            relay: true,
            subject: subject.substring(0, subject.lastIndexOf('Relay:')),
            to,
            to_address: toAddress,
            to_name: toName
        };
    }
    else {
        return {
            relay: false
        };
    }
}
