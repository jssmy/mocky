# 🎭 Mocky - Mock Server with UI

Un servidor de mocks con interfaz visual para crear y gestionar endpoints simulados. Perfecto para desarrollo frontend sin depender de backend real.

## ✨ Características

- **UI Visual**: Interfaz intuitiva para crear y gestionar mocks
- **Colecciones**: Organiza tus mocks en colecciones
- **Matching Flexible**: Filtra por método HTTP, path, query params y headers
- **Respuestas Personalizadas**: Define el body, status code y headers de respuesta
- **Path Params**: Soporte para rutas dinámicas (`/users/:id`)
- **Seguridad**: Protección CORS y autenticación por API key

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para acceder a la UI.

## 📖 Uso

### Crear un Mock

1. Define el **método HTTP** (GET, POST, PUT, DELETE, etc.)
2. Ingresa el **path** del endpoint (ej: `/users`, `/products/:id`)
3. (Opcional) Agrega **params** y **headers** para matching específico
4. Define el **response body** que devolverá el mock
5. Selecciona el **status code** de respuesta
6. Haz clic en **Guardar Mock**

### Consumir Mocks

Los mocks están disponibles en:

```
GET/POST/etc  /api/mock/[tu-endpoint]
```

**Ejemplo:**
- Mock path: `/users`
- URL completa: `http://localhost:3000/api/mock/users`

### Matching de Peticiones

Cuando una petición llega al mock server:

1. Busca mocks que coincidan con el **método HTTP** y **path**
2. Si el mock tiene **params** definidos, la petición debe incluirlos exactamente
3. Si el mock tiene **headers** definidos, la petición debe incluirlos exactamente
4. El mock más específico (más criterios de matching) tiene prioridad

## 🔒 Seguridad

### Protección CORS

Por defecto, los mocks solo son accesibles desde el mismo origen donde está desplegado Mocky.

Para permitir acceso desde otros orígenes, configura en `.env.local`:

```env
# Orígenes permitidos para consumir mocks
MOCK_CONSUMER_ORIGINS=https://tu-frontend.com,https://otro-frontend.com
```

### Autenticación por API Key

Para acceso externo, los consumidores deben incluir un header `X-API-Key`:

```env
# API keys válidas (separadas por coma)
MOCK_API_KEYS=key1,key2,key3
```

**Uso:**
```bash
curl -H "X-API-Key: key1" http://tu-mocky-server/api/mock/users
```

### Protección del Admin

La UI de administración solo acepta peticiones del mismo origen por defecto:

```env
# Orígenes adicionales para el admin
MOCK_ADMIN_ORIGINS=http://localhost:3000
```

## 📁 Estructura

```
mocky/
├── app/
│   ├── api/
│   │   ├── mock/[...path]/     # Handler de mocks (catch-all)
│   │   └── mocks/              # CRUD de definiciones de mocks
│   ├── components/postman/     # Componentes de UI
│   ├── lib/                    # Utilities y storage
│   └── page.tsx                # Página principal
├── data/
│   └── mocks.json              # Almacenamiento de mocks
└── .env.local                  # Configuración (crear desde .env.example)
```

## 🛠️ Configuración

Copia `.env.example` a `.env.local` y ajusta según necesites:

```bash
cp .env.example .env.local
```

## 📝 Licencia

MIT

