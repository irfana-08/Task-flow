/**
 * excel-db.js - Excel Database Engine for TaskFlow
 * Provides bidirectional sync between TaskFlow and Microsoft Excel (.xlsx/.xls/.csv).
 * Supports multi-sheet export (All Tasks, Completed Tasks, Summary Stats),
 * intelligent column mapping on import, and File System Access API integration.
 */

class ExcelDatabaseManager {
  constructor() {
    this.isSupported = typeof window.XLSX !== 'undefined';
  }

  /**
   * Check if SheetJS library is loaded
   */
  checkLibrary() {
    if (typeof window.XLSX === 'undefined') {
      throw new Error('SheetJS library (XLSX) is not loaded. Please verify your connection.');
    }
    return true;
  }

  /**
   * Helper to format human-readable dates for Excel cells
   */
  formatDateForExcel(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Automatically calculate column widths for optimal display in Excel
   */
  autoFitColumns(ws, data) {
    if (!data || !data.length) return;
    const colKeys = Object.keys(data[0]);
    ws['!cols'] = colKeys.map((key) => {
      let maxLen = key.length;
      data.forEach((row) => {
        const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 12), 48) };
    });
  }

  /**
   * Export all tasks to a structured, multi-sheet Excel workbook (.xlsx)
   */
  exportDatabase(tasks, options = {}) {
    this.checkLibrary();
    const { currentUser = null, filename = null } = options;

    const now = new Date();
    const timestampStr = now.toISOString().slice(0, 10);
    const targetFilename = filename || `TaskFlow_Database_${timestampStr}.xlsx`;

    // 1. Prepare All Tasks Sheet
    const rowsAll = tasks.map((t, idx) => {
      const isDone = Boolean(t.completed);
      const dl = new Date(t.deadline);
      const diffDays = !isNaN(dl.getTime()) ? Math.round((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      let urgencyLabel = 'Upcoming (3-10 days)';
      if (isDone) urgencyLabel = 'Completed';
      else if (diffDays < 3) urgencyLabel = 'Urgent (< 3 days)';
      else if (diffDays > 10) urgencyLabel = 'Later (> 10 days)';

      return {
        '#': idx + 1,
        'Task ID': t.id || `task_${idx + 1}`,
        'Title': t.title || 'Untitled Task',
        'Status': isDone ? 'Completed' : 'Active',
        'Urgency Level': urgencyLabel,
        'Deadline': this.formatDateForExcel(t.deadline),
        'Deadline (ISO)': t.deadline || '',
        'Created At': this.formatDateForExcel(t.createdAt),
        'Completed At': t.completedAt ? this.formatDateForExcel(t.completedAt) : (isDone ? 'Completed' : 'Pending'),
        'Notes / Details': t.notes || ''
      };
    });

    // 2. Prepare Completed Tasks Archive Sheet
    const completedTasks = tasks.filter((t) => t.completed);
    const rowsCompleted = completedTasks.map((t, idx) => {
      const dl = new Date(t.deadline);
      const compDate = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
      let adherence = 'Completed';
      if (!isNaN(dl.getTime()) && !isNaN(compDate.getTime())) {
        adherence = compDate.getTime() <= dl.getTime() ? 'Completed On Time' : 'Completed Past Deadline';
      }

      return {
        '#': idx + 1,
        'Task ID': t.id || `task_${idx + 1}`,
        'Title': t.title || 'Untitled Task',
        'Status': 'Completed',
        'Completed Date': this.formatDateForExcel(t.completedAt || t.createdAt),
        'Original Deadline': this.formatDateForExcel(t.deadline),
        'Deadline Adherence': adherence,
        'Created Date': this.formatDateForExcel(t.createdAt),
        'Notes / Details': t.notes || ''
      };
    });

    // 3. Prepare Database Metadata / Overview Sheet
    const urgentCount = tasks.filter((t) => {
      if (t.completed) return false;
      const d = new Date(t.deadline);
      return !isNaN(d.getTime()) && (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 3;
    }).length;

    const mediumCount = tasks.filter((t) => {
      if (t.completed) return false;
      const d = new Date(t.deadline);
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return !isNaN(d.getTime()) && diff >= 3 && diff <= 10;
    }).length;

    const laterCount = tasks.filter((t) => {
      if (t.completed) return false;
      const d = new Date(t.deadline);
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return !isNaN(d.getTime()) && diff > 10;
    }).length;

    const rowsSummary = [
      { 'Metric': 'Database System', 'Value': 'TaskFlow Excel Database' },
      { 'Metric': 'Export Timestamp', 'Value': this.formatDateForExcel(now) },
      { 'Metric': 'Account / User', 'Value': currentUser ? `${currentUser.displayName} (${currentUser.email})` : 'Local Guest Account' },
      { 'Metric': 'Total Tasks in Database', 'Value': tasks.length },
      { 'Metric': 'Active (Pending) Tasks', 'Value': tasks.length - completedTasks.length },
      { 'Metric': 'Completed Tasks Archive', 'Value': completedTasks.length },
      { 'Metric': '🚨 Urgent Tasks (< 3 Days)', 'Value': urgentCount },
      { 'Metric': '📅 Upcoming Tasks (3-10 Days)', 'Value': mediumCount },
      { 'Metric': '⏳ Later Tasks (> 10 Days)', 'Value': laterCount }
    ];

    // Build Workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: All Tasks
    const wsAll = XLSX.utils.json_to_sheet(rowsAll.length ? rowsAll : [{ 'Message': 'No tasks in database' }]);
    if (rowsAll.length) this.autoFitColumns(wsAll, rowsAll);
    XLSX.utils.book_append_sheet(wb, wsAll, 'All Tasks');

    // Sheet 2: Completed Archive
    const wsCompleted = XLSX.utils.json_to_sheet(rowsCompleted.length ? rowsCompleted : [{ 'Message': 'No completed tasks archived yet' }]);
    if (rowsCompleted.length) this.autoFitColumns(wsCompleted, rowsCompleted);
    XLSX.utils.book_append_sheet(wb, wsCompleted, 'Completed Tasks');

    // Sheet 3: Database Summary
    const wsSummary = XLSX.utils.json_to_sheet(rowsSummary);
    this.autoFitColumns(wsSummary, rowsSummary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Database Overview');

    // Trigger download
    XLSX.writeFile(wb, targetFilename);
    return {
      success: true,
      filename: targetFilename,
      totalCount: tasks.length,
      completedCount: completedTasks.length
    };
  }

  /**
   * Export only completed tasks to a dedicated Excel archive file
   */
  exportCompletedArchive(completedTasks) {
    this.checkLibrary();
    const now = new Date();
    const timestampStr = now.toISOString().slice(0, 10);
    const targetFilename = `TaskFlow_Completed_Archive_${timestampStr}.xlsx`;

    const rows = completedTasks.map((t, idx) => ({
      '#': idx + 1,
      'Task ID': t.id || `task_${idx + 1}`,
      'Title': t.title || 'Untitled Task',
      'Completed Date': this.formatDateForExcel(t.completedAt || t.createdAt),
      'Original Deadline': this.formatDateForExcel(t.deadline),
      'Created Date': this.formatDateForExcel(t.createdAt),
      'Notes / Details': t.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Message': 'No completed tasks found' }]);
    if (rows.length) this.autoFitColumns(ws, rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Completed Archive');

    XLSX.writeFile(wb, targetFilename);
    return { success: true, filename: targetFilename, count: completedTasks.length };
  }

  /**
   * Convert various Excel date representations into ISO string
   */
  parseExcelDate(val) {
    if (!val) return null;

    // JavaScript Date
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString();
    }

    // Excel serial number (days since Dec 30, 1899)
    if (typeof val === 'number') {
      try {
        const utcDays = Math.floor(val - 25569);
        const utcSeconds = utcDays * 86400;
        const fractionalDay = val - Math.floor(val);
        const fractionalSeconds = Math.round(fractionalDay * 86400);
        const d = new Date((utcSeconds + fractionalSeconds) * 1000);
        if (!isNaN(d.getTime())) {
          return d.toISOString();
        }
      } catch (e) {
        // Fallback
      }
    }

    // String date
    if (typeof val === 'string') {
      const trimmed = val.trim();
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }

    return null;
  }

  /**
   * Intelligently find value from row using flexible column name synonyms
   */
  findColumnValue(row, possibleNames) {
    const rowKeys = Object.keys(row);
    for (const name of possibleNames) {
      // 1. Exact match
      if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') {
        return row[name];
      }
      // 2. Case-insensitive & normalized match
      const lower = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const foundKey = rowKeys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === lower);
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
        return row[foundKey];
      }
    }
    return null;
  }

  /**
   * Read and parse an Excel spreadsheet (.xlsx, .xls, .csv) into TaskFlow task objects
   */
  async parseExcelFile(file) {
    this.checkLibrary();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            dateNF: 'yyyy-mm-dd hh:mm:ss'
          });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('The selected Excel file contains no worksheets.');
          }

          // Prefer sheet named "All Tasks" or "Tasks"
          let targetSheetName = workbook.SheetNames[0];
          const preferred = workbook.SheetNames.find((s) => {
            const l = s.toLowerCase();
            return l.includes('all task') || l === 'tasks' || l.includes('to-do') || l.includes('todo');
          });
          if (preferred) targetSheetName = preferred;

          const worksheet = workbook.Sheets[targetSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

          if (!rawRows || rawRows.length === 0) {
            throw new Error(`Worksheet "${targetSheetName}" does not contain any task data rows.`);
          }

          const parsedTasks = [];
          const now = new Date();

          rawRows.forEach((row, idx) => {
            // Find Title
            const titleVal = this.findColumnValue(row, ['Title', 'Task', 'Task Title', 'Name', 'Work', 'Item', 'Summary']);
            if (!titleVal) return; // Skip empty rows

            // Find ID
            const idVal = this.findColumnValue(row, ['Task ID', 'ID', 'TaskId', 'Key']) || 
                          `task_xl_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;

            // Find Deadline
            const deadlineRaw = this.findColumnValue(row, ['Deadline (ISO)', 'Deadline', 'Due Date', 'Due', 'Target Date', 'Finish Date']);
            let deadlineISO = this.parseExcelDate(deadlineRaw);
            if (!deadlineISO) {
              // Default to 2 days from now if missing/unparseable
              const defaultDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
              defaultDate.setHours(17, 0, 0, 0);
              deadlineISO = defaultDate.toISOString();
            }

            // Find Notes
            const notesVal = this.findColumnValue(row, ['Notes / Details', 'Notes', 'Note', 'Details', 'Description', 'Comments']) || '';

            // Find Status / Completed
            const statusVal = this.findColumnValue(row, ['Status', 'Completed', 'Done', 'Finished', 'State']);
            let isCompleted = false;
            if (statusVal) {
              const str = String(statusVal).trim().toLowerCase();
              if (str === 'completed' || str === 'done' || str === 'true' || str === 'yes' || str === '1') {
                isCompleted = true;
              }
            }

            // Find Created At
            const createdRaw = this.findColumnValue(row, ['Created At', 'Created Date', 'Date Created', 'Created']);
            const createdISO = this.parseExcelDate(createdRaw) || new Date(now.getTime() - idx * 60000).toISOString();

            // Find Completed At
            const completedRaw = this.findColumnValue(row, ['Completed At', 'Completed Date', 'Date Completed']);
            const completedISO = isCompleted ? (this.parseExcelDate(completedRaw) || new Date().toISOString()) : null;

            parsedTasks.push({
              id: String(idVal),
              title: String(titleVal).trim(),
              deadline: deadlineISO,
              notes: String(notesVal).trim(),
              createdAt: createdISO,
              completed: isCompleted,
              completedAt: completedISO
            });
          });

          if (parsedTasks.length === 0) {
            throw new Error('No valid task rows were recognized. Please ensure the Excel file has a "Title" column.');
          }

          resolve({
            sheetName: targetSheetName,
            tasks: parsedTasks,
            totalRows: parsedTasks.length
          });
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read the file.'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Save directly to a local file using the File System Access API if supported
   */
  async saveToLocalDisk(tasks, options = {}) {
    if (!window.showSaveFilePicker) {
      // Fallback to standard download
      return this.exportDatabase(tasks, options);
    }

    this.checkLibrary();
    try {
      const now = new Date();
      const defaultName = `TaskFlow_Database_${now.toISOString().slice(0, 10)}.xlsx`;

      const fileHandle = await window.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          {
            description: 'Microsoft Excel Spreadsheet (*.xlsx)',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
            }
          }
        ]
      });

      // Generate workbook as array buffer
      const { currentUser = null } = options;
      // Use existing export logic to create workbook
      const rowsAll = tasks.map((t, idx) => ({
        '#': idx + 1,
        'Task ID': t.id || `task_${idx + 1}`,
        'Title': t.title || 'Untitled Task',
        'Status': t.completed ? 'Completed' : 'Active',
        'Deadline': this.formatDateForExcel(t.deadline),
        'Deadline (ISO)': t.deadline || '',
        'Created At': this.formatDateForExcel(t.createdAt),
        'Completed At': t.completedAt ? this.formatDateForExcel(t.completedAt) : (t.completed ? 'Completed' : 'Pending'),
        'Notes / Details': t.notes || ''
      }));

      const completedTasks = tasks.filter((t) => t.completed);
      const rowsCompleted = completedTasks.map((t, idx) => ({
        '#': idx + 1,
        'Task ID': t.id || `task_${idx + 1}`,
        'Title': t.title || 'Untitled Task',
        'Status': 'Completed',
        'Completed Date': this.formatDateForExcel(t.completedAt || t.createdAt),
        'Original Deadline': this.formatDateForExcel(t.deadline),
        'Created Date': this.formatDateForExcel(t.createdAt),
        'Notes / Details': t.notes || ''
      }));

      const rowsSummary = [
        { 'Metric': 'Database System', 'Value': 'TaskFlow Excel Database' },
        { 'Metric': 'Saved Timestamp', 'Value': this.formatDateForExcel(now) },
        { 'Metric': 'Account / User', 'Value': currentUser ? `${currentUser.displayName} (${currentUser.email})` : 'Local Guest Account' },
        { 'Metric': 'Total Tasks', 'Value': tasks.length },
        { 'Metric': 'Completed Tasks', 'Value': completedTasks.length }
      ];

      const wb = XLSX.utils.book_new();
      const wsAll = XLSX.utils.json_to_sheet(rowsAll.length ? rowsAll : [{ 'Message': 'No tasks' }]);
      if (rowsAll.length) this.autoFitColumns(wsAll, rowsAll);
      XLSX.utils.book_append_sheet(wb, wsAll, 'All Tasks');

      if (rowsCompleted.length) {
        const wsComp = XLSX.utils.json_to_sheet(rowsCompleted);
        this.autoFitColumns(wsComp, rowsCompleted);
        XLSX.utils.book_append_sheet(wb, wsComp, 'Completed Tasks');
      }

      const wsSummary = XLSX.utils.json_to_sheet(rowsSummary);
      this.autoFitColumns(wsSummary, rowsSummary);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Database Overview');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(wbout);
      await writableStream.close();

      return { success: true, filename: fileHandle.name, directSave: true };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, aborted: true };
      }
      throw err;
    }
  }
}

// Global instance
window.excelDB = new ExcelDatabaseManager();
