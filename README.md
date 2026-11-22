# PrepPulse QBANK (PrepDeck)

> **Semester 1 OJT Project — Polaris School of Technology**  
> **Track:** PST_PD_113 (Core Frontend & Web Development)  
> **Student Authors:** Parth Parmar & Piyush Raj  
> **Mentor / Reviewer:** Divyashant Kumar (Ms. Rao)

---

## 📌 Project Overview

**PrepPulse QBANK** (working title: *PrepDeck*) is a full-featured, responsive interview preparation platform designed for students preparing for campus placement drives and technical interviews. It provides a curated library of **72 technical interview questions** across 8 core topics, timed solution attempts, draft auto-saving, versioned solution revisions, and a complete **Mentor Review Queue** with side-by-side code inspection and constructive feedback.

The application operates as a **frontend-only web application** built with standard web technologies, using browser `localStorage` as an application-level database seeded from structured JSON data.

---

## 🛠️ Technology Stack

- **Markup & Layout:** HTML5 (semantic markup, native `<details>/<summary>` disclosure)
- **Styling:** CSS3, Bootstrap 5.3.3, Bootstrap Icons 1.11.3, CSS Custom Properties
- **Application Logic:** Vanilla JavaScript (ES6+ modular architecture, zero framework overhead)
- **State & Persistence:** Browser `localStorage` with unified repository pattern
- **Design System:** SaaS-style dark interface, high-contrast accessible badges (WCAG AA compliant)

---

## 🚀 Key Features

### 🎓 Student Workspace
1. **Student Dashboard (`student-dashboard.html`):**
   - Live metrics calculated from actual application state: Total questions, Solved, Attempted, Remaining, and Placement Readiness %.
   - **Topic-Wise Progress:** Real-time CSS progress bars across all 8 PRD topics (Arrays, Strings, Searching & Sorting, OOP, DBMS, OS, Computer Networks, HR).
   - **Difficulty Mastery:** Breakdown across Easy, Medium, and Hard tiers.
   - **Daily Practice Goal:** Interactive target setter with streak and progress celebration.
   - **Under-30s Recommendation:** Algorithmically detects the student's weakest topic and recommends an unsolved Medium question in one click.
   - **Notifications:** Dropdown alert for new mentor feedback with unread badge indicators.

2. **Question Bank (`question-bank.html`):**
   - Multi-criteria filtering: Topic (8 topics), Difficulty (Easy, Medium, Hard), Company (Amazon, Google, Microsoft, Meta, etc.), and My Status (Not Attempted, Attempted, Solved, Struggled).
   - Live keyword search across titles, prompts, and tags.
   - 1-click tag filtering: Clicking any `#tag` chip instantly filters the question bank.
   - Accessible screen-reader result announcements (`aria-live="polite"`).

3. **Solution Editor & Attempt Tracker (`question-details.html`):**
   - **Split View:** Problem prompt, input/output examples, and collapsible hints on the left; solution editor on the right.
   - **Live Timer:** Pause, resume, and record attempt duration.
   - **Language Support:** Select Python, JavaScript, Java, C++, or SQL.
   - **Monospace Code Editor:** 15px font, 1.5 line height, 5,000-character counter.
   - **Anti-Trap Keyboard Navigation:** "Tab inserts 4 spaces" switch prevents accidental keyboard traps.
   - **Auto-Save Drafts:** Automatically persists work every 1.5 seconds.
   - **Draft Restoration Banner:** Restores unsaved drafts upon return with 1-click discard option.
   - **Submission Modal:** Record self-assessed status (Solved, Struggled, Skipped) and confidence rating (1–5 stars).

4. **My Attempts & History (`attempts.html`):**
   - Tabular history of student's own attempts with time taken, review status, and unread comment indicators.
   - Strict privacy enforcement: Students only see their own attempts.

5. **Submission View & Versioned Revisions (`submission.html`):**
   - Split view of original prompt alongside submitted code.
   - **Version History Tabs (v1, v2, ...):** Preserves all historical submissions.
   - **Revision Workflow:** Students can revise their solution based on mentor comments; resubmission creates Version 2 without deleting Version 1.

---

### 👨‍🏫 Mentor Workspace
1. **Mentor Dashboard (`mentor-dashboard.html`):**
   - Real-time overview: Registered students, total questions, total submissions, pending review count, approved count, and revision requests.
   - Recent student activity feed with 1-click access to review.

2. **Review Queue (PRD S7 — Highest Priority):**
   - Centralized queue of submissions awaiting mentor review, ordered oldest-first.
   - Multi-filter by Student, Topic, and Review Status.
   - One-click review opening the side-by-side inspection page.

3. **Submission Review & Feedback (`submission.html`):**
   - Inspect student code alongside original problem prompt.
   - Comment thread with timestamps.
   - One-click review decisions: **Mark Approved** or **Request Revision**.
   - Reviewing immediately updates attempt status, removes the item from the pending queue, and generates a notification for the student.

4. **Student Management (`#students`):**
   - Detailed performance cards for all 3 demo students (Nikhil Sharma, Fatima Khan, Parth Parmar).
   - Solved vs attempted ratio, placement readiness %, and struggled questions monitor.

