# Distributed serverless application to handle uploaded data from S3

This service will process the agents uploaded to S3 in a `json` file.

## How it works

When a file is uploaded to S3, a message to an SQS queue will be sent by S3 with the name of the bucket and the corresponding key.

The SQS queue has a Lambda function trigger set up. This Lambda function receives the bucket and object key names from SQS, and then downloads the object from the bucket. After the object has been downloaded, the function further processes the object.

If there is an error while processing the object, we'll retry two more times. If the process is still unsuccessful, the message will be sent to the dead-letter queue, and a CloudWatch Alarm is activated. The alarm will publish a message to an SNS topic, and the relevant people can be notified.

## Deployment

After cloning the project, `cd` into the `lambda-trigger-on-s3-upload` folder, and do an `npm install`.

After the dependencies have been installed, deploy the stack from the terminal. Set the `USER`, `PROFILE` and `S3_TEMPLATES_BUCKET` variables:

```bash
USER=<YOUR USERNAME> S3_TEMPLATES_BUCKET=<THE BUCKET WHERE YOU STORE THE TEMPLATES, YOU NEED TO CREATE IT SEPARATELY IN US-EAST-1> PROFILE=<YOUR AWS PROFILE> npm run deploy
```

The stack will be named as `<YOUR USERNAME>-s3-object-handler` and it will be deployed to `us-east-1`.

### Adding subscriptions

If you want to receive notifications, add your email address/phone number to the SNS topic the stack creates.

Go to SNS, select `Subscriptions` and then choose the SNS Topic and the protocol.

## Tear down

Empty the bucket that the stack created, remove any SNS subscriptions and then go to CloudFormation in the Console, select the stack and click `Delete`.
