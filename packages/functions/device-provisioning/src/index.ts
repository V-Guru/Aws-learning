import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';                                                         
  import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';                                                                  
  import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';                                              
                                                                                                                                    
  const s3Client = new S3Client({});                                                                                                
  const iotClient = new IoTDataPlaneClient({});                                                                                     
                                                                                                                                    
  const BUCKET_NAME = process.env.BUCKET_NAME!;                                                                                     
                                                                                                                                    
  export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {                                   
    try {                                                                                                                           
      const body = JSON.parse(event.body || '{}');                                                                                  
      const deviceId = body.deviceId || 'unknown';                                                                                  
      const timestamp = Date.now();                                                                                                 
                                                                                                                                    
      // 1. Save to S3                                                                                                              
      await s3Client.send(new PutObjectCommand({                                                                                    
        Bucket: BUCKET_NAME,                                                                                                        
        Key: `devices/${deviceId}/${timestamp}.json`,                                                                               
        Body: JSON.stringify(body),                                                                                                 
        ContentType: 'application/json',                                                                                            
      }));                                                                                                                          
                                                                                                                                    
      // 2. Publish to IoT Core                                                                                                     
      await iotClient.send(new PublishCommand({                                                                                     
        topic: `device/${deviceId}/data`,                                                                                           
        payload: Buffer.from(JSON.stringify(body)),                                                                                 
      }));                                                                                                                          
                                                                                                                                    
      return {                                                                                                                      
        statusCode: 200,                                                                                                            
        body: JSON.stringify({ message: 'Data stored and published', deviceId, timestamp }),                                        
      };                                                                                                                            
    } catch (error) {                                                                                                               
      console.error('Error:', error);                                                                                               
      return {                                                                                                                      
        statusCode: 500,                                                                                                            
        body: JSON.stringify({ error: 'Failed to process data' }),                                                                  
      };                                                                                                                            
    }                                                                                                                               
  };            