import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Baby, FeedEntry, SleepEntry, GrowthEntry, VaccinationEntry } from '@types/index';
import { format } from 'date-fns';

export interface DoctorReportData {
  baby: Baby;
  reportDate: string;
  summary: {
    feedCount: number;
    avgDailySleepHours: number;
    growthEntries: number;
    vaccinationsAdministered: number;
    totalVaccinations: number;
    cryEvents: number;
  };
  growth: GrowthEntry[];
  recentFeeds: FeedEntry[];
  vaccines: VaccinationEntry[];
}

function generateHTML(data: DoctorReportData): string {
  const { baby, reportDate, summary, growth, vaccines } = data;

  const latestGrowth = growth.length > 0 ? growth[growth.length - 1] : null;
  const prevGrowth = growth.length > 1 ? growth[growth.length - 2] : null;

  const weightChange = latestGrowth && prevGrowth && latestGrowth.weight && prevGrowth.weight
    ? (latestGrowth.weight - prevGrowth.weight).toFixed(2)
    : null;

  const vaccineRows = vaccines.map((v) => `
    <tr>
      <td>${v.vaccineName}</td>
      <td>${v.scheduledDate ? format(v.scheduledDate instanceof Date ? v.scheduledDate : new Date(v.scheduledDate as any), 'dd MMM yyyy') : '—'}</td>
      <td>${v.administeredDate ? format(v.administeredDate instanceof Date ? v.administeredDate : new Date(v.administeredDate as any), 'dd MMM yyyy') : '—'}</td>
      <td class="${v.status === 'administered' ? 'status-done' : v.status === 'overdue' ? 'status-overdue' : 'status-pending'}">${v.status.toUpperCase()}</td>
    </tr>
  `).join('');

  const growthRows = growth.map((g) => `
    <tr>
      <td>${g.date ? format(g.date instanceof Date ? g.date : new Date(g.date as any), 'dd MMM yyyy') : '—'}</td>
      <td>${g.weight ?? '—'} kg</td>
      <td>${g.height ?? '—'} cm</td>
      <td>${g.headCircumference ?? '—'} cm</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BabySaathi Doctor Report - ${baby.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 12px; }

    .header {
      background: linear-gradient(135deg, #FF6B8A 0%, #FF8E53 100%);
      color: white;
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { font-size: 22px; font-weight: 700; }
    .header p { font-size: 12px; opacity: 0.9; margin-top: 4px; }
    .header .logo { font-size: 28px; }

    .content { padding: 24px 32px; }

    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #FF6B8A;
      border-bottom: 2px solid #FF6B8A;
      padding-bottom: 6px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .baby-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .info-card {
      background: #FFF5F7;
      border: 1px solid #FFD6E0;
      border-radius: 8px;
      padding: 12px;
    }
    .info-card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-card .value { font-size: 14px; font-weight: 600; color: #333; margin-top: 4px; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .summary-card {
      background: #F8FAFF;
      border: 1px solid #D6E0FF;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .summary-card .number { font-size: 24px; font-weight: 700; color: #6B8EFF; }
    .summary-card .label { font-size: 10px; color: #888; margin-top: 4px; }

    table { width: 100%; border-collapse: collapse; }
    th {
      background: #FF6B8A;
      color: white;
      padding: 8px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; }
    tr:nth-child(even) td { background: #FAFAFA; }

    .status-done { color: #22C55E; font-weight: 600; }
    .status-overdue { color: #EF4444; font-weight: 600; }
    .status-pending { color: #F59E0B; font-weight: 600; }

    .growth-highlight {
      background: #F0FFF4;
      border: 1px solid #86EFAC;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
      display: flex;
      gap: 24px;
    }
    .growth-stat .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .growth-stat .value { font-size: 16px; font-weight: 700; color: #16A34A; }
    .growth-stat .change { font-size: 10px; color: #22C55E; }

    .footer {
      margin-top: 32px;
      padding: 16px 32px;
      background: #F9FAFB;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 10px;
      color: #999;
    }

    .disclaimer {
      background: #FFFBEB;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 12px;
      font-size: 10px;
      color: #92400E;
      margin-top: 16px;
    }
  </style>
</head>
<body>

<div class="header">
  <div>
    <h1>BabySaathi Health Report</h1>
    <p>Generated on ${format(new Date(reportDate), 'dd MMMM yyyy, h:mm a')}</p>
    <p>30-Day Summary Report</p>
  </div>
  <div class="logo">👶</div>
</div>

<div class="content">

  <!-- Baby Profile -->
  <div class="section">
    <div class="section-title">Baby Profile</div>
    <div class="baby-info-grid">
      <div class="info-card">
        <div class="label">Name</div>
        <div class="value">${baby.name}</div>
      </div>
      <div class="info-card">
        <div class="label">Date of Birth</div>
        <div class="value">${baby.birthDate ? format(baby.birthDate instanceof Date ? baby.birthDate : new Date(baby.birthDate as any), 'dd MMM yyyy') : '—'}</div>
      </div>
      <div class="info-card">
        <div class="label">Gender</div>
        <div class="value">${baby.gender === 'male' ? 'Boy' : baby.gender === 'female' ? 'Girl' : '—'}</div>
      </div>
      <div class="info-card">
        <div class="label">Blood Group</div>
        <div class="value">${baby.bloodGroup ?? '—'}</div>
      </div>
      <div class="info-card">
        <div class="label">Birth Weight</div>
        <div class="value">${baby.birthWeight ? `${baby.birthWeight} kg` : '—'}</div>
      </div>
      <div class="info-card">
        <div class="label">Birth Height</div>
        <div class="value">${baby.birthHeight ? `${baby.birthHeight} cm` : '—'}</div>
      </div>
    </div>
  </div>

  <!-- 30-Day Summary -->
  <div class="section">
    <div class="section-title">30-Day Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="number">${summary.feedCount}</div>
        <div class="label">Total Feeds</div>
      </div>
      <div class="summary-card">
        <div class="number">${summary.avgDailySleepHours.toFixed(1)}h</div>
        <div class="label">Avg Daily Sleep</div>
      </div>
      <div class="summary-card">
        <div class="number">${summary.cryEvents}</div>
        <div class="label">Cry Events</div>
      </div>
      <div class="summary-card">
        <div class="number">${summary.vaccinationsAdministered}</div>
        <div class="label">Vaccines Done</div>
      </div>
      <div class="summary-card">
        <div class="number">${summary.totalVaccinations - summary.vaccinationsAdministered}</div>
        <div class="label">Vaccines Pending</div>
      </div>
      <div class="summary-card">
        <div class="number">${summary.growthEntries}</div>
        <div class="label">Growth Records</div>
      </div>
    </div>
  </div>

  <!-- Latest Growth -->
  ${latestGrowth ? `
  <div class="section">
    <div class="section-title">Current Growth Metrics</div>
    <div class="growth-highlight">
      ${latestGrowth.weight ? `
      <div class="growth-stat">
        <div class="label">Weight</div>
        <div class="value">${latestGrowth.weight} kg</div>
        ${weightChange ? `<div class="change">+${weightChange} kg since last</div>` : ''}
      </div>` : ''}
      ${latestGrowth.height ? `
      <div class="growth-stat">
        <div class="label">Height</div>
        <div class="value">${latestGrowth.height} cm</div>
      </div>` : ''}
      ${latestGrowth.headCircumference ? `
      <div class="growth-stat">
        <div class="label">Head Circumference</div>
        <div class="value">${latestGrowth.headCircumference} cm</div>
      </div>` : ''}
    </div>
    ${growth.length > 1 ? `
    <table>
      <thead>
        <tr><th>Date</th><th>Weight</th><th>Height</th><th>Head</th></tr>
      </thead>
      <tbody>${growthRows}</tbody>
    </table>` : ''}
  </div>` : ''}

  <!-- Vaccination Status -->
  ${vaccines.length > 0 ? `
  <div class="section">
    <div class="section-title">Vaccination Status</div>
    <table>
      <thead>
        <tr><th>Vaccine</th><th>Due Date</th><th>Given Date</th><th>Status</th></tr>
      </thead>
      <tbody>${vaccineRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Disclaimer -->
  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated by BabySaathi app based on data logged by parents/caregivers.
    It is intended as a reference tool for healthcare providers and does not constitute medical advice.
    Always consult a qualified pediatrician for medical decisions.
  </div>

</div>

<div class="footer">
  BabySaathi AI Parenting Companion &bull; Generated for ${baby.name} &bull; ${format(new Date(reportDate), 'dd MMM yyyy')}
</div>

</body>
</html>
  `;
}

export async function generateDoctorReport(data: DoctorReportData): Promise<void> {
  const html = generateHTML(data);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const fileName = `BabySaathi_Report_${data.baby.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  const destination = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.moveAsync({ from: uri, to: destination });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(destination, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${data.baby.name}'s Health Report`,
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function printDoctorReport(data: DoctorReportData): Promise<void> {
  const html = generateHTML(data);
  await Print.printAsync({ html });
}
