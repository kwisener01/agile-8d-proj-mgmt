export const metadata = {
  title: 'FlowForge - Agile 8D Project Management',
  description: 'Unified Agile and 8D problem-solving platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
