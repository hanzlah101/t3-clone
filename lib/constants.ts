import { env } from "@/env"

export const ROUTES = {
  auth: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  afterLogin: env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  ssoCb: "/sso-callback"
}
