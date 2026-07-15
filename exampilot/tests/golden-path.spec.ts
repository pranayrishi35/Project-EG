import { test, expect } from '@playwright/test';

test.describe('ExamPilot Golden Path: Student Exam Flow', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // 1. BYPASS AUTH: Set a secure cookie or local storage token to simulate a logged-in user
    // Adjust this to match your Supabase auth state shape
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-test-token-123',
        domain: 'localhost',
        path: '/',
      }
    ]);
  });

  test('Student uploads syllabus, takes exam, and views results', async ({ page }) => {
    
    // 2. MOCK THE GEMINI API: Intercept the server action or API route
    await page.route('**/api/generateTestStrategy', async (route) => {
      const json = {
        studyPlan: "Mocked Plan",
        questions: [
          { id: 1, text: "What is the capital of India?", options: ["New Delhi", "Mumbai", "Pune"], answer: "New Delhi" },
          { id: 2, text: "Mock Question 2", options: ["A", "B", "C"], answer: "A" }
        ]
      };
      await route.fulfill({ json });
    });

    // 3. NAVIGATE TO PLANNER & UPLOAD
    await page.goto('/planner');
    
    // Simulate file upload (create a dummy txt/pdf file in your tests folder)
    // await page.setInputFiles('input[type="file"]', 'tests/fixtures/dummy-syllabus.pdf');
    
    // Click generate and wait for our mocked response to resolve
    await page.getByRole('button', { name: /Generate Study Plan/i }).click();
    await expect(page.getByText('Mission Ready')).toBeVisible({ timeout: 10000 });

    // 4. START MISSION (CBT Engine)
    await page.getByRole('button', { name: /Start Mission/i }).click();
    await expect(page).toHaveURL(/\/practice\/mock/);

    // Verify Timer is running
    await expect(page.getByTestId('exam-timer')).toBeVisible();

    // 5. ANSWER QUESTIONS
    // Answer Q1
    await page.getByText('New Delhi').click();
    await page.getByRole('button', { name: /Save & Next/i }).click();
    
    // Answer Q2
    await page.getByText('A', { exact: true }).click();

    // 6. TRIGGER ANTI-CHEAT WARNING
    // We simulate the user switching tabs by dispatching a visibilitychange event
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Verify the warning modal pops up
    await expect(page.getByText(/Warning: Tab switch detected/i)).toBeVisible();
    await page.getByRole('button', { name: /I Understand/i }).click();

    // 7. SUBMIT EXAM
    await page.getByRole('button', { name: /Submit Exam/i }).click();
    
    // Handle the confirmation modal
    await page.getByRole('button', { name: /Confirm Submission/i }).click();

    // 8. VERIFY ANALYTICS SCREEN
    await expect(page).toHaveURL(/\/analytics/);
    await expect(page.getByText(/Final Score/i)).toBeVisible();
    // Assuming 2 questions, 3 marks each, 6 total.
    await expect(page.getByText('6 / 6')).toBeVisible(); 
  });
});
