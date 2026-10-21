# 🌈 Benim Dünyam (My World)

**Team:** Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak — YZTA Bootcamp Group 106

**Benim Dünyam** ("My World") is a fun and accessible education and daily-life support app built for children with special needs (dyslexia, dyscalculia, etc.). It offers children gamified learning activities, emotion tracking and an AI-powered chat companion (Catbot), and gives parents a dashboard to follow their child's progress.

**Demo Video**
https://www.youtube.com/watch?v=usF_1fj-BL8

Developed as part of YZTA Bootcamp Group 106.

> **Note:** the app's user interface is in Turkish. Some file names and API routes use Turkish words; their English meanings are given below.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technologies](#-technologies)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Running](#️-running)
- [Environment Variables (.env)](#-environment-variables-env)
- [API Endpoints](#-api-endpoints)
- [Development Process (Sprint Reports)](#-development-process-sprint-reports)

---

## ✨ Features

- **🐱 Catbot** — a child-safe, cat-character chat assistant powered by a local AI model running on Ollama. It gives rule-based, safe and consistent responses to emotional situations (sadness, fear, anxiety, fights, etc.) and AI-powered conversation on other topics.
- **😊 Emotion Cards** — a module where the child can pick and record how they feel, and the parent can follow along.
- **🍎 Number Garden** — addition, subtraction, multiplication and division exercises with fruit for children with dyscalculia (difficulty with math).
- **✏️ Writing Workshop** — listen-and-write exercises and letter-discrimination games for children with dyslexia.
- **📅 My Day** — a daily to-do list, planner and AI-powered day-planning chat.
- **🌟 Gamification** — XP earned through correct answers and completed sessions, level progression and badges (🥉🥈🥇).
- **♿ Accessibility** — font size control, high-contrast mode, a dyslexia-friendly font option and read-aloud (text-to-speech).
- **🌿 Calm-Down Break** — a breathing exercise screen for moments of anxiety.
- **⚙️ Parent Dashboard** — a PIN-protected panel to view the child's game statistics and progress.

## 🛠 Technologies

**Backend**
- Node.js + Express
- File-based JSON database (no external database required)
- Local LLM integration with [Ollama](https://ollama.com) (for Catbot and the day-planning assistant)

**Frontend**
- Plain HTML, CSS and JavaScript (no framework)
- Web Speech API (read-aloud and voice commands)

## 📁 Project Structure

```
benim_dunyam/
├── backend/
│   ├── server.js            # Express server, main entry point
│   ├── db.js                # JSON file-based database layer
│   ├── ollama.js            # Communication layer with Ollama (local LLM)
│   ├── benim_dunyam.json    # Database file (created automatically)
│   ├── .env                 # Environment variables (you need to create it)
│   └── routes/
│       ├── profil.js        # Child profile CRUD operations
│       ├── duygu.js         # Emotion card records
│       ├── gorevler.js      # Daily to-do list
│       ├── skorlar.js       # Game scores and statistics
│       ├── onemliGunler.js  # Important days / birthdays etc.
│       ├── planlayici.js    # Day planner
│       ├── ai.js            # Catbot and AI-powered day-plan endpoints
│       └── ebeveyn.js       # Parent dashboard PIN verification
└── frontend/
    ├── ana-sayfa.html       # Home page / dashboard
    ├── profil.html          # Profile creation and editing
    ├── index.html           # Emotion cards
    ├── diskalkuli.html/js   # Number Garden (math game)
    ├── disleksi.html/js     # Writing Workshop (listen-and-write)
    ├── takvim.html/js       # My Day (planner)
    ├── ebeveyn.html/js      # Parent dashboard
    ├── ortak.js             # Shared helper functions (Catbot, accessibility, profile, etc.)
    └── style.css            # Global stylesheet
```

## 🚀 Installation

### Requirements

- [Node.js](https://nodejs.org) (v18 or later recommended)
- npm (comes with Node.js)
- [Ollama](https://ollama.com) — required for Catbot and the AI-powered day-planning features (optional; without it the rest of the app keeps working normally)

### Steps

1. **Clone / download the project**

   ```bash
   git clone https://github.com/defneturgut/YZTA-Bootcamp-Grup-106.git
   cd YZTA-Bootcamp-Grup-106
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Create the `.env` file**

   The `.env` file is not included in the repo for security reasons (it is in `.gitignore`). Create it by copying the example file inside the `backend/` folder:

   ```bash
   cp .env.example .env
   ```

   Adjust the values for your environment if needed (see [Environment Variables](#-environment-variables-env) below). **Note:** if there is no `.env` file, variables such as `OLLAMA_MODEL` fall back to the defaults in the code — so don't skip this step.

4. **(Optional) Install Ollama and download the model**

   ```bash
   # Download Ollama from https://ollama.com, then:
   ollama pull qwen2.5:3b
   ollama serve
   ```

## ▶️ Running

From the backend folder:

```bash
# Development mode (restarts automatically on file changes)
npm run dev

# or production mode
npm start
```

When the server is up you will see this in the terminal:

```
🚀 Benim Dünyam API → http://localhost:3001
   Sağlık kontrolü  → http://localhost:3001/api/saglik
```

The backend also serves the files in the `frontend/` folder automatically. Open this address in your browser:

```
http://localhost:3001
```

> 💡 You can also open `frontend/index.html` directly in the browser via the `file://` protocol — the backend CORS settings are configured to allow this.

## 🔧 Environment Variables (.env)

The `backend/.env` file should contain the following variables:

```env
PORT=3001
DB_PATH=./benim_dunyam.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
EBEVEYN_PIN=1234
```

| Variable | Description |
|---|---|
| `PORT` | Port the backend server runs on |
| `DB_PATH` | Path to the JSON database file |
| `OLLAMA_URL` | Address of the Ollama server (default: local) |
| `OLLAMA_MODEL` | Model name used by Catbot and the day-planning assistant |
| `EBEVEYN_PIN` | 4-digit PIN code for accessing the parent dashboard |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/saglik` | Server health check |
| GET/POST/PUT | `/api/profil` | Child profile operations |
| GET/POST | `/api/duygu` | Emotion card records |
| GET/POST | `/api/gorevler` | Daily to-do list |
| GET/POST | `/api/skorlar` | Game scores and statistics |
| GET/POST | `/api/onemli-gunler` | Important days |
| GET/POST | `/api/planlayici` | Day planner |
| POST | `/api/ai/sohbet` | Chat with Catbot |
| POST | `/api/ai/gunum-sohbet` | AI-powered day-plan generation |
| POST | `/api/ebeveyn/pin-dogrula` | Parent dashboard PIN verification |

---

## 📝 Development Process (Sprint Reports)

# YZTA-Bootcamp-Grup-106

# Sprint 1

# Current Product Screenshots
<img width="1468" height="807" alt="home page" src="https://github.com/user-attachments/assets/ac163009-5b09-427e-b419-11608d3be1e0" />
<img width="1372" height="735" alt="emotion cards" src="https://github.com/user-attachments/assets/fd20d6d7-95cd-4961-95a3-4cc4060141d6" />
<img width="1318" height="614" alt="my day" src="https://github.com/user-attachments/assets/d181145d-0839-468c-b7e3-125475eabbd0" />
<img width="1195" height="740" alt="number garden" src="https://github.com/user-attachments/assets/fdc9fdca-8a5c-4c50-aa49-ffaf88c9c4b8" />
<img width="1204" height="783" alt="writing workshop" src="https://github.com/user-attachments/assets/facc099f-a7c0-473e-8c4a-328c402ed3e3" />

# Sprint Board

<img width="1596" height="909" alt="Sprint Board" src="https://github.com/user-attachments/assets/dd25742c-7d47-4f13-9d09-71df82d73422" />
<img width="607" height="864" alt="Screenshot 2026-07-05 at 19 39 32" src="https://github.com/user-attachments/assets/a0eadfb5-d49f-44bb-b104-ab93aaa32d2f" />
<img width="602" height="818" alt="Screenshot 2026-07-05 at 19 39 23" src="https://github.com/user-attachments/assets/6884a5b9-b15b-4560-95f3-94ccbfa4a8a0" />
<img width="604" height="860" alt="Screenshot 2026-07-05 at 19 39 07" src="https://github.com/user-attachments/assets/d7f49c03-df67-4250-8dab-37b06a0f9c08" />
<img width="608" height="860" alt="Screenshot 2026-07-05 at 19 39 15" src="https://github.com/user-attachments/assets/173875eb-b285-4fcc-9783-4060a2c1da9f" />
<img width="604" height="861" alt="Screenshot 2026-07-05 at 19 34 39" src="https://github.com/user-attachments/assets/a8868aad-b1a6-4aae-a5ac-c41387347f34" />
<img width="605" height="850" alt="Screenshot 2026-07-05 at 19 34 59 1" src="https://github.com/user-attachments/assets/91719f01-0cbd-4f43-b96e-774bf1ca0a74" />
<img width="595" height="849" alt="Screenshot 2026-07-05 at 19 34 59" src="https://github.com/user-attachments/assets/c385f0c9-16aa-450f-bb01-c7a42b9b6631" />

# Sprint 2 – Daily Scrum
# Daily Scrum 1

Date: 13.07.2026

Participants: Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak

What did we do?
Sprint 1 was completed successfully.
The final frontend design was decided.
The project folder structure was created.
The development environment was set up.
What will we do today?
Build the user login screen.
Create the child profile data model.
Start developing the dashboard components.
Blockers
Research is ongoing on how to design role-based authorization.

# Daily Scrum 2

Date: 18.07.2026

Participants: Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak

What did we do?
The first draft of the login and sign-up screens was completed.
Most of the dashboard components were developed.
The basic structure of the child profile screen was created.
What will we do today?
Build the teacher–parent matching infrastructure.
Make responsive layout adjustments.
Start testing the completed modules.
Blockers
Small revisions were needed to align the frontend and backend data structures.

# Sprint 2 – Sprint Review
# Sprint Goal
Build the user management infrastructure and turn the chosen UI design into a working prototype.

# Completed Work
The first version of the user sign-up and login screens was developed.
The basic structure of the dashboard page was created.
The child profile screen was designed and data entry fields were added.
A basic database structure for user roles was created.
The frontend template was integrated into the project.
Responsive design work was started.
# Demonstrated Outputs
Login screen
Dashboard screen
Child profile creation screen
Menu and navigation structure
Sprint Goal Achievement

Most of the sprint goals were completed successfully. Role-based authorization and some responsive adjustments will be completed in the next sprint.

# Sprint 2 – Sprint Retrospective
# What Went Well
Communication between team members was more organized than in the previous sprint.
Frontend development stayed on the planned schedule.
The chosen design was implemented faster than expected.
Tasks were distributed in a balanced way.
# What Could Be Improved
Backend and frontend development should move more in sync.
Code reviews should happen more often.
Test scenarios should be prepared throughout the sprint, not left until the end.
# Decisions for the Next Sprint
Start developing the IEP (individualized education plan) and education modules.
Separate the teacher and parent dashboards.
Add daily progress records and education notes to the system.
Complete the API integrations.
Include unit tests and user tests in the sprint process.

# Scrum Board
<img width="1440" height="677" alt="Screenshot 2026-07-19 at 11 54 42" src="https://github.com/user-attachments/assets/2eaa3151-4332-4ccb-b4f7-b6fb328b2c85" />

# Updated Product Screenshots
<img width="1499" height="949" alt="WhatsApp Image 2026-07-19 at 19 38 53" src="https://github.com/user-attachments/assets/a3fed64b-d426-4420-89af-db0b12c24886" />
<img width="1371" height="963" alt="WhatsApp Image 2026-07-19 at 19 38 53 (1)" src="https://github.com/user-attachments/assets/f03095d4-251e-4723-a8d7-c3367da660ff" />
<img width="1569" height="949" alt="WhatsApp Image 2026-07-19 at 19 38 53 (2)" src="https://github.com/user-attachments/assets/4c2e067d-917d-4b74-9312-75a0d79c6971" />
<img width="1460" height="794" alt="WhatsApp Image 2026-07-19 at 19 38 53 (3)" src="https://github.com/user-attachments/assets/f516b0a6-6dd9-4bf9-95f0-6b208a3fae29" />
<img width="1472" height="953" alt="WhatsApp Image 2026-07-19 at 19 38 54" src="https://github.com/user-attachments/assets/70856d7a-2e08-4705-8025-5c8fbe47a87a" />
<img width="1555" height="921" alt="WhatsApp Image 2026-07-19 at 19 38 54 (1)" src="https://github.com/user-attachments/assets/53b6b996-d873-4dec-8c80-cff83e5c7774" />

# Sprint 3

Complete the platform's Minimum Viable Product (MVP), build an AI-powered daily routine suggestion system with the Qwen model running on Ollama, integrate it into the app and make the project ready for delivery.

# Sprint Backlog

# Sprint 3 - User Story 1
AI-Powered Daily Routine Generation

Description:
Personalized daily routine suggestions will be generated with the Qwen model running on Ollama, based on the child's age, type of special need, interests and development goals entered by the parent.

Subtasks:
Task 1.1 Install Ollama and prepare the Qwen model
Task 1.2 Prepare the prompt design
Task 1.3 Integrate the AI service into the backend
Task 1.4 Show the daily routine suggestions in the user interface

# Sprint 3 - User Story 2
Completing the Education and Daily Life Modules

Description:
The education and daily life modules will be completed on top of the user infrastructure built in Sprint 2.

Subtasks:
Task 2.1 Daily routine entry screen
Task 2.2 Education activity entry screen
Task 2.3 Add the AI suggestion to the routine screen
Task 2.4 Complete the dashboard summary cards

# Sprint 3 - User Story 3
System Testing and Project Delivery

Description:
Test all modules, fix bugs and prepare the project presentation.

Subtasks:
Task 3.1 Integration tests
Task 3.2 Bug fixes
Task 3.3 User acceptance testing
Task 3.4 Prepare the final presentation and demo

# Sprint Board

Screenshot:
<img width="1440" height="670" alt="Screenshot 2026-07-30 at 16 26 44" src="https://github.com/user-attachments/assets/c6ca381b-7538-4ac6-b5f6-d086ac5c3e74" />

Sprint Backlog

Sprint 3 - User Story 1
Sprint 3 - User Story 2
Sprint 3 - User Story 3

To Do

Sprint 3 - Task 1.4 Show AI routines on the user screen
Sprint 3 - Task 2.4 Dashboard summary cards
Sprint 3 - Task 3.3 User acceptance testing
Sprint 3 - Task 3.4 Prepare the final presentation

In Progress

Sprint 3 - Task 1.1 Ollama setup and Qwen model
Sprint 3 - Task 1.2 Prompt Engineering
Sprint 3 - Task 1.3 AI Backend Integration
Sprint 3 - Task 2.1 Daily routine screen
Sprint 3 - Task 2.2 Education activity screen
Sprint 3 - Task 2.3 Integration of AI suggestions

Review

Evaluating the accuracy of AI routine suggestions
User experience testing
System performance testing

Done
Sprint 2 completed
User management module completed
Child profile module completed
Dashboard developed
Frontend template fully integrated

# Daily Scrum

# Daily Scrum 1

Date: 20.07.2026

Participants: Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak

What did we do yesterday?
Sprint 2 was completed successfully.
The Ollama environment was prepared for AI integration.
The Qwen model was downloaded and tested.

What will we do today?
Create the prompt structure.
Integrate the AI services with the backend.
Build the daily routine screen.

Blockers
Different prompts are being tried to make the outputs consistent.

# Daily Scrum 2

Date: 27.07.2026

Participants: Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak

What did we do yesterday?
The AI successfully generated a daily routine.
The dashboard started showing AI suggestions.
The education screens were completed.

What will we do today?
Run the final tests.
Fix bugs.
Prepare the demo.

Blockers
No significant blockers.

# Sprint Review

Sprint Goal:
Complete the AI-powered daily routine generation feature and build an MVP in which all modules are working.

Completed Work:
Ollama setup was completed.
The Qwen model was integrated into the system.
AI-powered daily routine generation was developed successfully.
The daily life activities module was completed.
The education activity screens were developed.
AI suggestions started being shown on the dashboard.
System tests were carried out.
The MVP version of the project was completed successfully.

Demo:
User login
Child profile creation
Education record screen
Daily routine screen
Personalized routine suggestion generated by AI
Progress tracking from the dashboard

# Sprint Retrospective

What Went Well:
Ollama and the Qwen model were integrated into the app successfully.
Task sharing within the team was efficient.
The AI outputs largely met user needs.
The planned MVP scope was completed on time.

What Could Be Improved:
AI suggestions could be personalized further with more user data.
RAG support could be added in future versions.
Performance optimizations could be made for mobile devices.
More thorough prompt and evaluation processes could be developed to improve the accuracy of AI outputs.
