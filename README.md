# 📹 DEMO LINK :- https://drive.google.com/file/d/1W5N6dQnSrZ3LzNdA6Z2hP7iMv72Toh2Z/view?usp=drive_link

# 💙 CareCircle — Family Health Memory & Intelligent Medical Organizer

**CareCircle** is a private, intelligent health memory platform designed for real families.

It helps households securely organize medical records, understand complex clinical lab results, track health trends over time, manage medicines and appointments, and communicate more effectively with healthcare professionals.

> **CareCircle is an informational health organizer, not a medical diagnostic or treatment system.**

---

## 🌟 Key Features

### 👨‍👩‍👧‍👦 Family Circle — Unlimited Profiles

* Create separate health profiles for parents, children, grandparents, and other family members.
* Store important information such as:

  * Blood group
  * Age
  * Gender
  * Known chronic conditions
  * Allergies
* Filter health records, appointments, medicines, and reports by family member.
* Keep the entire family's health history organized in one place.

---

### 📄 Intelligent Medical Report Digitization

Upload medical reports and automatically convert them into structured digital health records.

#### 🤖 Multimodal AI Extraction

Supports lab reports such as:

* CBC
* Lipid Panel
* Metabolic Panels
* Blood Sugar Reports
* Other laboratory reports

Reports can be uploaded as:

* PNG
* JPG / JPEG
* PDF

Powered by **Google Gemini 1.5 Flash Vision**, CareCircle extracts:

* Test name
  *Example: Hemoglobin, Platelets, RBC, Neutrophils*
* Numerical value
* Measurement unit
  *Example: `g/dL`, `10^3/µL`, `%`*
* Biological reference range
* Normal / Abnormal status

#### 🔄 Resilient OCR Fallback

If Gemini is unavailable or an API key is not configured, CareCircle can fall back to:

* **Tesseract OCR**
* Clinical regular-expression parsing
* Local rule-based processing

This allows the application to continue processing reports without depending entirely on an external AI service.

#### 🖼️ Original Document Viewer

View the original uploaded medical report alongside the extracted and digitized health metrics.

---

### 🤖 AI Health Assistant

CareCircle includes an interactive, context-aware AI health assistant.

It can query the family's digitized health records and answer informational questions such as:

> "What is Rohit's platelet count?"

or:

> "What does a high neutrophil count generally mean?"

The assistant can also:

* Explain medical terminology in simpler language.
* Summarize information from digitized reports.
* Help users prepare questions for their next doctor's appointment.
* Provide non-diagnostic health information.
* Use the family's stored health-record context when responding.

#### 🛡️ Medical Safety

The assistant is designed to remain:

* Informational
* Non-diagnostic
* Non-prescriptive
* Neutral
* Safety-focused

It does **not** prescribe medicines, diagnose diseases, or replace professional medical advice.

---

### 📊 Health Trends & Report Comparison

#### 📈 Visual Health Trends

Interactive charts powered by **Recharts** allow users to track health metrics over time.

Examples include:

* Hemoglobin
* Blood Sugar
* Cholesterol
* Platelets
* RBC
* Other extracted laboratory metrics

#### 🔍 Side-by-Side Report Comparison

Select two reports belonging to the same family member and compare their results.

CareCircle highlights metrics that:

* 📈 Increased
* 📉 Decreased
* ➡️ Remained stable

This makes it easier to understand changes between medical reports over time.

---

### 💊 Medicine Tracker

Manage medication information for each family member.

Track:

* Medicine name
* Dosage
* Frequency
* Active prescriptions
* Prescribing doctor

---

### 📅 Appointment Tracker

Keep track of upcoming medical appointments and laboratory visits.

Features include:

* Doctor appointments
* Lab appointments
* Appointment dates
* Upcoming appointment indicators
* Family-member-specific appointments

---

## 🛠️ Technology Stack

