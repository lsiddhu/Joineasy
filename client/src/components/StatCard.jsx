import { Card } from './Common'
export default function StatCard({ label, value, icon: Icon, tone = 'blue', detail, trend }) {
  return <Card className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{trend}{detail}</div></Card>
}
