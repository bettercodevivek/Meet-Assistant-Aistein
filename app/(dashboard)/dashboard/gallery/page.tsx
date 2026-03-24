'use client';

import Link from 'next/link';

export default function GalleryPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
      <p className="mt-2 text-gray-600">
        Gallery is not available yet. Use conversations for now.
      </p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-700">
          You can continue existing sessions or start a new one from chats.
        </p>
        <Link
          href="/dashboard/chats"
          className="mt-4 inline-flex rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Go to chats
        </Link>
      </div>
    </div>
  );
}
