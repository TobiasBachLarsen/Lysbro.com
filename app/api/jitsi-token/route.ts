import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const APP_ID = "lysbro";
const APP_SECRET = process.env.JITSI_SECRET!;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { room, name } = await req.json();
  if (!room) return NextResponse.json({ error: "Missing room" }, { status: 400 });

  const roomMatch = /^agora-(.+)-room$/.exec(room);
  if (!roomMatch) return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  const meetingId = roomMatch[1];

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, user_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  const isHost = meeting.user_id === user.id;

  let isInvited = false;
  if (!isHost) {
    const { data: invite } = await supabase
      .from("messages")
      .select("id")
      .eq("receiver_id", user.id)
      .eq("type", "meeting_invite")
      .eq("invite_status", "accepted")
      .contains("meeting_data", { meeting_id: meetingId })
      .maybeSingle();
    isInvited = !!invite;
  }

  if (!isHost && !isInvited) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
