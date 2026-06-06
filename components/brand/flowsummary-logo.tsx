import Image from 'next/image'

type FlowSummaryLogoProps = {
  className?: string
  priority?: boolean
}

export function FlowSummaryLogo({
  className = 'h-8 w-8 rounded-lg',
  priority = false,
}: FlowSummaryLogoProps) {
  return (
    <Image
      src="/brand/flowsummary-logo.png"
      alt="FlowSummary"
      width={800}
      height={800}
      className={className}
      priority={priority}
    />
  )
}
