import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";
import { startOfYear, endOfYear, format } from "date-fns";
import { de } from "date-fns/locale";

// GET /api/dashboard - Dashboard-Statistiken laden
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const userId = session.user.id;

    // Statistiken berechnen
    const [
      totalInvoices,
      openInvoices,
      overdueInvoices,
      paidInvoices,
      customerCount,
      totalOpenAmount,
      totalOverdueAmount,
      totalPaidAmount,
    ] = await Promise.all([
      // Gesamtzahl Rechnungen
      prisma.invoice.count({ where: { userId } }),

      // Offene Rechnungen
      prisma.invoice.count({
        where: { userId, status: InvoiceStatus.OPEN },
      }),

      // Überfällige Rechnungen
      prisma.invoice.count({
        where: { userId, status: InvoiceStatus.OVERDUE },
      }),

      // Bezahlte Rechnungen
      prisma.invoice.count({
        where: { userId, status: InvoiceStatus.PAID },
      }),

      // Anzahl Kunden
      prisma.customer.count({ where: { userId } }),

      // Offener Betrag
      prisma.invoice.aggregate({
        where: { userId, status: InvoiceStatus.OPEN },
        _sum: { amount: true },
      }),

      // Überfälliger Betrag
      prisma.invoice.aggregate({
        where: { userId, status: InvoiceStatus.OVERDUE },
        _sum: { amount: true },
      }),

      // Bezahlter Betrag
      prisma.invoice.aggregate({
        where: { userId, status: InvoiceStatus.PAID },
        _sum: { amount: true },
      }),
    ]);

    // Top 5 überfällige Rechnungen
    const topOverdue = await prisma.invoice.findMany({
      where: {
        userId,
        status: InvoiceStatus.OVERDUE,
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        customer: {
          select: {
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

    // Mahnungen pro Monat (aktuelles Jahr)
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());

    const remindersByMonth = await prisma.reminder.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      _count: { id: true },
    });

    // Monatsdaten aggregieren
    const monthlyData: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    months.forEach((m) => (monthlyData[m] = 0));

    remindersByMonth.forEach((r: { createdAt: Date; _count: { id: number } }) => {
      const month = format(r.createdAt, "MMM", { locale: de });
      const shortMonth = months.find((m) => month.startsWith(m)) || month;
      if (monthlyData[shortMonth] !== undefined) {
        monthlyData[shortMonth] += r._count.id;
      }
    });

    const monthlyReminders = months.map((month) => ({
      month,
      count: monthlyData[month],
    }));

    // Erfolgsrate berechnen
    const totalCompleted = paidInvoices;
    const totalWithOutcome = paidInvoices + openInvoices + overdueInvoices;
    const successRate = totalWithOutcome > 0 ? Math.round((totalCompleted / totalWithOutcome) * 100) : 0;

    const stats = {
      totalInvoices,
      openInvoices,
      overdueInvoices,
      paidInvoices,
      customerCount,
      openAmount: totalOpenAmount._sum?.amount?.toNumber() || 0,
      overdueAmount: totalOverdueAmount._sum?.amount?.toNumber() || 0,
      paidAmount: totalPaidAmount._sum?.amount?.toNumber() || 0,
      successRate,
    };

    return NextResponse.json({
      stats,
      topOverdue,
      monthlyReminders,
    });
  } catch (error) {
    console.error("Fehler beim Laden des Dashboards:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
