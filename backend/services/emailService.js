import nodemailer from "nodemailer";

/**
 * Returns an authenticated Nodemailer transporter for Gmail / SMTP.
 * Returns null if SMTP_USER or SMTP_PASS is missing (triggers dev console mode).
 */
const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpUser = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  // Strip any spaces from 16-character Google App Passwords (e.g. "abcd efgh ijkl mnop")
  const smtpPass = rawPass ? rawPass.replace(/\s+/g, "") : "";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  if (!smtpUser || !smtpPass) {
    return null;
  }

  const isGmail =
    smtpHost.includes("gmail") ||
    smtpUser.includes("@gmail.com") ||
    smtpHost === "smtp.gmail.com";

  const transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }
      : {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }
  );

  return { transporter, smtpUser, isGmail };
};

/**
 * Sends an invitation email to the respondent.
 * Formatted with Respondent name, Claimant name, case details, and single-use invite link.
 */
export const sendInviteEmail = async ({
  respondentEmail,
  respondentName,
  claimantName,
  claimantEmail,
  caseTitle,
  category,
  amountInDispute,
  inviteLink,
}) => {
  const mailAuth = getTransporter();

  const respGreeting =
    respondentName && respondentName.trim() && respondentName !== "Respondent"
      ? respondentName.trim()
      : respondentEmail
      ? respondentEmail.split("@")[0]
      : "there";

  const cleanClaimant = claimantName?.trim() || "Claimant";
  const cleanTitle = caseTitle?.trim() || "Dispute Case";
  const cleanCategory = category || "General Civil";
  const amountFormatted =
    amountInDispute && Number(amountInDispute) > 0
      ? `₹${Number(amountInDispute).toLocaleString()}`
      : null;

  if (!mailAuth) {
    console.log(`\n================== [EMAIL SERVICE (DEV MODE)] ==================`);
    console.log(`To: ${respondentEmail} (${respGreeting})`);
    console.log(`From: ${cleanClaimant} (${claimantEmail || "Claimant"}) via JurisAI`);
    console.log(`Subject: Dispute Settlement Invitation: "${cleanTitle}" on JurisAI`);
    console.log(`Category: ${cleanCategory} | Disputed Amount: ${amountFormatted || "N/A"}`);
    console.log(`Link to Respond: ${inviteLink}`);
    console.log(`[Tip] Configure SMTP_USER and SMTP_PASS in backend/.env to send real Gmail emails.`);
    console.log(`=================================================================\n`);
    return { success: true, mode: "console_logged" };
  }

  const { transporter, smtpUser } = mailAuth;

  const mailOptions = {
    from: `"${cleanClaimant} via JurisAI" <${smtpUser}>`,
    replyTo: claimantEmail ? `"${cleanClaimant}" <${claimantEmail}>` : `"${cleanClaimant}" <${smtpUser}>`,
    to: respondentEmail,
    subject: `Dispute Settlement Invitation: "${cleanTitle}" on JurisAI`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; padding: 28px; border: 1px solid #1e293b;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">JurisAI Dispute Settlement Portal</h2>
        </div>
        
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Hello <strong style="color: #f8fafc;">${respGreeting}</strong>,
        </p>
        
        <p style="font-size: 14px; line-height: 1.6;">
          <strong style="color: #f8fafc;">${cleanClaimant}</strong> has filed a civil dispute titled <strong style="color: #38bdf8;">"${cleanTitle}"</strong> and invited you to resolve it amicably on <strong>JurisAI</strong> — an explainable, impartial Alternative Dispute Resolution (ADR) platform.
        </p>

        <div style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Dispute Details</div>
          <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0;"><strong>Case Title:</strong> ${cleanTitle}</p>
          <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0;"><strong>Category:</strong> ${cleanCategory}</p>
          ${amountFormatted ? `<p style="font-size: 13px; color: #34d399; margin: 4px 0;"><strong>Amount in Dispute:</strong> ${amountFormatted}</p>` : ""}
          <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0;"><strong>Claimant:</strong> ${cleanClaimant} (${claimantEmail || smtpUser})</p>
          <p style="font-size: 13px; color: #cbd5e1; margin: 4px 0;"><strong>Respondent:</strong> ${respGreeting} (${respondentEmail})</p>
        </div>

        <div style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Your Response Options</div>
          <ul style="font-size: 13px; color: #cbd5e1; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong style="color: #10b981;">Accept Request:</strong> Join the dispute, file your statement & documents, and get an explainable AI advisory analysis.</li>
            <li><strong style="color: #f87171;">Decline:</strong> Refuse to participate, closing the dispute.</li>
            <li><strong style="color: #fbbf24;">Pending / Review Later:</strong> Keep the request pending and review the case details within the 7-day validity window.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 28px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Respond to Dispute Invitation &rarr;
          </a>
        </div>

        <p style="font-size: 11px; color: #64748b; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 16px;">
          Notice: JurisAI provides advisory, non-binding AI decision support. If you do not recognize this request, you may safely decline or ignore this email. Link valid for 7 days.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Dispute invite sent successfully to ${respondentEmail} via Gmail (${smtpUser}). MessageId: ${info.messageId}`);
    return { success: true, mode: "smtp_sent", messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send dispute invite via Gmail SMTP (${smtpUser}):`, err.message);
    throw err;
  }
};

