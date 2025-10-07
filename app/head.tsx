export default function Head() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  let origin = ''
  try {
    origin = supabaseUrl ? new URL(supabaseUrl).origin : ''
  } catch {
    origin = ''
  }

  return (
    <>
      {/* Preconnect/DNS-prefetch to Supabase to speed up first audio fetch */}
      {origin && (
        <>
          <link rel="preconnect" href={origin} crossOrigin="" />
          <link rel="dns-prefetch" href={origin} />
        </>
      )}
    </>
  )
}
