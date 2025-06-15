import { TextShimmer } from "@/components/ui/text-shimmer"

export default function Home() {
  return (
    <div>
      <TextShimmer className="font-mono text-sm" duration={1}>
        Generating code...
      </TextShimmer>
    </div>
  )
}
