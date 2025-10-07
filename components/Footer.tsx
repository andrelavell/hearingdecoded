export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-center">
        <div className="text-sm text-gray-600 text-center">
          © {new Date().getFullYear()} Hearing Decoded. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
