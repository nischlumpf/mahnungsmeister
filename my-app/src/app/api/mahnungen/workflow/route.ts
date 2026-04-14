import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, format } from "date-fns";
import { de } from "date-fns/locale";

// POST /api/mahnungen/workflow - Automatisch nächste Mahnung erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Rechnungs-ID ist erforderlich" },
        { status: 400 }
      );
    }

    // Rechnung laden
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: session.user.id,
      },
      include: {
        customer: true,
        reminders: {
          orderBy: { level: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Rechnung nicht gefunden" },
        { status: 404 }
      );
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Rechnung ist bereits bezahlt" },
        { status: 400 }
      );
    }

    // Nächste Mahnstufe ermitteln
    const lastReminder = invoice.reminders[0];
    const nextLevel = lastReminder ? lastReminder.level + 1 : 0;

    if (nextLevel > 3) {
      return NextResponse.json(
        { error: "Maximale Mahnstufe (3) bereits erreicht" },
        { status: 400 }
      );
    }

    // Fälligkeitsdatum basierend auf Stufe
    const dueDays = nextLevel === 0 ? 7 : nextLevel === 1 ? 7 : nextLevel === 2 ? 5 : 3;
    const dueDate = addDays(new Date(), dueDays);

    // Mahngebühr ab Stufe 2
    const fee = nextLevel >= 2 ? 2.5 : null;

    // Betrag inkl. bisheriger Mahngebühren
    const totalFees = invoice.reminders.reduce(
      (sum, r) => sum + (r.fee?.toNumber() || 0),
      0
    );
    const totalAmount = invoice.amount.toNumber() + totalFees + (fee || 0);

    // Templates für verschiedene Stufen
    const templates = {
      0: {
        subject: `Erinnerung: Rechnung ${invoice.invoiceNumber}`,
        body: generateReminderEmail(invoice, 0, dueDate, totalAmount),
      },
      1: {
        subject: `1. Mahnung: Rechnung ${invoice.invoiceNumber}`,
        body: generateReminderEmail(invoice, 1, dueDate, totalAmount),
      },
      2: {
        subject: `2. Mahnung: Rechnung ${invoice.invoiceNumber}`,
        body: generateReminderEmail(invoice, 2, dueDate, totalAmount, fee),
      },
      3: {
        subject: `Letzte Mahnung: Rechnung ${invoice.invoiceNumber}`,
        body: generateReminderEmail(invoice, 3, dueDate, totalAmount, fee),
      },
    };

    const template = templates[nextLevel as keyof typeof templates];

    const reminder = await prisma.reminder.create({
      data: {
        invoiceId,
        userId: session.user.id,
        level: nextLevel,
        dueDate,
        subject: template.subject,
        body: template.body,
        fee,
        status: "SENT",
      },
      include: {
        invoice: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Rechnungsstatus aktualisieren
    if (nextLevel >= 1 && invoice.status === "OPEN") {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "OVERDUE" },
      });
    }

    if (nextLevel === 3) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "IN_COLLECTION" },
      });
    }

    return NextResponse.json({
      success: true,
      reminder,
      message: `${getLevelName(nextLevel)} erfolgreich erstellt`,
    });
  } catch (error) {
    console.error("Fehler im Mahnungs-Workflow:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

function getLevelName(level: number): string {
  const names = {
    0: "Zahlungserinnerung",
    1: "1. Mahnung",
    2: "2. Mahnung",
    3: "Letzte Mahnung",
  };
  return names[level as keyof typeof names];
}

function generateReminderEmail(
  invoice: {
    invoiceNumber: string;
    amount: { toNumber: () => number };
    customer: { name: string };
  },
  level: number,
  dueDate: Date,
  totalAmount: number,
  fee?: number | null
): string {
  const formattedDate = format(dueDate, "dd.MM.yyyy", { locale: de });
  const formattedAmount = totalAmount.toFixed(2).replace(".", ",");

  const greetings = {
    0: "Sehr geehrte Damen und Herren,",
    1: "Sehr geehrte Damen und Herren,",
    2: "Sehr geehrte Damen und Herren,",
    3: "Sehr geehrte Damen und Herren,",
  };

  const intros = {
    0: `wir erlauben uns, Sie freundlich an die Zahlung der folgenden Rechnung zu erinnern:`,
    1: `trotz unserer Zahlungserinnerung haben wir bislang keinen Zahlungseingang verbuchen können.`,
    2: `auch nach unserer ersten Mahnung haben wir leider noch keine Zahlung erhalten.`,
    3: `dies ist unsere letzte Mahnung vor der Weitergabe an ein Inkassobüro.`,
  };

  const urgencies = {
    0: "",
    1: "\n\nWir bitten Sie, den offenen Betrag bis zum {dueDate} zu begleichen.",
    2: "\n\nDa die Zahlungsfrist nun erheblich überschritten ist, erheben wir eine Mahngebühr von 2,50 €.",
    3: "\n\nSollten wir bis zum {dueDate} keinen Zahlungseingang verzeichnen, werden wir das Inkassoverfahren einleiten. Zusätzliche Kosten werden Ihnen entstehen.",
  };

  let body = `${greetings[level as keyof typeof greetings]}\n\n${intros[level as keyof typeof intros]}\n\n`;
  body += `Rechnungsnummer: ${invoice.invoiceNumber}\n`;
  body += `Rechnungsbetrag: ${invoice.amount.toNumber().toFixed(2).replace(".", ",")} €\n`;

  if (fee) {
    body += `Mahngebühr: ${fee.toFixed(2).replace(".", ",")} €\n`;
  }

  body += `Offener Gesamtbetrag: ${formattedAmount} €\n`;
  body += `Zahlbar bis: ${formattedDate}\n\n`;

  let urgency = urgencies[level as keyof typeof urgencies];
  if (urgency) {
    urgency = urgency.replace("{dueDate}", formattedDate);
    body += urgency + "\n\n";
  }

  body += "Mit freundlichen Grüßen";

  return body;
}
