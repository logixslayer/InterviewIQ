import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Info, 
  Sparkles
} from 'lucide-react';
import { loginWithEmail, isAuthProviderConfigured, getRememberedEmail } from '../services/authService';

interface LoginViewProps {
  onNavigate: (route: string) => void;
}

const ALLOWED_PROTECTED_ROUTES = [
  '/mock-interview-workspace',
  '/mock-interviews',
  '/overview',
  '/app',
  '/dashboard',
  '/evaluation-report',
  '/report',
  '/question-library',
  '/questions',
  '/my-progress',
  '/progress',
  '/practice-plan',
  '/plan',
  '/settings',
  '/profile'
];

/**
 * Validates that the requested redirect destination is a safe, internal application path.
 * Prevents open-redirect security vulnerabilities.
 */
function getSafeRedirectUrl(): string {
  if (typeof window === 'undefined') return '/overview';
  try {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (!redirect) return '/overview';

    // Must start with '/' and not '//' (protocol-relative URL)
    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
      return '/overview';
    }

    const cleanPath = redirect.split('?')[0].replace(/\/+$/, '') || '/';
    if (ALLOWED_PROTECTED_ROUTES.includes(cleanPath)) {
      return redirect;
    }
  } catch (e) {
    console.warn('Error parsing redirect query parameter:', e);
  }
  return '/overview';
}

