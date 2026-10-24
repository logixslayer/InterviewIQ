import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { signUpWithEmail, isAuthProviderConfigured } from '../services/authService';

interface SignUpViewProps {
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

function getSafeRedirectUrl(): string {
  if (typeof window === 'undefined') return '/overview';
  try {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (!redirect) return '/overview';

    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
      return '/overview';
    }

    const cleanPath = redirect.split('?')[0].replace(/\/+$/, '') || '/';
    if (ALLOWED_PROTECTED_ROUTES.includes(cleanPath)) {
      return redirect;
    }
  } catch (e) {
    console.warn('Error parsing redirect param:', e);
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

export const SignUpView: React.FC<SignUpViewProps> = ({ onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field interaction tracking (following validate-input-after-interaction guidance)
  const [touched, setTouched] = useState<{
    fullName?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const authConfigured = isAuthProviderConfigured();
  const rawRedirect = getRawRedirectParam();
  const safeRedirect = getSafeRedirectUrl();

  // Field validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const isNameEmpty = !fullName.trim();
  const nameError = touched.fullName
    ? (isNameEmpty ? 'Full name is required.' : null)
    : null;

  const isEmailEmpty = !email.trim();
  const isEmailInvalid = !isEmailEmpty && !emailRegex.test(email.trim());
  const emailError = touched.email
    ? (isEmailEmpty ? 'Email address is required.' : isEmailInvalid ? 'Please enter a valid email address.' : null)
    : null;

  const isPasswordEmpty = !password;
  const isPasswordShort = !isPasswordEmpty && password.length < 8;
  const passwordError = touched.password
    ? (isPasswordEmpty ? 'Password is required.' : isPasswordShort ? 'Password must be at least 8 characters long.' : null)
    : null;

  const isConfirmEmpty = !confirmPassword;
  const isConfirmMismatch = !isConfirmEmpty && confirmPassword !== password;
  const confirmPasswordError = touched.confirmPassword
    ? (isConfirmEmpty ? 'Please confirm your password.' : isConfirmMismatch ? 'Passwords do not match.' : null)
    : null;

  const handleBlur = (field: 'fullName' | 'email' | 'password' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    setServerError(null);

    // Validate all fields
    if (isNameEmpty || isEmailEmpty || isEmailInvalid || isPasswordEmpty || isPasswordShort || isConfirmEmpty || isConfirmMismatch) {
      if (isNameEmpty) {
        document.getElementById('signup-name')?.focus();
      } else if (isEmailEmpty || isEmailInvalid) {
        document.getElementById('signup-email')?.focus();
      } else if (isPasswordEmpty || isPasswordShort) {
        document.getElementById('signup-password')?.focus();
      } else {
        document.getElementById('signup-confirm-password')?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await signUpWithEmail({
        fullName: fullName.trim(),
        email: email.trim(),
        password
      });

      if (response.success && response.user) {
        // Upon confirmed registration, navigate to intended safe destination
        onNavigate(safeRedirect);
      } else {
        // Inform user accurately about missing provider / registration state
        setServerError(
          response.error || 'Registration failed. Please check your details or backend authentication configuration.'
        );
      }
    } catch (err: any) {
      setServerError(err?.message || 'A network error occurred while attempting to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateToLogin = () => {
    if (rawRedirect) {
      onNavigate(`/login?redirect=${encodeURIComponent(rawRedirect)}`);
    } else {
      onNavigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center selection:bg-[#EFF4FF] selection:text-[#3867F5]">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 w-full">
        {/* =========================================================================
            LEFT COLUMN: BRANDING & VALUE PROPOSITION (Deep Navy #101828)
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
              <span>Create Your Candidate Profile</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FFFFFF] tracking-tight leading-snug mb-4">
              Begin your structured path to interview mastery.
            </h2>
            <p className="text-sm sm:text-base text-[#D0D5DD] leading-relaxed max-w-md">
              Create an account to calibrate mock interview levels, record practice answers, and unlock objective rubric diagnostics.
            </p>

            {/* Feature Checklist */}
            <div className="mt-8 space-y-3.5 max-w-md">
              <div className="flex items-start gap-3 bg-[#182230] p-3.5 rounded-xl border border-[#D0D5DD]/20">
                <CheckCircle2 className="w-5 h-5 text-[#16845B] shrink-0 mt-0.5" />
                <div className="text-xs text-[#D0D5DD]">
                  <strong className="text-[#FFFFFF] block font-semibold mb-0.5">Role-Tailored Simulations</strong>
                  Frontend, Full Stack, and System Architecture tracks.
                </div>
              </div>
              <div className="flex items-start gap-3 bg-[#182230] p-3.5 rounded-xl border border-[#D0D5DD]/20">
                <CheckCircle2 className="w-5 h-5 text-[#16845B] shrink-0 mt-0.5" />
                <div className="text-xs text-[#D0D5DD]">
                  <strong className="text-[#FFFFFF] block font-semibold mb-0.5">Objective Scoring Rubrics</strong>
                  Evaluates delivery structure, technical depth, and trade-off synthesis.
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
            RIGHT COLUMN: SIGN UP FORM (Pure White #FFFFFF on Soft #F6F8FC)
            ========================================================================= */}
        <main className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#D0D5DD] p-7 sm:p-10 shadow-[0_4px_20px_rgba(16,24,40,0.04)] animate-enter-up">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182230] tracking-tight">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-[#667085]">
                Enter your details to start practicing with InterviewIQ.
              </p>
            </div>

            {/* Destination Notice if user was redirected from a protected route */}
            {rawRedirect && (
              <div className="mb-5 p-3 rounded-lg bg-[#EFF4FF] border border-[#3867F5]/20 text-xs text-[#182230] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#3867F5] shrink-0" />
                <span>Register to unlock: <strong className="text-[#3867F5]">{safeRedirect}</strong></span>
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
                  <p className="font-bold">Sign-up Notice</p>
                  <p className="leading-relaxed">{serverError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name Field with autocomplete="name" */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="signup-name" 
                  className="block text-sm font-semibold text-[#182230]"
                >
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (serverError) setServerError(null);
                  }}
                  onBlur={() => handleBlur('fullName')}
                  autoComplete="name"
                  required
                  placeholder="Alex Morgan"
                  aria-required="true"
                  aria-invalid={nameError ? 'true' : 'false'}
                  aria-describedby={nameError ? 'signup-name-error' : undefined}
                  className={`w-full h-11 px-3.5 rounded-lg bg-[#FFFFFF] text-sm text-[#182230] placeholder:text-[#667085]/60 border transition-colors duration-150 focus:outline-none ${
                    nameError 
                      ? 'border-[#D92D20] focus:border-[#D92D20] focus:ring-3 focus:ring-[#D92D20]/15' 
                      : 'border-[#D0D5DD] focus:border-[#3867F5] focus:ring-3 focus:ring-[#3867F5]/15'
                  }`}
                />
                {nameError && (
                  <p 
                    id="signup-name-error" 
                    className="text-xs font-medium text-[#D92D20] flex items-center gap-1 animate-enter-fade"
                    role="alert"
                  >
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Email Address Field with autocomplete="email" */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="signup-email" 
                  className="block text-sm font-semibold text-[#182230]"
                >
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (serverError) setServerError(null);
                  }}
                  onBlur={() => handleBlur('email')}
                  autoComplete="email"
                  required
                  placeholder="alex.morgan@example.com"
                  aria-required="true"
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'signup-email-error' : undefined}
                  className={`w-full h-11 px-3.5 rounded-lg bg-[#FFFFFF] text-sm text-[#182230] placeholder:text-[#667085]/60 border transition-colors duration-150 focus:outline-none ${
                    emailError 
                      ? 'border-[#D92D20] focus:border-[#D92D20] focus:ring-3 focus:ring-[#D92D20]/15' 
                      : 'border-[#D0D5DD] focus:border-[#3867F5] focus:ring-3 focus:ring-[#3867F5]/15'
                  }`}
                />
                {emailError && (
                  <p 
                    id="signup-email-error" 
                    className="text-xs font-medium text-[#D92D20] flex items-center gap-1 animate-enter-fade"
                    role="alert"
                  >
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password Field with autocomplete="new-password" */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="signup-password" 
                  className="block text-sm font-semibold text-[#182230]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (serverError) setServerError(null);
                    }}
                    onBlur={() => handleBlur('password')}
                    autoComplete="new-password"
                    required
                    placeholder="At least 8 characters"
                    aria-required="true"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={passwordError ? 'signup-password-error' : undefined}
                    className={`w-full h-11 pl-3.5 pr-11 rounded-lg bg-[#FFFFFF] text-sm text-[#182230] placeholder:text-[#667085]/60 border transition-colors duration-150 focus:outline-none ${
                      passwordError 
                        ? 'border-[#D92D20] focus:border-[#D92D20] focus:ring-3 focus:ring-[#D92D20]/15' 
                        : 'border-[#D0D5DD] focus:border-[#3867F5] focus:ring-3 focus:ring-[#3867F5]/15'
                    }`}
                  />
                  {/* Accessible Password Visibility Control */}
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
                    id="signup-password-error" 
                    className="text-xs font-medium text-[#D92D20] flex items-center gap-1 animate-enter-fade"
                    role="alert"
                  >
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password Field with autocomplete="new-password" */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="signup-confirm-password" 
                  className="block text-sm font-semibold text-[#182230]"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (serverError) setServerError(null);
                    }}
                    onBlur={() => handleBlur('confirmPassword')}
                    autoComplete="new-password"
                    required
                    placeholder="Repeat password"
                    aria-required="true"
                    aria-invalid={confirmPasswordError ? 'true' : 'false'}
                    aria-describedby={confirmPasswordError ? 'signup-confirm-error' : undefined}
                    className={`w-full h-11 pl-3.5 pr-11 rounded-lg bg-[#FFFFFF] text-sm text-[#182230] placeholder:text-[#667085]/60 border transition-colors duration-150 focus:outline-none ${
                      confirmPasswordError 
                        ? 'border-[#D92D20] focus:border-[#D92D20] focus:ring-3 focus:ring-[#D92D20]/15' 
                        : 'border-[#D0D5DD] focus:border-[#3867F5] focus:ring-3 focus:ring-[#3867F5]/15'
                    }`}
                  />
                  {/* Accessible Password Visibility Control */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#667085] hover:text-[#182230] focus:outline-none focus:ring-2 focus:ring-[#3867F5] rounded transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p 
                    id="signup-confirm-error" 
                    className="text-xs font-medium text-[#D92D20] flex items-center gap-1 animate-enter-fade"
                    role="alert"
                  >
                    <span>{confirmPasswordError}</span>
                  </p>
                )}
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Links */}
            <div className="mt-8 pt-6 border-t border-[#D0D5DD] flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-[#667085]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleNavigateToLogin}
                  className="font-bold text-[#3867F5] hover:text-[#2e57d8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded cursor-pointer"
                >
                  Sign In
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
