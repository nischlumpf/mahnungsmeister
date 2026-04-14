import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addDays, format } from "date-fns";
import { de } from "date-fns/locale";

// Mahnungs-Templates für verschiedene Stufen
export const reminderTemplates = {
  0: {
    name: "Zahlungserinnerung",
    subject: "Erinnerung: Rechnung {invoiceNumber}",
    getBody: (data: TemplateData) => `Sehr geehrte Damen und Herren,

wir erlauben uns, Sie freundlich an die Zahlung der folgenden Rechnung zu erinnern:

Rechnungsnummer: ${data.invoiceNumber}
Rechnungsbetrag: ${data.amount} €
Fälligkeitsdatum: ${data.dueDate}

Sollten Sie die Zahlung bereits veranlasst haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.

Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
${data.companyName || ""}`,
  },
  1: {
    name: "1. Mahnung",
    subject: "1. Mahnung: Rechnung {invoiceNumber}",
    getBody: (data: TemplateData) => `Sehr geehrte Damen und Herren,

trotz unserer Zahlungserinnerung haben wir bislang keinen Zahlungseingang verbuchen können.

Rechnungsnummer: ${data.invoiceNumber}
Rechnungsbetrag: ${data.amount} €
Fälligkeitsdatum: ${data.originalDueDate}

Wir bitten Sie, den offenen Betrag bis zum ${data.newDueDate} zu begleichen.

Mit freundlichen Grüßen
${data.companyName || ""}`,
  },
  2: {
    name: "2. Mahnung",
    subject: "2. Mahnung: Rechnung {invoiceNumber}",
    getBody: (data: TemplateData) => `Sehr geehrte Damen und Herren,

auch nach unserer ersten Mahnung haben wir leider noch keine Zahlung erhalten.

Rechnungsnummer: ${data.invoiceNumber}
Rechnungsbetrag: ${data.amount} €
Mahngebühr: 2,50 €
Gesamtbetrag: ${(parseFloat(data.amount.replace(",", ".")) + 2.5).toFixed(2).replace(".", ",")} €

Da die Zahlungsfrist nun erheblich überschritten ist, erheben wir eine Mahngebühr von 2,50 €.

Wir bitten Sie, den Gesamtbetrag bis zum ${data.newDueDate} zu überweisen.

Mit freundlichen Grüßen
${data.companyName || ""}`,
  },
  3: {
    name: "Letzte Mahnung",
    subject: "Letzte Mahnung vor Inkasso: Rechnung {invoiceNumber}",
    getBody: (data: TemplateData) => `Sehr geehrte Damen und Herren,

auch nach wiederholter Mahnung haben wir von Ihnen keine Zahlung erhalten.

Rechnungsnummer: ${data.invoiceNumber}
Rechnungsbetrag: ${data.amount} €
Mahngebühren: 5,00 €
Gesamtbetrag: ${(parseFloat(data.amount.replace(",", ".")) + 5.0).toFixed(2).replace(".", ",")} €

Dies ist unsere letzte Mahnung vor der Weitergabe an ein Inkassobüro.

Sollten wir bis zum ${data.newDueDate} keinen Zahlungseingang verzeichnen, werden wir das Inkassoverfahren einleiten. Zusätzliche Kosten werden Ihnen entstehen.

Mit freundlichen Grüßen
${data.companyName || ""}`,
  },
};

interface TemplateData {
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  originalDueDate: string;
  newDueDate: string;
  companyName?: string;
  customerName: string;
}

// GET /api/mahnungen/templates - Alle Templates auflisten
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const templates = Object.entries(reminderTemplates).map(([level, template]) => ({
      level: parseInt(level),
      name: template.name,
      subject: template.subject,
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Fehler beim Laden der Templates:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// POST /api/mahnungen/templates/preview - Template-Vorschau generieren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const { level, invoiceNumber, amount, dueDate, companyName, customerName } = body;

    if (level === undefined || level < 0 || level > 3) {
      return NextResponse.json(
        { error: "Ungültige Mahnstufe" },
        { status: 400 }
      );
    }

    const template = reminderTemplates[level as keyof typeof reminderTemplates];
    
    const dueDays = level === 0 ? 7 : level === 1 ? 14 : level === 2 ? 7 : 3;
    const newDueDate = format(addDays(new Date(), dueDays), "dd.MM.yyyy", { locale: de });

    const data: TemplateData = {
      invoiceNumber: invoiceNumber || "RE-2024-001",
      amount: amount || "100,00",
      dueDate: dueDate || format(new Date(), "dd.MM.yyyy", { locale: de }),
      originalDueDate: dueDate || format(new Date(), "dd.MM.yyyy", { locale: de }),
      newDueDate,
      companyName: companyName || "Ihr Unternehmen",
      customerName: customerName || "Kunde",
    };

    const preview = {
      level,
      name: template.name,
      subject: template.subject.replace("{invoiceNumber}", data.invoiceNumber),
      body: template.getBody(data),
    };

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Fehler bei der Template-Vorschau:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
