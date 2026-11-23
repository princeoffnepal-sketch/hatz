import { describe,it,expect } from 'vitest';
import { validateFulfillment } from '@/lib/admin/fulfillment';
describe('manual fulfillment input',()=>{
 it('requires real tracking fields for shipped and delivered states',()=>{
  for(const status of ['shipped','delivered']) expect(()=>validateFulfillment({status})).toThrow(/tracking/);
 });
 it('rejects unsupported statuses and unsafe tracking links',()=>{
  expect(()=>validateFulfillment({status:'refunded'})).toThrow();
  expect(()=>validateFulfillment({status:'__proto__'})).toThrow();
  for(const url of ['javascript:alert(1)','http://carrier.example','https://name:password@carrier.example']) expect(()=>validateFulfillment({status:'shipped',carrier:'USPS',tracking:'123',url})).toThrow(/HTTPS/);
 });
 it('accepts production without inventing a tracking number',()=>{
  expect(validateFulfillment({status:'in_production'})).toEqual({status:'in_production',carrier:null,tracking:null,url:null});
 });
 it('normalizes a shipment update',()=>{
  expect(validateFulfillment({status:'shipped',carrier:' USPS ',tracking:' 123 ',url:'https://tools.usps.com/'})).toEqual({status:'shipped',carrier:'USPS',tracking:'123',url:'https://tools.usps.com/'});
 });
});
