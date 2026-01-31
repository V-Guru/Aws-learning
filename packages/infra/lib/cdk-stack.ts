import * as cdk from 'aws-cdk-lib';                                                                                               
import * as s3 from 'aws-cdk-lib/aws-s3';                                                                                         
import * as lambda from 'aws-cdk-lib/aws-lambda';                                                                                 
import * as apigateway from 'aws-cdk-lib/aws-apigateway';                                                                         
import * as iam from 'aws-cdk-lib/aws-iam';                                                                                       
import { Construct } from 'constructs';                                                                                           
import * as path from 'path';                                                                                                     
                                                                                                                                  
export class CdkStack extends cdk.Stack {                                                                                         
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {                                                             
    super(scope, id, props);                                                                                                      
                                                                                                                                  
    // 1. S3 Bucket for storing device data                                                                                       
    const dataBucket = new s3.Bucket(this, 'DeviceDataBucket', {                                                                  
      removalPolicy: cdk.RemovalPolicy.DESTROY,                                                                                   
      autoDeleteObjects: true,                                                                                                    
    });                                                                                                                           
                                                                                                                                  
    // 2. IAM Role for Lambda                                                                                                     
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {                                                                
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),                                                                
      managedPolicies: [                                                                                                          
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),                                   
      ],                                                                                                                          
    });                                                                                                                           
                                                                                                                                  
    // S3 permissions                                                                                                             
    dataBucket.grantWrite(lambdaRole);                                                                                            
                                                                                                                                  
    // IoT Core permissions                                                                                                       
    lambdaRole.addToPolicy(new iam.PolicyStatement({                                                                              
      effect: iam.Effect.ALLOW,                                                                                                   
      actions: ['iot:Publish'],                                                                                                   
      resources: ['*'],                                                                                                           
    }));                                                                                                                          
                                                                                                                                  
    // 3. Lambda Function                                                                                                         
    const deviceHandler = new lambda.Function(this, 'DeviceHandler', {                                                            
      runtime: lambda.Runtime.NODEJS_20_X,                                                                                        
      handler: 'index.handler',                                                                                                   
      code: lambda.Code.fromAsset(                                                                                                
        path.join(__dirname, '../../functions/device-provisioning/dist')                                                       
      ),                                                                                                                          
      role: lambdaRole,                                                                                                           
      environment: {                                                                                                              
        BUCKET_NAME: dataBucket.bucketName,                                                                                       
        IOT_ENDPOINT: 'YOUR_IOT_ENDPOINT', // Update after deployment                                                             
      },                                                                                                                          
    });                                                                                                                           
                                                                                                                                  
    // 4. API Gateway                                                                                                             
    const api = new apigateway.RestApi(this, 'DeviceApi', {                                                                       
      restApiName: 'Device Data API',                                                                                             
    });                                                                                                                           
                                                                                                                                  
    const deviceResource = api.root.addResource('device');                                                                        
    deviceResource.addMethod('POST', new apigateway.LambdaIntegration(deviceHandler));                                            
                                                                                                                                  
    // Outputs                                                                                                                    
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });                                                                        
    new cdk.CfnOutput(this, 'BucketName', { value: dataBucket.bucketName });                                                      
  }                                                                                                                               
}  