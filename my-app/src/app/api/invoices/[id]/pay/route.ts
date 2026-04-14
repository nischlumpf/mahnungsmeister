import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().positive("Betrag muss positiv sein"),
  reference: z.string().optional(),
});

// POST /api/invoices/[id]/pay - Rechnung als bezahlt markieren
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    // Prüfen ob Rechnung existiert und dem User gehört
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id },
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

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Rechnung ist bereits bezahlt" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Bereits gezahlten Betrag ermitteln
    const alreadyPaid = invoice.payments.reduce(
      (sum: number, p: { amount: { toNumber: () => number } }) => sum + p.amount.toNumber(),
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
        invoiceId: id,
        amount: validatedData.amount,
        reference: validatedData.reference,
      },
    });

    // Prüfen ob Rechnung nun vollständig bezahlt ist
    const newTotalPaid = alreadyPaid + validatedData.amount;
    if (newTotalPaid >= invoice.amount.toNumber()) {
      await prisma.invoice.update({
        where: { id },
        data: { status: "PAID" },
      });

      // Alle offenen Mahnungen als bezahlt markieren
      await prisma.reminder.updateMany({
        where: {
          invoiceId: id,
          status: { in: ["SENT", "DELIVERED", "OPENED"] },
        },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json({
      success: true,
      payment,
      fullyPaid: newTotalPaid >= invoice.amount.toNumber(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Fehler beim Bezahlen der Rechnung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
