import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface InviteEmailParams {
  toEmail: string;
  projectTitle: string;
  role: "editor" | "viewer" | "owner";
  inviterEmail?: string;
  projectId?: string;
}

export async function sendCollaboratorInviteEmail({
  toEmail,
  projectTitle,
  role,
  inviterEmail = "Seorang pengguna GeoVertex",
  projectId,
}: InviteEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const projectUrl = `${baseUrl}/project/${projectId || ""}`;

  const roleText = role === "editor" ? "Editor (Bisa Edit & Digitasi)" : "Viewer (Lihat Peta)";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Undangan Proyek GeoVertex</title>
      </head>
      <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <div style="display: flex; align-items: center; margin-bottom: 24px;">
            <div style="background-color: #2563eb; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; color: #ffffff; margin-right: 12px;">
              G
            </div>
            <span style="font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px;">GeoVertex SaaS</span>
          </div>

          <hr style="border: 0; border-top: 1px solid #1e293b; margin-bottom: 24px;" />

          <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin-top: 0;">Anda Diundang Kolaborasi Proyek Pemetaan! 🗺️</h2>
          
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
            Hallo, <strong style="color: #f1f5f9;">${toEmail}</strong>!<br/>
            <strong style="color: #38bdf8;">${inviterEmail}</strong> telah mengundang Anda untuk bergabung dan berkolaborasi pada proyek GIS spasial:
          </p>

          <div style="background-color: #1e293b; border-left: 4px solid #2563eb; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">${projectTitle}</div>
            <div style="font-size: 12px; color: #94a3b8;">Peran / Akses Anda: <span style="color: #34d399; font-weight: 600;">${roleText}</span></div>
          </div>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
            Klik tombol di bawah ini untuk membuka workspace peta dan mulai melihat atau mengedit geometri fitur spasial bersama tim:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${projectUrl}" style="background-color: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);">
              Buka Proyek GeoVertex
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #1e293b; margin-top: 32px; margin-bottom: 20px;" />

          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} GeoVertex Cloud GIS Platform. Email ini dikirim secara otomatis.
          </p>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log("=================================================");
    console.log("📧 [DEV MODE / RESEND MOCK EMAIL NOTIFICATION]");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: [GeoVertex] Undangan Proyek "${projectTitle}"`);
    console.log(`Role: ${role}`);
    console.log(`Invited By: ${inviterEmail}`);
    console.log(`Project URL: ${projectUrl}`);
    console.log("Catatan: Tambahkan RESEND_API_KEY di .env.local untuk mengirim email asli.");
    console.log("=================================================");
    return { success: true, mocked: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "GeoVertex <onboarding@resend.dev>",
      to: [toEmail],
      subject: `[GeoVertex] Anda diundang ke proyek "${projectTitle}"`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend send email error:", error);

      // Check if error is due to Resend Free Sandbox restriction (can only send to account owner email)
      if (
        error.message?.includes("testing emails to your own email address") ||
        (error as { name?: string }).name === "validation_error"
      ) {
        console.warn("=================================================");
        console.warn("⚠️ [RESEND SANDBOX DOMAIN RESTRICTION]");
        console.warn(`Resend Free Tier (onboarding@resend.dev) hanya dapat mengirim email asli ke email pemilik akun Resend.`);
        console.warn(`Email Tujuan: ${toEmail}`);
        console.warn(`Link Akses Proyek: ${projectUrl}`);
        console.warn(`Tips: Verifikasi domain milik Anda di https://resend.com/domains agar dapat mengundang email siapapun.`);
        console.warn("=================================================");

        return {
          success: true,
          mocked: true,
          note: `[Resend Sandbox] Email disimulasikan di server log karena domain resend.dev hanya mengirim ke email pemilik akun.`,
        };
      }

      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengirim email";
    console.error("Resend error:", message);
    return { success: false, error: message };
  }
}
