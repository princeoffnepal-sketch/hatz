import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { getProducts } from '@/lib/catalog.server';
export default function sitemap():MetadataRoute.Sitemap {
 return ['', '/shop','/fit-guide','/our-process','/shipping','/returns','/help','/privacy','/terms',...getProducts().map(p=>`/products/${p.slug}`)].map(path=>({url:`${site.url}${path}`}));
}
