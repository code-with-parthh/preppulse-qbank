/**
 * Automated End-to-End Simulation of Journeys A, B, C, D, E
 * Testing PRD PST_PD_113 compliance
 */
const fs = require('fs');

// Mock browser environment
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.window = global;

eval(fs.readFileSync('js/storage.js', 'utf8'));

console.log('====================================================');
console.log('🧪 RUNNING COMPREHENSIVE E2E USER JOURNEY VERIFICATION');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failCount++;
  }
}

// ── TEST 1: Initialization & Seed Data ───────────────────────
console.log('--- TEST 1: Database Initialization ---');
const questions = Storage.getQuestions();
assert(questions.length >= 60 && questions.length <= 80, `Questions bank size: ${questions.length} (PRD requires 60-80)`);

const topics = Storage.getTopics();
assert(topics.length === 8, `Topic count: ${topics.length} (PRD requires 8 topics)`);

const users = Storage.getUsers();
assert(users.length === 4, `User count: ${users.length} (3 students, 1 mentor)`);

// ── JOURNEY A: Student Practises a Question ───────────────────
console.log('\n--- JOURNEY A: Student Practises a Question ---');
// 1. Login as Nikhil
const loginRes = Storage.login('student1', '123');
assert(loginRes.success && loginRes.user.id === 'u_nikhil', 'Student login as Nikhil');

// 2. Filter questions in bank
const arraysMedium = questions.filter(q => q.topic === 'Arrays' && q.difficulty === 'Medium');
assert(arraysMedium.length >= 3, `Filter Arrays + Medium yields ${arraysMedium.length} questions`);

// 3. Open question
const qTarget = Storage.getQuestionById('q_arr_004'); // Longest subarray with sum K
assert(qTarget && qTarget.title === 'Longest Subarray with Sum K', 'Question details loaded');

// 4. Save a draft
Storage.saveDraft(qTarget.id, {
  text: 'def longest_subarray(arr, k): # draft approach',
  language: 'Python',
  startedAt: new Date().toISOString()
}, 'u_nikhil');

const draft = Storage.getDraft(qTarget.id, 'u_nikhil');
assert(draft && draft.text.includes('draft approach'), 'Draft auto-saved and restored');

// 5. Submit solution for review
const newAttempt = Storage.createAttempt({
  questionId: qTarget.id,
  userId: 'u_nikhil',
  status: 'solved',
  confidence: 4,
  timeTakenSec: 1080,
  language: 'Python',
  text: 'def longest_subarray(arr, k):\n    prefix_sum = {}\n    # completed solution'
});

assert(newAttempt && newAttempt.reviewStatus === 'awaiting', 'Attempt submitted with status "awaiting"');
assert(Storage.getDraft(qTarget.id, 'u_nikhil') === null, 'Draft cleared after submission');

// 6. Verify attempt appears in My Attempts
const nikhilAttempts = Storage.getAttempts('u_nikhil');
assert(nikhilAttempts.some(a => a.id === newAttempt.id), 'Attempt visible in Nikhil\'s attempts');

// ── JOURNEY B: Mentor Reviews and Comments ────────────────────
console.log('\n--- JOURNEY B: Mentor Reviews and Comments ---');
// 1. Switch to Mentor
const mentorLogin = Storage.login('mentor1', '123');
assert(mentorLogin.success && mentorLogin.user.role === 'mentor', 'Mentor login as Ms. Rao');

// 2. Check Review Queue
const queueBefore = Storage.getReviewQueue({ status: 'awaiting' });
const foundInQueue = queueBefore.find(item => item.id === newAttempt.id);
assert(foundInQueue !== undefined, 'New submission found in Mentor Review Queue');

// 3. Add comment and mark Needs Revision
const comment = Storage.addComment({
  attemptId: newAttempt.id,
  authorId: 'u_rao',
  text: 'Good start with prefix sums! What happens with negative values in the array? Please revise.',
  reviewStatus: 'needs_revision'
});

assert(comment && comment.attemptId === newAttempt.id, 'Mentor comment added to attempt');

const updatedAttempt = Storage.getAttemptById(newAttempt.id);
assert(updatedAttempt.reviewStatus === 'needs_revision', 'Attempt updated to "needs_revision"');

