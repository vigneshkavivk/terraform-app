#!/bin/bash
# build-and-push.sh

REPO_NAME="my-production-ecr"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URL

# Build Docker image
docker build -t $REPO_NAME .

# Tag image
docker tag $REPO_NAME:latest $ECR_URL/$REPO_NAME:latest

# Push to ECR
docker push $ECR_URL/$REPO_NAME:latest

echo "Image pushed to: $ECR_URL/$REPO_NAME:latest"
