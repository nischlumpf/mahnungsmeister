import { PrismaClient, InvoiceStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starte Seeding...");

  // Test-User erstellen
  const passwordHash = await hash("test123", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@mahnungsmeister.de" },
    update: {},
    create: {
      email: "test@mahnungsmeister.de",
      name: "Max Mustermann",
      passwordHash,
      companyName: "Musterfirma GmbH",
      street: "Musterstraße 123",
      city: "Musterstadt",
      zipCode: "12345",
      country: "DE",
      taxId: "DE123456789",
    },
  });

  console.log(`✅ User erstellt: ${user.email}`);

  // Test-Kunden erstellen
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: "customer-1" },
      update: {},
      create: {
        id: "customer-1",
        userId: user.id,
        name: "Schmidt & Co KG",
        email: "rechnung@schmidt-co.de",
        phone: "+49 30 12345678",
        street: "Hauptstraße 45",
        city: "Berlin",
        zipCode: "10115",
        country: "DE",
      },
    }),
    prisma.customer.upsert({
      where: { id: "customer-2" },
      update: {},
      create: {
        id: "customer-2",
        userId: user.id,
        name: "Müller IT Solutions",
        email: "buchhaltung@mueller-it.de",
        phone: "+49 89 98765432",
        street: "Technologiepark 12",
        city: "München",
        zipCode: "80331",
        country: "DE",
      },
    }),
    prisma.customer.upsert({
      where: { id: "customer-3" },
      update: {},
      create: {
        id: "customer-3",
        userId: user.id,
        name: "Bauunternehmen Weber",
        email: "weber@bau-weber.de",
        phone: "+49 40 55555555",
        street: "Baustraße 8",
        city: "Hamburg",
        zipCode: "20095",
        country: "DE",
      },
    }),
  ]);

  console.log(`✅ ${customers.length} Kunden erstellt`);

  // Test-Rechnungen erstellen
  const invoices = await Promise.all([
    // Bezahlte Rechnung
    prisma.invoice.upsert({
      where: { id: "invoice-1" },
      update: {},
      create: {
        id: "invoice-1",
        userId: user.id,
        customerId: customers[0].id,
        invoiceNumber: "RE-2024-001",
        amount: 1500.0,
        currency: "EUR",
        dueDate: subDays(new Date(), 30),
        issueDate: subDays(new Date(), 45),
        description: "Beratungsleistungen Januar 2024",
        status: InvoiceStatus.PAID,
      },
    }),
    // Offene Rechnung (fällig in 7 Tagen)
    prisma.invoice.upsert({
      where: { id: "invoice-2" },
      update: {},
      create: {
        id: "invoice-2",
        userId: user.id,
        customerId: customers[1].id,
        invoiceNumber: "RE-2024-002",
        amount: 2800.5,
        currency: "EUR",
        dueDate: addDays(new Date(), 7),
        issueDate: subDays(new Date(), 14),
        description: "Software-Entwicklung Projekt Alpha",
        status: InvoiceStatus.OPEN,
      },
    }),
    // Überfällige Rechnung (für Mahnung)
    prisma.invoice.upsert({
      where: { id: "invoice-3" },
      update: {},
      create: {
        id: "invoice-3",
        userId: user.id,
        customerId: customers[2].id,
        invoiceNumber: "RE-2024-003",
        amount: 950.0,
        currency: "EUR",
        dueDate: subDays(new Date(), 15),
        issueDate: subDays(new Date(), 30),
        description: "Wartungsarbeiten Februar 2024",
        status: InvoiceStatus.OVERDUE,
      },
    }),
    // Stark überfällige Rechnung (für 2. Mahnung)
    prisma.invoice.upsert({
      where: { id: "invoice-4" },
      update: {},
      create: {
        id: "invoice-4",
        userId: user.id,
        customerId: customers[0].id,
        invoiceNumber: "RE-2024-004",
        amount: 3200.0,
        currency: "EUR",
        dueDate: subDays(new Date(), 45),
        issueDate: subDays(new Date(), 60),
        description: "Projektmanagement Q1 2024",
        status: InvoiceStatus.OVERDUE,
      },
    }),
  ]);

  console.log(`✅ ${invoices.length} Rechnungen erstellt`);

  // Test-Mahnungen erstellen
  const reminders = await Promise.all([
    // 1. Mahnung für Rechnung 3
    prisma.reminder.upsert({
      where: { id: "reminder-1" },
      update: {},
      create: {
        id: "reminder-1",
        invoiceId: invoices[2].id,
        userId: user.id,
        level: 1,
        sentAt: subDays(new Date(), 5),
        dueDate: addDays(new Date(), 7),
        subject: `1. Mahnung: Rechnung ${invoices[2].invoiceNumber}`,
        body: `Sehr geehrte Damen und Herren,\n\ntrotz unserer Zahlungserinnerung haben wir bislang keinen Zahlungseingang verbuchen können.\n\nRechnungsnummer: ${invoices[2].invoiceNumber}\nRechnungsbetrag: 950,00 €\nOffener Gesamtbetrag: 950,00 €\nZahlbar bis: ${addDays(new Date(), 7).toLocaleDateString("de-DE")}\n\nWir bitten Sie, den offenen Betrag zu begleichen.\n\nMit freundlichen Grüßen`,
        status: "SENT",
      },
    }),
    // Zahlungserinnerung für Rechnung 4
    prisma.reminder.upsert({
      where: { id: "reminder-2" },
      update: {},
      create: {
        id: "reminder-2",
        invoiceId: invoices[3].id,
        userId: user.id,
        level: 0,
        sentAt: subDays(new Date(), 30),
        dueDate: subDays(new Date(), 23),
        subject: `Erinnerung: Rechnung ${invoices[3].invoiceNumber}`,
        body: `Sehr geehrte Damen und Herren,\n\nwir erlauben uns, Sie freundlich an die Zahlung der folgenden Rechnung zu erinnern:\n\nRechnungsnummer: ${invoices[3].invoiceNumber}\nRechnungsbetrag: 3.200,00 €\nOffener Gesamtbetrag: 3.200,00 €\nZahlbar bis: ${subDays(new Date(), 23).toLocaleDateString("de-DE")}\n\nMit freundlichen Grüßen`,
        status: "SENT",
      },
    }),
    // 1. Mahnung für Rechnung 4
    prisma.reminder.upsert({
      where: { id: "reminder-3" },
      update: {},
      create: {
        id: "reminder-3",
        invoiceId: invoices[3].id,
        userId: user.id,
        level: 1,
        sentAt: subDays(new Date(), 15),
        dueDate: subDays(new Date(), 8),
        subject: `1. Mahnung: Rechnung ${invoices[3].invoiceNumber}`,
        body: `Sehr geehrte Damen und Herren,\n\ntrotz unserer Zahlungserinnerung haben wir bislang keinen Zahlungseingang verbuchen können.\n\nRechnungsnummer: ${invoices[3].invoiceNumber}\nRechnungsbetrag: 3.200,00 €\nOffener Gesamtbetrag: 3.200,00 €\nZahlbar bis: ${subDays(new Date(), 8).toLocaleDateString("de-DE")}\n\nWir bitten Sie, den offenen Betrag zu begleichen.\n\nMit freundlichen Grüßen`,
        status: "SENT",
      },
    }),
  ]);

  console.log(`✅ ${reminders.length} Mahnungen erstellt`);

  // Test-Zahlung erstellen
  const payment = await prisma.payment.upsert({
    where: { id: "payment-1" },
    update: {},
    create: {
      id: "payment-1",
      invoiceId: invoices[0].id,
      amount: 1500.0,
      paidAt: subDays(new Date(), 25),
      reference: "Überweisung - RE-2024-001",
    },
  });

  console.log(`✅ Zahlung erstellt`);

  console.log("\n🎉 Seeding abgeschlossen!");
  console.log("\nTest-Login:");
  console.log("  Email: test@mahnungsmeister.de");
  console.log("  Passwort: test123");
}

main()
  .catch((e) => {
    console.error("❌ Fehler beim Seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
