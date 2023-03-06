#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
// import DatabaseStack from "../lib/DatabaseStack";
import NetworkStack from "../lib/NetworkStack";
// import {MigrationHandler} from "../lib/MigrationHandler";

const { STAGE, CDK_DEFAULT_REGION, CDK_DEFAULT_ACCOUNT } = process.env;

const app = new cdk.App();
new NetworkStack(app);
// new DatabaseStack(app, {
//   vpc: network.vpc,
// });
// new MigrationHandler(app, 'DigitalBarcodeMigrationHandler', {
//   env: { region: CDK_DEFAULT_REGION, account: CDK_DEFAULT_ACCOUNT },
// })