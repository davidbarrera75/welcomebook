'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SectionEditor } from '@/components/admin/section-editor';
import { SECTION_METADATA, SECTION_TYPES } from '@/lib/section-types';
import { SectionWithMedia } from '@/lib/types';
import {
  Plus,
  Edit3,
  Trash2,
  Wifi,
  Key,
  MapPin,
  User,
  Trash,
  Globe,
  Calendar,
  Phone,
  Zap,
  FileText,
  Code,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const SECTION_ICONS = {
  WIFI: Wifi,
  ACCESS: Key,
  LOCATION: MapPin,
  HOST: User,
  TRASH: Trash,
  MAPS360: Globe,
  WIDGET: Calendar,
  EMERGENCY: Phone,
  APPLIANCES: Zap,
  PLACES: MapPin,
  CUSTOM: FileText,
  HTML_EMBED: Code,
  RICH_TEXT: FileText,
};

interface SectionManagerProps {
  slug: string;
  welcomebookId: string;
  sections: SectionWithMedia[];
}

export function SectionManager({ welcomebookId, sections: initialSections, slug }: SectionManagerProps) {
  const [sections, setSections] = useState(initialSections);
  const [selectedSectionType, setSelectedSectionType] = useState<string>('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const addSection = async () => {
    if (!selectedSectionType) {
      toast({
        title: 'Error',
        description: 'Selecciona un tipo de sección',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          welcomebookId,
          type: selectedSectionType,
          data: {},
          order: sections.length,
        }),
      });

      if (response.ok) {
        const newSection = await response.json();
        const transformedSection: SectionWithMedia = {
          ...newSection,
          media: newSection.media?.map((media: any) => ({
            ...media,
            filename: media.filename || '',
          })) || [],
        };
        setSections([...sections, transformedSection]);
        setSelectedSectionType('');
        setEditingSection(newSection.id);
        toast({
          title: 'Éxito',
          description: 'Sección agregada correctamente',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo agregar la sección',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteSection = async (sectionId: string, sectionType: string) => {
    const metadata = SECTION_METADATA[sectionType as keyof typeof SECTION_METADATA];
    if (!confirm(`¿Estás seguro de que quieres eliminar la sección "${metadata?.title || sectionType}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSections(sections.filter(section => section.id !== sectionId));
        if (editingSection === sectionId) {
          setEditingSection(null);
        }
        toast({
          title: 'Éxito',
          description: 'Sección eliminada correctamente',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la sección',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión',
        variant: 'destructive',
      });
    }
  };

  const updateSection = (sectionId: string, updatedData: any) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? { ...section, data: updatedData }
        : section
    ));
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // Validar límites
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(index, 1);
    newSections.splice(newIndex, 0, movedSection);

    // Actualizar orden local inmediatamente para mejor UX
    setSections(newSections);

    try {
      // Actualizar el orden en la base de datos para ambas secciones
      const updates = newSections.map((section, idx) =>
        fetch(`/api/sections/${section.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: idx }),
        })
      );

      await Promise.all(updates);

      toast({
        title: 'Éxito',
        description: 'Orden actualizado',
      });
    } catch (error) {
      // Revertir en caso de error
      setSections(sections);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el orden',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Add New Section - Mejorado para móvil */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl">Agregar Nueva Sección</CardTitle>
          <CardDescription className="text-sm">
            Selecciona el tipo de información que quieres compartir con tus huéspedes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:gap-0">
            <div className="flex-1 w-full">
              <Select value={selectedSectionType} onValueChange={setSelectedSectionType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona el tipo de sección..." />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.filter(type => {
                    // Allow multiple CUSTOM and HTML_EMBED sections
                    if (type === 'CUSTOM' || type === 'HTML_EMBED') return true;
                    // Only one of each other type
                    return !sections.some(s => s.type === type);
                  }).map(type => {
                    const metadata = SECTION_METADATA[type];
                    const Icon = SECTION_ICONS[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">{metadata.title}</div>
                            <div className="text-sm text-muted-foreground">{metadata.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={addSection}
              disabled={!selectedSectionType || isAdding}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2 text-white" />
              {isAdding ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Sections - Mejorado para móvil */}
      <div className="space-y-3 md:space-y-4">
        {sections.map((section, index) => {
          const metadata = SECTION_METADATA[section.type as keyof typeof SECTION_METADATA];
          const Icon = SECTION_ICONS[section.type as keyof typeof SECTION_ICONS];
          const hasData = Object.keys(section.data || {}).length > 0;

          return (
            <Card key={section.id} className="relative shadow-sm border-gray-200 overflow-hidden">
              <CardHeader className="pb-3 md:pb-4">
                {/* Desktop Layout */}
                <div className="hidden md:flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Botones de mover */}
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{metadata?.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {metadata?.description}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={hasData ? 'default' : 'secondary'}>
                      {hasData ? 'Configurada' : 'Vacía'}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      {editingSection === section.id ? 'Cerrar' : 'Editar'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSection(section.id, section.type)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile Layout - Completamente rediseñado */}
                <div className="md:hidden space-y-3">
                  {/* Título y descripción */}
                  <div className="flex items-start space-x-2">
                    {/* Botones de mover en móvil */}
                    <div className="flex flex-col flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="h-5 w-5 p-0"
                      >
                        <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="h-5 w-5 p-0"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                    </div>
                    <Icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight">{metadata?.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {metadata?.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={hasData ? 'default' : 'secondary'}
                      className="flex-shrink-0 text-xs"
                    >
                      {hasData ? 'OK' : 'Vacía'}
                    </Badge>
                  </div>

                  {/* Botones de acción - En una fila que cabe en móvil */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                      className="flex-1 h-9"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-xs">{editingSection === section.id ? 'Cerrar' : 'Editar'}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSection(section.id, section.type)}
                      className="flex-1 h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-xs">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingSection === section.id && (
                <CardContent className="pt-0 border-t bg-gray-50/50">
                  <SectionEditor
                    section={section}
                    onUpdate={(data) => updateSection(section.id, data)}
                    onClose={() => setEditingSection(null)}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}

        {sections.length === 0 && (
          <Card className="text-center py-8 md:py-12 shadow-sm border-gray-200">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                No hay secciones
              </h3>
              <p className="text-sm md:text-base text-gray-600 px-4">
                Agrega secciones para proporcionar información útil a tus huéspedes
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vista pública - Botón siempre visible */}
      <Card className="shadow-sm border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 mt-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Vista previa pública
              </h3>
              <p className="text-sm text-gray-600">
                Visualiza cómo se ve tu welcomebook para los huéspedes
              </p>
            </div>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Ver Welcomebook público
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
