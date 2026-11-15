import {NextResponse} from 'next/server';
export async function POST(request:Request){
 // Public demo has no paid API endpoint. Enable live research only after authenticated server authorization is configured.
 await request.json();
 return NextResponse.json({error:'Live AI research is not enabled in this demo. Confirm the nameplate and upload or locate manufacturer documentation. No maintenance guidance has been verified.'},{status:503});
}
