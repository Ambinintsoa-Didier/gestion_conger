'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { EventInput } from '@fullcalendar/core';

// Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CongeEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    idDemande: number;
    employe: string;
    matricule: string;
    fonction: string;
    structure: string;
    typeConge: string;
    statut: string;
    motif: string;
    duree: number;
  };
}

interface Filter {
  structure_id?: number;
  type_conge_id?: number;
}

// Couleurs bleu pour les types de congé
const TYPE_CONGE_COLORS: { [key: string]: string } = {
  'Congé Annuel': '#3B82F6',      // Blue-500
  'Congé Maladie': '#60A5FA',     // Blue-400
  'Congé Maternité': '#2563EB',   // Blue-600
  'Congé Paternité': '#1D4ED8',   // Blue-700
  'Congé Sans Solde': '#93C5FD',  // Blue-300
  'Congé Exceptionnel': '#1E40AF', // Blue-800
  'RTT': '#1E3A8A',               // Blue-900
};

export default function CalendrierPage() {
  const { user } = useAuth();
  const router = useRouter();
  const calendarRef = useRef<any>(null);
  
  const [events, setEvents] = useState<CongeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'>('dayGridMonth');
  const [selectedEvent, setSelectedEvent] = useState<CongeEvent | null>(null);
  const [filters, setFilters] = useState<Filter>({});
  const [structures, setStructures] = useState<any[]>([]);
  const [typesConge, setTypesConge] = useState<any[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [stats, setStats] = useState({
    total_conges: 0,
    conges_ce_mois: 0,
    employes_en_conge: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadCalendrierData();
  }, [user, router, filters]);

  const loadCalendrierData = async () => {
    try {
      setLoading(true);
      const [calendrierRes, statsRes] = await Promise.all([
        axios.get('/calendrier/conges'),
        axios.get('/calendrier/stats')
      ]);
      
      const transformedEvents = calendrierRes.data.conges.map((event: any) => ({
        ...event,
        backgroundColor: TYPE_CONGE_COLORS[event.extendedProps.typeConge] || '#6B7280',
        borderColor: TYPE_CONGE_COLORS[event.extendedProps.typeConge] || '#6B7280',
        textColor: '#FFFFFF',
      }));
      
      setEvents(transformedEvents);
      setStructures(calendrierRes.data.filters?.structures || []);
      setTypesConge(calendrierRes.data.filters?.typesConge || []);
      setStats(statsRes.data.stats || {});
    } catch (error: any) {
      console.error('Erreur chargement calendrier:', error);
      alert('Erreur lors du chargement du calendrier');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setIsSheetOpen(true);
  };

  const handleFilterChange = (filterType: keyof Filter, value: string) => {
    const newFilters = {
      ...filters,
      [filterType]: value === 'all' ? undefined : parseInt(value)
    };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getEventContent = (eventInfo: any) => {
    const eventType = eventInfo.event.extendedProps.typeConge;
    const bgColor = TYPE_CONGE_COLORS[eventType] || '#6B7280';
    
    return {
      html: `
        <div class="fc-event-content p-1 rounded text-white text-xs leading-tight" style="background: ${bgColor}; border-color: ${bgColor};">
          <div class="font-semibold truncate">
            ${eventInfo.event.title}
          </div>
          <div class="opacity-90 truncate">
            ${eventType}
          </div>
        </div>
      `
    };
  };

  const navigateToToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* En-tête compacte */}
      <header className="bg-card border-b shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link 
                href="/dashboard" 
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">Calendrier des Congés</h1>
                <p className="text-muted-foreground text-sm truncate">
                  {user.role === 'employe' ? 'Mes congés' : 'Congés de l\'équipe'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <Badge variant="secondary" className="text-xs">
                {view === 'dayGridMonth' ? 'Mois' : 
                 view === 'timeGridWeek' ? 'Semaine' : 
                 view === 'timeGridDay' ? 'Jour' : 'Liste'}
              </Badge>
              <span className="text-muted-foreground text-sm hidden sm:inline">
                {user.nom_complet}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col">
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total_conges}</p>
                    <p className="text-sm text-muted-foreground">Congés validés</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.conges_ce_mois}</p>
                    <p className="text-sm text-muted-foreground">Ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.employes_en_conge}</p>
                    <p className="text-sm text-muted-foreground">En congé actuellement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barre de contrôles */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4 shrink-0">
            <Select
              value={filters.structure_id?.toString() || "all"}
              onValueChange={(value) => handleFilterChange('structure_id', value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les structures</SelectItem>
                {structures.map((structure) => (
                  <SelectItem key={structure.idStructure} value={structure.idStructure.toString()}>
                    {structure.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.type_conge_id?.toString() || "all"}
              onValueChange={(value) => handleFilterChange('type_conge_id', value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Type de congé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {typesConge.map((type) => (
                  <SelectItem key={type.idType} value={type.idType.toString()}>
                    {type.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={view}
              onValueChange={(value: any) => setView(value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Vue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dayGridMonth">Mois</SelectItem>
                <SelectItem value="timeGridWeek">Semaine</SelectItem>
                <SelectItem value="timeGridDay">Jour</SelectItem>
                <SelectItem value="listMonth">Liste</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 lg:col-span-2">
              <Button
                onClick={navigateToToday}
                variant="outline"
                size="sm"
                className="h-9 flex-1"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Aujourd'hui
              </Button>
              
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="h-9 flex-1"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </Button>

              {/* Légende */}
              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-card border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <h4 className="font-semibold text-sm mb-2">Légende des types de congé</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(TYPE_CONGE_COLORS).map(([type, color]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: color, borderColor: color }}
                        />
                        <span className="text-muted-foreground">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calendrier */}
          <Card className="flex-1 min-h-0 overflow-hidden">
            <CardContent className="p-4 h-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <p className="text-muted-foreground text-sm">Chargement du calendrier...</p>
                </div>
              ) : (
                <div className="h-full" style={{ minHeight: '500px' }}>
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                    }}
                    initialView={view}
                    events={events as EventInput[]}
                    eventClick={handleEventClick}
                    eventContent={getEventContent}
                    locale={frLocale}
                    height="auto"
                    eventDisplay="block"
                    nowIndicator={true}
                    editable={false}
                    selectable={false}
                    weekends={true}
                    dayMaxEvents={3}
                    eventMaxStack={2}
                    views={{
                      dayGridMonth: {
                        dayMaxEvents: 3,
                        eventMaxStack: 2,
                      },
                      timeGridWeek: {
                        dayMaxEvents: 4,
                        eventMaxStack: 2,
                        slotMinTime: '08:00:00',
                        slotMaxTime: '20:00:00'
                      },
                      timeGridDay: {
                        dayMaxEvents: 6,
                        eventMaxStack: 3,
                        slotMinTime: '08:00:00', 
                        slotMaxTime: '20:00:00'
                      },
                      listMonth: {
                        listDayFormat: { weekday: 'short', day: 'numeric', month: 'short' },
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Sheet de détails */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Détails du Congé</SheetTitle>
            <SheetDescription>
              Informations complètes sur la période de congé
            </SheetDescription>
          </SheetHeader>
          
          {selectedEvent && (
            <div className="mt-6 space-y-6">
              {/* En-tête */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedEvent.extendedProps.employe}
                </h3>
                <Badge 
                  style={{ 
                    backgroundColor: selectedEvent.backgroundColor as string,
                    color: 'white'
                  }}
                >
                  {selectedEvent.extendedProps.typeConge}
                </Badge>
              </div>

              <Tabs defaultValue="informations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="details">Détails</TabsTrigger>
                </TabsList>
                
                <TabsContent value="informations" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Fonction:</span>
                      <p className="text-foreground mt-1">{selectedEvent.extendedProps.fonction}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Structure:</span>
                      <p className="text-foreground mt-1">{selectedEvent.extendedProps.structure}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Durée:</span>
                      <p className="text-foreground mt-1">{selectedEvent.extendedProps.duree} jours</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Statut:</span>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {selectedEvent.extendedProps.statut}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <span className="font-medium text-muted-foreground block text-sm mb-2">Période:</span>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-foreground text-sm">
                        <strong>Du</strong> {new Date(selectedEvent.start!).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-foreground text-sm mt-1">
                        <strong>Au</strong> {new Date(selectedEvent.end!).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {selectedEvent.extendedProps.motif && (
                    <div>
                      <span className="font-medium text-muted-foreground block text-sm mb-2">Motif:</span>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-foreground text-sm leading-relaxed">
                          {selectedEvent.extendedProps.motif}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex space-x-2 pt-4 border-t">
                <Button 
                  onClick={() => setIsSheetOpen(false)}
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Styles globaux */}
      <style jsx global>{`
        .fc {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--muted) / 0.3);
          --fc-page-bg-color: hsl(var(--background));
          --fc-neutral-bg-color: hsl(var(--background));
        }

        .fc .fc-view-harness {
          min-height: 400px;
          max-height: 60vh;
          overflow-y: auto !important;
        }

        .fc .fc-daygrid-body {
          min-height: 500px;
        }

        .fc .fc-timegrid-body {
          min-height: 400px;
        }

        .fc .fc-list {
          min-height: 400px;
          max-height: 60vh;
          overflow-y: auto !important;
        }

        .fc .fc-toolbar {
          padding: 8px 0;
          margin-bottom: 8px;
        }

        .fc .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .fc-button {
          padding: 6px 12px;
          font-size: 0.875rem;
        }

        .fc-event {
          border: none;
          border-radius: 4px;
          font-weight: 500;
          margin: 1px;
          transition: all 0.2s ease-in-out;
        }

        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .fc-day-today {
          background: hsl(var(--muted) / 0.2) !important;
        }

        .fc-col-header-cell {
          background: hsl(var(--muted) / 0.3);
          padding: 8px 0;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .fc-daygrid-day-number {
          font-weight: 500;
          padding: 4px;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .fc-toolbar-chunk {
            width: 100%;
            display: flex;
            justify-content: center;
          }
          
          .fc .fc-toolbar-title {
            font-size: 1rem;
            text-align: center;
          }

          .fc-button {
            padding: 4px 8px;
            font-size: 0.75rem;
          }

          .fc .fc-view-harness {
            max-height: 50vh;
          }
        }
      `}</style>
    </div>
  );
}