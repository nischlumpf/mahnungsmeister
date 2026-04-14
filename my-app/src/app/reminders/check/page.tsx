'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppShell } from '@/components/layout/app-shell'
import {
  Send,
  CheckCircle2,
  RefreshCw,
  FileText,
  User
} from 'lucide-react'
import Link from 'next/link'
import { InvoiceStatus } from '@prisma/client'
import { differenceInDays } from 'date-fns'
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
  status: InvoiceStatus
  customer: {
    id: string
    name: string
    email: string
  }
  reminders: {
    id: string
    level: number
    sentAt: string
  }[]
}

interface CheckResult {
  invoice: Invoice
  daysOverdue: number
  lastReminderLevel: number
  daysSinceLastReminder: number | null
  recommendedAction: 'reminder' | 'mahnung1' | 'mahnung2' | 'mahnung3' | 'inkasso' | 'wait'
  recommendedLevel: number
}

const ACTION_LABELS = {
  reminder: { label: 'Erinnerung', variant: 'secondary' as const },
  mahnung1: { label: '1. Mahnung', variant: 'default' as const },
  mahnung2: { label: '2. Mahnung', variant: 'destructive' as const },
  mahnung3: { label: 'Letzte Mahnung', variant: 'destructive' as const },
  inkasso: { label: 'Inkasso', variant: 'destructive' as const },
  wait: { label: 'Warten', variant: 'outline' as const },
}

