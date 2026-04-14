'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppShell } from '@/components/layout/app-shell'
import { ArrowLeft, Save, FileText, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  name: string
  email: string
}

function NewInvoiceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get('customerId')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    amount: '',
    currency: 'EUR',
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
    customerId: preselectedCustomerId || '',
    pdfFile: null as File | null,
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: PDF Upload handling
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: formData.invoiceNumber,
          amount: formData.amount,
          currency: formData.currency,
          dueDate: formData.dueDate,
          issueDate: formData.issueDate,
          description: formData.description,
          customerId: formData.customerId,
        }),
      })

      if (res.ok) {
        router.push('/invoices')
      } else {
        console.error('Error creating invoice')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Neue Rechnung</h1>
          <p className="text-sm text-muted-foreground">Rechnung anlegen</p>
        </div>
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Rechnungsdaten</CardTitle>
              <CardDescription>
                Gib die Details der neuen Rechnung ein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Select */}
              <div className="space-y-2">
                <Label htmlFor="customer">Kunde *</Label>
                <select
                  id="customer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                >
                  <option value="">Kunde auswählen...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Kunden vorhanden.{' '}
                    <Link href="/customers/new" className="text-primary hover:underline">
                      Ersten Kunden anlegen
                    </Link>
                  </p>
                )}
              </div>

              {/* Invoice Number */}
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Rechnungsnummer *</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="RE-2024-001"
                  required
                />
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Betrag *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="100.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Währung</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="EUR"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Rechnungsdatum</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fälligkeitsdatum *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Projekt XY - Entwicklung"
                />
              </div>

              {/* PDF Upload */}
              <div className="space-y-2">
                <Label htmlFor="pdf">PDF-Rechnung (optional)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="pdf"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormData({ ...formData, pdfFile: e.target.files?.[0] || null })}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Lade die originale PDF-Rechnung hoch (optional)
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href="/invoices">
                  <Button type="button" variant="outline">
                    Abbrechen
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || !formData.customerId}>
                  {loading ? (
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
      </div>
    </AppShell>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    }>
      <NewInvoiceContent />
    </Suspense>
  )
}
