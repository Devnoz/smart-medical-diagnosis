"use client"

import { Stethoscope } from "lucide-react"

export default function Header() {
  return (
    <header className="absolute top-4 left-4 z-10">
      <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-md rounded-lg px-3 py-2 shadow-sm">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900">AI Doctor 2.0</h1>
        </div>
      </div>
    </header>
  )
}
