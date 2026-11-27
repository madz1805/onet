import DevProfile from "@/components/DevProfile";
import { SITE_NAME, DEV_NAME } from "@/lib/site";

export const metadata = {
  title: `Dev — ${SITE_NAME}`,
  description: `Informasi developer ${SITE_NAME}: ${DEV_NAME}.`,
  alternates: { canonical: "/dev" },
};

export default function DevPage() {
  return (
    <div className="mx-auto max-w-md px-5 pb-12 pt-6 sm:pt-10">
      <DevProfile />
    </div>
  );
}
