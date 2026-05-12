"use client"

import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    fetch("/api/log")
  }, [])

  return (
    <main>
      <h1>Visitor Tracker Active</h1>
    </main>
  )
}