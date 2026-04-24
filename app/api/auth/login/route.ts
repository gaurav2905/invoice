import { NextResponse } from "next/server";

import { createAuthToken, setSessionCookie, verifyAdminCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!(await verifyAdminCredentials(String(username || ""), String(password || "")))) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  const token = await createAuthToken(String(username));
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
