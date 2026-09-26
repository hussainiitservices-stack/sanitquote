"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { TextField } from "@/components/forms/text-field"
import { Button } from "@/components/ui/button"
import { signIn } from "@/lib/auth/actions"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"

export function LoginForm({
  next,
  authError,
}: {
  next?: string
  authError?: string
}) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await signIn({ ...values, next })
    if (result?.ok === false) {
      form.setError("root", { message: result.message })
    }
  })

  const rootError = form.formState.errors.root?.message

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Merchants use a username. Platform admins use an email.
        </p>
      </div>
      {authError ? (
        <p className="text-sm text-destructive" role="alert">
          The sign-in link could not be confirmed. Try again with your email and password.
        </p>
      ) : null}
      <TextField
        label="Email or username"
        autoComplete="username"
        error={form.formState.errors.identifier?.message}
        {...form.register("identifier")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      {rootError ? (
        <p className="text-sm text-destructive" role="alert">
          {rootError}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
