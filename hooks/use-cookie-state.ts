import * as React from "react"
import Cookies from "js-cookie"
import { getCookie } from "@/lib/utils"

export function useCookieState<T>(
  key: string,
  initialValue: T
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

  return [value, updateValue]
}
