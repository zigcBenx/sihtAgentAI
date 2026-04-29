import { Resend } from "resend";

export interface EmailJobItem {
  title: string;
  company: string;
  location: string | null;
  url: string;
}

export interface EmailAlertItem {
  title: string;
  url: string;
  companyName: string;
}

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendAgentResultsEmail(params: {
  to: string;
  agentName: string;
  agentType: string;
  agentId: string;
  newJobs: EmailJobItem[];
  newAlerts: EmailAlertItem[];
}): Promise<void> {
  const client = getResend();
  if (!client) {
    console.log("[email] RESEND_API_KEY not set, skipping email");
    return;
  }

  const totalNew = params.newJobs.length + params.newAlerts.length;
  if (totalNew === 0) return;

  const html = buildEmailHtml(params);

  await client.emails.send({
    from: "ŠihtAgent <notifications@benxlabs.com>",
    to: params.to,
    subject: `${params.agentName}: ${totalNew} new ${totalNew === 1 ? "result" : "results"} found`,
    html,
  });
}

function buildEmailHtml(params: {
  agentName: string;
  agentType: string;
  agentId: string;
  newJobs: EmailJobItem[];
  newAlerts: EmailAlertItem[];
}): string {
  const isJobSearch = params.agentType === "job_search";

  let itemsHtml = "";

  if (isJobSearch && params.newJobs.length > 0) {
    itemsHtml = params.newJobs
      .map(
        (job) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e2ed;">
          <a href="${escapeHtml(job.url)}" style="color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 15px;">${escapeHtml(job.title)}</a>
          <div style="color: #5f6380; font-size: 13px; margin-top: 2px;">${escapeHtml(job.company)}${job.location ? ` &middot; ${escapeHtml(job.location)}` : ""}</div>
        </td>
      </tr>`
      )
      .join("");
  } else if (params.newAlerts.length > 0) {
    itemsHtml = params.newAlerts
      .map(
        (alert) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e0e2ed;">
          <a href="${escapeHtml(alert.url)}" style="color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 15px;">${escapeHtml(alert.title)}</a>
          <div style="color: #5f6380; font-size: 13px; margin-top: 2px;">${escapeHtml(alert.companyName)}</div>
        </td>
      </tr>`
      )
      .join("");
  }

  const totalNew = params.newJobs.length + params.newAlerts.length;
  const typeLabel = isJobSearch ? "job matches" : "company alerts";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f6f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f7fb; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e0e2ed; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 28px 20px; border-bottom: 1px solid #e0e2ed;">
              <div style="font-size: 18px; font-weight: 700; color: #1a1d2e;">
                ${escapeHtml(params.agentName)}
              </div>
              <div style="font-size: 14px; color: #5f6380; margin-top: 4px;">
                Found ${totalNew} new ${typeLabel}
              </div>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding: 8px 28px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 28px 28px;" align="center">
              <a href="https://siht-agent-ai.vercel.app/dashboard/agents/${params.agentId}" style="display: inline-block; background: linear-gradient(to bottom, #4f46e5, #4338ca); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 24px; border-radius: 10px;">
                View All Results
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 28px; background-color: #f6f7fb; border-top: 1px solid #e0e2ed;">
              <div style="font-size: 11px; color: #9194a8; text-align: center;">
                Sent by ŠihtAgent AI &middot; You&rsquo;re receiving this because your agent found new results.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
