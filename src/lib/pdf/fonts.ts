import { Font } from '@react-pdf/renderer';

// Register Rubik font for Hebrew support
// Using v31 URLs from Google Fonts API
Font.register({
  family: 'Rubik',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/rubik/v31/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4i1UA.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/rubik/v31/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-4I-1UA.ttf',
      fontWeight: 'bold',
    },
  ],
});

export const FONT_FAMILY = 'Rubik';
