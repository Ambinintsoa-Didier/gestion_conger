'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

// Shadcn components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CongeEvent {
  id: string;
  employe: string;
  matricule: string;
  fonction: string;
  structure: string;
  typeConge: string;
  statut: string;
  motif: string;
  duree: number;
  start: string;
  end: string;
}

interface Filter {
  structure_id?: number;
  type_conge_id?: number;
}

const TYPE_CONGE_COLORS: { [key: string]: string } = {
  'Congé Annuel': '#3B82F6',
  'Congé Maladie': '#EF4444',
  'Congé Maternité': '#8B5CF6',
  'Congé Paternité': '#06B6D4',
  'Congé Sans Solde': '#6B7280',
  'Congé Exceptionnel': '#F59E0B',
  'RTT': '#10B981',
};

const STATUT_COLORS: { [key: string]: string } = {
  'Validée': 'bg-green-100 text-green-800 border-green-200',
  'En attente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Refusée': 'bg-red-100 text-red-800 border-red-200',
};

export default function CalendrierPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [allEvents, setAllEvents] = useState<CongeEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CongeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CongeEvent | null>(null);
  const [filters, setFilters] = useState<Filter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [structures, setStructures] = useState<any[]>([]);
  const [typesConge, setTypesConge] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('liste');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadAllConges();
  }, [user, router]);

  useEffect(() => {
    filterEvents();
  }, [allEvents, currentDate, filters, searchTerm]);

  const loadAllConges = async () => {
    try {
      setLoading(true);
      
      const calendrierRes = await axios.get('/calendrier/conges');
      
      setAllEvents(calendrierRes.data.conges || []);
      setStructures(calendrierRes.data.filters?.structures || []);
      setTypesConge(calendrierRes.data.filters?.typesConge || []);
    } catch (error: any) {
      console.error('Erreur chargement calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = allEvents;

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    filtered = filtered.filter(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      return (
        (startDate.getFullYear() === currentYear && startDate.getMonth() === currentMonth) ||
        (endDate.getFullYear() === currentYear && endDate.getMonth() === currentMonth) ||
        (startDate <= new Date(currentYear, currentMonth + 1, 0) && endDate >= new Date(currentYear, currentMonth, 1))
      );
    });

    if (filters.structure_id) {
      filtered = filtered.filter(event => 
        event.structure.toLowerCase().includes(
          structures.find(s => s.idStructure === filters.structure_id)?.nom.toLowerCase() || ''
        )
      );
    }

    if (filters.type_conge_id) {
      filtered = filtered.filter(event => 
        event.typeConge.toLowerCase().includes(
          typesConge.find(t => t.idType === filters.type_conge_id)?.nom.toLowerCase() || ''
        )
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.employe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.fonction.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.structure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.typeConge.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredEvents(filtered);
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
    setSearchTerm('');
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.getDate()} - ${endDate.getDate()} ${startDate.toLocaleDateString('fr-FR', { month: 'long' })} ${startDate.getFullYear()}`;
    } else {
      return `${startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  };

  const handleEventClick = (event: CongeEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const getEventColor = (event: CongeEvent | null) => {
    if (!event || !event.typeConge) return '#6B7280';
    return TYPE_CONGE_COLORS[event.typeConge] || '#6B7280';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'rh': 'bg-purple-100 text-purple-800 border-purple-200',
      'superieur': 'bg-blue-100 text-blue-800 border-blue-200',
      'employe': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Générer les jours du mois pour la vue calendrier
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Ajouter les jours du mois précédent pour compléter la première semaine
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        events: []
      });
    }

    // Ajouter les jours du mois courant
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return date >= eventStart && date <= eventEnd;
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents
      });
    }

    // Ajouter les jours du mois suivant pour compléter la dernière semaine
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        events: []
      });
    }

    return days;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* En-tête cohérent avec le dashboard */}
      <header className="bg-card border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3">
              <Link 
                href="/dashboard" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-lg font-bold text-foreground">Calendrier des Congés</h1>
                  <p className="text-xs text-muted-foreground">
                    {getMonthName(currentDate)} • {user.role === 'employe' ? 'Mes congés' : 'Vue globale'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className={getRoleColor(user.role)}>
                {user.role === 'admin' ? 'Administrateur' : 
                 user.role === 'rh' ? 'Ressources Humaines' :
                 user.role === 'superieur' ? 'Supérieur Hiérarchique' : 'Employé'}
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">{user.nom_complet}</span>
              <Button
                onClick={() => setIsLegendOpen(true)}
                variant="outline"
                size="sm"
              >
                Légende
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full py-3 px-4 sm:px-6 lg:px-8">
        {/* Barre de contrôle améliorée */}
        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
              {/* Navigation du mois */}
              <div className="flex items-center gap-2">
                <Button onClick={goToPreviousMonth} variant="outline" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                
                <Button onClick={goToToday} variant="default" size="sm">
                  Aujourd'hui
                </Button>
                
                <Button onClick={goToNextMonth} variant="outline" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>

                <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="font-semibold text-primary text-sm">
                    {getMonthName(currentDate)}
                  </span>
                </div>
              </div>

              {/* Vue switch */}
              <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
                <TabsList>
                  <TabsTrigger value="calendrier">Vue Calendrier</TabsTrigger>
                  <TabsTrigger value="liste">Vue Liste</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Recherche et filtres */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <Input
                  placeholder="Rechercher un employé, service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:w-48 text-sm"
                />
                
                <div className="flex gap-2">
                  <Select
                    value={filters.structure_id?.toString() || "all"}
                    onValueChange={(value) => handleFilterChange('structure_id', value)}
                  >
                    <SelectTrigger className="w-32 text-sm">
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
                    <SelectTrigger className="w-32 text-sm">
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

                  <Button onClick={clearFilters} variant="outline" size="sm" className="text-xs">
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu principal */}
        <div className="h-[calc(100vh-180px)]">
          <Card className="h-full">
            <CardContent className="p-3 h-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Chargement du calendrier...</p>
                  </div>
                </div>
              ) : activeView === 'calendrier' ? (
                // Vue Calendrier
                <div className="h-full flex flex-col">
                  <div className="grid grid-cols-7 gap-1 mb-1 flex-shrink-0">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 flex-1 overflow-auto">
                    {days.map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-[60px] border rounded p-1 ${
                          day.isCurrentMonth 
                            ? 'bg-card' 
                            : 'bg-muted/20 text-muted-foreground'
                        } ${
                          day.date.toDateString() === new Date().toDateString() 
                            ? 'border-primary ring-1 ring-primary' 
                            : 'border-border'
                        }`}
                      >
                        <div className="text-xs font-medium mb-1">
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1 max-h-10 overflow-y-auto">
                          {day.events.slice(0, 2).map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ 
                                backgroundColor: getEventColor(event),
                                color: 'white'
                              }}
                              onClick={() => handleEventClick(event)}
                              title={`${event.employe} - ${event.typeConge}`}
                            >
                              <div className="truncate font-medium text-[10px]">{event.employe.split(' ')[0]}</div>
                            </div>
                          ))}
                          {day.events.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{day.events.length - 2} autres
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Vue Liste
                <div className="h-full overflow-y-auto">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 h-full flex items-center justify-center">
                      <div>
                        <svg className="mx-auto h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-foreground">Aucun congé trouvé</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Aucun congé ne correspond à vos critères de recherche.
                        </p>
                        <Button onClick={clearFilters} variant="outline" size="sm" className="mt-2 text-xs">
                          Voir tous les congés
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredEvents.map((event) => (
                        <Card 
                          key={event.id} 
                          className="cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-primary/50 border"
                          onClick={() => handleEventClick(event)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <div 
                                  className="w-2 h-10 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: getEventColor(event) }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-foreground">
                                      {event.employe || 'Employé'}
                                    </h3>
                                    <Badge variant="secondary" className="text-xs">
                                      {event.matricule || 'N/A'}
                                    </Badge>
                                    <Badge 
                                      className={STATUT_COLORS[event.statut] || 'bg-gray-100 text-gray-800 border-gray-200'}
                                    >
                                      {event.statut}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{event.fonction}</span>
                                    <span>•</span>
                                    <span>{event.structure}</span>
                                    <span>•</span>
                                    <span>{event.duree} jour(s)</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1 justify-end">
                                  <Badge 
                                    className="text-xs font-medium"
                                    style={{ 
                                      backgroundColor: getEventColor(event),
                                      color: 'white'
                                    }}
                                  >
                                    {event.typeConge}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground justify-end">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDateRange(event.start, event.end)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de détails */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold">
                    {selectedEvent.employe}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className="text-xs font-medium"
                      style={{ 
                        backgroundColor: getEventColor(selectedEvent),
                        color: 'white'
                      }}
                    >
                      {selectedEvent.typeConge}
                    </Badge>
                    <Badge 
                      className={STATUT_COLORS[selectedEvent.statut] || 'bg-gray-100 text-gray-800 border-gray-200'}
                    >
                      {selectedEvent.statut}
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="text-xs">
                  Détails du congé
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Informations Employé</h4>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Matricule:</span>
                        <p className="font-medium">{selectedEvent.matricule}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fonction:</span>
                        <p className="font-medium">{selectedEvent.fonction}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Structure:</span>
                        <p className="font-medium">{selectedEvent.structure}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Période de congé</h4>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Début:</span>
                        <p className="font-medium">{new Date(selectedEvent.start).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fin:</span>
                        <p className="font-medium">{new Date(selectedEvent.end).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Durée:</span>
                        <p className="font-medium">{selectedEvent.duree} jour(s)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedEvent.motif && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Motif</h4>
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      {selectedEvent.motif}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button 
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                  size="sm"
                >
                  Fermer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de légende */}
      <Dialog open={isLegendOpen} onOpenChange={setIsLegendOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Légende des types de congés</DialogTitle>
            <DialogDescription className="text-xs">
              Couleurs utilisées dans le calendrier
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-2">
            {Object.entries(TYPE_CONGE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-foreground">{type}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button 
              onClick={() => setIsLegendOpen(false)}
              variant="outline"
              size="sm"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}