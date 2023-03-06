import { App, Stack } from "aws-cdk-lib";
import { IVpc, Vpc } from "aws-cdk-lib/aws-ec2";

export default class NetworkStack extends Stack {
  readonly vpc: IVpc;
  constructor(scope: App) {
    super(scope, "digital-barcode-network-stack");
    const VPC = new Vpc(this, "DigitalBarcode", {
      vpcName: "DigitalBarcode",
      natGateways: 1,
    });

    VPC.privateSubnets.forEach((privateSubnet, index) => {
      this.exportValue(privateSubnet.subnetId, {
        name: `DigitalBarcode-Private-Subnet-${index}`,
      });
    });
    this.exportValue(VPC.vpcId, {
      name: "DigitalBarcode",
    });
    this.exportValue(VPC.vpcDefaultSecurityGroup, {
      name: "DigitalBarcodeDefaultSecurityGroup",
    });
    this.vpc = VPC;
  }
}