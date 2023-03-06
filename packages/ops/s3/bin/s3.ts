#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import * as process from "process";

const {
  STAGE,
  CDK_DEFAULT_REGION,
  CDK_DEFAULT_ACCOUNT,
} = process.env;

const app = new cdk.App();
new S3Stack(app, `${STAGE}-S3Stack`, {
   env: { region: CDK_DEFAULT_REGION, account: CDK_DEFAULT_ACCOUNT },
});
