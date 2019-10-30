# Email Relay with Sendgrid

Email Relay is a solution to send and receive emails through your own domain using Sendgrid, without the need of your own email server or provider. This means that you can receive emails through your own domain, e.g. info@yourdomain.tld and it will be forwarded to your own private email address.

## How it works

Email Relay relies on Sendgrid's inbound parse webhook to receive your emails. 

### Incoming

Once Sendgrid receives an email it will send a webhook event to the relay server including the contents of the email message. The relay server then sends the email to your private email address.

### Outgoing

To send emails through your private email address, add `Relay-To: firstname lastname <recipent-email@domain.com>` to the subject line of your message. The message will be forwarded through the relay server and will appear as if it was sent from your domain.

## Prerequisites

1. Create a Sendgrid account.
2. Setup your DNS records to point your mx records to Sendgrid.
3. Setup [Sendgrid inbound parse](https://sendgrid.com/docs/for-developers/parsing-email/setting-up-the-inbound-parse-webhook/). Set Destination URL to https://yourdomain.tld/go. (The */go* path can be changed through [environment variables](#setup-&-configuration))
4. Deploy the app to your server.
5. Make sure your server supports SSL. Sendgrid does not send webhook requests to non-HTTPS URLs.

## Setup & Configuration

The server looks for a `.env` file in the root directory. The following environment variables can be used:

`RELAY_PORT` **Required** | The port the server runs on.

`RELAY_PATH` Path listening for webhook requests from Sendgrid. This is configured when setting up inbound parse at https://app.sendgrid.com/settings/parse Default: `/go`

`RELAY_SENDGRID_KEY`: **Required** | The API key to send Sendgrid emails. https://app.sendgrid.com/settings/api_keys

`RELAY_TEMP_ATTACHMENT_PATH`: **Required** | Path where attachments are stored if the email send is unsuccessful.

`RELAY_EMAIL_ADDRESS`: **Required** | Email address where your inbound emails will be sent. Only enter the email address, without *<>*

`RELAY_EMAIL_NAME`: **Required** | The name inbound emails will be addressed to. Usually your own name.

`RELAY_NAMETAGS`: **Required** | Stringified JSON. Maps sender names to your email addresses. `key` is the address, `value` is the name. See the full example below.

`RELAY_TO_PREFIX`: String the server looks for in inbound email subjects to determine if an email should be relayed or not. Default: `Relay-To:`

### Example `.env` file
```
RELAY_PORT=5900

RELAY_SENDGRID_KEY=SG.AAAAAAAAAAAAAAA.XXX...

RELAY_PATH=/inbound/relay

RELAY_TEMP_ATTACHMENT_PATH=/home/asgarv/relay/attachments

RELAY_EMAIL_ADDRESS=john.doe@gmail.com

RELAY_EMAIL_NAME=John Doe

RELAY_NAMETAGS={"contact@smartlab.com":"Smartlab","support@smartlab.com":"Smartlab Support","larry@smartlab.com":"Larry Harrison"}

RELAY_TO_PREFIX=!R-T
```
