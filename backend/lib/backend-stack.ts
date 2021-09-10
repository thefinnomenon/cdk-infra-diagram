import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as appsync from '@aws-cdk/aws-appsync';
import { AppSyncTransformer } from 'cdk-appsync-transformer';

export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* COGNITO */
    const userPool = new cognito.UserPool(this, 'chat-app-UserPool', {
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE
      },
      autoVerify: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        }
      }
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'chat-app-UserPoolClient', {
      userPool,
      authFlows: {
        // We really should use SRP instead but in the spirit of not modifying the frontend, we will use this
        userPassword: true,
      },
    });

    new cdk.CfnOutput(this, 'UserPoolIdOutput', {
      value: userPool.userPoolId
    });

    new cdk.CfnOutput(this, 'UserPoolClientIdOutput', {
      value: userPoolClient.userPoolClientId
    });

    /* APPSYNC */
    const api = new AppSyncTransformer(this, `chat-app-AppSyncApi}`, {
      schemaPath: '../src/schema.graphql',
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool,
            defaultAction: appsync.UserPoolDefaultAction.ALLOW,
          }
        },
      },
      xrayEnabled: true,
    });

    new cdk.CfnOutput(this, "AppSyncApiGraphQLUrlOutput", {
      value: api.appsyncAPI.graphqlUrl
    });
  }
}
