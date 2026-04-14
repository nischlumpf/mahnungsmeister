'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ArrowLeft, 
  Bell, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DueInvoice {
  invoice: {
    id: string
    invoiceNumber: string
    amount: number
    currency: string
    dueDate: string
    customer: { name: string; email: string }
  }
  daysOverdue: number
  suggestedLevel: number
}

const LEVEL_LABELS = [
  'Zahlungserinnerung',
  'Mahnung 1 (2.50€)',
  'Mahnung 2 (2.50€)',
  'Mahnung 3 + Inkasso'
]

const LEVEL_DESCRIPTIONS = [
  'Freundliche Erinnerung an die offene Zahlung',
  'Erste offizielle Mahnung mit 2.50€ Gebühr',
  'Zweite Mahnung mit 2.50€ Gebühr',
  'Letzte Mahnung vor Inkasso-Androhung'
]

export default function ReminderCheckPage() {
  const router = useRouter()
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    checkReminders()
  }, [])

  async function checkReminders() {
    setChecking(true)
    try {
      const res = await fetch('/api/reminders/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setDueInvoices(data.invoices)
    } catch (error) {
      console.error('Error checking reminders:', error)
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  function getLevelBadge(level: number) {
    const variants = ['secondary', 'default', 'destructive', 'destructive'] as const
    return <Badge variant={variants[level]}>{LEVEL_LABELS[level]}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Mahnungs-Check</h1>
                <p className="text-sm text-muted-foreground">
                  Automatische Prüfung fälliger Rechnungen
                </p>
              </div>
            </div>
            <Button onClick={checkReminders} disabled={checking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Neu prüfen
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workflow Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mahnungs-Workflow</CardTitle>
            <CardDescription>
              Automatischer Ablauf basierend auf Tagen nach Fälligkeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {LEVEL_LABELS.map((label, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tag {index === 0 ? 1 : index * 14}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {LEVEL_DESCRIPTIONS[index]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fällige Mahnungen</CardTitle>
                <CardDescription>
                  {dueInvoices.length} Rechnungen benötigen eine Mahnung
                </CardDescription>
              </div>
              {dueInvoices.length > 0 && (
                <Badge variant="destructive">{dueInvoices.length} ausstehend</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : dueInvoices.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <h3 className="text-lg font-medium">Alles erledigt!</h3>
                <p className="text-muted-foreground mt-1">
                  Keine Rechnungen benötigen aktuell eine Mahnung
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rechnung</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Überfällig</TableHead>
                    <TableHead>Empfohlene Mahnung</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueInvoices.map((item) => (
                    <TableRow key={item.invoice.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/invoices/${item.invoice.id}`} 
                          className="hover:underline"
                        >
                          {item.invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{item.invoice.customer.name}</TableCell>
                      <TableCell>{formatCurrency(Number(item.invoice.amount))}</TableCell>
                      <TableCell>
                        <span className="text-destructive font-medium">
                          {item.daysOverdue} Tage
                        </span>
                      </TableCell>
                      <TableCell>{getLevelBadge(item.suggestedLevel)}</TableCell>
                      <TableCell>
                        <Link href={`/invoices/${item.invoice.id}/remind?level=${item.suggestedLevel}`}>
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-1" />
                            Mahnung erstellen
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
