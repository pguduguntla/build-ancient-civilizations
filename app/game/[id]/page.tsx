import { GamePageClient } from "./game-page-client";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ civilization?: string }>;
};

export default async function GamePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { civilization } = await searchParams;
  const validCivilization =
    civilization === "rome" || civilization === "india" || civilization === "egypt"
      ? civilization
      : undefined;
  return <GamePageClient gameId={id} initialCivilization={validCivilization} />;
}
