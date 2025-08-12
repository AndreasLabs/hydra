import * as React from "react"

export interface PageHeaderProps {
  title: string
  description?: string
  right?: React.ReactNode
}

export function PageHeader({ title, description, right }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground mt-1">{description}</p>
        ) : null}
      </div>
      {right ? <div className="flex-shrink-0">{right}</div> : null}
    </div>
  )
}

export default PageHeader


