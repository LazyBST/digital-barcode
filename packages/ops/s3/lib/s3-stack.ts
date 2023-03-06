import { App, Duration, Fn, Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import * as cdk from 'aws-cdk-lib';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from "aws-cdk-lib/aws-iam";


const {
  STAGE,
  CDK_DEFAULT_REGION,
  CDK_DEFAULT_ACCOUNT,
} = process.env;

export class S3Stack extends Stack {
  constructor(scope: App, id: string, props: StackProps){
    super(scope, id, props);
    const bucketName = `${STAGE}-digital-barcode-files-data`
    const s3Bucket = new s3.Bucket(this,`${STAGE}DigitalBarcodeData`,{
      bucketName: bucketName,
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['Content-Type','Authorization','AccessToken'],
        }
      ],
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(90)
        }
      ],

    });
    new CfnOutput(this, "s3Bucket", {
      value: s3Bucket.bucketName,
      exportName: `${STAGE}-digital-barcode-bucket-name`,
    });
    new CfnOutput(this, "s3Arn", {
      value: s3Bucket.bucketArn,
      exportName: `${STAGE}-digital-barcode-bucket-arn`,
    });
  }
}
