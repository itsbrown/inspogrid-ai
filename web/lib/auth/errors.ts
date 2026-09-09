/** Map Supabase/auth API errors to short, user-friendly copy. */
export function mapAuthError(message: string | undefined | null): string {
  if (!message) return "Something went wrong. Please try again.";

  const m = message.toLowerCase();

  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid credentials") ||
    m.includes("invalid email or password")
  ) {
    return "Email or password is incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the link.";
  }
  if (
    m.includes("user already registered") ||
    m.includes("already been registered") ||
    m.includes("email address is already registered")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (
    (m.includes("password") &&
      (m.includes("weak") ||
        m.includes("at least") ||
        m.includes("short") ||
        m.includes("least 6") ||
        m.includes("characters"))) ||
    m.includes("signup_disabled")
  ) {
    return "Password is too weak. Use at least 6 characters.";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("over_email_send_rate_limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email") || m.includes("email_address_invalid")) {
    return "Please enter a valid email address.";
  }
  if (m.includes("user not found")) {
    return "No account found with that email.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  // Avoid dumping long API jargon
  if (message.length > 140) return "Something went wrong. Please try again.";
  return message;
}

/** Safe relative path for post-auth redirects (blocks open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function withNextParam(href: string, next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}next=${encodeURIComponent(next)}`;
}
