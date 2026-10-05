import Link from "next/link";

export function VeyrinBrand({ link = true }: { link?: boolean }) {
  const content = (
    <span className="brand" aria-label="Veyrin">
      <span className="logo">V</span>
      <span className="brand-word">VEY<span className="brand-accent">RIN</span></span>
    </span>
  );
  return link ? <Link href="/" aria-label="Veyrin home">{content}</Link> : content;
}
