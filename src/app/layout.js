import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Bank Exam Portal',
  description: 'Online Mock Test Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