/**
 * Sends a notification email to the claimant when the respondent takes action (Accepts or Declines).
 */
export const sendRespondentActionEmail = async ({
  claimantEmail,
  claimantName,
  respondentName,
  respondentEmail,
  caseTitle,
  action, // "accepted" or "declined"
  caseLink,
}) => {
  const mailAuth = getTransporter();

  const isAccepted = action === "accepted";
  const actionLabel = isAccepted ? "ACCEPTED" : "DECLINED";
  const statusColor = isAccepted ? "#10b981" : "#f87171";

  if (!mailAuth) {
    console.log(`\n================== [EMAIL SERVICE (DEV MODE)] ==================`);
    console.log(`To Claimant: ${claimantEmail}`);
    console.log(`Subject: [JurisAI] Respondent ${actionLabel} your dispute request: "${caseTitle}"`);
    console.log(`Respondent: ${respondentName} (${respondentEmail})`);
    console.log(`Action Taken: ${actionLabel}`);
    console.log(`Case Link: ${caseLink}`);
    console.log(`=================================================================\n`);
    return { success: true, mode: "console_logged" };
  }

  const { transporter, smtpUser } = mailAuth;

  const mailOptions = {
    from: `"JurisAI ADR Platform" <${smtpUser}>`,
    to: claimantEmail,
    subject: `Update: Respondent ${respondentName} has ${actionLabel} your dispute "${caseTitle}"`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; padding: 28px; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin: 0 0 16px 0; font-size: 20px;">JurisAI Case Status Notification</h2>
        
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Hello <strong style="color: #f8fafc;">${claimantName}</strong>,
        </p>
        
        <p style="font-size: 14px; line-height: 1.6;">
          We are writing to update you on your civil dispute titled <strong style="color: #38bdf8;">"${caseTitle}"</strong>.
        </p>

        <div style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin: 20px 0; border-left: 4px solid ${statusColor};">
          <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Respondent Action</div>
          <div style="font-size: 16px; font-weight: bold; color: ${statusColor}; margin-bottom: 8px;">
            ${respondentName} (${respondentEmail}) has ${actionLabel} the dispute.
          </div>
          <p style="font-size: 13px; color: #cbd5e1; margin: 0; line-height: 1.5;">
            ${isAccepted
              ? "The respondent has joined the resolution process. Both parties can now submit confidential statements and documents for AI evaluation."
              : "The respondent has opted out of online dispute resolution. This case is now marked as closed."}
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${caseLink}" style="display: inline-block; padding: 12px 28px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            View Dispute in Dashboard &rarr;
          </a>
        </div>

        <p style="font-size: 11px; color: #64748b; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 16px;">
          JurisAI — Independent, objective, and explainable dispute resolution for small civil matters.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Status update sent to ${claimantEmail} via Gmail (${smtpUser}). MessageId: ${info.messageId}`);
    return { success: true, mode: "smtp_sent", messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send status update to ${claimantEmail}:`, err.message);
    throw err;
  }
};

/**
 * Sends notification when AI decision report is generated and ready for review.
 */
