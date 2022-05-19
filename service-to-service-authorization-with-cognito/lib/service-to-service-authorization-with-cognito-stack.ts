import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  NodejsFunction,
  LogLevel,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  LambdaRestApi,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import {
  OAuthScope,
  ResourceServerScope,
  UserPool,
} from 'aws-cdk-lib/aws-cognito';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

interface S2SWithCognitoProps extends StackProps {
  stackName: string;
  stage: string;
}

const lambdaFnProps: Partial<NodejsFunctionProps> = {
  bundling: {
    target: 'es2020',
    keepNames: true,
    logLevel: LogLevel.INFO,
  },
  runtime: Runtime.NODEJS_16_X,
  timeout: Duration.seconds(6),
  memorySize: 256,
  logRetention: RetentionDays.ONE_DAY,
};

export class ServiceToServiceAuthorizationWithCognitoStack extends Stack {
  constructor(scope: Construct, id: string, props: S2SWithCognitoProps) {
    super(scope, id, props);

    // Cognito User Pool setup
    const userPool = new UserPool(this, 'S2SUserPool', {
      userPoolName: `${props.stackName}-${props.stage}-UserPool`,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const readScope = new ResourceServerScope({
      scopeName: 'read.file',
      scopeDescription: 'read files',
    });
    const writeScope = new ResourceServerScope({
      scopeName: 'write.file',
      scopeDescription: 'write files',
    });
    const s2sResourceServer = userPool.addResourceServer('S2SResourceServer', {
      identifier: 'demo',
      scopes: [readScope, writeScope],
      userPoolResourceServerName: `${props.stackName}-${props.stage}-ResorceServer`,
    });
    const appClient = userPool.addClient('S2SAppClient', {
      oAuth: {
        flows: {
          clientCredentials: true,
        },
        scopes: [
          OAuthScope.resourceServer(s2sResourceServer, readScope),
          OAuthScope.resourceServer(s2sResourceServer, writeScope),
        ],
      },
      generateSecret: true,
      accessTokenValidity: Duration.minutes(60),
      refreshTokenValidity: Duration.days(30),
      userPoolClientName: `${props.stackName}-${props.stage}-AppClient`,
    });
    const cognitoDomain = userPool.addDomain('S2SDomain', {
      cognitoDomain: {
        domainPrefix: `${props.stackName}-${props.stage}-domain`,
      },
    });
    const describeCognitoUserPoolClient = new AwsCustomResource(
      this,
      'DescribeCognitoUserPoolClient',
      {
        resourceType: 'Custom::DescribeCognitoUserPoolClient',
        onCreate: {
          region: Stack.of(this).region,
          service: 'CognitoIdentityServiceProvider',
          action: 'describeUserPoolClient',
          parameters: {
            UserPoolId: userPool.userPoolId,
            ClientId: appClient.userPoolClientId,
          },
          physicalResourceId: PhysicalResourceId.of(appClient.userPoolClientId),
        },
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      }
    );

    const userPoolClientSecret = describeCognitoUserPoolClient.getResponseField(
      'UserPoolClient.ClientSecret'
    );

    // API Setup
    const apiHandler = new NodejsFunction(this, 'api', {
      ...lambdaFnProps,
      functionName: `${props.stackName}-${props.stage}-ApiHandlerFn`,
    });

    const api = new LambdaRestApi(this, 'FilesApi', {
      handler: apiHandler,
      deploy: true,
      description: 'API with Cognito authorization',
      proxy: false,
    });
    const authorizer = new CognitoUserPoolsAuthorizer(this, 'FilesAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: `${props.stackName}-${props.stage}-CognitoAuthorizer`,
    });

    const files = api.root.addResource('files');
    const getFilesScope = `${s2sResourceServer.userPoolResourceServerId}/${readScope.scopeName}`;
    files.addMethod('GET', new LambdaIntegration(apiHandler), {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
      authorizationScopes: [getFilesScope],
    });

    // Calling service
    new NodejsFunction(this, 'caller', {
      ...lambdaFnProps,
      environment: {
        APP_CLIENT_ID: appClient.userPoolClientId,
        APP_CLIENT_SECRET: userPoolClientSecret,
        FILES_SERVICE_URL: `${api.url}files`,
        COGNITO_DOMAIN: `https://${cognitoDomain.domainName}.auth.${
          Stack.of(this).region
        }.amazoncognito.com`,
      },
      functionName: `${props.stackName}-${props.stage}-CallingServiceFn`,
    });
  }
}
