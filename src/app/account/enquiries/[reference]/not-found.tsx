import Link from "next/link";

/** A reference that does not exist, or belongs to somebody else. Same answer to both. */
export default function EnquiryNotFound() {
  return (
    <div className="max-w-lg py-8">
      <p className="eyebrow text-[0.72rem] text-charcoal/65">Enquiries</p>

      <h1 className="display mt-5 text-[clamp(2rem,4vw,2.8rem)] leading-[0.98] text-charcoal">
        We cannot find
        <br />
        <em className="font-normal italic">that one.</em>
      </h1>

      <p className="mt-6 text-[1rem] leading-relaxed text-charcoal/75">
        The reference may be mistyped, or it may belong to a different account. Your own
        enquiries are all listed together.
      </p>

      <Link
        href="/account/enquiries"
        className="eyebrow mt-9 inline-block border border-charcoal px-7 py-3.5 text-[0.74rem] text-charcoal transition-colors duration-700 hover:bg-charcoal hover:text-bone"
      >
        Your enquiries
      </Link>
    </div>
  );
}
