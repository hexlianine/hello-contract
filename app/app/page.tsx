'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const HelloWorld = () => {
  const [message, setMessage] = useState('No connection to the network.');

  useEffect(() => {
    async function initMessage() {
      const res = await fetch('/api/contract');
      setMessage(await res.text());
    }
    initMessage();
  }, []);

  return (
    <div id="container">
      <Image src="/next.svg" alt="React logo" width="120" height="17" />

      <p>{message}</p>

      <h2 style={{ paddingTop: '18px' }}>New Message:</h2>
    </div>
  );
};

export default HelloWorld;
