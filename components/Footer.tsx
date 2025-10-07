export default function Footer() {
  return (
    <footer className="border-t border-gray-700 bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-center">
        <div className="text-sm text-white text-center">
          © {new Date().getFullYear()} Hearing Decoded. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
