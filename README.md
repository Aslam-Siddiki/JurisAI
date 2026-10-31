# ⚖️ JurisAI – AI-Powered Digital Alternative Dispute Resolution Platform

**Resolve Small Civil Disputes Fairly, Faster, and Without Court Battles.**

JurisAI is an AI-powered Digital Alternative Dispute Resolution (ADR) platform designed to simplify the resolution of small civil disputes through intelligent dispute analysis, evidence evaluation, financial reconciliation, and AI-assisted settlement recommendations.

The platform provides a digital environment where claimants and respondents can submit disputes, upload supporting evidence, review opposing statements, and work towards fair and mutually acceptable settlements.

---

## 🚀 Key Features

### 1. Digital Dispute Submission
- Submit disputes through an intuitive interface.
- Select dispute categories such as financial disputes, rental disputes, property disputes, and service-related disputes.
- Provide detailed descriptions of disputes.
- Register claimant and respondent information.

### 2. AI-Powered Dispute Analysis
- Analyze claimant and respondent statements.
- Identify conflicting information and inconsistencies.
- Generate structured dispute summaries.
- Provide neutral and objective AI-assisted insights.

### 3. Evidence Management
- Upload supporting documents and evidence.
- Organize evidence submitted by both parties.
- Review relevant documents during dispute evaluation.

### 4. Financial Reconciliation
- Identify financial differences between opposing parties.
- Compare claimed amounts, payments, refunds, and outstanding balances.
- Generate structured financial summaries.

### 5. AI-Assisted Settlement Recommendations
- Generate possible compromise settlement suggestions.
- Consider statements, evidence, and financial information.
- Support fair and mutually acceptable dispute resolution.

### 6. Reference Cases
- Access relevant historical reference cases.
- Use previous dispute outcomes as supporting context.
- Improve the consistency of settlement recommendations.

### 7. Dispute Management
- View submitted disputes.
- Track dispute information and progress.
- Access claimant and respondent details.

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite, HTML, CSS, JavaScript |
| Core Backend | Node.js, Express.js |
| AI Microservice | Python, FastAPI |
| Database | MongoDB Atlas |
| Database Integration | Mongoose |
| AI Integration | LLM API / Ollama |
| API Communication | REST API |
| Version Control | Git, GitHub |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

---

## 🏗️ Project Architecture

JurisAI follows a modular architecture consisting of three major application components.

```text
                 JURISAI PLATFORM
                        |
              React Frontend (Vite)
                  Port: 5173
                        |
                 Node.js Backend
                  Port: 5000
                        |
             +----------+----------+
             |                     |
        MongoDB Atlas         Python AI Service
                                  Port: 8000
                                      |
                              AI / NLP Processing
                                      |
                              Settlement Analysis
```

**Frontend:** Provides the user interface for dispute submission, evidence management, and dispute tracking.

**Node.js Backend:** Handles API requests, authentication (if enabled), business logic, and database operations.

**Python AI Microservice:** Handles AI-powered dispute analysis, NLP processing, and settlement recommendation workflows.

**MongoDB Atlas:** Stores application data in a cloud-hosted MongoDB database.

---

## 📁 Project Structure

```text
JURISAI/
│
├── ai-service/
│   └── Python AI microservice
│
├── backend/
│   └── Node.js Express backend
│       └── server.js
│
├── frontend/
│   └── React + Vite frontend
│
├── node_modules/
│
├── .env
├── .env.example
├── .gitignore
├── .dockerignore
│
├── Dockerfile
├── render.yaml
├── Procfile
│
├── package.json
├── package-lock.json
│
├── DEPLOYMENT.md
├── JURISAI_SPEC.md
└── README.md
```

---

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the application:

- Node.js and npm
- Python 3.10+
- MongoDB Atlas account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/JurisAI.git
```

Navigate to the project directory:

```bash
cd JurisAI
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as a reference.

Example configuration:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_atlas_connection_string

FRONTEND_URL=http://localhost:5173

AI_SERVICE_URL=http://127.0.0.1:8000

# Add other API credentials required by your application
```

**Important:** Never upload `.env` files, API keys, database credentials, or other sensitive information to GitHub.

### 4. Configure Python AI Microservice

Navigate to the AI service directory:

```bash
cd ai-service
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

Install the dependencies using the project's requirements file:

```bash
pip install -r requirements.txt
```

Return to the project root after installation.

### 5. Start the Application

Start the Python AI microservice:

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Start the Node.js backend:

```bash
npm start
```

Start the React frontend from its directory:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend in your browser:

```text
http://localhost:5173
```

*Note: Adjust the Python import path and npm commands if your actual package scripts or folder structure differ.*

---

## ☁️ Database Configuration – MongoDB Atlas

JurisAI uses MongoDB Atlas as its cloud database.

To configure MongoDB Atlas:

1. Create a MongoDB Atlas account.
2. Create a new cluster.
3. Create a database user.
4. Configure the Network Access IP Access List.
5. Copy the MongoDB connection string.
6. Add the connection string to your environment variables.

Example:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jurisai
```

Replace the placeholders with your actual database credentials.

---

## 🌐 Deployment

JurisAI is designed to support cloud deployment.

### Deployment Platforms

| Service | Purpose |
|---|---|
| GitHub | Source code repository |
| Render | Backend and AI service hosting |
| Vercel | Frontend hosting |
| MongoDB Atlas | Cloud database |

### Deployment Process

1. Push the project source code to GitHub.
2. Configure the required environment variables.
3. Deploy the Node.js backend.
4. Deploy the Python AI microservice.
5. Deploy the React frontend.
6. Configure frontend and backend API URLs.
7. Connect the deployed backend to MongoDB Atlas.
8. Verify all API endpoints and application workflows.

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for deployment-specific instructions.

---

## 🔐 Security Considerations

- Store sensitive credentials in environment variables.
- Never expose API keys in frontend source code.
- Configure CORS to allow only trusted frontend origins.
- Validate incoming API requests.
- Implement appropriate authentication and authorization.
- Restrict access to uploaded evidence documents.
- Use secure database credentials.
- Enable HTTPS for production deployments.

---

## 🎯 Project Objectives

- Make alternative dispute resolution more accessible.
- Reduce the time and complexity involved in resolving small civil disputes.
- Improve transparency in dispute evaluation.
- Support objective evidence and financial analysis.
- Provide AI-assisted compromise settlement recommendations.
- Reduce unnecessary dependency on traditional court proceedings.

---

## ⚠️ Disclaimer

JurisAI is an AI-assisted dispute resolution support platform. Its recommendations are intended for informational and settlement-support purposes only.

AI-generated outputs may contain errors and should not be treated as legally binding judgments, professional legal advice, or guaranteed settlement outcomes. Final settlement decisions must be made by the concerned parties.

---

## 👨‍💻 Project Information

**Project Name:** JurisAI

**Project Category:** Artificial Intelligence / Legal Technology / Alternative Dispute Resolution

**Architecture:** Full-Stack Web Application with AI Microservice

**Database:** MongoDB Atlas

**Development Status:** Preparing for Production Deployment

---

## 📜 License

This project is developed for educational and research purposes. Add an appropriate open-source license before distributing it publicly.

---

**JurisAI – Making Dispute Resolution Smarter, Simpler, and More Accessible.**