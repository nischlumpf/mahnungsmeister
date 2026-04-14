import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ReminderStatus } from "@prisma/client";

const reminderUpdateSchema = z.object({
  status: z.nativeEnum(ReminderStatus).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  pdfUrl: z.string().optional(),
  fee: z.number().optional(),
});

// GET /api/mahnungen/[id] - Einzelne Mahnung laden
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: session.user.id },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Mahnung nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Fehler beim Laden der Mahnung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// PUT /api/mahnungen/[id] - Mahnung aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    // Prüfen ob Mahnung existiert und dem User gehört
    const existingReminder = await prisma.reminder.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingReminder) {
      return NextResponse.json(
        { error: "Mahnung nicht gefunden" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = reminderUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.fee !== undefined) {
      updateData.fee = validatedData.fee;
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(reminder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Fehler beim Aktualisieren der Mahnung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// DELETE /api/mahnungen/[id] - Mahnung löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    // Prüfen ob Mahnung existiert und dem User gehört
    const existingReminder = await prisma.reminder.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingReminder) {
      return NextResponse.json(
        { error: "Mahnung nicht gefunden" },
        { status: 404 }
      );
    }

    await prisma.reminder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Löschen der Mahnung:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
