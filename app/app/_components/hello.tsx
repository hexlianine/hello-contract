import Image from 'next/image';

type Props = {
  message: string;
};

export function HelloWorld({ message }: Props) {
  return (
    <div>
      <Image src="/next.svg" alt="React logo" width="120" height="17" />
      <p>{message}</p>
      <h2 style={{ paddingTop: '18px' }}>New Message:</h2>
    </div>
  );
}