export default function CheckRemindersPage() {
  const [, setOverdueInvoices] = useState<Invoice[]>([])
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<CheckResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    fetchOverdueInvoices()
  }, [])

  async function fetchOverdueInvoices() {
    try {
      const res = await fetch('/api/invoices?status=OVERDUE')
      const data = await res.json()
      setOverdueInvoices(data)
      analyzeInvoices(data)
    } catch (error) {
      console.error('Error loading overdue invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  function analyzeInvoices(invoices: Invoice[]) {
    const results: CheckResult[] = invoices.map((invoice) => {
      const daysOverdue = differenceInDays(new Date(), new Date(invoice.dueDate))
      const lastReminder = invoice.reminders[0]
      const lastReminderLevel = lastReminder ? lastReminder.level : -1
      const daysSinceLastReminder = lastReminder 
        ? differenceInDays(new Date(), new Date(lastReminder.sentAt))
        : null

      let recommendedAction: CheckResult['recommendedAction'] = 'wait'
      let recommendedLevel = 0

      // Logik für Empfehlungen
      if (lastReminderLevel === -1) {
        // Noch keine Mahnung
        if (daysOverdue >= 1) {
          recommendedAction = 'reminder'
          recommendedLevel = 0
        }
      } else if (lastReminderLevel === 0) {
        // Erinnerung gesendet
        if (daysSinceLastReminder && daysSinceLastReminder >= 7) {
          recommendedAction = 'mahnung1'
          recommendedLevel = 1
        }
      } else if (lastReminderLevel === 1) {
        // 1. Mahnung gesendet
        if (daysSinceLastReminder && daysSinceLastReminder >= 14) {
          recommendedAction = 'mahnung2'
          recommendedLevel = 2
        }
      } else if (lastReminderLevel === 2) {
        // 2. Mahnung gesendet
        if (daysSinceLastReminder && daysSinceLastReminder >= 7) {
          recommendedAction = 'mahnung3'
          recommendedLevel = 3
        }
      } else if (lastReminderLevel === 3) {
        // Letzte Mahnung gesendet
        if (daysSinceLastReminder && daysSinceLastReminder >= 7) {
          recommendedAction = 'inkasso'
          recommendedLevel = 4
        }
      }

      return {
        invoice,
        daysOverdue,
        lastReminderLevel,
        daysSinceLastReminder,
        recommendedAction,
        recommendedLevel,
      }
    })

    // Sortieren: Dringendste zuerst
    results.sort((a, b) => {
      if (a.recommendedAction === 'wait' && b.recommendedAction !== 'wait') return 1
      if (a.recommendedAction !== 'wait' && b.recommendedAction === 'wait') return -1
      return b.daysOverdue - a.daysOverdue
    })

    setCheckResults(results)
  }

  async function sendReminder(result: CheckResult) {
    setProcessing(result.invoice.id)
    try {
      const res = await fetch('/api/mahnungen/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: result.invoice.id }),
      })

      if (res.ok) {
        fetchOverdueInvoices()
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
    } finally {
      setProcessing(null)
      setShowConfirmDialog(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const needsAction = checkResults.filter(r => r.recommendedAction !== 'wait')
  const waiting = checkResults.filter(r => r.recommendedAction === 'wait')

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mahnungen prüfen</h1>
            <p className="text-sm text-muted-foreground">
              {needsAction.length} Rechnungen benötigen Aktion
            </p>
          </div>
          <Button variant="outline" onClick={fetchOverdueInvoices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
        {/* Zusammenfassung */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Überfällige Rechnungen</CardDescription>
              <CardTitle className="text-2xl">{checkResults.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Benötigen Aktion</CardDescription>
              <CardTitle className="text-2xl text-destructive">{needsAction.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Warten</CardDescription>
              <CardTitle className="text-2xl">{waiting.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gesamtbetrag offen</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(checkResults.reduce((sum, r) => sum + Number(r.invoice.amount), 0))}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabelle */}
        <Card>
          <CardHeader>
            <CardTitle>Überfällige Rechnungen</CardTitle>
            <CardDescription>
              Übersicht aller überfälligen Rechnungen mit Handlungsempfehlungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : checkResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Keine überfälligen Rechnungen!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rechnung</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Überfällig</TableHead>
                    <TableHead>Letzte Mahnung</TableHead>
                    <TableHead>Empfohlene Aktion</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkResults.map((result) => {
                    const action = ACTION_LABELS[result.recommendedAction]
                    return (
                      <TableRow key={result.invoice.id}>
                        <TableCell className="font-medium">
                          <Link href={`/invoices/${result.invoice.id}`} className="hover:underline">
                            {result.invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{result.invoice.customer.name}</TableCell>
                        <TableCell>{formatCurrency(Number(result.invoice.amount))}</TableCell>
                        <TableCell>
                          <span className="text-destructive font-medium">
                            {result.daysOverdue} Tage
                          </span>
                        </TableCell>
                        <TableCell>
                          {result.lastReminderLevel >= 0 ? (
                            <Badge variant="outline">
                              Stufe {result.lastReminderLevel}
                              {result.daysSinceLastReminder !== null && (
                                <span className="ml-1 text-muted-foreground">
                                  ({result.daysSinceLastReminder}d)
                                </span>
                              )}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={action.variant}>{action.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {result.recommendedAction !== 'wait' && result.recommendedAction !== 'inkasso' ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(result)
                                setShowConfirmDialog(true)
                              }}
                              disabled={processing === result.invoice.id}
                            >
                              {processing === result.invoice.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          ) : result.recommendedAction === 'inkasso' ? (
                            <Badge variant="destructive">Inkasso</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {result.daysSinceLastReminder !== null
                                ? `${14 - result.daysSinceLastReminder}d`
                                : '-'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahnung senden</DialogTitle>
            <DialogDescription>
              Möchtest du {selectedInvoice?.recommendedLevel === 0 ? 'eine Zahlungserinnerung' : `eine ${selectedInvoice?.recommendedLevel}. Mahnung`} für die Rechnung {selectedInvoice?.invoice.invoiceNumber} senden?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{selectedInvoice?.invoice.customer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedInvoice?.invoice.customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mt-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatCurrency(Number(selectedInvoice?.invoice.amount || 0))}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedInvoice?.daysOverdue} Tage überfällig
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => selectedInvoice && sendReminder(selectedInvoice)}
              disabled={processing !== null}
            >
              <Send className="h-4 w-4 mr-2" />
              Mahnung senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AppShell>
  )
}
