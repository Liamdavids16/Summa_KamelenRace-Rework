import { GameView } from '@/components/game/GameView';

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GameView roomSlug={slug} />;
}
