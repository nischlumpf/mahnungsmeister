import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Rechnungsnummer ist erforderlich"),
  amount: z.number().positive("Betrag muss positiv sein"),
  currency: z.string().default("EUR"),
  dueDate: z.string().datetime("Gültiges Datum erforderlich"),
  description: z.string().optional(),
  customerId: z.string().min(1, "Kunde ist erforderlich"),
  pdfUrl: z.string().optional(),
});

// GET /api/invoices - Alle Rechnungen des eingeloggten Users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as InvoiceStatus | null;
    const customerId = searchParams.get("customerId");

    const where: {
      userId: string;
      status?: InvoiceStatus;
      customerId?: string;
    } = { userId: session.user.id };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reminders: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Fehler beim Laden der Rechnungen:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Neue Rechnung erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // Prüfen ob der Kunde dem User gehört
    const customer = await prisma.customer.findFirst({
      where: {
        id: validatedData.customerId,
        userId: session.user.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Kunde nicht gefunden" },
        { status: 404 }
      );
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: validatedData.invoiceNumber,
        amount: validatedData.amount,
        currency: validatedData.currency,
        dueDate: new Date(validatedData.dueDate),
        description: validatedData.description,
        customerId: validatedData.customerId,
        userId: session.user.id,
        pdfUrl: validatedData.pdfUrl,
        status: InvoiceStatus.OPEN,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Fehler beim Erstellen der Rechnung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
