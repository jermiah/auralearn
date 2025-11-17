# Gemini Assessment Generation - Testing Checklist

## Prerequisites ✅
- [x] Gemini API key added to `.env.local`
- [x] Dev server running on http://localhost:8081/
- [x] Dependencies installed (`@google/generative-ai`)

---

## Testing Checklist

### 1. Environment Setup ✅
- [x] `VITE_GEMINI_API_KEY` is set in `.env.local`
- [x] Dev server restarted after adding key
- [ ] Open browser console (F12) to monitor for errors

---

### 2. Teacher Onboarding Flow

#### Test Case 2.1: New Teacher Signup
**Steps:**
1. Navigate to http://localhost:8081/
2. Click "Teacher Login" → "Sign up here"
3. Complete teacher signup form
4. After auth callback, should redirect to `/teacher-onboarding`
5. Select a subject (e.g., "Mathématiques")
6. Select a grade level (e.g., "CM1")
7. Optionally enter school name
8. Click "Complete Setup"

**Expected Results:**
- [ ] Onboarding form displays correctly
- [ ] All 10 subjects appear in dropdown
- [ ] CM1 and CM2 appear in grade level dropdown
- [ ] Form submits successfully
- [ ] Redirects to dashboard
- [ ] Success toast appears

**Notes:**
- Subject: _______________
- Grade Level: _______________
- Any errors: _______________

---

### 3. Question Generation Testing

#### Test Case 3.1: Generate Questions for Mathématiques (CM1)
**Steps:**
1. Ensure teacher profile has: Subject = Mathématiques, Grade = CM1
2. Create a class with at least one student
3. Navigate to Assessment page
4. Copy assessment link
5. Open link in new tab/incognito window
6. Select student name
7. Click "Start Assessment"
8. Observe question generation (should take 3-5 seconds)

**Expected Results:**
- [ ] Loading indicator appears
- [ ] Questions generate successfully
- [ ] 10 questions are displayed
- [ ] Questions are about mathematics
- [ ] Questions are appropriate for CM1 level
- [ ] Each question has 4 options (A, B, C, D)
- [ ] Questions are in correct language (French if user is in French)

**Sample Questions to Verify:**
1. Question 1: _______________
2. Question 2: _______________
3. Are they math-related? Yes/No
4. Are they CM1 appropriate? Yes/No

---

#### Test Case 3.2: Generate Questions for Français (CM2)
**Steps:**
1. Go to Settings
2. Change subject to "Français"
3. Change grade level to "CM2"
4. Click "Save"
5. Create new assessment or use existing class
6. Start new assessment
7. Observe questions

**Expected Results:**
- [ ] Questions are about French language
- [ ] Questions are appropriate for CM2 level
- [ ] Questions are more advanced than CM1
- [ ] All questions have 4 options

**Sample Questions:**
1. Question 1: _______________
2. Question 2: _______________
3. Are they French language-related? Yes/No
4. Are they CM2 appropriate? Yes/No

---

#### Test Case 3.3: Generate Questions for Sciences et Technologie
**Steps:**
1. Change subject to "Sciences et Technologie" in Settings
2. Generate new assessment
3. Verify questions

**Expected Results:**
- [ ] Questions are about science and technology
- [ ] Questions cover topics like: living things, matter, energy, etc.
- [ ] Questions are curriculum-aligned

---

### 4. Language Testing

#### Test Case 4.1: French Language Generation
**Steps:**
1. Click language selector in top-right
2. Select "Français"
3. Generate new assessment
4. Check questions

**Expected Results:**
- [ ] All questions are in French
- [ ] All options are in French
- [ ] UI elements are in French
- [ ] Subject names are in French

**Sample French Question:**
_______________

---

#### Test Case 4.2: English Language Generation
**Steps:**
1. Switch language to "English"
2. Generate new assessment
3. Check questions

**Expected Results:**
- [ ] All questions are in English
- [ ] All options are in English
- [ ] UI elements are in English
- [ ] Subject names are in English

**Sample English Question:**
_______________

---

### 5. Complete Assessment Flow

#### Test Case 5.1: Full Student Assessment
**Steps:**
1. Start assessment as student
2. Answer all 10 questions
3. Submit assessment
4. View results

