import { NextResponse } from "next/server";
import { sendCollaboratorInviteEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { toEmail, projectTitle, role, inviterEmail, projectId } = body;

    if (!toEmail || !projectTitle) {
      return NextResponse.json(
        { success: false, error: "Alamat email dan judul proyek wajib diisi." },
        { status: 400 }
      );
    }

    const result = await sendCollaboratorInviteEmail({
      toEmail,
      projectTitle,
      role: role || "editor",
      inviterEmail,
      projectId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
