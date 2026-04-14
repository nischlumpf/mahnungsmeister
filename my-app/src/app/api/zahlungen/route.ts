import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Rechnung ist erforderlich"),
  amount: z.number().positive("Betrag muss positiv sein"),
  reference: z.string().optional(),
});

// GET /api/zahlungen - Alle Zahlungen des eingeloggten Users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          userId: session.user.id,
          ...(invoiceId ? { id: invoiceId } : {}),
        },
      },
      orderBy: { paidAt: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Fehler beim Laden der Zahlungen:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// POST /api/zahlungen - Neue Zahlung erfassen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Prüfen ob die Rechnung dem User gehört
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: validatedData.invoiceId,
        userId: session.user.id,
      },
      include: {
        payments: true,
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Rechnung nicht gefunden" },
        { status: 404 }
      );
    }

    // Bereits gezahlten Betrag ermitteln
    const alreadyPaid = invoice.payments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0
    );

    // Prüfen ob Zahlung den offenen Betrag übersteigt
    const openAmount = invoice.amount.toNumber() - alreadyPaid;
    if (validatedData.amount > openAmount) {
      return NextResponse.json(
        {
          error: "Zahlungsbetrag übersteigt den offenen Betrag",
          openAmount,
        },
        { status: 400 }
      );
    }

    // Zahlung erstellen
    const payment = await prisma.payment.create({
      data: {
        invoiceId: validatedData.invoiceId,
        amount: validatedData.amount,
        reference: validatedData.reference,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Prüfen ob Rechnung nun vollständig bezahlt ist
    const newTotalPaid = alreadyPaid + validatedData.amount;
    if (newTotalPaid >= invoice.amount.toNumber()) {
      await prisma.invoice.update({
        where: { id: validatedData.invoiceId },
        data: { status: "PAID" },
      });

      // Alle offenen Mahnungen als bezahlt markieren
      await prisma.reminder.updateMany({
        where: {
          invoiceId: validatedData.invoiceId,
          status: { in: ["SENT", "DELIVERED", "OPENED"] },
        },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Fehler beim Erfassen der Zahlung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