| Layer                          | Technology                                                                  |
| ------------------------------ | --------------------------------------------------------------------------- |
| **Framework**                  | [Next.js 16 (App Router)](https://nextjs.org/)                              |
| **Language**                   | [TypeScript](https://www.typescriptlang.org/)                               |
| **Styling**                    | [Tailwind CSS v4](https://tailwindcss.com/) + CSS Variables                 |
| **UI Components**              | [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/) |
| **Charts**                     | [Recharts](https://recharts.org/)                                           |
| **Authentication**             | [Clerk](https://clerk.com/)                                                 |
| **Database & ORM**             | [SQLite](https://www.sqlite.org/) + [Prisma ORM](https://www.prisma.io/)    |
| **AI / Multimodal Processing** | [Google Gemini](https://ai.google.dev/)                                     |
| **OCR Fallback**               | [Tesseract.js](https://tesseract.projectnaptha.com/)                        |

---

## 📁 Project Structure

```text
carecircle/
│
├── prisma/
│   ├── dev.db
│   └── schema.prisma
│
├── public/
│   └── uploads/
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── ai-assistant/
│   │   │   ├── appointments/
│   │   │   ├── dashboard/
│   │   │   ├── family/
│   │   │   ├── insights/
│   │   │   ├── medicines/
│   │   │   ├── reports/
│   │   │   └── timeline/
│   │   │
│   │   ├── api/
│   │   │   ├── reports/
│   │   │   ├── family/
│   │   │   ├── ai/
│   │   │   └── uploads/
│   │   │
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── Gemini integration
│   │   │   └── Clinical rule engine
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── utils.ts
│   │
│   └── types/
│
├── next.config.ts
├── package.json
├── .env.example
├── .env.local
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure the following are installed:

* **Node.js** v20.x or higher
* **npm** v10.x or higher

Check your installed versions:

```bash
node --version
npm --version
```

---

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd carecircle
```

Install dependencies:

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env.local` file in the project root.

You can use `.env.example` as a template.

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Database
DATABASE_URL="file:./dev.db"

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** If `GEMINI_API_KEY` is not provided, CareCircle can use its local Tesseract OCR and clinical rule parser as a fallback.

### 🔐 Keep Your Secrets Safe

Never commit `.env.local` or private API keys to GitHub.

Make sure your `.gitignore` contains:

```gitignore
.env
.env.local
```

---

### 4. Initialize the Database

CareCircle uses Prisma with SQLite.

Run:

```bash
npx prisma db push
```

This creates and synchronizes the local SQLite database using the Prisma schema.

You can also generate the Prisma client with:

```bash
npx prisma generate
```

---

### 5. Start the Development Server

Run:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

in your browser.

---

## 🔄 How CareCircle Works

```text
                ┌───────────────────┐
                │       User        │
                └─────────┬─────────┘
                          │
                          ▼
                ┌───────────────────┐
                │ Clerk Authentication│
                └─────────┬─────────┘
                          │
                          ▼
                ┌───────────────────┐
                │ Family Dashboard  │
                └─────────┬─────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         ┌────────┐  ┌─────────┐  ┌────────────┐
         │Reports │  │Medicine │  │Appointments│
         └───┬────┘  └─────────┘  └────────────┘
             │
             ▼
     ┌──────────────────────┐
     │ Gemini AI / Tesseract│
     │        OCR           │
     └──────────┬───────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Structured Lab Data  │
     └──────────┬───────────┘
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
   ┌───────┐ ┌──────┐ ┌──────────┐
   │Trends │ │Compare│ │AI Health │
   │       │ │Reports│ │Assistant │
   └───────┘ └──────┘ └──────────┘
```

---

## 🔒 Data Privacy

CareCircle is designed around private family health management.

* Health records are associated with the authenticated user.
* Family-member profiles are managed within the user's account.
* Extracted laboratory metrics are stored in the application's database.
* Medication and appointment information is stored as part of the user's health records.
* Original report documents are stored locally in `public/uploads/` in the current implementation.

> **Important:** Before deploying publicly, production-grade storage, access controls, encryption, backup strategies, and applicable health-data compliance requirements should be reviewed.

---

## 🔐 Security Considerations

For development:

* Clerk handles authentication.
* Prisma manages database access.
* Environment variables store API credentials.
* Local SQLite provides zero-configuration development.

For production deployment, additional security measures should be implemented, including:

* Secure cloud file storage
* Encryption at rest and in transit
* Strict authorization checks
* Secure API endpoints
* Database backups
* Audit logging
* Appropriate health-data privacy and compliance controls

---

## 🧪 Development Commands

### Start development server

```bash
npm run dev
```

### Create production build

```bash
npm run build
```

### Start production server

```bash
npm start
```

### Update Prisma database

```bash
npx prisma db push
```

### Generate Prisma Client

```bash
npx prisma generate
```

---

## ⚠️ Medical Disclaimer

CareCircle is designed **solely to help users organize, digitize, and understand personal health records in simpler language**.

It is **not a certified medical device** and does not provide:

* Medical diagnoses
* Clinical evaluations
* Treatment prescriptions
* Emergency medical advice

AI-generated information may contain errors and should not be treated as a medical diagnosis or treatment recommendation.

**Always consult a qualified doctor or healthcare professional for medical decisions.**

If you are experiencing a medical emergency, contact your local emergency medical service immediately.

---

## 📌 Important Notes

Before using CareCircle with real patient data in production:

1. Review applicable privacy and healthcare regulations.
2. Replace local file storage with secure production storage.
3. Configure production Clerk credentials.
4. Use a production-ready database where appropriate.
5. Protect all API keys and secrets.
6. Implement robust authorization for every health-data operation.
7. Review AI outputs before relying on them for health-related decisions.

---

## 🧑‍💻 Contributing

Contributions, suggestions, and improvements are welcome.

### Basic workflow

```bash
git clone <your-repo-url>
cd carecircle
npm install
git checkout -b feature/your-feature
```

Make your changes, test them locally, and create a pull request.
Open http://localhost:3000 in your web browser.
---

## 📄 License

This project is licensed under the **MIT License**.

---

## 💙 CareCircle

**Your family's health memory — organized, understandable, and accessible.**

> *Store. Understand. Track. Prepare. Care.*
