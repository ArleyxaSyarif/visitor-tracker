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
  let provinceRaw = h.get("x-vercel-ip-country-region") || null

  // Decode URL-encoded city names (e.g. "Kota%20Bogor" -> "Kota Bogor")
  if (city) city = decodeURIComponent(city)
  if (provinceRaw) provinceRaw = decodeURIComponent(provinceRaw)

  // Map Indonesian ISO 3166-2 province codes to full names
  const provinceMap: Record<string, string> = {
    AC: "Aceh",
    SU: "Sumatera Utara",
    SB: "Sumatera Barat",
    RI: "Riau",
    JA: "Jambi",
    SS: "Sumatera Selatan",
    BE: "Bengkulu",
    LA: "Lampung",
    BB: "Kepulauan Bangka Belitung",
    KR: "Kepulauan Riau",
    JK: "DKI Jakarta",
    JB: "Jawa Barat",
    JT: "Jawa Tengah",
    JI: "Jawa Timur",
    YO: "DI Yogyakarta",
    BT: "Banten",
    BA: "Bali",
    NB: "Nusa Tenggara Barat",
    NT: "Nusa Tenggara Timur",
    KB: "Kalimantan Barat",
    KT: "Kalimantan Tengah",
    KS: "Kalimantan Selatan",
    KI: "Kalimantan Timur",
    KU: "Kalimantan Utara",
    SA: "Sulawesi Utara",
    ST: "Sulawesi Tengah",
    SG: "Sulawesi Selatan",
    SR: "Sulawesi Barat",
    SN: "Sulawesi Tenggara",
    GO: "Gorontalo",
    MA: "Maluku",
    MU: "Maluku Utara",
    PA: "Papua",
    PB: "Papua Barat",
    PS: "Papua Selatan",
    PT: "Papua Tengah",
    PE: "Papua Pegunungan",
    PD: "Papua Barat Daya",
  }

  let province = provinceRaw ? (provinceMap[provinceRaw] || provinceRaw) : null


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

  // Combine device vendor and model (e.g. "Samsung Galaxy S21", "Apple iPhone 13")
  const deviceName = [device.device.vendor, device.device.model]
    .filter(Boolean)
    .join(" ") || null

  await prisma.visitor.create({
    data: {
      ip,
      province,
      city,
      device: deviceName,
      browser: device.browser.name,
      os: device.os.name,
    },
  })


  return Response.json({ ok: true })
}