# Deploying Your Application to Vercel with Firebase

Congratulations on building your app! To ensure your data is saved permanently when you deploy to Vercel, you need to connect your live application to your Firebase Firestore database.

This is done by securely adding **Environment Variables** to your Vercel project.

## Step 1: Find Your Firebase Service Account Credentials

A "service account" is a special identity your app uses to securely communicate with Firebase.

1.  **Open the Firebase Console:** Go to [https://console.firebase.google.com/](https://console.firebase.google.com/) and select your project.
2.  **Go to Project Settings:** Click the gear icon ⚙️ next to "Project Overview" in the top-left corner, and select **Project settings**.
3.  **Go to Service Accounts:** In the Project Settings, click on the **Service accounts** tab.
4.  **Generate a New Private Key:** Click the **Generate new private key** button. A confirmation pop-up will appear; click **Generate key**.
5.  **Save the JSON file:** A JSON file will be downloaded to your computer. This file contains the three secret values you need. It will look something like this:

    ```json
    {
      "type": "service_account",
      "project_id": "your-project-id-123",
      "private_key_id": "...",
      "private_key": "-----BEGIN PRIVATE KEY-----\nYourVeryLongPrivateKey\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-xyz@your-project-id-123.iam.gserviceaccount.com",
      "client_id": "...",
      "auth_uri": "...",
      "token_uri": "...",
      "auth_provider_x509_cert_url": "...",
      "client_x509_cert_url": "..."
    }
    ```

## Step 2: Add Credentials to Vercel Environment Variables

Now, you will copy the values from the downloaded JSON file into your Vercel project's settings.

1.  **Open Your Vercel Project:** Go to your Vercel dashboard and navigate to the project you deployed.
2.  **Go to Settings:** Click on the **Settings** tab.
3.  **Go to Environment Variables:** In the left sidebar, click on **Environment Variables**.
4.  **Add the Variables:** You will add three new environment variables.

    *   **Add `FIREBASE_PROJECT_ID`:**
        *   **Name:** `FIREBASE_PROJECT_ID`
        *   **Value:** Copy the `project_id` value from your downloaded JSON file.
        *   Click **Save**.

    *   **Add `FIREBASE_CLIENT_EMAIL`:**
        *   **Name:** `FIREBASE_CLIENT_EMAIL`
        *   **Value:** Copy the `client_email` value from your downloaded JSON file.
        *   Click **Save**.

    *   **Add `FIREBASE_PRIVATE_KEY`:**
        *   **Name:** `FIREBASE_PRIVATE_KEY`
        *   **Value:** This is the most important one. Copy the entire `private_key` value from your JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts.
        *   Click **Save**.

## Step 3: Redeploy the Application

After adding the environment variables, you need to trigger a new deployment on Vercel for the changes to take effect.

1.  **Go to the Deployments tab** in your Vercel project.
2.  Find the most recent deployment, click the "..." menu on the right, and select **Redeploy**.

Once the new deployment is complete, your live application will be securely connected to your Firestore database. **Any data you add or change will now be permanent!**
