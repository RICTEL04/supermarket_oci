# 📱 Guía de Pruebas en Móvil

## ✅ Cambios Implementados (Última Actualización)

### 🔊 Mejoras de Audio
1. **Banner amarillo mejorado**: Ahora es un BOTÓN grande y visible que dice "TAP HERE to Enable Audio"
2. **Detección de dispositivo**: Automáticamente detecta si es móvil o desktop
3. **Activación manual obligatoria**: En móviles, el audio DEBE activarse con un toque del usuario
4. **Utterance silencioso mejorado**: Usa un espacio ' ' con volumen 0 para "despertar" el sistema
5. **Múltiples listeners**: Touch, click y touchend para asegurar captura de interacción

### 👆 Mejoras Touch
1. **Eventos separados**: `onTouchStart` y `onTouchEnd` con preventDefault explícito
2. **Logs detallados**: Cada evento imprime en consola para debugging
3. **touchAction: manipulation**: Permite gestos táctiles pero previene zoom
4. **active:scale-95**: Feedback visual al tocar el botón
5. **CSS mejorado**: Todos los botones tienen cursor: pointer y touch-action

---

## 🧪 Cómo Probar en tu Celular

### Paso 1: Preparación
1. Abre la app en **Chrome (Android)** o **Safari (iOS)**
2. Asegúrate de que el **volumen esté ALTO** (muy importante)
3. Desactiva el modo silencioso (en iPhone, verifica el switch lateral)

### Paso 2: Activar Audio
1. Deberías ver un **banner amarillo grande** que dice "TAP HERE to Enable Audio"
2. **TOCA EL BANNER AMARILLO** - esto es crítico
3. Espera 1-2 segundos
4. OCI debería comenzar a hablar automáticamente

### Paso 3: Probar el Micrófono
1. **Toca y MANTÉN presionado** el botón azul grande
2. Deberías ver en consola: "👆 Touch start detected"
3. El botón debería ponerse ROJO y decir "Listening..."
4. **Di algo** (ejemplo: "I need milk")
5. **SUELTA** el botón
6. Deberías ver en consola: "👆 Touch end detected"
7. OCI debería responder con voz

---

## 🔍 Debugging Paso a Paso

### En Android (Chrome)
1. Conecta el celular a tu PC con USB
2. En Chrome desktop, ve a `chrome://inspect`
3. Encuentra tu dispositivo y haz click en "Inspect"
4. Abre la consola y busca estos mensajes:

```
🎙️ Voices loaded: [número]
Available voices: [lista]
👆 Touch start detected
✅ Recognition started - listening now
🎤 RAW HEARD: [lo que dijiste]
🔊 Using voice: [nombre de la voz]
🗣️ Speaking: [respuesta de OCI]
```

### En iOS (Safari)
1. Conecta el iPhone a tu Mac
2. En Mac, abre Safari → Develop → [Tu iPhone] → [La página]
3. Abre la consola y busca los mismos mensajes

---

## ❌ Problemas Comunes y Soluciones

### "No veo el banner amarillo"
- **Causa**: El audio ya está activado
- **Solución**: Refresca la página (desliza hacia abajo)

### "Toqué el banner pero no suena"
1. **Verifica el volumen**: Usa los botones físicos, súbelo al MÁXIMO
2. **Verifica modo silencioso**: En iPhone, el switch lateral debe estar OFF
3. **Revisa la consola**: Busca errores en rojo
4. **Intenta de nuevo**: Refresca y vuelve a tocar el banner

### "El botón azul no responde al toque"
1. **Revisa la consola**: Deberías ver "👆 Touch start detected"
2. Si NO ves el mensaje:
   - El navegador puede estar bloqueando touch events
   - Intenta tocar MÁS FUERTE o MANTENER MÁS TIEMPO
   - Refresca la página
3. Si SÍ ves el mensaje pero no se activa:
   - Problema de permisos de micrófono
   - Ve a Configuración → Chrome/Safari → Permisos → Micrófono → Permitir

### "El audio se corta o no termina de hablar"
- **Causa**: iOS puede pausar el speech synthesis
- **Solución**: Ya implementado - auto-resume después de 100ms
- Si persiste: Mantén la app en primer plano mientras habla

