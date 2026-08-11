export default function LegacyFragment({ markup }) {
  return <div className="legacy-fragment" dangerouslySetInnerHTML={{ __html: markup }} />;
}
