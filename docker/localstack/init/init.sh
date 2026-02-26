#!/bin/bash

REGION="ap-south-1"
ACCOUNT_ID="000000000000"
QUEUE_NAME="punch-processor"
QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$QUEUE_NAME"
QUEUE_ARN="arn:aws:sqs:$REGION:$ACCOUNT_ID:$QUEUE_NAME"

echo "Creating S3 buckets..."
awslocal --region $REGION s3 mb s3://register-photos || true
awslocal --region $REGION s3 mb s3://punch-photos || true

echo "Setting CORS policy..."

CORS_CONFIG='{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

awslocal --region $REGION s3api put-bucket-cors \
  --bucket register-photos \
  --cors-configuration "$CORS_CONFIG"

awslocal --region $REGION s3api put-bucket-cors \
  --bucket punch-photos \
  --cors-configuration "$CORS_CONFIG"

echo "Creating SQS queue..."
awslocal --region $REGION sqs create-queue \
  --queue-name $QUEUE_NAME || true

echo "Attaching SQS policy to allow S3 to publish..."

awslocal --region $REGION sqs set-queue-attributes \
  --queue-url $QUEUE_URL \
  --attributes Policy="{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Effect\": \"Allow\",
        \"Principal\": { \"Service\": \"s3.amazonaws.com\" },
        \"Action\": \"sqs:SendMessage\",
        \"Resource\": \"$QUEUE_ARN\"
      }
    ]
  }"

echo "Configuring S3 -> SQS notification for punch-photos..."

awslocal --region $REGION s3api put-bucket-notification-configuration \
  --bucket punch-photos \
  --notification-configuration "{
    \"QueueConfigurations\": [
      {
        \"QueueArn\": \"$QUEUE_ARN\",
        \"Events\": [\"s3:ObjectCreated:*\"]

      }
    ]
  }"

echo "Creating ECR repo..."
awslocal --region $REGION ecr create-repository \
  --repository-name my-repo || true

echo "Creating ECS cluster..."
awslocal --region $REGION ecs create-cluster \
  --cluster-name my-cluster || true

echo "LocalStack setup complete."