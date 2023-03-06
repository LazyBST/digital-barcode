import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
import {Construct} from "constructs";
import {aws_secretsmanager, Duration, Fn} from "aws-cdk-lib";
import {SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as Path from "path";

dotenv.config()
const {
    STAGE,
    SENTRY_DSN,
    DB_SECRET_NAME,
} = process.env;

export class MigrationHandler extends cdk.Stack{
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

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

        // Read DB secret
        const secret = aws_secretsmanager.Secret.fromSecretNameV2(
            this,
            'sqs-db-secret',
            DB_SECRET_NAME ?? '')

        const binPath = lambda.Code.fromAsset(Path.join("..", "..", "backend", "bin", "migrator"));
        const migrationHandler = new lambda.Function(this, "migrator", {
            runtime: lambda.Runtime.GO_1_X,
            functionName: `${STAGE}-digital-barcode-migrator`,
            code: binPath,
            handler: "cmd/handler",
            tracing: lambda.Tracing.ACTIVE,
            timeout: Duration.seconds(60),
            memorySize: 128,
            vpc: vpc,
            vpcSubnets: {
                subnets: vpc.privateSubnets,
            },
            securityGroups: [vpcSecurityGroup],
            environment: {
                STAGE: STAGE ?? '',
                "DB_SECRET_NAME" : DB_SECRET_NAME ?? '',
                SENTRY_DSN : SENTRY_DSN || "",
                DBMATE_MIGRATIONS_DIR: "./migrations"
            },
        });

        secret.grantRead(migrationHandler)
    }
}
