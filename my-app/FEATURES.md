# Mahnungsmeister - Feature Übersicht

## ✅ Implementierte Features

### Dashboard
- [x] Übersicht mit Statistiken (offene Beträge, überfällige Beträge, Erfolgsrate, Kundenanzahl)
- [x] Top 5 überfällige Rechnungen
- [x] Mahnungen pro Monat (Chart)
- [x] Schnell-Actions (Neuer Kunde, Neue Rechnung, Mahnungen prüfen)

### Kundenverwaltung
- [x] Kundenliste mit Suche
- [x] Neuer Kunde anlegen
- [x] Kunde bearbeiten (Detailseite)
- [x] Kunde löschen
- [x] Kunden-Detailseite mit Tabs (Kundendaten, Rechnungs-History)
- [x] Statistiken pro Kunde (Gesamtrechnungen, offene Beträge, bezahlte Rechnungen)

### Rechnungsverwaltung
- [x] Rechnungsliste mit Filter (alle/überfällige)
- [x] Neue Rechnung anlegen
- [x] Rechnung bearbeiten (Detailseite)
- [x] Rechnung löschen
- [x] Als bezahlt markieren
- [x] Rechnungs-Detailseite mit Tabs (Details, Mahnungen, Zahlungen)
- [x] Status-Tracking (Offen, Überfällig, Bezahlt, Storniert, Inkasso)

### Mahnungs-Workflow
- [x] Automatische Mahnungserstellung (4 Stufen)
  - Stufe 0: Zahlungserinnerung
  - Stufe 1: 1. Mahnung (+7 Tage, +2.50€ Gebühr)
  - Stufe 2: 2. Mahnung (+14 Tage, +2.50€ Gebühr)
  - Stufe 3: Letzte Mahnung (+7 Tage, +5.00€ Gebühren)
- [x] Mahnungs-Check Seite mit Handlungsempfehlungen
- [x] Manuelle Mahnung senden (mit Template)
- [x] Mahnungs-History pro Rechnung
- [x] Automatische Status-Updates (OPEN → OVERDUE → IN_COLLECTION)
- [x] Mahngebühren-Berechnung

### API Endpunkte
- [x] `/api/dashboard` - Dashboard-Statistiken
- [x] `/api/customers` - CRUD für Kunden
- [x] `/api/invoices` - CRUD für Rechnungen
- [x] `/api/reminders` - Mahnungen erstellen/abrufen
- [x] `/api/mahnungen/workflow` - Automatischer Mahnungs-Workflow
- [x] `/api/auth/register` - Benutzerregistrierung
- [x] `/api/auth/[...nextauth]` - Authentifizierung

### UI Komponenten
- [x] Navigation mit Sidebar
- [x] Tabellen mit Sortierung/Filter
- [x] Formulare mit Validierung
- [x] Dialoge (Löschen bestätigen, Zahlung erfassen)
- [x] Badges für Status
- [x] Loading States
- [x] Empty States
- [x] Toast-Benachrichtigungen

## 🚧 Noch zu implementieren

### Authentifizierung
- [ ] Login-Seite
- [ ] Passwort zurücksetzen
- [ ] E-Mail-Verifizierung

### E-Mail-Versand
- [ ] SMTP-Integration
- [ ] E-Mail-Templates
- [ ] Versand-History

### PDF-Generierung
- [ ] Rechnungs-PDF hochladen
- [ ] Mahnungs-PDF generieren
- [ ] PDF-Vorschau

### Zahlungs-Tracking
- [ ] Zahlung erfassen (mit Referenz)
- [ ] Teilzahlungen
- [ ] Zahlungs-History

### Einstellungen
- [ ] Unternehmensdaten
- [ ] Mahnungs-Einstellungen (Fristen, Gebühren)
- [ ] E-Mail-Einstellungen
- [ ] Benachrichtigungen

### Export/Import
- [ ] CSV-Export
- [ ] CSV-Import (Kunden, Rechnungen)
- [ ] Backup/Restore

### Berichte
- [ ] Umsatzbericht
- [ ] Offene Posten Liste
- [ ] Mahnungs-Report

## 📝 Technische Details

### Stack
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- NextAuth.js
- Zod (Validierung)
- date-fns (Datum)

### Datenbank-Schema
- User (Benutzer)
- Customer (Kunden)
- Invoice (Rechnungen)
- Reminder (Mahnungen)
- Payment (Zahlungen)
- Account/Session (NextAuth)

### Enums
- InvoiceStatus: OPEN, OVERDUE, PAID, CANCELLED, IN_COLLECTION
- ReminderStatus: SENT, DELIVERED, OPENED, PAID, FAILED
