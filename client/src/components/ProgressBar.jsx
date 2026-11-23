export default function ProgressBar({ value = 0, label, className = '' }) {
  const progress = Math.min(100, Math.max(0, Number(value) || 0))
  return <div className={`progress-wrap ${className}`}>
    {(label || `${progress}%`) && <div className="progress-label"><span>{label}</span><b>{progress}%</b></div>}
    <div className={`progress-track ${className}`} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${progress}%` }}/></div>
  </div>
}
