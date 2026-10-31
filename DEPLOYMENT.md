# JurisAI — Production Deployment & MongoDB Atlas Setup Guide

This guide details how to configure **Cloud MongoDB Atlas**, verify your setup, and deploy **JurisAI** into production.

---

## 1. Cloud MongoDB Atlas Setup Guide (Step-by-Step)

JurisAI uses MongoDB for storing user accounts, disputes, confidential evidence metadata, and advisory decision reports.

### Step 1.1: Create a Free MongoDB Atlas Account & Cluster
1. Sign in or sign up at [MongoDB Cloud Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create** and select the **M0 Free** shared tier.
3. Select your preferred Cloud Provider (AWS, GCP, or Azure) and nearest region.
4. Name your cluster (e.g. `jurisai-cluster`) and click **Create Deployment**.

### Step 1.2: Configure Network Access (Whitelist IP)
Cloud platforms (Render, Railway, AWS, Vercel) use dynamic outbound IPs. You must whitelist global outbound access:
1. In the left navigation, under **Security**, click **Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access From Anywhere** (`0.0.0.0/0`).
4. Click **Confirm**. (Status will turn to *Active* within ~30 seconds).

### Step 1.3: Create Database User Credentials
1. In the left navigation, under **Security**, click **Database Access**.
2. Click **Add New Database User**.
3. Select **Password Authentication**.
4. Enter a Username (e.g., `jurisai_user`).
5. Enter a secure Password (e.g., `JurisAi2026SecurePass!`).
6. Under **Database User Privileges**, select **Read and write to any database** (or assign Built-in role: *Atlas admin*).
7. Click **Add User**.

> [!IMPORTANT]
> **Special Characters in Passwords**: If your database password contains special characters such as `@`, `:`, `/`, `?`, `#`, `[`, `]`, or `%`, you must **URL-encode** them in the connection string (e.g., replace `@` with `%40`, `#` with `%23`). Alternatively, use an alphanumeric password.

### Step 1.4: Obtain Your MongoDB Atlas Connection String
1. In the left navigation, click **Database** to view your cluster.
2. Click **Connect**.
3. Under *Connect to your application*, choose **Drivers**.
4. Select **Node.js** as the driver.
5. Copy the connection string. It will look like this:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add the database name `/jurisai` right before the `?` query string:
   ```
   mongodb+srv://jurisai_user:YOUR_PASSWORD@cluster0.abcde.mongodb.net/jurisai?retryWrites=true&w=majority
   ```

---

## 2. Testing Your MongoDB Atlas Connection

JurisAI includes a diagnostic CLI test script that verifies:
- Connection string syntax and placeholder replacement
- TLS handshake and cloud cluster ping latency
- Read/write database permissions

### How to test:
1. Open your `.env` (or `backend/.env`) file and set:
   ```env
   MONGO_URI=mongodb+srv://your_user:your_password@cluster0.abcde.mongodb.net/jurisai?retryWrites=true&w=majority
   ```
2. Run the test command:
   ```bash
   npm run test:db
   ```
3. A successful test will output:
   ```
   ============================================================
          JurisAI — MongoDB Atlas Connection Diagnostic        
   ============================================================
   [1] Configuration Check:
       Target URI: mongodb+srv://your_user:******@cluster0.abcde.mongodb.net/jurisai
       Protocol: Cloud MongoDB Atlas (SRV / TLS)
       ✅ URI syntax format is valid.

   [2] Attempting Live Cloud Connection...
       ✅ Connected successfully in 842ms!
       Connected Host: cluster0-shard-00-00.abcde.mongodb.net
       Database Name:  jurisai
       Ready State:    1 (Connected)

   [3] Admin Ping & Latency Test...
       ✅ Cluster responded to ping in 35ms.

   [4] Database Permissions Check (Listing Collections)...
       ✅ Collections retrieved successfully.

   ============================================================
   🎉 SUCCESS: MongoDB Atlas database is ready for production!
   ============================================================
   ```

---

## 3. Production Hardening Applied to Codebase

The following production-readiness enhancements have been implemented:

| Feature | Description | File |
| :--- | :--- | :--- |
| **Resilient DB Pooling** | Connection pooling (`maxPoolSize: 10`, `minPoolSize: 2`), IPv4 prioritization, exponential backoff retries. | `backend/config/db.js` |
| **Credential Masking** | Passwords in `MONGO_URI` are automatically masked in logs (`******`). | `backend/config/db.js` |
| **Production CORS** | Strictly enforces `CLIENT_URL` and `ALLOWED_ORIGINS` in production; prevents unauthorized origins. | `backend/middleware/security.js` |
| **Security Headers** | Enforces `nosniff`, `SAMEORIGIN`, `XSS-Protection`, `Referrer-Policy`, and HSTS headers. | `backend/middleware/security.js` |
| **Rate Limiting** | Auth brute-force protection (15/min), AI evaluation throttling (6/min), and global DoS rate limiting (150/min). | `backend/middleware/security.js` |
| **Safe File Storage** | Upload path normalized to `backend/uploads` with directory traversal protection (`path.basename`). | `backend/middleware/upload.js` |
| **Multer Error Catch** | Catches `LIMIT_FILE_SIZE` and returns clean HTTP 400 JSON instead of 500 error crashes. | `backend/middleware/security.js` |
| **Cloud Health Probes** | `/api/health` reports status, DB latency, uptime, and memory; returns HTTP 503 if DB is disconnected. | `backend/server.js` |
| **Unified SPA Serving** | In production, Express automatically serves the built React frontend (`frontend/dist`) with client-side SPA routing fallback. | `backend/server.js` |
| **Graceful Shutdown** | Traps `SIGTERM` / `SIGINT` to cleanly drain HTTP requests and close Mongoose connections. | `backend/server.js` |

---

## 4. Deployment Options

### Option A: Unified Full-Stack Deployment (Render / Railway / Docker)
Deploy backend and frontend together on a single service. Express serves the compiled frontend.

1. **Build frontend assets:**
   ```bash
   npm run build:frontend
   ```
2. **Start production server:**
   ```bash
   npm run start:backend:prod
   ```
3. **Using Docker:**
   ```bash
   docker build -t jurisai:latest .
   docker run -p 5000:5000 --env-file .env jurisai:latest
   ```

### Option B: Split Deployment (Frontend on Vercel/Netlify, Backend on Render/Railway)
1. **Frontend (Vercel / Netlify):**
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables:
     - `VITE_API_URL=https://your-backend-api.onrender.com/api`
2. **Backend (Render / Railway / Cloud Run):**
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `node server.js`
   - Environment variables:
     - `NODE_ENV=production`
     - `MONGO_URI=mongodb+srv://...`
     - `CLIENT_URL=https://your-frontend.vercel.app`
     - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
     - `JWT_SECRET=<strong-random-key>`

---

## 5. Production Environment Variables Reference

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | App mode | `production` |
| `PORT` | No | Server port (defaults to 5000) | `5000` |
| `MONGO_URI` | **Yes** | Cloud MongoDB Atlas URI | `mongodb+srv://user:pass@cluster.mongodb.net/jurisai?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | Secret for signing user JWTs | `a9f83b28d492c10b7f6e8d1a3c5e7f9a2b4c6e8d...` |
| `CLIENT_URL` | **Yes** | Domain of frontend for CORS & links | `https://jurisai.example.com` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins | `https://jurisai.example.com,https://preview.jurisai.com` |
| `AI_SERVICE_URL` | Yes | URL of Python FastAPI service | `http://localhost:8000` or `https://ai.jurisai.example.com` |
| `AI_SERVICE_KEY` | Yes | Internal shared secret for AI calls | `super_secure_service_key_2026` |
| `SMTP_USER` | No | Gmail address for emails | `notifications@jurisai.example.com` |
| `SMTP_PASS` | No | Gmail 16-char App Password | `abcd efgh ijkl mnop` (spaces stripped automatically) |

