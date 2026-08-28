# Login Failure — Verify First, Then Fix

## What the evidence actually shows

I have not confirmed a bug yet, so this plan starts with verification rather than a speculative fix.

Confirmed from the auth logs and database:

- Your account `michael@soareslandscaping.ca` is healthy: confirmed, not banned, not deleted.
- It signed in **successfully at 1:15:41pm today** from the preview URL.
- Three attempts at 1:18pm were rejected by the auth server with `invalid_credentials`, and those came from a **different origin** than the successful one (`...lovableproject.com` vs `id-preview--...lovable.app`).
- The sign-in code passes your email and password straight through with no transformation. There is no client-side mangling I can see.

`invalid_credentials` means the auth server compared the submitted pair against the stored hash and they did not match. That is consistent with either a genuinely different password being submitted, or something upstream substituting a value. I cannot tell which from logs alone, because the submitted password is never logged.

## Urgent: you are one attempt from a lockout

The rate limiter has recorded **4 failed login attempts** against your IP. The limit is 5 in a 15-minute window, after which you are blocked for 15 minutes. One more wrong attempt locks you out.

**Step 1 — clear that counter now** so you can keep testing without a lockout.

## Step 2 — Determine whether this is a bug or a credential mismatch

Add temporary diagnostic logging to the login submit handler that records, on failure only:

- the exact character length of the password string being submitted
- whether it has leading/trailing whitespace
- the exact email string being submitted, including case

It logs **shape, never the password itself**. If the length does not match what you typed, something in the form or a password manager is substituting a value and it is a real bug. If the length matches exactly, the stored password is genuinely different from what you are typing and the fix is a reset.

You attempt one login, and the console tells us which branch we are in.

## Step 3 — Fix based on what Step 2 shows

If it is a bug in the form, I fix it directly.

If the submitted value is exactly what you typed, then the stored password differs from your memory of it — most likely changed at some point — and the resolution is the Forgot Password flow to set a known one.

## Step 4 — Remove the diagnostic logging

The logging from Step 2 comes out once we have the answer.

## Technical details

- The rate-limit row lives in `auth_rate_limits`, keyed `ip:153.67.1.171`, action `login`, currently 4 attempts. Clearing means deleting that row.
- Diagnostics go in `handleSubmit` in `src/components/auth/LoginForm.tsx`, in the existing `error` branch.
- No auth configuration, RLS policy, or account record gets modified.

## One thing I want to flag

Nothing in this session's work touched authentication. The changes were the feedback-reply and notification policies, the spreadsheet library upgrade, and typing fixes on equipment and insurance update payloads. None of them sit on the login path, so I do not believe this is a regression from those — but Step 2 will confirm that rather than leaving it as an assumption.
