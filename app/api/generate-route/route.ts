import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Definición del grafo del supermercado
interface Node {
  id: number;
  x: number;
  y: number;
  name: string;
  connections: number[];
}

const graph: Record<number, Node> = {
  1: { id: 1, x: 5.5, y: 17.3, name: "Entry", connections: [101] },
  2: { id: 2, x: 35.5, y: 17.3, name: "Seafood", connections: [102, 103] },
  3: { id: 3, x: 74, y: 17.3, name: "Frozen Food & Meat", connections: [104, 105] },
  4: { id: 4, x: 14.5, y: 34, name: "Health", connections: [101, 201, 106] },
  5: { id: 5, x: 28.5, y: 34, name: "Cosmetics", connections: [102, 107] },
  6: { id: 6, x: 42.5, y: 34, name: "Paper & Cleaning", connections: [103, 108] },
  7: { id: 7, x: 57, y: 33, name: "Kitchen Items", connections: [104, 8, 109] },
  8: { id: 8, x: 74, y: 33, name: "Fruit", connections: [7, 9] },
  9: { id: 9, x: 92, y: 33, name: "Dairy", connections: [105, 8, 110] },
  10: { id: 10, x: 74, y: 49.25, name: "Vegetables", connections: [109, 110] },
  11: { id: 11, x: 14.5, y: 66, name: "Juices", connections: [106, 203, 111] },
  12: { id: 12, x: 28.5, y: 66, name: "Water & Beer", connections: [107, 112] },
  13: { id: 13, x: 42.5, y: 66, name: "Wine & Candy", connections: [108, 113] },
  14: { id: 14, x: 57, y: 65, name: "Snacks", connections: [109, 114] },
  15: { id: 15, x: 74, y: 65, name: "Condiments & Oils", connections: [14, 16] },
  16: { id: 16, x: 92, y: 65, name: "Canned", connections: [110, 15, 115] },
  17: { id: 17, x: 35.5, y: 82, name: "Soft Drinks", connections: [112, 113] },
  18: { id: 18, x: 74, y: 82, name: "Pasta & Bakery", connections: [114, 115] },
  101: { id: 101, x: 14.5, y: 17.3, name: "Point1", connections: [1, 4, 102] },
  102: { id: 102, x: 28.5, y: 17.3, name: "Point2", connections: [101, 5, 2] },
  103: { id: 103, x: 42.5, y: 17.3, name: "Point3", connections: [2, 6, 104] },
  104: { id: 104, x: 57, y: 17.3, name: "Point4", connections: [103, 7, 3] },
  105: { id: 105, x: 92, y: 17.3, name: "Point5", connections: [3, 9] },
  106: { id: 106, x: 14.5, y: 49.25, name: "Point6", connections: [4, 202, 107, 11] },
  107: { id: 107, x: 28.5, y: 49.25, name: "Point7", connections: [5, 106, 108, 12] },
  108: { id: 108, x: 42.5, y: 49.25, name: "Point8", connections: [6, 107, 109, 13] },
  109: { id: 109, x: 57, y: 49.25, name: "Point9", connections: [7, 108, 10, 14] },
  110: { id: 110, x: 92, y: 49.25, name: "Point10", connections: [9, 10, 16] },
  111: { id: 111, x: 14.5, y: 82, name: "Point11", connections: [11, 204, 112] },
  112: { id: 112, x: 28.5, y: 82, name: "Point12", connections: [12, 111, 17] },
  113: { id: 113, x: 42.5, y: 82, name: "Point13", connections: [13, 17, 114] },
  114: { id: 114, x: 57, y: 82, name: "Point14", connections: [14, 113, 18] },
  115: { id: 115, x: 92, y: 82, name: "Point15", connections: [16, 18] },
  201: { id: 201, x: 7, y: 34, name: "EXIT1", connections: [4] },
  202: { id: 202, x: 7, y: 49.25, name: "EXIT2", connections: [106] },
  203: { id: 203, x: 7, y: 66, name: "EXIT3", connections: [11] },
  204: { id: 204, x: 7, y: 82, name: "EXIT4", connections: [111] },
};

