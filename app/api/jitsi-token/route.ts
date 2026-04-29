import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@/app/lib/supabase";

const APP_ID = "lysbro";
const APP_SECRET = process.env.JITSI_SECRET!;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { room, name } = await req.json();
  if (!room) return NextResponse.json({ error: "Missing room" }, { status: 400 });

  const token = jwt.sign(
    {
      aud: APP_ID,
      iss: APP_ID,
      sub: "meet.lysbro.com",
      room,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
      context: {
        user: {
          name: name ?? user.email,
          email: user.email,
          avatar: "",
        },
      },
    },
    APP_SECRET,
    { algorithm: "HS256" }
  );

  return NextResponse.json({ token });
}
