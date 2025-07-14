"use client"
import { Stethoscope, Activity } from "lucide-react"
import UnifiedAnalysis from "@/components/unified-analysis"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Activity className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">AI Doctor 2.0</h1>
          <p className="text-lg text-gray-600">Upload medical image and record symptoms for AI analysis</p>
        </div>

        {/* Main Analysis Card */}
        <UnifiedAnalysis />
      </div>
    </div>
  )
}
