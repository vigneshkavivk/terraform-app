import json
import boto3
import os
from urllib.parse import unquote
from datetime import datetime

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    print("Event received:", json.dumps(event, default=str))

    table_name = os.environ.get('DYNAMODB_TABLE_NAME')
    if not table_name:
        print("DYNAMODB_TABLE_NAME not set. Skipping DynamoDB write.")
        return {"statusCode": 200, "body": json.dumps({"message": "No DynamoDB table configured"})}

    table = dynamodb.Table(table_name)

    try:
        processed_count = 0
        for record in event.get('Records', []):
            if 's3' not in record:
                continue

            s3_info = record['s3']
            if 'object' not in s3_info:
                print("Skipping record without 'object' (e.g., DeleteMarker)")
                continue

            bucket = s3_info['bucket'].get('name')
            key = s3_info['object'].get('key')
            size = s3_info['object'].get('size', 0)
            event_time = record.get('eventTime')

            if not bucket or not key:
                print("Skipping record with missing bucket or key")
                continue

            decoded_key = unquote(key)

            item = {
                's3_object_key': decoded_key,
                'bucket_name': bucket,
                'file_size_bytes': size,
                'processed_at': context.aws_request_id
            }
            if event_time:
                item['event_time'] = event_time
            else:
                item['event_time'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')

            table.put_item(Item=item)
            print(f"Successfully processed s3://{bucket}/{decoded_key}")
            processed_count += 1

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Processed S3 events successfully",
                "processed_count": processed_count
            })
        }

    except Exception as e:
        print(f"Error processing records: {str(e)}")
        raise