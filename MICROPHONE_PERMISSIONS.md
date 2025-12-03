# 🎤 Solución: Error "not-allowed" - Permisos de Micrófono

## El Problema

Si ves este error en la consola:
```
Speech error: "not-allowed"
```

Significa que **Chrome está bloqueando el acceso al micrófono**.

---

## ✅ Solución Rápida (Chrome Desktop)

### Método 1: Desde la Barra de Direcciones

1. **Busca el ícono 🔒 o 🛈** a la izquierda de la URL
2. **Haz clic** en él
3. Busca **"Micrófono"** o **"Microphone"**
4. Cambia de **"Bloquear"** a **"Permitir"**
5. **Refresca la página** (F5)

### Método 2: Configuración de Chrome

1. Abre: `chrome://settings/content/microphone`
2. O ve a: **Configuración → Privacidad y seguridad → Configuración de sitios → Micrófono**
3. Asegúrate de que esté en **"Los sitios pueden solicitar usar el micrófono"**
4. En la sección **"Permitidos"**, verifica que tu sitio esté listado
5. Si está en **"Bloqueados"**, elimínalo de ahí

### Método 3: Restablecer Permisos

1. Ve a: `chrome://settings/content/all`
2. Busca `localhost:3000` (o tu dominio)
3. Encuentra **"Micrófono"**
4. Haz clic en **"Restablecer permisos"**
5. Refresca la página y vuelve a permitir el acceso

---

## 📱 Solución en Móvil

### Android (Chrome)

1. **Toca** el ícono **🔒** en la barra de direcciones
2. Toca **"Permisos"**
3. Busca **"Micrófono"**
4. Selecciona **"Permitir"**
5. Refresca la página

O desde Configuración del Sistema:
1. **Configuración** → **Aplicaciones** → **Chrome**
2. **Permisos** → **Micrófono** → **Permitir**

### iOS (Safari)

1. **Configuración** → **Safari**
2. **Micrófono** → **Preguntar** o **Permitir**
3. Refresca la página en Safari
4. Cuando Safari pregunte, toca **"Permitir"**

---

## 🔍 Verificar que Funcionó

### En la App

Ahora deberías ver:
- ✅ **NO ver el banner rojo** de "Microphone Access Blocked"
- ✅ El botón azul del micrófono funciona correctamente
- ✅ Al presionar y hablar, OCI te escucha

### En la Consola del Navegador

Abre DevTools (F12) y ejecuta:
```javascript
navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log('Microphone permission:', result.state));
```

**Resultado esperado**: `"granted"`

Si ves `"denied"` o `"prompt"`, los permisos aún no están correctos.

---

## ⚠️ Problemas Comunes

### "No veo el ícono 🔒 en la barra de direcciones"

- Si estás en `http://localhost:3000`, el ícono puede ser diferente
- En HTTP (no HTTPS), Chrome puede mostrar **"No seguro"** o un ícono de información **🛈**
- Haz clic en ese ícono igualmente

### "Cambié a 'Permitir' pero sigue sin funcionar"

1. **Refresca la página completamente** (Ctrl + Shift + R)
2. **Cierra y reabre Chrome**
3. **Verifica que no haya extensiones** bloqueando el micrófono
4. **Revisa configuración del sistema**:
   - Windows: Configuración → Privacidad → Micrófono → Chrome (ON)
   - Mac: Preferencias del Sistema → Seguridad y Privacidad → Micrófono → Chrome ✓

### "El micrófono funciona en otras apps pero no en Chrome"

Verifica la **configuración del sistema operativo**:

**Windows 10/11:**
1. Configuración → Privacidad → Micrófono
2. "Permitir que las aplicaciones accedan al micrófono" → **ON**
3. "Permitir que las aplicaciones de escritorio accedan al micrófono" → **ON**
4. Busca Chrome en la lista y actívalo

**macOS:**
1. Preferencias del Sistema → Seguridad y Privacidad
2. Pestaña "Privacidad" → Micrófono
3. Marca la casilla junto a **Google Chrome** ✓

---

## 🧪 Prueba tu Micrófono

### Test Rápido en la Consola

Abre DevTools (F12) y ejecuta:

```javascript
// Solicitar acceso al micrófono
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone access granted!');
    console.log('Stream:', stream);
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('❌ Microphone access denied:', error);
  });
```

**Si funciona**: Verás "✅ Microphone access granted!"

**Si falla**: Verás "❌ Microphone access denied" con detalles del error

### Test de Reconocimiento de Voz

```javascript
// Test Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.start();
  recognition.onstart = () => console.log('🎤 Recognition started - say something!');
  recognition.onresult = (e) => console.log('Heard:', e.results[0][0].transcript);
  recognition.onerror = (e) => console.error('Error:', e.error);
} else {
  console.error('Speech Recognition not supported');
}
```

---

## 🎯 Nueva Funcionalidad Implementada

Ahora la app detecta automáticamente si los permisos están bloqueados y muestra:

### Banner Rojo (cuando permisos denegados)
```
🚫 Microphone Access Blocked

OCI needs microphone permission to listen to your voice commands.

How to fix:
1. Click the 🔒 lock icon in your browser's address bar
2. Find "Microphone" and change it to "Allow"
3. Refresh this page
```

Este banner **desaparece automáticamente** cuando otorgas los permisos.

---

## 📞 ¿Sigue sin funcionar?

Si después de todo esto sigue sin funcionar:

1. **Cierra Chrome completamente** (incluyendo procesos en segundo plano)
2. **Reinicia tu computadora**
3. **Actualiza Chrome** a la última versión
4. **Prueba en modo incógnito** (sin extensiones)
5. **Prueba en otro navegador** (Edge, Firefox)

Si funciona en modo incógnito, el problema es una **extensión de Chrome** bloqueando el micrófono.

---

## ✨ Checklist Final

Antes de usar OCI, verifica:

- [ ] Chrome está actualizado a la última versión
- [ ] Los permisos del micrófono están en "Permitir" (🔒 en la barra de URL)
- [ ] La configuración del sistema permite que Chrome use el micrófono
- [ ] No hay extensiones bloqueando el acceso
- [ ] El micrófono físico funciona (prueba en otra app)
- [ ] No ves el banner rojo de "Microphone Access Blocked"

Si todos los checks pasan, **OCI debería funcionar perfectamente** 🎉

---

**Última actualización**: Diciembre 2025  
**Versión**: 3.0 - Detección automática de permisos