// Mapa de productos a zonas
const productToZone: Record<string, number> = {
  // Health
  "vitamins": 4, "medicine": 4, "health": 4, "vitaminas": 4, "medicina": 4,
  // Cosmetics
  "cosmetics": 5, "shampoo": 5, "soap": 5, "personal care": 5, "jabón": 5, "champú": 5,
  // Paper & Cleaning
  "paper": 6, "cleaning": 6, "towels": 6, "papel": 6, "limpieza": 6, "toallas": 6,
  // Kitchen
  "kitchen": 7, "pots": 7, "pans": 7, "cocina": 7, "ollas": 7, "sartenes": 7,
  // Fruit
  "fruit": 8, "apples": 8, "bananas": 8, "apple": 8, "banana": 8, "plátanos": 8, "plátano": 8, "manzanas": 8, "manzana": 8, "frutas": 8,
  // Dairy
  "milk": 9, "cheese": 9, "yogurt": 9, "dairy": 9, "leche": 9, "queso": 9, "yogur": 9,
  // Vegetables
  "vegetables": 10, "lettuce": 10, "tomatoes": 10, "tomato": 10, "verduras": 10, "lechuga": 10, "tomates": 10, "tomate": 10, "zanahorias": 10, "zanahoria": 10,
  // Juices
  "juice": 11, "juices": 11, "orange juice": 11, "jugo": 11, "jugos": 11,
  // Water & Beer
  "water": 12, "beer": 12, "alcohol": 12, "agua": 12, "cerveza": 12,
  // Wine & Candy
  "wine": 13, "candy": 13, "chocolate": 13, "vino": 13, "dulces": 13,
  // Snacks
  "snacks": 14, "chips": 14, "crackers": 14, "botanas": 14, "papas": 14,
  // Condiments & Oils
  "oil": 15, "vinegar": 15, "condiments": 15, "sauce": 15, "sauces": 15, "aceite": 15, "vinagre": 15, "salsa": 15, "salsas": 15,
  // Canned
  "canned": 16, "beans": 16, "soup": 16, "enlatados": 16, "frijoles": 16, "sopa": 16,
  // Soft Drinks
  "soda": 17, "cola": 17, "soft drinks": 17, "refresco": 17, "refrescos": 17,
  // Pasta & Bakery
  "pasta": 18, "bread": 18, "bakery": 18, "pan": 18, "panadería": 18, "tortillas": 18, "arroz": 18,
  // Seafood
  "seafood": 2, "fish": 2, "pescado": 2, "mariscos": 2,
  // Frozen & Meat
  "frozen": 3, "meat": 3, "chicken": 3, "beef": 3, "congelados": 3, "carne": 3, "pollo": 3, "res": 3, "huevos": 3, "huevo": 3,
  // Coffee
  "coffee": 12, "café": 12,
};

