# Mentality Sports: problem analysis and new direction (Nov 23, 2026)

## What the data says (production DB, aggregate only)

| Metric | Value |
|---|---|
| Athlete signups, all time | 98 (66 of them in August, 40 on Aug 12 alone) |
| Athletes ever matched with a mentor | 11 (~11%) |
| Athletes still waiting on a match | 87, some since spring |
| Athletes who came back after their first day | 8 of 98 |
| Athletes active in the last 30 days | 2 |
| Mentors | 19, all approved, **none new since Jun 2**, 0 active in the last 30 days |
| Approved mentors with no active match | 8 (while 87 athletes wait) |
| Messages, all time | 65 across 12 matches (~5 per match); last one Aug 28 |
| Scheduled calls | 37 marked "upcoming", **all in the past**: none ever marked done |
| Sessions logged / weekly goals set | 4 / 0 |
| Athletes with no sport on file | ~50 (the old signup collected almost nothing) |

## Why it isn't working

1. **The only product is a human match, and matching stopped.** Every athlete signs up, sees "you're on the list, usually takes a few days", and then gets nothing. 89% never got a mentor. That's why only 8 of 98 came back.
2. **The bottleneck is mentor supply plus manual ops, not code.** No mentor has joined in 5+ months. Sports don't line up either: waiting athletes are mostly soccer and golf, idle mentors are mostly basketball. Even so, 8 approved mentors sit idle, so matching itself stalled too.
3. **Matched pairs fizzle.** About 5 messages per match, almost no logged sessions, and calls that never get marked done. The retention features (icebreakers, program arc, certificates, presence) were built for a stage most users never reach.
4. **The site promises things it doesn't deliver.** "Usually takes a few days", "Every mentor has competed at the college level", "No time limits" (the program is 4 weeks), and "It worked, so we kept building" on /programs.
5. **The focus spread out.** Mentorship, resources, newsletter, podcast, internships, plus group sessions and training (both since retired), all launched while the core loop was broken.
6. **The one thing that worked was distribution through a group.** The Aug 12 spike (40 signups in a day) came from a single group or event, but there was nothing to hand that group. The product had nowhere to put them.

The interviews (Tim, Jet, Jacob) named the core problem plainly: **players who can do it in practice play scared in games.** They fear mistakes and are too hard on themselves. That problem happens every game, and a weekly mentor call is too slow and too rare to be the only answer.

## New direction

**Mentality Sports becomes a mental-training tool athletes use on their own around every game. Mentors are an optional upgrade, not the front door.**

- Value on day one, with no dependency on volunteer supply.
- A habit tied to something athletes already do (compete), which gives a reason to come back.
- Reps give mentors context when a match does happen, so matches start warmer.
- The same tool works for a whole team, which is the distribution channel that already worked once.

## Shipped on branch `mental-reps-pivot`

- `/reps`: three guided reps (Pre-Game Reset with box breathing, Post-Game Debrief, Bad Day Reset). They work **without an account**. A rep finished while signed out is saved on the device and stored to the account after signup.
- Confidence score on every rep, plus a streak and a trend line in the Locker Room.
- The athlete dashboard is no longer a dead-end waiting room. It now shows reps first, then an optional "Want a mentor too?" card that collects what the athlete wants help with and is honest about volunteer wait times.
- Reps are stored in the existing `reflections` table (no migration). Mentors see shared reps with the rep type and confidence score.
- Homepage repositioned: "PLAY LIKE YOU PRACTICE." The main button goes to a 2-minute rep. Promises the site couldn't keep were removed (match timing, college-only claim, no-time-limits, "it worked").
- Mental Reps added to the nav and the programs list. /programs copy corrected.

## Next (in priority order)

1. **Team codes for coaches.** A coach creates a team, shares a code, and the roster does a pre-game reset before games. The coach sees anonymous team confidence trends. Start with Tim's UHS freshman team. This needs a `teams` table and a migration.
2. **Clear the backlog.** Email the 87 waiting athletes: apologize, point them to reps, and re-ask whether they want a mentor. Match the 8 idle mentors this week. Archive mentor requests from people who don't respond.
3. **Reminders.** A game-day push or email ("Game today? 2-minute reset") and a next-morning debrief nudge.
4. **Mentor recruiting focused on soccer and golf,** which is where the waiting demand is.
5. **Cleanup.** Auto-close past "upcoming" calls. Fix the ~6 profiles whose `sport` was stored as a nested array (`{{Basketball}}`).
6. **Measure:** reps per athlete per week, D7/D30 return rate, and % of matches with 3+ calls.
