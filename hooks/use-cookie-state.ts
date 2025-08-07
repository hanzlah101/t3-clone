import * as React from "react"
import Cookies from "js-cookie"
import { getCookie } from "@/lib/utils"

export function useCookieState<T>(
  key: string,
  initialValue: T,
  pollingInterval?: number
): [T, (value: T) => void] {
  const [value, setValue] = React.useState<T>(initialValue)

  React.useEffect(() => {
    const cookieValue = getCookie(key)
    if (cookieValue !== undefined) {
      setValue(cookieValue)
    }
  }, [key])

  const updateValue = React.useCallback(
    (value: T) => {
      setValue(value)
      Cookies.set(key, JSON.stringify(value))
    },
    [key]
  )

  React.useEffect(() => {
    if (pollingInterval === undefined) return

    const interval = setInterval(() => {
      const cookieValue = getCookie(key)
      const parsedValue = cookieValue !== undefined ? cookieValue : initialValue

      // Only update if value actually changed
      if (JSON.stringify(parsedValue) !== JSON.stringify(value)) {
        setValue(parsedValue)
      }
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [key, value, initialValue, pollingInterval])

  return [value, updateValue]
}
