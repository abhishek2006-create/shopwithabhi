import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/content-editor";
export default async function Editor({
  params,
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const { section, id } = await params;
  if (!["products", "articles", "comparisons"].includes(section)) notFound();
  return <ContentEditor section={section} id={id} />;
}
