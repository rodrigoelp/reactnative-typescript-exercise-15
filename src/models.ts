export interface Book {
  name: string;
  tags: string;
  rate: number;
  attributes: BookAttributes;
}

export interface BookAttributes {
  overview_status: string;
  overview_category: string;
  overview_name: string;
  overview_version: string;
  overview_isbn: string;
  overview_author: string;
  overview_provider: string;
  overview_description: string;
  images_thumbnail: string;
  images_banner: string;
}

export interface BookSummary {
    id: number;
    name: string,
    tags: string,
    rate: number,
    author: string,
    thumbnail: string,
    banner: string
}