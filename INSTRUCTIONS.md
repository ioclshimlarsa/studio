
# Deploying Your Application to Vercel with Firebase

Congratulations on building your app! To get your deployed application running, you need to perform two steps:

1.  **Create your Admin User.**
2.  **Connect your app to your Firebase database.**

## Step 1: Create the Admin User

Because your application now connects to a live, empty database, you must first create the initial admin user.

1.  **Open the Admin Dashboard:** After your first successful deployment, go to the Admin Dashboard page by adding `/admin/dashboard` to your Vercel URL.
2.  **Go to "Manage Users":** Click on the "Manage Users" tab.
3.  **Use the "Create New User" form:** Fill out the form with the following credentials for your admin account:
    *   **Full Name:** `Admin` (or your preferred name)
    *   **Email Address:** Your email
    *   **User ID:** `admin01` (This exact ID is required to get admin privileges)
    *   **Password:** A secure password of your choice.
4.  **Click "Create User".**

You can now log out and log back in using the credentials you just created to access the full admin dashboard.

## Step 2: Find Your Firebase Service Account Credentials

A "service account" is a special identity your app uses to securely communicate with Firebase.

1.  **Open the Firebase Console:** Go to [https://console.firebase.google.com/](https://console.firebase.google.com/) and select your project.
2.  **Go to Project Settings:** Click the gear icon ⚙️ next to "Project Overview" in the top-left corner, and select **Project settings**.
3.  **Go to Service Accounts:** In the Project Settings, click on the **Service accounts** tab.
4.  **Generate a New Private Key:** Click the **Generate new private key** button. A confirmation pop-up will appear; click **Generate key**.
5.  **Save the JSON file:** A JSON file will be downloaded to your computer. This file contains the three secret values you need.

## Step 3: Add Credentials to Vercel Environment Variables

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

## Step 4: Redeploy the Application

After adding the environment variables, you need to trigger a new deployment on Vercel for the changes to take effect.

1.  **Go to the Deployments tab** in your Vercel project.
2.  Find the most recent deployment, click the "..." menu on the right, and select **Redeploy**.

Once the new deployment is complete, your live application will be securely connected to your Firestore database.