5. **Question Management CRUD (`#questions`):**
   - **Add New Question:** Validated modal form requiring Title, Prompt, Topic, Difficulty, and at least 1 tag, with support for Examples, Hints, and Company tags.
   - **Delete Question:** Safe deletion with confirmation.

---

### 🛡️ Access Control & Demo Tools
- **Role Guards:** Application-level route guards prevent students from accessing mentor pages (`access-denied.html`).
- **1-Click Demo Bar:** Global top bar allowing instantaneous switching between demo users (Nikhil, Fatima, Parth, and Ms. Rao).
- **Reset Demo Data:** Restores all questions, attempts, drafts, and comments to clean PRD seed defaults.

---

## 🔑 Demo Login Credentials

| Persona | Role | Username / ID | Password | Notes |
|---------|------|---------------|----------|-------|
| **Nikhil Sharma** | Student | `student1` or `nikhil` | `123` | 3rd-year CSE • 2 solved, 1 awaiting review |
| **Fatima Khan** | Student | `student2` or `fatima` | `123` | 1st-year Core • 1 revision requested |
| **Parth Parmar** | Student | `student3` or `parth` | `123` | Semester 1 OJT • 1 submission awaiting review |
| **Ms. Rao** | Mentor | `mentor1` or `rao` | `123` | Staff Software Engineer & Reviewer |

*(You can also use the 1-click switch buttons on the login pages or the top demo toolbar).*

---

## 📂 Project Directory Structure

```
preppulse-qbank/
├── index.html                 # Landing page (hero, features, role selection)
├── student-login.html         # Student authentication & 1-click demo logins
├── mentor-login.html          # Mentor authentication & 1-click demo login
├── student-dashboard.html     # Student dashboard (stats, 8 topic bars, goal, recommendations)
├── question-bank.html         # Question bank with multi-criteria filtering
├── question-details.html      # Problem details, live timer, monospace code editor, auto-save
├── attempts.html              # My Attempts submission history
├── submission.html            # Dual-view submission inspection, v1/v2 tabs, mentor comments
├── mentor-dashboard.html      # Mentor workspace (Review Queue, CRUD, Student management)
├── access-denied.html         # Access control fallback page
├── css/
│   ├── styles.css             # Landing page styles
│   ├── student-login.css      # Login page styles
│   ├── mentor-login.css       # Mentor login styles
│   └── student-dashboard.css  # Unified dashboard, high-contrast badges, split view, editor
├── js/
│   ├── storage.js             # Unified LocalStorage repository (PRD data model & 72 seed questions)
│   ├── components.js          # Shared topbar demo switcher, toast notifications, badges
│   ├── student-dashboard.js   # Student dashboard controller & metrics calculations
│   ├── question-bank.js       # Multi-criteria filtering, search, tag chips
│   ├── question-details.js    # Timer, editor, draft auto-save, attempt submission
│   ├── mentor-dashboard.js    # Review queue, student analytics, question CRUD
│   ├── student-login.js       # Student authentication handler
│   └── mentor-login.js        # Mentor authentication handler
├── data/
│   ├── questions.json         # 72 curated technical interview questions across 8 topics
│   ├── users.json             # 4 demo user profiles
│   └── seed-data.json         # Seed attempts, comments, drafts, bookmarks
├── test_journeys.js           # Automated test suite verifying User Journeys A through E
└── README.md                  # Comprehensive project documentation
```

---

## 💻 How to Run Locally

Because PrepPulse QBANK is built with pure HTML5, CSS3, and JavaScript, it requires **no backend installation, build step, or package manager**:

1. **Option 1 (VS Code Live Server — Recommended):**
   - Open the project directory in VS Code.
   - Right-click `index.html` and click **"Open with Live Server"**.

2. **Option 2 (Python Built-in HTTP Server):**
   ```bash
   cd preppulse-qbank
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your web browser.

3. **Option 3 (Direct File Open):**
   - Double-click `index.html` to open directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

---

## 🧪 Automated Testing

The project includes an automated test script (`test_journeys.js`) that validates all 5 PRD User Journeys (Journeys A, B, C, D, E) and verifies 28 distinct functional requirements:

```bash
node test_journeys.js
```

**Results:**
- ✅ 28 / 28 Automated Tests Passed (0 Failed)
- ✅ Verified: Multi-criteria filtering, question timer, draft restoration, submission creation, mentor review queue triage, revision versioning (v1/v2), mentor comments, unread badges, topic progress bars, student data isolation, and question CRUD.

---

## 📱 Responsiveness & Accessibility Audit

- **Tested Breakpoints:** 375px (Mobile), 576px (Small Tablet), 768px (Tablet), 992px (Laptop), 1280px+ (Desktop).
- **Navigation:** Bootstrap Offcanvas sidebar on mobile viewports (`< 992px`).
- **Color Contrast:** All badges strictly follow WebAIM AA standards (Easy: 6.5:1, Medium: 6.4:1, Hard: 6.8:1, Tag chips: 7.1:1).
- **Usability:** Tab key traps avoided via space-insertion toggle switch; hints use native `<details>/<summary>`.
