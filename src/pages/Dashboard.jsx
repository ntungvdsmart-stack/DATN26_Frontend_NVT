import Reports from './Reports';
import OperationsOverview from '../components/admin/OperationsOverview';

export default function Dashboard() {
  return <div className="space-y-8 pb-8"><Reports /><OperationsOverview /></div>;
}
