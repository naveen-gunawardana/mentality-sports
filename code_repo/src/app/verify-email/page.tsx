import { Logo } from "@/components/logo";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-parchment flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <Logo href="/" variant="dark" size="md" />
      </div>
      <div className="bg-white rounded-2xl border border-offWhite-200 shadow-sm max-w-md w-full p-10">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-navy/8 mx-auto mb-5">
          <Mail className="h-6 w-6 text-navy" />
        </div>
        <h1 className="font-outfit text-2xl font-bold text-navy mb-2">Check your email</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          You&apos;re in — your spot is saved. We sent a confirmation link to your email; click it to sign in to your dashboard.
        </p>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it? Check your spam folder, or email{" "}
          <a href="mailto:hello@mentalitysports.com" className="text-navy font-medium underline underline-offset-2 hover:text-orange-500 transition-colors">
            hello@mentalitysports.com
          </a>{" "}
          and we&apos;ll sort it out.
        </p>
      </div>
    </div>
  );
}