function getRawRedirectParam(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect');
  } catch (_e) {
    return null;
  }
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  // Prepopulate email and rememberMe if user previously checked Remember Me
  const [email, setEmail] = useState(() => getRememberedEmail());
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!getRememberedEmail());
  const [showPassword, setShowPassword] = useState(false);

  // Field interaction tracking (following validate-input-after-interaction guidance)
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const authConfigured = isAuthProviderConfigured();
  const rawRedirect = getRawRedirectParam();
  const safeRedirect = getSafeRedirectUrl();

  // Field validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailEmpty = !email.trim();
  const isEmailInvalid = !isEmailEmpty && !emailRegex.test(email.trim());
  const emailError = touched.email 
    ? (isEmailEmpty ? 'Email address is required.' : isEmailInvalid ? 'Please enter a valid email address (e.g., name@example.com).' : null)
    : null;

  const isPasswordEmpty = !password;
  const passwordError = touched.password
    ? (isPasswordEmpty ? 'Password is required.' : null)
    : null;

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    setTouched({ email: true, password: true });
    setServerError(null);

    // Validate all fields
    if (isEmailEmpty || isEmailInvalid || isPasswordEmpty) {
      if (isEmailEmpty || isEmailInvalid) {
        document.getElementById('login-email')?.focus();
      } else if (isPasswordEmpty) {
        document.getElementById('login-password')?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginWithEmail({ 
        email: email.trim(), 
        password,
        rememberMe 
      });

      if (response.success && response.user) {
        // Confirmed authentication: proceed to intended safe destination
        onNavigate(safeRedirect);
      } else {
        // Inform user accurately about why authentication could not complete
        setServerError(
          response.error || 'Authentication failed. Please verify your credentials or check backend configuration.'
        );
      }
    } catch (err: any) {
      setServerError(err?.message || 'A network error occurred while attempting to sign in.');
    } finally {
      setIsSubmitting(false);
      // Email is strictly preserved on recoverable failure
    }
  };

  const handleNavigateToSignUp = () => {
    if (rawRedirect) {
      onNavigate(`/signup?redirect=${encodeURIComponent(rawRedirect)}`);
    } else {
      onNavigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center selection:bg-[#EFF4FF] selection:text-[#3867F5]">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 w-full">
        {/* =========================================================================
            LEFT COLUMN: BRANDING & PRODUCT IDENTITY (Deep Navy #101828)
            ========================================================================= */}
        <aside className="lg:col-span-5 bg-[#101828] text-[#FFFFFF] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Subtle decorative glow using Electric Blue (#3867F5) */}
          <div 
            className="absolute -top-24 -left-24 w-96 h-96 bg-[#3867F5]/10 rounded-full blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#3867F5]/15 rounded-full blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div 
              className="flex items-center gap-3 cursor-pointer group w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded-md"
              onClick={() => onNavigate('/')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate('/')}
              aria-label="Back to InterviewIQ Home"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] text-[#101828] flex items-center justify-center font-bold text-lg tracking-tight shadow-md">
                <span className="text-[#3867F5]">I</span>Q
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#FFFFFF] leading-none">
                  InterviewIQ
                </span>
                <span className="text-[11px] font-medium text-[#D0D5DD] tracking-wider uppercase mt-1">
                  AI Interview Coach
                </span>
              </div>
            </div>

            {/* Back to Home Link */}
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="mt-8 inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#D0D5DD] hover:text-[#FFFFFF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded px-1.5 py-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to home</span>
            </button>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 my-12 lg:my-0 animate-enter-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3867F5]/20 text-[#3867F5] text-xs font-semibold mb-4 border border-[#3867F5]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Realistic Interview Simulations</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FFFFFF] tracking-tight leading-snug mb-4">
              Master your technical delivery with targeted AI coaching.
            </h2>
            <p className="text-sm sm:text-base text-[#D0D5DD] leading-relaxed max-w-md">
              Sign in to resume tailored role mock interviews, practice follow-up trade-offs, and track your readiness rubric scores.
            </p>

            {/* Restrained decorative telemetry card */}
            <div className="mt-8 bg-[#182230] rounded-xl border border-[#D0D5DD]/20 p-5 max-w-md shadow-lg">
              <div className="flex items-center justify-between text-xs text-[#D0D5DD] mb-3">
                <span className="font-semibold text-[#FFFFFF]">Telemetry &amp; Scoring</span>
                <span className="text-[#16845B] font-bold">Rubric Active</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#D0D5DD]">
                  <span>STAR Structure Adherence</span>
                  <span className="text-[#FFFFFF] font-semibold">94%</span>
                </div>
                <div className="w-full bg-[#101828] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#3867F5] h-full w-[94%] rounded-full" />
                </div>
                <div className="flex justify-between text-[#D0D5DD] pt-1">
                  <span>Technical System Precision</span>
                  <span className="text-[#FFFFFF] font-semibold">88%</span>
                </div>
                <div className="w-full bg-[#101828] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#16845B] h-full w-[88%] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Branding Footer */}
          <div className="relative z-10 text-xs text-[#D0D5DD]/70">
            &copy; 2026 InterviewIQ Platform. All rights reserved.
          </div>
        </aside>

        {/* =========================================================================
            RIGHT COLUMN: AUTHENTICATION FORM (Pure White #FFFFFF on Soft #F6F8FC)
            ========================================================================= */}
        <main className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#D0D5DD] p-7 sm:p-10 shadow-[0_4px_20px_rgba(16,24,40,0.04)] animate-enter-up">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182230] tracking-tight">
                Sign in to your account
              </h1>
              <p className="mt-2 text-sm text-[#667085]">
                Enter your credentials below to access your interview workspace.
              </p>
            </div>

            {/* Destination Notice if user was redirected from a protected route */}
            {rawRedirect && (
              <div className="mb-5 p-3 rounded-lg bg-[#EFF4FF] border border-[#3867F5]/20 text-xs text-[#182230] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#3867F5] shrink-0" />
                <span>Sign in to access: <strong className="text-[#3867F5]">{safeRedirect}</strong></span>
              </div>
            )}

            {/* Provider Configuration Notice Banner if backend provider is unconfigured */}
            {!authConfigured && (
              <div 
                className="mb-6 p-4 rounded-xl bg-[#EFF4FF] border border-[#3867F5]/30 text-xs text-[#182230] flex items-start gap-3"
                role="note"
                aria-label="Provider configuration note"
              >
                <Info className="w-5 h-5 text-[#3867F5] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#182230]">
                    Authentication Backend Notice
                  </p>
                  <p className="text-[#667085] leading-relaxed">
                    No backend authentication provider (e.g. Firebase Auth, Supabase, or JWT) is connected yet. You can test form validation and accessibility, or directly access the demo workspace.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('/overview')}
                    className="inline-flex items-center gap-1 font-bold text-[#3867F5] hover:text-[#2e57d8] underline pt-0.5 cursor-pointer"
                  >
                    <span>Open Demo Practice Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Server Error Alert Banner */}
            {serverError && (
              <div 
                className="mb-6 p-4 rounded-xl bg-[#D92D20]/10 border border-[#D92D20]/30 text-xs text-[#D92D20] flex items-start gap-3 animate-enter-fade"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Sign-in Notice</p>
                  <p className="leading-relaxed">{serverError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email Address Field with autocomplete="username" */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="login-email" 
                  className="block text-sm font-semibold text-[#182230]"
                >
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (serverError) setServerError(null);
                    }}
                    onBlur={() => handleBlur('email')}
                    autoComplete="username"
                    required
                    placeholder="name@example.com"
                    aria-required="true"
                    aria-invalid={emailError ? 'true' : 'false'}
                    aria-describedby={emailError ? 'login-email-error' : undefined}
                    className={`w-full h-11 px-3.5 rounded-lg bg-[#FFFFFF] text-sm text-[#182230] placeholder:text-[#667085]/60 border transition-colors duration-150 focus:outline-none ${
                      emailError 
                        ? 'border-[#D92D20] focus:border-[#D92D20] focus:ring-3 focus:ring-[#D92D20]/15' 
                        : 'border-[#D0D5DD] focus:border-[#3867F5] focus:ring-3 focus:ring-[#3867F5]/15'
                    }`}
                  />
                </div>
                {emailError && (
                  <p 
                    id="login-email-error" 
                    className="text-xs font-medium text-[#D92D20] flex items-center gap-1 animate-enter-fade"
                    role="alert"
                  >
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password Field with autocomplete="current-password" */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="login-password" 
                  className="block text-sm font-semibold text-[#182230]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (serverError) setServerError(null);
                    }}
                    onBlur={() => handleBlur('password')}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    aria-required="true"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={passwordError ? 'login-password-error' : undefined}
                    className={`w-full h-11 pl-3.5 pr-11 rounded-lg bg-[#FFFFFF] text-sm text-[#182230] placeholder:text-[#667085]/60 border transition-colors duration-150 focus:outline-none ${
                      passwordError 
                        ? 'border-[#D92D20] focus:border-[#D92D20] focus:ring-3 focus:ring-[#D92D20]/15' 
                        : 'border-[#D0D5DD] focus:border-[#3867F5] focus:ring-3 focus:ring-[#3867F5]/15'
                    }`}
                  />
                  {/* Accessible Show/Hide Password Control */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#667085] hover:text-[#182230] focus:outline-none focus:ring-2 focus:ring-[#3867F5] rounded transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p 
                    id="login-password-error" 
                    className="text-xs font-medium text-[#D92D20] flex items-center gap-1 animate-enter-fade"
                    role="alert"
                  >
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label 
                  htmlFor="remember-me" 
                  className="flex items-center gap-2.5 text-xs text-[#667085] cursor-pointer select-none"
                >
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D0D5DD] text-[#3867F5] focus:ring-[#3867F5] focus:ring-offset-0 transition-colors cursor-pointer"
                  />
                  <span className="font-medium text-[#182230]">Remember email on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-[#3867F5] hover:bg-[#2e57d8] disabled:bg-[#3867F5]/60 text-[#FFFFFF] text-sm font-semibold transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3867F5] cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Links */}
            <div className="mt-8 pt-6 border-t border-[#D0D5DD] flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-[#667085]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={handleNavigateToSignUp}
                  className="font-bold text-[#3867F5] hover:text-[#2e57d8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded cursor-pointer"
                >
                  Create Account
                </button>
              </p>

              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="text-xs text-[#667085] hover:text-[#182230] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded cursor-pointer"
              >
                &larr; Return to InterviewIQ Home
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
