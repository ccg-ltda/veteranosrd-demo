import LegacyFragment from '../legacy/LegacyFragment';
import markup from '../../templates/layout/sidebar.html?raw';

export default function Sidebar() {
  return <LegacyFragment markup={markup} />;
}
