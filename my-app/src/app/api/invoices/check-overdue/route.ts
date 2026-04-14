import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";
import { isPast, startOfDay } from "date-fns";

// POST /api/invoices/check-overdue - Überfällige Rechnungen aktualisieren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = startOfDay(new Date());

    // Alle offenen Rechnungen mit überschrittenem Fälligkeitsdatum finden
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: InvoiceStatus.OPEN,
        dueDate: {
          lt: today,
        },
      },
    });

    // Status auf OVERDUE aktualisieren
    const updatedIds: string[] = [];
    for (const invoice of overdueInvoices) {
      if (isPast(startOfDay(invoice.dueDate))) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: InvoiceStatus.OVERDUE },
        });
        updatedIds.push(invoice.id);
      }
    }

    return NextResponse.json({
      success: true,
      checked: overdueInvoices.length,
      updated: updatedIds.length,
      invoiceIds: updatedIds,
    });
  } catch (error) {
    console.error("Fehler beim Prüfen überfälliger Rechnungen:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// GET /api/invoices/check-overdue - Überfällige Rechnungen anzeigen (ohne Update)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = startOfDay(new Date());

    // Alle offenen Rechnungen mit überschrittenem Fälligkeitsdatum finden
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: InvoiceStatus.OPEN,
        dueDate: {
          lt: today,
        },
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
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({
      count: overdueInvoices.length,
      invoices: overdueInvoices,
    });
  } catch (error) {
    console.error("Fehler beim Laden überfälliger Rechnungen:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
