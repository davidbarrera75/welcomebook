
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { WelcomebookWithSections } from '@/lib/types';
import { SECTION_METADATA, sectionHasData } from '@/lib/section-types';
import { getTranslation, type Language } from '@/lib/translations';
import {
  Wifi, Key, MapPin, User, Trash, Globe, Calendar, Phone, Zap, FileText,
  Languages, Copy, Check
} from 'lucide-react';
import { BokunWidget } from '@/components/public/bokun-widget';

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
};

interface WelcomebookPublicViewProps {
  welcomebook: WelcomebookWithSections;
}

export function WelcomebookPublicView({ welcomebook }: WelcomebookPublicViewProps) {
  const [language, setLanguage] = useState<Language>('es');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const t = getTranslation(language);

  // Filter sections that have data
  const sectionsWithData = welcomebook.sections.filter(section => 
    sectionHasData(section.type as any, section.data)
  );

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getSectionTitle = (section: any) => {
    // Use custom title if provided
    if (section.customTitle && section.customTitle.trim()) {
      return section.customTitle;
    }
    
    // Otherwise use default translation
    const titles: Record<string, string> = {
      'WIFI': t.sections.wifi,
      'ACCESS': t.sections.access,
      'LOCATION': t.sections.location,
      'HOST': t.sections.host,
      'TRASH': t.sections.trash,
      'MAPS360': t.sections.maps360,
      'WIDGET': t.sections.widget,
      'EMERGENCY': t.sections.emergency,
      'APPLIANCES': t.sections.appliances,
      'PLACES': t.sections.places,
      'CUSTOM': t.sections.custom,
    };
    return titles[section.type] || section.type;
  };

  const renderSection = (section: any, index: number) => {
    const metadata = SECTION_METADATA[section.type as keyof typeof SECTION_METADATA];
    const Icon = SECTION_ICONS[section.type as keyof typeof SECTION_ICONS];

    if (!metadata || !sectionHasData(section.type, section.data)) {
      return null;
    }

    return (
      <AccordionItem key={section.id} value={`section-${index}`} className="border rounded-lg mb-4 bg-white">
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <div className="flex items-center space-x-3">
            <Icon className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">{getSectionTitle(section)}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          {renderSectionContent(section)}
        </AccordionContent>
      </AccordionItem>
    );
  };

  const renderSectionContent = (section: any) => {
    const { type, data } = section;
      const sectionData = language === "en" && section.dataEn && Object.keys(section.dataEn).length > 0
        ? section.dataEn
        : data;

    switch (type) {
      case 'WIFI':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">{t.fields.wifiNetwork}</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono">
                    {sectionData.networkName}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(data.networkName, 'network')}
                  >
                    {copiedText === 'network' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">{t.fields.wifiPassword}</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono">
                    {sectionData.password}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(data.password, 'password')}
                  >
                    {copiedText === 'password' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {data.notes && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800">{sectionData.notes}</p>
              </div>
            )}
          </div>
        );

      case 'ACCESS':
        return (
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {sectionData.instructions}
              </p>
            </div>
          </div>
        );

      case 'LOCATION':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">{t.fields.address}</label>
              <p className="text-lg text-gray-900 mt-1">{sectionData.address}</p>
            </div>
            {data.instructions && (
              <div>
                <label className="text-sm font-medium text-gray-600">{t.fields.directions}</label>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{sectionData.instructions}</p>
              </div>
            )}
          </div>
        );

      case 'HOST':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{sectionData.name}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  {data.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a 
                        href={`tel:${sectionData.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {sectionData.phone}
                      </a>
                    </div>
                  )}
                  {data.email && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">@</span>
                      <a 
                        href={`mailto:${sectionData.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {sectionData.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {data.notes && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{sectionData.notes}</p>
              </div>
            )}
          </div>
        );

      case 'TRASH':
        return (
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {sectionData.instructions}
              </p>
            </div>
            {data.schedule && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <label className="text-sm font-medium text-green-800">{t.fields.schedule}</label>
                <p className="text-green-700 mt-1">{sectionData.schedule}</p>
              </div>
            )}
          </div>
        );

      case 'MAPS360':
        return (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={sectionData.embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                title={sectionData.title}
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        );

      case 'WIDGET':
        return (
          <div className="space-y-4">
            <BokunWidget htmlCode={sectionData.htmlCode} />
          </div>
        );

      case 'EMERGENCY':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionData.contacts?.map((contact: any) => (
                <div key={contact.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900">{contact.name}</h3>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="text-red-700 hover:text-red-900 font-mono text-lg"
                  >
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        );

      case 'APPLIANCES':
        return (
          <div className="space-y-6">
            {sectionData.items?.map((item: any) => (
              <div key={item.id} className="p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.name}</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {item.instructions}
                </p>
              </div>
            ))}
          </div>
        );

      case 'PLACES':
        return (
          <div className="space-y-6">
            {sectionData.places?.map((place: any) => (
              <div key={place.id} className="p-6 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{place.name}</h3>
                  <Badge variant="secondary">{place.category}</Badge>
                </div>
                {place.address && (
                  <p className="text-gray-600 mb-2">📍 {place.address}</p>
                )}
                {place.notes && (
                  <p className="text-gray-700 whitespace-pre-wrap">{place.notes}</p>
                )}
              </div>
            ))}
          </div>
        );

      case 'CUSTOM':
        return (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {sectionData.content}
              </p>
            </div>

            {/* Media Gallery */}
            {section.media && section.media.length > 0 && (
              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.media.map((media: any) => (
                    <div key={media.id} className="rounded-lg overflow-hidden shadow-md">
                      {media.type === 'PHOTO' ? (
                        <img
                          src={media.url}
                          alt={media.filename}
                          className="w-full h-64 object-cover"
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="w-full h-64 object-cover"
                          controls
                          playsInline
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>{t.fields.unavailable}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {welcomebook.propertyName}
              </h1>
              <p className="text-gray-600 mt-1">
                {t.public.header.welcome}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={language === 'es' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('es')}
              >
                ES
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                EN
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sectionsWithData.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <FileText className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t.public.empty.title}
              </h3>
              <p className="text-gray-600">
                {t.public.empty.description}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="w-full">
            {sectionsWithData.map((section, index) => renderSection(section, index))}
          </Accordion>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>{t.public.header.poweredBy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