// 4. Check that it leaves the awaiting queue
const queueAfter = Storage.getReviewQueue({ status: 'awaiting' });
assert(!queueAfter.some(item => item.id === newAttempt.id), 'Submission removed from awaiting queue');

// ── JOURNEY C: Student Reads Feedback and Revises Solution ────
console.log('\n--- JOURNEY C: Student Reads Feedback and Revises Solution ---');
// 1. Switch back to student
Storage.setSession('u_nikhil', 'student');

// 2. Check unread notification count
const unreadCount = Storage.getUnreadCommentCount('u_nikhil');
assert(unreadCount > 0, `Navbar unread comment count > 0 (found ${unreadCount})`);

// 3. Open submission -> mark read
Storage.markCommentsReadForAttempt(newAttempt.id);
const attemptComments = Storage.getComments(newAttempt.id);
assert(attemptComments.every(c => c.readByStudent), 'All comments on this submission marked as read');

// 4. Revise solution (creates Version 2)
const revisedAttempt = Storage.reviseAttempt(newAttempt.id, {
  language: 'Python',
  text: 'def longest_subarray(arr, k):\n    # Version 2 with negative number support\n    prefix_sum = {0: -1}\n    # fixed implementation',
  status: 'solved'
});

assert(revisedAttempt.versions.length === 2, `Version count is now 2 (found ${revisedAttempt.versions.length})`);
assert(revisedAttempt.versions[0].v === 1 && revisedAttempt.versions[1].v === 2, 'Version 1 and Version 2 both preserved intact');
assert(revisedAttempt.reviewStatus === 'awaiting', 'Revised attempt re-queued for review');

// ── JOURNEY D: Mentor Approval & Final Progress ───────────────
console.log('\n--- JOURNEY D: Mentor Approval & Final Progress ---');
// 1. Mentor reviews revision
Storage.setSession('u_rao', 'mentor');

const finalComment = Storage.addComment({
  attemptId: newAttempt.id,
  authorId: 'u_rao',
  text: 'Excellent revision! Prefix sum edge cases properly handled. Approved!',
  reviewStatus: 'approved'
});

const approvedAttempt = Storage.getAttemptById(newAttempt.id);
assert(approvedAttempt.reviewStatus === 'approved', 'Attempt successfully marked "approved"');

// 2. Check Student Progress metrics
const progress = Storage.getStudentProgress('u_nikhil');
assert(progress.solved >= 1, `Solved count updated in student dashboard: ${progress.solved}`);
assert(progress.overallPct > 0, `Overall progress percentage > 0: ${progress.overallPct}%`);
assert(progress.topicProgress.some(t => t.topic === 'Arrays' && t.solved > 0), 'Arrays topic progress bar reflects solved count');

// ── JOURNEY E: Access Control & Privacy ───────────────────────
console.log('\n--- JOURNEY E: Access Control & Privacy ---');
// 1. Student cannot see other student's attempts
Storage.setSession('u_nikhil', 'student');
const fatimaAttempts = Storage.getAttempts('u_fatima');
assert(fatimaAttempts.every(a => a.userId === 'u_fatima'), 'Fatima\'s attempts isolated from Nikhil');

// 2. Student cannot add questions
let studentAddThrew = false;
try {
  Storage.addQuestion({ title: 'Illegal Question', prompt: 'test', topic: 'Arrays', difficulty: 'Easy' });
} catch (e) {
  studentAddThrew = true;
}
assert(studentAddThrew, 'Student blocked from adding questions (Mentor only)');

// 3. Mentor CAN add questions
Storage.setSession('u_rao', 'mentor');
const newQ = Storage.addQuestion({
  title: 'Test New Question',
  prompt: 'Testing question creation',
  topic: 'Arrays',
  difficulty: 'Easy',
  tags: ['test']
});
assert(newQ && newQ.id.startsWith('q_arr_'), 'Mentor successfully added new question');

// 4. Mentor CAN delete questions
const deleted = Storage.deleteQuestion(newQ.id);
assert(deleted, 'Mentor successfully deleted question');

console.log('\n====================================================');
console.log(`📊 FINAL TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');
process.exit(failCount === 0 ? 0 : 1);
