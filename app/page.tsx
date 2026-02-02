
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to admin dashboard for now
  redirect('/admin');
}
