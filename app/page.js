'use client'
import BackgroundHex from '@/components/BackgroundHex'
import LoginPanel from '@/components/LoginPanel'

export default function Page() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center text-gray-800">
      <BackgroundHex />
      <LoginPanel />
    </div>
  )
}
