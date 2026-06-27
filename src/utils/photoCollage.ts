import { format } from 'date-fns';

export interface CollagePhoto {
  url:      string;
  caption?: string;
  date:     Date;
}

export function buildCollageHTML(
  photos:     CollagePhoto[],
  monthLabel: string,
  babyName:   string,
): string {
  const displayPhotos = photos.slice(0, 4);
  const count = displayPhotos.length;

  const imgStyle = 'width:100%;height:100%;object-fit:cover;display:block;';
  const cellStyle = (flex: string) =>
    `flex:${flex};aspect-ratio:1/1;overflow:hidden;border-radius:10px;background:#EEE;`;

  let grid = '';
  if (count === 1) {
    grid = `<div style="${cellStyle('1')}"><img src="${displayPhotos[0].url}" style="${imgStyle}"/></div>`;
  } else if (count === 2) {
    grid = `<div style="display:flex;gap:6px;height:260px;">
      ${displayPhotos.map((p) => `<div style="${cellStyle('1')}"><img src="${p.url}" style="${imgStyle}"/></div>`).join('')}
    </div>`;
  } else if (count === 3) {
    grid = `<div style="display:flex;gap:6px;">
      <div style="flex:2;aspect-ratio:1/1;overflow:hidden;border-radius:10px;"><img src="${displayPhotos[0].url}" style="${imgStyle}"/></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
        <div style="flex:1;overflow:hidden;border-radius:10px;"><img src="${displayPhotos[1].url}" style="${imgStyle}"/></div>
        <div style="flex:1;overflow:hidden;border-radius:10px;"><img src="${displayPhotos[2].url}" style="${imgStyle}"/></div>
      </div>
    </div>`;
  } else {
    grid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      ${displayPhotos.map((p) => `<div style="aspect-ratio:1/1;overflow:hidden;border-radius:10px;"><img src="${p.url}" style="${imgStyle}"/></div>`).join('')}
    </div>`;
  }

  const dateRange = count > 0
    ? `${format(displayPhotos[displayPhotos.length - 1].date, 'd MMM')} – ${format(displayPhotos[0].date, 'd MMM yyyy')}`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>* { box-sizing:border-box; margin:0; padding:0; }</style>
</head>
<body style="background:#FFF9F5;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:20px;">
    <div style="font-size:13px;color:#9C3AA5;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Memory Collage</div>
    <div style="font-size:28px;font-weight:900;color:#1A1A2E;">${babyName}</div>
    <div style="font-size:16px;color:#666;margin-top:4px;">${monthLabel}</div>
    ${dateRange ? `<div style="font-size:12px;color:#AAA;margin-top:2px;">${dateRange}</div>` : ''}
  </div>

  <!-- Grid -->
  ${grid}

  <!-- Captions -->
  ${displayPhotos.some((p) => p.caption) ? `
  <div style="margin-top:14px;display:flex;flex-direction:column;gap:4px;">
    ${displayPhotos.filter((p) => p.caption).map((p) => `
      <div style="font-size:12px;color:#555;">
        <span style="color:#AAA;">${format(p.date, 'd MMM')} — </span>${p.caption}
      </div>`).join('')}
  </div>` : ''}

  <!-- Footer -->
  <div style="text-align:center;margin-top:18px;color:#CCC;font-size:11px;">
    Made with BabySaathi 💙
  </div>
</div>
</body>
</html>`;
}
