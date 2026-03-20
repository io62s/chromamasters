export interface Color {
  hex: string;
  name: string;
}

export interface Painting {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  dimensions: string;
  location: string;
  image: string;
  imageCredit: string;
  movementId: string;
  colors: Color[];
}

export interface Movement {
  id: string;
  slug: string;
  name: string;
  period: string;
  yearStart: number;
  yearEnd: number;
  description: string;
  summary: string;
}

export type Period = "Renaissance" | "Baroque" | "19th Century" | "Modern";
