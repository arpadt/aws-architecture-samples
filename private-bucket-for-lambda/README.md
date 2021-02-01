# Private bucket with Lambda access

Private buckets are only accessible by specific applications and are blocked from public access.

# Architecture

Private buckets are generated with the help of a restrictive bucket policy and a Gateway endpoint.

This service consists of an S3 bucket, two Lambda functions and a Gateway endpoint.

One of the functions (`UploaderFn`) is deployed within a VPC. When it wants to connect to S3 to upload an object, the route table of the subnets will direct the traffic to the Gateway endpoint. The request will go through the private network of AWS.

The `UploadViaInternetFn` is not needed in real-life scenarios. This function is not part of the VPC, and it tries to upload objects to the bucket via the public internet.

The bucket policy of the S3 bucket denies any uploads but those coming through the Gateway endpoint.

# Deployment

The stack can be deployed in the following way:

1. Log in to AWS, and navigate to CloudFormation
2. Click on `Create stack` and upload the `private-bucket-lambda.yml` template.
3. Add a stackname and a username, then tick the boxes on the last page.

# Testing

One example test file is `book.json`. The Lambda function handles book sales, and adds the current date and time to the payload.

## What works

`UploaderFn` is able to upload objects to the bucket:

1. Go to Lambda in the Console and find `UploaderFn`
2. Create a test event from the `Hello world` template, and copy the content of `book.json`
3. Invoke the function, and then check the bucket. The object should be there.

## What doesn't work

Upload through the Console or by invoking `UploadViaInternetFn` with the content of `book.json` won't work because the traffic doesn't go through the Gateway endpoint.

# Removing the stack

Delete the stack in CloudFormation.
