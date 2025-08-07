import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/lib/constants"
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SSOCallback() {
  return (
    <>
      <div className="flex min-h-svh items-center justify-center">
        <Spinner />
      </div>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl={ROUTES.afterLogin}
        signUpFallbackRedirectUrl={ROUTES.afterLogin}
      />
    </>
  )
}
