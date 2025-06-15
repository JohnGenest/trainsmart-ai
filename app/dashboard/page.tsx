'use client'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// TypeScript interface for Speech Recognition
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      [index: number]: {
        transcript: string
      }
      isFinal: boolean
    }
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: () => void
  onresult: (event: SpeechRecognitionEvent) => void
  onend: () => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new(): SpeechRecognition
    }
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showCoachClaude, setShowCoachClaude] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
      }

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(interimTranscript)
        if (finalTranscript) {
          setUserInput(finalTranscript)
          setTranscript('')
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        setTranscript('')
      }

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        setTranscript('')
        console.error('Speech recognition error:', event.error)
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  // Sample workout data
  const todaysWorkout = {
    type: "Tempo Run",
    distance: "6 miles",
    pace: "7:50/mile",
    details: ["1.5 mi warm-up", "3 mi @ tempo pace", "1.5 mi cool-down"],
    duration: "~55 minutes",
    coachingTip: "Keep the tempo miles steady and controlled. If you feel like you're working too hard, back off slightly - consistency is more important than hitting exact pace."
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex justify-between items-center text-white">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-blue-100">{session.user?.name}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-blue-100 hover:text-white text-sm"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Today's Workout Card */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-blue-100">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏃‍♂️</span>
              <span className="text-sm text-gray-600">Today&apos;s Training</span>
            </div>
            <div className="text-sm text-gray-500">Week 5, Day 2</div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">{todaysWorkout.type}</h2>
          <div className="text-lg text-gray-600 mb-4">
            {todaysWorkout.distance} • {todaysWorkout.duration}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            {todaysWorkout.details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <span className="text-gray-600">{detail}</span>
              </div>
            ))}
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❤️</span>
                <span className="text-sm font-medium text-gray-700">Target Pace</span>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-lg text-sm font-semibold mt-1 inline-block">
                {todaysWorkout.pace}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl mb-4">
            <div className="text-sm opacity-90 mb-1">💡 Coach Claude says:</div>
            <div className="text-sm leading-relaxed">{todaysWorkout.coachingTip}</div>
          </div>

          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{width: '32%'}}></div>
            </div>
            <div className="text-xs text-gray-600 text-center">Week 5 of 22 • 32% to Chicago Marathon</div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
              Start Workout
            </button>
            <button 
              onClick={() => setShowCoachClaude(true)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
            >
              Ask Claude
            </button>
          </div>
        </div>
      </div>

      {/* Coach Claude Modal with Voice Input */}
      {showCoachClaude && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Coach Claude</h3>
              <button 
                onClick={() => {
                  setShowCoachClaude(false)
                  setUserInput('')
                  setTranscript('')
                  if (isListening) stopListening()
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>You:</strong> How should today&apos;s tempo run feel?
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-800 text-sm">
                  <strong>Coach Claude:</strong> Your tempo pace should feel &quot;comfortably hard&quot; - you should be able to say a few words but not hold a full conversation. Focus on consistent effort rather than exact pace.
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              {(isListening || transcript) && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 text-xs font-medium">
                      {isListening ? 'Listening...' : 'Processing...'}
                    </span>
                  </div>
                  <p className="text-green-800 text-sm italic">
                    {transcript || 'Speak now...'}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask Coach Claude anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && userInput.trim() && alert('Claude integration coming next!')}
                />
                
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!recognitionRef.current}
                  className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } ${
                    !recognitionRef.current ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={!recognitionRef.current ? 'Voice input not supported in this browser' : (isListening ? 'Stop recording' : 'Start voice input')}
                >
                  {isListening ? '🔴' : '🎤'}
                </button>

                <button 
                  onClick={() => userInput.trim() && alert('Claude integration coming next!')}
                  disabled={!userInput.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-500 text-center">
                {recognitionRef.current ? (
                  <>🎤 Click microphone to speak your question hands-free</>
                ) : (
                  <>Voice input not available in this browser</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}