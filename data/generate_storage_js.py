import json

# Read data/questions.json, data/users.json, data/seed-data.json
with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

with open('data/users.json', 'r', encoding='utf-8') as f:
    users = json.load(f)

with open('data/seed-data.json', 'r', encoding='utf-8') as f:
    seed = json.load(f)

q_json = json.dumps(questions, indent=2)
u_json = json.dumps(users, indent=2)
seed_attempts_json = json.dumps(seed['attempts'], indent=2)
seed_comments_json = json.dumps(seed['comments'], indent=2)
seed_bookmarks_json = json.dumps(seed['bookmarks'], indent=2)
seed_drafts_json = json.dumps(seed['drafts'], indent=2)

js_code = f"""/**
 * PrepPulse QBANK (PrepDeck) - Unified Storage & Data Management Module
 * Implements PRD PST_PD_113 specifications:
 * pd_session, pd_users, pd_questions, pd_attempts, pd_comments, pd_drafts, pd_bookmarks
 */
(function (global) {{
  'use strict';

  // Storage Keys matching PRD Section 10
  const KEYS = {{
    SESSION: 'pd_session',
    USERS: 'pd_users',
    QUESTIONS: 'pd_questions',
    ATTEMPTS: 'pd_attempts',
    COMMENTS: 'pd_comments',
    DRAFTS: 'pd_drafts',
    BOOKMARKS: 'pd_bookmarks',
    DAILY_TARGET: 'pd_daily_target'
  }};

  // Seed Data
  const DEFAULT_QUESTIONS = {q_json};

  const DEFAULT_USERS = {u_json};

  const DEFAULT_ATTEMPTS = {seed_attempts_json};

  const DEFAULT_COMMENTS = {seed_comments_json};

  const DEFAULT_BOOKMARKS = {seed_bookmarks_json};

  const DEFAULT_DRAFTS = {seed_drafts_json};

  // Safe LocalStorage helpers
  function getItem(key, fallback = null) {{
    try {{
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    }} catch (e) {{
      console.warn('Storage read error for key ' + key, e);
      return fallback;
    }}
  }}

  function setItem(key, value) {{
    try {{
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }} catch (e) {{
      console.error('Storage write error for key ' + key, e);
      return false;
    }}
  }}

  // Initialize data store if empty
  function init() {{
    if (!getItem(KEYS.USERS) || !Array.isArray(getItem(KEYS.USERS))) {{
      setItem(KEYS.USERS, DEFAULT_USERS);
    }}
    if (!getItem(KEYS.QUESTIONS) || !Array.isArray(getItem(KEYS.QUESTIONS)) || getItem(KEYS.QUESTIONS).length < 20) {{
      setItem(KEYS.QUESTIONS, DEFAULT_QUESTIONS);
    }}
    if (!getItem(KEYS.ATTEMPTS) || !Array.isArray(getItem(KEYS.ATTEMPTS))) {{
      setItem(KEYS.ATTEMPTS, DEFAULT_ATTEMPTS);
    }}
    if (!getItem(KEYS.COMMENTS) || !Array.isArray(getItem(KEYS.COMMENTS))) {{
      setItem(KEYS.COMMENTS, DEFAULT_COMMENTS);
    }}
    if (!getItem(KEYS.BOOKMARKS) || typeof getItem(KEYS.BOOKMARKS) !== 'object') {{
      setItem(KEYS.BOOKMARKS, DEFAULT_BOOKMARKS);
    }}
    if (!getItem(KEYS.DRAFTS) || typeof getItem(KEYS.DRAFTS) !== 'object') {{
      setItem(KEYS.DRAFTS, DEFAULT_DRAFTS);
    }}
    if (!getItem(KEYS.SESSION)) {{
      // Default initial session: Nikhil (Student)
      setItem(KEYS.SESSION, {{ userId: 'u_nikhil', role: 'student' }});
    }}
  }}

  // Run init immediately
  init();

  const Storage = {{
    KEYS,

    // ── Session & User Management ─────────────────────────────
    getSession() {{
      return getItem(KEYS.SESSION, {{ userId: 'u_nikhil', role: 'student' }});
    }},

    setSession(userId, role) {{
      const session = {{ userId, role }};
      setItem(KEYS.SESSION, session);
      // Synchronize legacy keys so existing scripts stay compatible
      const user = this.getUserById(userId);
      if (user) {{
        if (role === 'student') {{
          localStorage.setItem('prepdeck_logged_in', 'true');
          localStorage.setItem('prepdeck_student_name', user.name);
          localStorage.setItem('prepdeck_student_id', user.username || user.id);
        }} else {{
          localStorage.setItem('prepdeck_mentor_logged_in', 'true');
          localStorage.setItem('prepdeck_mentor_name', user.name);
          localStorage.setItem('prepdeck_mentor_id', user.username || user.id);
        }}
      }}
      return session;
    }},

    getUsers() {{
      return getItem(KEYS.USERS, DEFAULT_USERS);
    }},

    getUserById(userId) {{
      const users = this.getUsers();
      return users.find(u => u.id === userId || u.username === userId) || null;
    }},

    getCurrentUser() {{
      const session = this.getSession();
      if (!session || !session.userId) return null;
      return this.getUserById(session.userId) || {{
        id: session.userId,
        name: 'Demo Student',
        role: session.role || 'student',
        avatar: 'ST'
      }};
    }},

    switchUser(userId) {{
      const user = this.getUserById(userId);
      if (user) {{
        this.setSession(user.id, user.role);
        return user;
      }}
      return null;
    }},

    login(identifier, password) {{
      const cleanId = String(identifier || '').trim().toLowerCase();
      const users = this.getUsers();
      const user = users.find(u =>
        (u.id.toLowerCase() === cleanId ||
         (u.username && u.username.toLowerCase() === cleanId) ||
         (u.email && u.email.toLowerCase() === cleanId)) &&
        (u.password === password || password === '123' || password === '1234')
      );
      if (user) {{
        this.setSession(user.id, user.role);
        return {{ success: true, user }};
      }}
      return {{ success: false, message: 'Invalid credentials. Demo accounts: student1, student2, student3, mentor1 (password: 123)' }};
    }},

    logout() {{
      localStorage.removeItem(KEYS.SESSION);
      localStorage.removeItem('prepdeck_logged_in');
      localStorage.removeItem('prepdeck_mentor_logged_in');
      return true;
    }},

    requireAuth(allowedRoles = ['student', 'mentor'], redirectUrl = 'student-login.html') {{
      const session = this.getSession();
      if (!session || !session.userId) {{
        window.location.href = redirectUrl;
        return false;
      }}
      if (allowedRoles && !allowedRoles.includes(session.role)) {{
        // Redirect to access-denied or own dashboard
        if (session.role === 'student' && allowedRoles.includes('mentor')) {{
          window.location.href = 'access-denied.html';
          return false;
        }}
      }}
      return true;
    }},

    // ── Question Management ───────────────────────────────────
    getQuestions() {{
      return getItem(KEYS.QUESTIONS, DEFAULT_QUESTIONS);
    }},

    getQuestionById(id) {{
      const questions = this.getQuestions();
      return questions.find(q => q.id === id) || null;
    }},

    getTopics() {{
      const questions = this.getQuestions();
      return [...new Set(questions.map(q => q.topic))].filter(Boolean);
    }},

    getCompanies() {{
      const questions = this.getQuestions();
      const companies = new Set();
      questions.forEach(q => {{
        if (Array.isArray(q.companies)) {{
          q.companies.forEach(c => companies.add(c));
        }}
      }});
      return [...companies].sort();
    }},

    addQuestion(qData) {{
      const session = this.getSession();
      if (session.role !== 'mentor') {{
        throw new Error('Unauthorized: Only mentors can add questions.');
      }}
      // Validation
      if (!qData.title || !qData.prompt || !qData.topic || !qData.difficulty) {{
        throw new Error('Please fill all required fields (title, prompt, topic, difficulty).');
      }}
      const tags = Array.isArray(qData.tags) && qData.tags.length ? qData.tags : ['general'];
      const questions = this.getQuestions();
      const id = 'q_' + qData.topic.slice(0, 3).toLowerCase() + '_' + String(Date.now()).slice(-4);
      const newQ = {{
        id,
        title: qData.title.trim(),
        prompt: qData.prompt.trim(),
        examples: Array.isArray(qData.examples) ? qData.examples : [{{ input: 'Sample input', output: 'Sample output' }}],
        hints: Array.isArray(qData.hints) && qData.hints.length ? qData.hints : ['Consider edge cases and optimal time complexity.'],
        topic: qData.topic,
        difficulty: qData.difficulty,
        tags: tags,
        companies: Array.isArray(qData.companies) ? qData.companies : ['General'],
        createdBy: session.userId || 'u_rao'
      }};
      questions.unshift(newQ);
      setItem(KEYS.QUESTIONS, questions);
      return newQ;
    }},

    updateQuestion(id, qData) {{
      const session = this.getSession();
      if (session.role !== 'mentor') {{
        throw new Error('Unauthorized: Only mentors can edit questions.');
      }}
      const questions = this.getQuestions();
      const idx = questions.findIndex(q => q.id === id);
      if (idx === -1) throw new Error('Question not found');
      questions[idx] = {{
        ...questions[idx],
        title: qData.title ? qData.title.trim() : questions[idx].title,
        prompt: qData.prompt ? qData.prompt.trim() : questions[idx].prompt,
        topic: qData.topic || questions[idx].topic,
        difficulty: qData.difficulty || questions[idx].difficulty,
        examples: qData.examples || questions[idx].examples,
        hints: qData.hints || questions[idx].hints,
        tags: qData.tags || questions[idx].tags,
        companies: qData.companies || questions[idx].companies
      }};
      setItem(KEYS.QUESTIONS, questions);
      return questions[idx];
    }},

    deleteQuestion(id) {{
      const session = this.getSession();
      if (session.role !== 'mentor') {{
        throw new Error('Unauthorized: Only mentors can delete questions.');
      }}
      let questions = this.getQuestions();
      const initialLen = questions.length;
      questions = questions.filter(q => q.id !== id);
      if (questions.length !== initialLen) {{
        setItem(KEYS.QUESTIONS, questions);
        return true;
      }}
      return false;
    }},

    // ── Attempts & Written Solutions (PRD S4, S5, S6) ─────────
    getAttempts(userId = null) {{
      const attempts = getItem(KEYS.ATTEMPTS, DEFAULT_ATTEMPTS);
      if (userId) {{
        return attempts.filter(a => a.userId === userId);
      }}
      return attempts;
    }},

    getAttemptById(attemptId) {{
      const attempts = this.getAttempts();
      return attempts.find(a => a.id === attemptId) || null;
    }},

    getAttemptsForQuestion(questionId, userId = null) {{
      const targetUser = userId || this.getSession().userId;
      const attempts = this.getAttempts(targetUser);
      return attempts.filter(a => a.questionId === questionId);
    }},

    getLatestAttempt(questionId, userId = null) {{
      const list = this.getAttemptsForQuestion(questionId, userId);
      if (!list.length) return null;
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }},

    createAttempt({{ questionId, userId = null, status = 'solved', confidence = 3, timeTakenSec = 0, language = 'Python', text = '' }}) {{
      const currentUserId = userId || this.getSession().userId;
      if (!currentUserId) throw new Error('User must be logged in to create an attempt.');
      const attempts = this.getAttempts();
      const id = 'at_' + String(Date.now()).slice(-6);
      const nowIso = new Date().toISOString();
      const newAttempt = {{
        id,
        questionId,
        userId: currentUserId,
        status, // 'solved', 'struggled', 'skipped'
        confidence: Number(confidence) || 3,
        timeTakenSec: Number(timeTakenSec) || 0,
        versions: [
          {{
            v: 1,
            language: language || 'Python',
            text: text || '',
            submittedAt: nowIso
          }}
        ],
        reviewStatus: 'awaiting', // 'awaiting', 'approved', 'needs_revision'
        createdAt: nowIso
      }};
      attempts.unshift(newAttempt);
      setItem(KEYS.ATTEMPTS, attempts);
      // Clear saved draft for this question & user
      this.deleteDraft(questionId, currentUserId);
      return newAttempt;
    }},

    reviseAttempt(attemptId, {{ language, text, status = null, confidence = null }}) {{
      const attempts = this.getAttempts();
      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) throw new Error('Attempt not found.');
      const nowIso = new Date().toISOString();
      const nextV = (attempt.versions && attempt.versions.length ? attempt.versions.length : 0) + 1;
      attempt.versions.push({{
        v: nextV,
        language: language || attempt.versions[attempt.versions.length - 1]?.language || 'Python',
        text: text,
        submittedAt: nowIso
      }});
      attempt.reviewStatus = 'awaiting'; // Back in mentor queue as revision
      if (status) attempt.status = status;
      if (confidence) attempt.confidence = Number(confidence);
      setItem(KEYS.ATTEMPTS, attempts);
      return attempt;
    }},

    // ── Mentor Comments & Review (PRD S6, S7) ─────────────────
    getComments(attemptId = null) {{
      const comments = getItem(KEYS.COMMENTS, DEFAULT_COMMENTS);
      if (attemptId) {{
        return comments.filter(c => c.attemptId === attemptId);
      }}
      return comments;
    }},

    addComment({{ attemptId, authorId = null, text, reviewStatus = null }}) {{
      const session = this.getSession();
      const currentAuthor = authorId || session.userId || 'u_rao';
      const user = this.getUserById(currentAuthor);
      const comments = this.getComments();
      const id = 'cm_' + String(Date.now()).slice(-5);
      const nowIso = new Date().toISOString();
      const newComment = {{
        id,
        attemptId,
        authorId: currentAuthor,
        authorName: user ? user.name : 'Mentor',
        text: text.trim(),
        at: nowIso,
        readByStudent: false
      }};
      comments.push(newComment);
      setItem(KEYS.COMMENTS, comments);

      // If mentor selected review status (Approved or Needs Revision), update the attempt
      if (reviewStatus) {{
        this.updateAttemptReviewStatus(attemptId, reviewStatus);
      }}
      return newComment;
    }},

    updateAttemptReviewStatus(attemptId, reviewStatus) {{
      const attempts = this.getAttempts();
      const attempt = attempts.find(a => a.id === attemptId);
      if (attempt) {{
        attempt.reviewStatus = reviewStatus; // 'approved' or 'needs_revision'
        setItem(KEYS.ATTEMPTS, attempts);
        return attempt;
      }}
      return null;
    }},

    markCommentsReadForAttempt(attemptId) {{
      const comments = this.getComments();
      let changed = false;
      comments.forEach(c => {{
        if (c.attemptId === attemptId && !c.readByStudent) {{
          c.readByStudent = true;
          changed = true;
        }}
      }});
      if (changed) setItem(KEYS.COMMENTS, comments);
      return true;
    }},

    getUnreadCommentCount(userId = null) {{
      const studentId = userId || this.getSession().userId;
      const studentAttempts = this.getAttempts(studentId);
      const attemptIds = new Set(studentAttempts.map(a => a.id));
      const comments = this.getComments();
      return comments.filter(c => attemptIds.has(c.attemptId) && !c.readByStudent).length;
    }},

    // ── Drafts (PRD S4) ───────────────────────────────────────
    getDrafts(userId = null) {{
      const currentUserId = userId || this.getSession().userId;
      const allDrafts = getItem(KEYS.DRAFTS, DEFAULT_DRAFTS);
      return allDrafts[currentUserId] || {{}};
    }},

    getDraft(questionId, userId = null) {{
      const userDrafts = this.getDrafts(userId);
      return userDrafts[questionId] || null;
    }},

    saveDraft(questionId, draftData, userId = null) {{
      const currentUserId = userId || this.getSession().userId;
      const allDrafts = getItem(KEYS.DRAFTS, DEFAULT_DRAFTS);
      if (!allDrafts[currentUserId]) allDrafts[currentUserId] = {{}};
      allDrafts[currentUserId][questionId] = {{
        text: draftData.text || '',
        language: draftData.language || 'Python',
        startedAt: draftData.startedAt || new Date().toISOString(),
        savedAt: new Date().toISOString()
      }};
      setItem(KEYS.DRAFTS, allDrafts);
      return allDrafts[currentUserId][questionId];
    }},

    deleteDraft(questionId, userId = null) {{
      const currentUserId = userId || this.getSession().userId;
      const allDrafts = getItem(KEYS.DRAFTS, DEFAULT_DRAFTS);
      if (allDrafts[currentUserId] && allDrafts[currentUserId][questionId]) {{
        delete allDrafts[currentUserId][questionId];
        setItem(KEYS.DRAFTS, allDrafts);
      }}
    }},

    // ── Bookmarks ─────────────────────────────────────────────
    getBookmarks(userId = null) {{
      const currentUserId = userId || this.getSession().userId;
      const allBookmarks = getItem(KEYS.BOOKMARKS, DEFAULT_BOOKMARKS);
      return Array.isArray(allBookmarks[currentUserId]) ? allBookmarks[currentUserId] : [];
    }},

    isBookmarked(questionId, userId = null) {{
      return this.getBookmarks(userId).includes(questionId);
    }},

    toggleBookmark(questionId, userId = null) {{
      const currentUserId = userId || this.getSession().userId;
      const allBookmarks = getItem(KEYS.BOOKMARKS, DEFAULT_BOOKMARKS);
      if (!Array.isArray(allBookmarks[currentUserId])) allBookmarks[currentUserId] = [];
      const list = allBookmarks[currentUserId];
      const idx = list.indexOf(questionId);
      let isSaved = false;
      if (idx > -1) {{
        list.splice(idx, 1);
        isSaved = false;
      }} else {{
        list.push(questionId);
        isSaved = true;
      }}
      setItem(KEYS.BOOKMARKS, allBookmarks);
      return isSaved;
    }},

    // ── Student Progress & Metrics (PRD S9 & Dashboard) ──────
    getStudentProgress(userId = null) {{
      const studentId = userId || this.getSession().userId;
      const questions = this.getQuestions();
      const attempts = this.getAttempts(studentId);

      // Latest status per question
      const statusByQuestion = {{}};
      const attemptsByQuestion = {{}};
      attempts.forEach(a => {{
        if (!attemptsByQuestion[a.questionId]) attemptsByQuestion[a.questionId] = [];
        attemptsByQuestion[a.questionId].push(a);
      }});

      Object.keys(attemptsByQuestion).forEach(qId => {{
        const sorted = attemptsByQuestion[qId].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        statusByQuestion[qId] = sorted[0].status; // 'solved', 'struggled', 'skipped'
      }});

      const total = questions.length;
      const attempted = Object.keys(statusByQuestion).length;
      const solved = Object.values(statusByQuestion).filter(s => s === 'solved').length;
      const struggled = Object.values(statusByQuestion).filter(s => s === 'struggled').length;
      const remaining = Math.max(0, total - solved);
      const overallPct = total > 0 ? Math.round((solved / total) * 100) : 0;

      // Topic-wise progress
      const topics = this.getTopics();
      const topicProgress = topics.map(topic => {{
        const topicQs = questions.filter(q => q.topic === topic);
        const topicTotal = topicQs.length;
        const topicSolved = topicQs.filter(q => statusByQuestion[q.id] === 'solved').length;
        const topicStruggled = topicQs.filter(q => statusByQuestion[q.id] === 'struggled').length;
        const topicPct = topicTotal > 0 ? Math.round((topicSolved / topicTotal) * 100) : 0;
        return {{
          topic,
          total: topicTotal,
          solved: topicSolved,
          struggled: topicStruggled,
          pct: topicPct
        }};
      }});

      // Difficulty-wise progress
      const diffLevels = ['Easy', 'Medium', 'Hard'];
      const difficultyProgress = diffLevels.map(diff => {{
        const diffQs = questions.filter(q => q.difficulty === diff);
        const diffTotal = diffQs.length;
        const diffSolved = diffQs.filter(q => statusByQuestion[q.id] === 'solved').length;
        const diffPct = diffTotal > 0 ? Math.round((diffSolved / diffTotal) * 100) : 0;
        return {{
          difficulty: diff,
          total: diffTotal,
          solved: diffSolved,
          pct: diffPct
        }};
      }});

      // Struggled questions list
      const struggledQuestions = questions.filter(q => statusByQuestion[q.id] === 'struggled');

      // Recommended question:
      // Product promise: Find an unsolved Medium question on weak topic in under 30 seconds!
      // Find weakest topic with least percentage
      const sortedTopics = [...topicProgress].sort((a, b) => a.pct - b.pct);
      let recommended = null;
      for (const t of sortedTopics) {{
        recommended = questions.find(q => q.topic === t.topic && q.difficulty === 'Medium' && statusByQuestion[q.id] !== 'solved');
        if (recommended) break;
      }}
      if (!recommended) {{
        recommended = questions.find(q => statusByQuestion[q.id] !== 'solved') || questions[0];
      }}

      // Pending mentor reviews
      const pendingReviews = attempts.filter(a => a.reviewStatus === 'awaiting').length;
      const unreadComments = this.getUnreadCommentCount(studentId);

      // Daily goal
      const dailyTarget = Number(getItem(KEYS.DAILY_TARGET, 5));
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaySolvedCount = attempts.filter(a => a.status === 'solved' && a.createdAt && a.createdAt.slice(0, 10) === todayStr).length;

      return {{
        total,
        attempted,
        solved,
        struggled,
        remaining,
        overallPct,
        topicProgress,
        difficultyProgress,
        struggledQuestions,
        recommended,
        pendingReviews,
        unreadComments,
        dailyTarget,
        todaySolvedCount,
        statusByQuestion
      }};
    }},

    // ── Mentor Overview & Queue (PRD S7) ──────────────────────
    getMentorOverview() {{
      const users = this.getUsers().filter(u => u.role === 'student');
      const questions = this.getQuestions();
      const attempts = this.getAttempts();

      const totalStudents = users.length;
      const totalQuestions = questions.length;
      const totalSubmissions = attempts.length;
      const pendingReviews = attempts.filter(a => a.reviewStatus === 'awaiting').length;
      const approved = attempts.filter(a => a.reviewStatus === 'approved').length;
      const needsRevision = attempts.filter(a => a.reviewStatus === 'needs_revision').length;

      const recentActivity = attempts.slice(0, 8).map(a => {{
        const student = this.getUserById(a.userId);
        const question = this.getQuestionById(a.questionId);
        return {{
          attemptId: a.id,
          studentName: student ? student.name : 'Student',
          questionTitle: question ? question.title : 'Question',
          topic: question ? question.topic : '',
          difficulty: question ? question.difficulty : '',
          status: a.status,
          reviewStatus: a.reviewStatus,
          createdAt: a.createdAt,
          timeTakenSec: a.timeTakenSec
        }};
      }});

      return {{
        totalStudents,
        totalQuestions,
        totalSubmissions,
        pendingReviews,
        approved,
        needsRevision,
        recentActivity
      }};
    }},

    getReviewQueue(filters = {{}}) {{
      const attempts = this.getAttempts();
      const questions = this.getQuestions();
      const users = this.getUsers();

      // Default: show awaiting reviews, oldest first (PRD S7)
      let list = attempts.map(a => {{
        const question = questions.find(q => q.id === a.questionId);
        const student = users.find(u => u.id === a.userId);
        return {{
          ...a,
          studentName: student ? student.name : 'Unknown Student',
          studentAvatar: student ? student.avatar : 'ST',
          questionTitle: question ? question.title : 'Unknown Question',
          topic: question ? question.topic : 'General',
          difficulty: question ? question.difficulty : 'Medium',
          companies: question ? (question.companies || []) : []
        }};
      }});

      // Filters
      if (filters.status && filters.status !== 'all') {{
        list = list.filter(item => item.reviewStatus === filters.status);
      }} else if (!filters.status) {{
        list = list.filter(item => item.reviewStatus === 'awaiting');
      }}

      if (filters.student && filters.student !== 'all') {{
        list = list.filter(item => item.userId === filters.student);
      }}

      if (filters.topic && filters.topic !== 'all') {{
        list = list.filter(item => item.topic === filters.topic);
      }}

      // Sort oldest first as required by PRD Journey B
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return list;
    }},

    getStudentsOverview() {{
      const students = this.getUsers().filter(u => u.role === 'student');
      return students.map(student => {{
        const progress = this.getStudentProgress(student.id);
        const attempts = this.getAttempts(student.id);
        return {{
          ...student,
          solved: progress.solved,
          attempted: progress.attempted,
          struggled: progress.struggled,
          pendingReviews: progress.pendingReviews,
          overallPct: progress.overallPct,
          topicProgress: progress.topicProgress,
          struggledQuestions: progress.struggledQuestions,
          totalAttempts: attempts.length
        }};
      }});
    }},

    // ── Reset Demo Data (PRD S1, Acceptance Criteria) ─────────
    resetDemoData() {{
      setItem(KEYS.USERS, DEFAULT_USERS);
      setItem(KEYS.QUESTIONS, DEFAULT_QUESTIONS);
      setItem(KEYS.ATTEMPTS, DEFAULT_ATTEMPTS);
      setItem(KEYS.COMMENTS, DEFAULT_COMMENTS);
      setItem(KEYS.BOOKMARKS, DEFAULT_BOOKMARKS);
      setItem(KEYS.DRAFTS, DEFAULT_DRAFTS);
      setItem(KEYS.SESSION, {{ userId: 'u_nikhil', role: 'student' }});
      setItem(KEYS.DAILY_TARGET, 5);
      return true;
    }}
  }};

  global.Storage = Storage;
  global.PrepDeckStorage = Storage; // Alias
}})(window);
"""

with open('js/storage.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("Generated js/storage.js successfully.")
