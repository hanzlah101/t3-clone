"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { redirect } from "next/navigation"
import { GoogleOneTap, useSignIn, useSession } from "@clerk/nextjs"

import { GoogleIcon } from "@/components/icons/google"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/lib/constants"

export default function Auth() {
  const [isPending, startTransition] = useTransition()
  const { signIn, isLoaded } = useSignIn()
  const { isSignedIn } = useSession()

  function googleSignIn() {
    if (!isLoaded) return null
    startTransition(async () => {
      try {
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: ROUTES.ssoCb,
          redirectUrlComplete: ROUTES.afterLogin
        })
      } catch {
        toast.error("Oh no! Something went wrong", {
          description: "Failed to sign in, please try again"
        })
      }
    })
  }

  if (isSignedIn === true) redirect(ROUTES.afterLogin)

  return (
    <>
      <main className="mx-auto flex size-full min-h-svh max-w-lg flex-col justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">T3 Clone</h1>
        <h2 className="mt-2 font-medium">
          Sign in below (we&apos;ll increase your message limits if you do 😉)
        </h2>

        <Button
          size="xl"
          variant="outline"
          className="mx-auto mt-7 mb-5 w-full max-w-sm"
          onClick={googleSignIn}
          disabled={isPending}
        >
          {isPending ? <Spinner /> : <GoogleIcon />}
          Continue with Google
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
      <GoogleOneTap cancelOnTapOutside={false} />
    </>
  )
}
