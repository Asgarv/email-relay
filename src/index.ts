import dotenv from 'dotenv';
import express from 'express';
import busboy from 'express-busboy';

import sendgrid from '@sendgrid/mail';

import * as environment from './environment';
import * as relay from './relay';

import { RequestBody, RequestFiles } from './types/request';

// Initialize configuration
dotenv.config();

// Verify the environment variables
environment.verify();

sendgrid.setApiKey(environment.get('RELAY_SENDGRID_KEY'));

// Create a new express application instance
const app: express.Application = express();

busboy.extend(app, {
  path: environment.get('RELAY_TEMP_ATTACHMENT_PATH'),
  upload: true
});

app.post(
  environment.get('RELAY_PATH'),
  async (req: express.Request, res: express.Response) => {
    console.log(`Ping ${req.path}`);
    const body: RequestBody = req.body;
    const files: RequestFiles = req.files; // express-busboy adds req.files

    relay.process(body, files);

    return res.status(200).send('Relay');
  }
);

app.listen(environment.get('RELAY_PORT'), () => {
  console.log(`Relay started on :${environment.get('RELAY_PORT')}`);
});
