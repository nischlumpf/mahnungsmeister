# MahnungsMeister API Dokumentation

## Übersicht

Alle API-Endpunkte sind unter `/api/*` erreichbar und erfordern Authentifizierung (außer `/api/auth/*`).

## Authentifizierung

### POST /api/auth/register
Neuen Benutzer registrieren.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Max Mustermann",
  "companyName": "Musterfirma GmbH"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "Max Mustermann",
    "companyName": "Musterfirma GmbH",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/auth/[...nextauth]
NextAuth.js Endpunkte für Login/Logout.

## Dashboard

### GET /api/dashboard
Dashboard-Statistiken laden.

**Response:**
```json
{
  "stats": {
    "totalInvoices": 100,
    "openInvoices": 20,
    "overdueInvoices": 5,
    "paidInvoices": 75,
    "customerCount": 30,
    "openAmount": 5000.00,
    "overdueAmount": 1250.00,
    "paidAmount": 25000.00,
    "successRate": 75
  },
  "topOverdue": [...],
  "monthlyReminders": [...]
}
```

## Kunden

### GET /api/customers
Alle Kunden des eingeloggten Users laden.

**Query Parameters:**
- `search` - Optional: Suche nach Name oder E-Mail

### POST /api/customers
Neuen Kunden erstellen.

**Request:**
```json
{
  "name": "Kunde GmbH",
  "email": "kunde@example.com",
  "phone": "+49 123 456789",
  "street": "Musterstraße 1",
  "city": "Berlin",
  "zipCode": "10115",
  "country": "DE"
}
```

### GET /api/customers/[id]
Einzelnen Kunden mit Rechnungen laden.

### PATCH /api/customers/[id]
Kunden aktualisieren.

### DELETE /api/customers/[id]
Kunden löschen.

## Rechnungen

### GET /api/invoices
Alle Rechnungen laden.

**Query Parameters:**
- `status` - Filter nach Status (OPEN, OVERDUE, PAID, CANCELLED, IN_COLLECTION)
- `customerId` - Filter nach Kunde

### POST /api/invoices
Neue Rechnung erstellen.

**Request:**
```json
{
  "invoiceNumber": "RE-2024-001",
  "amount": 1000.00,
  "currency": "EUR",
  "dueDate": "2024-02-01T00:00:00Z",
  "description": "Projekt X",
  "customerId": "...",
  "pdfUrl": "https://..."
}
```

### GET /api/invoices/[id]
Einzelne Rechnung mit Mahnungen und Zahlungen laden.

### PATCH /api/invoices/[id]
Rechnung aktualisieren.

### DELETE /api/invoices/[id]
Rechnung löschen.

### POST /api/invoices/[id]/pay
Rechnung als bezahlt markieren.

**Request:**
```json
{
  "amount": 1000.00,
  "reference": "Überweisung vom 01.02.2024"
}
```

### POST /api/invoices/[id]/cancel
Rechnung stornieren.

### GET /api/invoices/check-overdue
Überfällige Rechnungen anzeigen (ohne Update).

### POST /api/invoices/check-overdue
Überfällige Rechnungen prüfen und Status aktualisieren.

**Response:**
```json
{
  "success": true,
  "checked": 10,
  "updated": 3,
  "invoiceIds": ["...", "...", "..."]
}
```

## Mahnungen

### GET /api/reminders
Alle Mahnungen laden.

**Query Parameters:**
- `status` - Filter nach Status
- `invoiceId` - Filter nach Rechnung

### POST /api/reminders
Neue Mahnung erstellen.

**Request:**
```json
{
  "invoiceId": "...",
  "level": 1,
  "subject": "1. Mahnung: Rechnung RE-2024-001",
  "body": "...",
  "fee": 2.50
}
```

### POST /api/mahnungen/workflow
Automatisch nächste Mahnung basierend auf Template erstellen.

**Request:**
```json
{
  "invoiceId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "reminder": {...},
  "message": "1. Mahnung erfolgreich erstellt"
}
```

### GET /api/mahnungen/templates
Alle Mahnungs-Templates auflisten.

### POST /api/mahnungen/templates/preview
Template-Vorschau generieren.

**Request:**
```json
{
  "level": 1,
  "invoiceNumber": "RE-2024-001",
  "amount": "1000,00",
  "dueDate": "01.02.2024",
  "companyName": "Musterfirma GmbH",
  "customerName": "Kunde GmbH"
}
```

## Zahlungen

### GET /api/zahlungen
Alle Zahlungen laden.

**Query Parameters:**
- `invoiceId` - Filter nach Rechnung

### POST /api/zahlungen
Neue Zahlung erfassen.

**Request:**
```json
{
  "invoiceId": "...",
  "amount": 500.00,
  "reference": "Teilzahlung"
}
```

## Benutzer

### GET /api/user
Aktuellen Benutzer laden.

### PATCH /api/user
Benutzerprofil aktualisieren.

**Request:**
```json
{
  "name": "Max Mustermann",
  "email": "new@example.com",
  "companyName": "Neue Firma GmbH",
  "street": "Neue Straße 1",
  "city": "Hamburg",
  "zipCode": "20095",
  "country": "DE",
  "taxId": "DE123456789"
}
```

### POST /api/user/change-password
Passwort ändern.

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

## Fehlercodes

| Status | Bedeutung |
|--------|-----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (Validierungsfehler) |
| 401 | Unauthorized (nicht eingeloggt) |
| 404 | Not Found |
| 409 | Conflict (z.B. E-Mail bereits vergeben) |
| 500 | Internal Server Error |

## Enums

### InvoiceStatus
- `OPEN` - Offen
- `OVERDUE` - Überfällig
- `PAID` - Bezahlt
- `CANCELLED` - Storniert
- `IN_COLLECTION` - Inkasso

### ReminderStatus
- `SENT` - Gesendet
- `DELIVERED` - Zugestellt
- `OPENED` - Geöffnet
- `PAID` - Bezahlt
- `FAILED` - Fehlgeschlagen

### Mahnstufen
- `0` - Zahlungserinnerung
- `1` - 1. Mahnung
- `2` - 2. Mahnung (+ 2,50 € Gebühr)
- `3` - Letzte Mahnung (+ 5,00 € Gebühren)
