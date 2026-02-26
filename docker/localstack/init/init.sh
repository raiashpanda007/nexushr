#!/bin/bash

echo "Creating S3 bucket..."
awslocal s3 mb s3://my-local-bucket || true

echo "Setting CORS policy on S3 bucket..."
awslocal s3api put-bucket-cors --bucket my-local-bucket --cors-configuration '{
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

echo "Creating ECR repo..."
awslocal ecr create-repository --repository-name my-repo || true

echo "Creating ECS cluster..."
awslocal ecs create-cluster --cluster-name my-cluster || true