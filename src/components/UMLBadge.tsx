'use client'

interface UMLBadgeProps {
  type: 'include' | 'extend'
  label: string
}

export default function UMLBadge({ type, label }: UMLBadgeProps) {
  return (
    <span className={type === 'include' ? 'uml-include' : 'uml-extend'}>
      «{type === 'include' ? 'include' : 'extend'}» {label}
    </span>
  )
}
