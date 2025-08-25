# Google Cloud Storage Setup Guide

## Option 1: Real GCS Bucket (Recommended)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your Project ID

### Step 2: Enable Cloud Storage API

1. Go to APIs & Services > Library
2. Search for "Cloud Storage API"
3. Click Enable

### Step 3: Create Storage Bucket

1. Go to Cloud Storage > Buckets
2. Click "Create Bucket"
3. Choose a unique bucket name (e.g., `photo-selection-app-bucket`)
4. Select region (choose closest to you)
5. Choose "Standard" storage class
6. Set access control to "Fine-grained"
7. Click Create

### Step 4: Create Service Account

1. Go to IAM & Admin > Service Accounts
2. Click "Create Service Account"
3. Name: `photo-selection-service`
4. Description: `Service account for photo selection app`
5. Click Create and Continue

### Step 5: Grant Permissions

1. Add role: `Storage Object Admin`
2. Add role: `Storage Bucket Reader`
3. Click Continue and Done

### Step 6: Create Service Account Key

1. Click on the created service account
2. Go to Keys tab
3. Click "Add Key" > "Create new key"
4. Choose JSON format
5. Download the JSON file
6. Save it as `gcs-service-account.json` in your project root

### Step 7: Set Bucket Permissions

1. Go to your bucket
2. Click on Permissions tab
3. Click "Grant Access"
4. Add your service account email
5. Assign role: `Storage Object Admin`

### Step 8: Update Environment Variables

```bash
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"
GOOGLE_APPLICATION_CREDENTIALS="./gcs-service-account.json"
```

## Option 2: Local Development Alternative

For local development without GCS setup, you can use local file storage. The app will automatically fall back to local storage when GCS is not configured.

### Benefits of Real GCS:

- ✅ Production-like environment
- ✅ Scalable storage
- ✅ CDN integration
- ✅ Image optimization options

### Benefits of Local Storage:

- ✅ No external dependencies
- ✅ Faster development
- ✅ No costs
- ✅ Works offline

## Cost Information

Google Cloud Storage pricing (as of 2024):

- **Free tier**: 5GB storage per month
- **Standard storage**: ~$0.020 per GB per month
- **Operations**: Very minimal cost for typical usage

For development, you'll likely stay within the free tier.
