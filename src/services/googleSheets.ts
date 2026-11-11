import { PreachingSession, MonthProgram } from '../data/scheduleData';
import { SPANISH_DAYS_SHORT } from '../utils/dateUtils';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

export interface SheetTabInfo {
  title: string;
  sheetId: number;
}

// Extract Spreadsheet ID from standard Google Sheets URLs or raw ID
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

// List user spreadsheets from Google Drive
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=30&fields=files(id,name,modifiedTime)`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al listar archivos de Google Drive: ${response.statusText} (${errorText})`);
  }

  const data = await response.json();
  return data.files || [];
}

// Fetch spreadsheet title and sheet tabs
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; sheets: SheetTabInfo[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al leer la hoja de cálculo: ${response.statusText} (${errorText})`);
  }

  const data = await response.json();
  const sheets: SheetTabInfo[] = (data.sheets || []).map((s: any) => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
  }));

  return {
    title: data.properties?.title || 'Hoja de Cálculo',
    sheets,
  };
}

// Fetch cell values from a specific tab range
export async function getSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<string[][]> {
  const encodedRange = encodeURIComponent(`'${sheetTitle}'!A1:Z100`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al obtener los datos de la hoja: ${response.statusText} (${errorText})`);
  }

  const data = await response.json();
  return data.values || [];
}