**Expected Results:**
- [ ] Can select answers for all questions
- [ ] Progress bar updates correctly
- [ ] "Next Question" button works
- [ ] "Submit Assessment" appears on last question
- [ ] Results page displays:
  - [ ] Score (X/10)
  - [ ] Percentage
  - [ ] Time taken
  - [ ] Learning profile category
  - [ ] Confidence score
- [ ] Results saved to database
- [ ] Student category updated

**Results:**
- Score: ___/10
- Category: _______________
- Confidence: ___%

---

### 6. Settings Page Integration

#### Test Case 6.1: View Current Profile
**Steps:**
1. Navigate to Settings
2. Scroll to "Teaching Profile" section

**Expected Results:**
- [ ] Current subject is displayed
- [ ] Current grade level is displayed
- [ ] School name is displayed (if set)

---

#### Test Case 6.2: Update Profile
**Steps:**
1. Change subject to different value
2. Change grade level
3. Click "Save"
4. Refresh page

**Expected Results:**
- [ ] Success toast appears
- [ ] Changes persist after refresh
- [ ] New values display in Settings
- [ ] Future assessments use new values

---

### 7. Error Handling

#### Test Case 7.1: Missing API Key
**Steps:**
1. Remove `VITE_GEMINI_API_KEY` from `.env.local`
2. Restart dev server
3. Try to generate assessment

**Expected Results:**
- [ ] Error message appears
- [ ] User-friendly error displayed
- [ ] No crash or blank screen

---

#### Test Case 7.2: Network Error Simulation
**Steps:**
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Try to generate assessment
4. Set back to "Online"

**Expected Results:**
- [ ] Error message appears
- [ ] Can retry after going back online

---

### 8. Performance Testing

#### Test Case 8.1: Generation Speed
**Steps:**
1. Start assessment
2. Time how long question generation takes

**Expected Results:**
- [ ] Questions generate in 3-5 seconds
- [ ] Loading indicator shows during generation
- [ ] UI doesn't freeze

**Actual Time:** _____ seconds

---

#### Test Case 8.2: Multiple Assessments
**Steps:**
1. Generate 3 assessments in a row
2. Check if speed is consistent

**Expected Results:**
- [ ] All assessments generate successfully
- [ ] Speed is consistent
- [ ] No rate limiting errors

**Times:**
1. Assessment 1: _____ seconds
2. Assessment 2: _____ seconds
3. Assessment 3: _____ seconds

---

### 9. Question Quality Verification

#### Test Case 9.1: Curriculum Alignment
**For each subject tested, verify:**

**Mathématiques (CM1):**
- [ ] Questions cover: numbers, fractions, geometry, measurements
- [ ] Difficulty appropriate for 9-10 year olds
- [ ] Clear and unambiguous questions

**Français (CM2):**
- [ ] Questions cover: reading comprehension, grammar, conjugation, vocabulary
- [ ] Difficulty appropriate for 10-11 year olds
- [ ] Proper French grammar in questions

**Sciences et Technologie:**
- [ ] Questions cover: living things, matter, energy, technology
- [ ] Age-appropriate scientific concepts
- [ ] Clear explanations

---

### 10. Edge Cases

#### Test Case 10.1: Teacher Without Onboarding
**Steps:**
1. Create teacher account but skip onboarding
2. Try to generate assessment

**Expected Results:**
- [ ] Uses default values (Mathématiques, CM1)
- [ ] Assessment generates successfully
- [ ] No errors

---

#### Test Case 10.2: Rapid Language Switching
**Steps:**
1. Switch language to French
2. Immediately switch to English
3. Generate assessment

**Expected Results:**
- [ ] Questions generate in correct language
- [ ] No mixed language questions
- [ ] No errors

---

## Summary

### Tests Passed: ___/50+

### Critical Issues Found:
1. _______________
2. _______________
3. _______________

### Minor Issues Found:
1. _______________
2. _______________
3. _______________

### Recommendations:
1. _______________
2. _______________
3. _______________

---

## Sign-Off

**Tester Name:** _______________
**Date:** _______________
**Overall Status:** ☐ Pass ☐ Pass with Issues ☐ Fail

**Notes:**
_______________
_______________
_______________
