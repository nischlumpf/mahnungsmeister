'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Trash2,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { InvoiceStatus } from '@prisma/client'
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
  status: InvoiceStatus
  description: string | null
  customer: { name: string; email: string }
  reminders: { level: number; sentAt: string }[]
}

export default function InvoicesPage() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter])

  async function fetchInvoices() {
    try {
      const url = new URL('/api/invoices', window.location.origin)
      if (statusFilter) url.searchParams.set('status', statusFilter)
      
      const res = await fetch(url)
      const data = await res.json()
      setInvoices(data)
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteInvoice() {
    if (!deleteId) return
    try {
      await fetch(`/api/invoices/${deleteId}`, { method: 'DELETE' })
      setInvoices(invoices.filter(i => i.id !== deleteId))
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  async function markAsPaid(id: string) {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: InvoiceStatus.PAID }),
      })
      if (res.ok) {
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
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
    const { label, variant } = config[status] || { label: status, variant: 'secondary' }
    return <Badge variant={variant}>{label}</Badge>
  }

  function getDaysOverdue(dueDate: string) {
    return Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
  }

  const title = statusFilter === 'OVERDUE' ? 'Überfällige Rechnungen' : 'Alle Rechnungen'

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
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{invoices.length} Rechnungen</p>
              </div>
            </div>
            <Link href="/invoices/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neue Rechnung
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Keine Rechnungen gefunden</p>
                <Link href="/invoices/new">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Erste Rechnung erstellen
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rechnung</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Fällig</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mahnung</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                        {invoice.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {invoice.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{invoice.customer.name}</TableCell>
                      <TableCell>{formatCurrency(Number(invoice.amount))}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{new Date(invoice.dueDate).toLocaleDateString('de-DE')}</span>
                          {invoice.status === InvoiceStatus.OVERDUE && (
                            <span className="text-xs text-destructive">
                              {getDaysOverdue(invoice.dueDate)} Tage überfällig
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {invoice.reminders.length > 0 ? (
                          <Badge variant="outline">
                            Stufe {invoice.reminders[0].level}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(invoice.status === InvoiceStatus.OPEN || invoice.status === InvoiceStatus.OVERDUE) && (
                              <>
                                <DropdownMenuItem onClick={() => markAsPaid(invoice.id)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Als bezahlt markieren
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/invoices/${invoice.id}/remind`}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Mahnung senden
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteId(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechnung löschen</DialogTitle>
            <DialogDescription>
              Möchtest du diese Rechnung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={deleteInvoice}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
