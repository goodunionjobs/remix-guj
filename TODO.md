- Finish site.webmanifest and renaming images used
- ok the way to do spanish.
- goodunionjobs.com/sp/jobs also works from goodunionjobs.com/sp/trabajos
- The jobs will be atranslated into spanish by deepl
- A emplyoer can pay to have jobs verified in Spanish so they pop up when hiring
  people on the filter that changes to verified Spanish
- Omg genius idea. Will limit amount of new job postings in email to 5-10. Below
  that will bold out (+23 new jobs, click here to see). Link will take you to
  site. Helps way more with SEO
- Resend, look into treating dmarc and upgrading over time
- Register for BMI with trademark of logo
- In resend, besides using
- If no jobs come in then do not send email whatsoever.
- MAKE SURE TO PUT ON FORM STATES THEY WANT TO GET NOTIFICATIONS ABOUT
- Add in Privacy Policy and Terms N Conditions before we head out
- Make sure that doppler and staging are setup correctly
- Add related jobs. Do it in a sort of way that allows each job to be matched up
  to another in the same category. Once it's matched then remove it from
  selection.

- Changing secret keys in Doopler staging and prod.
- Use less powerful keys R2.
- Staging access-control-allow-origin=\* is rule setup in cloudflare because of
  this issue:
  https://community.cloudflare.com/t/problem-with-settings-cors-policies-on-r2/432339/17
  I think I need to terraform my cloudflare so these rules stay in place for
  future. Look at doing this when I talked with AI:
- Look through and try to remove any unused Icons in other folder. Look for
  stuff like this below and see which ones aren't used
  <Icon name="arrow-left">Back to home</Icon>
- Set this up for alerts when caching is too high and other things
  https://dejager.sh/articles/running-grafana-enterprise-on-fly

1. Change umami. See Google analytics if bots change. I’ll keep both up.  
2. Categories Union admin  
3. Talk about Cornell   

```
  // app/routes/api/image-proxy.ts
import type { LoaderFunction } from '@remix-run/node';
import { getEnv } from '~/utils/env.server';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const imagePath = url.searchParams.get('path');

  if (!imagePath) {
    return new Response('Image path is required', { status: 400 });
  }

  const env = getEnv();
  const imageUrl = `${env.R2_STORAGE_DOMAIN}/${imagePath}`;

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new Response('Failed to load image', { status: 500 });
  }
};

// Usage in your LogoImage component:
export function LogoImage({ employerImage, employer, size, layout }: LogoImageProps) {
  const imageSrc = `/api/image-proxy?path=${encodeURIComponent(employerImage)}.jpeg`;

  return (
    <div className={getContainerClassName(layout)}>
      <img
        src={imageSrc}
        alt={`${employer} Logo`}
        className={getImageClassName()}
        width={size}
        height={size}
      />
    </div>
  );
}
```

This method:

Avoids CORS issues entirely as the request is made from your server. Allows you
to add caching headers, do image processing, or implement access control if
needed. Keeps your R2 domain private, which can be a security benefit.

Regarding the Vary: Origin header issue you mentioned: This is indeed a known
issue with some cloud storage services. The solution you've implemented (adding
CORS headers at the Cloudflare level) effectively bypasses this problem. If you
were to implement one of the alternative solutions (client-side fetching or
server-side proxy), you would also avoid this particular caching issue.
Conclusion:

The Cloudflare Transform Rules solution you've implemented is a good, efficient
approach. If you want more control or to keep your R2 domain private, consider
the client-side ImageLoader component or the server-side proxy approach. Each
method has trade-offs in terms of complexity, control, and performance. Choose
the one that best fits your specific needs and constraints.

Remember to consider security implications, especially if you're dealing with
sensitive or access-controlled images. The access-control-allow-origin=\* header
allows any origin to access your resources, which might not be desirable in all
cases.
