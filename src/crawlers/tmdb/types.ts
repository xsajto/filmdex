// TMDB API Response Types
// Extracted from generated tmdb.api.ts

export interface MovieAlternativeTitlesResponse {
  id?: number;
  titles?: {
    iso_3166_1?: string;
    title?: string;
    type?: string;
  }[];
}

export interface MovieImagesResponse {
  backdrops?: {
    aspect_ratio?: number;
    height?: number;
    iso_639_1?: string;
    file_path?: string;
    vote_average?: number;
    vote_count?: number;
    width?: number;
  }[];
  id?: number;
  logos?: {
    aspect_ratio?: number;
    height?: number;
    iso_639_1?: string;
    file_path?: string;
    vote_average?: number;
    vote_count?: number;
    width?: number;
  }[];
  posters?: {
    aspect_ratio?: number;
    height?: number;
    iso_639_1?: string;
    file_path?: string;
    vote_average?: number;
    vote_count?: number;
    width?: number;
  }[];
}

export interface MovieKeywordsResponse {
  id?: number;
  keywords?: {
    id?: number;
    name?: string;
  }[];
}

export interface MovieTranslationsResponse {
  id?: number;
  translations?: {
    iso_3166_1?: string;
    iso_639_1?: string;
    name?: string;
    english_name?: string;
    data?: {
      homepage?: string;
      overview?: string;
      runtime?: number;
      tagline?: string;
      title?: string;
    };
  }[];
}

export interface MovieVideosResponse {
  id?: number;
  results?: {
    iso_639_1?: string;
    iso_3166_1?: string;
    name?: string;
    key?: string;
    site?: string;
    size?: number;
    type?: string;
    official?: boolean;
    published_at?: string;
    id?: string;
  }[];
}

export interface MovieReviewsResponse {
  id?: number;
  page?: number;
  results?: {
    author?: string;
    author_details?: {
      name?: string;
      username?: string;
      avatar_path?: string;
      rating?: number;
    };
    content?: string;
    created_at?: string;
    id?: string;
    updated_at?: string;
    url?: string;
  }[];
  total_pages?: number;
  total_results?: number;
}

export interface TvSeasonDetailsResponse {
  _id?: string;
  air_date?: string;
  episodes?: {
    air_date?: string;
    episode_number?: number;
    id?: number;
    name?: string;
    overview?: string;
    production_code?: string;
    runtime?: number;
    season_number?: number;
    show_id?: number;
    still_path?: string;
    vote_average?: number;
    vote_count?: number;
    crew?: unknown[];
    guest_stars?: unknown[];
  }[];
  name?: string;
  overview?: string;
  id?: number;
  poster_path?: string;
  season_number?: number;
  vote_average?: number;
}