### "El micrófono no escucha mi voz"
1. **Verifica permisos**: Configuración del sistema → App → Micrófono → ON
2. **Prueba con comando simple**: Di solo "Yes" o "Milk"
3. **Habla más FUERTE** y más DESPACIO
4. **Acerca el micrófono** a tu boca

---

## 🧪 Pruebas Técnicas (Consola del Navegador)

### Test 1: Verificar Speech Synthesis
Abre la consola y ejecuta:
```javascript
const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance('Hello, this is a test');
synth.speak(utterance);
```

**Resultado esperado**: Deberías escuchar "Hello, this is a test"

### Test 2: Verificar Voces Disponibles
```javascript
const synth = window.speechSynthesis;
setTimeout(() => {
  const voices = synth.getVoices();
  console.log('Total voices:', voices.length);
  voices.forEach(v => console.log(v.name, '-', v.lang));
}, 1000);
```

**Resultado esperado**: Lista de voces (al menos 1 en inglés)

### Test 3: Verificar Speech Recognition
```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  console.log('✅ Speech recognition available');
  const recognition = new SpeechRecognition();
  recognition.start();
  recognition.onresult = (e) => {
    console.log('Heard:', e.results[0][0].transcript);
  };
} else {
  console.log('❌ Speech recognition NOT available');
}
```

**Resultado esperado**: "✅ Speech recognition available"

### Test 4: Verificar Touch Events
Toca el botón azul y verifica en consola:
```
👆 Touch start detected
🎤 Starting listening...
✅ Recognition started - listening now
```

---

## 📊 Checklist de Pruebas

Antes de decir que algo "no funciona", verifica:

- [ ] El volumen del celular está al MÁXIMO
- [ ] El modo silencioso está DESACTIVADO (iPhone)
- [ ] Tocaste el BANNER AMARILLO para activar audio
- [ ] Tienes permisos de MICRÓFONO activados
- [ ] Estás usando Chrome (Android) o Safari (iOS)
- [ ] La consola del navegador está abierta para ver logs
- [ ] Esperaste 1-2 segundos después de tocar el banner
- [ ] MANTUVISTE presionado el botón (no solo tocar)
- [ ] SOLTASTE el botón después de hablar

---

## 🎯 Flujo Correcto de Uso

1. **Abrir app** → Ver banner amarillo
2. **TOCAR banner** → Banner desaparece, OCI habla
3. **Escuchar introducción** de OCI (15-20 segundos)
4. **TOCAR Y MANTENER** botón azul
5. **HABLAR** comando (ej: "I need milk and bread")
6. **SOLTAR** botón
7. **ESPERAR** respuesta de OCI (con voz)
8. **OCI pregunta** "Say yes to confirm"
9. **TOCAR Y MANTENER** botón azul
10. **DECIR** "Yes"
11. **SOLTAR** botón
12. **OCI genera ruta** y la describe con voz

---

## 🆘 Si NADA Funciona

1. **Cierra completamente** el navegador (no solo la pestaña)
2. **Limpia el caché** del navegador
3. **Reinicia** el celular
4. **Actualiza** el navegador a la última versión
5. **Prueba en otro navegador** (si estás en Chrome, prueba Edge)
6. **Revisa conexión a internet** (necesaria para la API)
7. **Conecta el celular al PC** y revisa la consola remota

---

## 📞 Información de Soporte

Si después de todos estos pasos sigue sin funcionar, reporta:

1. **Modelo del celular**: (ej: iPhone 13, Samsung Galaxy S21)
2. **Sistema operativo**: (ej: iOS 17.2, Android 13)
3. **Navegador y versión**: (ej: Chrome 120, Safari 17)
4. **Qué paso específico falla**: (ej: "Toqué el banner pero no habló")
5. **Mensajes de la consola**: (copia todo lo que aparezca en rojo)
6. **Screenshot o video**: Muy útil para diagnosticar

---

**Última actualización**: Diciembre 2025  
**Versión de pruebas**: 2.1 - Touch y Audio mejorados
