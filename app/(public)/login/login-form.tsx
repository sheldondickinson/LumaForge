"use client";

import { useActionState } from "react";
import {
  loginAction,
  type LoginActionState,
} from "@/app/(public)/login/actions";

const initialState: LoginActionState = { message: null };

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          autoFocus
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          className="min-h-11 w-full rounded-lg border bg-[var(--surface)] px-3"
        />
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)] disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
