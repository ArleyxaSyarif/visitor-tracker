import { headers } from "next/headers"
import { UAParser } from "ua-parser-js"

import { prisma } from "@/lib/prisma"

export async function GET() {
  const h = await headers()

  const ip =
    h.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"

  const ua = h.get("user-agent") || ""


  const parser = new UAParser(ua)
  const device = parser.getResult()

  const geo = await fetch(
    `https://ipinfo.io/${ip}/json`
  ).then(res => res.json())

  await prisma.visitor.create({
    data: {
      ip,
      city: geo.city,
      browser: device.browser.name,
      os: device.os.name,
    },
  })

  return Response.json({ ok: true })
}