# AWS Cloud Infrastructure Deployment Guide (100% Free Tier)
**Smart Disaster Management & Aerial Drone Reconnaissance Platform**
**Team Members:** Prince Gupta (1032232904) & Nirmaan Pawar (1032232352)

Follow these step-by-step instructions in the [AWS Management Console](https://aws.amazon.com/console/) to deploy the entire backend and live website on AWS Free Tier for **$0 cost**.

---

## Architecture Overview

```text
[Drone Camera Module] 
        │
        ▼ (HTTPS POST)
 [Amazon API Gateway] 
        │
        ▼
   [AWS Lambda] 
   ├── 1. Uploads evidence photo ────► [Amazon S3 Bucket]
   ├── 2. Person detection score ────► [Amazon Rekognition]
   ├── 3. Indexes coordinates & state ► [Amazon DynamoDB Table]
   └── 4. Broadcasts alert (SMS/Email) ► [Amazon SNS Topic]

 [Rescue Dashboard] ◄─── (HTTPS GET/PATCH) ─── [Amazon API Gateway]
 (Hosted on S3 Static Website Hosting / AWS Amplify)
```

---

## Step 1: Create Amazon DynamoDB Table (Database)

1. Open **DynamoDB** in the AWS Console (choose region `ap-south-1` Asia Pacific - Mumbai).
2. Click **Create table**.
3. **Table name:** `DisasterIncidents`
4. **Partition key:** `incident_id` (Type: `String`)
5. Under **Table settings**, select **Customize settings**:
   - Table class: `DynamoDB Standard`
   - Read/write capacity: `On-demand` (or `Provisioned` with 5 RCU / 5 WCU for Free Tier)
6. Click **Create table**.

---

## Step 2: Create Amazon S3 Bucket (Drone Image Storage & Web Hosting)

### Part A: Storage Bucket for Drone Evidence Photos
1. Open **Amazon S3** in AWS Console.
2. Click **Create bucket**.
3. **Bucket name:** `disaster-drone-evidence-<your-name>` (must be globally unique, e.g. `disaster-drone-evidence-nirman`).
4. **AWS Region:** `ap-south-1` (Mumbai).
5. Uncheck **Block all public access** (acknowledge the warning so images can be viewed in the dashboard).
6. Click **Create bucket**.
7. Go to the newly created bucket ➔ **Permissions** tab ➔ **Bucket policy** ➔ Click **Edit** and paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::<your-bucket-name>/*"
       }
     ]
   }
   ```
8. In the **Permissions** tab, scroll to **Cross-origin resource sharing (CORS)** ➔ Edit and paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

### Part B: S3 Static Website Hosting for Rescue Dashboard (Free Public Website)
1. In S3, click **Create bucket** again.
2. **Bucket name:** `disaster-rescue-dashboard-<your-name>`.
3. Uncheck **Block all public access** and acknowledge.
4. Go to **Properties** tab ➔ Scroll to bottom ➔ **Static website hosting** ➔ Click **Edit**:
   - Select **Enable**
   - Hosting type: `Host a static website`
   - Index document: `index.html`
   - Click **Save changes**.
5. Upload all files from `rescue-dashboard/` (`index.html`, `style.css`, `app.js`) to this bucket!
6. Add the Public Read bucket policy (same as step 7 above with this bucket's name).
7. You now have a live public website URL provided at the bottom of the **Properties** tab!

---

## Step 3: Create Amazon SNS Topic (Emergency Alert Notifications)

1. Open **Amazon SNS** in AWS Console.
2. Go to **Topics** ➔ Click **Create topic**.
3. Type: `Standard`.
4. Name: `DisasterEmergencyAlerts`.
5. Display name: `RESCUE-ALERT`.
6. Click **Create topic**.
7. Copy the **Topic ARN** (e.g. `arn:aws:sns:ap-south-1:123456789012:DisasterEmergencyAlerts`).
8. Under **Subscriptions**, click **Create subscription**:
   - Protocol: `Email` (or `SMS`)
   - Endpoint: Enter your email address (e.g. `nirman@example.com`).
   - Click **Create subscription**.
9. Check your email inbox and click **"Confirm subscription"**!

---

## Step 4: Create IAM Role for AWS Lambda

1. Open **IAM** console ➔ **Roles** ➔ Click **Create role**.
2. Trusted entity type: `AWS service`, Use case: `Lambda`.
3. Attach the following managed policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonSNSFullAccess`
   - `AmazonRekognitionReadOnlyAccess`
   - `AWSLambdaBasicExecutionRole`
4. Name the role: `DisasterLambdaExecutionRole` and click **Create role**.

---

## Step 5: Create AWS Lambda Function (Serverless Incident Engine)

1. Open **AWS Lambda** in AWS Console.
2. Click **Create function**.
3. Function name: `DisasterIncidentProcessor`.
4. Runtime: `Python 3.11` (or Python 3.10/3.12).
5. Architecture: `x86_64`.
6. Under **Change default execution role**, select **Use an existing role**:
   - Choose `DisasterLambdaExecutionRole`.
7. Click **Create function**.
8. In the **Code source** editor:
   - Open `lambda_function.py`.
   - Replace all code with the code inside your local `backend/lambda_function.py`.
   - Click **Deploy**.
9. Go to the **Configuration** tab:
   - **General configuration**: Set **Timeout** to `15 seconds`.
   - **Environment variables**: Add:
     - `DYNAMODB_TABLE` = `DisasterIncidents`
     - `S3_BUCKET` = `<your-s3-evidence-bucket-name>`
     - `SNS_TOPIC_ARN` = `<your-sns-topic-arn>`
     - `AWS_REGION` = `ap-south-1`

---

## Step 6: Create Amazon API Gateway (REST API Endpoint)

1. Open **API Gateway** in AWS Console.
2. Scroll to **REST API** (not HTTP API) and click **Build**.
3. API name: `DisasterManagementAPI`.
4. Endpoint Type: `Regional`. Click **Create API**.
5. Click **Create resource**:
   - Resource path: `/`
   - Resource name: `incidents`
   - Enable **CORS**: Check ✅
   - Click **Create resource**.
6. Select `/incidents` resource ➔ Click **Create method**:
   - Method type: `ANY` (or create `GET` and `POST`)
   - Integration type: `Lambda function`
   - Lambda proxy integration: **Check ✅ (Very Important!)**
   - Lambda function: Select `DisasterIncidentProcessor`.
   - Click **Create method**.
7. Create sub-resource for status updates:
   - Click `/incidents` ➔ **Create resource**.
   - Resource path: `{id}`
   - Resource name: `{id}` ➔ Create resource.
   - Under `/{id}`, create resource `status` with method `ANY` (Proxy to Lambda, Enable CORS).
8. Click **Deploy API**:
   - Deployment stage: `[New Stage]`
   - Stage name: `prod`
   - Click **Deploy**.
9. Copy your **Invoke URL**:
   ```
   https://xyz123456.execute-api.ap-south-1.amazonaws.com/prod
   ```
10. Your final endpoints are:
    - `https://xyz123456.execute-api.ap-south-1.amazonaws.com/prod/incidents`

---

## Step 7: Plug Endpoint into Dashboard and Drone Module

1. Open `rescue-dashboard/index.html` (or in your S3 hosted website) and paste the invoke URL into the topbar **AWS Endpoint** input box.
2. Open `drone-recon-camera/index.html` and paste the URL in the **API Gateway Endpoint** field.
3. Every drone sighting you transmit will now:
   - Call AWS API Gateway via HTTPS
   - Trigger AWS Lambda
   - Upload drone imagery to Amazon S3
   - Save record to Amazon DynamoDB
   - Fire instant alert email/SMS via Amazon SNS
   - Display on the live Leaflet map with Boat/Road navigation!
