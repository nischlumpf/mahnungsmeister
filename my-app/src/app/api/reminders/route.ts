import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ReminderStatus, InvoiceStatus } from "@prisma/client";

const reminderSchema = z.object({
  invoiceId: z.string().min(1, "Rechnung ist erforderlich"),
  level: z.number().int().min(0).max(3, "Level muss zwischen 0 und 3 sein"),
  subject: z.string().min(1, "Betreff ist erforderlich"),
  body: z.string().min(1, "Inhalt ist erforderlich"),
  fee: z.number().optional(),
});

// GET /api/reminders - Alle Mahnungen des eingeloggten Users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ReminderStatus | null;
    const invoiceId = searchParams.get("invoiceId");

    const where: {
      userId: string;
      status?: ReminderStatus;
      invoiceId?: string;
    } = { userId: session.user.id };

    if (status) where.status = status;
    if (invoiceId) where.invoiceId = invoiceId;

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Fehler beim Laden der Mahnungen:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// POST /api/reminders - Neue Mahnung erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reminderSchema.parse(body);

    // Prüfen ob die Rechnung dem User gehört
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: validatedData.invoiceId,
        userId: session.user.id,
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Rechnung nicht gefunden" },
        { status: 404 }
      );
    }

    // Prüfen ob Rechnung bereits bezahlt ist
    if (invoice.status === InvoiceStatus.PAID) {
      return NextResponse.json(
        { error: "Rechnung ist bereits bezahlt" },
        { status: 400 }
      );
    }

    // Höchste bisherige Mahnstufe ermitteln
    const highestReminder = await prisma.reminder.findFirst({
      where: { invoiceId: validatedData.invoiceId },
      orderBy: { level: "desc" },
    });

    const nextLevel = highestReminder ? highestReminder.level + 1 : 0;

    // Prüfen ob die gewählte Stufe passt
    if (validatedData.level < nextLevel) {
      return NextResponse.json(
        {
          error: `Nächste Mahnstufe muss mindestens ${nextLevel} sein`,
        },
        { status: 400 }
      );
    }

    // Mahngebühren automatisch berechnen (ab Stufe 2)
    let fee = validatedData.fee;
    if (validatedData.level >= 2 && fee === undefined) {
      fee = 2.5; // 2.50€ Mahngebühr
    }

    // Fälligkeitsdatum für nächste Zahlung
    const dueDays = validatedData.level === 0 ? 7 : validatedData.level === 1 ? 14 : validatedData.level === 2 ? 7 : 3;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const reminder = await prisma.reminder.create({
      data: {
        invoiceId: validatedData.invoiceId,
        userId: session.user.id,
        level: validatedData.level,
        dueDate,
        subject: validatedData.subject,
        body: validatedData.body,
        fee: fee || null,
        status: ReminderStatus.SENT,
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

    // Rechnungsstatus aktualisieren wenn nötig
    if (validatedData.level >= 1 && invoice.status === InvoiceStatus.OPEN) {
      await prisma.invoice.update({
        where: { id: validatedData.invoiceId },
        data: { status: InvoiceStatus.OVERDUE },
      });
    }

    if (validatedData.level === 3) {
      await prisma.invoice.update({
        where: { id: validatedData.invoiceId },
        data: { status: InvoiceStatus.IN_COLLECTION },
      });
    }

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Fehler beim Erstellen der Mahnung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
