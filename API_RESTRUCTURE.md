# API Restructuring - Movies Crawler

Tato dokumentace popisuje restruktalizaci API do modulárních souborů s přidáním Swagger dokumentace.

## Struktura API

API bylo rozděleno do následujících modulů:

### Hlavní soubor
- **`src/api/server.ts`** - Hlavní Express server s konfigurací a mount routes

### Handler moduly
- **`src/api/handlers/content.ts`** - Operace s filmovým obsahem (filmy, seriály, sezóny, epizody)
- **`src/api/handlers/persons.ts`** - Operace s osobami (herci, režiséři, atd.)
- **`src/api/handlers/search.ts`** - Vyhledávací operace
- **`src/api/handlers/media.ts`** - Operace s médii (obrázky, videa)
- **`src/api/handlers/metadata.ts`** - Metadata (žánry, země, jazyky, kolekce)
- **`src/api/handlers/stats.ts`** - Statistiky a trending obsah
- **`src/api/handlers/export.ts`** - Export dat do JSON

### Utility
- **`src/api/utils.ts`** - Sdílené utility funkce (pagination, error handling)

## API Endpointy

### Content Endpoints
- `GET /api/v1/content` - Seznam veškerého obsahu s filtrováním
- `GET /api/v1/content/:id` - Detail obsahu s plnými vztahy
- `GET /api/v1/content/type/:type` - Obsah podle typu
- `GET /api/v1/content/:id/hierarchy` - Hierarchie seriálu (sezóny/epizody)
- `GET /api/v1/content/:id/recommendations` - Doporučení na základě obsahu

### Persons Endpoints
- `GET /api/v1/persons` - Seznam osob s filtrováním
- `GET /api/v1/persons/:id` - Detail osoby
- `GET /api/v1/persons/:id/filmography` - Filmografie osoby

### Search Endpoints
- `GET /api/v1/search` - Vyhledávání v obsahu
- `GET /api/v1/search/all` - Univerzální vyhledávání (obsah + osoby)

### Media Endpoints
- `GET /api/v1/media` - Seznam médií s filtrováním

### Metadata Endpoints
- `GET /api/v1/genres` - Seznam žánrů
- `GET /api/v1/countries` - Seznam zemí
- `GET /api/v1/languages` - Seznam jazyků
- `GET /api/v1/collections` - Seznam kolekcí
- `GET /api/v1/collections/:id` - Detail kolekce

### Statistics Endpoints
- `GET /api/v1/stats` - Celkové statistiky
- `GET /api/v1/trending` - Trending obsah

### Export Endpoints
- `GET /api/v1/export/content/:id` - Export obsahu do JSON
- `GET /api/v1/export/person/:id` - Export osoby do JSON

### System Endpoints
- `GET /health` - Health check
- `GET /api-docs` - Swagger dokumentace (po instalaci závislostí)

## Swagger dokumentace

API obsahuje kompletní Swagger/OpenAPI 3.0 dokumentaci se schématy a příklady.

### Instalace Swagger závislostí
```bash
npm install swagger-jsdoc swagger-ui-express @types/swagger-jsdoc @types/swagger-ui-express
```

Po instalaci odkomentujte Swagger konfiguraci v `src/api/server.ts`.

### Přístup k dokumentaci
Po spuštění serveru bude dokumentace dostupná na:
- `http://localhost:3001/api-docs` - Swagger UI

## Legacy kompatibilita

Pro zachování zpětné kompatibility jsou stále podporovány legacy endpointy:
- `/titles` → `/api/v1/content`
- `/titles/:id` → `/api/v1/content/:id`
- `/search` → `/api/v1/search`
- `/stats` → `/api/v1/stats`
- `/export/:id` → `/api/v1/export/content/:id`

## Spuštění

### Development
```bash
npm run api:dev
```

### Production
```bash
npm run api:build
```

## Funkce

- ✅ Modulární struktura podle handlerů
- ✅ Kompletní Swagger dokumentace
- ✅ TypeScript typy pro všechny endpointy
- ✅ Jednotná error handling
- ✅ Paginace pro všechny seznam endpointy
- ✅ Filtrování a řazení
- ✅ Legacy kompatibilita
- ✅ Health check endpoint
- ✅ Comprehensive schémata pro všechny entity

## Package.json změny

Přidány závislosti:
```json
{
  "dependencies": {
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.6"
  }
}
```