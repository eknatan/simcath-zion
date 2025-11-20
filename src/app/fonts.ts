import { Space_Grotesk, JetBrains_Mono, Heebo } from "next/font/google";

// Hebrew font - Modern and clean with wide weight range
export const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

// English display font - Geometric and distinctive
export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Monospace font - Professional and clean
export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

// Export for backward compatibility
export const geistSans = heebo;
export const geistMono = jetbrainsMono;
