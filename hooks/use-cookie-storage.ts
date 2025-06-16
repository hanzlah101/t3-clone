import * as React from "react"
import Cookies from "js-cookie"

export function useCookieState<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [value, setValue] = React.useState<T>(initialValue)

  React.useEffect(() => {
    const cookieValue = Cookies.get(key)
    if (cookieValue !== undefined) {
      try {
        setValue(JSON.parse(cookieValue))
      } catch {
        setValue(cookieValue as unknown as T)
      }
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
