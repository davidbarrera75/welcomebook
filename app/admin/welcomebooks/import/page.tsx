'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Upload,
  Loader2,
  FileText,
  CheckCircle,
  Trash2,
  Wifi,
  Key,
  MapPin,
  User,
  Phone,
  Trash,
  Zap,
  FileQuestion,
  Plus,
  X
} from 'lucide-react';
import Link from 'next/link';

interface ExtractedSection {
  type: string;
  data: any;
}

interface ExtractedData {
  propertyName: string;
  sections: ExtractedSection[];
}

const SECTION_ICONS: Record<string, any> = {
  WIFI: Wifi,
  ACCESS: Key,
  LOCATION: MapPin,
  HOST: User,
  EMERGENCY: Phone,
  TRASH: Trash,
  APPLIANCES: Zap,
  CUSTOM: FileText,
};

const SECTION_TITLES: Record<string, string> = {
  WIFI: 'WiFi',
  ACCESS: 'Instrucciones de Acceso',
  LOCATION: 'Ubicación',
  HOST: 'Anfitrión',
  EMERGENCY: 'Contactos de Emergencia',
  TRASH: 'Basura y Reciclaje',
  APPLIANCES: 'Electrodomésticos',
  CUSTOM: 'Información Adicional',
};

export default function ImportWelcomebookPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedData(null);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/welcomebooks/extract', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setExtractedData(result.data);
        toast({
          title: 'Éxito',
          description: `Se detectaron ${result.data.sections.length} secciones. Revisa y edita antes de crear.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'No se pudo extraer la información',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al procesar el archivo',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateWelcomebook = async () => {
    if (!extractedData) return;

    setIsCreating(true);
    try {
      // 1. Create welcomebook
      const wbResponse = await fetch('/api/welcomebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyName: extractedData.propertyName,
        }),
      });

      if (!wbResponse.ok) {
        throw new Error('No se pudo crear el welcomebook');
      }

      const welcomebook = await wbResponse.json();

      // 2. Create sections
      for (let i = 0; i < extractedData.sections.length; i++) {
        const section = extractedData.sections[i];
        await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            welcomebookId: welcomebook.id,
            type: section.type,
            data: section.data,
            order: i,
          }),
        });
      }

      toast({
        title: 'Éxito',
        description: 'Welcomebook creado correctamente con todas las secciones',
      });

      router.push(`/admin/welcomebooks/${welcomebook.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el welcomebook',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateSectionData = (index: number, field: string, value: any) => {
    if (!extractedData) return;
    const newSections = [...extractedData.sections];
    newSections[index].data = { ...newSections[index].data, [field]: value };
    setExtractedData({ ...extractedData, sections: newSections });
  };

  const updateNestedArray = (sectionIndex: number, arrayField: string, itemIndex: number, field: string, value: any) => {
    if (!extractedData) return;
    const newSections = [...extractedData.sections];
    const array = [...(newSections[sectionIndex].data[arrayField] || [])];
    array[itemIndex] = { ...array[itemIndex], [field]: value };
    newSections[sectionIndex].data = { ...newSections[sectionIndex].data, [arrayField]: array };
    setExtractedData({ ...extractedData, sections: newSections });
  };

  const addArrayItem = (sectionIndex: number, arrayField: string, template: any) => {
    if (!extractedData) return;
    const newSections = [...extractedData.sections];
    const array = [...(newSections[sectionIndex].data[arrayField] || [])];
    array.push({ ...template, id: Date.now().toString() });
    newSections[sectionIndex].data = { ...newSections[sectionIndex].data, [arrayField]: array };
    setExtractedData({ ...extractedData, sections: newSections });
  };

  const removeArrayItem = (sectionIndex: number, arrayField: string, itemIndex: number) => {
    if (!extractedData) return;
    const newSections = [...extractedData.sections];
    const array = [...(newSections[sectionIndex].data[arrayField] || [])];
    array.splice(itemIndex, 1);
    newSections[sectionIndex].data = { ...newSections[sectionIndex].data, [arrayField]: array };
    setExtractedData({ ...extractedData, sections: newSections });
  };

  const deleteSection = (index: number) => {
    if (!extractedData) return;
    const newSections = extractedData.sections.filter((_, i) => i !== index);
    setExtractedData({ ...extractedData, sections: newSections });
    toast({
      title: 'Sección eliminada',
      description: 'Puedes seguir editando las demás secciones',
    });
  };

  const renderSectionEditor = (section: ExtractedSection, index: number) => {
    const Icon = SECTION_ICONS[section.type] || FileQuestion;
    const title = SECTION_TITLES[section.type] || section.type;

    return (
      <Card key={index} className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSection(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderFieldsForType(section, index)}
        </CardContent>
      </Card>
    );
  };

  const renderFieldsForType = (section: ExtractedSection, index: number) => {
    const { type, data } = section;

    switch (type) {
      case 'WIFI':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre de la Red *</Label>
                <Input
                  value={data.networkName || ''}
                  onChange={(e) => updateSectionData(index, 'networkName', e.target.value)}
                  placeholder="Nombre del WiFi"
                />
              </div>
              <div>
                <Label>Contraseña *</Label>
                <Input
                  value={data.password || ''}
                  onChange={(e) => updateSectionData(index, 'password', e.target.value)}
                  placeholder="Contraseña del WiFi"
                />
              </div>
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={data.notes || ''}
                onChange={(e) => updateSectionData(index, 'notes', e.target.value)}
                placeholder="Instrucciones adicionales..."
                rows={2}
              />
            </div>
          </>
        );

      case 'ACCESS':
        return (
          <>
            <div>
              <Label>Título</Label>
              <Input
                value={data.title || ''}
                onChange={(e) => updateSectionData(index, 'title', e.target.value)}
                placeholder="Instrucciones de Acceso"
              />
            </div>
            <div>
              <Label>Instrucciones *</Label>
              <Textarea
                value={data.instructions || ''}
                onChange={(e) => updateSectionData(index, 'instructions', e.target.value)}
                placeholder="Cómo entrar a la propiedad, códigos, llaves..."
                rows={4}
              />
            </div>
          </>
        );

      case 'LOCATION':
        return (
          <>
            <div>
              <Label>Dirección *</Label>
              <Input
                value={data.address || ''}
                onChange={(e) => updateSectionData(index, 'address', e.target.value)}
                placeholder="Dirección completa"
              />
            </div>
            <div>
              <Label>Indicaciones para llegar (opcional)</Label>
              <Textarea
                value={data.instructions || ''}
                onChange={(e) => updateSectionData(index, 'instructions', e.target.value)}
                placeholder="Referencias, puntos de interés cercanos..."
                rows={3}
              />
            </div>
          </>
        );

      case 'HOST':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={data.name || ''}
                  onChange={(e) => updateSectionData(index, 'name', e.target.value)}
                  placeholder="Nombre del anfitrión"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={data.phone || ''}
                  onChange={(e) => updateSectionData(index, 'phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={data.email || ''}
                onChange={(e) => updateSectionData(index, 'email', e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={data.notes || ''}
                onChange={(e) => updateSectionData(index, 'notes', e.target.value)}
                placeholder="Horarios de contacto, idiomas..."
                rows={2}
              />
            </div>
          </>
        );

      case 'EMERGENCY':
        return (
          <>
            <div className="space-y-3">
              {(data.contacts || []).map((contact: any, i: number) => (
                <div key={contact.id || i} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nombre/Tipo</Label>
                      <Input
                        value={contact.name || ''}
                        onChange={(e) => updateNestedArray(index, 'contacts', i, 'name', e.target.value)}
                        placeholder="Policía, Hospital..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Teléfono</Label>
                      <Input
                        value={contact.phone || ''}
                        onChange={(e) => updateNestedArray(index, 'contacts', i, 'phone', e.target.value)}
                        placeholder="911"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(index, 'contacts', i)}
                    className="text-red-600 mt-5"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(index, 'contacts', { name: '', phone: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Contacto
            </Button>
          </>
        );

      case 'TRASH':
        return (
          <>
            <div>
              <Label>Instrucciones *</Label>
              <Textarea
                value={data.instructions || ''}
                onChange={(e) => updateSectionData(index, 'instructions', e.target.value)}
                placeholder="Dónde dejar la basura, cómo separar..."
                rows={3}
              />
            </div>
            <div>
              <Label>Horario de recolección (opcional)</Label>
              <Input
                value={data.schedule || ''}
                onChange={(e) => updateSectionData(index, 'schedule', e.target.value)}
                placeholder="Lunes y jueves por la mañana"
              />
            </div>
          </>
        );

      case 'APPLIANCES':
        return (
          <>
            <div className="space-y-3">
              {(data.items || []).map((item: any, i: number) => (
                <div key={item.id || i} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs">Electrodoméstico</Label>
                        <Input
                          value={item.name || ''}
                          onChange={(e) => updateNestedArray(index, 'items', i, 'name', e.target.value)}
                          placeholder="Lavadora, Horno, etc."
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Instrucciones</Label>
                        <Textarea
                          value={item.instructions || ''}
                          onChange={(e) => updateNestedArray(index, 'items', i, 'instructions', e.target.value)}
                          placeholder="Cómo usar este electrodoméstico..."
                          rows={2}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(index, 'items', i)}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(index, 'items', { name: '', instructions: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Electrodoméstico
            </Button>
          </>
        );

      case 'CUSTOM':
      default:
        return (
          <>
            <div>
              <Label>Título *</Label>
              <Input
                value={data.title || ''}
                onChange={(e) => updateSectionData(index, 'title', e.target.value)}
                placeholder="Título de la sección"
              />
            </div>
            <div>
              <Label>Contenido *</Label>
              <Textarea
                value={data.content || ''}
                onChange={(e) => updateSectionData(index, 'content', e.target.value)}
                placeholder="Contenido de la sección..."
                rows={4}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Importar Welcomebook con IA</h1>
        <p className="text-gray-600 mt-2">
          Sube tu documento y la IA extraerá automáticamente toda la información para crear tu welcomebook
        </p>
      </div>

      {/* Upload Section */}
      {!extractedData && (
        <Card>
          <CardHeader>
            <CardTitle>Subir Documento</CardTitle>
            <CardDescription>
              Formatos soportados: Word (.docx), Texto (.txt)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".docx,.txt"
                onChange={handleFileChange}
                disabled={isExtracting}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-12 w-12 text-blue-600 mb-3" />
                    <p className="font-medium text-blue-900">{file.name}</p>
                    <p className="text-sm text-blue-600">{(file.size / 1024).toFixed(2)} KB</p>
                    <p className="text-xs text-gray-500 mt-2">Clic para cambiar archivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="font-medium text-gray-700">Arrastra tu archivo aquí</p>
                    <p className="text-sm text-gray-500">o haz clic para seleccionar</p>
                    <p className="text-xs text-gray-400 mt-2">Word, PDF o TXT</p>
                  </div>
                )}
              </label>
            </div>

            <Button
              onClick={handleExtract}
              disabled={!file || isExtracting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analizando documento con IA...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Extraer Información
                </>
              )}
            </Button>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Asegúrate de que tu documento contenga información como: nombre de la propiedad,
                WiFi (red y contraseña), instrucciones de acceso, dirección, contacto del anfitrión, etc.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {extractedData && (
        <div className="space-y-6">
          {/* Property Name */}
          <Card className="border-t-4 border-t-green-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle>Información Extraída</CardTitle>
              </div>
              <CardDescription>
                Revisa y edita los datos antes de crear el welcomebook. Los campos con * son obligatorios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-base font-semibold">Nombre de la Propiedad</Label>
                <Input
                  value={extractedData.propertyName}
                  onChange={(e) => setExtractedData({ ...extractedData, propertyName: e.target.value })}
                  className="text-lg font-medium mt-2"
                  placeholder="Nombre de tu propiedad"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">
              Secciones Detectadas ({extractedData.sections.length})
            </h3>

            {extractedData.sections.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <FileQuestion className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No se detectaron secciones en el documento.</p>
                  <p className="text-sm text-gray-500 mt-2">Intenta con un documento más detallado.</p>
                </CardContent>
              </Card>
            ) : (
              extractedData.sections.map((section, index) => renderSectionEditor(section, index))
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleCreateWelcomebook}
              disabled={isCreating || extractedData.sections.length === 0 || !extractedData.propertyName}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando Welcomebook...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Crear Welcomebook
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setExtractedData(null);
                setFile(null);
              }}
              className="py-6"
            >
              Cancelar / Subir Otro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
