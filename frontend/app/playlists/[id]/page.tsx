import { redirect } from 'next/navigation';

export default function PlaylistDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/my-library/minidiscs/${params.id}`);
}
