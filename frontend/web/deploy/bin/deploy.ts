#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeployBarcodeAppStack } from '../lib/deploy-stack';
import * as process from "process";

import * as dotenv from "dotenv"

dotenv.config()

const { CDK_DEFAULT_REGION, STAGE, CDK_DEFAULT_ACCOUNT } = process.env;

const app = new cdk.App();
new DeployBarcodeAppStack(app, `${STAGE}-hotlync-barcode-website`, {
  env: { region: CDK_DEFAULT_REGION, account: CDK_DEFAULT_ACCOUNT },
});