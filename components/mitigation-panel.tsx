import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, FileWarning, Shield } from "lucide-react"
import Link from "next/link"

interface MitigationPanelProps {
  id: string
  title: string
  severity: number
  mitigation: string
}

export function MitigationPanel({ id, title, severity, mitigation }: MitigationPanelProps) {
  const getSeverityLabel = (score: number) => {
    if (score >= 9.0) return "Critical"
    if (score >= 7.0) return "High"
    if (score >= 4.0) return "Medium"
    return "Low"
  }

  const getSeverityColor = (score: number) => {
    if (score >= 9.0) return "bg-red-500/20 text-red-400 border-red-500/30"
    if (score >= 7.0) return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    if (score >= 4.0) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-green-500/20 text-green-400 border-green-500/30"
  }

  return (
    <Card className="cyber-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Badge className="bg-purple-500/10 border-purple-500/30">
            <FileWarning className="h-3 w-3 mr-1" />
            {id}
          </Badge>
          <Badge variant="outline" className={getSeverityColor(severity)}>
            {getSeverityLabel(severity)} ({severity.toFixed(1)})
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">{title}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs">
          <Link href={`/cve-details?id=${id}`} className="text-purple-400 hover:text-purple-300">
            View full CVE details
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-2">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Mitigation Steps:</h4>
            <Badge variant="outline" className="bg-purple-900/20 border-purple-500/30">
              <Shield className="h-3 w-3 mr-1" />
              AI-Generated
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-line bg-black/20 p-3 rounded-md border border-purple-900/30">
            {mitigation}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" className="border-purple-900/30 hover:bg-purple-900/10">
          <Copy className="h-4 w-4 mr-2" />
          Copy Mitigation
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Shield className="h-4 w-4 mr-2" />
          Apply Mitigation
        </Button>
      </CardFooter>
    </Card>
  )
}
