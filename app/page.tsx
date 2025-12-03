'use client'
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, ChevronDown, ChevronUp, Keyboard, Plus, X as XIcon, MapPin } from 'lucide-react';
import { StoreMap } from './components/StoreMap';
import { CameraView } from './components/CameraView';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [productList, setProductList] = useState<string[]>([]);
  const [routeData, setRouteData] = useState<any>(null);
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [hasIntroduced, setHasIntroduced] = useState(false);
  const [isInShoppingProcess, setIsInShoppingProcess] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text'>('voice'); // 'voice' or 'text'
  const [textInput, setTextInput] = useState('');
  const [showAllZones, setShowAllZones] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isSpeakingRef = useRef(false);
  const waitingForConfirmationRef = useRef(false);
  const pendingProductsRef = useRef<string[]>([]);
  const routeDataRef = useRef<any>(null);
  const currentZoneIndexRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // Cargar voces de forma asíncrona (necesario en algunos navegadores móviles)
      const loadVoices = () => {
        if (synthRef.current) {
          const voices = synthRef.current.getVoices();
          console.log('🎙️ Voices loaded:', voices.length);
          if (voices.length > 0) {
            console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`).join(', '));
          }
        }
      };
      
      // Las voces pueden no estar disponibles inmediatamente
      loadVoices();
      
      // En algunos navegadores, las voces se cargan de forma asíncrona
      if (synthRef.current && 'onvoiceschanged' in synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
      
      // Prevenir selección de texto en móviles
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      (document.body.style as any).webkitTouchCallout = 'none';
      
      // Inicializar reconocimiento de voz con soporte para múltiples navegadores
      const SpeechRecognition = (window as any).SpeechRecognition || 
                                (window as any).webkitSpeechRecognition || 
                                (window as any).mozSpeechRecognition || 
                                (window as any).msSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Changed to false for push-to-talk
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          console.log('✅ Recognition started - listening now');
        };

        recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const text = event.results[last][0].transcript.toLowerCase().trim();
          
          console.log('🎤 RAW HEARD:', text);
          console.log('📊 State check - isSpeaking:', isSpeakingRef.current, 'waitingForConfirmation:', waitingForConfirmationRef.current);
          
          // Ignorar si el asistente está hablando
          if (isSpeakingRef.current) {
            console.log('🔇 Ignored (assistant speaking):', text);
            return;
          }
          
          console.log('✅ Processing command:', text);
          setTranscript(text);
          handleVoiceCommand(text);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          if (event.error === 'aborted') {
            return;
          }
          
          if (event.error === 'no-speech') {
            console.log('No speech detected');
            speak('I did not hear anything. Please try again.');
          } else if (event.error === 'audio-capture') {
            speak('No microphone detected. Please check permissions.');
          } else if (event.error === 'not-allowed') {
            speak('Microphone permission denied. Please allow microphone access.');
          }
          
          setIsListening(false);
        };

        recognition.onend = () => {
          console.log('Recognition ended');
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        console.error('Speech recognition not supported');
        alert('⚠️ Voice recognition is not supported in this browser.\n\nPlease use:\n• Chrome (Desktop/Mobile)\n• Microsoft Edge\n• Safari (iOS)\n\nFor the best experience, we recommend Microsoft Edge or Chrome.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Error stopping recognition on cleanup:', error);
        }
      }
      // Restaurar selección de texto al desmontar
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      (document.body.style as any).webkitTouchCallout = '';
    };
  }, []);

  // Introducción de OCI al cargar la página
  useEffect(() => {
    // En móviles, la síntesis de voz requiere una interacción del usuario primero
    // Por eso esperamos a que el usuario toque la pantalla
    const initSpeech = () => {
      if (synthRef.current && !hasIntroduced) {
        // "Despertar" el speech synthesis con un utterance silencioso
        const silentUtterance = new SpeechSynthesisUtterance('');
        synthRef.current.speak(silentUtterance);
        
        setTimeout(() => {
          const introduction = "Hello, I am Oci, your voice assistant for supermarket shopping. To begin, press and hold the large blue button, then say I need followed by your products, for example, I need milk and bread. Release the button when finished speaking. If you need help or want to know the available commands, just ask me.";
          speak(introduction, () => {
            setHasIntroduced(true);
          });
        }, 500);
      }
    };
    
    // Intentar reproducir automáticamente (funciona en desktop)
    const timer = setTimeout(() => {
      initSpeech();
    }, 1500);
    
    // En móviles, esperar a la primera interacción del usuario
    const handleFirstInteraction = () => {
      if (!hasIntroduced) {
        setAudioReady(true);
        initSpeech();
        // Remover el listener después de la primera interacción
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('click', handleFirstInteraction);
      }
    };
    
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('click', handleFirstInteraction, { once: true });
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, [hasIntroduced]);

  const speak = (text: string, callback?: () => void) => {
    if (!synthRef.current) {
      console.error('❌ Speech synthesis not available');
      if (callback) callback();
      return;
    }

    // Marcar que está hablando y detener reconocimiento
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('🔇 Recognition stopped - assistant speaking');
      } catch (e) {
        // Ignore
      }
    }

    // Cancelar cualquier speech anterior
    synthRef.current.cancel();
    
    // Pequeña pausa para asegurar que se canceló
    setTimeout(() => {
      if (!synthRef.current) return;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1; // Volumen máximo
      
      // En móviles, especialmente iOS, es importante seleccionar una voz
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        // Buscar una voz en inglés, preferiblemente nativa
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.localService
        ) || voices.find(voice => 
          voice.lang.startsWith('en')
        ) || voices[0];
        
        utterance.voice = englishVoice;
        console.log('🔊 Using voice:', englishVoice.name);
      }
      
      utterance.onstart = () => {
        console.log('🔊 Started speaking:', text.substring(0, 50));
      };
      
      utterance.onend = () => {
        console.log('🔇 Finished speaking');
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        
        if (callback) {
          callback();
        }
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        
        if (callback) {
          callback();
        }
      };
      
      console.log('🗣️ Speaking:', text.substring(0, 100) + '...');
      synthRef.current.speak(utterance);
      
      // Workaround para iOS - a veces necesita un "resume" para activarse
      if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        setTimeout(() => {
          if (synthRef.current && synthRef.current.paused) {
            synthRef.current.resume();
          }
        }, 100);
      }
    }, 100);
  };

  const handleVoiceCommand = async (command: string) => {
    console.log('📞 handleVoiceCommand called with:', command);
    console.log('Current state - waitingForConfirmation:', waitingForConfirmationRef.current, 'isSpeaking:', isSpeakingRef.current);
    
    // Control de cámara - PRIORIDAD MÁXIMA
    if (command.toLowerCase().includes('prender cámara') || 
        command.toLowerCase().includes('encender cámara') ||
        command.toLowerCase().includes('abrir cámara') ||
        command.toLowerCase().includes('turn on camera') ||
        command.toLowerCase().includes('open camera') ||
        command.toLowerCase().includes('camera on')) {
      console.log('📷 Opening camera');
      setIsCameraOpen(true);
      speak('Opening front camera.');
      return;
    }

    if (command.toLowerCase().includes('apagar cámara') || 
        command.toLowerCase().includes('cerrar cámara') ||
        command.toLowerCase().includes('turn off camera') ||
        command.toLowerCase().includes('close camera') ||
        command.toLowerCase().includes('camera off') ||
        command.toLowerCase().includes('turnoff') ||
        command.toLowerCase().includes('turn of') ||
        command.toLowerCase().includes('stop camera') ||
        command.toLowerCase().includes('off camera')) {
      console.log('📷 Closing camera - Command detected:', command);
      setIsCameraOpen(false);
      speak('Turning off camera.');
      return;
    }
    
    // Finalizar compra - mensaje final
    if (command.toLowerCase().includes('thank you') || 
        command.toLowerCase().includes('thanks') ||
        command.toLowerCase().includes('gracias') ||
        command.toLowerCase().includes('muchas gracias')) {
      console.log('✅ Shopping finished - thank you');
      speak('You are welcome! Have a great day. Press and hold to start a new search.', () => {
        setProductList([]);
        setRouteData(null);
        routeDataRef.current = null;
        setConversationHistory([]);
        setWaitingForConfirmation(false);
        waitingForConfirmationRef.current = false;
        pendingProductsRef.current = [];
        setIsInShoppingProcess(false);
        setNavigationStarted(false);
        setCurrentZoneIndex(0);
        currentZoneIndexRef.current = 0;
        setHasIntroduced(false); // Resetear para que la introducción se repita en la próxima compra
      });
      return;
    }
 
    // Si está esperando confirmación
    if (waitingForConfirmationRef.current) {
      console.log('🔍 Processing as confirmation response');
      await handleConfirmation(command, pendingProductsRef.current);
      return;
    }

    // Quick repeat command
    if (command.toLowerCase().includes('repeat')) {
      console.log('🔁 Repeat command detected');
      console.log('📊 Current routeData state:', routeData);
      console.log('📊 Current routeDataRef:', routeDataRef.current);
      
      const currentRoute = routeDataRef.current || routeData;
      
      if (currentRoute && currentRoute.itemMapping && currentRoute.stops) {
        console.log('✅ Route exists, repeating instructions');
        speakRouteInstructions(currentRoute);
      } else {
        console.log('❌ No route data available');
        speak('No route has been generated yet. Please confirm your shopping list first.');
      }
      return;
    }

    // Next zone command - navegación paso a paso
    if (command.toLowerCase().includes('next zone') || 
        command.toLowerCase().includes('next') ||
        command.toLowerCase().includes('siguiente zona') ||
        command.toLowerCase().includes('siguiente')) {
      console.log('➡️ Next zone command detected');
      handleNextZone();
      return;
    }

    // Start navigation command
    if (command.toLowerCase().includes('start navigation') ||
        command.toLowerCase().includes('begin') ||
        command.toLowerCase().includes('comenzar navegación') ||
        command.toLowerCase().includes('empezar')) {
      console.log('🚀 Start navigation command detected');
      startNavigation();
      return;
    }

    // Calculate route command - forzar cálculo de ruta
    if (command.toLowerCase().includes('calculate route') ||
        command.toLowerCase().includes('generate route') ||
        command.toLowerCase().includes('calcular ruta') ||
        command.toLowerCase().includes('generar ruta')) {
      console.log('🗺️ Calculate route command detected');
      if (productList.length > 0) {
        speak('Calculating your route now.', () => {
          setTimeout(() => {
            generateRoute(productList);
          }, 500);
        });
      } else if (pendingProductsRef.current.length > 0) {
        speak('Calculating your route now.', () => {
          setTimeout(() => {
            generateRoute(pendingProductsRef.current);
          }, 500);
        });
      } else {
        speak('You have no products in your list yet. Please add some products first.');
      }
      return;
    }

    // Use AI to process natural language
    console.log('🤖 Sending to AI...');
    await processNaturalLanguage(command);
  };

  const processNaturalLanguage = async (userMessage: string) => {
    try {
      console.log('🎤 User said:', userMessage);
      console.log('📦 Current pending products:', pendingProductsRef.current);
      
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: conversationHistory,
          currentProducts: pendingProductsRef.current.length > 0 ? pendingProductsRef.current : productList
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 Oci responds:', data);

      if (data.error) {
        console.error('❌ API Error:', data.error);
        speak('Sorry, I had trouble understanding that. Could you please repeat?');
        return;
      }

      // Update history
      const updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.response }
      ];
      setConversationHistory(updatedHistory);

      // Speak response - SOLO si no hay productos para confirmar
      console.log('🔊 Speaking:', data.response);
      
      // Handle products
      if (data.products && data.products.length > 0) {
        console.log('🛒 Products found:', data.products);
        setProductList(data.products);
        pendingProductsRef.current = data.products; // Guardar en ref también
        setIsInShoppingProcess(true); // Marcar que comenzó proceso de compra
        
        // Esperar a que termine de hablar el mensaje inicial, luego preguntar confirmación
        speak(data.response, () => {
          setTimeout(() => {
            askForConfirmation(data.products);
          }, 500);
        });
      } else {
        // Si no hay productos, solo hablar la respuesta
        speak(data.response);
      }

    } catch (error) {
      console.error('❌ Error:', error);
      speak('Sorry, I encountered an error. Please try again.');
    }
  };

  const askForConfirmation = (products: string[]) => {
    const productList = products.join(', ');
    const confirmationMessage = `I have ${products.length} item${products.length > 1 ? 's' : ''}: ${productList}. Say yes to confirm and generate the route, or tell me what you want to add or remove.`;
    
    console.log('❓ Asking for confirmation. Setting waitingForConfirmation to TRUE');
    setWaitingForConfirmation(true);
    waitingForConfirmationRef.current = true;
    console.log('📊 State after setting - waitingForConfirmationRef:', waitingForConfirmationRef.current);
    
    speak(confirmationMessage);
  };

  const processRemoveProduct = async (command: string, currentProducts: string[]) => {
    console.log('➖ Processing remove command:', command);
    console.log('📦 Current products list:', currentProducts);
    
    const lowerCommand = command.toLowerCase();
    let foundProducts: string[] = [];
    
    // Buscar todos los productos de la lista actual que se mencionan en el comando
    for (const product of currentProducts) {
      const productLower = product.toLowerCase();
      if (lowerCommand.includes(productLower)) {
        foundProducts.push(product);
        console.log('✓ Found product to remove:', product);
      }
    }
    
    if (foundProducts.length > 0) {
      // Eliminar los productos encontrados
      const updatedProducts = currentProducts.filter(p => !foundProducts.includes(p));
      console.log('✂️ Removing products:', foundProducts);
      console.log('📦 Updated products:', updatedProducts);
      
      setProductList(updatedProducts);
      pendingProductsRef.current = updatedProducts;
      
      if (updatedProducts.length > 0) {
        const removedText = foundProducts.length === 1 ? foundProducts[0] : foundProducts.join(' and ');
        speak(`Removed ${removedText}.`, () => {
          setTimeout(() => {
            askForConfirmation(updatedProducts);
          }, 500);
        });
      } else {
        speak('List is now empty. What products do you need?');
      }
    } else {
      console.log('❌ Could not identify product to remove');
      speak('I could not identify which product to remove. Please say the product name clearly, or say remove all to clear the list.');
      // Volver a preguntar confirmación
      setTimeout(() => {
        askForConfirmation(currentProducts);
      }, 100);
    }
  };

  const handleConfirmation = async (command: string, currentProducts: string[]) => {
    const lowerCommand = command.toLowerCase();
    
    console.log('🔍 Handling confirmation for:', lowerCommand);
    console.log('📦 Current products to confirm:', currentProducts);
    
    // Usuario confirma la lista
    if (lowerCommand.includes('yes') || 
        lowerCommand.includes('correct') || 
        lowerCommand.includes('si') ||
        lowerCommand.includes('correcto') ||
        lowerCommand.includes('confirm') ||
        lowerCommand.includes('okay') ||
        lowerCommand.includes('ok')) {
      console.log('✅ List confirmed by user');
      setWaitingForConfirmation(false);
      waitingForConfirmationRef.current = false;
      
      speak('Perfect! Calculating your route now.', () => {
        setTimeout(() => {
          console.log('📍 Generating route for products:', currentProducts);
          generateRoute(currentProducts);
        }, 500);
      });
      return;
    }
    
    // Usuario quiere empezar de nuevo / eliminar toda la lista
    if (lowerCommand.includes('no') || 
        lowerCommand.match(/\b(remove|delete|clear)\s+(all|everything|the list|todo|toda)\b/i) ||
        lowerCommand.includes('restart') ||
        lowerCommand.includes('start over') ||
        lowerCommand.includes('empezar de nuevo') ||
        lowerCommand.includes('clear list') ||
        lowerCommand.includes('limpiar lista')) {
      console.log('🔄 Restarting list - removing everything');
      setWaitingForConfirmation(false);
      waitingForConfirmationRef.current = false;
      setProductList([]);
      pendingProductsRef.current = [];
      setRouteData(null);
      routeDataRef.current = null;
      speak('Okay, clearing the list. What products do you need?');
      return;
    }
    
    // Usuario quiere eliminar un producto específico
    if (lowerCommand.includes('remove') || lowerCommand.includes('delete') || lowerCommand.includes('eliminar') || lowerCommand.includes('quitar')) {
      console.log('➖ Detected remove command');
      setWaitingForConfirmation(false);
      waitingForConfirmationRef.current = false;
      await processRemoveProduct(command, currentProducts);
      return;
    }
    
    // Usuario quiere agregar más productos
    if (lowerCommand.includes('add') || 
        lowerCommand.includes('also') ||
        lowerCommand.includes('agregar') ||
        lowerCommand.includes('también') ||
        lowerCommand.includes('more') ||
        lowerCommand.includes('and')) {
      console.log('➕ User wants to add items');
      setWaitingForConfirmation(false);
      waitingForConfirmationRef.current = false;
      await processNaturalLanguage(command);
      return;
    }
    
    // Cualquier otra respuesta - intentar procesar como modificación
    console.log('🔄 Processing as general modification');
    setWaitingForConfirmation(false);
    waitingForConfirmationRef.current = false;
    
    if (lowerCommand.length > 3) {
      await processNaturalLanguage(command);
    } else {
      speak('I did not understand. Please say yes to confirm, or tell me what products to add or remove.');
      setWaitingForConfirmation(true);
      waitingForConfirmationRef.current = true;
    }
  };

  const generateRoute = async (items: string[]) => {
    console.log('🗺️ generateRoute called with items:', items);
    
    if (!items || items.length === 0) {
      console.error('❌ No items provided to generateRoute');
      speak('Error: No products to generate route for.');
      return;
    }
    
    try {
      const res = await fetch('/api/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      console.log('📍 Route data received:', data);

      if (data.error) {
        speak('Error generating route. Please try again.');
        return;
      }

      setRouteData(data);
      routeDataRef.current = data; // Guardar en ref también
      console.log('💾 Route saved to state and ref');
      speakRouteInstructions(data);
    } catch (error) {
      console.error('❌ Error in generateRoute:', error);
      speak('Connection error. Please try again.');
    }
  };

  const speakRouteInstructions = (data?: any) => {
    const routeInfo = data || routeData;
    
    console.log('🗣️ speakRouteInstructions called');
    console.log('📊 routeInfo:', routeInfo);
    
    if (!routeInfo || !routeInfo.itemMapping || !routeInfo.stops) {
      console.log('❌ Missing route data - cannot speak instructions');
      speak('No route available. Please confirm your shopping list to generate a route.');
      return;
    }
    
    // Crear un mapa de zona a productos
    const zoneToProducts: Record<number, string[]> = {};
    routeInfo.itemMapping.forEach((mapping: any) => {
      const zoneId = parseInt(mapping.zone.split('.')[0]);
      if (!zoneToProducts[zoneId]) {
        zoneToProducts[zoneId] = [];
      }
      zoneToProducts[zoneId].push(mapping.item);
    });
    
    // Filtrar stops para excluir EXIT (201-204) y Entry (1)
    const productStops = routeInfo.stops.filter((stopId: number) => 
      stopId > 1 && (stopId < 201 || stopId > 204)
    );
    
    let instructions = `Your route is ready. You will visit ${productStops.length} zones. `;

    // Usar el orden de stops para dictar las instrucciones en orden
    productStops.forEach((stopId: number, index: number) => {
      const products = zoneToProducts[stopId] || [];
      const zoneName = routeInfo.route.find((r: any) => r.zone.startsWith(`${stopId}.`))?.zone.split('.')[1] || 'Unknown';
      
      if (products.length > 0) {
        const productText = products.length === 1 ? products[0] : products.slice(0, -1).join(', ') + ' and ' + products[products.length - 1];
        
        if (index === 0) {
          instructions += `First, go to the ${zoneName} zone to get ${productText}. `;
        } else if (index === productStops.length - 1) {
          instructions += `Finally, visit the ${zoneName} zone for ${productText}. `;
        } else {
          instructions += `Then, go to the ${zoneName} zone for ${productText}. `;
        }
      }
    });

    instructions += 'The route is shown on the map. When you finish shopping, say thank you for the purchase. Happy shopping!';

    console.log('🔊 Speaking route instructions');
    speak(instructions);
  };

  const startNavigation = () => {
    const currentRoute = routeDataRef.current || routeData;
    
    if (!currentRoute || !currentRoute.stops || !currentRoute.itemMapping) {
      speak('No route available. Please confirm your shopping list to generate a route first.');
      return;
    }

    // Resetear y empezar desde el inicio
    setCurrentZoneIndex(0);
    currentZoneIndexRef.current = 0;
    setNavigationStarted(true);
    
    speak('Starting navigation. Say next zone to move to the first product location.', () => {
      // Dar instrucciones inmediatamente para la primera zona
      setTimeout(() => {
        handleNextZone();
      }, 500);
    });
  };

  const getDirection = (fromX: number, fromY: number, toX: number, toY: number): string => {
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;
    
    // Determinar dirección basada en movimiento predominante:
    // - Izquierda a derecha (deltaX > 0) = ir recto
    // - Arriba hacia abajo (deltaY > 0) = dar vuelta a la derecha
    // - Abajo hacia arriba (deltaY < 0) = dar vuelta a la izquierda
    
    if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) {
      return 'right here';
    }
    
    // Determinar qué movimiento es más significativo
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      // Movimiento horizontal predomina
      if (deltaX > 0) {
        return 'straight ahead'; // Izquierda a derecha = recto
      } else {
        return 'behind you and turn around'; // Derecha a izquierda
      }
    } else {
      // Movimiento vertical predomina
      if (deltaY > 0) {
        return 'to your right'; // Arriba hacia abajo = derecha
      } else {
        return 'to your left'; // Abajo hacia arriba = izquierda
      }
    }
  };

  const handleNextZone = () => {
    const currentRoute = routeDataRef.current || routeData;
    
    if (!currentRoute || !currentRoute.stops || !currentRoute.itemMapping) {
      speak('No route available. Please generate a route first.');
      return;
    }

    // Filtrar stops para obtener solo las zonas de productos (excluir Entry y Exits)
    const productStops = currentRoute.stops.filter((stopId: number) => 
      stopId > 1 && (stopId < 201 || stopId > 204)
    );

    const currentIndex = currentZoneIndexRef.current;
    
    console.log('📍 Current zone index:', currentIndex, 'Total zones:', productStops.length);

    // Verificar si ya terminamos
    if (currentIndex >= productStops.length) {
      // Obtener la última zona visitada y la salida más cercana
      const lastStopId = productStops[productStops.length - 1];
      const lastZoneData = currentRoute.route.find((r: any) => r.zone.startsWith(`${lastStopId}.`));
      
      // Encontrar la salida más cercana en la ruta
      const exitData = currentRoute.route.find((r: any) => 
        r.zone.startsWith('201.') || r.zone.startsWith('202.') || 
        r.zone.startsWith('203.') || r.zone.startsWith('204.')
      );
      
      let exitInstruction = 'You have reached all product locations. ';
      
      if (lastZoneData && exitData) {
        const direction = getDirection(lastZoneData.x, lastZoneData.y, exitData.x, exitData.y);
        const exitName = exitData.zone.split('.')[1] || 'exit';
        exitInstruction += `Turn ${direction} and head to the ${exitName}. `;
      } else {
        exitInstruction += 'Head to the nearest exit. ';
      }
      
      exitInstruction += 'When finished, say thank you for the purchase.';
      speak(exitInstruction);
      return;
    }

    const currentStopId = productStops[currentIndex];
    const nextIndex = currentIndex + 1;
    
    // Crear un mapa de zona a productos
    const zoneToProducts: Record<number, string[]> = {};
    currentRoute.itemMapping.forEach((mapping: any) => {
      const zoneId = parseInt(mapping.zone.split('.')[0]);
      if (!zoneToProducts[zoneId]) {
        zoneToProducts[zoneId] = [];
      }
      zoneToProducts[zoneId].push(mapping.item);
    });

    const products = zoneToProducts[currentStopId] || [];
    
    // Obtener coordenadas de las zonas
    const currentZoneData = currentRoute.route.find((r: any) => r.zone.startsWith(`${currentStopId}.`));
    const zoneName = currentZoneData?.zone.split('.')[1] || 'Unknown';
    
    let instruction = '';
    
    if (currentIndex === 0) {
      // Primera zona - desde la entrada
      const entryData = currentRoute.route.find((r: any) => r.zone.startsWith('1.'));
      if (entryData && currentZoneData) {
        const direction = getDirection(entryData.x, entryData.y, currentZoneData.x, currentZoneData.y);
        const productText = products.length === 1 ? products[0] : products.slice(0, -1).join(', ') + ' and ' + products[products.length - 1];
        instruction = `From the entrance, turn ${direction} and head to the ${zoneName} zone to get ${productText}.`;
      } else {
        instruction = `From the entrance, head to the ${zoneName} zone to get ${products.join(' and ')}.`;
      }
    } else {
      // Zonas siguientes
      const previousStopId = productStops[currentIndex - 1];
      const previousZoneData = currentRoute.route.find((r: any) => r.zone.startsWith(`${previousStopId}.`));
      const previousZoneName = previousZoneData?.zone.split('.')[1] || 'Unknown';
      
      if (products.length > 0 && previousZoneData && currentZoneData) {
        const direction = getDirection(previousZoneData.x, previousZoneData.y, currentZoneData.x, currentZoneData.y);
        const productText = products.length === 1 ? products[0] : products.slice(0, -1).join(', ') + ' and ' + products[products.length - 1];
        instruction = `From the ${previousZoneName} zone, turn ${direction} and go to the ${zoneName} zone to get ${productText}.`;
      }
    }

    // Indicar progreso
    instruction += ` This is stop ${nextIndex} of ${productStops.length}.`;
    
    if (nextIndex < productStops.length) {
      instruction += ' Say next zone when you are ready to continue.';
    } else {
      instruction += ' This is your last stop.';
    }

    console.log('🗣️ Navigation instruction:', instruction);
    
    speak(instruction, () => {
      // Incrementar el índice después de hablar
      const newIndex = currentIndex + 1;
      setCurrentZoneIndex(newIndex);
      currentZoneIndexRef.current = newIndex;
      console.log('✅ Moved to zone index:', newIndex);
    });
  };

  const handleAddTextProduct = () => {
    if (textInput.trim()) {
      const newProducts = [...productList, textInput.trim()];
      setProductList(newProducts);
      pendingProductsRef.current = newProducts;
      setTextInput('');
      setIsInShoppingProcess(true);
    }
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = productList.filter((_, i) => i !== index);
    setProductList(newProducts);
    pendingProductsRef.current = newProducts;
  };

  const handleGenerateRouteFromText = () => {
    if (productList.length > 0) {
      generateRoute(productList);
    }
  };

  const toggleMicrophone = (event?: React.MouseEvent | React.TouchEvent) => {
    // Prevenir comportamiento por defecto en móviles
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // No permitir activar micrófono mientras el asistente habla
    if (isSpeaking) {
      console.log('🔇 Cannot activate mic - assistant is speaking');
      return;
    }

    if (!isListening) {
      // Start listening when button is pressed
      console.log('🎤 Starting listening...');
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          const errorMessage = (error as Error).message;
          if (errorMessage.includes('already started')) {
            console.log('Recognition already active');
          } else {
            console.error('Error starting:', error);
            speak('Error starting voice recognition.');
          }
        }
      } else {
        console.warn('⚠️ Speech recognition not available in this browser');
        alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    } else {
      // Stop listening when button is released
      console.log('🎤 Stopping listening...');
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Error stopping:', error);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex flex-col items-center justify-start p-4 md:p-8">

      {/* Audio Activation Banner for Mobile - Only show if audio not ready */}
      {!audioReady && !hasIntroduced && (
        <div className="w-full max-w-2xl mb-4 bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-yellow-700 flex-shrink-0" />
            <p className="text-yellow-900 font-semibold">
              📱 <strong>Tap anywhere</strong> to enable voice assistant audio on your device
            </p>
          </div>
        </div>
      )}

      {/* Mode Toggle - Large and Accessible */}
      <div className="w-full max-w-2xl mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setMode('voice')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              mode === 'voice'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Voice Assistant Mode"
          >
            <Mic className="w-6 h-6" />
            Voice Assistant
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              mode === 'text'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Text Input Mode"
          >
            <Keyboard className="w-6 h-6" />
            Text Input
          </button>
        </div>
      </div>

      {/* VOICE MODE */}
      {mode === 'voice' && (
        <>
          {/* Large Microphone Button */}
          <div className="flex-1 flex items-center justify-center w-full max-w-2xl mb-8">
            <button
              onMouseDown={toggleMicrophone}
              onMouseUp={toggleMicrophone}
              onTouchStart={(e) => {
                e.preventDefault();
                toggleMicrophone(e);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                toggleMicrophone(e);
              }}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                touchAction: 'none'
              }}
              className={`w-72 h-72 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl border-8 select-none ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse border-red-300'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-400'
              }`}
              aria-label={isListening ? 'Release to stop listening' : 'Press and hold to speak'}
            >
              {isListening ? (
                <>
                  <Mic className="w-32 h-32 md:w-40 md:h-40 text-white mb-4" />
                  <span className="text-white text-xl font-bold">Listening...</span>
                </>
              ) : (
                <>
                  <MicOff className="w-32 h-32 md:w-40 md:h-40 text-white mb-4" />
                  <span className="text-white text-lg font-semibold text-center px-4">Press & Hold<br/>to Speak</span>
                </>
              )}
            </button>
          </div>

          {/* Status Text */}
          <div className="mb-6 text-center w-full max-w-2xl">
            <div className={`p-6 rounded-2xl shadow-lg ${
              isSpeaking ? 'bg-purple-100 border-2 border-purple-400' :
              waitingForConfirmation ? 'bg-yellow-100 border-2 border-yellow-400' :
              isListening ? 'bg-red-100 border-2 border-red-400' :
              'bg-blue-100 border-2 border-blue-400'
            }`}>
              <p className="text-2xl md:text-3xl font-bold mb-2">
                {isSpeaking
                  ? '🔊 OCI is speaking...'
                  : waitingForConfirmation
                  ? '⏳ Say "Yes" to confirm'
                  : isListening 
                  ? '🎤 Listening...'
                  : '🎤 Ready to help!'}
              </p>
              {transcript && (
                <p className="text-lg text-gray-700 mt-2">
                  You said: <span className="font-semibold italic">"{transcript}"</span>
                </p>
              )}
            </div>
          </div>

          {/* Product List Display */}
          {productList.length > 0 && (
            <div className="w-full max-w-2xl mb-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🛒</span> Your Shopping List
                </h3>
                <div className="flex flex-wrap gap-3">
                  {productList.map((product, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-4 py-3 rounded-xl font-semibold text-lg border-2 border-blue-300"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Voice Commands Help - Collapsible */}
          <div className="w-full max-w-2xl mb-6 bg-white rounded-2xl shadow-lg">
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-2xl"
              aria-label={isGuideOpen ? 'Close command guide' : 'Open command guide'}
            >
              <div className="flex items-center gap-3">
                <Volume2 className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold">Quick Guide</h3>
              </div>
              {isGuideOpen ? (
                <ChevronUp className="w-6 h-6 text-gray-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {isGuideOpen && (
              <div className="px-5 pb-5 border-t-2 border-gray-200">
                <div className="mt-4 mb-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                  <p className="text-base text-blue-900">
                    <strong>💡 Need help?</strong> Say <strong>"Help"</strong> and OCI will guide you!
                  </p>
                </div>
                <ul className="space-y-3 text-base">
                  <li className="flex gap-2"><span className="font-bold">🛒</span> <span><strong>Shop:</strong> "I need milk and bread"</span></li>
                  <li className="flex gap-2"><span className="font-bold">✅</span> <span><strong>Confirm:</strong> Say "Yes"</span></li>
                  <li className="flex gap-2"><span className="font-bold">➕</span> <span><strong>Add:</strong> "Add apples"</span></li>
                  <li className="flex gap-2"><span className="font-bold">🗑️</span> <span><strong>Remove:</strong> "Remove milk"</span></li>
                  <li className="flex gap-2"><span className="font-bold">🔁</span> <span><strong>Repeat:</strong> Say "Repeat"</span></li>
                  <li className="flex gap-2"><span className="font-bold">🧭</span> <span><strong>Navigate:</strong> "Start navigation"</span></li>
                  <li className="flex gap-2"><span className="font-bold">📷</span> <span><strong>Camera:</strong> "Camera on/off"</span></li>
                </ul>
              </div>
            )}
          </div>

          {/* Store Map - Only in Voice Mode */}
          {routeData && (
            <div className="w-full max-w-4xl mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  Your Route Map
                </h3>
                <StoreMap 
                  externalProductList={productList}
                  externalRouteData={routeData}
                  showAllZones={showAllZones}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* TEXT MODE */}
      {mode === 'text' && (
        <div className="w-full max-w-2xl space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-3xl">✍️</span> Add Products
            </h2>
            
            {/* Header con checkbox para mostrar zonas */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-gray-700 font-semibold text-lg">Product List:</label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showAllZones}
                  onChange={(e) => setShowAllZones(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Show all zones on map</span>
              </label>
            </div>

            {/* Textarea para múltiples formatos */}
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter products (multiple formats supported):\n\nExamples:\n- Juice, Pasta, Beer\n- Tomatoes\n- Yogurt\n- Bread"
              rows={5}
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
              aria-label="Product list input"
            />

            {/* Botón para procesar lista */}
            <button
              onClick={() => {
                if (textInput.trim()) {
                  // Procesar el texto: dividir por líneas nuevas o comas
                  const items = textInput
                    .split(/[\n,]+/)
                    .map((i) => i.trim())
                    .map((i) => i.replace(/^[-•*]\s*/, '')) // Eliminar viñetas
                    .filter((i) => i.length > 0);
                  
                  if (items.length > 0) {
                    // Agregar solo productos nuevos (evitar duplicados)
                    const currentProducts = [...productList];
                    const newProducts: string[] = [];
                    
                    items.forEach(item => {
                      // Comparación case-insensitive para evitar duplicados
                      const itemLower = item.toLowerCase();
                      const exists = currentProducts.some(p => p.toLowerCase() === itemLower);
                      
                      if (!exists) {
                        newProducts.push(item);
                        currentProducts.push(item);
                      }
                    });
                    
                    // Actualizar la lista con productos existentes + nuevos
                    setProductList(currentProducts);
                    pendingProductsRef.current = currentProducts;
                    setTextInput('');
                    setIsInShoppingProcess(true);
                    
                    // Notificación opcional de cuántos se agregaron
                    console.log(`Added ${newProducts.length} new products. ${items.length - newProducts.length} duplicates ignored.`);
                  }
                }
              }}
              className="w-full mt-4 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xl transition-colors shadow-md flex items-center justify-center gap-2"
              aria-label="Add products from list"
            >
              <Plus className="w-6 h-6" />
              Add All Products
            </button>

            {/* Product List */}
            {productList.length > 0 && (
              <>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🛒</span> Shopping List ({productList.length})
                </h3>
                <div className={`space-y-3 mb-6 ${
                  productList.length > 5 ? 'max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-400 scrollbar-track-gray-100' : ''
                }`}>
                  {productList.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-green-50 border-2 border-green-200 px-5 py-4 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <span className="text-lg font-semibold text-gray-800">{product}</span>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        aria-label={`Remove ${product}`}
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Generate Route Button */}
                <button
                  onClick={handleGenerateRouteFromText}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                  aria-label="Generate shopping route"
                >
                  <MapPin className="w-6 h-6" />
                  Generate Route
                </button>
              </>
            )}

            {productList.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-lg">
                No products added yet. Type a product name and click Add.
              </p>
            )}
          </div>

          {/* Store Map - Also visible in Text Mode */}
          {routeData && (
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-green-600" />
                Your Route Map
              </h3>
              <StoreMap 
                externalProductList={productList}
                externalRouteData={routeData}
                showAllZones={showAllZones}
              />
            </div>
          )}
        </div>
      )}

      {/* Camera View */}
      <CameraView 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        isListening={isListening}
        isSpeaking={isSpeaking}
        onMicToggle={toggleMicrophone}
      />
    </div>
  );
}