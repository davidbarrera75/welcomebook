'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SectionManager } from '@/components/admin/section-manager';
import { SectionWithMedia } from '@/lib/types';
import { Info, Layers, ExternalLink, Calendar, Hash, Link2, ArrowLeft } from 'lucide-react';

interface WelcomebookEditorProps {
  welcomebook: {
    id: string;
    propertyName: string;
    slug: string;
    createdAt: string;
    sections: SectionWithMedia[];
  };
}

export function WelcomebookEditor({ welcomebook }: WelcomebookEditorProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'sections'>('info');

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
      {/* HEADER */}
      <div className="mb-6">
        {/* Botón Volver */}
        <Link href="/admin">
          <Button
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a mis Welcomebooks
          </Button>
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Editor de Welcomebook
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Gestiona la información y secciones de tu welcomebook
        </p>
      </div>

      {/* TABS - Mejorados con mejor contraste y responsive */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
        <Button
          variant={activeTab === 'info' ? 'default' : 'outline'}
          className={`
            flex-1 h-auto py-3 sm:py-2.5
            ${activeTab === 'info'
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-blue-400'
            }
            transition-all duration-200
          `}
          onClick={() => setActiveTab('info')}
        >
          <Info className="w-4 h-4 mr-2" />
          <span className="font-medium">Información básica</span>
        </Button>
        <Button
          variant={activeTab === 'sections' ? 'default' : 'outline'}
          className={`
            flex-1 h-auto py-3 sm:py-2.5
            ${activeTab === 'sections'
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-blue-400'
            }
            transition-all duration-200
          `}
          onClick={() => setActiveTab('sections')}
        >
          <Layers className="w-4 h-4 mr-2" />
          <span className="font-medium">Ver y agregar secciones</span>
        </Button>
      </div>

      {/* PESTAÑA INFO - Rediseñada */}
      {activeTab === 'info' && (
        <div className="space-y-4 md:space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Información del Welcomebook
              </CardTitle>
              <CardDescription className="text-sm">
                Detalles generales de tu welcomebook
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid gap-4 md:gap-5">
                {/* Propiedad */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Hash className="w-4 h-4 text-gray-500" />
                    Propiedad
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-base font-medium text-gray-900">{welcomebook.propertyName}</p>
                  </div>
                </div>

                {/* Slug / URL */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Link2 className="w-4 h-4 text-gray-500" />
                    Slug / URL
                  </label>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-gray-600 mb-1">
                      https://digitra.welcomebook.store/
                    </p>
                    <p className="text-base font-mono font-bold text-blue-700">
                      {welcomebook.slug}
                    </p>
                  </div>
                </div>

                {/* Fecha de creación */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Fecha de creación
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-base font-medium text-gray-900">
                      {new Date(welcomebook.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Total de secciones */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Layers className="w-4 h-4 text-gray-500" />
                    Total de secciones
                  </label>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-3">
                    <p className="text-2xl font-bold text-green-700">
                      {welcomebook.sections.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card className="shadow-sm border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
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
                  href={`/${welcomebook.slug}`}
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
      )}

      {/* PESTAÑA SECCIONES */}
      {activeTab === 'sections' && (
        <SectionManager
          welcomebookId={welcomebook.id}
          slug={welcomebook.slug}
          sections={welcomebook.sections}
        />
      )}
    </div>
  );
}
