import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const APP_ID = "lysbro";
const APP_SECRET = process.env.JITSI_SECRET!;

// Udsteder den JWT, Jitsi-serveren kræver for at lukke nogen ind i et rum. Tre veje ind:
// værten, en bruger med en accepteret invitation, eller en gæst (med eller uden konto),
// som værten har lukket ind fra venteværelset. Gæsten sender id'et på sin
// meeting_lobby-række med, og vi tjekker at den er sat til "admitted".
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

  const { room, name, lobbyId } = await req.json();
  if (!room) return NextResponse.json({ error: "Missing room" }, { status: 400 });

  const roomMatch = /^agora-(.+)-room$/.exec(room);
  if (!roomMatch) return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  const meetingId = roomMatch[1];

  const { data: { user } } = await supabase.auth.getUser();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, user_id")
    .eq("id", meetingId)
    .single();

  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  const isHost = !!user && meeting.user_id === user.id;

  let isInvited = false;
  if (user && !isHost) {
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

  let admittedGuestName: string | null = null;
  if (!isHost && !isInvited && typeof lobbyId === "string" && lobbyId) {
    const { data: entry } = await supabase
      .from("meeting_lobby")
      .select("guest_name")
      .eq("id", lobbyId)
      .eq("meeting_id", meetingId)
      .eq("status", "admitted")
      .maybeSingle();
    admittedGuestName = entry?.guest_name ?? null;
  }

  if (!isHost && !isInvited && admittedGuestName === null) {
    return NextResponse.json({ error: user ? "Forbidden" : "Unauthorized" }, { status: user ? 403 : 401 });
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
          name: name ?? user?.email ?? admittedGuestName ?? "Gæst",
          email: user?.email ?? "",
          avatar: "",
        },
      },
    },
    APP_SECRET,
    { algorithm: "HS256" }
  );

  return NextResponse.json({ token });
}
