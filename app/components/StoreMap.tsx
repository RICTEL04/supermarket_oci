"use client";

import React, { useState, useEffect } from "react";

interface RoutePoint {
  x: number; 
  y: number; 
  zone: string;
}

interface StoreMapProps {
  externalProductList?: string[];
  externalRouteData?: any;
  showAllZones?: boolean;
}

export function StoreMap({ externalProductList, externalRouteData, showAllZones = false }: StoreMapProps) {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [stops, setStops] = useState<number[]>([]);

  // Actualizar cuando lleguen datos externos del asistente de voz
  useEffect(() => {
    if (externalRouteData) {
      if (externalRouteData.route) {
        setRoutePoints(externalRouteData.route);
      }
      if (externalRouteData.stops) {
        setStops(externalRouteData.stops);
      }
    }
  }, [externalRouteData]);

  // Todas las zonas del supermercado con sus coordenadas
  const allZones: RoutePoint[] = [
    { x: 5.5, y: 17.3, zone: "1.Entry: 101" },
    { x: 35.5, y: 17.3, zone: "2.Seafood: 102-103" },
    { x: 74, y: 17.3, zone: "3.Frozen Food & Meat: 104-105" },
    { x: 14.5, y: 34, zone: "4.Health: 101-201-106" },
    { x: 28.5, y: 34, zone: "5.Cosmetics & Personal care: 102-107" },
    { x: 42.5, y: 34, zone: "6.Paper & Cleaning: 103-108" },
    { x: 57, y: 33, zone: "7.Kitchen Items: 104-8-109" },
    { x: 74, y: 33, zone: "8.Fruit: 7-9" },
    { x: 92, y: 33, zone: "9.Dairy: 105-8-110" },
    { x: 74, y: 49.25, zone: "10.Vegetables: 109-110" },
    { x: 14.5, y: 66, zone: "11.Juices: 106-203-111" },
    { x: 28.5, y: 66, zone: "12.Water & Beer: 107-112" },
    { x: 42.5, y: 66, zone: "13.Wine & Candy: 108-113" },
    { x: 57, y: 65, zone: "14.Snacks: 109-114" },
    { x: 74, y: 65, zone: "15.Condiments & Oils: 14-16" },
    { x: 92, y: 65, zone: "16.Canned: 110-15-115" },
    { x: 35.5, y: 82, zone: "17.Soft Drinks: 112-113" },
    { x: 74, y: 82, zone: "18.Pasta & Bakery: 114-115" },
  ];

  // Puntos de navegación (pasillos y conexiones)
  const navigationPoints: RoutePoint[] = [
    { x: 14.5, y: 17.3, zone: "101.Point1: 1-4-102" },
    { x: 28.5, y: 17.3, zone: "102.Point2: 101-5-2" },
    { x: 42.5, y: 17.3, zone: "103.Point3: 2-6-104" },
    { x: 57, y: 17.3, zone: "104.Point4: 103-7-3" },
    { x: 92, y: 17.3, zone: "105.Point5: 3-9" },
    { x: 14.5, y: 49.25, zone: "106.Point6: 4-202-107-11" },
    { x: 28.5, y: 49.25, zone: "107.Point7: 5-106-108-12" },
    { x: 42.5, y: 49.25, zone: "108.Point8: 6-107-109-13" },
    { x: 57, y: 49.25, zone: "109.Point9: 7-108-10-14" },
    { x: 92, y: 49.25, zone: "110.Point10: 9-10-16" },
    { x: 14.5, y: 82, zone: "111.Point11: 11-204-112" },
    { x: 28.5, y: 82, zone: "112.Point12: 12-111-17" },
    { x: 42.5, y: 82, zone: "113.Point13: 13-17-114" },
    { x: 57, y: 82, zone: "114.Point14: 14-113-18" },
    { x: 92, y: 82, zone: "115.Point15: 15-18" },
    { x: 7, y: 34, zone: "201.EXIT1: 4" },
    { x: 7, y: 49.25, zone: "202.EXIT2: 106" },
    { x: 7, y: 66, zone: "203.EXIT3: 11" },
    { x: 7, y: 82, zone: "204.EXIT4: 111" },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-inner p-4 border-2 border-blue-200">

      {/* ------------------------------- */}
      {/*        MAPA CON RUTA            */}
      {/* ------------------------------- */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border-4 border-blue-300 bg-white shadow-lg">

        {/* Imagen base */}
        <img
          src="/supermarket.png"
          alt="Supermarket Map"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* SVG para rutas */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ zIndex: 20 }}
        >
          {/* Línea de ruta continua */}
          {routePoints.length > 1 && (
            <>
              {/* Línea principal de la ruta - más gruesa y visible */}
              <path
                d={`M ${routePoints
                  .map((p) => `${p.x}, ${p.y}`)
                  .join(" L ")}`}
                stroke="#2563eb"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              {/* Línea animada encima - más brillante */}
              <path
                d={`M ${routePoints
                  .map((p) => `${p.x}, ${p.y}`)
                  .join(" L ")}`}
                stroke="#60a5fa"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 2"
                className="animate-pulse"
              />
            </>
          )}

          {/* Mostrar todas las zonas */}
          {showAllZones && allZones.map((point, index) => (
            <g key={`zone-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="1"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="0.5"
                opacity="0.7"
              />
              <text
                x={point.x}
                y={point.y - 2}
                fill="#1e40af"
                fontSize="2.5"
                fontWeight="bold"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {point.zone}
              </text>
            </g>
          ))}

          {/* Mostrar puntos de navegación */}
          {showAllZones && navigationPoints.map((point, index) => (
            <g key={`nav-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="0.8"
                fill="#f59e0b"
                stroke="white"
                strokeWidth="0.3"
                opacity="0.6"
              />
              <text
                x={point.x}
                y={point.y - 1.5}
                fill="#92400e"
                fontSize="2"
                fontWeight="normal"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {point.zone}
              </text>
            </g>
          ))}

          {/* Marcadores solo en inicio y fin */}
          {routePoints.length > 0 && (
            <>
              {/* Marcador de inicio (verde) */}
              <circle
                cx={routePoints[0].x}
                cy={routePoints[0].y}
                r="2"
                fill="#22c55e"
                stroke="white"
                strokeWidth="0.5"
              />
              <text
                x={routePoints[0].x}
                y={routePoints[0].y}
                fill="white"
                fontSize="3"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                A
              </text>
              
              {/* Marcador de fin (rojo) */}
              {routePoints.length > 1 && (
                <>
                  <circle
                    cx={routePoints[routePoints.length - 1].x}
                    cy={routePoints[routePoints.length - 1].y}
                    r="2"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  <text
                    x={routePoints[routePoints.length - 1].x}
                    y={routePoints[routePoints.length - 1].y}
                    fill="white"
                    fontSize="3"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    B
                  </text>
                </>
              )}
            </>
          )}

          {/* Marcadores numerados para cada parada */}
          {stops.map((stopId, index) => {
            const point = routePoints.find(p => p.zone.startsWith(`${stopId}.`));
            if (!point) return null;
            
            return (
              <g key={`stop-${stopId}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="2.5"
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth="0.6"
                />
                <text
                  x={point.x}
                  y={point.y}
                  fill="white"
                  fontSize="3"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
