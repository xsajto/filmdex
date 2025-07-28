# Filmdex API Documentation

A comprehensive REST API for accessing movie, TV show, and person data from multiple sources (CSFD, TMDB).

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
Currently, no authentication is required. All endpoints are publicly accessible.

## Response Format
All responses follow a consistent JSON format:

### Success Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Common Query Parameters

- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `search` (string): Search term for title/name filtering
- `sortBy` (string): Field to sort by
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')

---

# CONTENT ENDPOINTS

## Get All Content
Retrieve a paginated list of all content with advanced filtering.

```http
GET /api/v1/content
```

### Query Parameters
- `type` (string): Filter by content type ('movie', 'series', 'season', 'episode')
- `source` (string): Filter by remote source ('csfd', 'tmdb')
- `year` (integer): Filter by release year
- `minRating` (float): Minimum rating (0-10)
- `maxRating` (float): Maximum rating (0-10)
- `genre` (string): Filter by genre slug
- `country` (string): Filter by country code (ISO 3166-1 alpha-2)
- `language` (string): Filter by language code (ISO 639-1)
- `search` (string): Search in title, originalTitle, and description
- `sortBy` (string): 'title', 'year', 'rating', 'createdAt' (default: 'createdAt')

### Example Request
```http
GET /api/v1/content?type=movie&year=2023&minRating=7.0&genre=action&page=1&limit=10
```

