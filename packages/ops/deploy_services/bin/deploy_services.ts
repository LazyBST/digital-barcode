#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { APIStack } from '../lib/deploy_services-stack';
const { STAGE, CDK_DEFAULT_REGION, CDK_DEFAULT_ACCOUNT } = process.env;

const app = new cdk.App();

new APIStack(app, 'DigitalBarcodeAPIStack',  {
  env: { region: CDK_DEFAULT_REGION, account: CDK_DEFAULT_ACCOUNT },
});