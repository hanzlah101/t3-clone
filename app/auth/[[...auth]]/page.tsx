"use client"

import { useState } from "react"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import { useSignIn, useSession } from "@clerk/nextjs"

import { GoogleIcon } from "@/components/icons/google"
import { GitHubIcon } from "@/components/icons/github"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/lib/constants"

type Provider = "oauth_google" | "oauth_github"

export default function Auth() {
  const [pending, setPending] = useState<Provider | null>(null)
  const { signIn, isLoaded } = useSignIn()
  const { isSignedIn } = useSession()

  async function googleSignIn(provider: Provider) {
    if (!isLoaded) return null

    try {
      setPending(provider)
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: ROUTES.ssoCb,
        redirectUrlComplete: ROUTES.afterLogin
      })
    } catch {
      toast.error("Oh no! Something went wrong", {
        description: "Failed to sign in, please try again"
      })
    } finally {
      setPending(null)
    }
  }

  if (isSignedIn === true) redirect(ROUTES.afterLogin)

  return (
    <main className="mx-auto flex size-full min-h-svh max-w-lg flex-col justify-center p-4 text-center">
      <h1 className="text-2xl font-semibold">
        Welcome to <span className="text-primary font-bold">T3.Clone</span>
      </h1>
      <h2 className="mt-2 font-medium">
        Just another AI wrapper — like yours, but working 😉
      </h2>

      <Button
        size="xl"
        variant="outline"
        className="mx-auto mt-7 w-full max-w-sm"
        onClick={() => googleSignIn("oauth_google")}
        disabled={!!pending}
      >
        {pending === "oauth_google" ? <Spinner /> : <GoogleIcon />}
        Continue with Google
      </Button>

      <Button
        size="xl"
        variant="outline"
        className="mx-auto mt-3 mb-5 w-full max-w-sm"
        onClick={() => googleSignIn("oauth_github")}
        disabled={!!pending}
      >
        {pending === "oauth_github" ? <Spinner /> : <GitHubIcon />}
        Continue with Github
      </Button>

      <p className="text-muted-foreground text-sm">
        By continuing, you agree to our{" "}
        <span className="text-primary hover:text-primary/80 cursor-pointer transition-colors">
          Terms of Service
        </span>{" "}
        and{" "}
        <span className="text-primary hover:text-primary/80 cursor-pointer transition-colors">
          Privacy Policy
        </span>
      </p>
    </main>
  )
}
