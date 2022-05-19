#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServiceToServiceAuthorizationWithCognitoStack } from '../lib/service-to-service-authorization-with-cognito-stack';

const { CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION, STAGE, STACK_NAME } =
  process.env;

const app = new cdk.App();
new ServiceToServiceAuthorizationWithCognitoStack(
  app,
  'ServiceToServiceAuthorizationWithCognitoStack',
  {
    env: {
      account: CDK_DEFAULT_ACCOUNT,
      region: CDK_DEFAULT_REGION,
    },
    stackName: STACK_NAME ?? 'demo',
    stage: STAGE ?? 'dev',
  }
);
