import { getCurrentUser } from "@/lib/user";
import { MapHome } from "@/components/discovery/map-home";

export default async function Home() {
  const user = await getCurrentUser();
  return <MapHome authedUserName={user?.name ?? user?.email ?? null} />;
}
