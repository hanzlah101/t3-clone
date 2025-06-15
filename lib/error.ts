import { ConvexError } from "convex/values"

export function parseError(error: unknown, fallback?: string) {
  if (error instanceof ConvexError) {
    if (typeof error.data === "string") return error.data
    return (error.data as { message: string }).message
  }

  return fallback ?? "Something went wrong, please try again later"
}
