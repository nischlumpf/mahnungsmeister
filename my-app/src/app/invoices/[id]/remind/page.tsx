'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Send, 
  FileText,
  AlertCircle,
  Euro,
  Clock,
  User,
  Mail,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { InvoiceStatus } from '@prisma/client'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  dueDate: string
  description: string | null
  status: InvoiceStatus
  customer: {
    name: string
    email: string
    street: string | null
    city: string | null
    zipCode: string | null
  }
  reminders: { level: number; sentAt: string; fee: number | null }[]
}

const LEVEL_TEMPLATES = [
  {
    subject: 'Zahlungserinnerung zu Rechnung {invoiceNumber}',
    body: `Sehr geehrte/r {customerName},

wir hoffen, es geht Ihnen gut.

Wir möchten Sie freundlich daran erinnern, dass die Rechnung {invoiceNumber} über {amount} am {dueDate} fällig war.

Falls die Zahlung bereits erfolgt ist, können Sie diese E-Mail ignorieren. Andernfalls bitten wir Sie, den offenen Betrag baldmöglichst zu überweisen.

Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`
  },
  {
    subject: 'Erste Mahnung - Rechnung {invoiceNumber}',
    body: `Sehr geehrte/r {customerName},

trotz unserer Zahlungserinnerung haben wir bisher keinen Zahlungseingang für die Rechnung {invoiceNumber} verzeichnet.

Rechnungsbetrag: {amount}
Fällig seit: {dueDate}
Mahngebühr: 2,50 €

Gesamtbetrag: {totalAmount}

Wir bitten Sie, den Gesamtbetrag innerhalb von 14 Tagen auf unser Konto zu überweisen.

Mit freundlichen Grüßen`
  },
  {
    subject: 'Zweite Mahnung - Rechnung {invoiceNumber}',
    body: `Sehr geehrte/r {customerName},

trotz unserer ersten Mahnung haben wir weiterhin keinen Zahlungseingang erhalten.

Rechnungsbetrag: {amount}
Fällig seit: {dueDate}
Mahngebühren: 5,00 €

Gesamtbetrag: {totalAmount}

Wir bitten Sie dringend, den Gesamtbetrag innerhalb von 7 Tagen zu überweisen. Andernfalls werden wir gezwungen sein, weitere Schritte einzuleiten.

Mit freundlichen Grüßen`
  },
  {
    subject: 'Letzte Mahnung vor Inkasso - Rechnung {invoiceNumber}',
    body: `Sehr geehrte/r {customerName},

dies ist unsere letzte Mahnung vor der Weitergabe Ihres Falls an ein Inkassobüro.

Rechnungsbetrag: {amount}
Fällig seit: {dueDate}
Mahngebühren: 5,00 €

Gesamtbetrag: {totalAmount}

Sollten wir den Betrag nicht innerhalb von 7 Tagen erhalten, werden wir das Inkasso einschalten. Dadurch entstehen Ihnen zusätzliche Kosten.

Mit freundlichen Grüßen`
  }
]

export default function SendReminderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const suggestedLevel = parseInt(searchParams.get('level') || '0')
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [level, setLevel] = useState(suggestedLevel)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (id) fetchInvoice()
  }, [id])

  useEffect(() => {
    if (invoice) {
      generateTemplate(level)
    }
  }, [invoice, level])

  async function fetchInvoice() {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      const data = await res.json()
      setInvoice(data)
      
      // Setze Level auf nächste Stufe basierend auf vorherigen Mahnungen
      if (data.reminders.length > 0) {
        const lastLevel = Math.max(...data.reminders.map((r: { level: number }) => r.level))
        setLevel(Math.min(lastLevel + 1, 3))
      }
    } catch (error) {
      console.error('Error loading invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateTemplate(lvl: number) {
    if (!invoice) return
    
    const template = LEVEL_TEMPLATES[lvl] || LEVEL_TEMPLATES[0]
    const totalAmount = Number(invoice.amount) + (lvl >= 1 ? 2.50 : 0) + (lvl >= 2 ? 2.50 : 0)
    
    const replacements: Record<string, string> = {
      '{invoiceNumber}': invoice.invoiceNumber,
      '{customerName}': invoice.customer.name,
      '{amount}': formatCurrency(Number(invoice.amount)),
      '{totalAmount}': formatCurrency(totalAmount),
      '{dueDate}': new Date(invoice.dueDate).toLocaleDateString('de-DE'),
    }
    
    let newSubject = template.subject
    let newBody = template.body
    
    Object.entries(replacements).forEach(([key, value]) => {
      newSubject = newSubject.replace(new RegExp(key, 'g'), value)
      newBody = newBody.replace(new RegExp(key, 'g'), value)
    })
    
    setSubject(newSubject)
    setBody(newBody)
  }

  async function sendReminder() {
    setSending(true)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: id,
          level,
          subject,
          body,
        }),
      })
      
      if (res.ok) {
        setSent(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
    } finally {
      setSending(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  function getDaysOverdue() {
    if (!invoice) return 0
    return Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
  }

  function getTotalAmount() {
    if (!invoice) return 0
    return Number(invoice.amount) + (level >= 1 ? 2.50 : 0) + (level >= 2 ? 2.50 : 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
          <h1 className="text-xl font-semibold">Rechnung nicht gefunden</h1>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold mb-2">Mahnung gesendet!</h2>
            <p className="text-muted-foreground">
              Die Mahnung wurde erfolgreich erstellt und per E-Mail versendet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mahnung senden</h1>
              <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rechnungsdetails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rechnung</p>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kunde</p>
                    <p className="font-medium">{invoice.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Euro className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rechnungsbetrag</p>
                    <p className="font-medium">{formatCurrency(Number(invoice.amount))}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Überfällig seit</p>
                    <p className="font-medium text-destructive">{getDaysOverdue()} Tagen</p>
                  </div>
                </div>

                {invoice.reminders.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Bisherige Mahnungen:</p>
                    {invoice.reminders.map((reminder, idx) => (
                      <Badge key={idx} variant="outline" className="mr-2">
                        Stufe {reminder.level}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Level Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Mahnungsstufe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        level === lvl 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-sm">
                        {lvl === 0 ? 'Erinnerung' : `Mahnung ${lvl}`}
                      </p>
                      {lvl >= 1 && (
                        <p className="text-xs text-muted-foreground">+ 2.50 € Gebühr</p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rechnungsbetrag:</span>
                    <span>{formatCurrency(Number(invoice.amount))}</span>
                  </div>
                  {level >= 1 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">Mahngebühren:</span>
                      <span>{formatCurrency((level >= 2 ? 5.00 : 2.50))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t font-medium">
                    <span>Gesamtbetrag:</span>
                    <span>{formatCurrency(getTotalAmount())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Form */}
          <Card>
            <CardHeader>
              <CardTitle>E-Mail</CardTitle>
              <CardDescription>
                Bearbeite die Mahnungs-E-Mail vor dem Versand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Betreff</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Nachricht</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={16}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href="/dashboard">
                  <Button type="button" variant="outline">
                    Abbrechen
                  </Button>
                </Link>
                <Button 
                  onClick={sendReminder} 
                  disabled={sending}
                  className="gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Mahnung senden
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
