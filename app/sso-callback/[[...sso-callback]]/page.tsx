import { Spinner } from "@/components/ui/spinner"
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SSOCallback() {
  return (
    <>
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-5" />
      </div>
      <AuthenticateWithRedirectCallback />
    </>
  )
}
