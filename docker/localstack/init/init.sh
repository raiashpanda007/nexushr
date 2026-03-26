#!/bin/bash

REGION="ap-south-1"
ACCOUNT_ID="000000000000"

# Punch Queue
QUEUE_NAME="punch-processor"
QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$QUEUE_NAME"
QUEUE_ARN="arn:aws:sqs:$REGION:$ACCOUNT_ID:$QUEUE_NAME"

# Payroll Queue
PAYROLL_QUEUE_NAME="payroll-generation"
PAYROLL_QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$PAYROLL_QUEUE_NAME"
PAYROLL_QUEUE_ARN="arn:aws:sqs:$REGION:$ACCOUNT_ID:$PAYROLL_QUEUE_NAME"

# Payroll Batch Queue (NEW)
PAYROLL_BATCH_QUEUE_NAME="payroll-batch-generation"
PAYROLL_BATCH_QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$PAYROLL_BATCH_QUEUE_NAME"
PAYROLL_BATCH_QUEUE_ARN="arn:aws:sqs:$REGION:$ACCOUNT_ID:$PAYROLL_BATCH_QUEUE_NAME"

# Analytics Queue
ANALYTICS_QUEUE_NAME="analytics-generation"
ANALYTICS_QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$ANALYTICS_QUEUE_NAME"
ANALYTICS_QUEUE_ARN="arn:aws:sqs:$REGION:$ACCOUNT_ID:$ANALYTICS_QUEUE_NAME"

#Mail Queue
MAIL_QUEUE_NAME="mail-processor"
MAIL_QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$MAIL_QUEUE_NAME"
MAIL_QUEUE_ARN="arn:aws:sqs:$REGION:$ACCOUNT_ID:$MAIL_QUEUE_NAME"

# Resume Queue
RESUME_QUEUE_NAME="resume-processor"
RESUME_QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$RESUME_QUEUE_NAME"
RESUME_QUEUE_ARN="arn:aws:sqs:$REGION:$ACCOUNT_ID:$RESUME_QUEUE_NAME"

# Video Transcoding Queue
VIDEO_QUEUE_NAME="video-transcoding"
VIDEO_QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$VIDEO_QUEUE_NAME"
VIDEO_QUEUE_ARN="arn:aws:sqs:$REGION:$ACCOUNT_ID:$VIDEO_QUEUE_NAME"

# Video Transcode Complete Queue
TRANSCODE_COMPLETE_QUEUE_NAME="video-transcode-complete"
TRANSCODE_COMPLETE_QUEUE_URL="http://localhost:4566/$ACCOUNT_ID/$TRANSCODE_COMPLETE_QUEUE_NAME"

echo "Creating S3 buckets..."
awslocal --region $REGION s3 mb s3://register-photos || true
awslocal --region $REGION s3 mb s3://punch-photos || true
awslocal --region $REGION s3 mb s3://assets || true
awslocal --region $REGION s3 mb s3://resumes || true
awslocal --region $REGION s3 mb s3://resources || true
awslocal --region $REGION s3 mb s3://training-videos || true
awslocal --region $REGION s3 mb s3://hls-transcode || true

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

awslocal --region $REGION s3api put-bucket-cors \
  --bucket assets \
  --cors-configuration "$CORS_CONFIG"

awslocal --region $REGION s3api put-bucket-cors \
  --bucket resumes \
  --cors-configuration "$CORS_CONFIG"

awslocal --region $REGION s3api put-bucket-cors \
  --bucket resources \
  --cors-configuration "$CORS_CONFIG"

awslocal --region $REGION s3api put-bucket-cors \
  --bucket training-videos \
  --cors-configuration "$CORS_CONFIG"

awslocal --region $REGION s3api put-bucket-cors \
  --bucket hls-transcode \
  --cors-configuration "$CORS_CONFIG"

echo "Creating SQS queues..."

# Create punch queue
awslocal --region $REGION sqs create-queue \
  --queue-name $QUEUE_NAME || true

# Create payroll queue
awslocal --region $REGION sqs create-queue \
  --queue-name $PAYROLL_QUEUE_NAME || true

# Create payroll batch queue (NEW)
awslocal --region $REGION sqs create-queue \
  --queue-name $PAYROLL_BATCH_QUEUE_NAME || true

# Create analytics queue
awslocal --region $REGION sqs create-queue \
  --queue-name $ANALYTICS_QUEUE_NAME || true

# Create mail queue
awslocal --region $REGION sqs create-queue \
  --queue-name $MAIL_QUEUE_NAME || true

# Create resume queue
awslocal --region $REGION sqs create-queue \
  --queue-name $RESUME_QUEUE_NAME || true

# Create video transcoding queue
awslocal --region $REGION sqs create-queue \
  --queue-name $VIDEO_QUEUE_NAME || true

# Create video transcode complete queue
awslocal --region $REGION sqs create-queue \
  --queue-name $TRANSCODE_COMPLETE_QUEUE_NAME || true

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

echo "Attaching SQS policy to allow S3 to publish to video-transcoding queue..."

awslocal --region $REGION sqs set-queue-attributes \
  --queue-url $VIDEO_QUEUE_URL \
  --attributes Policy="{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Effect\": \"Allow\",
        \"Principal\": { \"Service\": \"s3.amazonaws.com\" },
        \"Action\": \"sqs:SendMessage\",
        \"Resource\": \"$VIDEO_QUEUE_ARN\"
      }
    ]
  }"

echo "Configuring S3 -> SQS notification for training-videos..."

awslocal --region $REGION s3api put-bucket-notification-configuration \
  --bucket training-videos \
  --notification-configuration "{
    \"QueueConfigurations\": [
      {
        \"QueueArn\": \"$VIDEO_QUEUE_ARN\",
        \"Events\": [\"s3:ObjectCreated:*\"]
      }
    ]
  }"

echo "Creating ECS cluster..."
awslocal --region $REGION ecs create-cluster \
  --cluster-name nexushr-transcoder || true

echo "Registering ECS task definition..."
TRANSCODER_IMAGE="raiashpanda007/nexushrtranscoder:latest"

awslocal --region $REGION ecs register-task-definition \
  --family video-transcoder \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "1024" \
  --memory "2048" \
  --container-definitions "[
    {
      \"name\": \"video-transcoder\",
      \"image\": \"$TRANSCODER_IMAGE\",
      \"essential\": true,
      \"environment\": [],
      \"logConfiguration\": {
        \"logDriver\": \"awslogs\",
        \"options\": {
          \"awslogs-group\": \"/ecs/video-transcoder\",
          \"awslogs-region\": \"$REGION\",
          \"awslogs-stream-prefix\": \"ecs\"
        }
      }
    }
  ]" || true

echo "LocalStack setup complete."
