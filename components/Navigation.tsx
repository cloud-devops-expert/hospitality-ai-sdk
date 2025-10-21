import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

interface NavigationProps {
  title: string
}

export function Navigation({ title }: NavigationProps) {
  return (
    <nav className="mb-8 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <h1 className="text-2xl font-bold text-brand-900 dark:text-brand-200">{title}</h1>
      </div>
      <ThemeToggle />
    </nav>
  )
}
