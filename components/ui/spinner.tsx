import { Loader } from "lucide-react"

import { cn } from "@/lib/utils"

export function Spinner({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return <Loader className={cn("size-5 animate-spin", className)} {...props} />
}
