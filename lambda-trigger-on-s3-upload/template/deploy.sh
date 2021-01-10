#!/usr/bin/env bash

aws cloudformation package \
  --template-file template/s3-sqs-lambda.yaml \
  --s3-bucket ${S3_TEMPLATES_BUCKET} \
  --output-template template/s3-sqs-lambda.packaged.yaml \
  --profile ${PROFILE}

aws cloudformation deploy \
  --template-file template/s3-sqs-lambda.packaged.yaml \
  --s3-bucket ${S3_TEMPLATES_BUCKET} \
  --stack-name ${USER}-s3-object-handler \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
      Username=${USER} \
  --region ${REGION:-"us-east-1"} \
  --profile ${PROFILE}
