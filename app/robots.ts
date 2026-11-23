import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
export default function robots():MetadataRoute.Robots {
 const preview=process.env.VERCEL_ENV && process.env.VERCEL_ENV!=='production';
 return {rules:{userAgent:'*',...(preview?{disallow:'/'}:{allow:'/',disallow:['/admin','/api/','/checkout/','/order/','/cart','/search','/launch-readiness']})},...(!preview?{sitemap:`${site.url}/sitemap.xml`}:{})};
}
