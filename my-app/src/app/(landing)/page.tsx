import Link from "next/link"
import { ArrowRight, Check, FileText, Zap, Shield, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">MahnungsMeister</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="#features" className="transition-colors hover:text-foreground/80">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors hover:text-foreground/80">
                Preise
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Anmelden
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Kostenlos testen</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="container relative z-10 flex flex-col items-center justify-center gap-4 py-24 text-center md:py-32">
            <Badge variant="secondary" className="mb-4">
              🚀 Jetzt neu: Automatische Mahnungen
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Nie wieder
              <br />
              <span className="text-primary">unbezahlte Rechnungen</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              MahnungsMeister automatisiert Ihr Mahnwesen. Erstellen Sie professionelle 
              Mahnungen in Sekunden, verfolgen Sie Zahlungen und sparen Sie wertvolle Zeit.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Kostenlos starten
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline">
                  Demo ansehen
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              14 Tage kostenlos testen. Keine Kreditkarte erforderlich.
            </p>
          </div>

          {/* Gradient Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24 sm:py-32">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              Alles was Sie brauchen
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Professionelles Mahnwesen war noch nie so einfach.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-lg border bg-background p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="border-t bg-muted/50">
          <div className="container py-24 sm:py-32">
            <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:gap-8">
              <div className="flex flex-col justify-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Warum MahnungsMeister?
                </h2>
                <p className="text-muted-foreground">
                  Wir haben MahnungsMeister entwickelt, um Unternehmen zu helfen, 
                  ihr Cashflow zu verbessern und Zeit zu sparen.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-xl border bg-card p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Überfällige Rechnungen</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Muster GmbH", amount: "2.450 €", days: "14 Tage" },
                      { name: "Beispiel AG", amount: "1.200 €", days: "7 Tage" },
                      { name: "Test KG", amount: "890 €", days: "3 Tage" },
                    ].map((invoice) => (
                      <div
                        key={invoice.name}
                        className="flex items-center justify-between rounded-lg border bg-background p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{invoice.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Überfällig seit {invoice.days}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">{invoice.amount}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full">Alle Mahnungen senden</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24 sm:py-32">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              Bereit zum Start?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Beginnen Sie noch heute und verbessern Sie Ihr Mahnwesen.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Kostenlos starten
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2024 MahnungsMeister. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy">Datenschutz</Link>
            <Link href="/terms">AGB</Link>
            <Link href="/imprint">Impressum</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: "Automatische Mahnungen",
    description:
      "Lassen Sie Mahnungen automatisch erstellen und versenden. Nie wieder manuelle Arbeit.",
    icon: Zap,
  },
  {
    title: "Rechnungs-Tracking",
    description:
      "Behalten Sie den Überblick über alle Ihre Rechnungen und deren Zahlungsstatus.",
    icon: FileText,
  },
  {
    title: "Sicher & DSGVO-konform",
    description:
      "Ihre Daten sind sicher bei uns. Alle Funktionen entsprechen der DSGVO.",
    icon: Shield,
  },
  {
    title: "Zeitersparnis",
    description:
      "Sparen Sie bis zu 10 Stunden pro Woche durch automatisierte Prozesse.",
    icon: Clock,
  },
  {
    title: "Professionelle Templates",
    description:
      "Nutzen Sie unsere vordefinierten Mahnungsvorlagen oder erstellen Sie eigene.",
    icon: FileText,
  },
  {
    title: "Schnelle Integration",
    description:
      "Verbinden Sie sich mit Ihrer Buchhaltungssoftware in wenigen Minuten.",
    icon: Zap,
  },
]

const benefits = [
  "Bis zu 40% schnellere Zahlungseingänge",
  "Reduzierung von Überfälligkeiten um 60%",
  "Professioneller Auftritt gegenüber Kunden",
  "Vollständige Automatisierung des Mahnwesens",
  "Detaillierte Berichte und Analysen",
  "24/7 Support bei Fragen",
]
