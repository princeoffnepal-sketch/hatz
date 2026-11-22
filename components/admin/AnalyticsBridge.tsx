'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { registerAnalyticsSink } from '@/lib/analytics';
const allowed=new Set(['page_view','view_item','select_item','add_to_cart','begin_checkout','view_cart','fit_guide_opened','add_to_cart_failed']);
function send(event:string,item?:string){
 if(!allowed.has(event) || location.pathname.startsWith('/admin') || navigator.doNotTrack==='1' || ('globalPrivacyControl' in navigator && navigator.globalPrivacyControl))return;
 try{let session=sessionStorage.getItem('eh_visit');if(!session){session=crypto.randomUUID();sessionStorage.setItem('eh_visit',session);}
 void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),session,event,path:location.pathname,item}),keepalive:true}).catch(()=>{});
 }catch{/* Shopping continues if storage or analytics is unavailable. */}
}
export function AnalyticsBridge(){
 const path=usePathname();
 useEffect(()=>registerAnalyticsSink((event,payload)=>{const data=payload as {items?:{item_id:string}[]};send(event,data.items?.[0]?.item_id);}),[]);
 useEffect(()=>{send('page_view');},[path]);return null;
}
