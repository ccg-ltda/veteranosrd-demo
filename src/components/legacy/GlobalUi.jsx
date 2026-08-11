import LegacyFragment from './LegacyFragment';
import markup from '../../templates/layout/global-ui.html?raw';

export default function GlobalUi() {
  return <LegacyFragment markup={markup} />;
}
