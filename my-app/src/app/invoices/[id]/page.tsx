'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Euro,
  Calendar,
  Mail,
  Printer,
  Trash2,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { InvoiceStatus } from '@prisma/client'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  dueDate: string
  issueDate: string
  description: string | null
  status: InvoiceStatus
  pdfUrl: string | null
  customer: {
    id: string
    name: string
    email: string
    phone: string | null
    street: string | null
    city: string | null
    zipCode: string | null
    country: string
  }
  reminders: {
    id: string
    level: number
    subject: string
    body: string
    sentAt: string
    fee: number | null
    status: string
  }[]
  payments: {
    id: string
    amount: number
    paidAt: string
    method: string
    reference: string | null
  }[]
  createdAt: string
}

const LEVEL_LABELS = ['Erinnerung', '1. Mahnung', '2. Mahnung', 'Letzte Mahnung']
const LEVEL_VARIANTS = ['secondary', 'default', 'destructive', 'destructive'] as const

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  useEffect(() => {
    if (id) fetchInvoice()
  }, [id])

  async function fetchInvoice() {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Failed to load invoice')
      const data = await res.json()
      setInvoice(data)
    } catch (error) {
      console.error('Error loading invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsPaid() {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: InvoiceStatus.PAID }),
      })
      if (res.ok) {
        fetchInvoice()
        setShowPaymentDialog(false)
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

  async function deleteInvoice() {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/invoices')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: invoice?.currency || 'EUR'
    }).format(amount)
  }

  function getStatusBadge(status: InvoiceStatus) {
    const config = {
      [InvoiceStatus.OPEN]: { label: 'Offen', variant: 'secondary' as const, icon: Clock },
      [InvoiceStatus.OVERDUE]: { label: 'Überfällig', variant: 'destructive' as const, icon: AlertCircle },
      [InvoiceStatus.PAID]: { label: 'Bezahlt', variant: 'default' as const, icon: CheckCircle2 },
      [InvoiceStatus.CANCELLED]: { label: 'Storniert', variant: 'outline' as const, icon: Clock },
      [InvoiceStatus.IN_COLLECTION]: { label: 'Inkasso', variant: 'destructive' as const, icon: AlertCircle },
    }
    const { label, variant, icon: Icon } = config[status] || { label: status, variant: 'secondary', icon: Clock }
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  function getDaysOverdue(dueDate: string) {
    const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  function getTotalAmount() {
    if (!invoice) return 0
    const reminderFees = invoice.reminders.reduce((sum, r) => sum + (r.fee || 0), 0)
    return Number(invoice.amount) + reminderFees
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
          <Link href="/invoices">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const daysOverdue = getDaysOverdue(invoice.dueDate)
  const totalAmount = getTotalAmount()
  const lastReminder = invoice.reminders[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/invoices">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(invoice.status)}
                  {invoice.status === InvoiceStatus.OVERDUE && (
                    <span className="text-sm text-destructive">
                      {daysOverdue} Tage überfällig
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(invoice.status === InvoiceStatus.OPEN || invoice.status === InvoiceStatus.OVERDUE) && (
                <>
                  <Link href={`/invoices/${invoice.id}/remind`}>
                    <Button variant="outline" className="gap-2">
                      <Send className="h-4 w-4" />
                      Mahnung senden
                    </Button>
                  </Link>
                  <Button onClick={() => setShowPaymentDialog(true)} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Als bezahlt markieren
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {invoice.pdfUrl && (
                    <DropdownMenuItem asChild>
                      <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Printer className="h-4 w-4 mr-2" />
                        PDF anzeigen
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Betragsübersicht */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rechnungsbetrag</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(Number(invoice.amount))}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Mahngebühren</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(invoice.reminders.reduce((sum, r) => sum + (r.fee || 0), 0))}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gesamtbetrag</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalAmount)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reminders">
              Mahnungen
              {invoice.reminders.length > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {invoice.reminders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments">
              Zahlungen
              {invoice.payments.length > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {invoice.payments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rechnungsdetails */}
              <Card>
                <CardHeader>
                  <CardTitle>Rechnungsdetails</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rechnungsnummer</p>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rechnungsdatum</p>
                      <p className="font-medium">
                        {format(new Date(invoice.issueDate || invoice.createdAt), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fälligkeitsdatum</p>
                      <p className={`font-medium ${invoice.status === InvoiceStatus.OVERDUE ? 'text-destructive' : ''}`}>
                        {format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                  </div>

                  {invoice.description && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Beschreibung</p>
                      <p className="text-sm">{invoice.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kundendetails */}
              <Card>
                <CardHeader>
                  <CardTitle>Kunde</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <Link 
                        href={`/customers/${invoice.customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.customer.name}
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">E-Mail</p>
                      <a 
                        href={`mailto:${invoice.customer.email}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.customer.email}
                      </a>
                    </div>
                  </div>

                  {invoice.customer.phone && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium">{invoice.customer.phone}</p>
                      </div>
                    </div>
                  )}

                  {(invoice.customer.street || invoice.customer.city) && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Adresse</p>
                      <p className="text-sm">{invoice.customer.street}</p>
                      <p className="text-sm">
                        {invoice.customer.zipCode} {invoice.customer.city}
                      </p>
                      <p className="text-sm">{invoice.customer.country}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reminders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mahnungs-History</CardTitle>
                    <CardDescription>Alle gesendeten Mahnungen für diese Rechnung</CardDescription>
                  </div>
                  {(invoice.status === InvoiceStatus.OPEN || invoice.status === InvoiceStatus.OVERDUE) && (
                    <Link href={`/invoices/${invoice.id}/remind`}>
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Neue Mahnung
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {invoice.reminders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Mahnungen versendet</p>
                    {(invoice.status === InvoiceStatus.OPEN || invoice.status === InvoiceStatus.OVERDUE) && (
                      <Link href={`/invoices/${invoice.id}/remind`}>
                        <Button variant="outline" className="mt-4">
                          <Send className="h-4 w-4 mr-2" />
                          Erste Mahnung senden
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Stufe</TableHead>
                        <TableHead>Betreff</TableHead>
                        <TableHead>Gebühr</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.reminders.map((reminder) => (
                        <TableRow key={reminder.id}>
                          <TableCell>
                            {format(new Date(reminder.sentAt), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={LEVEL_VARIANTS[reminder.level] || 'secondary'}>
                              {LEVEL_LABELS[reminder.level] || `Stufe ${reminder.level}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {reminder.subject}
                          </TableCell>
                          <TableCell>
                            {reminder.fee ? formatCurrency(reminder.fee) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{reminder.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Zahlungen</CardTitle>
                <CardDescription>Erhaltene Zahlungen für diese Rechnung</CardDescription>
              </CardHeader>
              <CardContent>
                {invoice.payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Euro className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Zahlungen erhalten</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Methode</TableHead>
                        <TableHead>Referenz</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.paidAt), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>{payment.reference || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechnung löschen</DialogTitle>
            <DialogDescription>
              Möchtest du die Rechnung {invoice.invoiceNumber} wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={deleteInvoice}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Als bezahlt markieren</DialogTitle>
            <DialogDescription>
              Möchtest du die Rechnung {invoice.invoiceNumber} als bezahlt markieren?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={markAsPaid}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Als bezahlt markieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
