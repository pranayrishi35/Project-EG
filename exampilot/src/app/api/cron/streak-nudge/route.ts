import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/adminClient";
import { resend } from "@/lib/resend";
import { StreakNudgeEmail } from "@/emails/StreakNudgeEmail";
import { isAuthorizedCron } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max allowed for Vercel Hobby

export async function GET(req: NextRequest) {
  // 1. Validate CRON_SECRET for access control (fails closed, header-only)
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ success: false, error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const adminClient = getAdminClient();
    const now = new Date();
    
    // IST is UTC + 5:30
    const getISTDateString = (date: Date) => {
      const istDate = new Date(date.getTime() + 330 * 60 * 1000);
      return istDate.toISOString().split("T")[0];
    };

    const todayIST = getISTDateString(now);
    
    // Yesterday IST
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayIST = getISTDateString(yesterdayDate);

    // 2. Fetch users at risk
    // We want users whose last_active_date (converted to IST locally or in SQL) was yesterday.
    // Since Supabase doesn't easily do IST conversion in standard PostgREST filters without an RPC,
    // we fetch active users (streak > 0) and filter in memory. This is fine for early stage.
    // We also check last_streak_nudge_date to prevent duplicate emails today.
    const { data: users, error: dbError } = await adminClient
      .from("profiles")
      .select("id, full_name, email, current_streak, last_active_date, last_streak_nudge_date")
      .gt("current_streak", 0);

    if (dbError) {
      throw dbError;
    }

    const atRiskUsers = (users || []).filter((user: any) => {
      if (!user.last_active_date) return false;
      if (!user.email) return false;

      const userLastActiveIST = getISTDateString(new Date(user.last_active_date));
      const isYesterday = userLastActiveIST === yesterdayIST;
      
      let alreadyNudgedToday = false;
      if (user.last_streak_nudge_date) {
        // last_streak_nudge_date is stored as a string DATE e.g. 'YYYY-MM-DD'
        alreadyNudgedToday = user.last_streak_nudge_date === todayIST;
      }

      return isYesterday && !alreadyNudgedToday;
    });

    if (atRiskUsers.length === 0) {
      return NextResponse.json({ success: true, message: "No users at risk of losing streak." });
    }

    // 3. Send Emails via Resend (Batched in chunks of 20 to respect rate limits)
    let successCount = 0;
    let failCount = 0;

    const BATCH_SIZE = 20;
    for (let i = 0; i < atRiskUsers.length; i += BATCH_SIZE) {
      const batch = atRiskUsers.slice(i, i + BATCH_SIZE);
      
      const emailPromises = batch.map(async (user: any) => {
        try {
          const firstName = user.full_name?.split(" ")[0] || "Pilot";
          
          await resend!.emails.send({
            from: "ExamPilot <notifications@exampilot.in>",
            to: [user.email],
            subject: `Your ${user.current_streak}-day streak ends at midnight!`,
            react: StreakNudgeEmail({ firstName, streakCount: user.current_streak }),
          });

          // 4. Update the DB to mark as nudged
          await adminClient
            .from("profiles")
            .update({ last_streak_nudge_date: todayIST })
            .eq("id", user.id);

          successCount++;
        } catch (e) {
          console.error(`Failed to send streak nudge to ${user.id}:`, e);
          failCount++;
        }
      });

      await Promise.all(emailPromises);
      
      // Delay 500ms between batches to avoid Resend rate limits
      if (i + BATCH_SIZE < atRiskUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: atRiskUsers.length,
      successCount,
      failCount 
    });

  } catch (error: any) {
    console.error("[Streak Nudge Cron Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
