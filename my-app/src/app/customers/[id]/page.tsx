'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { AppShell } from '../../../components/layout/app-shell'
import {
  ArrowLeft,
  Save,
  FileText,
  Plus,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { InvoiceStatus } from '@prisma/client'

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  street: string | null
  city: string | null
  zipCode: string | null
  country: string
  createdAt: string
  invoices: Invoice[]
}

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  dueDate: string
  status: InvoiceStatus
  description: string | null
  reminders: { level: number; sentAt: string }[]
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    zipCode: '',
    country: 'DE',
  })

  useEffect(() => {
    if (id) fetchCustomer()
  }, [id])

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${id}`)
      const data = await res.json()
      setCustomer(data)
      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        street: data.street || '',
        city: data.city || '',
        zipCode: data.zipCode || '',
        country: data.country || 'DE',
      })
    } catch (error) {
      console.error('Error loading customer:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving customer:', error)
    } finally {
      setSaving(false)
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
      [InvoiceStatus.OPEN]: { label: 'Offen', variant: 'secondary' as const },
      [InvoiceStatus.OVERDUE]: { label: 'Überfällig', variant: 'destructive' as const },
      [InvoiceStatus.PAID]: { label: 'Bezahlt', variant: 'default' as const },
      [InvoiceStatus.CANCELLED]: { label: 'Storniert', variant: 'outline' as const },
      [InvoiceStatus.IN_COLLECTION]: { label: 'Inkasso', variant: 'destructive' as const },
    }
    const { label, variant } = config[status] || { label: status, variant: 'secondary' }
    return <Badge variant={variant}>{label}</Badge>
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    )
  }

  if (!customer) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
            <h1 className="text-xl font-semibold">Kunde nicht gefunden</h1>
            <Link href="/customers">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const openInvoices = customer.invoices.filter(i => i.status === InvoiceStatus.OPEN || i.status === InvoiceStatus.OVERDUE)
  const paidInvoices = customer.invoices.filter(i => i.status === InvoiceStatus.PAID)
  const totalOpen = openInvoices.reduce((sum, i) => sum + Number(i.amount), 0)

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">Kundendetails</p>
          </div>
          <Link href={`/invoices/new?customerId=${customer.id}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Rechnung
            </Button>
          </Link>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gesamtrechnungen</CardDescription>
              <CardTitle className="text-2xl">{customer.invoices.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Offene Beträge</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalOpen)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bezahlte Rechnungen</CardDescription>
              <CardTitle className="text-2xl">{paidInvoices.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Kundendaten</TabsTrigger>
            <TabsTrigger value="invoices">
              Rechnungen
              {customer.invoices.length > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {customer.invoices.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Kundendaten bearbeiten</CardTitle>
                  <CardDescription>
                    Aktualisiere die Kontaktdaten des Kunden
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Adresse</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="street">Straße & Hausnummer</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">PLZ</Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="city">Stadt</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Land</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Speichern...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Speichern
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Rechnungs-History</CardTitle>
                <CardDescription>Alle Rechnungen dieses Kunden</CardDescription>
              </CardHeader>
              <CardContent>
                {customer.invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Rechnungen</p>
                    <Link href={`/invoices/new?customerId=${customer.id}`}>
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
                        <TableHead>Betrag</TableHead>
                        <TableHead>Fällig</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Mahnung</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                            {invoice.description && (
                              <p className="text-xs text-muted-foreground">{invoice.description}</p>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(Number(invoice.amount))}</TableCell>
                          <TableCell>
                            {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
