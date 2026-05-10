'use client';

import { useEffect, useState } from 'react';
import { HelloWorld } from './_components/hello';

export default function Page() {
  const [message, setMessage] = useState('No connection to the network.');

  useEffect(() => {
    async function initMessage() {
      const res = await fetch('/api/contract');
      setMessage(await res.text());
    }
    initMessage();
  }, []);

  return (
    <div id="container" className="m-8">
      <HelloWorld message={message} />
    </div>
  );
}
