import { redirect } from 'next/navigation';

export default function AdminMeetingsPage() {
  redirect('/dashboard/admin/conversations');
}
