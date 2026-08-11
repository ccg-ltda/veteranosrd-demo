import LegacyFragment from '../legacy/LegacyFragment';
import markup from '../../templates/layout/header.html?raw';

export default function Header() {
  return <LegacyFragment markup={markup} />;
}
