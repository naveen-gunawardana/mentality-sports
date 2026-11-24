"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Users, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { SPORTS, PLAYER_GRADES, MIDDLE_SCHOOL_GRADES } from "@/lib/athlete-options";

type Role = "player" | "mentor";

const sports = SPORTS;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "New Zealand",
  "Ireland", "Germany", "France", "Spain", "Italy", "Netherlands", "Sweden",
  "Norway", "Denmark", "Finland", "Switzerland", "Austria", "Belgium",
  "Portugal", "Poland", "Czech Republic", "Hungary", "Greece", "Turkey",
  "Israel", "South Africa", "Nigeria", "Ghana", "Kenya", "Egypt",
  "Brazil", "Argentina", "Mexico", "Colombia", "Chile", "Peru",
  "Japan", "South Korea", "China", "India", "Philippines", "Singapore",
  "Malaysia", "Indonesia", "Thailand", "Vietnam", "United Arab Emirates",
  "Saudi Arabia", "Qatar", "Kuwait", "Other",
];

const playerGrades = PLAYER_GRADES;

const playerLevels = [
  "Middle school recreational",
  "Middle school team / club",
  "High school JV",
  "High school Varsity",
  "Club / AAU",
  "College",
];

const mentalChallenges = [
  "Practice-to-game confidence gap",
  "Fear of making mistakes",
  "Pre-competition anxiety",
  "Communicating with my coach",
  "Unclear role on team",
  "Dealing with bench / less playing time",
  "Staying motivated",
  "Handling pressure moments",
  "Team dynamics / fitting in",
  "Injury recovery",
  "Balancing athletics and school",
  "Self-talk / inner critic",
  "Burnout",
  "Identity — my worth beyond sport",
];

const mentorSkills = [
  "Building confidence",
  "Managing anxiety",
  "Goal setting",
  "Coach communication",
  "Leadership development",
  "Dealing with adversity",
  "Time management",
  "Team dynamics",
  "Injury recovery support",
  "Academic-athletic balance",
  "Motivation & burnout",
  "Identity & self-worth",
];

const mentorPlayingLevels = [
  "High School",
  "College (D3)",
  "College (D2)",
  "College (D1)",
  "Semi-Professional",
  "Professional",
];

const menteeAgePrefs = [
  "Middle school (6th–8th)",
  "High school (9th–12th)",
  "Any age",
];

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground">Loading…</div>}>
      <ApplyForm />
    </Suspense>
  );
}

function ApplyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawRole = searchParams.get("role");
  const initialRole: Role = rawRole === "mentor" ? "mentor" : "player";

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");

  const [role, setRole] = useState<Role>(initialRole);
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  // Player fields
  const [playerSports, setPlayerSports] = useState<string[]>([]);
  const [playerAge, setPlayerAge] = useState("");
  const [playerSchool, setPlayerSchool] = useState("");
  const [playerGrade, setPlayerGrade] = useState("");
  const [playerLevelsSelected, setPlayerLevelsSelected] = useState<string[]>([]);
  const [playerCountry, setPlayerCountry] = useState("United States");
  const [playerLocation, setPlayerLocation] = useState("");
  const [playerChallenges, setPlayerChallenges] = useState<string[]>([]);
  const [playerGoal, setPlayerGoal] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Shared availability
  const [availability, setAvailability] = useState("");

  // Mentor fields
  const [mentorSports, setMentorSports] = useState<string[]>([]);
  const [mentorLevelsSelected, setMentorLevelsSelected] = useState<string[]>([]);
  const [mentorInstitution, setMentorInstitution] = useState("");
  const [mentorCountry, setMentorCountry] = useState("United States");
  const [mentorLocation, setMentorLocation] = useState("");
  const [mentorYearsPlayed, setMentorYearsPlayed] = useState("");
  const [mentorSkillsSelected, setMentorSkillsSelected] = useState<string[]>([]);
  const [mentorWhy, setMentorWhy] = useState("");
  const [mentorBio, setMentorBio] = useState("");
  const [menteeAgePref, setMenteeAgePref] = useState("");

  const requiresParent = MIDDLE_SCHOOL_GRADES.has(playerGrade);

  // Gate: must be signed in; if already applied (profile exists) → dashboard.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/signin?redirect=/apply");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        router.replace("/dashboard");
        return;
      }
      setUserId(user.id);
      setAccountName((user.user_metadata?.name as string | undefined) ?? "");
      setChecking(false);
    })();
  }, [router]);

  function toggleItem(list: string[], item: string, setList: (v: string[]) => void) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSubmitError("");
    setLoading(true);

    const res = await fetch("/api/create-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name: accountName || "Athlete",
        role,
        sport: role === "player" ? (playerSports.length > 0 ? playerSports : null) : (mentorSports.length > 0 ? mentorSports : null),
        playerProfile: role === "player" ? {
          age: playerAge ? parseInt(playerAge) : null,
          school: playerSchool || null,
          grade: playerGrade || null,
          level: playerLevelsSelected.length > 0 ? playerLevelsSelected : null,
          location: playerCountry === "United States"
            ? (playerLocation ? `${playerLocation}, US` : "United States")
            : playerCountry || null,
          challenges: playerChallenges.length > 0 ? playerChallenges : null,
          goal: playerGoal || null,
          availability: availability || null,
          parent_name: parentName || null,
          parent_email: parentEmail || null,
          parent_phone: parentPhone || null,
        } : null,
        mentorProfile: role === "mentor" ? {
          playing_level: mentorLevelsSelected.length > 0 ? mentorLevelsSelected : null,
          institution: mentorInstitution || null,
          location: mentorCountry === "United States"
            ? (mentorLocation ? `${mentorLocation}, US` : "United States")
            : mentorCountry || null,
          years_played: mentorYearsPlayed ? parseInt(mentorYearsPlayed) : null,
          skills: mentorSkillsSelected.length > 0 ? mentorSkillsSelected : null,
          why: mentorWhy || null,
          bio: mentorBio || null,
          mentee_age_pref: menteeAgePref || null,
          availability: availability || null,
        } : null,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setSubmitError(json?.error ?? "Something went wrong submitting your application.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">Application</p>
        <h1 className="text-3xl font-bold text-navy mb-2">Apply to the mentorship program</h1>
        <p className="text-muted-foreground">
          {accountName ? `You're signed in as ${accountName}. ` : ""}Tell us about yourself so we can {role === "player" ? "match you with the right mentor" : "review your application"}.
        </p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto">
        {([
          { r: "player" as Role, Icon: UserPlus, label: "I'm an Athlete", sub: "Looking for a mentor" },
          { r: "mentor" as Role, Icon: Users,   label: "I'm a Mentor",   sub: "Current or former athlete giving back" },
        ]).map(({ r, Icon, label, sub }) => (
          <button
            key={r}
            type="button"
            onClick={() => { setRole(r); setStep(1); }}
            className={`rounded-xl border-2 p-4 text-center transition-all ${
              role === r ? "border-orange-500 bg-orange-50" : "border-muted hover:border-orange-200"
            }`}
          >
            <Icon className={`h-6 w-6 mx-auto mb-2 ${role === r ? "text-orange-500" : "text-muted-foreground"}`} />
            <p className={`font-semibold text-sm ${role === r ? "text-navy" : "text-muted-foreground"}`}>{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </button>
        ))}
      </div>

      {role === "mentor" && (
        <div className="max-w-md mx-auto mb-6 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 flex gap-3 items-start">
          <span className="text-orange-500 mt-0.5 text-base leading-none">♥</span>
          <div>
            <p className="text-sm font-semibold text-navy">This is a volunteer role</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mentors are current or former athletes giving back — no payment is involved. Applications are reviewed before approval.
            </p>
          </div>
        </div>
      )}

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step >= s ? "bg-navy text-white" : "bg-muted text-muted-foreground"}`}>
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {role === "player"
                ? ["About You", "Your Sport", "Mental Goals"][s - 1]
                : ["Your Background", "Experience", "Mentoring Focus"][s - 1]}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-navy" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{role === "player" ? "About You" : "Your Background"}</CardTitle>
              <CardDescription>{role === "player" ? "A few basics to match you well" : "Where you've competed"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {role === "player" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Age" type="number" placeholder="e.g. 14" value={playerAge} onChange={(e) => setPlayerAge(e.target.value)} />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Country</label>
                      <select
                        value={playerCountry}
                        onChange={(e) => { setPlayerCountry(e.target.value); setPlayerLocation(""); }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  {playerCountry === "United States" && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">State</label>
                      <select
                        value={playerLocation}
                        onChange={(e) => setPlayerLocation(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select state</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Grade</label>
                    <div className="flex flex-wrap gap-2">
                      {playerGrades.map((g) => (
                        <button key={g} type="button" onClick={() => setPlayerGrade(g)}
                          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${playerGrade === g ? "bg-navy text-white border-navy" : "bg-white text-muted-foreground hover:bg-muted"}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input label="School / Team" placeholder="Your school or team name" value={playerSchool} onChange={(e) => setPlayerSchool(e.target.value)} />

                  {playerGrade && (
                    <div className={`rounded-lg border p-4 space-y-3 ${requiresParent ? "border-orange-200 bg-orange-50/40" : "border-offWhite-300 bg-offWhite/40"}`}>
                      <div>
                        <p className="text-sm font-semibold text-navy">
                          Parent / Guardian Contact
                          {requiresParent && <span className="ml-1.5 text-xs text-orange-600 font-medium">(required for your grade)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {requiresParent
                            ? "We require a parent or guardian contact for athletes in middle school."
                            : "Optional — helpful for keeping parents in the loop."}
                        </p>
                      </div>
                      <Input label="Parent / Guardian Name" placeholder="Full name" value={parentName} onChange={(e) => setParentName(e.target.value)} required={requiresParent} />
                      <Input label="Parent / Guardian Email" type="email" placeholder="parent@email.com" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required={requiresParent} />
                      <Input label="Parent / Guardian Phone" type="tel" placeholder="(555) 000-0000" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
                    </div>
                  )}
                </>
              )}

              {role === "mentor" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Levels you&apos;ve competed at <span className="text-muted-foreground font-normal">(select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {mentorPlayingLevels.map((lvl) => (
                        <button key={lvl} type="button" onClick={() => toggleItem(mentorLevelsSelected, lvl, setMentorLevelsSelected)}
                          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${mentorLevelsSelected.includes(lvl) ? "bg-navy text-white border-navy" : "bg-white text-muted-foreground hover:bg-muted"}`}>
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="School / Team / Program" placeholder="e.g. State University, hometown club, etc." value={mentorInstitution} onChange={(e) => setMentorInstitution(e.target.value)} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Country</label>
                    <select
                      value={mentorCountry}
                      onChange={(e) => { setMentorCountry(e.target.value); setMentorLocation(""); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {mentorCountry === "United States" && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">State</label>
                      <select
                        value={mentorLocation}
                        onChange={(e) => setMentorLocation(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select state</option>
                        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{role === "player" ? "Your Sport" : "Experience"}</CardTitle>
              <CardDescription>{role === "player" ? "Tell us about your athletic background" : "Tell us about your playing background"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Your sport(s) <span className="text-muted-foreground font-normal">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {sports.map((s) => {
                    const list = role === "mentor" ? mentorSports : playerSports;
                    const setter = role === "mentor" ? setMentorSports : setPlayerSports;
                    return (
                      <button key={s} type="button" onClick={() => toggleItem(list, s, setter)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${list.includes(s) ? "bg-navy text-white" : "bg-muted text-muted-foreground hover:bg-navy/10"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {role === "player" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Level(s) of competition <span className="text-muted-foreground font-normal">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {playerLevels.map((l) => (
                      <button key={l} type="button" onClick={() => toggleItem(playerLevelsSelected, l, setPlayerLevelsSelected)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${playerLevelsSelected.includes(l) ? "bg-navy text-white" : "bg-muted text-muted-foreground hover:bg-navy/10"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {role === "mentor" && (
                <>
                  <Input label="Years of organized sport" type="number" placeholder="e.g. 8" value={mentorYearsPlayed} onChange={(e) => setMentorYearsPlayed(e.target.value)} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Who are you most comfortable mentoring?</label>
                    <div className="flex flex-wrap gap-2">
                      {menteeAgePrefs.map((pref) => (
                        <button key={pref} type="button" onClick={() => setMenteeAgePref(pref)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${menteeAgePref === pref ? "bg-navy text-white" : "bg-muted text-muted-foreground hover:bg-navy/10"}`}>
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Short bio</label>
                    <textarea
                      value={mentorBio}
                      onChange={(e) => setMentorBio(e.target.value)}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="A few sentences about yourself as an athlete — what you've been through, what drives you to give back..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Availability for weekly check-ins</label>
                <div className="flex flex-wrap gap-2">
                  {["Weekday afternoons", "Weekday evenings", "Weekend mornings", "Weekend afternoons", "Flexible"].map((time) => (
                    <button key={time} type="button" onClick={() => setAvailability(time)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${availability === time ? "bg-navy text-white" : "bg-muted text-muted-foreground hover:bg-navy/10"}`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button type="button" variant="secondary" onClick={() => setStep(3)}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{role === "player" ? "Mental Challenges" : "Mentoring Focus"}</CardTitle>
              <CardDescription>
                {role === "player" ? "What are you dealing with? Select all that apply." : "What areas are you best equipped to help with?"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(role === "player" ? mentalChallenges : mentorSkills).map((item) => {
                  const list = role === "player" ? playerChallenges : mentorSkillsSelected;
                  const setter = role === "player"
                    ? (v: string[]) => setPlayerChallenges(v)
                    : (v: string[]) => setMentorSkillsSelected(v);
                  return (
                    <button key={item} type="button" onClick={() => toggleItem(list, item, setter)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${list.includes(item) ? "bg-navy text-white" : "bg-muted text-muted-foreground hover:bg-navy/10"}`}>
                      {item}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {role === "player" ? "What's your #1 goal for this mentorship?" : "Why do you want to be a mentor?"}
                </label>
                <textarea
                  value={role === "player" ? playerGoal : mentorWhy}
                  onChange={(e) => role === "player" ? setPlayerGoal(e.target.value) : setMentorWhy(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={
                    role === "player"
                      ? "Example: I want to play with the same confidence in games that I have in practice. I get really anxious before big games and I need help managing that..."
                      : "Tell us about your motivation to help athletes and what you hope to give them..."
                  }
                />
              </div>

              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button type="submit" variant="secondary" disabled={loading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? "Submitting…" : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
