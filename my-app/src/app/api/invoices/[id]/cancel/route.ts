import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";

// POST /api/invoices/[id]/cancel - Rechnung stornieren
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
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Rechnung nicht gefunden" },
        { status: 404 }
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return NextResponse.json(
        { error: "Bezahlte Rechnungen können nicht storniert werden" },
        { status: 400 }
      );
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Rechnung ist bereits storniert" },
        { status: 400 }
      );
    }

    // Rechnung stornieren
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
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

    // Offene Mahnungen als fehlgeschlagen markieren
    await prisma.reminder.updateMany({
      where: {
        invoiceId: id,
        status: { in: ["SENT", "DELIVERED", "OPENED"] },
      },
      data: { status: "FAILED" },
    });

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Fehler beim Stornieren der Rechnung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