// Parser: translates Google Sheets rows into PreachingSession objects
export function parseSheetDataToSessions(
  rawRows: string[][],
  targetMonthKey: string
): {
  sessions: PreachingSession[];
  campaignBanner?: string;
  scripture?: string;
  footnote?: string;
} {
  if (!rawRows || rawRows.length === 0) {
    return { sessions: [] };
  }

  let headerRowIndex = -1;
  let colIndexMap = {
    fecha: -1,
    dia: -1,
    hora: -1,
    lugar: -1,
    capitan: -1,
    territorios: -1,
    numTerr: -1,
    grupo: -1,
  };

  let campaignBanner: string | undefined;
  let scripture: string | undefined;
  let footnote: string | undefined;

  // Scan top rows for banners and header row
  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r].map((cell) => (cell || '').trim());
    const fullRowText = row.join(' ').toLowerCase();

    if (fullRowText.includes('campaña') || fullRowText.includes('asamblea regional')) {
      campaignBanner = row.find((c) => c.toLowerCase().includes('campaña') || c.toLowerCase().includes('asamblea')) || row.join(' ');
    }

    // Check if this row is the header row
    const isHeader =
      row.some((c) => c.toLowerCase().includes('fecha') || c.toLowerCase() === 'fec') &&
      row.some((c) => c.toLowerCase().includes('hora') || c.toLowerCase().includes('lugar') || c.toLowerCase().includes('capitan') || c.toLowerCase().includes('capitán'));

    if (isHeader) {
      headerRowIndex = r;
      row.forEach((colName, idx) => {
        const cn = colName.toLowerCase();
        if (cn.includes('fecha') || cn === 'fec') colIndexMap.fecha = idx;
        else if (cn.includes('día') || cn.includes('dia')) colIndexMap.dia = idx;
        else if (cn.includes('hora') || cn.includes('horario')) colIndexMap.hora = idx;
        else if (cn.includes('lugar') || cn.includes('reunion') || cn.includes('reunión')) colIndexMap.lugar = idx;
        else if (cn.includes('capitan') || cn.includes('capitán') || cn.includes('encargado')) colIndexMap.capitan = idx;
        else if (cn.includes('territorio') && !cn.includes('nº') && !cn.includes('n°') && !cn.includes('num')) colIndexMap.territorios = idx;
        else if (cn.includes('nº') || cn.includes('n°') || cn.includes('num') || cn.includes('nro')) colIndexMap.numTerr = idx;
        else if (cn.includes('grupo')) colIndexMap.grupo = idx;
      });
      break;
    }
  }

  // If header wasn't matched explicitly, fallback to standard column layout from the image:
  // Col 0: FECHA, Col 1: DÍA, Col 2: HORA, Col 3: LUGAR, Col 4: CAPITÁN, Col 5: TERRITORIOS, Col 6: Nº TERR, Col 7: GRUPO
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    colIndexMap = {
      fecha: 0,
      dia: 1,
      hora: 2,
      lugar: 3,
      capitan: 4,
      territorios: 5,
      numTerr: 6,
      grupo: 7,
    };
  }

  const sessions: PreachingSession[] = [];
  const [yearStr, monthStr] = targetMonthKey.split('-');
  const defaultYear = yearStr || '2026';
  const defaultMonth = monthStr || '11';

  let lastKnownDate = `${defaultYear}-${defaultMonth}-01`;
  let lastKnownDayName = 'lun';

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const fullRowText = row.join(' ').trim();
    if (!fullRowText) continue;

    // Check footer texts like Scripture or Captain footnote
    if (fullRowText.toLowerCase().includes('salmo') || fullRowText.toLowerCase().includes('mateo') || fullRowText.toLowerCase().includes('alabaré')) {
      scripture = fullRowText;
      continue;
    }
    if (fullRowText.toLowerCase().includes('reemplazante') || fullRowText.toLowerCase().includes('cuándo no pueda sacar el grupo')) {
      footnote = fullRowText;
      continue;
    }

    // Assembly banner row spanning across columns
    if (fullRowText.toLowerCase().includes('asamblea regional "felices para siempre"')) {
      // Continue parsing normal rows if this is just an inline separator
      continue;
    }

    const rawFecha = (row[colIndexMap.fecha] || '').trim();
    const rawDia = (row[colIndexMap.dia] || '').trim().toLowerCase();
    const rawHora = (row[colIndexMap.hora] || '').trim();
    const rawLugar = (row[colIndexMap.lugar] || '').trim();
    const rawCapitan = (row[colIndexMap.capitan] || '').trim();
    const rawTerritorio = (row[colIndexMap.territorios] || '').trim();
    const rawNumTerr = (row[colIndexMap.numTerr] || '').trim();
    const rawGrupo = (row[colIndexMap.grupo] || '').trim() || 'Gral.';

    // If there is no meeting place and no captain, skip row
    if (!rawLugar && !rawCapitan && !rawTerritorio) continue;

    // Resolve date
    let dateStr = lastKnownDate;
    if (rawFecha) {
      if (rawFecha.includes('-')) {
        dateStr = rawFecha;
      } else if (rawFecha.includes('/')) {
        const parts = rawFecha.split('/');
        if (parts.length === 3) {
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else {
        // Just the day number e.g. "02", "2", "14"
        const dayNumber = parseInt(rawFecha.replace(/\D/g, ''), 10);
        if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
          dateStr = `${defaultYear}-${defaultMonth}-${String(dayNumber).padStart(2, '0')}`;
        }
      }
      lastKnownDate = dateStr;
    }

    // Resolve day name
    let dayName = rawDia || lastKnownDayName;
    if (!rawDia && dateStr) {
      const d = new Date(dateStr + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        dayName = SPANISH_DAYS_SHORT[d.getDay()];
      }
    }
    if (rawDia) {
      lastKnownDayName = rawDia;
    }

    // Detect session type
    let type: PreachingSession['type'] = 'presencial';
    const lowerLugar = rawLugar.toLowerCase();
    const lowerTerr = rawTerritorio.toLowerCase();
    const lowerNum = rawNumTerr.toLowerCase();

    if (lowerLugar.includes('zoom') || lowerTerr.includes('zoom') || lowerNum.includes('zoom')) {
      type = 'zoom';
    } else if (lowerLugar.includes('plaza') || lowerTerr.includes('pública') || lowerTerr.includes('publica') || lowerTerr.includes('cesfam')) {
      type = 'publica';
    } else if (lowerLugar.includes('asamblea') || lowerTerr.includes('asamblea')) {
      type = 'asamblea';
    } else if (lowerTerr.includes('aseo') || lowerNum.includes('aseo')) {
      type = 'aseo';
    } else if (lowerTerr.includes('censo') || lowerNum.includes('censo')) {
      type = 'censo';
    }

    sessions.push({
      id: `sheets-${Date.now()}-${r}`,
      date: dateStr,
      dayName: dayName || 'lun',
      time: rawHora || '10:00',
      meetingPlace: rawLugar || 'Por definir',
      captain: rawCapitan || 'Por definir',
      territory: rawTerritorio || 'Por definir',
      territoryNumber: rawNumTerr || 'Gral.',
      group: rawGrupo || 'Gral.',
      type,
    });
  }

  return {
    sessions,
    campaignBanner,
    scripture,
    footnote,
  };
}
