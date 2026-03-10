export default function Panel({ children, title, dark, highlighted, style, className = '' }) {
  const classes = [
    'panel',
    dark ? 'panel--dark' : '',
    highlighted ? 'panel--highlighted' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} style={style}>
      {title && <span className="section-header">{title}</span>}
      {children}
    </div>
  )
}
