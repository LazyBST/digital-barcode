#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito-stack";
import * as process from "process";

const { STAGE, CDK_DEFAULT_REGION, CDK_DEFAULT_ACCOUNT } = process.env;

const app = new cdk.App();
new CognitoStack(app, `${STAGE}-digital-barcode-cognito`, {
  env: { region: CDK_DEFAULT_REGION, account: CDK_DEFAULT_ACCOUNT },
});
