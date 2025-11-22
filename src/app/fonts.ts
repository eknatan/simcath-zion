import { Bricolage_Grotesque, JetBrains_Mono, Heebo } from "next/font/google";

// Hebrew font - Modern and clean with wide weight range
export const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

// English display font - Distinctive and creative (replaces Space Grotesk)
export const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
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
export const spaceGrotesk = bricolageGrotesque; // Backward compatibility
