import { Stack, RemovalPolicy, StackProps, Fn } from 'aws-cdk-lib';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

const {
  STAGE,
} = process.env;

export class DBStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
      super(scope, id, props);

      const graphqlLambdaName = Fn.importValue(`${STAGE}-digital-barcode`);
      const importedGraphqlLambda = NodejsFunction.fromFunctionName(
        this,
        graphqlLambdaName,
        graphqlLambdaName,
      );

      // const postConfirmationTriggerLambdaName = Fn.importValue(`${STAGE}-digital-barcode-post-confirmation-handler`);
      // const importedPostConfirmationTriggerLambda = NodejsFunction.fromFunctionName(
      //   this,
      //   postConfirmationTriggerLambdaName,
      //   postConfirmationTriggerLambdaName,
      // );
      //
      // const preSignupTriggerLambdaName = Fn.importValue(`${STAGE}-digital-barcode-pre-signup-handler`);
      // const importedPreSignupTriggerLambdaName = NodejsFunction.fromFunctionName(
      //   this,
      //   preSignupTriggerLambdaName,
      //   preSignupTriggerLambdaName,
      // );

      const usersTableName = `${STAGE}-digital-barcode-users`;
      const usersTable = new Table(this, usersTableName, {
        tableName: usersTableName,
        billingMode: BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: 'property_id',
          type: AttributeType.STRING,
        },
        sortKey: {
          name: 'id',
          type: AttributeType.STRING,
        },
        removalPolicy: RemovalPolicy.RETAIN,
      });
      
      usersTable.grantFullAccess(importedGraphqlLambda)
      // usersTable.grantFullAccess(importedPostConfirmationTriggerLambda)
      // usersTable.grantFullAccess(importedPreSignupTriggerLambdaName)
      // importedGraphqlLambda.addEnvironment('USERS_TABLE', usersTable.tableName)
      // importedPostConfirmationTriggerLambda.addEnvironment('USERS_TABLE', usersTable.tableName)
      // importedPreSignupTriggerLambdaName.addEnvironment('USERS_TABLE', usersTable.tableName)
  
      const propertiesTableName = `${STAGE}-digital-barcode-properties`;
      const propertiesTable = new Table(this, propertiesTableName, {
        tableName: propertiesTableName,
        billingMode: BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING,
        },
        removalPolicy: RemovalPolicy.RETAIN,
      });
      propertiesTable.grantFullAccess(importedGraphqlLambda);

      const filesTableName = `${STAGE}-digital-barcode-files`;
      const filesTable = new Table(this, filesTableName, {
        tableName: filesTableName,
        billingMode: BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: 'property_id',
          type: AttributeType.STRING,
        },
        sortKey: {
          name: 'barcode_number',
          type: AttributeType.STRING,
        },
        removalPolicy: RemovalPolicy.RETAIN,
      });
      filesTable.grantFullAccess(importedGraphqlLambda);
    }
};