export const sendDecisionReadyEmail = async ({
  recipientEmail,
  recipientName,
  caseTitle,
  suggestedSettlement,
  caseLink,
}) => {
  const mailAuth = getTransporter();

  if (!mailAuth) {
    console.log(`\n================== [EMAIL SERVICE (DEV MODE)] ==================`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: [JurisAI] Resolution Ready for Dispute: "${caseTitle}"`);
    console.log(`Recipient: ${recipientName}`);
    if (suggestedSettlement) {
      console.log(`Remedy: ${suggestedSettlement}`);
    }
    console.log(`Case Link: ${caseLink}`);
    console.log(`=================================================================\n`);
    return { success: true, mode: "console_logged" };
  }

  const { transporter, smtpUser } = mailAuth;

  const mailOptions = {
    from: `"JurisAI ADR Platform" <${smtpUser}>`,
    to: recipientEmail,
    subject: `Advisory Resolution Ready: "${caseTitle}" on JurisAI`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; padding: 28px; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin: 0 0 16px 0; font-size: 20px;">JurisAI Advisory Resolution Ready</h2>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">Hello <strong style="color: #f8fafc;">${recipientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">
          The JurisAI decision support engine has completed its impartial evaluation of both statements and submitted documents for <strong style="color: #38bdf8;">"${caseTitle}"</strong>.
        </p>
        ${
          suggestedSettlement
            ? `<div style="background: #020617; border: 1px solid #0284c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 11px; color: #38bdf8; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">Recommended Settlement Remedy</div>
                <div style="font-size: 13px; color: #e2e8f0; line-height: 1.6;">${suggestedSettlement}</div>
              </div>`
            : ""
        }
        <div style="text-align: center; margin: 28px 0;">
          <a href="${caseLink}" style="display: inline-block; padding: 12px 28px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Review Decision & Respond &rarr;
          </a>
        </div>
        <p style="font-size: 11px; color: #64748b; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 16px;">
          Both parties can accept or reject this advisory outcome to finalize resolution.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Decision notification delivered to ${recipientEmail} via Gmail (${smtpUser}). MessageId: ${info.messageId}`);
    return { success: true, mode: "smtp_sent", messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send decision email to ${recipientEmail}:`, err.message);
    throw err;
  }
};

/**
 * Sends notification when both parties accept outcome and dispute is settled/closed.
 */
export const sendDisputeResolvedEmail = async ({
  recipientEmail,
  recipientName,
  caseTitle,
  caseLink,
}) => {
  const mailAuth = getTransporter();

  if (!mailAuth) {
    console.log(`\n================== [EMAIL SERVICE (DEV MODE)] ==================`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: [JurisAI] Dispute Successfully Resolved: "${caseTitle}"`);
    console.log(`Recipient: ${recipientName}`);
    console.log(`Case Link: ${caseLink}`);
    console.log(`=================================================================\n`);
    return { success: true, mode: "console_logged" };
  }

  const { transporter, smtpUser } = mailAuth;

  const mailOptions = {
    from: `"JurisAI ADR Platform" <${smtpUser}>`,
    to: recipientEmail,
    subject: `Dispute Resolved: "${caseTitle}" Settled on JurisAI`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; padding: 28px; border: 1px solid #1e293b;">
        <h2 style="color: #10b981; margin: 0 0 16px 0; font-size: 20px;">Dispute Successfully Settled & Closed</h2>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">Hello <strong style="color: #f8fafc;">${recipientName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">
          Great news! Both parties have formally reviewed and accepted the recommended resolution terms for <strong style="color: #38bdf8;">"${caseTitle}"</strong>.
        </p>
        <div style="background: #020617; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #10b981;">
          <div style="font-size: 14px; font-weight: bold; color: #10b981; margin-bottom: 4px;">Status: Closed & Settled</div>
          <div style="font-size: 12px; color: #cbd5e1;">The mutual agreement terms are recorded and final. Thank you for resolving this civil dispute amicably on JurisAI.</div>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${caseLink}" style="display: inline-block; padding: 12px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            View Final Record &rarr;
          </a>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Settlement notification delivered to ${recipientEmail} via Gmail (${smtpUser}). MessageId: ${info.messageId}`);
    return { success: true, mode: "smtp_sent", messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send settlement email to ${recipientEmail}:`, err.message);
    throw err;
  }
};
