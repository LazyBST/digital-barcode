import { App, Duration, Fn, Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import * as process from "process";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  MethodLoggingLevel,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Tracing, LayerVersion } from "aws-cdk-lib/aws-lambda";
import * as Path from "path";
import { ApiGateway } from "aws-cdk-lib/aws-route53-targets";
import * as iam from "aws-cdk-lib/aws-iam";

const {
  STAGE,
  CDK_DEFAULT_REGION,
} = process.env;

export class APIStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    const apiGatewayName = `${STAGE}-digital-barcode-api-gateway`;
    const authorizerName = `${STAGE}-digital-barcode-authorizer`;
    const userPoolId = Fn.importValue(`${STAGE}-digital-barcode-user-pool-id`);
    const s3BucketName = Fn.importValue(`${STAGE}-digital-barcode-bucket-name`);
    console.log(s3BucketName);
    const s3BucketArn = Fn.importValue(`${STAGE}-digital-barcode-bucket-arn`);
    console.log(s3BucketArn);
    const userPool = UserPool.fromUserPoolId(
      this,
      `${STAGE}-digital-barcode-user-pool`,
      userPoolId
    );
    const authorizer = new CognitoUserPoolsAuthorizer(this, authorizerName, {
      authorizerName: authorizerName,
      cognitoUserPools: [userPool],
    });

    const domainName = "myhotlyncapp.com";
    const siteDomain = `barcodeapi.${STAGE}.${domainName}`;
    const zone = HostedZone.fromLookup(this, "zone", {
      privateZone: false,
      domainName: domainName,
    });

    const certificate = new DnsValidatedCertificate(this, "SiteCertificate", {
      domainName: siteDomain,
      hostedZone: zone,
      region: CDK_DEFAULT_REGION,
    });

    const apiGateWay = new RestApi(this, apiGatewayName, {
      description: `${STAGE?.toUpperCase()} Digital Barcode API Gateway`,
      deploy: true,
      deployOptions: {
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.ERROR,
        stageName: STAGE,
      },
      restApiName: apiGatewayName,
      defaultCorsPreflightOptions: {
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: [...Cors.DEFAULT_HEADERS, 'Access-Control-Allow-Origin'],
        allowOrigins: Cors.ALL_ORIGINS,
        maxAge: Duration.days(1),
      },
      domainName: {
        domainName: siteDomain,
        certificate: certificate,
      },
    });

    const vpcId = Fn.importValue("DigitalBarcode");
    const vpc = Vpc.fromVpcAttributes(this, "DigitalBarcode", {
      vpcId: vpcId,
      availabilityZones: Fn.getAzs(),
      privateSubnetIds: [
        Fn.importValue("DigitalBarcode-Private-Subnet-0"),
        Fn.importValue("DigitalBarcode-Private-Subnet-1"),
      ],
    });

    const securityGroup = Fn.importValue("DigitalBarcodeDefaultSecurityGroup");
    const vpcSecurityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      "VPCSecurityGroup",
      securityGroup
    );

    const lambdaARole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaARole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );

    lambdaARole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
    );


    const graphqlHandler = new lambda.Function(this, "graphqlHandler", {
      runtime: lambda.Runtime.GO_1_X,
      functionName: `${STAGE}-digital-barcode`,
      code: lambda.Code.fromAsset(Path.join("..", "..", "backend", "bin")),
      handler: "barcodeapi",
      tracing: Tracing.ACTIVE,
      timeout: Duration.seconds(60),
      memorySize: 512,
      vpc: vpc,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      securityGroups: [vpcSecurityGroup],
      role: lambdaARole
    });

    const getGraphqlHandler = new LambdaIntegration(graphqlHandler, {
      proxy: true,
    });
    graphqlHandler.addEnvironment("FILES_BUCKET_NAME", s3BucketName || "");
    graphqlHandler.addEnvironment("USERS_TABLE", `${STAGE}-digital-barcode-users`);
    graphqlHandler.addEnvironment("PROPERTIES_TABLE", `${STAGE}-digital-barcode-properties`);
    graphqlHandler.addEnvironment("FILES_TABLE", `${STAGE}-digital-barcode-files`);

    graphqlHandler.role?.attachInlinePolicy(
      new iam.Policy(this, "s3-bucket-policy", {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:GetObject", "s3:PutObject*"],
            resources: [s3BucketArn, s3BucketArn + "/*"],
          }),
        ],
      })
    );

    graphqlHandler.role?.attachInlinePolicy(
      new iam.Policy(this, "cognito-idp-policy", {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["cognito-idp:*"],
            resources: [userPool.userPoolArn, userPool.userPoolArn + "/*"],
          }),
        ],
      })
    );


    const barcodeResource = apiGateWay.root.addResource("barcode");
    barcodeResource.addMethod("POST", getGraphqlHandler, {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    const signedUrlResource = apiGateWay.root.addResource("signedURL");
    signedUrlResource.addMethod("GET", getGraphqlHandler, {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    new ARecord(this, "ARecord", {
      recordName: siteDomain,
      zone: zone,
      target: RecordTarget.fromAlias(new ApiGateway(apiGateWay)),
    });

    new CfnOutput(this, "DigitalBarcodeAPI", {
      value: graphqlHandler.functionName,
      exportName: `${STAGE}-digital-barcode`,
    });
  }
}
