# MahnungsMeister Design System

## Brand Identity

### Farbpalette

#### Primärfarben
- **Primary**: `#2563eb` (Blau) - Hauptaktionen, Links, Buttons
- **Primary Dark**: `#1d4ed8` - Hover-States
- **Primary Light**: `#3b82f6` - Akzente, Highlights

#### Status-Farben
- **Success**: `#22c55e` - Bezahlt, Erfolg
- **Warning**: `#f59e0b` - Erinnerung, Achtung
- **Destructive**: `#ef4444` - Überfällig, Mahnung, Fehler
- **Info**: `#3b82f6` - Information

#### Neutrale Farben
- **Background**: `#ffffff` (Light) / `#0a0a0a` (Dark)
- **Foreground**: `#171717` (Light) / `#ededed` (Dark)
- **Muted**: `#f5f5f5` (Light) / `#262626` (Dark)
- **Border**: `#e5e5e5` (Light) / `#404040` (Dark)

#### Mahnungs-Spezifisch
- **Level 0 (Neu)**: `#6b7280` - Grau
- **Level 1 (Erinnerung)**: `#3b82f6` - Blau
- **Level 2 (Mahnung 1)**: `#f59e0b` - Orange
- **Level 3 (Mahnung 2)**: `#ef4444` - Rot
- **Level 4 (Mahnung 3/Letzte)**: `#dc2626` - Dunkelrot

### Typografie

#### Schriftarten
- **Sans**: Inter, system-ui, sans-serif
- **Mono**: JetBrains Mono, monospace (für Rechnungsnummern)

#### Schriftgrößen
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)

#### Schriftgewichte
- **normal**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

### Abstände & Layout

#### Border Radius
- **sm**: 0.375rem (6px)
- **md**: 0.5rem (8px)
- **lg**: 0.75rem (12px)
- **xl**: 1rem (16px)
- **full**: 9999px

#### Schatten
- **sm**: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- **md**: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- **lg**: `0 10px 15px -3px rgb(0 0 0 / 0.1)`
- **card**: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`

### Komponenten-Prinzipien

#### Buttons
- Primary: Füllung mit Primary-Farbe
- Secondary: Umrandung, transparent
- Ghost: Kein Hintergrund, nur Text
- Destructive: Rot für gefährliche Aktionen

#### Cards
- Weißer/grauer Hintergrund
- Subtiler Schatten
- Abgerundete Ecken (lg)
- Padding: 1.5rem

#### Formulare
- Klare Labels
- Fokus-Ring in Primary
- Fehlermeldungen in Destructive
- Hilfetext in Muted

#### Tabellen
- Zebrastreifen optional
- Hover-Effekt auf Zeilen
- Klare Header-Trennung
