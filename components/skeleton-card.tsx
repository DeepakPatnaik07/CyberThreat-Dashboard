import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function SkeletonCard() {
  return (
    <Card className="cyber-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="h-5 w-20 rounded-full bg-muted skeleton-pulse" />
          <div className="h-4 w-24 rounded-full bg-muted skeleton-pulse" />
        </div>
        <div className="h-6 w-full rounded-md bg-muted mt-2 skeleton-pulse" />
        <div className="h-4 w-1/2 rounded-full bg-muted mt-2 skeleton-pulse" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="h-4 w-full rounded-full bg-muted skeleton-pulse" />
          <div className="h-4 w-full rounded-full bg-muted skeleton-pulse" />
          <div className="h-4 w-3/4 rounded-full bg-muted skeleton-pulse" />
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <div className="h-8 w-24 rounded-md bg-muted skeleton-pulse" />
        <div className="h-8 w-20 rounded-md bg-muted skeleton-pulse" />
      </CardFooter>
    </Card>
  )
}
