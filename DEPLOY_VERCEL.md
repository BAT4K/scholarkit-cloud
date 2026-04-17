# Deploying to Vercel

## 1. Prerequisites

- A [Vercel](https://vercel.com) account.
- A GitHub repository for this project.
- A Postgres Database (Recommended: [Neon](https://neon.tech) or Vercel Storage).

## 2. Database Setup (Neon/Vercel Postgres)

1.  Create a new project on Neon or Vercel Postgres.
2.  Get the **Connection String** (e.g., `postgres://user:pass@ep-xyz.region.aws.neon.tech/neondb?sslmode=require`).
3.  Save this string. You will need it as the `DATABASE_URL` environment variable.

## 3. Deploying the Backend (API)

1.  Push your code to GitHub.
2.  Go to Vercel Dashboard -> **Add New...** -> **Project**.
3.  Import the same repository.
4.  **Configuration**:
    -   **Project Name**: `scholarkit-api`
    -   **Root Directory**: Click `Edit` and select `backend`.
    -   **Environment Variables**:
        -   `DATABASE_URL`: Your Postgres connection string.
        -   `JWT_SECRET`: A secure random string.
        -   `RAZORPAY_KEY_ID`: Your Razorpay Key ID.
        -   `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret.
        -   `NODE_ENV`: `production`
5.  Click **Deploy**.
6.  Once deployed, copy the **Deployment Domain** (e.g., `https://scholarkit-api.vercel.app`).

## 4. Deploying the Frontend (Web)

1.  Go to Vercel Dashboard -> **Add New...** -> **Project**.
2.  Import the same repository (again).
3.  **Configuration**:
    -   **Project Name**: `scholarkit-web`
    -   **Root Directory**: Click `Edit` and select `frontend`.
    -   **Framework Preset**: Vite
    -   **Environment Variables**:
        -   `VITE_API_URL`: The URL of your backend api (from Step 3), e.g., `https://scholarkit-api.vercel.app`.
        -   `VITE_RAZORPAY_KEY`: Your Razorpay Key ID (public).
4.  Click **Deploy**.

## 5. Final Check

1.  Open your frontend deployment URL.
2.  Try to sign up/login.
3.  Check the network tab if API calls fail; ensure `VITE_API_URL` does NOT have a trailing slash if your code logic appends paths starting with `/`. (Current code appends `/api/...` to the base `https://scholarkit-api.vercel.app` -> `https://scholarkit-api.vercel.app/api/...` which is correct).
