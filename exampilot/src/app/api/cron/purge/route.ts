import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch users whose deletion deadline has passed
  const { data: usersToPurge, error: fetchError } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("is_deleted", true)
    .lt("deletion_deadline", new Date().toISOString());

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch users to purge" }, { status: 500 });
  }

  const results = { successful: 0, failed: 0 };

  for (const user of usersToPurge || []) {
    // Delete from auth.users (which typically cascades)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error(`Failed to delete auth user ${user.id}:`, deleteError);
      
      // Fallback: forcefully delete from user_profiles directly if auth user deletion failed
      await supabaseAdmin.from("user_profiles").delete().eq("id", user.id);
      
      results.failed++;
    } else {
      results.successful++;
    }
  }

  return NextResponse.json({ 
    message: "Purge completed", 
    results 
  });
}
