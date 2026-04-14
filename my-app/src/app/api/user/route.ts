import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userUpdateSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").optional(),
  email: z.string().email("Ungültige E-Mail-Adresse").optional(),
  companyName: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
  newPassword: z.string().min(8, "Neues Passwort muss mindestens 8 Zeichen haben"),
});

// GET /api/user - Aktuellen Benutzer laden
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        street: true,
        city: true,
        zipCode: true,
        country: true,
        taxId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Fehler beim Laden des Benutzers:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// PATCH /api/user - Benutzer aktualisieren
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = userUpdateSchema.parse(body);

    // Prüfen ob E-Mail bereits vergeben ist (falls geändert)
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "E-Mail-Adresse wird bereits verwendet" },
          { status: 409 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        street: true,
        city: true,
        zipCode: true,
        country: true,
        taxId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Fehler beim Aktualisieren des Benutzers:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// POST /api/user/change-password - Passwort ändern
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = passwordUpdateSchema.parse(body);

    // Aktuellen Benutzer mit Passwort laden
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden oder OAuth-Benutzer" },
        { status: 400 }
      );
    }

    // Aktuelles Passwort prüfen
    const isValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.passwordHash
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Aktuelles Passwort ist falsch" },
        { status: 400 }
      );
    }

    // Neues Passwort hashen und speichern
    const newPasswordHash = await bcrypt.hash(validatedData.newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Fehler beim Ändern des Passworts:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
