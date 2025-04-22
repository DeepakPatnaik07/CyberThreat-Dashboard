interface CriticalityRatingProps {
  rating: "Critical" | "High" | "Medium" | "Low"
}

export function CriticalityRating({ rating }: CriticalityRatingProps) {
  const getStyles = (rating: string) => {
    switch (rating) {
      case "Critical":
        return "bg-red-500/20 text-red-400"
      case "High":
        return "bg-orange-500/20 text-orange-400"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400"
      case "Low":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-white/10 text-white/60"
    }
  }

  return (
    <div className={`px-2 py-0.5 text-xs font-medium rounded ${getStyles(rating)}`}>
      {rating}
    </div>
  )
}
