import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export interface AmplifyHostingStackProps extends cdk.StackProps {
  readonly githubOwner: string;
  readonly githubRepo: string;
  readonly githubToken: string;
  readonly cognitoUserPoolId: string;
  readonly cognitoClientId: string;
  readonly apiGatewayUrl: string;
  readonly websocketUrl: string;
  readonly environment: 'dev' | 'staging' | 'production';
}

export class AmplifyHostingStack extends cdk.Stack {
  public readonly amplifyApp: amplify.CfnApp;
  public readonly appUrl: string;

  constructor(scope: Construct, id: string, props: AmplifyHostingStackProps) {
    super(scope, id, props);

    // Create IAM role for Amplify
    const amplifyRole = new iam.Role(this, 'AmplifyRole', {
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'Amplify Console role for Hermes Dispatcher Console',
      inlinePolicies: {
        AmplifyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create Amplify App
    this.amplifyApp = new amplify.CfnApp(this, 'DispatcherConsoleApp', {
      name: 'hermes-dispatcher-console',
      description: 'Hermes Dispatcher Console - Operational Control Center',
      repository: `https://github.com/${props.githubOwner}/${props.githubRepo}`,
      accessToken: props.githubToken,
      buildSpec: cdk.Fn.sub(`
version: 1
applications:
  - appRoot: hermes-dispatch/dispatcher-console
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci --cache .npm --prefer-offline
        build:
          commands:
            - echo "Building Next.js app..."
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - '.next/cache/**/*'
          - '.npm/**/*'
          - 'node_modules/**/*'
`),
      customRules: [
        {
          source: '/<*>',
          target: '/index.html',
          status: '404-200',
        },
        {
          source: '</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>',
          target: '/index.html',
          status: '200',
        },
      ],
      environmentVariables: [
        {
          name: 'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
          value: props.cognitoUserPoolId,
        },
        {
          name: 'NEXT_PUBLIC_COGNITO_CLIENT_ID',
          value: props.cognitoClientId,
        },
        {
          name: 'NEXT_PUBLIC_COGNITO_REGION',
          value: this.region,
        },
        {
          name: 'NEXT_PUBLIC_API_GATEWAY_URL',
          value: props.apiGatewayUrl,
        },
        {
          name: 'NEXT_PUBLIC_WEBSOCKET_URL',
          value: props.websocketUrl,
        },
        {
          name: 'NEXT_PUBLIC_AWS_REGION',
          value: this.region,
        },
        {
          name: 'NEXT_PUBLIC_ENVIRONMENT',
          value: props.environment,
        },
        {
          name: 'AMPLIFY_DIFF_DEPLOY',
          value: 'false',
        },
        {
          name: 'AMPLIFY_MONOREPO_APP_ROOT',
          value: 'hermes-dispatch/dispatcher-console',
        },
        {
          name: '_CUSTOM_IMAGE',
          value: 'amplify:al2023',
        },
      ],
      iamServiceRole: amplifyRole.roleArn,
      platform: 'WEB_COMPUTE',
      customHeaders: cdk.Fn.sub(`
customHeaders:
  - pattern: '**/*'
    headers:
      - key: 'Strict-Transport-Security'
        value: 'max-age=31536000; includeSubDomains'
      - key: 'X-Frame-Options'
        value: 'DENY'
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'X-XSS-Protection'
        value: '1; mode=block'
      - key: 'Referrer-Policy'
        value: 'strict-origin-when-cross-origin'
      - key: 'Permissions-Policy'
        value: 'geolocation=(self), microphone=(), camera=()'
`),
    });

    // Create main branch
    const mainBranch = new amplify.CfnBranch(this, 'MainBranch', {
      appId: this.amplifyApp.attrAppId,
      branchName: 'main',
      framework: 'Next.js - SSR',
      stage: props.environment === 'production' ? 'PRODUCTION' : 'DEVELOPMENT',
      enableAutoBuild: true,
      enablePerformanceMode: props.environment === 'production',
      enablePullRequestPreview: props.environment !== 'production',
      pullRequestEnvironmentName: 'pr',
    });

    // Create develop branch for non-production
    if (props.environment !== 'production') {
      new amplify.CfnBranch(this, 'DevelopBranch', {
        appId: this.amplifyApp.attrAppId,
        branchName: 'develop',
        framework: 'Next.js - SSR',
        stage: 'DEVELOPMENT',
        enableAutoBuild: true,
        enablePullRequestPreview: true,
        pullRequestEnvironmentName: 'pr',
      });
    }

    // Output the app URL
    this.appUrl = `https://main.${this.amplifyApp.attrDefaultDomain}`;

    new cdk.CfnOutput(this, 'AppUrl', {
      value: this.appUrl,
      description: 'Dispatcher Console URL',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: this.amplifyApp.attrAppId,
      description: 'Amplify App ID',
    });

    new cdk.CfnOutput(this, 'AmplifyConsoleUrl', {
      value: `https://console.aws.amazon.com/amplify/apps/${this.amplifyApp.attrAppId}`,
      description: 'Amplify Console URL',
    });
  }
}