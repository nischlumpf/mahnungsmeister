'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppShell } from '@/components/layout/app-shell'
import { 
  Euro, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  FileText, 
  Plus, 
  Bell,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface DashboardStats {
  openAmount: number
  overdueAmount: number
  paidAmount: number
  successRate: number
  customerCount: number
  totalInvoices: number
}

interface OverdueInvoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  dueDate: string
  customer: { name: string; email: string }
  reminders: { level: number; sentAt: string }[]
}

interface MonthlyData {
  month: string
  count: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topOverdue, setTopOverdue] = useState<OverdueInvoice[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setStats(data.stats)
      setTopOverdue(data.topOverdue)
      setMonthlyData(data.monthlyReminders)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  function getDaysOverdue(dueDate: string) {
    const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  function getReminderBadge(level: number) {
    const labels = ['Erinnerung', 'Mahnung 1', 'Mahnung 2', 'Mahnung 3']
    const variants = ['secondary', 'default', 'destructive', 'destructive'] as const
    return <Badge variant={variants[level] || 'secondary'}>{labels[level] || 'Neu'}</Badge>
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

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Offene Beträge</CardDescription>
              <CardTitle className="text-3xl">{formatCurrency(stats?.openAmount || 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mr-1" />
                {stats?.totalInvoices || 0} Rechnungen
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Überfällig</CardDescription>
              <CardTitle className="text-3xl text-destructive">{formatCurrency(stats?.overdueAmount || 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                {topOverdue.length} Rechnungen
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Erfolgsrate</CardDescription>
              <CardTitle className="text-3xl">{stats?.successRate || 0}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Bezahlte Rechnungen
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Kunden</CardDescription>
              <CardTitle className="text-3xl">{stats?.customerCount || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                Aktive Kunden
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schnell-Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/customers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Kunde
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Neue Rechnung
            </Button>
          </Link>
          <Link href="/reminders/check">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Mahnungen prüfen
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Überfällige Rechnungen */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Überfällige Rechnungen</CardTitle>
                    <CardDescription>Top 5 - Dringendste Mahnungen</CardDescription>
                  </div>
                  <Link href="/invoices?status=OVERDUE">
                    <Button variant="ghost" size="sm">
                      Alle anzeigen
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {topOverdue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
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
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topOverdue.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{invoice.customer.name}</TableCell>
                          <TableCell>{formatCurrency(Number(invoice.amount))}</TableCell>
                          <TableCell>
                            <span className="text-destructive font-medium">
                              {getDaysOverdue(invoice.dueDate)} Tage
                            </span>
                          </TableCell>
                          <TableCell>
                            {invoice.reminders.length > 0 
                              ? getReminderBadge(invoice.reminders[0].level)
                              : <Badge variant="outline">Keine Mahnung</Badge>
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mahnungen pro Monat Chart */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Mahnungen pro Monat</CardTitle>
                <CardDescription>Aktuelles Jahr</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-10">{data.month}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ 
                            width: `${Math.max(
                              5, 
                              (data.count / Math.max(...monthlyData.map(d => d.count), 1)) * 100
                            )}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{data.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
