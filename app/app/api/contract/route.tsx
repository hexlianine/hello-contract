import * as contract from '@/eth/contract';

export async function GET() {
  return new Response(await contract.message());
}
