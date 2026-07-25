import './globals.css';

export const metadata = {
  title: 'JAIIB & CAIIB Mock Exam Portal',
  description: 'Online Bank Exam Practice Portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
