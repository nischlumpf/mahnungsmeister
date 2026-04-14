import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/stats - Dashboard-Statistiken laden
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parallel alle Statistiken laden
    const [
      totalInvoices,
      openInvoices,
      overdueInvoices,
      paidInvoices,
      totalCustomers,
      totalReminders,
      pendingReminders,
    ] = await Promise.all([
      // Gesamtrechnungen
      prisma.invoice.count({
        where: { userId },
      }),
      // Offene Rechnungen
      prisma.invoice.count({
        where: { userId, status: "OPEN" },
      }),
      // Überfällige Rechnungen
      prisma.invoice.count({
        where: {
          userId,
          status: { in: ["OVERDUE", "IN_COLLECTION"] },
        },
      }),
      // Bezahlte Rechnungen
      prisma.invoice.count({
        where: { userId, status: "PAID" },
      }),
      // Gesamtkunden
      prisma.customer.count({
        where: { userId },
      }),
      // Gesamtmahnungen
      prisma.reminder.count({
        where: { userId },
      }),
      // Ausstehende Mahnungen
      prisma.reminder.count({
        where: {
          userId,
          status: { in: ["SENT", "DELIVERED", "OPENED"] },
        },
      }),
    ]);

    // Offene Beträge berechnen
    const openAmounts = await prisma.invoice.aggregate({
      where: {
        userId,
        status: { in: ["OPEN", "OVERDUE", "IN_COLLECTION"] },
      },
      _sum: {
        amount: true,
      },
    });

    // Überfällige Rechnungen mit Details laden
    const recentOverdue = await prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ["OVERDUE", "IN_COLLECTION"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reminders: {
          orderBy: { level: "desc" },
          take: 1,
        },
      },
    });

    // Letzte Mahnungen
    const recentReminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      counts: {
        totalInvoices,
        openInvoices,
        overdueInvoices,
        paidInvoices,
        totalCustomers,
        totalReminders,
        pendingReminders,
      },
      openAmount: openAmounts._sum.amount?.toNumber() || 0,
      recentOverdue,
      recentReminders,
    });
  } catch (error) {
    console.error("Fehler beim Laden der Dashboard-Statistiken:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
