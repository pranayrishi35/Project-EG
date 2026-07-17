import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind
} from "@react-email/components";
import * as React from "react";

interface StreakNudgeEmailProps {
  firstName: string;
  streakCount: number;
}

export const StreakNudgeEmail = ({
  firstName = "Pilot",
  streakCount = 1,
}: StreakNudgeEmailProps) => {
  const previewText = `Your ${streakCount}-day streak ends at midnight!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-slate-200 rounded-xl my-[40px] mx-auto p-[30px] max-w-[500px] shadow-sm">
            <Heading className="text-slate-900 text-[24px] font-black text-center p-0 my-[10px] mx-0">
              🚨 Don't lose your progress!
            </Heading>
            <Text className="text-slate-700 text-[16px] leading-[24px]">
              Hi {firstName},
            </Text>
            <Text className="text-slate-700 text-[16px] leading-[24px]">
              You've built an impressive <strong>{streakCount}-day study streak</strong>, but it's about to break at midnight! 
            </Text>
            <Text className="text-slate-700 text-[16px] leading-[24px]">
              Consistency is the #1 predictor of exam success. Take just 5 minutes right now to complete a quick daily flashcard or practice session to keep your momentum alive.
            </Text>
            
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-indigo-600 rounded-lg text-white text-[14px] font-bold no-underline text-center px-6 py-3"
                href="https://exampilot.in"
              >
                Save My Streak
              </Button>
            </Section>
            
            <Text className="text-slate-500 text-[12px] leading-[24px] mt-[10px]">
              You're receiving this because you're crushing it on ExamPilot. Keep pushing!
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default StreakNudgeEmail;
