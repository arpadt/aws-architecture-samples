# Authorizing service-to-service requests

A simple microservice architecture where one service calls the other.

## Authorization

Request authorization happens with Cognito and API Gateway.

## Stack

Ideally, Cognito resources should be in a separate, central resource, and the App client ID and secret should go to a secret store like Parameter Store at build time.

The service that makes the request would grab the credentials from Parameter Store.

Here the Parameter Store is skipped for now because I put everything in one stack, and the App client credentials go directly to the Lambda function.

## Deployment

You'll need `direnv` installed.

1. Create a file called `.envrc`.

2. Copy the content of `.envrc.example` to `.envrc`.

3. Give values to the environment variables.

4. Run `npm run cdk deploy` from the terminal.

## Removal

Run `npm run cdk destroy` to remove the stack.
