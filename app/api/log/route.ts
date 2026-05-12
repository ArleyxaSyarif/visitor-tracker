import { headers } from "next/headers"
import { UAParser } from "ua-parser-js"

import { prisma } from "@/lib/prisma"

export async function GET() {
  const h = await headers()

  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"

  const ua = h.get("user-agent") || ""

  const parser = new UAParser(ua)
  const device = parser.getResult()

  // Vercel provides accurate geo headers for free
  let city = h.get("x-vercel-ip-city") || null
  let province = h.get("x-vercel-ip-country-region") || null

  // Decode URL-encoded city names (e.g. "Kota%20Bogor" -> "Kota Bogor")
  if (city) city = decodeURIComponent(city)
  if (province) province = decodeURIComponent(province)

  // Fallback to ip-api.com if Vercel headers are not available (e.g. local dev)
  if (!city && ip !== "unknown") {
    try {
      const geo = await fetch(
        `http://ip-api.com/json/${ip}?fields=city,regionName`
      ).then(res => res.json())
      city = geo.city || null
      province = geo.regionName || null
    } catch {
      // ignore geo errors
    }
  }

  await prisma.visitor.create({
    data: {
      ip,
      province,
      city,
      browser: device.browser.name,
      os: device.os.name,
    },
  })

  return Response.json({ ok: true })
}