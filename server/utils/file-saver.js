import fs from 'fs/promises';
import path from 'path';

export async function saveData(dataDir, filename, data) {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const filepath = path.join(dataDir, filename);

    // Calculate date range
    const dates = data.map(row => row.date || row.year).filter(Boolean);
    let dateRange = 'N/A';
    if (dates.length > 0) {
      const sortedDates = dates.sort();
      const minDate = sortedDates[0];
      const maxDate = sortedDates[sortedDates.length - 1];
      dateRange = `${minDate} to ${maxDate}`;
    }

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.error(`Saved ${data.length} records to ${filename} (Date Range: ${dateRange})`);
  } catch (error) {
    console.error(`Error saving ${filename}:`, error.message);
  }
}