// Algoritmo de Dijkstra para encontrar el camino más corto
function dijkstra(start: number, end: number): number[] {
  const distances: Record<number, number> = {};
  const previous: Record<number, number | null> = {};
  const unvisited = new Set<number>();

  // Inicializar
  for (const nodeId in graph) {
    const id = parseInt(nodeId);
    distances[id] = Infinity;
    previous[id] = null;
    unvisited.add(id);
  }
  distances[start] = 0;

  while (unvisited.size > 0) {
    // Encontrar nodo no visitado con menor distancia
    let current = -1;
    let minDist = Infinity;
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDist) {
        minDist = distances[nodeId];
        current = nodeId;
      }
    }

    if (current === -1 || current === end) break;

    unvisited.delete(current);

    // Actualizar distancias de vecinos
    const currentNode = graph[current];
    for (const neighbor of currentNode.connections) {
      if (!unvisited.has(neighbor)) continue;

      const neighborNode = graph[neighbor];
      const dx = currentNode.x - neighborNode.x;
      const dy = currentNode.y - neighborNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const alt = distances[current] + distance;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }
  }

  // Reconstruir camino
  const path: number[] = [];
  let current: number | null = end;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return path.length > 0 && path[0] === start ? path : [];
}

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    console.log("API Key present:", !!process.env.OPENAI_API_KEY);
    console.log("API Key starts with:", process.env.OPENAI_API_KEY?.substring(0, 10));

    console.log("API Key starts with:", process.env.OPENAI_API_KEY?.substring(0, 10));

    // Mapear items a zonas
    const itemMapping: Array<{ item: string; zone: number; zoneName: string }> = [];
    for (const item of items) {
      const itemLower = item.toLowerCase().trim();
      let zoneId = 1; // Default a Entry
      
      // Buscar coincidencia en productToZone
      for (const [key, value] of Object.entries(productToZone)) {
        if (itemLower.includes(key)) {
          zoneId = value;
          break;
        }
      }
      
      itemMapping.push({
        item,
        zone: zoneId,
        zoneName: graph[zoneId].name,
      });
    }

    // Usar OpenAI solo para ordenar las zonas por distancia óptima
    const uniqueZones = [...new Set(itemMapping.map(m => m.zone))];
    
    // Si solo hay Entry (zona 1), no hay productos
    if (uniqueZones.length === 1 && uniqueZones[0] === 1) {
      return NextResponse.json({
        route: [{ x: graph[1].x, y: graph[1].y, zone: `1.${graph[1].name}` }],
        stops: [1],
        itemMapping: [],
      });
    }

    const prompt = `
You are a route optimizer. Given these product zones in a supermarket, determine the most efficient order to visit them to minimize walking distance.

ZONES TO VISIT: ${uniqueZones.map(z => `${z} (${graph[z].name} at x:${graph[z].x}, y:${graph[z].y})`).join(", ")}

START: Zone 1 (Entry at x:5.5, y:17.3)

Consider:
- Start at zone 1
- Minimize backtracking
- Visit nearby zones in sequence
- Euclidean distance between points

Return ONLY a JSON array of zone IDs in optimal visit order, starting with 1:
{"order": [1, ...]}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a route optimizer." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    const aiResult = JSON.parse(content);
    const orderedZones: number[] = aiResult.order || [1, ...uniqueZones];

    // Encontrar la salida más cercana al último punto de interés
    const lastZone = orderedZones[orderedZones.length - 1];
    const lastNode = graph[lastZone];
    
    const exits = [201, 202, 203, 204];
    let nearestExit = 201;
    let minDistance = Infinity;
    
    for (const exitId of exits) {
      const exitNode = graph[exitId];
      const dx = lastNode.x - exitNode.x;
      const dy = lastNode.y - exitNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestExit = exitId;
      }
    }
    
    // Agregar la salida más cercana al final
    orderedZones.push(nearestExit);

    // Construir la ruta completa usando Dijkstra entre cada par de zonas
    const fullPath: number[] = [];
    for (let i = 0; i < orderedZones.length - 1; i++) {
      const from = orderedZones[i];
      const to = orderedZones[i + 1];
      const segment = dijkstra(from, to);
      
      if (segment.length === 0) {
        console.error(`No path found from ${from} to ${to}`);
        continue;
      }

      // Agregar el segmento, evitando duplicar el nodo de conexión
      if (fullPath.length === 0) {
        fullPath.push(...segment);
      } else {
        fullPath.push(...segment.slice(1));
      }
    }

    // Convertir los IDs de nodos a puntos con coordenadas
    const route = fullPath.map(nodeId => ({
      x: graph[nodeId].x,
      y: graph[nodeId].y,
      zone: `${nodeId}.${graph[nodeId].name}`,
    }));

    // Identificar las paradas (zonas de productos, no puntos de navegación)
    const stops = orderedZones.filter(z => z < 100 || z > 200);

    return NextResponse.json({
      route,
      stops,
      itemMapping: itemMapping.map(m => ({
        item: m.item,
        zone: `${m.zone}.${m.zoneName}`,
      })),
    });
  } catch (error) {
    console.error("Full error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ 
      error: "Error generating route",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
