# MahnungsMeister UI Components

Dieses Verzeichnis enthält alle UI-Komponenten für die MahnungsMeister-Anwendung.

## Verfügbare Komponenten

### Core Components
- `button.tsx` - Button-Komponente mit verschiedenen Varianten
- `input.tsx` - Text-Input Komponente
- `label.tsx` - Label-Komponente für Formulare
- `textarea.tsx` - Mehrzeilige Text-Input Komponente

### Layout Components
- `card.tsx` - Card-Komponente für Inhaltsblöcke
- `separator.tsx` - Trennlinien
- `sheet.tsx` - Slide-out Panel
- `sidebar.tsx` - Seitennavigation
- `page-header.tsx` - Seiten-Header mit Titel und Aktionen

### Display Components
- `badge.tsx` - Badge/Label Komponente
- `alert.tsx` - Alert/Warning Komponente
- `table.tsx` - Tabellen-Komponente
- `avatar.tsx` - Avatar/Benutzerbild
- `skeleton.tsx` - Lade-Skeleton

### Form Components
- `select.tsx` - Dropdown Select
- `switch.tsx` - Toggle Switch
- `form.tsx` - React Hook Form Integration
- `calendar.tsx` - Datums-Auswahl Kalender
- `date-picker.tsx` - Datums-Picker Komponente
- `popover.tsx` - Popover/Overlay

### Overlay Components
- `dialog.tsx` - Modal Dialog
- `tooltip.tsx` - Tooltip
- `dropdown-menu.tsx` - Dropdown Menü

### Navigation Components
- `tabs.tsx` - Tab-Navigation

### Feedback Components
- `toast.tsx` - Toast Benachrichtigungen
- `toaster.tsx` - Toast Container

### MahnungsMeister Spezifisch
- `reminder-badge.tsx` - Mahnungs-Level Badges
- `status-icon.tsx` - Status Icons (bezahlt, überfällig, etc.)
- `currency-display.tsx` - Währungsanzeige
- `empty-state.tsx` - Leer-Zustand Anzeige
- `loading-spinner.tsx` - Lade-Animationen

## Verwendung

Alle Komponenten können über den Index exportiert werden:

```typescript
import { Button, Card, Badge } from "@/components/ui"
```

Oder einzeln importiert:

```typescript
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
```

## Design-System

Die Komponenten verwenden das MahnungsMeister Design-System mit:
- Primärfarbe: Blau (#2563eb)
- Status-Farben: Success (Grün), Warning (Orange), Destructive (Rot)
- Schriftart: Inter
- Border Radius: 0.5rem (8px)
- Schatten: card, card-hover
