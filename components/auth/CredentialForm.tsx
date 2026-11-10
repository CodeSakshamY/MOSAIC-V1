"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, requestPasswordReset, updatePassword, type ActionState } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordHint } from "@/lib/auth/validation";

function Status({ state }: { state: ActionState }) {
  if (state?.error) {
    return (
      <p className="form-error" role="alert">
        {state.error}
      </p>
    );
  }
  if (state?.notice) {
    return <p role="status">{state.notice}</p>;
  }
  return null;
}

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action] = useActionState(signIn, initialError ? { error: initialError } : null);
  return (
    <form className="form-stack" action={action}>
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Status state={state} />
      <SubmitButton>Log in</SubmitButton>
      <p className="form-note">
        <Link href="/forgot-password">Forgot password</Link>
        {" · "}
        <Link href="/signup">Create an account</Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUp, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="form-note">
          {passwordHint}
        </p>
      </div>
      <div className="field">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
      </div>
      <Status state={state} />
      <SubmitButton>Create account</SubmitButton>
      <p className="form-note">
        Read the <Link href="/guidelines">community guidelines</Link> before you join. Accounts are for people aged 13 and older.
      </p>
      <p className="form-note">
        <Link href="/profile">Already have an account? Log in</Link>
      </p>
      <button type="button" className="google-disabled" disabled>
        Continue with Google
      </button>
      <p className="form-note">Google sign-in is not turned on.</p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <Status state={state} />
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="form-note">
          {passwordHint}
        </p>
      </div>
      <Status state={state} />
      <SubmitButton>Save password</SubmitButton>
    </form>
  );
}
