"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_iot_data_plane_1 = require("@aws-sdk/client-iot-data-plane");
const s3Client = new client_s3_1.S3Client({});
const iotClient = new client_iot_data_plane_1.IoTDataPlaneClient({});
const BUCKET_NAME = process.env.BUCKET_NAME;
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const deviceId = body.deviceId || 'unknown';
        const timestamp = Date.now();
        // 1. Save to S3                                                                                                              
        await s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `devices/${deviceId}/${timestamp}.json`,
            Body: JSON.stringify(body),
            ContentType: 'application/json',
        }));
        // 2. Publish to IoT Core                                                                                                     
        await iotClient.send(new client_iot_data_plane_1.PublishCommand({
            topic: `device/${deviceId}/data`,
            payload: Buffer.from(JSON.stringify(body)),
        }));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data stored and published', deviceId, timestamp }),
        };
    }
    catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process data' }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map