### Example Response
```json
{
  "data": [
    {
      "id": 1,
      "title": "John Wick: Chapter 4",
      "originalTitle": "John Wick: Chapter 4",
      "year": 2023,
      "type": "movie",
      "remoteSource": "tmdb",
      "remoteId": "603692",
      "rating": 7.8,
      "releaseDate": "2023-03-22T00:00:00.000Z",
      "duration": 169,
      "description": "With the price on his head ever increasing...",
      "status": "Released",
      "genres": [
        { "genre": { "name": "Action", "slug": "action" } }
      ],
      "countries": [
        { "country": { "name": "United States", "code": "US" } }
      ],
      "createdAt": "2023-03-22T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

## Get Content by ID
Retrieve detailed information about specific content including cast, media, and relationships.

```http
GET /api/v1/content/{id}
```

### Example Response
```json
{
  "id": 1,
  "title": "John Wick: Chapter 4",
  "originalTitle": "John Wick: Chapter 4",
  "year": 2023,
  "type": "movie",
  "rating": 7.8,
  "cast": [
    {
      "id": 1,
      "role": "Actor",
      "character": "John Wick",
      "department": "Acting",
      "order": 1,
      "person": {
        "id": 1,
        "name": "Keanu Reeves",
        "remoteId": "6384",
        "remoteSource": "tmdb",
        "knownForDepartment": "Acting"
      }
    }
  ],
  "media": [
    {
      "id": 1,
      "type": "image",
      "subtype": "poster",
      "url": "https://example.com/poster.jpg",
      "width": 500,
      "height": 750,
      "isPrimary": true
    }
  ],
  "genres": [
    { "genre": { "name": "Action", "slug": "action" } }
  ],
  "countries": [
    {
      "country": { "name": "United States", "code": "US" },
      "role": "production"
    }
  ],
  "languages": [
    {
      "language": { "name": "English", "code": "en" },
      "role": "spoken"
    }
  ],
  "organizations": [
    {
      "organization": {
        "id": 1,
        "name": "Lionsgate",
        "type": "production_company"
      },
      "role": "production"
    }
  ],
  "collections": [
    {
      "id": 1,
      "name": "John Wick Collection",
      "description": "Action franchise about a retired hitman"
    }
  ],
  "children": [],
  "parent": null,
  "reviews": [
    {
      "id": 1,
      "author": "John Doe",
      "rating": 8.5,
      "title": "Amazing action sequences",
      "content": "The choreography is incredible...",
      "publishedAt": "2023-03-23T10:00:00.000Z"
    }
  ]
}
```

## Get Content by Type
Retrieve content filtered by specific type with enhanced filtering.

```http
GET /api/v1/content/type/{type}
```

### Path Parameters
- `type` (string): 'movie', 'series', 'season', 'episode'

### Query Parameters
Same as the main content endpoint, plus:
- Additional type-specific fields in response (seasonNumber, episodeNumber for episodes)

## Get Content Hierarchy
Retrieve series with its complete season and episode structure.

```http
GET /api/v1/content/{id}/hierarchy
```

### Example Response
```json
{
  "id": 1,
  "title": "Breaking Bad",
  "type": "series",
  "children": [
    {
      "id": 2,
      "title": "Season 1",
      "type": "season",
      "seasonNumber": 1,
      "children": [
        {
          "id": 3,
          "title": "Pilot",
          "episodeNumber": 1,
          "rating": 8.2,
          "duration": 58,
          "releaseDate": "2008-01-20T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

## Get Content Recommendations
Get recommended content based on a specific content item.

```http
GET /api/v1/content/{id}/recommendations
```

### Query Parameters
- `limit` (integer): Maximum number of recommendations (default: 10)

---

# PERSON ENDPOINTS

## Get All Persons
Retrieve a paginated list of all persons with filtering options.

```http
GET /api/v1/persons
```

### Query Parameters
- `search` (string): Search by person name
- `department` (string): Filter by known department ('Acting', 'Directing', etc.)
- `minPopularity` (float): Minimum popularity score
- `sortBy` (string): 'name', 'popularity', 'createdAt' (default: 'popularity')

### Example Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Keanu Reeves",
      "remoteId": "6384",
      "remoteSource": "tmdb",
      "birthDate": "1964-09-02T00:00:00.000Z",
      "deathDate": null,
      "birthPlace": "Beirut, Lebanon",
      "knownForDepartment": "Acting",
      "popularity": 45.6,
      "profileUrl": "https://example.com/profile.jpg",
      "createdAt": "2023-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

## Get Person by ID
Retrieve detailed information about a specific person including their filmography.

```http
GET /api/v1/persons/{id}
```

### Example Response
```json
{
  "id": 1,
  "name": "Keanu Reeves",
  "biography": "Keanu Charles Reeves is a Canadian actor...",
  "birthDate": "1964-09-02T00:00:00.000Z",
  "birthPlace": "Beirut, Lebanon",
  "knownForDepartment": "Acting",
  "popularity": 45.6,
  "cast": [
    {
      "id": 1,
      "role": "Actor",
      "character": "John Wick",
      "department": "Acting",
      "order": 1,
      "content": {
        "id": 1,
        "title": "John Wick: Chapter 4",
        "year": 2023,
        "type": "movie",
        "rating": 7.8,
        "remoteSource": "tmdb"
      }
    }
  ],
  "media": [
    {
      "id": 1,
      "type": "image",
      "subtype": "profile",
      "url": "https://example.com/keanu.jpg",
      "isPrimary": true
    }
  ]
}
```

## Get Person Filmography
Retrieve a person's filmography grouped by role/department.

```http
GET /api/v1/persons/{id}/filmography
```

### Example Response
```json
{
  "Acting": [
    {
      "id": 1,
      "title": "John Wick: Chapter 4",
      "year": 2023,
      "type": "movie",
      "rating": 7.8,
      "character": "John Wick",
      "role": "Actor",
      "department": "Acting",
      "order": 1
    }
  ],
  "Producing": [
    {
      "id": 2,
      "title": "Constantine",
      "year": 2005,
      "type": "movie",
      "rating": 7.0,
      "character": null,
      "role": "Producer",
      "department": "Production",
      "order": null
    }
  ]
}
```

---

# MEDIA ENDPOINTS

## Get Media
Retrieve media files (images, videos) for content or persons.

```http
GET /api/v1/media
```

### Query Parameters
- `contentId` (integer): Filter by content ID
- `personId` (integer): Filter by person ID
- `type` (string): Filter by media type ('image', 'video', 'audio')
- `subtype` (string): Filter by media subtype ('poster', 'backdrop', 'trailer', etc.)

### Example Response
```json
{
  "data": [
    {
      "id": 1,
      "type": "image",
      "subtype": "poster",
      "title": "Official Poster",
      "url": "https://example.com/poster.jpg",
      "width": 500,
      "height": 750,
      "duration": null,
      "isPrimary": true,
      "language": null,
      "publishedAt": null,
      "contentId": 1,
      "personId": null
    }
  ]
}
```

---

# METADATA ENDPOINTS

## Get Genres
Retrieve all genres with content counts.

```http
GET /api/v1/genres
```

### Example Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Action",
      "slug": "action",
      "_count": {
        "content": 150
      }
    }
  ]
}
```

## Get Countries
Retrieve all countries with content counts.

```http
GET /api/v1/countries
```

## Get Languages
Retrieve all languages with content counts.

```http
GET /api/v1/languages
```

## Get Collections
Retrieve content collections with filtering.

```http
GET /api/v1/collections
```

### Query Parameters
- `search` (string): Search collection names

## Get Collection by ID
Retrieve collection details with all associated content.

```http
GET /api/v1/collections/{id}
```

---

# SEARCH ENDPOINTS

## Search Content
Search within content items with advanced filtering.

```http
GET /api/v1/search
```

### Query Parameters
- `q` (string, required): Search query
- `type` (string): Filter by content type
- `source` (string): Filter by remote source
- All other content filtering parameters are supported

## Universal Search
Search across all entities (content and persons).

```http
GET /api/v1/search/all
```

### Query Parameters
- `q` (string, required): Search query

### Example Response
```json
{
  "content": [
    {
      "id": 1,
      "title": "John Wick: Chapter 4",
      "year": 2023,
      "type": "movie",
      "rating": 7.8,
      "remoteSource": "tmdb"
    }
  ],
  "persons": [
    {
      "id": 1,
      "name": "Keanu Reeves",
      "knownForDepartment": "Acting",
      "popularity": 45.6,
      "remoteSource": "tmdb"
    }
  ],
  "totalResults": 2
}
```

---

# UTILITY ENDPOINTS

## Get Statistics
Retrieve comprehensive database statistics.

```http
GET /api/v1/stats
```

### Example Response
```json
{
  "content": {
    "totalMovies": 1500,
    "totalSeries": 300,
    "totalSeasons": 1200,
    "totalEpisodes": 15000,
    "totalContent": 18000
  },
  "persons": {
    "total": 5000
  },
  "sources": [
    {
      "source": "tmdb",
      "count": 12000
    },
    {
      "source": "csfd",
      "count": 6000
    }
  ],
  "topGenres": [
    {
      "id": 1,
      "name": "Drama",
      "count": 2500
    }
  ],
  "recentlyAdded": 45
}
```

## Get Trending Content
Retrieve trending content based on rating and recency.

```http
GET /api/v1/trending
```

### Query Parameters
- `type` (string): Filter by content type
- `period` (string): 'day', 'week', 'month' (default: 'week')
- `limit` (integer): Maximum results (default: 20)

---

# EXPORT ENDPOINTS

## Export Content
Export complete content data as JSON file.

```http
GET /api/v1/export/content/{id}
```

Returns a downloadable JSON file with complete content information.

## Export Person
Export complete person data as JSON file.

```http
GET /api/v1/export/person/{id}
```

Returns a downloadable JSON file with complete person information including filmography.

---

# LEGACY ENDPOINTS

The following legacy endpoints are maintained for backward compatibility and redirect to the new API:

- `GET /titles` → `GET /api/v1/content`
- `GET /titles/{id}` → `GET /api/v1/content/{id}`
- `GET /search` → `GET /api/v1/search`
- `GET /stats` → `GET /api/v1/stats`
- `GET /export/{id}` → `GET /api/v1/export/content/{id}`

---

# ERROR CODES

- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

# RATE LIMITING

Currently, no rate limiting is implemented. This may change in future versions.

---

# EXAMPLES

### Get top-rated movies from 2023
```bash
curl "http://localhost:3001/api/v1/content?type=movie&year=2023&minRating=8.0&sortBy=rating&limit=10"
```

### Search for action movies with Keanu Reeves
```bash
curl "http://localhost:3001/api/v1/search/all?q=keanu+reeves"
# Then use person ID to get filmography
curl "http://localhost:3001/api/v1/persons/1/filmography"
```

### Get trending movies this week
```bash
curl "http://localhost:3001/api/v1/trending?type=movie&period=week&limit=5"
```

### Get complete series data with episodes
```bash
curl "http://localhost:3001/api/v1/content/1/hierarchy"
```