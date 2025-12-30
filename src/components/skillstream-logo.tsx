import * as React from "react"
import { cn } from "@/lib/utils"

interface SkillStreamLogoProps {
  className?: string
  size?: number
  variant?: "full" | "icon"
}

export function SkillStreamLogo({ 
  className, 
  size = 32,
  variant = "icon"
}: SkillStreamLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Abstract S with stream elements */}
        {/* Top curve of S */}
        <path
          d="M20 30 Q30 20, 50 25 T80 30"
          stroke="hsl(221, 83%, 53%)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Middle curve of S */}
        <path
          d="M80 30 Q70 50, 50 50 T20 70"
          stroke="hsl(221, 83%, 53%)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Bottom curve of S */}
        <path
          d="M20 70 Q30 80, 50 75 T80 70"
          stroke="hsl(221, 83%, 53%)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Stream elements - flowing lines */}
        <path
          d="M25 25 Q35 20, 45 25"
          stroke="hsl(262, 80%, 50%)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M75 35 Q65 40, 55 35"
          stroke="hsl(262, 80%, 50%)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M25 75 Q35 70, 45 75"
          stroke="hsl(262, 80%, 50%)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        {/* Additional stream dots */}
        <circle cx="30" cy="28" r="2" fill="hsl(262, 80%, 50%)" opacity="0.6" />
        <circle cx="70" cy="68" r="2" fill="hsl(262, 80%, 50%)" opacity="0.6" />
        <circle cx="40" cy="72" r="2" fill="hsl(262, 80%, 50%)" opacity="0.6" />
      </svg>
      {variant === "full" && (
        <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          SkillStream
        </span>
      )}
    </div>
  )
}

