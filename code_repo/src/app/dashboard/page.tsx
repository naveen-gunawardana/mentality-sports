import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  // Ensure profile row exists — if not, send them back to complete signup
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  // Signed up but hasn't applied yet → send them to the application.
  if (!profile) {
    redirect("/apply");
  }

  const role = profile.role ?? user.user_metadata?.role;

  if (role === "coach") {
    redirect("/dashboard/coach");
  } else if (role === "mentor") {
    redirect("/dashboard/mentor");
  } else if (role === "player") {
    redirect("/dashboard/player");
  } else {
    // role not yet chosen (account-only) → application step
    redirect("/apply");
  }
}
