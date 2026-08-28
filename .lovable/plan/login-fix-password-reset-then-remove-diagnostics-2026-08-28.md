# Login Fix: Password Reset, Then Remove Diagnostics

## What the diagnostic proved

The failed attempt at 17:21 UTC submitted:

- Email: `michael@soareslandscaping.ca` — 28 chars, no whitespace, already lowercase
- Password: 11 characters, no leading or trailing space
- Backend response: `Invalid login credentials`

The login form is sending exactly what you typed. This is not a bug in the app — the 11-character password being entered is not the one on the account. Note your successful login earlier at 17:15 came from the preview domain, while the failures came from a different app domain, which is a classic sign of a saved/autofilled password from one origin being used against the other.

## Plan

1. **Recover access via password reset.** Use the "Forgot password" flow on the sign-in screen to set a new password by email. This is the safe, self-serve path and needs no code change. (Passwords are one-way hashed, so the existing one cannot be read back for you.)
2. **Verify the reset flow actually works** — confirm the reset email link lands on the app's password-update screen and that the new password signs in cleanly. If any part of that flow is broken, fix it.
3. **Remove the temporary diagnostic logging** from the login form, since it has served its purpose.
4. **Clear the rate-limit counter** for your IP again if the extra failed attempts pushed it back up, so the reset attempt isn't blocked.

## Technical notes

- Diagnostic `console.log("[login-diagnostic]", ...)` block in `src/components/auth/LoginForm.tsx` gets deleted.
- Check the reset path end to end: reset request in the auth page, the redirect target configured for the recovery email, and the password-update handler.
- Rate-limit rows live in `public.auth_rate_limits`, keyed by `ip:<address>`; delete the row for the affected IP if present.
