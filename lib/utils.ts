import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Cookies from "js-cookie"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCookie<T>(cookieValue?: string, defaultValue?: T) {
  if (cookieValue !== undefined && cookieValue !== null) {
    try {
      return JSON.parse(cookieValue)
    } catch {
      return cookieValue
    }
  }

  return defaultValue
}

export function getCookie<T>(cookie: string, defaultValue?: T) {
  const cookieValue = Cookies.get(cookie)
  return parseCookie(cookieValue, defaultValue)
}

export function focusThreadInput() {
  setTimeout(() => document.getElementById("thread-input")?.focus(), 0)
}
