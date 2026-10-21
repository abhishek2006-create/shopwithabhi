import { UnsubscribeButton } from "./unsubscribe-button";
export const metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="signin-box">
      <h1>Your inbox. Your choice.</h1>
      <p>Confirm below to stop newsletter emails.</p>
      <UnsubscribeButton token={token || ""} />
    </div>
  );
}
