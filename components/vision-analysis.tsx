"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function VisionAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          Component Deprecated
        </CardTitle>
        <CardDescription>This component has been replaced by the unified analysis interface.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Please use the main analysis interface for combined image and voice analysis.</p>
      </CardContent>
    </Card>
  )
}
