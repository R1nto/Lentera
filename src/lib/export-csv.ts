/** Export local in-memory table rows as CSV, with formula-injection protection. */
export function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  const escapeCell = (value: string | number | null | undefined) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@\-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const data = '\uFEFF' + rows.map(row => row.map(escapeCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
