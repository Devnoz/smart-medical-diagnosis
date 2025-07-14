"\"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Camera,
  Mic,
  MicOff,
  Upload,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Activity,
  Zap,
} from "lucide-react"

interface AnalysisResult {
  medical_assessment: {
    primary_diagnosis: string
    confidence_score: number
    severity_level: string
    description: string
  }
  visual_findings: {
    condition_detected: string
    visual_characteristics: string[]
    areas_of_concern: string[]
  }
  audio_analysis: {
    symptom_description: string
    vocal_indicators: string[]
    respiratory_patterns: string[]
  }
  recommendations: string[]
  next_steps: string[]
  timestamp: string
}

export default function UnifiedAnalysis() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      // Reset previous results
      setAnalysisResult(null)
      setAudioBlob(null)
    }
  }, [])

  const removeImage = useCallback(() => {
    setSelectedImage(null)
    setImagePreview("")
    setAnalysisResult(null)
    setAudioBlob(null)
  }, [])

  const startRecording = useCallback(async () => {
    if (!selectedImage) {
      alert("Please upload an image first")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }, [selectedImage])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const analyzeImageAndAudio = useCallback(async () => {
    if (!selectedImage || !audioBlob) {
      alert("Please upload an image and record symptoms first")
      return
    }

    setIsAnalyzing(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)
      formData.append("audio", audioBlob, "symptoms.wav")

      setUploadProgress(25)

      const response = await fetch("/api/analyze-unified", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(75)

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const result = await response.json()
      setAnalysisResult(result)
      setUploadProgress(100)
    } catch (error) {
      console.error("Analysis error:", error)
      alert("Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
      setUploadProgress(0)
    }
  }, [selectedImage, audioBlob])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Eye className="w-6 h-6 text-blue-600" />
            Medical Image & Symptom Analysis
          </CardTitle>
          <CardDescription>
            Upload a medical image and record your symptoms for comprehensive AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                Upload Medical Image
              </h3>

              {!selectedImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-600 mb-3">Upload medical image</p>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Browse Files
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">JPG, PNG, WEBP (Max 10MB)</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Medical image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button variant="destructive" size="sm" onClick={removeImage} className="absolute top-2 right-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedImage.name}</p>
                    <p className="text-xs text-gray-500">{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Audio Recording */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Mic className="w-4 h-4 text-green-600" />
                Record Symptoms
              </h3>

              <div className="border rounded-lg p-6 text-center bg-gradient-to-br from-green-50 to-blue-50">
                <div className="space-y-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${
                      isRecording
                        ? "bg-red-500 shadow-lg shadow-red-200 animate-pulse"
                        : "bg-green-500 hover:bg-green-600 shadow-lg cursor-pointer"
                    }`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                  </div>

                  {isRecording ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Recording symptoms...</p>
                      <p className="text-lg font-mono text-red-600">{formatTime(recordingTime)}</p>
                      <p className="text-xs text-gray-500 mt-2">Describe your symptoms clearly</p>
                    </div>
                  ) : audioBlob ? (
                    <div>
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-600 font-medium">Symptoms recorded</p>
                      <p className="text-xs text-gray-500">Duration: {formatTime(recordingTime)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedImage ? "Click to record symptoms" : "Upload image first"}
                      </p>
                      <p className="text-xs text-gray-500">Describe pain, symptoms, duration, etc.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Button */}
          {selectedImage && audioBlob && !analysisResult && (
            <div className="text-center">
              <Button
                onClick={analyzeImageAndAudio}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 px-8 py-3 text-lg"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Analyze Image & Symptoms
                  </>
                )}
              </Button>

              {isAnalyzing && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">Processing... {Math.round(uploadProgress)}%</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Analysis Results
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {Math.round(analysisResult.medical_assessment.confidence_score * 100)}% Confidence
                </Badge>
                <Badge className={getSeverityColor(analysisResult.medical_assessment.severity_level)}>
                  {analysisResult.medical_assessment.severity_level} Severity
                </Badge>
              </div>
            </div>
            <CardDescription>
              Analysis completed on {new Date(analysisResult.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Diagnosis */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Medical Assessment
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  {analysisResult.medical_assessment.primary_diagnosis}
                </h4>
                <p className="text-sm text-blue-800">{analysisResult.medical_assessment.description}</p>
              </div>
            </div>

            {/* Combined Findings */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Visual Findings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-600" />
                  Visual Analysis
                </h3>
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="font-medium text-green-900 mb-1">Condition Detected:</p>
                    <p className="text-sm text-green-800">{analysisResult.visual_findings.condition_detected}</p>
                  </div>

                  {analysisResult.visual_findings.visual_characteristics.length > 0 && (
                    <div>
                      <p className="font-medium text-green-900 mb-2">Visual Characteristics:</p>
                      <ul className="text-sm text-green-800 space-y-1">
                        {analysisResult.visual_findings.visual_characteristics.map((char, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {char}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.visual_findings.areas_of_concern.length > 0 && (
                    <div>
                      <p className="font-medium text-green-900 mb-2">Areas of Concern:</p>
                      <ul className="text-sm text-green-800 space-y-1">
                        {analysisResult.visual_findings.areas_of_concern.map((concern, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio Analysis */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-purple-600" />
                  Symptom Analysis
                </h3>
                <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="font-medium text-purple-900 mb-1">Symptoms Described:</p>
                    <p className="text-sm text-purple-800">{analysisResult.audio_analysis.symptom_description}</p>
                  </div>

                  {analysisResult.audio_analysis.vocal_indicators.length > 0 && (
                    <div>
                      <p className="font-medium text-purple-900 mb-2">Vocal Indicators:</p>
                      <ul className="text-sm text-purple-800 space-y-1">
                        {analysisResult.audio_analysis.vocal_indicators.map((indicator, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Activity className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.audio_analysis.respiratory_patterns.length > 0 && (
                    <div>
                      <p className="font-medium text-purple-900 mb-2">Respiratory Patterns:</p>
                      <ul className="text-sm text-purple-800 space-y-1">
                        {analysisResult.audio_analysis.respiratory_patterns.map((pattern, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Activity className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                            {pattern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Recommendations
                </h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <ul className="text-sm text-green-800 space-y-2">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {analysisResult.next_steps.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Next Steps
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="text-sm text-blue-800 space-y-2">
                    {analysisResult.next_steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* New Analysis Button */}
            <div className="text-center pt-4 border-t">
              <Button
                onClick={() => {
                  setAnalysisResult(null)
                  setSelectedImage(null)
                  setImagePreview("")
                  setAudioBlob(null)
                  setRecordingTime(0)
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                New Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and should not
          replace professional medical advice. Always consult with a qualified healthcare provider for proper diagnosis
          and treatment.
        </AlertDescription>
      </Alert>
    </div>
  )
}
