import { redirect } from 'next/navigation';

export default function PlaylistDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/minidiscs/${params.id}`);
}
