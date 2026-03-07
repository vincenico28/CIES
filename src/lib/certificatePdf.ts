import { jsPDF } from "jspdf";

const LOGO_URL = "/favicon.png";

/** Load image from public URL as base64 data URL for jsPDF */
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Organization details for certificate header (configurable for government/academic/org use) */
export const CERTIFICATE_ORG = {
  name: "Barangay Portal",
  address: "Barangay Hall, Main Street, Municipality, Province",
  contact: "barangay@email.gov.ph | (02) 1234-5678",
};

export interface CertificatePdfParams {
  certificateType: string;
  requestorName: string;
  requestorAddress: string;
  purpose: string;
  certificateNumber: string | null;
  issuedDate: string;
}

const MARGIN = 20;
const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;
const BORDER_MARGIN = 10;
/** Y position where the bottom block (Date Issued + Authorized Signature) starts — fixed at bottom */
const BOTTOM_BLOCK_TOP = A4_HEIGHT - 35;

function drawCertificateBorder(doc: jsPDF) {
  // Subtle official border (print-friendly)
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.rect(BORDER_MARGIN, BORDER_MARGIN, A4_WIDTH - BORDER_MARGIN * 2, A4_HEIGHT - BORDER_MARGIN * 2, "S");

  // Inner hairline for depth (very light)
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.2);
  const inset = BORDER_MARGIN + 2.5;
  doc.rect(inset, inset, A4_WIDTH - inset * 2, A4_HEIGHT - inset * 2, "S");
  doc.setDrawColor(0, 0, 0);
 }

function getCertificateTitle(certificateType: string): string {
  const titles: Record<string, string> = {
    clearance: "BARANGAY CLEARANCE",
    residency: "CERTIFICATE OF RESIDENCY",
    indigency: "CERTIFICATE OF INDIGENCY",
    birth: "CERTIFICATE OF LIVE BIRTH",
    marriage: "CERTIFICATE OF MARRIAGE",
    death: "CERTIFICATE OF DEATH",
  };
  const key = certificateType.toLowerCase().replace(/\s+/g, "_");
  return titles[key] || certificateType.toUpperCase();
}

/**
 * Generates a print-ready professional certificate PDF (A4 portrait).
 * Layout: header (logo area, org name, address, contact, divider), large centered title, body, certificate number/date, signature area.
 */
export async function generateCertificatePdf(params: CertificatePdfParams): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    hotfixes: ["pxScale"],
  });

  drawCertificateBorder(doc);

  let y = MARGIN;

  // —— Header: Logo (top center), from /public/favicon.png ——
  const logoSize = 18;
  const logoX = (A4_WIDTH - logoSize) / 2;
  const logoDataUrl = await loadImageAsDataUrl(LOGO_URL);
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", logoX, y, logoSize, logoSize);
  } else {
    doc.setFillColor(240, 240, 240);
    doc.rect(logoX, y, logoSize, logoSize, "F");
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(logoX, y, logoSize, logoSize, "S");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("LOGO", A4_WIDTH / 2, y + logoSize / 2 + 1.5, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  y += logoSize + 6;

  // —— Organization Name (Bold, Large) ——
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(CERTIFICATE_ORG.name, A4_WIDTH / 2, y, { align: "center" });
  y += 7;

  // —— Address ——
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(CERTIFICATE_ORG.address, A4_WIDTH / 2, y, { align: "center" });
  y += 5;

  // —— Contact ——
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(CERTIFICATE_ORG.contact, A4_WIDTH / 2, y, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 8;

  // —— Horizontal divider ——
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, A4_WIDTH - MARGIN, y);
  y += 12;

  // —— Title: Large centered ——
  const title = getCertificateTitle(params.certificateType);
  // Serif title for official feel
  doc.setFont("times", "bold");
  doc.setFontSize(19);
  doc.text(title, A4_WIDTH / 2, y, { align: "center" });
  y += 8;

  // Subtle title rule
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(A4_WIDTH / 2 - 45, y, A4_WIDTH / 2 + 45, y);
  y += 10;

  // —— Body: Certification text (middle area; bottom block is reserved below) ——
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const intro = "TO WHOM IT MAY CONCERN:";
  doc.setFont("helvetica", "bold");
  doc.text(intro, A4_WIDTH / 2, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  y += 8;

  const bodyLines = doc.splitTextToSize(
    `This is to certify that ${params.requestorName}${params.requestorAddress ? `, of ${params.requestorAddress}` : ""}, has requested this ${params.certificateType.toLowerCase().replace(/_/g, " ")} from this office.`,
    CONTENT_WIDTH
  );
  doc.text(bodyLines, MARGIN, y);
  y += bodyLines.length * 6 + 4;

  const purposeLines = doc.splitTextToSize(
    `Purpose: ${params.purpose}`,
    CONTENT_WIDTH
  );
  doc.text(purposeLines, MARGIN, y);
  y += purposeLines.length * 6 + 6;

  // —— Bottom block: always below body — Certificate number, Date Issued, Authorized Signature ——
  let bottomY = BOTTOM_BLOCK_TOP;
  doc.setFontSize(10);
  if (params.certificateNumber) {
    doc.text(`Certificate No.: ${params.certificateNumber}`, MARGIN, bottomY);
    bottomY += 6;
  }
  doc.text(`Date Issued: ${params.issuedDate}`, MARGIN, bottomY);
  bottomY += 10;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  const sigLineWidth = 45;
  const sigLineX = A4_WIDTH - MARGIN - sigLineWidth;
  doc.line(sigLineX, bottomY, sigLineX + sigLineWidth, bottomY);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Authorized Signature", sigLineX + sigLineWidth / 2, bottomY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");

  // Save with a safe filename
  const safeTitle = params.certificateType.replace(/\s+/g, "_").toLowerCase();
  const filename = `Certificate_${safeTitle}_${params.requestorName.replace(/\s+/g, "_").slice(0, 20)}.pdf`;
  doc.save(filename);
}
