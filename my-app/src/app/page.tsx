import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-slate-900">MahnungsMeister</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-slate-600">Anmelden</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Kostenlos testen</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
            Automatisiertes Mahnwesen
            <span className="text-blue-600"> für Handwerker</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Nie wieder vergessene Rechnungen. MahnungsMeister erledigt das Mahnwesen 
            vollautomatisch – von der ersten Erinnerung bis zur letzten Mahnung.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
              Jetzt kostenlos starten
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Demo ansehen
            </Button>
          </div>
          
          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="text-3xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-slate-600 mt-1">weniger Zeitaufwand</div>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="text-3xl font-bold text-green-600">3x</div>
              <div className="text-sm text-slate-600 mt-1">schnellere Zahlungen</div>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="text-3xl font-bold text-slate-900">DSGVO</div>
              <div className="text-sm text-slate-600 mt-1">konform & sicher</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
