'use client';

import { useEffect, useRef } from 'react';

interface BokunWidgetProps {
  htmlCode: string;
}

export function BokunWidget({ htmlCode }: BokunWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !htmlCode) return;

    // Extract bookingChannelUUID from the script src
    const scriptMatch = htmlCode.match(/bookingChannelUUID=([a-f0-9-]+)/);
    const bookingChannelUUID = scriptMatch ? scriptMatch[1] : null;

    // Extract widget data-src from the div
    const widgetMatch = htmlCode.match(/data-src="([^"]+)"/);
    const widgetSrc = widgetMatch ? widgetMatch[1] : null;

    if (!bookingChannelUUID || !widgetSrc) {
      console.error('Could not extract Bokun widget parameters from HTML code');
      containerRef.current.innerHTML = htmlCode;
      return;
    }

    // Function to initialize the widget
    const initializeWidget = () => {
      if (!containerRef.current) return;

      // Clear container
      containerRef.current.innerHTML = '';

      // Create widget div
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'bokunWidget';
      widgetDiv.setAttribute('data-src', widgetSrc);
      containerRef.current.appendChild(widgetDiv);

      // Create noscript fallback
      const noscript = document.createElement('noscript');
      noscript.textContent = 'Please enable javascript in your browser to book';
      containerRef.current.appendChild(noscript);

      // Trigger Bokun widget initialization if loader is available
      if (typeof (window as any).BokunWidgets !== 'undefined') {
        try {
          (window as any).BokunWidgets.reload();
        } catch (error) {
          console.error('Error reloading Bokun widgets:', error);
        }
      }
    };

    // Check if script is already loaded
    const existingScript = document.querySelector(
      `script[src*="BokunWidgetsLoader.js"][src*="${bookingChannelUUID}"]`
    );

    if (existingScript && !scriptLoadedRef.current) {
      // Script exists, just initialize
      scriptLoadedRef.current = true;
      initializeWidget();
      return;
    }

    if (scriptLoadedRef.current) {
      // Already loaded in this component, just reinitialize
      initializeWidget();
      return;
    }

    // Load the Bokun script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=${bookingChannelUUID}`;
    script.async = true;

    script.onload = () => {
      scriptLoadedRef.current = true;
      // Wait a bit for Bokun to initialize
      setTimeout(() => {
        initializeWidget();
      }, 500);
    };

    script.onerror = () => {
      console.error('Failed to load Bokun widget script');
      // Fallback to dangerouslySetInnerHTML
      if (containerRef.current) {
        containerRef.current.innerHTML = htmlCode;
      }
    };

    // Append script to document head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Don't remove the script on unmount to allow other widgets to use it
      // Just clean up the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [htmlCode]);

  return (
    <div
      ref={containerRef}
      className="bokun-widget-container w-full"
      style={{ minHeight: '400px' }}
    />
  );
}
