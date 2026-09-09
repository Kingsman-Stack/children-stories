import './globals.css';
import './print.css';
import './theme.css';

export const metadata = {
  title: 'StorySprout | Stories made for growing minds',
  description: 'Create safe, personalized stories for children.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
