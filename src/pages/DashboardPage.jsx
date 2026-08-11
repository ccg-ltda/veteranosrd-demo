import LegacyFragment from '../components/legacy/LegacyFragment';
import markup from '../templates/pages/dashboard.html?raw';

export default function DashboardPage() {
  return <LegacyFragment markup={markup} />;
}
