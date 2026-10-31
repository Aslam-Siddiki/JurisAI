/**
 * JurisAI — Email Invite Construction Utilities
 * Builds formatted invite emails containing respondent and claimant names,
 * dispute details, and single-use invitation links for direct Gmail compose.
 */

export const generateInviteEmailContent = ({
  respondentName,
  respondentEmail,
  claimantName,
  caseTitle,
  category,
  amountInDispute,
  inviteLink,
}) => {
  const respGreeting =
    respondentName && respondentName.trim() && respondentName !== "Respondent" && respondentName !== "Pending Acceptance"
      ? respondentName.trim()
      : respondentEmail
      ? respondentEmail.split("@")[0]
      : "there";

  const cleanClaimant = claimantName?.trim() || "Claimant";
  const cleanTitle = caseTitle?.trim() || "Dispute Case";
  const cleanCategory = category || "General Civil";

  const subject = `Dispute Resolution Invitation: "${cleanTitle}" on JurisAI`;

  const amountLine =
    amountInDispute && Number(amountInDispute) > 0
      ? `\n• Amount in Dispute: ₹${Number(amountInDispute).toLocaleString()}`
      : "";

  const body = `Dear ${respGreeting},

I hope this email finds you well.

I have filed an amicable civil dispute resolution request regarding "${cleanTitle}" and invited you to resolve it on JurisAI — an independent, explainable AI-assisted Alternative Dispute Resolution (ADR) platform.

Dispute Summary:
• Dispute Title: ${cleanTitle}
• Category: ${cleanCategory}${amountLine}
• Claimant: ${cleanClaimant}
• Respondent: ${respondentEmail}

JurisAI enables both of us to submit our confidential statements and evidence securely. Once both submissions are received, the platform evaluates the facts against legal standards to provide an unbiased, objective advisory resolution.

👉 Click here to review and accept the dispute invitation:
${inviteLink}

(Note: This single-use invitation link is valid for 7 days. Once you open the link, you can review the claims, state your version of events, and join the proceedings.)

Best regards,
${cleanClaimant}`;

  return { subject, body };
};

/**
 * Opens Gmail Web Composer directly in a new tab with pre-filled To, Subject, and Body.
 */
export const openGmailComposer = (params) => {
  const { subject, body } = generateInviteEmailContent(params);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    params.respondentEmail || ""
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(gmailUrl, "_blank", "noopener,noreferrer");
};

/**
 * Fallback to default system email client via mailto: URL.
 */
export const openMailtoComposer = (params) => {
  const { subject, body } = generateInviteEmailContent(params);
  const mailtoUrl = `mailto:${encodeURIComponent(params.respondentEmail || "")}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoUrl;
};

