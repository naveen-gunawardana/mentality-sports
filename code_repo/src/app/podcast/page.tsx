"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  Clock,
  Headphones,
  Apple,
  Youtube,
  Play,
  ArrowRight,
} from "lucide-react";
import { NewsletterSignup } from "@/components/newsletter-signup";

interface Episode {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  episode_number: number | null;
  season: number | null;
  spotify_url: string | null;
  apple_url: string | null;
  youtube_url: string | null;
  duration: string | null;
  published_at: string | null;
}

const TEASER_TOPICS = [
  "Performance anxiety",
  "Identity beyond the sport",
  "Coming back from injury",
  "The pressure to be perfect",
  "Talking to your coach",
  "Burnout & rest",
  "Confidence on game day",
  "Life after the final whistle",
];

function epLabel(ep: Episode) {
  const n = ep.episode_number;
  if (n == null) return null;
  const padded = String(n).padStart(2, "0");
  return ep.season != null ? `S${ep.season} · EP ${padded}` : `EPISODE ${padded}`;
}

/** Build a Spotify embed URL from a standard open.spotify.com episode/show link. */
function spotifyEmbed(url: string): string | null {
  const m = url.match(
    /open\.spotify\.com\/(?:embed\/)?(episode|show)\/([a-zA-Z0-9]+)/,
  );
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function EpisodeCard({ ep }: { ep: Episode }) {
  const label = epLabel(ep);
  const spotifyEmbedUrl = ep.spotify_url ? spotifyEmbed(ep.spotify_url) : null;
  const ytId = ep.youtube_url ? youtubeId(ep.youtube_url) : null;

  return (
    <article className="flex flex-col rounded-sm border border-offWhite-300 bg-offWhite hover:border-orange-300 hover:bg-white transition-colors overflow-hidden">
      {/* YouTube embed */}
      {ytId && (
        <div className="relative w-full aspect-video bg-navy">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
            title={ep.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center justify-center rounded-sm bg-navy text-white w-16 h-16 shrink-0">
            <Mic className="h-4 w-4 text-orange-400 mb-0.5" />
            {ep.episode_number != null ? (
              <span className="text-xl font-black font-condensed leading-none">
                {String(ep.episode_number).padStart(2, "0")}
              </span>
            ) : (
              <Headphones className="h-5 w-5 text-white/60" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {label && (
                <span className="rounded-sm px-2 py-0.5 text-[11px] font-medium bg-orange-50 text-orange-600">
                  {label}
                </span>
              )}
              {ep.duration && (
                <span className="inline-flex items-center gap-1 text-[11px] text-navy/40">
                  <Clock className="h-3 w-3" /> {ep.duration}
                </span>
              )}
            </div>
            <h3 className="font-bold text-navy text-base leading-snug mb-1.5">
              {ep.title}
            </h3>
            {ep.description && (
              <p className="text-xs text-navy/55 leading-relaxed line-clamp-3">
                {ep.description}
              </p>
            )}
          </div>
        </div>

        {spotifyEmbedUrl && (
          <div className="mt-5 overflow-hidden rounded-sm">
            <iframe
              src={spotifyEmbedUrl}
              title={`Listen to ${ep.title} on Spotify`}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="block"
            />
          </div>
        )}

        {(ep.spotify_url || ep.apple_url || ep.youtube_url) && (
          <div className="flex items-center gap-2 flex-wrap mt-5 pt-4 border-t border-offWhite-300">
            {ep.spotify_url && (
              <a
                href={ep.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm bg-navy hover:bg-navy/90 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
              >
                <Play className="h-3.5 w-3.5 text-orange-400" /> Spotify
              </a>
            )}
            {ep.apple_url && (
              <a
                href={ep.apple_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm border border-offWhite-400 hover:border-navy/30 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:text-navy transition-colors"
              >
                <Apple className="h-3.5 w-3.5" /> Apple Podcasts
              </a>
            )}
            {ep.youtube_url && (
              <a
                href={ep.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm border border-offWhite-400 hover:border-navy/30 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:text-navy transition-colors"
              >
                <Youtube className="h-3.5 w-3.5" /> YouTube
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function PodcastPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase
        .from("podcast_episodes")
        .select(
          "id,slug,title,description,episode_number,season,spotify_url,apple_url,youtube_url,duration,published_at",
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .then(({ data }) => {
          if (!active) return;
          setEpisodes((data ?? []) as unknown as Episode[]);
          setLoading(false);
        });
    });
    return () => {
      active = false;
    };
  }, []);

  const hasEpisodes = episodes.length > 0;
  // Episodes come back newest-first, so the banner always advertises the latest drop.
  const latestEpisode = episodes[0];

  return (
    <div>
      {hasEpisodes && (
        <div className="bg-navy border-b border-white/10 text-center py-2.5 px-4 text-xs text-white/60 tracking-wide">
          {latestEpisode?.episode_number != null ? (
            <>
              Episode {latestEpisode.episode_number} is{" "}
              <span className="text-white font-semibold">now live</span> — watch it below.
            </>
          ) : (
            <>
              New episode{" "}
              <span className="text-white font-semibold">now live</span> — watch it below.
            </>
          )}
        </div>
      )}

      {/* Hero */}
      <div className="relative bg-[#0c1628] overflow-hidden">
        <div
          aria-hidden
          className="absolute top-1/2 right-[-2rem] -translate-y-1/2 font-black text-white/[0.03] leading-none select-none pointer-events-none font-condensed"
          style={{ fontSize: "clamp(7rem, 18vw, 20rem)" }}
        >
          PODCAST
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-5">
            <Mic className="h-5 w-5 text-orange-400" />
            <span className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em]">
              {hasEpisodes ? "Now streaming" : "Coming soon"}
            </span>
          </div>
          <h1
            className="font-black text-white font-condensed tracking-tight leading-none mb-5"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)" }}
          >
            THE PODCAST
          </h1>
          <p className="max-w-xl text-white/55 text-[15px] leading-relaxed">
            Honest conversations with athletes, mentors, and experts on the
            mental side of competing — the doubt, the pressure, the comebacks,
            and what it really takes to stay in the game. No highlight reels.
            Just the real stuff nobody talks about.
          </p>
          <a
            href="/podcast/apply"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-orange-500 hover:bg-orange-400 px-6 py-3 text-sm font-bold text-white transition-colors"
          >
            <Mic className="h-4 w-4" />
            Get on the Podcast
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20 text-navy/40 text-sm">
            Loading episodes…
          </div>
        ) : hasEpisodes ? (
          <>
            <div className="flex items-center gap-3 mb-8">
              <Headphones className="h-5 w-5 text-orange-500" />
              <h2 className="text-2xl font-black text-navy font-condensed tracking-wide">
                EPISODES
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {episodes.map((ep) => (
                <EpisodeCard key={ep.id} ep={ep} />
              ))}
            </div>

            <div className="mt-16 rounded-sm bg-[#0c1628] p-8 sm:p-10">
              <p className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em] mb-3">
                Never miss a drop
              </p>
              <h3 className="text-2xl font-black text-white font-condensed tracking-wide mb-2">
                GET NEW EPISODES IN YOUR INBOX
              </h3>
              <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-lg">
                We&apos;ll let you know the moment a new conversation goes live.
              </p>
              <NewsletterSignup
                source="podcast"
                theme="dark"
                showName
                className="max-w-xl"
              />
            </div>

            {/* Apply to be a guest */}
            <div className="mt-8 rounded-sm border border-offWhite-300 bg-offWhite p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="font-bold text-[10px] text-orange-500 uppercase tracking-[0.3em] mb-2">Share your story</p>
                <h3 className="text-xl font-black text-navy font-condensed tracking-wide mb-1">
                  INTERESTED IN BEING A GUEST?
                </h3>
                <p className="text-sm text-navy/55 leading-relaxed max-w-md">
                  We&apos;re looking for athletes, coaches, and mental performance experts with a story worth telling.
                </p>
              </div>
              <a
                href="/podcast/apply"
                className="shrink-0 inline-flex items-center gap-2 rounded-sm bg-navy hover:bg-navy/90 px-6 py-3 text-sm font-semibold text-white transition-colors"
              >
                <Mic className="h-4 w-4 text-orange-400" />
                Submit a Guest Application
              </a>
            </div>
          </>
        ) : (
          /* Empty state — the expected case, made the hero of the page */
          <div className="mx-auto max-w-3xl">
            <div className="rounded-sm border border-offWhite-300 bg-offWhite overflow-hidden">
              <div className="bg-[#0c1628] px-8 py-10 sm:px-10 text-center relative overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center font-black text-white/[0.04] leading-none select-none pointer-events-none font-condensed"
                  style={{ fontSize: "clamp(8rem, 22vw, 16rem)" }}
                >
                  01
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-orange-500 mb-5">
                    <Mic className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-bold text-[10px] text-orange-400 uppercase tracking-[0.3em] mb-3">
                    In production
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-black text-white font-condensed tracking-tight leading-none mb-4">
                    EPISODE 01 IS ON THE WAY
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
                    We&apos;re recording our first season right now — raw,
                    honest conversations with athletes who&apos;ve fought the
                    mental battles you&apos;re fighting. Be first to hear it.
                  </p>
                </div>
              </div>

              <div className="px-8 py-10 sm:px-10">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-navy/35 mb-4">
                  What we&apos;re getting into
                </p>
                <div className="flex flex-wrap gap-2 mb-10">
                  {TEASER_TOPICS.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm border border-offWhite-300 bg-white px-3 py-1.5 text-xs font-medium text-navy/65"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-widest text-navy/35 mb-4">
                  Listen on
                </p>
                <div className="flex flex-wrap items-center gap-2.5 mb-10">
                  <span className="inline-flex items-center gap-2 rounded-sm border border-dashed border-offWhite-400 bg-offWhite px-4 py-2.5 text-xs font-semibold text-navy/40">
                    <Play className="h-4 w-4" />
                    Spotify
                    <span className="ml-1 rounded-sm bg-navy/8 px-1.5 py-0.5 text-[10px] font-medium text-navy/45">
                      At launch
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-sm border border-dashed border-offWhite-400 bg-offWhite px-4 py-2.5 text-xs font-semibold text-navy/40">
                    <Apple className="h-4 w-4" />
                    Apple Podcasts
                    <span className="ml-1 rounded-sm bg-navy/8 px-1.5 py-0.5 text-[10px] font-medium text-navy/45">
                      At launch
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-sm border border-dashed border-offWhite-400 bg-offWhite px-4 py-2.5 text-xs font-semibold text-navy/40">
                    <Youtube className="h-4 w-4" />
                    YouTube
                    <span className="ml-1 rounded-sm bg-navy/8 px-1.5 py-0.5 text-[10px] font-medium text-navy/45">
                      At launch
                    </span>
                  </span>
                </div>

                <div className="rounded-sm bg-navy p-6 sm:p-7">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ArrowRight className="h-4 w-4 text-orange-400" />
                    <p className="font-bold text-white text-lg font-condensed tracking-wide">
                      GET NOTIFIED WHEN WE GO LIVE
                    </p>
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed mb-5">
                    Drop your email and we&apos;ll send you episode one the day
                    it lands — plus the occasional behind-the-scenes from the
                    studio.
                  </p>
                  <NewsletterSignup source="podcast" theme="dark" showName />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
