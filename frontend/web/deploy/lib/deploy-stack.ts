import * as process from "process";
import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput, Aws, RemovalPolicy } from 'aws-cdk-lib';
import * as route53 from "aws-cdk-lib/aws-route53";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";
import * as targets from "aws-cdk-lib/aws-route53-targets";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dotenv from "dotenv"

dotenv.config()


const { STAGE } = process.env;

export class DeployBarcodeAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const domainName = "myhotlyncapp.com";
    const siteSubDomain = STAGE;

    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: domainName!,
    });
    const siteDomain = `${siteSubDomain}.${domainName}`;
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "cloudfront-OAI",
      {
        comment: `OAI for ${siteDomain}`,
      }
    );

    new CfnOutput(this, "Site", { value: `https://${siteDomain}` });

    const bucket = new s3.Bucket(this, "HotlyncSpaManagementPublishWebsiteBucket", {
      bucketName: `${STAGE}-hotlync-spa-managment-static-website`,
      // publicReadAccess: true,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Grant access to cloudfront
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [bucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );
    new CfnOutput(this, "Bucket", { value: bucket.bucketName });

    // TLS certificate
    const { certificateArn } = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: siteDomain,
        hostedZone: zone,
        region: "us-east-1", // Cloudfront only checks this region for certificates.
      }
    );
    new CfnOutput(this, "Certificate", { value: certificateArn });
    
    // Specifies you want viewers to use HTTPS & TLS v1.1 to request your objects
    const viewerCertificate = cloudfront.ViewerCertificate.fromAcmCertificate(
      {
        certificateArn,
        env: {
          region: Aws.REGION,
          account: Aws.ACCOUNT_ID,
        },
        applyRemovalPolicy(policy: RemovalPolicy): void {},
        node: this.node,
        stack: this,
        metricDaysToExpiry: () =>
          new cloudwatch.Metric({
            namespace: "TLS Viewer Certificate Validity",
            metricName: "TLS Viewer Certificate Expired",
          }),
      },
      {
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
        aliases: [siteDomain],
      }
    );

    // CloudFront distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "SiteDistribution",
      {
        viewerCertificate,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: bucket,
              originAccessIdentity: cloudfrontOAI,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                compress: true,
                allowedMethods:
                  cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );
    new CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone,
    });

    // Deployment
    new s3Deploy.BucketDeployment(this, "DeployCRA", {
      sources: [s3Deploy.Source.asset("../out")],
      destinationBucket: bucket,
    });
  }
}