import { env } from "@/env"

export const DEFAULT_ERROR =
  "An error occurred while processing your request. Please try again."

export const ROUTES = {
  auth: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  afterLogin: env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  ssoCb: "/sso-callback"
}
