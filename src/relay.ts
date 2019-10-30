import { ParsedBody, RequestBody, RequestFiles } from './types/request';

import * as environment from './environment';
import * as parser from './parser';

import sendgrid from '@sendgrid/mail';

function lookup(email: string): string | null {
  const contacts = JSON.parse(environment.get('RELAY_NAMETAGS'));
  return contacts[email] || null;
}

/**
 * Processes the message body and files and determines if it should be relayed or not.
 *
 * @param {RequestBody} body
 * @param {RequestFiles} files
 * @return {object}
 */
export function process(body: RequestBody, files: RequestFiles): object {
  const data: ParsedBody = parser.parseBody(body);

  const relay: Relay = detectRelay(data.subject);

  data.attachments = parser.parseAttachments(files);

  if (relay.relay) {
    // Email is outgoing
    data.subject = sanitize(data.subject);
    send({
      ...data,
      to: { email: relay.to.email, name: relay.to.name },
      from: {
        email: data.to.email,
        name: lookup(data.to.email)
      }
    });
  } else {
    // Email is incoming
    data.subject = createSubject(data);
    send({
      ...data,
      to: {
        email: environment.get('RELAY_EMAIL_ADDRESS'),
        name: environment.get('RELAY_EMAIL_NAME')
      },
      from: {
        email: data.to.email,
        name: data.from.name
      }
    });
  }

  return {};
}

function send(data: ParsedBody): void {
  sendgrid.send({
    attachments: data.attachments.map((a: any) => {
      return { content: a.content, filename: a.filename };
    }),
    from: data.from,
    html: data.html,
    subject: data.subject,
    text: data.text,
    to: data.to
  });
}

/**
 * Removes relay tags from subject and returns new string
 *
 * @param {string} subject
 * @returns {string}
 */
function createSubject(data: ParsedBody): string {
  const RTFix: string = environment.get('RELAY_TO_PREFIX'); // default 'Relay-To:'

  let subject = data.subject;
  if (data.from.name) {
    subject += ` ${RTFix} ${data.from.name} <${data.from.email}>`;
  } else {
    subject += ` ${RTFix} ${data.from.email}`;
  }
  return subject.trim();
}

/**
 * Removes relay tags from subject and returns new string
 *
 * @param {string} subject
 * @returns {string}
 */
function sanitize(subject: string): string {
  const RTFix: string = environment.get('RELAY_TO_PREFIX'); // default 'Relay-To:'
  subject = subject.split(RTFix)[0];
  return subject.trim();
}

interface Relay {
  relay: boolean;
  to: {
    name: string;
    email: string;
  } | null;
}

/**
 * Uses RELAY_TO_PREFIX to check if the message should be relayed.
 *
 * @param {string} message
 * @return {object}
 */
function detectRelay(subject: string): Relay {
  const RTFix: string = environment.get('RELAY_TO_PREFIX'); // default 'Relay-To:'

  // Example subject:
  // Relay-To: Firstname Lastname <firstname.lastname@gmail.com> Relay-From: Company Support <support@company.com>

  let rt;
  let relay = false;

  if (subject.includes(RTFix)) {
    relay = true;
    // Title includes the recipent email
    // Email should be relayed
    rt = subject
      .substring(subject.lastIndexOf(RTFix) + RTFix.length, subject.length)
      .trim();
  }

  return {
    relay,
    to: rt ? parser.extract(rt) : null
  };
}
