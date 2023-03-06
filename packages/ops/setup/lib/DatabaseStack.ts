import { Stack, Duration, Fn } from "aws-cdk-lib";
import { IVpc, Port, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import {
  Credentials,
  DatabaseClusterEngine,
  ParameterGroup,
  ServerlessCluster,
} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import * as dotenv from "dotenv";

interface Props {
  vpc: IVpc;
}

dotenv.config()
const {
  STAGE,
} = process.env;

export default class DatabaseStack extends Stack {
  constructor(scope: Construct, props: Props) {
    super(scope, "database-stack");

    const securityGroup = new SecurityGroup(this, "RDSSecurityGroup", {
      vpc: props.vpc,
      allowAllOutbound: true,
      securityGroupName: "DigitalBarcode-RDS-SG",
      description: "DigitalBarcode-RDS-SG",
    });

    const vpcSecurityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      "VPCSecurityGroup",
      Fn.importValue("DigitalBarcodeDefaultSecurityGroup")
    );
    securityGroup.addIngressRule(
      vpcSecurityGroup,
      Port.tcp(5432),
      "RDS Lambda Integration"
    );

    const databaseName = "serverless";
    const cluster = new ServerlessCluster(this, `${STAGE}-digital-barcode-serverless-db`, {
      engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: ParameterGroup.fromParameterGroupName(
        this,
        "ParameterGroup",
        "default.aurora-postgresql10"
      ),
      defaultDatabaseName: databaseName,
      vpc: props.vpc,
      scaling: { autoPause: Duration.seconds(0) },
      credentials: Credentials.fromGeneratedSecret(databaseName),
      securityGroups: [securityGroup],
      enableDataApi: true,
      deletionProtection: true,
    });
  }
}