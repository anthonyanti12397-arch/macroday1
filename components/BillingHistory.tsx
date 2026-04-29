'use client'

import { useEffect, useState } from 'react'
import { Loader, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  paidAt: string | null
  dueDate: string | null
  description: string
  pdf_url?: string | null
}

interface BillingHistoryProps {
  compact?: boolean
}

export default function BillingHistory({ compact = false }: BillingHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/subscriptions/invoices')
        if (!res.ok) {
          throw new Error(`Failed to fetch invoices: ${res.statusText}`)
        }
        const data = await res.json()
        setInvoices(data.invoices || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing history')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader className="text-slate-400" size={28} />
        </motion.div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="rounded-lg bg-red-50 p-4 border border-red-200 text-red-700 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {error}
      </motion.div>
    )
  }

  if (invoices.length === 0) {
    return (
      <motion.div
        className="rounded-lg bg-slate-50 p-6 border border-slate-200 text-center text-slate-600 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        No invoices found. Your billing history will appear here after your first charge.
      </motion.div>
    )
  }

  const displayInvoices = compact ? invoices.slice(0, 3) : invoices

  return (
    <motion.div
      className="space-y-3 sm:space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {compact && <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Recent Invoices</h3>}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="text-left py-2 sm:py-3 px-2 sm:px-3 font-medium">Date</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-medium">Amount</th>
              <th className="text-center py-2 sm:py-3 px-2 sm:px-3 font-medium">Status</th>
              {!compact && <th className="text-left py-2 sm:py-3 px-2 sm:px-3 font-medium hidden md:table-cell">Description</th>}
              <th className="text-center py-2 sm:py-3 px-2 sm:px-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayInvoices.map((invoice, idx) => (
              <motion.tr
                key={invoice.id}
                className="hover:bg-slate-50 transition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-slate-700">
                  <span className="text-xs sm:text-sm">
                    {invoice.paidAt
                      ? new Date(invoice.paidAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })
                      : invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })
                      : '—'}
                  </span>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-right text-slate-900 font-semibold">
                  {(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                  <span className={`inline-block px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : invoice.status === 'open'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
                {!compact && (
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-slate-600 hidden md:table-cell text-xs">
                    {invoice.description}
                  </td>
                )}
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                  {invoice.pdf_url && (
                    <motion.a
                      href={invoice.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition"
                      title="Download PDF"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink size={16} />
                    </motion.a>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {compact && invoices.length > 3 && (
        <motion.div
          className="text-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition hover:underline">
            View all invoices →
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
