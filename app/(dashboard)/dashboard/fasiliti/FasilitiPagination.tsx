'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Pagination } from '@/components/table/Pagination'

export function FasilitiPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
}: {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onPageChange = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextPage <= 1) {
        params.delete('page')
      } else {
        params.set('page', String(nextPage))
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      totalItems={totalItems}
      pageSize={pageSize}
    />
  )
}
