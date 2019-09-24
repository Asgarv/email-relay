# Email Relay with Sendgrid

Email Relay is a solution to send and receive emails through your own domain using Sendgrid, without the need of your own email server or provider. This means that you can receive emails through your own domain, e.g. info@yourdomain.tld and it will be forwarded to your own private email address.

## How it works

Email Relay relies on Sendgrid's inbound parse webhook to receive your emails. 

### Incoming

Once Sendgrid receives an email it will send a webhook event to the relay server including the contents of the email message. The relay server then sends the email to your private email address.

### Outgoing

To send emails through your private email address, add "Relay: firstname lastname <recipent-email@domain.com>" to the subject line of your message. The message will be forwarded through the relay server and will appear as if it comes from your domain.

#### Setup

1. Create a Sendgrid account.
2. Setup your DNS records to point your mx records to Sendgrid.
3. Setup [Sendgrid inbound parse](https://sendgrid.com/docs/for-developers/parsing-email/setting-up-the-inbound-parse-webhook/). Set Destination URL to https://yourdomain.tld/go. (The */go* path can be changed through [environment variables](#environment-variables))
4. Deploy the app to your server.

#### Limitations

Has a couple limitations. TODO

