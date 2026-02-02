'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SectionWithMedia } from '@/lib/types';
import { 
  WifiSectionData,
  AccessSectionData,
  LocationSectionData,
  HostSectionData,
  TrashSectionData,
  Maps360SectionData,
  WidgetSectionData,
  EmergencySectionData,
  AppliancesSectionData,
  PlacesSectionData,
  CustomSectionData,
  validateSectionData,
  SectionType
} from '@/lib/section-types';
import { Save, Plus, X } from 'lucide-react';

interface SectionEditorProps {
  section: SectionWithMedia;
  onUpdate: (data: any) => void;
  onClose: () => void;
}

export function SectionEditor({ section, onUpdate, onClose }: SectionEditorProps) {
  const [formData, setFormData] = useState(section.data || {});
  const [formDataEn, setFormDataEn] = useState(section.dataEn || {});
  const [customTitle, setCustomTitle] = useState(section.customTitle || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const [localMedia, setLocalMedia] = useState(section.media || []);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveSection = async () => {
    setIsLoading(true);
    try {
      validateSectionData(section.type as SectionType, formData);
      const response = await fetch(`/api/sections/${section.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: formData,
          dataEn: formDataEn,
          customTitle: customTitle.trim() || null,
        }),
      });

      if (response.ok) {
        onUpdate(formData);
        toast({ title: 'Éxito', description: 'Sección guardada correctamente' });
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'No se pudo guardar la sección',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      // Extract friendly error message from Zod validation
      let errorMessage = 'Los datos no son válidos';
      
      if (error?.issues && error.issues.length > 0) {
        // Get the first error message from Zod
        errorMessage = error.issues[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error de validación',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Editores por tipo ----------
  // (PUEDES OMITIR tipado si lo deseas)
  const renderWifiEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="networkName">Nombre de la Red *</Label>
        <Input
          id="networkName"
          value={formData.networkName || ''}
          onChange={(e) => updateFormData('networkName', e.target.value)}
          placeholder="ej: WiFi_Casa"
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          value={formData.password || ''}
          onChange={(e) => updateFormData('password', e.target.value)}
          placeholder="ej: contraseña123"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => updateFormData('notes', e.target.value)}
          placeholder="Si tienes problemas de conexión, reinicia tu dispositivo..."
        />
      </div>
    </div>
  );
  const renderAccessEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => updateFormData('title', e.target.value)}
          placeholder="ej: Instrucciones de Acceso"
        />
      </div>
      <div>
        <Label htmlFor="instructions">Instrucciones *</Label>
        <Textarea
          id="instructions"
          value={formData.instructions || ''}
          onChange={(e) => updateFormData('instructions', e.target.value)}
          placeholder="Describe cómo acceder a la propiedad..."
          rows={4}
        />
      </div>
    </div>
  );
  const renderLocationEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="address">Dirección *</Label>
        <Input
          id="address"
          value={formData.address || ''}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="ej: Calle Principal 123, Ciudad"
        />
      </div>
      <div>
        <Label htmlFor="instructions">Indicaciones</Label>
        <Textarea
          id="instructions"
          value={formData.instructions || ''}
          onChange={(e) => updateFormData('instructions', e.target.value)}
          placeholder="Indicaciones adicionales para llegar..."
        />
      </div>
      <div>
        <Label htmlFor="mapEmbed">Mapa de Google Maps (código iframe)</Label>
        <Textarea
          id="mapEmbed"
          value={formData.mapEmbed || ''}
          onChange={(e) => updateFormData('mapEmbed', e.target.value)}
          placeholder='Pega aquí el código iframe de Google Maps. Ejemplo: <iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
          className="font-mono text-sm"
          rows={4}
        />
        <p className="text-sm text-gray-500 mt-1">
          Para obtener el código: Google Maps → Compartir → Incorporar un mapa → Copiar HTML
        </p>
      </div>
    </div>
  );
  const renderHostEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre del Anfitrión *</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="ej: María González"
        />
      </div>
      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          value={formData.phone || ''}
          onChange={(e) => updateFormData('phone', e.target.value)}
          placeholder="ej: +57 301 234 5678"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => updateFormData('email', e.target.value)}
          placeholder="ej: maria@ejemplo.com"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => updateFormData('notes', e.target.value)}
          placeholder="Información adicional sobre horarios de contacto..."
        />
      </div>
    </div>
  );
  const renderTrashEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="instructions">Instrucciones *</Label>
        <Textarea
          id="instructions"
          value={formData.instructions || ''}
          onChange={(e) => updateFormData('instructions', e.target.value)}
          placeholder="Describe dónde y cómo desechar la basura..."
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="schedule">Horario de Recolección</Label>
        <Input
          id="schedule"
          value={formData.schedule || ''}
          onChange={(e) => updateFormData('schedule', e.target.value)}
          placeholder="ej: Lunes, Miércoles y Viernes a las 7:00 AM"
        />
      </div>
    </div>
  );
  const renderMaps360Editor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => updateFormData('title', e.target.value)}
          placeholder="ej: Tour Virtual 360°"
        />
      </div>
      <div>
        <Label htmlFor="embedUrl">URL del Embed *</Label>
        <Input
          id="embedUrl"
          type="url"
          value={formData.embedUrl || ''}
          onChange={(e) => updateFormData('embedUrl', e.target.value)}
          placeholder="ej: https://www.google.com/maps/embed?pb=..."
        />
        <p className="text-sm text-gray-600">
          URL del iframe de Google Maps 360° o similar
        </p>
      </div>
    </div>
  );
  const renderWidgetEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => updateFormData('title', e.target.value)}
          placeholder="ej: Reserva tu próxima estadía"
        />
      </div>
      <div>
        <Label htmlFor="htmlCode">Código HTML del Widget *</Label>
        <Textarea
          id="htmlCode"
          value={formData.htmlCode || ''}
          onChange={(e) => updateFormData('htmlCode', e.target.value)}
          placeholder='<iframe src="..." width="100%" height="400"></iframe>'
          rows={6}
        />
        <p className="text-sm text-gray-600">
          Código HTML del widget de reservas (ej: Booking.com, Airbnb)
        </p>
      </div>
    </div>
  );
  const renderEmergencyEditor = () => {
    const contacts = formData.contacts || [];
    const addContact = () => {
      const newContact = { id: Date.now().toString(), name: '', phone: '' };
      updateFormData('contacts', [...contacts, newContact]);
    };
    const updateContact = (index: number, field: string, value: string) => {
      const updatedContacts = [...contacts];
      updatedContacts[index] = { ...updatedContacts[index], [field]: value };
      updateFormData('contacts', updatedContacts);
    };
    const removeContact = (index: number) => {
      const updatedContacts = contacts.filter((_: any, i: number) => i !== index);
      updateFormData('contacts', updatedContacts);
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Contactos de Emergencia</Label>
          <Button type="button" onClick={addContact} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar Contacto
          </Button>
        </div>
        {contacts.map((contact: any, index: number) => (
          <Card key={contact.id || index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium">Contacto {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={contact.name || ''}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    placeholder="ej: Policía Nacional"
                  />
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={contact.phone || ''}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    placeholder="ej: 123"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {contacts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay contactos agregados. Haz clic en "Agregar Contacto" para empezar.
          </div>
        )}
      </div>
    );
  };
  const renderAppliancesEditor = () => {
    const items = formData.items || [];
    const addItem = () => {
      const newItem = { id: Date.now().toString(), name: '', instructions: '', mediaUrls: [] };
      updateFormData('items', [...items, newItem]);
    };
    const updateItem = (index: number, field: string, value: string) => {
      const updatedItems = [...items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      updateFormData('items', updatedItems);
    };
    const removeItem = (index: number) => {
      const updatedItems = items.filter((_: any, i: number) => i !== index);
      updateFormData('items', updatedItems);
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Electrodomésticos</Label>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar Electrodoméstico
          </Button>
        </div>
        {items.map((item: any, index: number) => (
          <Card key={item.id || index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium">Electrodoméstico {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={item.name || ''}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="ej: Lavadora, Microondas, TV"
                  />
                </div>
                <div>
                  <Label>Instrucciones *</Label>
                  <Textarea
                    value={item.instructions || ''}
                    onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                    placeholder="Instrucciones de uso..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay electrodomésticos agregados. Haz clic en "Agregar Electrodoméstico" para empezar.
          </div>
        )}
      </div>
    );
  };
  const renderPlacesEditor = () => {
    const places = formData.places || [];
    const addPlace = () => {
      const newPlace = { id: Date.now().toString(), name: '', category: '', address: '', notes: '', mediaUrls: [] };
      updateFormData('places', [...places, newPlace]);
    };
    const updatePlace = (index: number, field: string, value: string) => {
      const updatedPlaces = [...places];
      updatedPlaces[index] = { ...updatedPlaces[index], [field]: value };
      updateFormData('places', updatedPlaces);
    };
    const removePlace = (index: number) => {
      const updatedPlaces = places.filter((_: any, i: number) => i !== index);
      updateFormData('places', updatedPlaces);
    };
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Lugares de Interés</Label>
          <Button type="button" onClick={addPlace} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar Lugar
          </Button>
        </div>
        {places.map((place: any, index: number) => (
          <Card key={place.id || index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium">Lugar {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlace(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre *</Label>
                    <Input
                      value={place.name || ''}
                      onChange={(e) => updatePlace(index, 'name', e.target.value)}
                      placeholder="ej: Valle de Cocora"
                    />
                  </div>
                  <div>
                    <Label>Categoría *</Label>
                    <Input
                      value={place.category || ''}
                      onChange={(e) => updatePlace(index, 'category', e.target.value)}
                      placeholder="ej: Naturaleza, Restaurante, Cultura"
                    />
                  </div>
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input
                    value={place.address || ''}
                    onChange={(e) => updatePlace(index, 'address', e.target.value)}
                    placeholder="ej: Centro de Salento"
                  />
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={place.notes || ''}
                    onChange={(e) => updatePlace(index, 'notes', e.target.value)}
                    placeholder="Información adicional, precios, horarios..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {places.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay lugares agregados. Haz clic en "Agregar Lugar" para empezar.
          </div>
        )}
      </div>
    );
  };

  // FUNCIONES MULTIMEDIA PERSONALIZADA
  const handleCustomMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('sectionId', section.id);
        const mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO';
        formDataUpload.append('type', mediaType);
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        if (response.ok) {
          const media = await response.json();
          return media;
        }
        throw new Error('Upload failed');
      });
      const uploadedMedia = await Promise.all(uploadPromises);
      setLocalMedia([...localMedia, ...uploadedMedia]);
      toast({ title: 'Éxito', description: `${uploadedMedia.length} archivo(s) subido(s) correctamente` });
      e.target.value = '';
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron subir los archivos', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };
  const deleteCustomMedia = async (mediaId: string) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;
    try {
      const response = await fetch(`/api/media/${mediaId}`, { method: 'DELETE' });
      if (response.ok) {
        setLocalMedia(localMedia.filter((m: any) => m.id !== mediaId));
        toast({ title: 'Éxito', description: 'Archivo eliminado correctamente' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el archivo', variant: 'destructive' });
    }
  };
  const renderCustomEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => updateFormData('title', e.target.value)}
          placeholder="ej: Piscina, Jacuzzi, Instrucciones del Carro"
          className="rounded-lg"
        />
      </div>
      <div>
        <Label htmlFor="content">Contenido *</Label>
        <Textarea
          id="content"
          value={formData.content || ''}
          onChange={(e) => updateFormData('content', e.target.value)}
          placeholder="Escribe el contenido personalizado..."
          rows={6}
          className="rounded-lg"
        />
      </div>
      <div className="border-t pt-4">
        <Label>Fotos y Videos</Label>
        <div className="mt-2">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleCustomMediaUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-[var(--main-red)] file:text-white
              hover:file:bg-[var(--main-red)]
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-sm text-gray-600 mt-1">
            Puedes subir múltiples fotos y videos (máx. 10MB por archivo)
          </p>
        </div>
        {isUploading && (
          <div className="mt-4 text-sm text-[var(--main-red)]">
            Subiendo archivos...
          </div>
        )}
        {localMedia && localMedia.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            {localMedia.map((media: any) => (
              <div key={media.id} className="relative group card p-2">
                {media.type === 'PHOTO' ? (
                  <img
                    src={media.url}
                    alt={media.filename}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={media.url}
                    className="w-full h-32 object-cover rounded-lg"
                    controls
                  />
                )}
                <button
                  onClick={() => deleteCustomMedia(media.id)}
                  className="absolute top-2 right-2 bg-[var(--main-red)] text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ---------- Renderizador general ----------
  const renderEditor = () => {
    switch (section.type) {
      case 'WIFI': return renderWifiEditor();
      case 'ACCESS': return renderAccessEditor();
      case 'LOCATION': return renderLocationEditor();
      case 'HOST': return renderHostEditor();
      case 'TRASH': return renderTrashEditor();
      case 'MAPS360': return renderMaps360Editor();
      case 'WIDGET': return renderWidgetEditor();
      case 'EMERGENCY': return renderEmergencyEditor();
      case 'APPLIANCES': return renderAppliancesEditor();
      case 'PLACES': return renderPlacesEditor();
      case 'CUSTOM': return renderCustomEditor();
      default: return <div>Editor no disponible para este tipo de sección</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="card border p-4">
        <p className="text-[var(--main-blue)] text-sm">
          Completa la información de esta sección. Los campos marcados con * son obligatorios.
        </p>
      </div>
      <div className="border-b pb-4">
        <Label htmlFor="customTitle">Título Personalizado de la Sección (opcional)</Label>
        <Input
          id="customTitle"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Ej: Instrucciones para usar la lavadora, Cómo llegar al apartamento, etc."
          className="mt-2 rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          Si lo dejas vacío, se usará el título por defecto según el tipo de sección.
        </p>
      </div>
      {renderEditor()}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button variant="outline" onClick={onClose} className="bg-[var(--main-white)] text-[var(--main-red)] border-[var(--main-red)]">
          Cancelar
        </Button>
        <Button onClick={saveSection} disabled={isLoading} className="bg-[var(--main-red)] hover:bg-[var(--main-red)] text-white">
          <Save className="h-4 w-4 mr-2 text-white" />
          {isLoading ? 'Guardando...' : 'Guardar Sección'}
        </Button>
      </div>
    </div>
  );
}
