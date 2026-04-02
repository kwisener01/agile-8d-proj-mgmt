import './globals.css'

export const metadata = {
  title: 'FlowForge - Agile 8D Project Management',
  description: 'Unified Agile and 8D problem-solving platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
