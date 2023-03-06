import { Construct } from "constructs";
import { Stack, App, RemovalPolicy, CfnOutput, StackProps } from "aws-cdk-lib";
import {
  UserPool,
  UserPoolClient,
  AccountRecovery,
  UserPoolClientIdentityProvider,
  OAuthScope,
} from "aws-cdk-lib/aws-cognito";
import * as process from "process";

const { STAGE, DOMAIN_URL } = process.env;

export class CognitoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const userPoolName = `${STAGE}-digital-barcode-user-pool`;
    const userPool = new UserPool(this, userPoolName, {
      selfSignUpEnabled: false,
      userPoolName: userPoolName,
      signInAliases: {
        username: true,
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // // 👇 User Pool Client
    const userPoolClientName = `${STAGE}-digital-barcode-user-pool-client`;
    const userPoolClient = new UserPoolClient(this, userPoolClientName, {
      userPool,
      userPoolClientName: userPoolClientName,
      authFlows: {
        adminUserPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      oAuth: {
        callbackUrls: [`${DOMAIN_URL}`],
        logoutUrls: [`${DOMAIN_URL}/login`],
        scopes: [
          OAuthScope.COGNITO_ADMIN,
          OAuthScope.EMAIL,
          OAuthScope.PROFILE,
        ],
      },
    });

    // 👇 Outputs
    new CfnOutput(this, "userPoolId", {
      value: userPool.userPoolId,
      exportName: `${STAGE}-digital-barcode-user-pool-id`,
    });
    new CfnOutput(this, "userPoolClientId", {
      value: userPoolClient.userPoolClientId,
      exportName: `${STAGE}-digital-barcode-user-pool-arn`,
    });
  }
}
