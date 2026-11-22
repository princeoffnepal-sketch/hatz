import { isAdmin,privateJson } from '@/lib/admin/auth.server';
import { allOrders } from '@/lib/admin/ledger.server';
import { commissionFor } from '@/lib/admin/commission';
function cell(value:unknown){let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export async function GET(request:Request){
 if(!await isAdmin())return privateJson({error:'Sign in required.'},401);
 const rows=await allOrders(new URL(request.url).searchParams.get('mode')==='test'?0:1);
 const csv=[['Stripe session','UTC date','Currency','Hats','Collected USD','Refunded USD','Commission earned USD','Commission held USD','Fulfillment'],...rows.map(o=>[o.id,new Date(o.created*1000).toISOString(),o.currency,o.quantity,o.total/100,o.refund_amount/100,commissionFor(o).earned/100,commissionFor(o).held/100,o.fulfillment])].map(r=>r.map(cell).join(',')).join('\r\n');
 return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="exclusive-hatz-orders.csv"','Cache-Control':'private, no-store'}});
}
